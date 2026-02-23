from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class RegisterRequest(BaseModel):
    username: str = Field(..., min_length=1)
    password: str = Field(..., min_length=5)

class LoginRequest(BaseModel):
    username: str
    password: str
