from fastapi import Request, HTTPException

def require_auth(request: Request):
    user = getattr(request.state, "user", None)
    if not user:
        raise HTTPException(status_code=401)
    return user

def require_admin(request: Request):
    user = require_auth(request)
    if user["role"] != "ADMIN":
        raise HTTPException(status_code=401, detail="Admin only")
    return user