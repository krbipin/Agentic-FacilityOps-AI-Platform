import os
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(exist_ok=True)

load_dotenv(BASE_DIR / ".env")

# PostgreSQL via DATABASE_URL (e.g. Neon); SQLite fallback for local dev.
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{(DATA_DIR / 'facilityops.db').as_posix()}")
# Force psycopg3 dialect so `postgresql://` URLs (Neon) work without psycopg2.
if DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg://", 1)

CORS_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
