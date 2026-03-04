from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from jose import JWTError
from auth.jwt import verify_token

EXCLUDED_PREFIXES = [
    "/auth/register",
    "/auth/login",
    "/files",
    "/reports",
    "/docs",
    "/openapi.json"
]

async def auth_middleware(request: Request, call_next):
    if request.method == "OPTIONS":
        return await call_next(request)
    
    if any(request.url.path.startswith(p) for p in EXCLUDED_PREFIXES):
        return await call_next(request)
    
    auth = request.headers.get("Authorization")

    if not auth or not auth.startswith("Bearer "):
        return JSONResponse(
            status_code=401,
            content={"detail": "Unauthorized"}
        )

    try:
        token = auth.split(" ", 1)[1]
        payload = verify_token(token)
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    request.state.user = {
        "username": payload["sub"],
        "role": payload["role"]
    }
    return await call_next(request)