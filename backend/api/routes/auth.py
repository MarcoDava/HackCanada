import secrets
import logging
from fastapi import APIRouter, Request, Depends, HTTPException
from fastapi.responses import JSONResponse, RedirectResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from authlib.integrations.starlette_client import OAuth
from jose import jwt, JWTError
from datetime import datetime, timedelta
from typing import Optional
from slowapi import Limiter
from slowapi.util import get_remote_address
from config import settings
from services.graph.builder import make_id

logger = logging.getLogger(__name__)
limiter = Limiter(key_func=get_remote_address)

router = APIRouter(prefix="/auth", tags=["auth"])

security = HTTPBearer(auto_error=False)

oauth = OAuth()

oauth.register(
    name="auth0",
    client_id=settings.auth0_client_id,
    client_secret=settings.auth0_client_secret,
    server_metadata_url=f"https://{settings.auth0_domain}/.well-known/openid-configuration",
    client_kwargs={
        "scope": "openid email profile offline_access",
        "code_challenge_method": "S256",
    },
)

ACCESS_TOKEN_EXPIRE_MINUTES = 15
REFRESH_TOKEN_EXPIRE_DAYS = 7
ACCESS_COOKIE_NAME = "networkify_access_token"
REFRESH_COOKIE_NAME = "networkify_refresh_token"


def _use_secure_cookies() -> bool:
    return settings.frontend_url.startswith("https://")


def _set_auth_cookies(response, access_token: str, refresh_token: str) -> None:
    secure = _use_secure_cookies()
    response.set_cookie(
        key=ACCESS_COOKIE_NAME,
        value=access_token,
        httponly=True,
        secure=secure,
        samesite="none" if secure else "lax",
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/",
    )
    response.set_cookie(
        key=REFRESH_COOKIE_NAME,
        value=refresh_token,
        httponly=True,
        secure=secure,
        samesite="none" if secure else "lax",
        max_age=REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
        path="/",
    )


def _clear_auth_cookies(response) -> None:
    secure = _use_secure_cookies()
    response.delete_cookie(
        key=ACCESS_COOKIE_NAME,
        httponly=True,
        secure=secure,
        samesite="none" if secure else "lax",
        path="/",
    )
    response.delete_cookie(
        key=REFRESH_COOKIE_NAME,
        httponly=True,
        secure=secure,
        samesite="none" if secure else "lax",
        path="/",
    )


def create_access_token(user: dict, expires_delta: Optional[timedelta] = None) -> str:
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    payload = {
        "sub": user["id"],
        "email": user["email"],
        "name": user.get("name", ""),
        "picture": user.get("picture", ""),
        "type": "access",
        "exp": expire,
        "iat": datetime.utcnow(),
    }
    return jwt.encode(payload, settings.app_secret_key, algorithm="HS256")


def create_refresh_token(user: dict) -> str:
    expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    payload = {
        "sub": user["id"],
        "email": user["email"],
        "type": "refresh",
        "exp": expire,
        "iat": datetime.utcnow(),
        "jti": secrets.token_hex(16),
    }
    return jwt.encode(payload, settings.app_secret_key, algorithm="HS256")


def decode_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, settings.app_secret_key, algorithms=["HS256"])
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")


def get_current_user(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> dict:
    token = credentials.credentials if credentials is not None else request.cookies.get(ACCESS_COOKIE_NAME)
    if not token:
        raise HTTPException(status_code=401, detail="Authentication required")

    payload = decode_token(token)
    
    if payload.get("type") != "access":
        raise HTTPException(status_code=401, detail="Invalid token type")
    
    return {
        "id": payload["sub"],
        "email": payload["email"],
        "name": payload.get("name", ""),
        "picture": payload.get("picture", ""),
    }


def get_optional_user(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> Optional[dict]:
    """For endpoints that work with or without auth"""
    if credentials is None and not request.cookies.get(ACCESS_COOKIE_NAME):
        return None
    try:
        return get_current_user(request, credentials)
    except HTTPException:
        return None


@router.get("/login")
async def login(request: Request):
    redirect_uri = request.url_for("auth_callback")

    return await oauth.auth0.authorize_redirect(
        request,
        redirect_uri,
    )



@router.post("/refresh")
@limiter.limit("10/minute")
async def refresh_token(request: Request):
    """Exchange a refresh token for a new access token"""
    try:
        refresh_token = request.cookies.get(REFRESH_COOKIE_NAME)
        
        if not refresh_token:
            raise HTTPException(status_code=400, detail="Refresh token required")
        
        payload = decode_token(refresh_token)
        
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
        
        user = {
            "id": payload["sub"],
            "email": payload["email"],
            "name": "",
            "picture": ""
        }
        
        new_access_token = create_access_token(user)
        new_refresh_token = create_refresh_token(user)
        
        response = JSONResponse({
            "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        })
        _set_auth_cookies(response, new_access_token, new_refresh_token)
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid refresh token")


@router.get("/callback", name="auth_callback")
async def auth_callback(request: Request):
    token = await oauth.auth0.authorize_access_token(request)
    user_info = token.get("userinfo") or {}

    email = user_info.get("email", "")
    user = {
        "id": make_id("", email),
        "email": email,
        "name": user_info.get("name", ""),
        "picture": user_info.get("picture", ""),
    }

    access_token = create_access_token(user)
    refresh_token = create_refresh_token(user)

    redirect_url = f"{settings.frontend_url.rstrip('/')}/auth/callback"
    response = RedirectResponse(url=redirect_url)
    _set_auth_cookies(response, access_token, refresh_token)
    return response


@router.get("/me")
def me(current_user: dict = Depends(get_current_user)):
    """Get current authenticated user info"""
    return current_user


@router.post("/logout")
def logout():
    response = JSONResponse({"message": "Logged out successfully"})
    _clear_auth_cookies(response)
    return response
