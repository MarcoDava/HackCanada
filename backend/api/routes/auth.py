import base64
import json
import secrets
import httpx
from fastapi import APIRouter, Request, Depends, HTTPException, Header
from fastapi.responses import JSONResponse, RedirectResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from authlib.integrations.starlette_client import OAuth
from jose import jwt, JWTError
from datetime import datetime, timedelta
from typing import Optional
from config import settings
from services.graph.builder import make_id

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
    except JWTError as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")


def get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> dict:
    if credentials is None:
        raise HTTPException(status_code=401, detail="Authorization header missing")
    
    token = credentials.credentials
    payload = decode_token(token)
    
    if payload.get("type") != "access":
        raise HTTPException(status_code=401, detail="Invalid token type")
    
    return {
        "id": payload["sub"],
        "email": payload["email"],
        "name": payload.get("name", ""),
        "picture": payload.get("picture", ""),
    }


def get_optional_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> Optional[dict]:
    """For endpoints that work with or without auth"""
    if credentials is None:
        return None
    try:
        return get_current_user(credentials)
    except HTTPException:
        return None


@router.get("/login")
async def login(request: Request):
    redirect_uri = request.url_for("auth_callback")

    return await oauth.auth0.authorize_redirect(
        request,
        redirect_uri,
    )


@router.post("/login/password")
async def login_password(request: Request):
    """
    Login with email/password via Auth0.
    Note: This uses Auth0's Resource Owner Password flow.
    For production, consider using Authorization Code + PKCE instead.
    """
    try:
        data = await request.json()
        email = data.get("email")
        password = data.get("password")

        if not email or not password:
            raise HTTPException(status_code=400, detail="Email and password required")

        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"https://{settings.auth0_domain}/oauth/token",
                data={
                    "grant_type": "http://auth0.com/oauth/grant-type/password-realm",
                    "username": email,
                    "password": password,
                    "audience": f"https://{settings.auth0_domain}/userinfo",
                    "client_id": settings.auth0_client_id,
                    "client_secret": settings.auth0_client_secret,
                    "realm": "Username-Password-Authentication",
                    "scope": "openid profile email offline_access"
                }
            )
            
            if resp.status_code != 200:
                json_data = resp.json()
                print(f"Auth0 Login Error: {json_data}")
                error_detail = json_data.get("error_description") or json_data.get("description") or "Invalid credentials"
                raise HTTPException(status_code=401, detail=error_detail)
            
            token_data = resp.json()
            
            userinfo_resp = await client.get(
                f"https://{settings.auth0_domain}/userinfo",
                headers={"Authorization": f"Bearer {token_data['access_token']}"}
            )
            
            if userinfo_resp.status_code == 200:
                userinfo = userinfo_resp.json()
                name = userinfo.get("name", email.split("@")[0])
                picture = userinfo.get("picture", "")
            else:
                name = email.split("@")[0]
                picture = ""
            
            user = {
                "id": make_id("", email),
                "email": email,
                "name": name,
                "picture": picture
            }
            
            access_token = create_access_token(user)
            refresh_token = create_refresh_token(user)
            
            return {
                "access_token": access_token,
                "refresh_token": refresh_token,
                "token_type": "bearer",
                "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60,
                "user": user
            }
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/signup")
async def signup(request: Request):
    try:
        data = await request.json()
        email = data.get("email")
        password = data.get("password")
        name = data.get("name")

        if not email or not password or not name:
            raise HTTPException(status_code=400, detail="Email, password, and name are required")

        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"https://{settings.auth0_domain}/dbconnections/signup",
                json={
                    "client_id": settings.auth0_client_id,
                    "email": email,
                    "password": password,
                    "connection": "Username-Password-Authentication",
                    "user_metadata": {"full_name": name}
                }
            )
            
            if resp.status_code != 200:
                json_data = resp.json()
                print(f"Auth0 Signup Error: {json_data}")
                error_detail = json_data.get("description") or json_data.get("message") or json_data.get("error") or "Signup failed"
                raise HTTPException(status_code=resp.status_code, detail=error_detail)
            
            user = {
                "id": make_id("", email),
                "email": email,
                "name": name,
                "picture": ""
            }
            
            access_token = create_access_token(user)
            refresh_token = create_refresh_token(user)
            
            return {
                "access_token": access_token,
                "refresh_token": refresh_token,
                "token_type": "bearer",
                "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60,
                "user": user,
                "message": "User created successfully"
            }
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/refresh")
async def refresh_token(request: Request):
    """Exchange a refresh token for a new access token"""
    try:
        data = await request.json()
        refresh_token = data.get("refresh_token")
        
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
        
        return {
            "access_token": new_access_token,
            "refresh_token": new_refresh_token,
            "token_type": "bearer",
            "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        }
        
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

    user_b64 = base64.urlsafe_b64encode(json.dumps(user).encode()).decode()
    redirect_url = f"{settings.frontend_url}/auth/callback?access_token={access_token}&refresh_token={refresh_token}&user={user_b64}"

    return RedirectResponse(url=redirect_url)


@router.get("/me")
def me(current_user: dict = Depends(get_current_user)):
    """Get current authenticated user info"""
    return current_user


@router.post("/logout")
def logout():
    return JSONResponse({"message": "Logged out successfully"})
