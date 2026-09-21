import asyncio
import os
import shutil
from pathlib import Path
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select, delete, func, text

from database import DATABASE_URL
from models import Department, FieldTeam, Notification, Report, StoredImage, User, UserRole, Vote
from utils.security import get_password_hash, verify_password

ACCOUNTS = [
    # Admin Accounts
    {
        "name": "Super Admin",
        "email": "superadmin@example.com",
        "password": "admin123",
        "role": UserRole.admin
    },
    {
        "name": "Admin User",
        "email": "admin@example.com",
        "password": "admin123",
        "role": UserRole.admin
    },
    # Officer Accounts
    {
        "name": "Officer Tarun",
        "email": "taruna.24.becs@acharya.ac.in",
        "password": "password123",
        "role": UserRole.officer
    },
    {
        "name": "Field Officer",
        "email": "officer@city.gov",
        "password": "officer123",
        "role": UserRole.officer
    },
    {
        "name": "Officer Priya Sharma",
        "email": "priya.officer@city.gov",
        "password": "password123",
        "role": UserRole.officer
    },
    {
        "name": "Officer Alex",
        "email": "officer@example.com",
        "password": "officer123",
        "role": UserRole.officer
    },
    # Citizen Accounts
    {
        "name": "Tarun Citizen",
        "email": "tarunta850@gmail.com",
        "password": "password123",
        "role": UserRole.citizen
    },
    {
        "name": "John Citizen",
        "email": "citizen@example.com",
        "password": "citizen123",
        "role": UserRole.citizen
    },
    {
        "name": "Public Citizen",
        "email": "citizen_public@cityreport.org",
        "password": "password123",
        "role": UserRole.citizen
    },
    {
        "name": "Standard User",
        "email": "user@example.com",
        "password": "user123",
        "role": UserRole.citizen
    }
]

DEPARTMENTS = [
    {"name": "Roads & Infrastructure", "slug": "roads"},
    {"name": "Water & Drainage", "slug": "drainage"},
    {"name": "Sanitation & Waste", "slug": "sanitation"},
    {"name": "Streetlights & Electrical", "slug": "electrical"},
]

FIELD_TEAMS = [
    {"name": "Road Repair Team Alpha", "dept": "roads", "lat": 12.9716, "lon": 77.5946},
    {"name": "Drainage Quick Action Unit", "dept": "drainage", "lat": 12.9750, "lon": 77.6000},
    {"name": "Sanitation Squad 1", "dept": "sanitation", "lat": 12.9650, "lon": 77.5850},
]

async def perform_complete_reset():
    print("=" * 60)
    print("STARTING COMPLETE PROJECT DATA RESET")
    print("=" * 60)

    engine = create_async_engine(DATABASE_URL)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        # 1. Count before deletion
        notif_count = (await session.execute(select(func.count(Notification.id)))).scalar() or 0
        vote_count = (await session.execute(select(func.count()).select_from(Vote))).scalar() or 0
        report_count = (await session.execute(select(func.count(Report.id)))).scalar() or 0
        image_count = (await session.execute(select(func.count(StoredImage.id)))).scalar() or 0
        user_count = (await session.execute(select(func.count(User.id)))).scalar() or 0

        print(f"Pre-reset counts: Reports={report_count}, Images={image_count}, Notifications={notif_count}, Votes={vote_count}, Users={user_count}")

        # 2. Delete complaint-associated child tables first (foreign keys)
        print("\n--- 1. Deleting Notifications & Votes ---")
        await session.execute(delete(Notification))
        await session.execute(delete(Vote))
        await session.commit()
        print("[+] Deleted all notifications and votes.")

        # 3. Delete all reports
        print("\n--- 2. Deleting All Complaints / Reports ---")
        await session.execute(delete(Report))
        await session.commit()
        print("[+] Deleted all complaints / reports.")

        # 4. Delete all stored database images
        print("\n--- 3. Deleting All Stored Images ---")
        await session.execute(delete(StoredImage))
        await session.commit()
        print("[+] Deleted all stored images from database.")

        # 5. Delete all physical files in uploads directory
        uploads_dir = Path(__file__).parent / "uploads"
        if uploads_dir.exists():
            for item in uploads_dir.iterdir():
                if item.is_file():
                    item.unlink()
                elif item.is_dir():
                    shutil.rmtree(item)
            print(f"[+] Cleaned filesystem uploads directory: {uploads_dir}")
        else:
            uploads_dir.mkdir(parents=True, exist_ok=True)
            print(f"[+] Created clean uploads directory: {uploads_dir}")

        # 6. Reset all user accounts & recreate fresh test accounts
        print("\n--- 4. Resetting User Accounts ---")
        await session.execute(delete(User))
        await session.commit()

        for acc in ACCOUNTS:
            hashed_pw = get_password_hash(acc["password"])
            user = User(
                name=acc["name"],
                email=acc["email"],
                hashed_password=hashed_pw,
                role=acc["role"]
            )
            session.add(user)
            print(f"[+] Created fresh test account: {acc['role'].value.upper():<8} {acc['email']:<30} (pw: {acc['password']})")
        await session.commit()

        # 7. Seed Departments & Field Teams
        print("\n--- 5. Seeding Departments & Field Teams ---")
        dept_objects = {}
        for dept_data in DEPARTMENTS:
            res = await session.execute(select(Department).where(Department.slug == dept_data["slug"]))
            dept = res.scalars().first()
            if not dept:
                dept = Department(name=dept_data["name"], slug=dept_data["slug"])
                session.add(dept)
                await session.flush()
                print(f"[+] Created Department: {dept.name}")
            dept_objects[dept.slug] = dept

        for t_data in FIELD_TEAMS:
            res = await session.execute(select(FieldTeam).where(FieldTeam.name == t_data["name"]))
            team = res.scalars().first()
            if not team:
                dept = dept_objects.get(t_data["dept"])
                team = FieldTeam(
                    name=t_data["name"],
                    status="active",
                    current_lat=t_data["lat"],
                    current_lon=t_data["lon"],
                    department_id=dept.id if dept else None
                )
                session.add(team)
                print(f"[+] Created Field Team: {team.name}")

        await session.commit()

        # 8. Post-reset verification
        print("\n" + "=" * 60)
        print("POST-RESET VERIFICATION CHECKS")
        print("=" * 60)

        post_reports = (await session.execute(select(func.count(Report.id)))).scalar()
        post_images = (await session.execute(select(func.count(StoredImage.id)))).scalar()
        post_notifs = (await session.execute(select(func.count(Notification.id)))).scalar()
        post_votes = (await session.execute(select(func.count()).select_from(Vote))).scalar()
        post_users = (await session.execute(select(func.count(User.id)))).scalar()

        print(f"Reports in DB:       {post_reports} (Expected: 0)")
        print(f"Images in DB:        {post_images} (Expected: 0)")
        print(f"Notifications in DB: {post_notifs} (Expected: 0)")
        print(f"Votes in DB:         {post_votes} (Expected: 0)")
        print(f"Users in DB:         {post_users} (Expected: {len(ACCOUNTS)})")

        assert post_reports == 0, "Reports count is not zero!"
        assert post_images == 0, "Images count is not zero!"
        assert post_notifs == 0, "Notifications count is not zero!"
        assert post_votes == 0, "Votes count is not zero!"
        assert post_users == len(ACCOUNTS), "User count does not match test accounts!"

        print("\n--- Testing Authentication for All Accounts ---")
        users_res = await session.execute(select(User))
        all_users = users_res.scalars().all()
        for u in all_users:
            acc_info = next(a for a in ACCOUNTS if a["email"] == u.email)
            auth_ok = verify_password(acc_info["password"], u.hashed_password)
            print(f"Account {u.role.value.upper():<8} | {u.email:<30} | Auth check: {'PASSED' if auth_ok else 'FAILED'}")
            assert auth_ok, f"Auth verification failed for {u.email}"

    await engine.dispose()
    print("\n" + "=" * 60)
    print("SUCCESS: COMPLETE RESET COMPLETED AND VERIFIED!")
    print("=" * 60)

if __name__ == "__main__":
    asyncio.run(perform_complete_reset())
