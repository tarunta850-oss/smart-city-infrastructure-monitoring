import json
import logging
from io import BytesIO
from pathlib import Path
from typing import Dict, Optional, Tuple

import httpx
import numpy as np
from PIL import Image

try:
    import cv2
    HAS_OPENCV = True
except ImportError:
    HAS_OPENCV = False

from ml_models import road_model_suite
from grok_analysis import (
    analyze_with_grok,
    query_nearby_pois,
    query_traffic_density,
    location_score_from_pois,
)

logger = logging.getLogger("backend")


# ============================================================
# AHP WEIGHTS
# ============================================================
# Image is now the strongest factor.
W_VISUAL = 0.65
W_LOCATION = 0.10
W_SENTIMENT = 0.15
W_SOCIAL = 0.10


# ============================================================
# YOLO CLASS SCORES
# ============================================================
YOLO_CLASS_SCORES = {
    "small_pothole": 0.45,
    "medium_pothole": 0.72,
    "severe_pothole": 0.95,
}


# ============================================================
# CACHE
# ============================================================
_GEO_CACHE: Dict[str, Tuple[float, str]] = {}


# ============================================================
# BASIC HELPERS
# ============================================================
def _clip01(value: float) -> float:
    return max(0.0, min(1.0, float(value)))


def _severity_level_from_score(score: float) -> str:
    if score >= 75.0:
        return "critical"

    if score >= 50.0:
        return "high"

    if score >= 25.0:
        return "medium"

    return "low"


# ============================================================
# LOAD IMAGE
# ============================================================
async def _load_image_bytes(
    image_url: Optional[str],
    image_bytes: Optional[bytes] = None,
) -> Optional[bytes]:

    """
    Load image from:
    1. Uploaded memory
    2. Local uploads directory
    3. Remote HTTP URL
    """

    # 1. Direct uploaded bytes
    if image_bytes and len(image_bytes) > 0:
        return image_bytes

    if not image_url:
        return None

    # 2. Local uploads
    clean_path = (
        image_url
        .replace("/uploads/", "")
        .replace("uploads/", "")
    )

    file_path = Path("uploads") / clean_path

    if file_path.exists() and file_path.is_file():

        try:
            return file_path.read_bytes()

        except Exception as exc:
            logger.warning(
                "Failed to read local image: %s",
                exc,
            )

    # 3. Remote URL
    if image_url.startswith("http://") or image_url.startswith("https://"):

        try:

            async with httpx.AsyncClient(timeout=8.0) as client:

                response = await client.get(image_url)

                if response.status_code == 200:
                    return response.content

        except Exception as exc:

            logger.warning(
                "Failed to download image %s: %s",
                image_url,
                exc,
            )

    return None


# ============================================================
# OPENCV ROAD ANALYSIS
# ============================================================
def _opencv_road_analysis(
    image_bytes: bytes,
) -> Tuple[float, float, dict]:

    """
    Computer vision road analysis.

    Returns:

        visual_score : 0.0 - 1.0
        spread_score : 0.0 - 1.0
        metadata     : diagnostic information
    """

    if not HAS_OPENCV:
        return _pil_fallback_analysis(image_bytes)

    try:

        # ----------------------------------------------------
        # Decode image
        # ----------------------------------------------------
        nparr = np.frombuffer(
            image_bytes,
            np.uint8,
        )

        img = cv2.imdecode(
            nparr,
            cv2.IMREAD_COLOR,
        )

        if img is None:
            return _pil_fallback_analysis(image_bytes)

        # ----------------------------------------------------
        # Resize
        # ----------------------------------------------------
        h, w = img.shape[:2]

        max_dim = max(h, w)

        if max_dim > 720:

            scale = 720.0 / max_dim

            img = cv2.resize(
                img,
                (
                    int(w * scale),
                    int(h * scale),
                ),
                interpolation=cv2.INTER_AREA,
            )

        h, w = img.shape[:2]

        total_pixels = max(
            h * w,
            1,
        )

        # ----------------------------------------------------
        # Grayscale
        # ----------------------------------------------------
        gray = cv2.cvtColor(
            img,
            cv2.COLOR_BGR2GRAY,
        )

        blurred = cv2.GaussianBlur(
            gray,
            (5, 5),
            0,
        )

        # ====================================================
        # 1. CAVITY / DARK REGION DETECTION
        # ====================================================

        adaptive_thresh = cv2.adaptiveThreshold(
            blurred,
            255,
            cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv2.THRESH_BINARY_INV,
            25,
            7,
        )

        kernel_close = cv2.getStructuringElement(
            cv2.MORPH_ELLIPSE,
            (9, 9),
        )

        kernel_open = cv2.getStructuringElement(
            cv2.MORPH_ELLIPSE,
            (5, 5),
        )

        morph_cavities = cv2.morphologyEx(
            adaptive_thresh,
            cv2.MORPH_CLOSE,
            kernel_close,
        )

        morph_cavities = cv2.morphologyEx(
            morph_cavities,
            cv2.MORPH_OPEN,
            kernel_open,
        )

        contours, _ = cv2.findContours(
            morph_cavities,
            cv2.RETR_EXTERNAL,
            cv2.CHAIN_APPROX_SIMPLE,
        )

        # IMPORTANT:
        # Higher threshold than previous version.
        # Prevents tiny road texture from being treated as potholes.
        min_pothole_area = total_pixels * 0.003

        pothole_contours = [
            c
            for c in contours
            if cv2.contourArea(c) >= min_pothole_area
        ]

        total_cavity_area = sum(
            cv2.contourArea(c)
            for c in pothole_contours
        )

        cavity_area_ratio = float(
            total_cavity_area / total_pixels
        )

        pothole_count = len(
            pothole_contours
        )

        max_single_cavity = 0.0

        if pothole_contours:

            max_single_cavity = float(
                max(
                    cv2.contourArea(c)
                    for c in pothole_contours
                )
                / total_pixels
            )

        # ====================================================
        # 2. EDGE / CRACK ANALYSIS
        # ====================================================

        edges = cv2.Canny(
            blurred,
            60,
            160,
        )

        edge_pixel_count = cv2.countNonZero(
            edges
        )

        edge_density = float(
            edge_pixel_count / total_pixels
        )

        # ====================================================
        # 3. TEXTURE ANALYSIS
        # ====================================================

        laplacian_var = float(
            cv2.Laplacian(
                gray,
                cv2.CV_64F,
            ).var()
        )

        norm_laplacian = min(
            1.0,
            laplacian_var / 800.0,
        )

        # ====================================================
        # 4. HSV ANALYSIS
        # ====================================================

        hsv = cv2.cvtColor(
            img,
            cv2.COLOR_BGR2HSV,
        )

        sat = hsv[:, :, 1]

        val = hsv[:, :, 2]

        specular_mask = (
            (val > 195)
            & (sat < 110)
            & (edges > 0)
        )

        specular_ratio = float(
            np.count_nonzero(specular_mask)
            / total_pixels
        )

        # ====================================================
        # 5. DEPTH / SHADOW CONTRAST
        # ====================================================

        depth_contrast = 0.0

        if pothole_contours:

            mask_cavity = np.zeros(
                gray.shape,
                dtype=np.uint8,
            )

            cv2.drawContours(
                mask_cavity,
                pothole_contours,
                -1,
                255,
                thickness=cv2.FILLED,
            )

            mean_cavity_val = cv2.mean(
                gray,
                mask=mask_cavity,
            )[0]

            mask_road = cv2.bitwise_not(
                mask_cavity
            )

            mean_road_val = cv2.mean(
                gray,
                mask=mask_road,
            )[0]

            if mean_road_val > 0:

                depth_contrast = max(
                    0.0,
                    (
                        mean_road_val
                        - mean_cavity_val
                    )
                    / mean_road_val,
                )

        # ====================================================
        # 6. INDIVIDUAL SCORES
        # ====================================================

        cavity_score = min(
            1.0,
            (
                cavity_area_ratio * 4.0
            )
            + (
                max_single_cavity * 3.0
            )
            + (
                min(pothole_count, 5)
                * 0.04
            ),
        )

        fracture_score = min(
            1.0,
            (
                edge_density * 3.0
            )
            + (
                norm_laplacian * 0.25
            ),
        )

        water_score = min(
            1.0,
            specular_ratio * 15.0,
        )

        depth_score = min(
            1.0,
            depth_contrast * 1.4,
        )

        # ====================================================
        # 7. COMPOSITE DAMAGE
        # ====================================================

        composite_defect = (
            0.50 * cavity_score
            + 0.25 * fracture_score
            + 0.10 * water_score
            + 0.15 * depth_score
        )

        # ====================================================
        # 8. GOOD ROAD DETECTION
        # ====================================================

        # A road is considered good when:
        #
        # - No significant cavity
        # - No large pothole
        # - Low edge density
        # - Low depth contrast
        # - Low overall defect score

        good_road = (
            cavity_area_ratio < 0.008
            and max_single_cavity < 0.005
            and edge_density < 0.055
            and depth_contrast < 0.12
            and composite_defect < 0.12
        )

        if good_road:

            logger.info(
                "OpenCV classified image as GOOD ROAD"
            )

            return (
                0.05,
                0.02,
                {
                    "source": "opencv-vision-engine",

                    "damage_label": "good_road",

                    "pothole_count": 0,

                    "cavity_area_ratio": round(
                        cavity_area_ratio,
                        4,
                    ),

                    "max_single_cavity_ratio": round(
                        max_single_cavity,
                        4,
                    ),

                    "edge_density": round(
                        edge_density,
                        4,
                    ),

                    "laplacian_texture_variance": round(
                        laplacian_var,
                        2,
                    ),

                    "specular_water_ratio": round(
                        specular_ratio,
                        4,
                    ),

                    "depth_contrast": round(
                        depth_contrast,
                        3,
                    ),

                    "composite_defect": round(
                        composite_defect,
                        3,
                    ),
                },
            )

        # ====================================================
        # 9. DAMAGE SCORE
        # ====================================================

        if (
            cavity_area_ratio > 0.04
            or max_single_cavity > 0.03
            or composite_defect > 0.38
        ):

            visual_score = (
                0.68
                + 0.28
                * min(
                    1.0,
                    composite_defect * 1.3,
                )
            )

        elif (
            cavity_area_ratio > 0.012
            or edge_density > 0.07
            or composite_defect > 0.18
        ):

            visual_score = (
                0.48
                + 0.28
                * min(
                    1.0,
                    composite_defect * 1.2,
                )
            )

        else:

            visual_score = (
                0.15
                + 0.30
                * min(
                    1.0,
                    composite_defect * 1.1,
                )
            )

        # ====================================================
        # 10. SPREAD
        # ====================================================

        spread_score = min(
            1.0,
            (
                cavity_area_ratio * 3.0
            )
            + (
                edge_density * 1.0
            ),
        )

        # ====================================================
        # 11. LABEL
        # ====================================================

        if visual_score >= 0.75:

            damage_label = "severe_pothole"

        elif visual_score >= 0.50:

            damage_label = "medium_pothole"

        elif visual_score >= 0.30:

            damage_label = "minor_surface_damage"

        else:

            damage_label = "good_road"

        # ====================================================
        # 12. FINAL SAFETY
        # ====================================================

        if damage_label == "good_road":

            visual_score = min(
                visual_score,
                0.15,
            )

            spread_score = min(
                spread_score,
                0.10,
            )

        return (
            round(
                _clip01(visual_score),
                3,
            ),

            round(
                _clip01(spread_score),
                3,
            ),

            {
                "source": "opencv-vision-engine",

                "damage_label": damage_label,

                "pothole_count": pothole_count,

                "cavity_area_ratio": round(
                    cavity_area_ratio,
                    4,
                ),

                "max_single_cavity_ratio": round(
                    max_single_cavity,
                    4,
                ),

                "edge_density": round(
                    edge_density,
                    4,
                ),

                "laplacian_texture_variance": round(
                    laplacian_var,
                    2,
                ),

                "specular_water_ratio": round(
                    specular_ratio,
                    4,
                ),

                "depth_contrast": round(
                    depth_contrast,
                    3,
                ),

                "composite_defect": round(
                    composite_defect,
                    3,
                ),
            },
        )

    except Exception as exc:

        logger.warning(
            "OpenCV analysis failed: %s",
            exc,
        )

        return _pil_fallback_analysis(
            image_bytes
        )


# ============================================================
# PIL FALLBACK
# ============================================================
def _pil_fallback_analysis(
    image_bytes: bytes,
) -> Tuple[float, float, dict]:

    try:

        img = Image.open(
            BytesIO(image_bytes)
        ).convert("RGB")

        w, h = img.size

        total_pixels = max(
            w * h,
            1,
        )

        gray = img.convert("L")

        arr_gray = np.array(
            gray,
            dtype=np.float32,
        )

        std_val = float(
            np.std(arr_gray)
        )

        median_val = float(
            np.median(arr_gray)
        )

        dark_threshold = max(
            20.0,
            median_val - 0.75 * std_val,
        )

        dark_mask = (
            arr_gray < dark_threshold
        )

        dark_ratio = float(
            np.count_nonzero(dark_mask)
            / total_pixels
        )

        from PIL import ImageFilter

        edges = gray.filter(
            ImageFilter.FIND_EDGES
        )

        arr_edges = np.array(
            edges,
            dtype=np.float32,
        )

        edge_density = float(
            np.count_nonzero(
                arr_edges > 35
            )
            / total_pixels
        )

        # Strong good-road fallback
        if (
            dark_ratio < 0.025
            and edge_density < 0.05
        ):

            return (
                0.05,
                0.02,
                {
                    "source": "pil-vision-fallback",
                    "damage_label": "good_road",
                    "dark_ratio": round(
                        dark_ratio,
                        4,
                    ),
                    "edge_density": round(
                        edge_density,
                        4,
                    ),
                },
            )

        cavity_score = min(
            1.0,
            dark_ratio * 4.0,
        )

        fracture_score = min(
            1.0,
            edge_density * 3.0,
        )

        defect = (
            0.60 * cavity_score
            + 0.40 * fracture_score
        )

        visual_score = min(
            1.0,
            0.15 + defect * 0.70,
        )

        spread_score = min(
            1.0,
            dark_ratio * 2.5,
        )

        if visual_score >= 0.75:

            damage_label = "severe_pothole"

        elif visual_score >= 0.50:

            damage_label = "medium_pothole"

        elif visual_score >= 0.30:

            damage_label = "minor_surface_damage"

        else:

            damage_label = "good_road"

        return (
            round(
                _clip01(visual_score),
                3,
            ),

            round(
                _clip01(spread_score),
                3,
            ),

            {
                "source": "pil-vision-fallback",
                "damage_label": damage_label,
                "dark_ratio": round(
                    dark_ratio,
                    4,
                ),
                "edge_density": round(
                    edge_density,
                    4,
                ),
            },
        )

    except Exception as exc:

        logger.warning(
            "PIL fallback failed: %s",
            exc,
        )

        # Do NOT return 65% by default.
        # Unknown image should not automatically become severe.
        return (
            0.10,
            0.05,
            {
                "source": "cv-default",
                "damage_label": "unknown",
                "error": str(exc),
            },
        )


# ============================================================
# SENTIMENT
# ============================================================
def _sentiment_score(
    description: str,
    citizen_severity: str = "medium",
) -> float:

    text = (
        description or ""
    ).lower()

    critical_keywords = {
        "emergency",
        "urgent",
        "critical",
        "danger",
        "dangerous",
        "hazard",
        "hazardous",
        "accident",
        "injury",
        "injured",
        "collapse",
        "collapsed",
        "sinkhole",
        "crater",
        "massive",
        "huge",
        "fatal",
        "unpassable",
        "blocked",
        "trap",
        "death trap",
        "severe",
        "extreme",
        "waterlogged",
        "water logged",
        "flooded",
        "flooding",
        "tire damage",
        "bike slip",
        "broken road",
        "deep pothole",
        "deep crater",
        "road collapse",
        "heavy traffic risk",
        "school zone danger",
        "major hazard",
    }

    high_keywords = {
        "large",
        "deep",
        "broken",
        "bad road",
        "damage",
        "damaged",
        "rough",
        "bump",
        "hole",
        "pothole",
        "potholes",
        "cracks",
        "cracked",
        "disrepair",
        "water",
        "unsafe",
        "risk",
        "trouble",
        "slow down",
        "problem",
        "uneven road",
        "cavity",
        "deteriorated",
        "asphalt cracked",
    }

    medium_keywords = {
        "medium",
        "moderate",
        "surface",
        "uneven",
        "asphalt",
        "needs repair",
        "patch",
        "rough patch",
        "small hole",
    }

    citizen_base = {
        "critical": 0.90,
        "high": 0.74,
        "medium": 0.50,
        "low": 0.28,
    }.get(
        (
            citizen_severity or ""
        ).lower(),
        0.50,
    )

    if any(
        keyword in text
        for keyword in critical_keywords
    ):

        keyword_base = 0.92

    elif any(
        keyword in text
        for keyword in high_keywords
    ):

        keyword_base = 0.75

    elif any(
        keyword in text
        for keyword in medium_keywords
    ):

        keyword_base = 0.52

    else:

        keyword_base = citizen_base

    crit_count = sum(
        1
        for keyword in critical_keywords
        if keyword in text
    )

    high_count = sum(
        1
        for keyword in high_keywords
        if keyword in text
    )

    keyword_boost = min(
        0.18,
        (
            crit_count * 0.06
        )
        + (
            high_count * 0.03
        ),
    )

    score = (
        max(
            citizen_base,
            keyword_base,
        )
        + keyword_boost
    )

    return min(
        1.0,
        round(score, 3),
    )


# ============================================================
# VISUAL DAMAGE SCORE
# ============================================================
def _visual_damage_score(
    image_bytes: bytes,
) -> Tuple[float, float, dict]:

    """
    YOLO + OpenCV.

    IMPORTANT:
    Weak YOLO detections are rejected.
    OpenCV is used when YOLO confidence is insufficient.
    """

    try:

        detector_result = (
            road_model_suite.detect_damage(
                image_bytes
            )
        )

    except Exception as exc:

        logger.warning(
            "YOLO detector failed: %s",
            exc,
        )

        detector_result = None

    # ========================================================
    # YOLO RESULT
    # ========================================================

    if (
        detector_result is not None
        and detector_result.count > 0
    ):

        valid_boxes = []

        for box in detector_result.boxes:

            confidence = float(
                box.get(
                    "confidence",
                    0.0,
                )
            )

            area_ratio = float(
                box.get(
                    "area_ratio",
                    0.0,
                )
            )

            label = str(
                box.get(
                    "label",
                    "",
                )
            ).lower()

            # Reject weak detections
            if confidence < 0.65:
                continue

            # Reject extremely tiny detections
            if area_ratio < 0.005:
                continue

            # Only known pothole classes
            if label not in YOLO_CLASS_SCORES:
                continue

            valid_boxes.append(
                box
            )

        # ----------------------------------------------------
        # No reliable YOLO detection
        # ----------------------------------------------------
        if not valid_boxes:

            logger.info(
                "YOLO detections rejected; using OpenCV."
            )

            return _opencv_road_analysis(
                image_bytes
            )

        # ----------------------------------------------------
        # Reliable YOLO detection
        # ----------------------------------------------------
        visual_score = 0.0

        for box in valid_boxes:

            label = str(
                box.get(
                    "label",
                    "",
                )
            ).lower()

            area = float(
                box.get(
                    "area_ratio",
                    0.0,
                )
            )

            confidence = float(
                box.get(
                    "confidence",
                    0.0,
                )
            )

            base_score = YOLO_CLASS_SCORES.get(
                label,
                0.40,
            )

            # Confidence modifies score
            box_score = (
                base_score
                * (
                    0.70
                    + 0.30 * confidence
                )
            )

            # Very small pothole should not become critical
            if area < 0.01:
                box_score = min(
                    box_score,
                    0.50,
                )

            visual_score = max(
                visual_score,
                box_score,
            )

        max_area_ratio = max(
            float(
                box.get(
                    "area_ratio",
                    0.0,
                )
            )
            for box in valid_boxes
        )

        spread_score = _clip01(
            max_area_ratio * 3.0
        )

        top_box = max(
            valid_boxes,
            key=lambda b: float(
                b.get(
                    "confidence",
                    0.0,
                )
            ),
        )

        return (
            round(
                _clip01(visual_score),
                3,
            ),

            round(
                spread_score,
                3,
            ),

            {
                "source": detector_result.source,

                "count": len(valid_boxes),

                "max_area_ratio": round(
                    max_area_ratio,
                    4,
                ),

                "top_class": top_box.get(
                    "label"
                ),

                "top_confidence": round(
                    float(
                        top_box.get(
                            "confidence",
                            0.0,
                        )
                    ),
                    3,
                ),

                "boxes": valid_boxes[:5],
            },
        )

    # ========================================================
    # YOLO NOT AVAILABLE
    # ========================================================

    logger.info(
        "YOLO unavailable; using OpenCV."
    )

    return _opencv_road_analysis(
        image_bytes
    )


# ============================================================
# MAIN AI ANALYSIS
# ============================================================
async def analyze_pothole_report(
    image_url: str,
    description: str,
    latitude: float,
    longitude: float,
    upvotes: int,
    image_bytes: Optional[bytes] = None,
    citizen_severity: str = "medium",
) -> Dict:

    # ========================================================
    # LOAD IMAGE
    # ========================================================

    loaded_image = await _load_image_bytes(
        image_url,
        image_bytes,
    )

    # ========================================================
    # GEO
    # ========================================================

    has_coords = bool(
        latitude
        and longitude
        and (
            latitude != 0.0
            or longitude != 0.0
        )
    )

    geo_key = (
        f"{round(latitude, 3)},"
        f"{round(longitude, 3)}"
        if has_coords
        else ""
    )

    if (
        has_coords
        and geo_key in _GEO_CACHE
    ):

        loc_score, poi_summary = (
            _GEO_CACHE[geo_key]
        )

        traffic_score = 55.0

        traffic_label = (
            "urban_sector_road"
        )

    elif has_coords:

        try:

            pois = await query_nearby_pois(
                latitude,
                longitude,
            )

            traffic_score, traffic_label = (
                await query_traffic_density(
                    latitude,
                    longitude,
                )
            )

            loc_score, poi_summary = (
                location_score_from_pois(
                    pois
                )
            )

        except Exception as exc:

            logger.warning(
                "Geospatial analysis failed: %s",
                exc,
            )

            loc_score = 50.0
            poi_summary = (
                "Urban city sector road"
            )

            traffic_score = 45.0
            traffic_label = "urban_road"

        if loc_score == 0.0:

            loc_score = 50.0

            poi_summary = (
                "Urban city sector road"
            )

        _GEO_CACHE[geo_key] = (
            loc_score,
            poi_summary,
        )

    else:

        traffic_score = 45.0

        traffic_label = "urban_road"

        loc_score = 50.0

        poi_summary = (
            "Urban city sector road"
        )

    # ========================================================
    # SENTIMENT
    # ========================================================

    sentiment = _sentiment_score(
        description,
        citizen_severity,
    )

    desc_sc = (
        sentiment * 100.0
    )

    # ========================================================
    # UPVOTES
    # ========================================================

    upvote_score = _clip01(
        (upvotes or 0) / 20.0
    )

    # ========================================================
    # GROK / GROQ
    # ========================================================

    groq_result = await analyze_with_grok(
        image_bytes=loaded_image,
        description=description,
        citizen_severity=citizen_severity,
        latitude=latitude,
        longitude=longitude,
        upvotes=upvotes,
        pois={},
        traffic_score=traffic_score,
        traffic_label=traffic_label,
    )

    # ========================================================
    # IMPORTANT:
    # Only trust LLM image result if it explicitly
    # identifies actual road damage.
    # ========================================================

    if groq_result:

        damage_type = str(
            groq_result.get(
                "damage_type",
                "",
            )
        ).lower()

        image_score = float(
            groq_result.get(
                "image_score",
                0.0,
            )
        )

        final_score = float(
            groq_result.get(
                "final_severity_score",
                image_score,
            )
        )

        # ----------------------------------------------------
        # GOOD ROAD LLM CHECK
        # ----------------------------------------------------

        good_road_words = {
            "good road",
            "normal road",
            "no damage",
            "no pothole",
            "no potholes",
            "clear road",
            "smooth road",
            "undamaged",
            "intact road",
            "healthy road",
            "fine road",
        }

        is_good_road = (
            damage_type in good_road_words
            or any(
                word in damage_type
                for word in good_road_words
            )
        )

        if is_good_road:

            final_score = min(
                final_score,
                15.0,
            )

            severity_level = "low"

        else:

            final_score = min(
                max(
                    final_score,
                    0.0,
                ),
                100.0,
            )

            severity_level = (
                groq_result.get(
                    "severity_level",
                    _severity_level_from_score(
                        final_score
                    ),
                )
            )

        return {

            "pothole_spread_score": round(
                image_score / 100.0,
                3,
            ),

            "emotion_score": round(
                desc_sc / 100.0,
                3,
            ),

            "location_score": round(
                loc_score / 100.0,
                3,
            ),

            "upvote_score": round(
                upvote_score,
                3,
            ),

            "ai_severity_score": round(
                final_score,
                2,
            ),

            "ai_severity_level": severity_level,

            "location_meta": json.dumps({

                "mode": "groq-ahp",

                "geospatial_enrichment": True,

                "latitude": latitude,

                "longitude": longitude,

                "location_score": loc_score,

                "traffic_score": traffic_score,

                "traffic_label": traffic_label,

                "nearby_critical_places": poi_summary,

            }),

            "sentiment_meta": json.dumps({

                "source": "groq-vision-ahp",

                "damage_type": damage_type,

                "image_score": image_score,

                "description_score": round(
                    desc_sc,
                    1,
                ),

                "location_score": loc_score,

                "upvote_score": round(
                    upvote_score * 100
                ),

                "final_severity_score": final_score,

                "explanation": groq_result.get(
                    "explanation"
                ),

                "confidence": groq_result.get(
                    "confidence"
                ),

            }),
        }

    # ========================================================
    # OPENCV / YOLO
    # ========================================================

    if loaded_image:

        visual_score, spread_score, vision_meta = (
            _visual_damage_score(
                loaded_image
            )
        )

    else:

        # No image should NOT mean severe.
        visual_score = 0.05
        spread_score = 0.02

        vision_meta = {
            "source": "no-image",
            "damage_label": "unknown",
        }

    # ========================================================
    # SENTIMENT
    # ========================================================

    sentiment = _sentiment_score(
        description,
        citizen_severity,
    )

    # ========================================================
    # SOCIAL
    # ========================================================

    social_score = min(
        (
            upvote_score
            + (
                loc_score / 100.0
                * 0.20
            )
            + 0.05
        ),
        1.0,
    )

    # ========================================================
    # AHP
    # ========================================================

    severity = (

        W_VISUAL
        * (
            visual_score
            * 100.0
        )

        +

        W_LOCATION
        * loc_score

        +

        W_SENTIMENT
        * (
            sentiment
            * 100.0
        )

        +

        W_SOCIAL
        * (
            social_score
            * 100.0
        )
    )

    # ========================================================
    # GOOD ROAD PROTECTION
    # ========================================================

    if (
        vision_meta.get(
            "damage_label"
        )
        == "good_road"
    ):

        # Absolutely prevent a good road
        # from becoming high/critical.

        severity = min(
            severity,
            15.0,
        )

    # ========================================================
    # FINAL SCORE
    # ========================================================

    final_severity = round(
        min(
            max(
                severity,
                0.0,
            ),
            100.0,
        ),
        2,
    )

    severity_level = (
        _severity_level_from_score(
            final_severity
        )
    )

    # ========================================================
    # DAMAGE LABEL
    # ========================================================

    damage_label = vision_meta.get(
        "damage_label",
        "road damage",
    )

    # ========================================================
    # EXPLANATION
    # ========================================================

    if damage_label == "good_road":

        damage_explanation = (
            "No significant pothole, cavity, "
            "fracture or road-surface defect "
            "was detected in the uploaded image."
        )

    else:

        damage_explanation = (

            f"Detected "
            f"{damage_label.replace('_', ' ')} "
            f"with "
            f"{spread_score * 100:.1f}% "
            f"estimated surface spread."
        )

    # ========================================================
    # RETURN
    # ========================================================

    return {

        "pothole_spread_score": round(
            spread_score,
            3,
        ),

        "emotion_score": round(
            sentiment,
            3,
        ),

        "location_score": round(
            loc_score / 100.0,
            3,
        ),

        "upvote_score": round(
            upvote_score,
            3,
        ),

        "ai_severity_score": final_severity,

        "ai_severity_level": severity_level,

        "location_meta": json.dumps({

            "mode": "opencv-ahp-engine",

            "geospatial_enrichment": has_coords,

            "latitude": latitude,

            "longitude": longitude,

            "location_score": loc_score,

            "traffic_score": traffic_score,

            "traffic_label": traffic_label,

            "nearby_critical_places": poi_summary,

        }),

        "sentiment_meta": json.dumps({

            "source": "opencv-ahp-engine",

            "visual_score": round(
                visual_score * 100,
                1,
            ),

            "spread_score": round(
                spread_score * 100,
                1,
            ),

            "sentiment_score": round(
                sentiment * 100,
                1,
            ),

            "social_score": round(
                social_score * 100,
                1,
            ),

            "damage_type": damage_label,

            "explanation": damage_explanation,

            "vision": vision_meta,

        }),
    }