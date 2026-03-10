# app/db/database.py
# Handles SQLite connection and provides a reusable session dependency

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

# SQLite file-based database — stored in the project root
DATABASE_URL = "sqlite:///./social_media.db"

# connect_args is required for SQLite to allow multi-threaded access
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False}
)

# Each request gets its own session via this factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


# Base class for all SQLAlchemy models
class Base(DeclarativeBase):
    pass


# Dependency injected into route handlers via FastAPI's Depends()
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()