# app/users/router.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.models import User, Post, Follow
from app.schemas.schemas import UserCreate, UserOut, PostOut, FollowOut
from app.auth.auth import hash_password, get_current_user

router = APIRouter(prefix="/users", tags=["Users"])


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register(payload: UserCreate, db: Session = Depends(get_db)):
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
    return current_user


@router.get("/{username}", response_model=UserOut)
def get_user_profile(username: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.get("/{username}/posts", response_model=list[PostOut])
def get_user_posts(username: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    posts = (
        db.query(Post)
        .filter(Post.user_id == user.id)
        .order_by(Post.created_at.desc())
        .all()
    )
    for post in posts:
        post.like_count = len(post.likes)
        post.comment_count = len(post.comments)
    return posts


@router.post("/{username}/follow", response_model=FollowOut)
def follow_user(
    username: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Follow a user. If already following, unfollow (toggle)."""
    target = db.query(User).filter(User.username == username).first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    if target.id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot follow yourself")

    existing = db.query(Follow).filter(
        Follow.follower_id == current_user.id,
        Follow.followed_id == target.id,
    ).first()

    if existing:
        # Unfollow
        db.delete(existing)
        db.commit()
        return FollowOut(
            following=False,
            follower_count=len(target.followers) - 1,
            message=f"Unfollowed @{username}",
        )
    else:
        # Follow
        follow = Follow(follower_id=current_user.id, followed_id=target.id)
        db.add(follow)
        db.commit()
        return FollowOut(
            following=True,
            follower_count=len(target.followers) + 1,
            message=f"Now following @{username}",
        )


@router.get("/{username}/followers", response_model=list[UserOut])
def get_followers(username: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return [f.follower for f in user.followers]


@router.get("/{username}/following", response_model=list[UserOut])
def get_following(username: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return [f.followed for f in user.following]