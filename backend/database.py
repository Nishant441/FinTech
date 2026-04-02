"""
Database Configuration for FinSight Engine.
Uses SQLite for simple, file-based storage of financial records and file metadata.
"""
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Database path is relative to the backend/ execution context
SQLALCHEMY_DATABASE_URL = "sqlite:///./finsight.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
