from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(exist_ok=True)

# SQLite by default; MySQL/Postgres via DATABASE_URL (SQLAlchemy dialect)
DATABASE_URL = f"sqlite:///{(DATA_DIR / 'facilityops.db').as_posix()}"

CORS_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
