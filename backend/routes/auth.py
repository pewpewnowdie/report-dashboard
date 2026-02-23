from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from auth.passwords import hash_password, verify_password
from auth.jwt import create_token
from pydantic import BaseModel, Field

from db.deps import get_db
from db.models.user import User


class RegisterRequest(BaseModel):
    username: str = Field(..., min_length=1)
    password: str = Field(..., min_length=5)

class LoginRequest(BaseModel):
    username: str
    password: str

router = APIRouter(prefix="/auth")

@router.post("/register")
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    username = payload.username
    password = payload.password

    existing = db.query(User).filter(User.username == username).first()
    if existing:
        raise HTTPException(status_code=409, detail="Username Exists")

    user = User(
        username=username,
        password_hash=hash_password(password),
        role="user"
    )

    db.add(user)
    db.commit()
    
    return {"status": "created"}


@router.post("/login")
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    username = payload.username
    password = payload.password

    user = db.query(User).filter(User.username == username).first()

    if not user or not verify_password(password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid Credentials")

    return {"access_token": create_token(user.username, user.role), "token_type": "bearer"}