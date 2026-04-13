# app/users/router.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.models import User, Post, Follow
from app.schemas.schemas import UserCreate, UserOut, PostOut, FollowOut
from app.auth.auth import hash_password, get_current_user

router = APIRouter(prefix="/users", tags=["Users"])


def _attach_counts(user: User) -> User:
    """Attach follower/following counts as plain attributes for Pydantic."""
    user.follower_count  = len(user.followers)
    user.following_count = len(user.following)
    return user


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
    return _attach_counts(user)


# ── Fixed routes BEFORE /{username} ───────────────────────────────

@router.get("/", response_model=list[UserOut])
def list_users(db: Session = Depends(get_db)):
    users = db.query(User).order_by(User.created_at.desc()).all()
    return [_attach_counts(u) for u in users]


@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return _attach_counts(current_user)


# ── Dynamic routes ─────────────────────────────────────────────────

@router.get("/{username}", response_model=UserOut)
def get_user_profile(username: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return _attach_counts(user)


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
        post.like_count    = len(post.likes)
        post.comment_count = len(post.comments)
        _attach_counts(post.author)
    return posts


@router.post("/{username}/follow", response_model=FollowOut)
def follow_user(
    username: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    target = db.query(User).filter(User.username == username).first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    if target.id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot follow yourself")

    existing = db.query(Follow).filter(
        Follow.follower_id == current_user.id,
        Follow.followed_id == target.id,
    ).first()

    db.refresh(target)
    count = len(target.followers)

    if existing:
        db.delete(existing)
        db.commit()
        return FollowOut(following=False, follower_count=max(0, count - 1), message=f"Unfollowed @{username}")
    else:
        db.add(Follow(follower_id=current_user.id, followed_id=target.id))
        db.commit()
        return FollowOut(following=True, follower_count=count + 1, message=f"Now following @{username}")


@router.get("/{username}/followers", response_model=list[UserOut])
def get_followers(username: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return [_attach_counts(f.follower) for f in user.followers]


@router.get("/{username}/following", response_model=list[UserOut])
def get_following(username: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return [_attach_counts(f.followed) for f in user.following]