import os
import sys
from sqlalchemy.orm import Session
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import engine, Base, SessionLocal
from app.models.domain import User, RoleEnum, CitizenReport, IssueCluster, PriorityScore
from app.utils.auth import get_password_hash

def seed_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    # 1. Create Users
    if not db.query(User).filter(User.email == "demo.admin@jansetu.ai").first():
        admin = User(
            full_name="Administrator Demo",
            email="demo.admin@jansetu.ai",
            password_hash=get_password_hash("admin123"),
            role=RoleEnum.ADMIN.value
        )
        db.add(admin)
        
    if not db.query(User).filter(User.email == "demo.citizen@jansetu.ai").first():
        citizen = User(
            full_name="Citizen Demo",
            email="demo.citizen@jansetu.ai",
            password_hash=get_password_hash("citizen123"),
            role=RoleEnum.CITIZEN.value
        )
        db.add(citizen)
        
    db.commit()

    # 2. Issue Clusters
    if db.query(IssueCluster).count() == 0:
        cluster1 = IssueCluster(
            name="Road Connectivity Issue - District X",
            category="Roads",
            state="Maharashtra",
            district="Pune",
            latitude=18.5204,
            longitude=73.8567,
            report_count=1284,
            severity_score=9.2,
            population_affected=83200,
            infrastructure_gap=91.0
        )
        db.add(cluster1)
        db.commit()
        db.refresh(cluster1)
        
        # Priority Score
        ps1 = PriorityScore(
            cluster_id=cluster1.id,
            citizen_demand_score=82.0,
            infrastructure_gap_score=91.0,
            population_impact_score=76.0,
            severity_score=90.0,
            investment_gap_score=70.0,
            final_score=82.7,
            priority_level="Critical"
        )
        db.add(ps1)
        
        # Synthetic Report
        citizen = db.query(User).filter(User.email == "demo.citizen@jansetu.ai").first()
        report = CitizenReport(
            user_id=citizen.id,
            original_text="The road in my area is completely broken and causes accidents daily.",
            language="English",
            category="Roads",
            issue_type="Broken Road",
            description="Severe potholes causing accidents",
            severity=9,
            urgency=8,
            state="Maharashtra",
            district="Pune",
            cluster_id=cluster1.id,
            status="Under Review",
            ai_confidence=0.95
        )
        db.add(report)
        db.commit()

    print("Database seeded successfully.")
    db.close()

if __name__ == "__main__":
    seed_db()
