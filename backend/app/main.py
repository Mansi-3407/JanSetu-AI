from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base, SessionLocal
from app.models.domain import User, RoleEnum, CitizenReport, IssueCluster, PriorityScore
from app.utils.auth import get_password_hash
from app.routers import auth, reports, admin, citizen
from sqlalchemy import text

# Ensure base tables exist
Base.metadata.create_all(bind=engine)

def ensure_schema_migrations():
    """Ensure newly introduced columns exist in SQLite/PostgreSQL"""
    with engine.connect() as conn:
        # Check SQLite or Postgres
        is_sqlite = engine.url.drivername.startswith("sqlite")
        if is_sqlite:
            # Check users
            cols_users = [row[1] for row in conn.execute(text("PRAGMA table_info(users)"))]
            if "address" not in cols_users:
                conn.execute(text("ALTER TABLE users ADD COLUMN address TEXT"))
            
            # Check citizen_reports
            cols_reports = [row[1] for row in conn.execute(text("PRAGMA table_info(citizen_reports)"))]
            if "citizen_name" not in cols_reports:
                conn.execute(text("ALTER TABLE citizen_reports ADD COLUMN citizen_name TEXT"))
            if "citizen_email" not in cols_reports:
                conn.execute(text("ALTER TABLE citizen_reports ADD COLUMN citizen_email TEXT"))
            if "citizen_phone" not in cols_reports:
                conn.execute(text("ALTER TABLE citizen_reports ADD COLUMN citizen_phone TEXT"))
            if "citizen_address" not in cols_reports:
                conn.execute(text("ALTER TABLE citizen_reports ADD COLUMN citizen_address TEXT"))
            conn.commit()

def seed_initial_users():
    db = SessionLocal()
    try:
        # 1. Admin
        if not db.query(User).filter(User.email == "demo.admin@jansetu.ai").first():
            admin_user = User(
                full_name="Administrator Demo",
                email="demo.admin@jansetu.ai",
                phone="+91 98111 22233",
                address="District Administrative Complex, Pune, Maharashtra",
                password_hash=get_password_hash("admin123"),
                role=RoleEnum.ADMIN.value,
                preferred_language="English"
            )
            db.add(admin_user)

        # 2. Citizen
        citizen_user = db.query(User).filter(User.email == "demo.citizen@jansetu.ai").first()
        if not citizen_user:
            citizen_user = User(
                full_name="Citizen Demo",
                email="demo.citizen@jansetu.ai",
                phone="+91 98765 43210",
                address="Plot 42, Green Avenue, Pune, Maharashtra - 411001",
                password_hash=get_password_hash("citizen123"),
                role=RoleEnum.CITIZEN.value,
                preferred_language="English"
            )
            db.add(citizen_user)
        else:
            if not citizen_user.address:
                citizen_user.address = "Plot 42, Green Avenue, Pune, Maharashtra - 411001"
            if not citizen_user.phone:
                citizen_user.phone = "+91 98765 43210"

        db.commit()
    finally:
        db.close()

try:
    ensure_schema_migrations()
    seed_initial_users()
except Exception as e:
    print(f"Startup setup notice: {e}")

app = FastAPI(title="JanSetu AI API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(reports.router)
app.include_router(admin.router)
app.include_router(citizen.router)

@app.get("/")
def root():
    return {"message": "Welcome to JanSetu AI API", "status": "active"}
