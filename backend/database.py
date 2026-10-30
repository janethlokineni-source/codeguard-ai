import os
import time
import logging
from typing import Optional, Dict, Any
from urllib.parse import urlparse
from dotenv import load_dotenv

from sqlalchemy import (
    create_engine,
    Column,
    Integer,
    String,
    Text,
    Boolean,
    DateTime,
    ForeignKey,
    text,
)
from sqlalchemy.orm import declarative_base, sessionmaker, relationship
from datetime import datetime

# Load environment variables from .env
load_dotenv()

logger = logging.getLogger("clyro.database")

# Default PostgreSQL Connection String (supports local or cloud e.g. Supabase, Neon)
DEFAULT_DB_URL = "postgresql://postgres:postgres@localhost:5432/major_projects_db"
DATABASE_URL = os.getenv("DATABASE_URL", DEFAULT_DB_URL)

# SQLAlchemy synchronous engine for stability on Windows
engine = None
SessionLocal = None
Base = declarative_base()

# ==============================================================================
# DATABASE MODELS
# ==============================================================================

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=True)
    full_name = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_login = Column(DateTime, default=datetime.utcnow)

    scans = relationship("ProjectScan", back_populates="user", cascade="all, delete-orphan")


class ProjectScan(Base):
    __tablename__ = "project_scans"

    id = Column(String(64), primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    project_name = Column(String(255), default="Untitled Project")
    health_score = Column(Integer, default=100)
    total_files = Column(Integer, default=0)
    total_issues = Column(Integer, default=0)
    critical_count = Column(Integer, default=0)
    high_count = Column(Integer, default=0)
    medium_count = Column(Integer, default=0)
    low_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="scans")
    issues = relationship("ScanIssue", back_populates="scan", cascade="all, delete-orphan")


class ScanIssue(Base):
    __tablename__ = "scan_issues"

    id = Column(String(64), primary_key=True, index=True)
    scan_id = Column(String(64), ForeignKey("project_scans.id"), index=True)
    file_path = Column(String(512), nullable=False)
    line_number = Column(Integer, nullable=False)
    severity = Column(String(32), default="Medium")
    category = Column(String(32), default="Quality")
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    suggested_fix = Column(Text, nullable=True)
    is_applied = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    scan = relationship("ProjectScan", back_populates="issues")


# ==============================================================================
# INITIALIZATION & CONNECTION CHECKING
# ==============================================================================

def get_engine(db_url: Optional[str] = None):
    global engine, SessionLocal
    target_url = db_url or DATABASE_URL
    if not target_url:
        return None

    # Handle psycopg2 URL scheme compatibility
    if target_url.startswith("postgres://"):
        target_url = target_url.replace("postgres://", "postgresql://", 1)

    try:
        engine = create_engine(
            target_url,
            pool_pre_ping=True,
            pool_recycle=300,
            pool_size=5,
            max_overflow=10,
            connect_args={"connect_timeout": 3},
        )
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        return engine
    except Exception as e:
        logger.warning(f"Could not initialize engine for {target_url}: {e}")
        return None


def init_db() -> Dict[str, Any]:
    """Attempts to connect to PostgreSQL and create tables if connected."""
    eng = get_engine()
    if not eng:
        return {"connected": False, "error": "No database URL configured"}

    try:
        with eng.connect() as conn:
            conn.execute(text("SELECT 1"))
        # Create all tables if they don't exist
        Base.metadata.create_all(bind=eng)
        logger.info("PostgreSQL database tables initialized successfully.")
        return {"connected": True, "tables_created": True}
    except Exception as e:
        logger.warning(f"PostgreSQL connection offline or unavailable: {e}")
        return {"connected": False, "error": str(e)}


def check_db_connection(db_url: Optional[str] = None) -> Dict[str, Any]:
    """Detailed health check of PostgreSQL connection."""
    target_url = db_url or DATABASE_URL
    start_t = time.time()

    parsed = urlparse(target_url)
    db_info = {
        "host": parsed.hostname or "localhost",
        "port": parsed.port or 5432,
        "database": parsed.path.lstrip("/") or "major_projects_db",
        "user": parsed.username or "postgres",
    }

    try:
        eng = create_engine(
            target_url,
            connect_args={"connect_timeout": 3},
            pool_pre_ping=True,
        )
        with eng.connect() as conn:
            res = conn.execute(text("SELECT version()")).fetchone()
            latency_ms = round((time.time() - start_t) * 1000, 2)
            version_str = res[0] if res else "PostgreSQL"

            # Check counts
            user_count = 0
            scan_count = 0
            try:
                user_count = conn.execute(text("SELECT COUNT(*) FROM users")).scalar() or 0
                scan_count = conn.execute(text("SELECT COUNT(*) FROM project_scans")).scalar() or 0
            except Exception:
                pass

            return {
                "connected": True,
                "latency_ms": latency_ms,
                "version": version_str,
                "details": db_info,
                "counts": {
                    "users": user_count,
                    "scans": scan_count,
                },
            }
    except Exception as e:
        return {
            "connected": False,
            "error": str(e),
            "details": db_info,
            "hint": (
                "PostgreSQL service is not running locally on port 5432 or credentials are invalid. "
                "You can connect any remote PostgreSQL URL (Supabase, Neon, AWS RDS, Railway) by setting DATABASE_URL."
            ),
        }


def get_db():
    """FastAPI dependency for database sessions."""
    if not SessionLocal:
        get_engine()
    if not SessionLocal:
        yield None
        return

    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
