import asyncio
from database import AsyncSessionLocal
from models import Report
from routers.reports import _load_stored_image_bytes, _score_to_levels
from ai_analysis import analyze_pothole_report
from geoalchemy2.shape import to_shape
from sqlalchemy.future import select

async def recalc():
    async with AsyncSessionLocal() as session:
        r = await session.execute(select(Report))
        reports = r.scalars().all()
        for rep in reports:
            image_bytes = await _load_stored_image_bytes(rep.image_url, session)
            shape = to_shape(rep.location) if rep.location is not None else None
            full_desc = (rep.title or "") + ". " + (rep.description or "")
            ai_scores = await analyze_pothole_report(
                image_url=rep.image_url or "",
                description=full_desc,
                latitude=shape.y if shape is not None else 0.0,
                longitude=shape.x if shape is not None else 0.0,
                upvotes=rep.upvotes or 0,
                image_bytes=image_bytes,
                citizen_severity=rep.severity.value if rep.severity else "medium",
            )
            rep.pothole_spread_score = ai_scores.get("pothole_spread_score")
            rep.emotion_score = ai_scores.get("emotion_score")
            rep.location_score = ai_scores.get("location_score")
            rep.upvote_score = ai_scores.get("upvote_score")
            rep.ai_severity_score = ai_scores.get("ai_severity_score")
            rep.ai_severity_level = ai_scores.get("ai_severity_level")
            rep.location_meta = ai_scores.get("location_meta")
            rep.sentiment_meta = ai_scores.get("sentiment_meta")
            rep.severity, rep.priority = _score_to_levels(rep.ai_severity_score or 50.0)
            print(f"Report #{rep.id}: score={rep.ai_severity_score}, level={rep.ai_severity_level}, priority={rep.priority}")
        await session.commit()

if __name__ == "__main__":
    asyncio.run(recalc())
