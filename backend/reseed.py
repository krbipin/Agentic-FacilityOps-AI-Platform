from app.db import Base, SessionLocal, engine, init_db
from app.seed import seed

Base.metadata.drop_all(bind=engine)
init_db()
session = SessionLocal()
try:
    seed(session)
finally:
    session.close()
print("RESEED DONE")
