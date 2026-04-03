# app/schemas/schemas.py
from datetime import datetime
from pydantic import BaseModel, EmailStr, field_validator


# ── AUTH ──────────────────────────────────────────────────────────
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    user_id: int | None = None


# ── USER ──────────────────────────────────────────────────────────
class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str

    @field_validator("username")
    @classmethod
    def username_alphanumeric(cls, v: str) -> str:
        if not v.replace("_", "").isalnum():
            raise ValueError("Username must be alphanumeric (underscores allowed)")
        return v


class UserOut(BaseModel):
    id: int
    username: str
    email: str
    created_at: datetime

    model_config = {"from_attributes": True}


# ── FOLLOW ────────────────────────────────────────────────────────
class FollowOut(BaseModel):
    following: bool
    follower_count: int
    message: str


# ── POST ──────────────────────────────────────────────────────────
class PostCreate(BaseModel):
    content: str

    @field_validator("content")
    @classmethod
    def content_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Post content cannot be empty")
        return v


class PostOut(BaseModel):
    id: int
    content: str
    created_at: datetime
    user_id: int
    author: UserOut
    like_count: int = 0
    comment_count: int = 0

    model_config = {"from_attributes": True}


# ── COMMENT ───────────────────────────────────────────────────────
class CommentCreate(BaseModel):
    content: str

    @field_validator("content")
    @classmethod
    def content_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Comment content cannot be empty")
        return v


class CommentOut(BaseModel):
    id: int
    content: str
    created_at: datetime
    user_id: int
    post_id: int
    author: UserOut

    model_config = {"from_attributes": True}


class CommentResponse(BaseModel):
    id: int
    content: str

    model_config = {"from_attributes": True}


# ── LIKE ──────────────────────────────────────────────────────────
class LikeOut(BaseModel):
    message: str
    post_id: int
    like_count: int