from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["auth"])

class UserRegistration(BaseModel):
    username: str
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

@router.post("/register")
async def register(user: UserRegistration):
    success = await AuthService.register_user(user.username, user.password)
    if not success:
        raise HTTPException(status_code=400, detail="Registration failed")
    return {"message": "User registered successfully"}

@router.post("/login")
async def login(user: UserLogin):
    token = await AuthService.login_user(user.username, user.password)
    if not token:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return {"access_token": token}
