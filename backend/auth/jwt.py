from jose import jwt
from datetime import datetime, timedelta
import os

SECRET = os.getenv("JMCTL_JWT_SECRET", "7ff37d733e552adf1558bd5bd1590574b2772585c36a5982c35c4ac9ee7ccf9a")
ALGO = "HS256"
TTL_DAYS = int(os.getenv("JMCTL_JWT_TTL_DAYS", "30"))

def create_token(username: str, role: str):
    payload = {
        "sub": username,
        "role": role,
        "exp": int((datetime.utcnow() + timedelta(days=TTL_DAYS)).timestamp())
    }
    return jwt.encode(payload, SECRET, algorithm=ALGO)

def verify_token(token: str):
    return jwt.decode(token, SECRET, algorithms=[ALGO])

