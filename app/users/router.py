# app/users/router.py
# User registration and profile endpoints

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.models import User, Post
from app.schemas.schemas import UserCreate, UserOut, PostOut
from app.auth.auth import hash_password, get_current_user

router = APIRouter(prefix="/users", tags=["Users"])


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register(payload: UserCreate, db: Session = Depends(get_db)):
    """
    Register a new user account.
    Returns the created user (without password).
    """
    # Check for duplicate username / email
    if db.query(User).filter(User.username == payload.username).first():
        raise HTTPException(status_code=400, detail="Username already taken")
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        username=payload.username,
        email=payload.email,
        hashed_password=hash_password(payload.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    """Return the currently authenticated user's profile."""
    return current_user


@router.get("/{username}", response_model=UserOut)
def get_user_profile(username: str, db: Session = Depends(get_db)):
    """Return a public user profile by username."""
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.get("/{username}/posts", response_model=list[PostOut])
def get_user_posts(username: str, db: Session = Depends(get_db)):
    """
    Return all posts by a specific user (their profile feed),
    ordered newest first.
    """
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    posts = (
        db.query(Post)
        .filter(Post.user_id == user.id)
        .order_by(Post.created_at.desc())
        .all()
    )

    # Attach computed counts to each post
    for post in posts:
        post.like_count = len(post.likes)
        post.comment_count = len(post.comments)

    return posts