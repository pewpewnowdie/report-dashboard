from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class RegisterRequest(BaseModel):
    username: str = Field(..., min_length=1)
    password: str = Field(..., min_length=5)

class LoginRequest(BaseModel):
    username: str
    password: str

class TestStartRequest(BaseModel):
    run_name: str
    host: str
    jmeter_version: str
    jmx_hash: str
    start_time: datetime
    project_key: str
    release: str

class TestStartResponse(BaseModel):
    run_id: str
    upload_token: str
    server_time: datetime

class TestStopMetadata(BaseModel):
    exit_code : int
    duration : str
    v_users: int
    avg_response_time: str
    error_rate: str
    throughput: str
    run_status: str
    script_name: str
    artifacts : dict
