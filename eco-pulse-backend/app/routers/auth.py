from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr, Field
import bcrypt
from app.database import get_supabase
from app.utils.jwt_handler import create_access_token, get_current_user

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

# ── Schemas ──────────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, max_length=72)
    full_name: str
    role: str = "viewer"   # ignored — server forces viewer

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict

# ── Helpers (direct bcrypt — avoids passlib/bcrypt 4+ incompat) ──────────────

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8")[:72], bcrypt.gensalt()).decode("utf-8")

def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8")[:72], hashed.encode("utf-8"))
    except Exception:
        return False

# ── Routes ───────────────────────────────────────────────────────────────────

@router.post("/register", response_model=TokenResponse, status_code=201)
async def register(body: RegisterRequest):
    db = get_supabase()
    existing = db.table("users").select("id").eq("email", body.email).execute()
    if existing.data:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed = hash_password(body.password)
    # Never trust client-supplied role — new accounts are viewers only
    result = db.table("users").insert({
        "email": body.email,
        "password_hash": hashed,
        "full_name": body.full_name,
        "role": "viewer",
    }).execute()

    user = result.data[0]
    token = create_access_token({"sub": user["id"], "email": user["email"], "role": user["role"]})
    return {"access_token": token, "user": {"id": user["id"], "email": user["email"], "full_name": user["full_name"], "role": user["role"]}}


@router.post("/login", response_model=TokenResponse)
async def login(form: OAuth2PasswordRequestForm = Depends()):
    """OAuth2 form login (username = email) for Swagger / token clients."""
    return _login_with_email(form.username, form.password)


@router.post("/login/json", response_model=TokenResponse)
async def login_json(body: LoginRequest):
    """JSON login for the React frontend."""
    return _login_with_email(body.email, body.password)


def _login_with_email(email: str, password: str) -> dict:
    db = get_supabase()
    result = db.table("users").select("*").eq("email", email).execute()

    if not result.data:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    user = result.data[0]
    if not verify_password(password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token({"sub": user["id"], "email": user["email"], "role": user["role"]})
    return {"access_token": token, "user": {"id": user["id"], "email": user["email"], "full_name": user["full_name"], "role": user["role"]}}


@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    db = get_supabase()
    result = db.table("users").select("id, email, full_name, role, created_at").eq("id", current_user["sub"]).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="User not found")
    return result.data[0]


@router.post("/logout")
async def logout():
    # JWT is stateless; client drops the token
    return {"message": "Logged out successfully"}
