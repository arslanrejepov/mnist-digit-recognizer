# app/schemas/schemas.py
# Pydantic v2 schemas used for request validation and response serialization

from datetime import datetime
from pydantic import BaseModel, EmailStr, field_validator


# ──────────────────────────────────────────
# AUTH
# ──────────────────────────────────────────

class Token(BaseModel):
    """JWT access token returned after login."""
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    """Decoded payload stored inside the JWT."""
    user_id: int | None = None


# ──────────────────────────────────────────
# USER
# ──────────────────────────────────────────

class UserCreate(BaseModel):
    """Fields required to register a new user."""
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
    """Public user data returned in responses (never includes password)."""
    id: int
    username: str
    email: str
    created_at: datetime

    model_config = {"from_attributes": True}


# ──────────────────────────────────────────
# POST
# ──────────────────────────────────────────

class PostCreate(BaseModel):
    """Payload to create a new post."""
    content: str

    @field_validator("content")
    @classmethod
    def content_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Post content cannot be empty")
        return v


class PostOut(BaseModel):
    """Post data returned in responses, includes author info and counts."""
    id: int
    content: str
    created_at: datetime
    user_id: int
    author: UserOut
    like_count: int = 0
    comment_count: int = 0

    model_config = {"from_attributes": True}


# ──────────────────────────────────────────
# COMMENT
# ──────────────────────────────────────────

class CommentCreate(BaseModel):
    """Payload to add a comment to a post."""
    content: str

    @field_validator("content")
    @classmethod
    def content_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Comment content cannot be empty")
        return v


class CommentOut(BaseModel):
    """Comment data returned in responses."""
    id: int
    content: str
    created_at: datetime
    user_id: int
    post_id: int
    author: UserOut

    model_config = {"from_attributes": True}


# ──────────────────────────────────────────
# LIKE
# ──────────────────────────────────────────

class LikeOut(BaseModel):
    """Confirmation response after liking a post."""
    message: str
    post_id: int
    like_count: int

class CommentResponse(BaseModel):
    id: int
    content: str

    class Config:
        from_attributes = True  # if using Pydantic v2