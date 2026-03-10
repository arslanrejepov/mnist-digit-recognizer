# app/likes/router.py
# Toggle-like endpoint: liking an already-liked post removes the like (unlike)

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.db.database import get_db
from app.models.models import Like, Post, User
from app.schemas.schemas import LikeOut
from app.auth.auth import get_current_user

router = APIRouter(prefix="/posts/{post_id}/like", tags=["Likes"])


@router.post("/", response_model=LikeOut)
def toggle_like(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Toggle a like on a post.
    - If the user hasn't liked the post → add like.
    - If the user already liked the post → remove like (unlike).
    Returns the updated like count.
    """
    post = db.get(Post, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    # Check if like already exists
    existing = (
        db.query(Like)
        .filter(Like.user_id == current_user.id, Like.post_id == post_id)
        .first()
    )

    if existing:
        # Unlike
        db.delete(existing)
        db.commit()
        message = "Like removed"
    else:
        # Like
        like = Like(user_id=current_user.id, post_id=post_id)
        db.add(like)
        try:
            db.commit()
        except IntegrityError:
            # Race-condition guard — unique constraint already caught it
            db.rollback()
        message = "Post liked"

    # Re-fetch count after mutation
    like_count = db.query(Like).filter(Like.post_id == post_id).count()
    return LikeOut(message=message, post_id=post_id, like_count=like_count)