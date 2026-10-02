import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path
from sqlalchemy import text
from database import engine, Base
from routers import auth, reports, analytics, votes, upload, modeling, notifications, user as user_router

app = FastAPI(title="Smart City Infrastructure and Management System API")

# Create uploads directory if it doesn't exist
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

# Mount static files for uploads (must be before other routes)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

raw_origins = os.getenv("ALLOWED_ORIGINS", "*")

_default_origins = [
    "http://localhost:3005",
    "http://127.0.0.1:3005",
]

if raw_origins == "*":
    _origins = ["*"]
else:
    _extra = [o.strip() for o in raw_origins.split(",") if o.strip()]
    _origins = list(dict.fromkeys(_default_origins + _extra))

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=True if _origins != ["*"] else False,
    allow_origin_regex=".*" if _origins == ["*"] else None,
    allow_methods=["*"],
    allow_headers=["*"],
)

from database import engine, Base, AsyncSessionLocal
from models import User, UserRole, Department, FieldTeam
from utils.security import get_password_hash
from sqlalchemy import select

# Include Routers
app.include_router(auth.router)
app.include_router(reports.router)
app.include_router(votes.router)
app.include_router(analytics.router)
app.include_router(upload.router)
app.include_router(modeling.router)
app.include_router(notifications.router)
app.include_router(user_router.router, prefix="/users", tags=["users"])

async def seed_initial_cloud_data():
    try:
        async with AsyncSessionLocal() as session:
            # Check if any user exists
            res = await session.execute(select(User))
            existing_user = res.scalars().first()
            if existing_user:
                return  # Database already has data

            print("[*] Initializing empty cloud database with default departments and accounts...")
            
            # 1. Departments
            depts = [
                Department(name="Roads & Pothole Repair", slug="roads"),
                Department(name="Drainage & Waterlogging", slug="drainage"),
                Department(name="Traffic & Street Infrastructure", slug="traffic"),
            ]
            for d in depts:
                session.add(d)
            await session.flush()

            # 2. Field Teams
            teams = [
                FieldTeam(name="Rapid Asphalt Repair Unit #1", status="active", department_id=depts[0].id),
                FieldTeam(name="Pothole Patching Crew #2", status="active", department_id=depts[0].id),
            ]
            for t in teams:
                session.add(t)

            # 3. Default Demo Accounts
            accounts = [
                {"name": "Super Admin", "email": "admin@example.com", "password": "admin123", "role": UserRole.admin},
                {"name": "Super Admin", "email": "superadmin@example.com", "password": "admin123", "role": UserRole.admin},
                {"name": "Field Officer", "email": "officer@city.gov", "password": "officer123", "role": UserRole.officer},
                {"name": "Officer Tarun", "email": "taruna.24.becs@acharya.ac.in", "password": "password123", "role": UserRole.officer},
                {"name": "Tarun Citizen", "email": "tarunta850@gmail.com", "password": "password123", "role": UserRole.citizen},
                {"name": "John Citizen", "email": "citizen@example.com", "password": "citizen123", "role": UserRole.citizen},
            ]
            for acc in accounts:
                session.add(User(
                    name=acc["name"],
                    email=acc["email"],
                    hashed_password=get_password_hash(acc["password"]),
                    role=acc["role"]
                ))

            await session.commit()
            print("[+] Cloud database successfully seeded with initial accounts & departments.")
    except Exception as e:
        print(f"[!] Warning during cloud seed: {e}")

@app.on_event("startup")
async def startup():
    # Create extensions in isolated transactions so a failure doesn't poison the whole startup transaction.
    async with engine.connect() as conn:
        for stmt in ("CREATE EXTENSION IF NOT EXISTS postgis;", "CREATE EXTENSION IF NOT EXISTS vector;"):
            try:
                async with conn.begin():
                    await conn.execute(text(stmt))
            except Exception as e:
                # Avoid crashing startup if the extension isn't available (e.g., pgvector not installed)
                print(f"Extension init skipped: {stmt} ({e})")

        async with conn.begin():
            await conn.run_sync(Base.metadata.create_all)

    await seed_initial_cloud_data()

@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "Smart City Infrastructure and Management System API",
        "version": "2.0",
        "mode": "Road & Pothole Defect Monitoring"
    }

