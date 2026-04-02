from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.middleware.sessions import SessionMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from dotenv import load_dotenv

from api.routes import upload, search, graph, enrich, messages, auth
from config import settings

load_dotenv()

limiter = Limiter(key_func=get_remote_address)
app = FastAPI(title="LinkedIn Networkify API", version="1.0.0")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    SessionMiddleware,
    secret_key=settings.app_secret_key
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url.rstrip("/")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload.router,   prefix="/api/upload",   tags=["Upload"])
app.include_router(search.router,   prefix="/api/search",   tags=["Search"])
app.include_router(graph.router,    prefix="/api/graph",    tags=["Graph"])
app.include_router(enrich.router,   prefix="/api/enrich",   tags=["Enrich"])
app.include_router(messages.router, prefix="/api/messages", tags=["Messages"])
app.include_router(auth.router)

@app.get("/health")
def health():
    return {"status": "ok"}
