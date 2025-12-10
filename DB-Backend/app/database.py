from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from .config import settings

# IMPORTANT for Neon: ?sslmode=require must be in your URL
try:
    engine = create_engine(settings.database_url, pool_pre_ping=True)
    print(f"Database connection configured: {settings.database_url[:50]}...")
except Exception as e:
    print(f"ERROR: Failed to create database engine: {e}")
    raise

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()

print("Database module loaded successfully")

