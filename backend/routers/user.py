from typing import List, Optional
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models import User, UserRole
from routers.auth import get_current_user
from utils.security import get_password_hash, verify_password

router = APIRouter()


class UserProfileResponse(BaseModel):
    id: int
    email: EmailStr
    name: Optional[str] = None
    role: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class CreateOfficerRequest(BaseModel):
    name: str
    email: EmailStr
    password: str


class RoleUpdateRequest(BaseModel):
    role: str


class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None


class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str


def _profile_response(user: User) -> UserProfileResponse:
    return UserProfileResponse(
        id=user.id,
        email=user.email,
        name=user.name,
        role=user.role.value if hasattr(user.role, "value") else str(user.role),
        created_at=user.created_at,
    )


@router.get("/me", response_model=UserProfileResponse)
async def get_profile(current_user: User = Depends(get_current_user)):
    return _profile_response(current_user)


@router.patch("/me", response_model=UserProfileResponse)
async def update_profile(
    payload: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    update_fields = payload.model_fields_set

    if "email" in update_fields and payload.email is not None and payload.email != current_user.email:
        result = await db.execute(
            select(User).where(User.email == payload.email, User.id != current_user.id)
        )
        if result.scalars().first():
            raise HTTPException(status_code=409, detail="Email already taken")
        current_user.email = payload.email

    if "full_name" in update_fields and payload.full_name is not None:
        current_user.name = payload.full_name

    await db.commit()
    await db.refresh(current_user)
    return _profile_response(current_user)


@router.post("/me/change-password", response_model=UserProfileResponse)
async def change_password(
    payload: PasswordChangeRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if len(payload.new_password) < 6:
        raise HTTPException(status_code=422, detail="New password must be at least 6 characters")

    if not verify_password(payload.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    current_user.hashed_password = get_password_hash(payload.new_password)
    await db.commit()
    await db.refresh(current_user)
    return _profile_response(current_user)


# ── Admin User & Officer Management Endpoints ──────────────────────

@router.get("/", response_model=List[UserProfileResponse])
async def list_all_users(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role not in (UserRole.admin, UserRole.officer):
        raise HTTPException(status_code=403, detail="Admin or Officer privilege required")

    result = await db.execute(select(User).order_by(User.created_at.desc()))
    users = result.scalars().all()
    return [_profile_response(u) for u in users]


@router.post("/officers", response_model=UserProfileResponse)
async def create_officer_account(
    payload: CreateOfficerRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="Only Admins can provision Officer accounts")

    result = await db.execute(select(User).where(User.email == payload.email))
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="A user with this email already exists")

    if len(payload.password) < 6:
        raise HTTPException(status_code=422, detail="Password must be at least 6 characters")

    new_officer = User(
        name=payload.name,
        email=payload.email,
        hashed_password=get_password_hash(payload.password),
        role=UserRole.officer,
    )
    db.add(new_officer)
    await db.commit()
    await db.refresh(new_officer)
    return _profile_response(new_officer)


@router.patch("/{user_id}/role", response_model=UserProfileResponse)
async def update_user_role(
    user_id: int,
    payload: RoleUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="Only Admins can modify user roles")

    result = await db.execute(select(User).where(User.id == user_id))
    target_user = result.scalars().first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    try:
        new_role = UserRole(payload.role.lower())
        target_user.role = new_role
        await db.commit()
        await db.refresh(target_user)
        return _profile_response(target_user)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid role specified")


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user_account(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="Only Admins can delete user accounts")

    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own admin account")

    result = await db.execute(select(User).where(User.id == user_id))
    target_user = result.scalars().first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    await db.delete(target_user)
    await db.commit()
    return None
