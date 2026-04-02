# app/posts/router.py
# Endpoints for creating, reading, and deleting posts

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.models import Post, User
from app.schemas.schemas import PostCreate, PostOut
from app.auth.auth import get_current_user

router = APIRouter(prefix="/posts", tags=["Posts"])


@router.get("/feed", response_model=list[PostOut])
def home_feed(skip: int = 0, limit: int = 20, db: Session = Depends(get_db)):
    """
    Public home feed — returns the latest posts across all users.
    Supports basic pagination via skip/limit query params.
    """
    posts = (
        db.query(Post)
        .order_by(Post.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    for post in posts:
        post.like_count = len(post.likes)
        post.comment_count = len(post.comments)
    return posts


@router.post("/", response_model=PostOut, status_code=status.HTTP_201_CREATED)
def create_post(
    payload: PostCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new post. Requires authentication."""
    post = Post(content=payload.content, user_id=current_user.id)
    db.add(post)
    db.commit()
    db.refresh(post)

    # Initialise computed fields for the response
    post.like_count = 0
    post.comment_count = 0
    return post


@router.get("/{post_id}", response_model=PostOut)
def get_post(post_id: int, db: Session = Depends(get_db)):
    """Fetch a single post by its ID."""
    post = db.get(Post, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    post.like_count = len(post.likes)
    post.comment_count = len(post.comments)
    return post


@router.delete("/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Delete a post. Only the post's author can delete it.
    Returns 204 No Content on success.
    """
    post = db.get(Post, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    if post.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorised to delete this post")

    db.delete(post)
    db.commit()