"""
Auth Router — user signup, login, and token validation.
Endpoints: POST /signup, POST /login, GET /me
"""

from fastapi import APIRouter, HTTPException, Depends

from auth import hash_password, verify_password, create_token
from database import create_user, get_user_by_email
from routers.deps import SignupRequest, LoginRequest, get_current_user

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/signup")
async def signup(req: SignupRequest):
    """Create a new user account."""
    if not req.email or not req.password or not req.name:
        raise HTTPException(
            status_code=400, detail="Email, name, and password are required")
    if len(req.password) < 6:
        raise HTTPException(
            status_code=400, detail="Password must be at least 6 characters")

    existing = get_user_by_email(req.email)
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed = hash_password(req.password)
    user_id = create_user(req.email, req.name, hashed)

    if not user_id:
        raise HTTPException(status_code=500, detail="Failed to create user")

    token = create_token(user_id, req.email)
    return {
        "token": token,
        "user": {"id": user_id, "email": req.email, "name": req.name},
    }


@router.post("/login")
async def login(req: LoginRequest):
    """Login and get JWT token."""
    user = get_user_by_email(req.email)
    if not user:
        raise HTTPException(
            status_code=401, detail="Invalid email or password")

    if not verify_password(req.password, user["password_hash"]):
        raise HTTPException(
            status_code=401, detail="Invalid email or password")

    token = create_token(user["id"], user["email"])
    return {
        "token": token,
        "user": {"id": user["id"], "email": user["email"], "name": user["name"]},
    }


@router.get("/me")
async def get_me(user=Depends(get_current_user)):
    """Get current user info from token."""
    return {"user": user}
