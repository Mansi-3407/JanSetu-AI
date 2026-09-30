from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models.domain import User, CitizenReport, IssueCluster, Notification, IssueStatusHistory
from app.schemas.domain import ReportResponse, UserResponse, UserProfileUpdate, NotificationResponse
from app.routers.auth import get_current_user
from typing import List, Optional

router = APIRouter(prefix="/api/citizen", tags=["citizen"])

# Profile endpoints
@router.get("/profile", response_model=UserResponse)
def get_citizen_profile(current_user: User = Depends(get_current_user)):
    return current_user

@router.put("/profile", response_model=UserResponse)
def update_citizen_profile(
    profile_data: UserProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if profile_data.full_name is not None and profile_data.full_name.strip():
        current_user.full_name = profile_data.full_name.strip()
    if profile_data.phone is not None:
        current_user.phone = profile_data.phone.strip()
    if profile_data.address is not None:
        current_user.address = profile_data.address.strip()
    if profile_data.preferred_language is not None:
        current_user.preferred_language = profile_data.preferred_language.value

    db.commit()
    db.refresh(current_user)
    return current_user

# Dashboard endpoint
@router.get("/dashboard")
def get_dashboard(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # 1. Citizen Profile
    citizen = {
        "id": current_user.id,
        "full_name": current_user.full_name,
        "email": current_user.email,
        "phone": current_user.phone,
        "address": current_user.address,
        "preferred_language": current_user.preferred_language
    }

    # 2. Report Summary
    user_reports = db.query(CitizenReport).filter(CitizenReport.user_id == current_user.id).all()
    total_reports = len(user_reports)
    requiring_attention = len([r for r in user_reports if r.status not in ["Resolved"]])
    resolved_count = total_reports - requiring_attention

    # 3. Recent Reports (Latest 5)
    recent_reports_db = db.query(CitizenReport).filter(
        CitizenReport.user_id == current_user.id
    ).order_by(CitizenReport.created_at.desc()).limit(5).all()
    
    recent_reports = [
        {
            "id": r.id,
            "category": r.category,
            "issue_type": r.issue_type,
            "description": r.description,
            "severity": r.severity,
            "urgency": r.urgency,
            "location": f"{r.district}, {r.state}" if r.district else (r.citizen_address or "Unknown"),
            "citizen_address": r.citizen_address,
            "created_at": r.created_at,
            "status": r.status
        }
        for r in recent_reports_db
    ]

    # 4. Community Inference (Use citizen's address, latest report's district, or fallback to Pune)
    user_district = "Pune"
    if recent_reports_db and recent_reports_db[0].district:
        user_district = recent_reports_db[0].district
    elif current_user.address and "pune" in current_user.address.lower():
        user_district = "Pune"
    elif current_user.address and "satna" in current_user.address.lower():
        user_district = "Satna"

    # Active issues in community
    community_active = db.query(CitizenReport).filter(
        CitizenReport.district == user_district, 
        CitizenReport.status != "Resolved"
    ).count()
    
    # Nearby issue count (using clusters in same district)
    nearby_clusters = db.query(IssueCluster).filter(IssueCluster.district == user_district).all()
    nearby_issue_count = sum([c.report_count for c in nearby_clusters]) or community_active

    # 5. Community Categories (Top issues)
    category_counts = db.query(
        CitizenReport.category, 
        func.count(CitizenReport.id)
    ).filter(
        CitizenReport.district == user_district
    ).group_by(CitizenReport.category).all()

    if not category_counts:
        # Fallback to all reports if district has none yet
        category_counts = db.query(
            CitizenReport.category, 
            func.count(CitizenReport.id)
        ).group_by(CitizenReport.category).all()

    community_categories = [
        {"category": cat or "Roads & Infrastructure", "count": count} 
        for cat, count in category_counts
    ]
    community_categories = sorted(community_categories, key=lambda x: x["count"], reverse=True)[:5]

    # 6. Nearby Issues (Map data)
    nearby_issues = [
        {
            "id": c.id,
            "name": c.name,
            "category": c.category,
            "latitude": c.latitude,
            "longitude": c.longitude,
            "severity_score": c.severity_score,
            "report_count": c.report_count
        }
        for c in nearby_clusters
    ]

    # 7. Notifications
    user_notifications = db.query(Notification).filter(
        Notification.user_id == current_user.id
    ).order_by(Notification.created_at.desc()).limit(10).all()
    
    notifications = [
        {
            "id": n.id,
            "title": n.title,
            "message": n.message,
            "type": n.type,
            "is_read": n.is_read,
            "created_at": n.created_at
        }
        for n in user_notifications
    ]
    unread_notifications = db.query(Notification).filter(
        Notification.user_id == current_user.id, 
        Notification.is_read == False
    ).count()

    # Fact-grounded insight
    top_issue = community_categories[0]["category"] if community_categories else "Roads & Infrastructure"
    insight = f"{top_issue}-related issues represent the largest volume of community reports in {user_district}."

    return {
        "citizen": citizen,
        "report_summary": {
            "total": total_reports,
            "requiring_attention": requiring_attention,
            "resolved": resolved_count
        },
        "recent_reports": recent_reports,
        "community_summary": {
            "district": user_district,
            "active_issues": community_active,
            "nearby_issue_count": nearby_issue_count,
            "insight": insight
        },
        "community_categories": community_categories,
        "nearby_issues": nearby_issues,
        "notifications": {
            "unread_count": unread_notifications,
            "recent": notifications
        }
    }

# All Reports for citizen
@router.get("/reports", response_model=List[ReportResponse])
def get_citizen_reports(
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    reports = db.query(CitizenReport).filter(
        CitizenReport.user_id == current_user.id
    ).order_by(CitizenReport.created_at.desc()).all()
    return reports

# Specific Report with timeline
@router.get("/reports/{id}", response_model=ReportResponse)
def get_citizen_report_detail(
    id: int, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    report = db.query(CitizenReport).filter(
        CitizenReport.id == id,
        CitizenReport.user_id == current_user.id
    ).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return report

# Notifications list & update
@router.get("/notifications", response_model=List[NotificationResponse])
def get_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(Notification).filter(
        Notification.user_id == current_user.id
    ).order_by(Notification.created_at.desc()).all()

@router.patch("/notifications/{id}/read")
def mark_notification_read(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    notif = db.query(Notification).filter(
        Notification.id == id,
        Notification.user_id == current_user.id
    ).first()
    if notif:
        notif.is_read = True
        db.commit()
    return {"status": "ok"}

@router.post("/notifications/read-all")
def mark_all_notifications_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).update({"is_read": True})
    db.commit()
    return {"status": "ok"}

# Community view data
@router.get("/community")
def get_community_data(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    district = "Pune"
    last_report = db.query(CitizenReport).filter(CitizenReport.user_id == current_user.id).order_by(CitizenReport.created_at.desc()).first()
    if last_report and last_report.district:
        district = last_report.district

    clusters = db.query(IssueCluster).filter(IssueCluster.district == district).all()
    if not clusters:
        clusters = db.query(IssueCluster).all()

    reports = db.query(CitizenReport).filter(CitizenReport.district == district).all()
    if not reports:
        reports = db.query(CitizenReport).all()

    category_counts = db.query(
        CitizenReport.category, 
        func.count(CitizenReport.id)
    ).filter(CitizenReport.district == district).group_by(CitizenReport.category).all()

    return {
        "district": district,
        "total_community_reports": len(reports),
        "active_clusters": [
            {
                "id": c.id,
                "name": c.name,
                "category": c.category,
                "report_count": c.report_count,
                "severity_score": c.severity_score,
                "population_affected": c.population_affected,
                "infrastructure_gap": c.infrastructure_gap
            }
            for c in clusters
        ],
        "categories": [{"category": c[0], "count": c[1]} for c in category_counts]
    }
