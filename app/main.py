# app/main.py
# Application entry point — assembles all routers and initialises the DB

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db.database import Base, engine

# Import models so SQLAlchemy registers them before creating tables
import app.models.models  # noqa: F401

# Import all routers
from app.auth.router import router as auth_router
from app.users.router import router as users_router
from app.posts.router import router as posts_router
from app.comments.router import router as comments_router
from app.likes.router import router as likes_router

# ── Create all database tables ────────────────────────────────────────────────
# In production you'd use Alembic migrations instead
Base.metadata.create_all(bind=engine)

# ── FastAPI app ───────────────────────────────────────────────────────────────
app = FastAPI(
    title="Social Media API",
    description="Minimal social media backend — posts, comments, likes, and JWT auth.",
    version="1.0.0",
)

# Allow all origins for local development; tighten in production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Register routers ──────────────────────────────────────────────────────────
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(posts_router)
app.include_router(comments_router)
app.include_router(likes_router)


@app.get("/", tags=["Health"])
def health_check():
    """Simple health-check endpoint."""
    return {"status": "ok", "message": "Social Media API is running"}