from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session

from auth.jwt import verify_token
from db.deps import get_db
from db.models.user import User
from fastapi.security import OAuth2PasswordBearer

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try:
        payload = verify_token(token)
    except ValueError:
        raise HTTPException(
            status_code=401,
            detail="Invalid Token"
        )
    
    username = payload.get("sub")
    if not username:
        raise HTTPException(status_code=401, detail="Invalid token payload")
    
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    return user