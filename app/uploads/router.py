# app/uploads/router.py
import os
import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.models import User, Post
from app.auth.auth import get_current_user

router = APIRouter(prefix="/uploads", tags=["Uploads"])

# ── Directories ───────────────────────────────────────────────────
AVATAR_DIR = "app/static/avatars"
AUDIO_DIR  = "app/static/posts/audio"
IMAGE_DIR  = "app/static/posts/images"

for d in [AVATAR_DIR, AUDIO_DIR, IMAGE_DIR]:
    os.makedirs(d, exist_ok=True)

ALLOWED_IMAGES = {"image/jpeg", "image/png", "image/gif", "image/webp"}
ALLOWED_AUDIO  = {"audio/mpeg", "audio/mp3", "audio/wav", "audio/ogg", "audio/x-m4a"}
MAX_AUDIO_MB   = 10
MAX_IMAGE_MB   = 5


def _save_file(upload: UploadFile, directory: str, prefix: str) -> str:
    ext      = os.path.splitext(upload.filename)[-1].lower()
    filename = f"{prefix}_{uuid.uuid4().hex}{ext}"
    path     = os.path.join(directory, filename)
    with open(path, "wb") as f:
        f.write(upload.file.read())
    return filename


# ── Avatar upload ─────────────────────────────────────────────────
@router.post("/avatar")
def upload_avatar(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if file.content_type not in ALLOWED_IMAGES:
        raise HTTPException(status_code=400, detail="Only JPEG, PNG, GIF, WEBP allowed")

    # Delete old avatar if exists
    if current_user.avatar_url:
        old = os.path.join(AVATAR_DIR, os.path.basename(current_user.avatar_url))
        if os.path.exists(old):
            os.remove(old)

    filename = _save_file(file, AVATAR_DIR, current_user.username)
    url = f"/static/avatars/{filename}"

    current_user.avatar_url = url
    db.commit()
    db.refresh(current_user)
    return {"avatar_url": url, "message": "Avatar updated!"}


# ── Post image upload ─────────────────────────────────────────────
@router.post("/post/{post_id}/image")
def upload_post_image(
    post_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    if post.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your post")
    if file.content_type not in ALLOWED_IMAGES:
        raise HTTPException(status_code=400, detail="Only JPEG, PNG, GIF, WEBP allowed")

    content = file.file.read()
    if len(content) > MAX_IMAGE_MB * 1024 * 1024:
        raise HTTPException(status_code=400, detail=f"Image must be under {MAX_IMAGE_MB}MB")
    file.file.seek(0)

    filename = _save_file(file, IMAGE_DIR, f"post{post_id}")
    url = f"/static/posts/images/{filename}"

    post.image_url = url
    db.commit()
    return {"image_url": url, "message": "Post image updated!"}


# ── Post audio upload ─────────────────────────────────────────────
@router.post("/post/{post_id}/audio")
def upload_post_audio(
    post_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    if post.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your post")
    if file.content_type not in ALLOWED_AUDIO:
        raise HTTPException(status_code=400, detail="Only MP3, WAV, OGG, M4A allowed")

    content = file.file.read()
    if len(content) > MAX_AUDIO_MB * 1024 * 1024:
        raise HTTPException(status_code=400, detail=f"Audio must be under {MAX_AUDIO_MB}MB")
    file.file.seek(0)

    filename = _save_file(file, AUDIO_DIR, f"post{post_id}")
    url = f"/static/posts/audio/{filename}"

    post.audio_url = url
    db.commit()
    return {"audio_url": url, "message": "Audio uploaded!"}