import base64
import json
from fastapi import APIRouter, Request, Depends, HTTPException
from fastapi.responses import JSONResponse, RedirectResponse
from fastapi.security import OAuth2PasswordBearer
from authlib.integrations.starlette_client import OAuth
from jose import jwt, JWTError
from datetime import datetime, timedelta
from config import settings

router = APIRouter(prefix="/auth", tags=["auth"])

oauth = OAuth()

oauth.register(
    name="auth0",
    client_id=settings.auth0_client_id,
    client_secret=settings.auth0_client_secret,
    server_metadata_url=f"https://{settings.auth0_domain}/.well-known/openid-configuration",
    client_kwargs={"scope": "openid email profile"},
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")


def create_access_token(user: dict):
    payload = {
        "sub": user["email"],
        "name": user.get("name", ""),
        "picture": user.get("picture", ""),
        "exp": datetime.utcnow() + timedelta(hours=2),
    }
    return jwt.encode(payload, settings.app_secret_key, algorithm="HS256")


def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, settings.app_secret_key, algorithms=["HS256"])
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")


@router.get("/login")
async def login(request: Request):
    redirect_uri = request.url_for("auth_callback")
    return await oauth.auth0.authorize_redirect(request, redirect_uri)


@router.get("/callback", name="auth_callback")
async def auth_callback(request: Request):
    token = await oauth.auth0.authorize_access_token(request)
    user_info = token.get("userinfo") or {}

    user = {
        "email": user_info.get("email", ""),
        "name": user_info.get("name", ""),
        "picture": user_info.get("picture", ""),
    }

    app_token = create_access_token(user)

    # Base64-encode user info for safe URL transport
    user_b64 = base64.urlsafe_b64encode(json.dumps(user).encode()).decode()
    redirect_url = f"{settings.frontend_url}/auth/callback?token={app_token}&user={user_b64}"
    return RedirectResponse(url=redirect_url)


@router.get("/me")
def me(current_user: dict = Depends(get_current_user)):
    return current_user


@router.post("/logout")
def logout():
    return JSONResponse({"message": "Logged out successfully"})