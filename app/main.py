# app/main.py
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.db.database import Base, engine
import app.models.models  # noqa: F401

from app.auth.router     import router as auth_router
from app.users.router    import router as users_router
from app.posts.router    import router as posts_router
from app.comments.router import router as comments_router
from app.likes.router    import router as likes_router
from app.uploads.router  import router as uploads_router

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="SeS API",
    description="Singing Social Media Backend",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Serve uploaded files as static ────────────────────────────────
os.makedirs("app/static", exist_ok=True)
app.mount("/static", StaticFiles(directory="app/static"), name="static")

# ── Routers ───────────────────────────────────────────────────────
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(posts_router)
app.include_router(comments_router)
app.include_router(likes_router)
app.include_router(uploads_router)


@app.get("/", tags=["Health"])
def health_check():
    return {"status": "ok", "message": "SeS API is running 🎤"}