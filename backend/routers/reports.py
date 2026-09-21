from typing import List, Optional
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, Query, status
from geoalchemy2 import WKTElement
from geoalchemy2.shape import to_shape
from sqlalchemy import delete, func, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from database import get_db
from models import Department, Notification, Report, ReportPriority, ReportSeverity, ReportStatus, StoredImage, User, UserRole, Vote
from routers.auth import get_current_user
from schemas import ReportCreate, ReportResponse

router = APIRouter(prefix="/reports", tags=["reports"])

ROAD_CATEGORY = "road_issues"


def _serialize_report(report: Report) -> dict:
    user_name = None
    user_email = None
    if getattr(report, "owner", None):
        user_name = report.owner.name
        user_email = report.owner.email

    report_dict = {
        "id": report.id,
        "title": report.title,
        "description": report.description,
        "category": report.category,
        "status": report.status.value,
        "severity": report.severity.value,
        "priority": report.priority.value,
        "image_url": report.image_url,
        "upvotes": report.upvotes,
        "created_at": report.created_at,
        "user_id": report.user_id,
        "user_name": user_name,
        "user_email": user_email,
        "department_id": report.department_id,
        "assigned_team_id": report.assigned_team_id,
        "resolution_image_url": report.resolution_image_url,
        "citizen_feedback": report.citizen_feedback,
        "pothole_spread_score": report.pothole_spread_score,
        "emotion_score": report.emotion_score,
        "location_score": report.location_score,
        "upvote_score": report.upvote_score,
        "ai_severity_score": report.ai_severity_score,
        "ai_severity_level": report.ai_severity_level,
        "location_meta": report.location_meta,
        "sentiment_meta": report.sentiment_meta,
    }

    try:
        if report.location is not None:
            shape = to_shape(report.location)
            report_dict["latitude"] = shape.y
            report_dict["longitude"] = shape.x
        else:
            report_dict["latitude"] = 0.0
            report_dict["longitude"] = 0.0
    except Exception:
        report_dict["latitude"] = 0.0
        report_dict["longitude"] = 0.0

    return report_dict


async def _auto_assign_roads_department(db: AsyncSession) -> Optional[int]:
    result = await db.execute(
        select(Department).where(
            (Department.slug == "roads") | (Department.name == "Roads")
        )
    )
    department = result.scalars().first()
    return department.id if department else None


async def _load_stored_image_bytes(image_url: Optional[str], db: AsyncSession) -> Optional[bytes]:
    if not image_url:
        return None

    # 1. Stored in Database
    if "/upload/image/" in image_url:
        image_id = image_url.split("/upload/image/")[-1].split("?")[0].strip()
        result = await db.execute(select(StoredImage).where(StoredImage.id == image_id))
        stored_img = result.scalars().first()
        if stored_img and stored_img.data:
            return stored_img.data

    # 2. Local uploads directory on disk
    clean_path = image_url.replace("/uploads/", "").replace("uploads/", "")
    file_path = Path("uploads") / clean_path
    if file_path.exists() and file_path.is_file():
        return file_path.read_bytes()

    return None


def _score_to_levels(score: float) -> tuple[ReportSeverity, ReportPriority]:
    if score > 75:
        return ReportSeverity.critical, ReportPriority.critical
    if score > 50:
        return ReportSeverity.high, ReportPriority.high
    if score > 25:
        return ReportSeverity.medium, ReportPriority.medium
    return ReportSeverity.low, ReportPriority.low


@router.post("/", response_model=ReportResponse)
async def create_report(
    report: ReportCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    location_wkt = f"POINT({report.longitude} {report.latitude})"
    department_id = await _auto_assign_roads_department(db)

    from ai_analysis import analyze_pothole_report

    image_bytes = await _load_stored_image_bytes(report.image_url, db)
    ai_scores = await analyze_pothole_report(
        image_url=report.image_url or "",
        description=f"{report.title}. {report.description}",
        latitude=report.latitude,
        longitude=report.longitude,
        upvotes=0,
        image_bytes=image_bytes,
        citizen_severity=getattr(report, "severity", None) or "medium",
    )

    severity, priority = _score_to_levels(ai_scores.get("ai_severity_score", 50.0))

    new_report = Report(
        title=report.title,
        description=report.description,
        category=ROAD_CATEGORY,
        severity=severity,
        priority=priority,
        status=ReportStatus.pending,
        image_url=report.image_url,
        location=WKTElement(location_wkt, srid=4326),
        user_id=current_user.id,
        department_id=department_id,
        pothole_spread_score=ai_scores.get("pothole_spread_score"),
        emotion_score=ai_scores.get("emotion_score"),
        location_score=ai_scores.get("location_score"),
        upvote_score=ai_scores.get("upvote_score"),
        ai_severity_score=ai_scores.get("ai_severity_score"),
        ai_severity_level=ai_scores.get("ai_severity_level"),
        location_meta=ai_scores.get("location_meta", "{}"),
        sentiment_meta=ai_scores.get("sentiment_meta", "{}"),
    )

    db.add(new_report)
    await db.commit()
    await db.refresh(new_report)

    # Re-fetch with owner loaded
    res = await db.execute(select(Report).options(selectinload(Report.owner)).where(Report.id == new_report.id))
    fetched = res.scalars().first()
    return _serialize_report(fetched or new_report)


@router.get("/mine", response_model=List[ReportResponse])
async def get_my_reports(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Report)
        .options(selectinload(Report.owner))
        .where(Report.user_id == current_user.id, Report.category == ROAD_CATEGORY)
        .order_by(Report.created_at.desc())
    )
    return [_serialize_report(r) for r in result.scalars().all()]


@router.get("/")
async def get_reports(
    lat: Optional[float] = None,
    lon: Optional[float] = None,
    radius: Optional[float] = Query(None, description="Radius in meters"),
    category: Optional[str] = None,
    status: Optional[str] = None,
    priority: Optional[str] = None,
    q: Optional[str] = Query(None, description="Search query"),
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    sort_by: Optional[str] = Query("created_at", description="Sort by: created_at, upvotes, priority"),
    sort_order: Optional[str] = Query("desc", description="asc or desc"),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
):
    if category and category != ROAD_CATEGORY:
        return {"items": [], "total": 0, "page": page, "limit": limit}

    query = select(Report).options(selectinload(Report.owner)).where(Report.category == ROAD_CATEGORY)
    count_query = select(func.count(Report.id)).where(Report.category == ROAD_CATEGORY)

    if q:
        search_pattern = f"%{q}%"
        q_filter = or_(
            Report.title.ilike(search_pattern),
            Report.description.ilike(search_pattern),
        )
        query = query.where(q_filter)
        count_query = count_query.where(q_filter)

    if status and status.lower() != "all":
        try:
            status_filter = Report.status == ReportStatus(status.lower())
            query = query.where(status_filter)
            count_query = count_query.where(status_filter)
        except ValueError:
            pass

    if priority and priority.lower() != "all":
        try:
            priority_filter = Report.priority == ReportPriority(priority.lower())
            query = query.where(priority_filter)
            count_query = count_query.where(priority_filter)
        except ValueError:
            pass

    if start_date:
        start_date_filter = Report.created_at >= start_date
        query = query.where(start_date_filter)
        count_query = count_query.where(start_date_filter)
    if end_date:
        end_date_filter = Report.created_at <= end_date
        query = query.where(end_date_filter)
        count_query = count_query.where(end_date_filter)

    if lat is not None and lon is not None and radius is not None:
        location_filter = func.ST_DWithin(
            Report.location.cast(func.geography),
            func.ST_GeogFromText(f"SRID=4326;POINT({lon} {lat})"),
            radius,
        )
        query = query.where(location_filter)
        count_query = count_query.where(location_filter)

    if sort_by == "upvotes":
        order_col = Report.upvotes
    elif sort_by == "priority":
        order_col = Report.priority
    elif sort_by == "ai_severity_score":
        order_col = Report.ai_severity_score
    else:
        order_col = Report.created_at

    offset = (page - 1) * limit
    query = (
        query
        .order_by(order_col.asc() if sort_order == "asc" else order_col.desc())
        .offset(offset)
        .limit(limit)
    )

    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0
    result = await db.execute(query)
    reports = result.scalars().all()
    return {
        "items": [_serialize_report(report) for report in reports],
        "total": total,
        "page": page,
        "limit": limit,
    }


@router.get("/{report_id}", response_model=ReportResponse)
async def get_report(report_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Report)
        .options(selectinload(Report.owner))
        .where(Report.id == report_id, Report.category == ROAD_CATEGORY)
    )
    report = result.scalars().first()
    if not report:
        raise HTTPException(status_code=404, detail="Road report not found")

    return _serialize_report(report)


@router.post("/{report_id}/verify", response_model=ReportResponse)
async def verify_report(
    report_id: int,
    feedback: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Report)
        .options(selectinload(Report.owner))
        .where(Report.id == report_id, Report.category == ROAD_CATEGORY)
    )
    report = result.scalars().first()
    if not report:
        raise HTTPException(status_code=404, detail="Road report not found")

    if report.user_id != current_user.id and current_user.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="Not authorized")

    if report.status != ReportStatus.resolved:
        raise HTTPException(status_code=400, detail="Report is not in resolved state")

    report.status = ReportStatus.closed
    report.citizen_feedback = feedback
    await db.commit()
    await db.refresh(report)
    return _serialize_report(report)


@router.post("/{report_id}/reanalyze", response_model=ReportResponse)
async def reanalyze_report(
    report_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role not in (UserRole.admin, UserRole.officer):
        raise HTTPException(status_code=403, detail="Not authorized")

    result = await db.execute(
        select(Report)
        .options(selectinload(Report.owner))
        .where(Report.id == report_id, Report.category == ROAD_CATEGORY)
    )
    report = result.scalars().first()
    if not report:
        raise HTTPException(status_code=404, detail="Road report not found")

    image_bytes = await _load_stored_image_bytes(report.image_url, db)

    from ai_analysis import analyze_pothole_report

    shape = to_shape(report.location) if report.location is not None else None
    ai_scores = await analyze_pothole_report(
        image_url=report.image_url or "",
        description=f"{report.title}. {report.description or ''}",
        latitude=shape.y if shape is not None else 0.0,
        longitude=shape.x if shape is not None else 0.0,
        upvotes=report.upvotes or 0,
        image_bytes=image_bytes,
        citizen_severity=report.severity.value if report.severity else "medium",
    )

    report.pothole_spread_score = ai_scores.get("pothole_spread_score")
    report.emotion_score = ai_scores.get("emotion_score")
    report.location_score = ai_scores.get("location_score")
    report.upvote_score = ai_scores.get("upvote_score")
    report.ai_severity_score = ai_scores.get("ai_severity_score")
    report.ai_severity_level = ai_scores.get("ai_severity_level")
    report.location_meta = ai_scores.get("location_meta")
    report.sentiment_meta = ai_scores.get("sentiment_meta")
    report.severity, report.priority = _score_to_levels(report.ai_severity_score or 50.0)

    await db.commit()
    await db.refresh(report)
    return _serialize_report(report)


@router.post("/recalculate-all")
async def recalculate_all_reports(db: AsyncSession = Depends(get_db)):
    """Recalculate AI severity scores for all road reports using updated CV engine."""
    result = await db.execute(select(Report).options(selectinload(Report.owner)))
    reports = result.scalars().all()

    from ai_analysis import analyze_pothole_report

    updated = []
    for report in reports:
        image_bytes = await _load_stored_image_bytes(report.image_url, db)
        shape = to_shape(report.location) if report.location is not None else None
        ai_scores = await analyze_pothole_report(
            image_url=report.image_url or "",
            description=f"{report.title}. {report.description or ''}",
            latitude=shape.y if shape is not None else 0.0,
            longitude=shape.x if shape is not None else 0.0,
            upvotes=report.upvotes or 0,
            image_bytes=image_bytes,
            citizen_severity=report.severity.value if report.severity else "medium",
        )
        report.pothole_spread_score = ai_scores.get("pothole_spread_score")
        report.emotion_score = ai_scores.get("emotion_score")
        report.location_score = ai_scores.get("location_score")
        report.upvote_score = ai_scores.get("upvote_score")
        report.ai_severity_score = ai_scores.get("ai_severity_score")
        report.ai_severity_level = ai_scores.get("ai_severity_level")
        report.location_meta = ai_scores.get("location_meta")
        report.sentiment_meta = ai_scores.get("sentiment_meta")
        report.severity, report.priority = _score_to_levels(report.ai_severity_score or 50.0)
        updated.append(report.id)

    await db.commit()
    return {"status": "success", "updated_reports_count": len(updated), "ids": updated}


@router.post("/{report_id}/reopen", response_model=ReportResponse)
async def reopen_report(
    report_id: int,
    feedback: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Report)
        .options(selectinload(Report.owner))
        .where(Report.id == report_id, Report.category == ROAD_CATEGORY)
    )
    report = result.scalars().first()
    if not report:
        raise HTTPException(status_code=404, detail="Road report not found")

    if report.user_id != current_user.id and current_user.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="Not authorized")

    report.status = ReportStatus.reopened
    report.citizen_feedback = feedback
    await db.commit()
    await db.refresh(report)
    return _serialize_report(report)


@router.post("/{report_id}/reject", response_model=ReportResponse)
async def reject_report(
    report_id: int,
    reason: Optional[str] = Query(None, description="Reason for rejecting the complaint"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role not in (UserRole.officer, UserRole.admin):
        raise HTTPException(status_code=403, detail="Not authorized")

    result = await db.execute(
        select(Report)
        .options(selectinload(Report.owner))
        .where(Report.id == report_id)
    )
    report = result.scalars().first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    report.status = ReportStatus.rejected
    if reason:
        report.citizen_feedback = f"Rejected by Officer: {reason}"
    
    if report.user_id:
        msg = f'Your report "{report.title}" was reviewed and marked as Rejected'
        if reason:
            msg += f': {reason}'
        else:
            msg += ' (Road is already verified as repaired / dispute invalid).'
        notif = Notification(
            user_id=report.user_id,
            report_id=report.id,
            message=msg,
        )
        db.add(notif)

    await db.commit()
    await db.refresh(report)
    return _serialize_report(report)


@router.patch("/{report_id}/status", response_model=ReportResponse)
async def update_report_status(
    report_id: int,
    new_status: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role not in (UserRole.officer, UserRole.admin):
        raise HTTPException(status_code=403, detail="Not authorized")

    try:
        status_enum = ReportStatus(new_status)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid status: {new_status}")

    result = await db.execute(
        select(Report)
        .options(selectinload(Report.owner))
        .where(Report.id == report_id)
    )
    report = result.scalars().first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    report.status = status_enum
    await db.commit()

    # Notify report owner when resolved
    if status_enum == ReportStatus.resolved and report.user_id:
        notif = Notification(
            user_id=report.user_id,
            report_id=report.id,
            message=f'Your report "{report.title}" has been resolved. Please verify and close it.',
        )
        db.add(notif)
        await db.commit()
    elif status_enum == ReportStatus.rejected and report.user_id:
        notif = Notification(
            user_id=report.user_id,
            report_id=report.id,
            message=f'Your report "{report.title}" was reviewed and marked as Rejected (Road already repaired / dispute invalid).',
        )
        db.add(notif)
        await db.commit()

    await db.refresh(report)
    return _serialize_report(report)


@router.delete("/{report_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_report(
    report_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Report)
        .options(selectinload(Report.owner))
        .where(Report.id == report_id, Report.category == ROAD_CATEGORY)
    )
    report = result.scalars().first()
    if not report:
        raise HTTPException(status_code=404, detail="Road report not found")

    if report.user_id != current_user.id and current_user.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="Not authorized to delete this report")

    await db.execute(delete(Notification).where(Notification.report_id == report_id))
    await db.execute(delete(Vote).where(Vote.report_id == report_id))
    await db.delete(report)
    await db.commit()
    return None
