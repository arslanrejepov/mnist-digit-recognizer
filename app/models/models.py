# app/models/models.py
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.db.database import Base


class User(Base):
    __tablename__ = "users"

    id              = Column(Integer, primary_key=True, index=True)
    username        = Column(String(50), unique=True, nullable=False, index=True)
    email           = Column(String(100), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    avatar_url      = Column(String(500), nullable=True, default=None)
    created_at      = Column(DateTime, default=datetime.utcnow)

    posts     = relationship("Post",    back_populates="author",  cascade="all, delete-orphan")
    comments  = relationship("Comment", back_populates="author",  cascade="all, delete-orphan")
    likes     = relationship("Like",    back_populates="user",    cascade="all, delete-orphan")
    following = relationship("Follow",  foreign_keys="Follow.follower_id", back_populates="follower", cascade="all, delete-orphan")
    followers = relationship("Follow",  foreign_keys="Follow.followed_id", back_populates="followed", cascade="all, delete-orphan")


class Post(Base):
    __tablename__ = "posts"

    id         = Column(Integer, primary_key=True, index=True)
    content    = Column(Text, nullable=False)
    audio_url  = Column(String(500), nullable=True, default=None)
    image_url  = Column(String(500), nullable=True, default=None)
    created_at = Column(DateTime, default=datetime.utcnow)
    user_id    = Column(Integer, ForeignKey("users.id"), nullable=False)

    author   = relationship("User",    back_populates="posts")
    comments = relationship("Comment", back_populates="post", cascade="all, delete-orphan")
    likes    = relationship("Like",    back_populates="post", cascade="all, delete-orphan")


class Comment(Base):
    __tablename__ = "comments"

    id         = Column(Integer, primary_key=True, index=True)
    content    = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    user_id    = Column(Integer, ForeignKey("users.id"), nullable=False)
    post_id    = Column(Integer, ForeignKey("posts.id"), nullable=False)

    author = relationship("User", back_populates="comments")
    post   = relationship("Post", back_populates="comments")


class Like(Base):
    __tablename__ = "likes"

    id         = Column(Integer, primary_key=True, index=True)
    user_id    = Column(Integer, ForeignKey("users.id"), nullable=False)
    post_id    = Column(Integer, ForeignKey("posts.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (UniqueConstraint("user_id", "post_id", name="uq_user_post_like"),)

    user = relationship("User", back_populates="likes")
    post = relationship("Post", back_populates="likes")


class Follow(Base):
    __tablename__ = "follows"

    id          = Column(Integer, primary_key=True, index=True)
    follower_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    followed_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at  = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (UniqueConstraint("follower_id", "followed_id", name="uq_follow"),)

    follower = relationship("User", foreign_keys=[follower_id], back_populates="following")
    followed = relationship("User", foreign_keys=[followed_id], back_populates="followers")