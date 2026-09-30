from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from app.database import get_db
from app.models.domain import (
    User, RoleEnum, CitizenReport, IssueCluster, PriorityScore, 
    Recommendation, InfrastructureIndicator, IssueStatusHistory, Notification,
    IssueStatusEnum
)
from app.schemas.domain import (
    ClusterResponse, PriorityScoreResponse, RecommendationResponse, 
    ReportResponse, ReportUpdate, InsightQuery, InsightResponse, NotificationResponse
)
from app.routers.auth import get_current_user
from app.ai.gemini import generate_recommendation_text, generate_civic_insight
from app.scoring.priority import calculate_priority_score
from typing import List, Optional
import json

router = APIRouter(prefix="/api/admin", tags=["admin"])

def get_admin_user(current_user: User = Depends(get_current_user)):
    if current_user.role != RoleEnum.ADMIN.value and current_user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Administrator permissions required")
    return current_user

# 1. Admin Overview KPIs & Charts
@router.get("/overview")
def get_overview(db: Session = Depends(get_db), admin: User = Depends(get_admin_user)):
    total_reports = db.query(CitizenReport).count()
    active_issues = db.query(CitizenReport).filter(CitizenReport.status != IssueStatusEnum.RESOLVED.value).count()
    resolved_issues = db.query(CitizenReport).filter(CitizenReport.status == IssueStatusEnum.RESOLVED.value).count()
    under_review_issues = db.query(CitizenReport).filter(CitizenReport.status == IssueStatusEnum.UNDER_REVIEW.value).count()
    high_critical_issues = db.query(CitizenReport).filter(CitizenReport.severity >= 4).count()
    total_clusters = db.query(IssueCluster).count()
    high_priority_areas = db.query(PriorityScore).filter(
        PriorityScore.priority_level.in_(["High", "Critical"])
    ).count()

    # Category breakdown
    category_counts = db.query(
        CitizenReport.category, 
        func.count(CitizenReport.id)
    ).group_by(CitizenReport.category).all()
    
    categories = [
        {"name": cat or "Other", "count": count}
        for cat, count in category_counts
    ]
    categories = sorted(categories, key=lambda x: x["count"], reverse=True)

    # Status distribution
    status_counts = db.query(
        CitizenReport.status,
        func.count(CitizenReport.id)
    ).group_by(CitizenReport.status).all()
    statuses = [{"status": s, "count": c} for s, c in status_counts]

    # Top Hotspots
    top_clusters = db.query(IssueCluster).order_by(IssueCluster.report_count.desc()).limit(5).all()
    hotspots = [
        {
            "id": c.id,
            "name": c.name,
            "category": c.category,
            "district": c.district,
            "report_count": c.report_count,
            "severity_score": c.severity_score,
            "infrastructure_gap": c.infrastructure_gap
        }
        for c in top_clusters
    ]

    return {
        "total_reports": total_reports,
        "active_issues": active_issues,
        "resolved_issues": resolved_issues,
        "under_review_issues": under_review_issues,
        "high_critical_issues": high_critical_issues,
        "total_clusters": total_clusters,
        "high_priority_areas": high_priority_areas,
        "categories": categories,
        "statuses": statuses,
        "hotspots": hotspots
    }

# 2. Citizen Reports Management (Admin)
@router.get("/reports", response_model=List[ReportResponse])
def get_all_reports(
    q: Optional[str] = Query(None, description="Search keyword in text, citizen name, address or issue"),
    category: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    severity: Optional[int] = Query(None),
    district: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    query = db.query(CitizenReport)

    if q and q.strip():
        term = f"%{q.strip()}%"
        query = query.filter(
            or_(
                CitizenReport.citizen_name.ilike(term),
                CitizenReport.original_text.ilike(term),
                CitizenReport.issue_type.ilike(term),
                CitizenReport.citizen_address.ilike(term),
                CitizenReport.district.ilike(term)
            )
        )

    if category and category != "All":
        query = query.filter(CitizenReport.category == category)

    if status and status != "All":
        query = query.filter(CitizenReport.status == status)

    if severity is not None and severity > 0:
        query = query.filter(CitizenReport.severity >= severity)

    if district and district != "All":
        query = query.filter(CitizenReport.district == district)

    return query.order_by(CitizenReport.created_at.desc()).all()

# Single report detail
@router.get("/reports/{id}", response_model=ReportResponse)
def get_report_detail(id: int, db: Session = Depends(get_db), admin: User = Depends(get_admin_user)):
    report = db.query(CitizenReport).filter(CitizenReport.id == id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Citizen report not found")
    return report

# 3. Status Management & Feedback Loop
@router.patch("/reports/{id}/status", response_model=ReportResponse)
def update_report_status(
    id: int, 
    update_data: ReportUpdate, 
    db: Session = Depends(get_db), 
    admin: User = Depends(get_admin_user)
):
    report = db.query(CitizenReport).filter(CitizenReport.id == id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Citizen report not found")
        
    old_status = report.status
    new_status = update_data.status.value if hasattr(update_data.status, "value") else str(update_data.status)
    report.status = new_status
    
    # 1. Record status history in database
    history = IssueStatusHistory(
        report_id=report.id,
        old_status=old_status,
        new_status=new_status,
        changed_by=f"Admin ({admin.full_name})",
        note=update_data.note or f"Status transitioned to {new_status} by administration."
    )
    db.add(history)

    # 2. Generate Notification for Citizen
    notif = Notification(
        user_id=report.user_id,
        title=f"Report Status Updated: {new_status}",
        message=f"Your complaint regarding '{report.issue_type}' has been updated to '{new_status}'. Note: {update_data.note or 'Action initiated by local authorities.'}",
        type="status_change"
    )
    db.add(notif)
    
    db.commit()
    db.refresh(report)
    return report

# Also support legacy route for backward compatibility
@router.patch("/issues/{id}/status", response_model=ReportResponse)
def update_issue_status_legacy(
    id: int, 
    update_data: ReportUpdate, 
    db: Session = Depends(get_db), 
    admin: User = Depends(get_admin_user)
):
    return update_report_status(id, update_data, db, admin)

# 4. Civic Map Data
@router.get("/map")
def get_civic_map_data(db: Session = Depends(get_db), admin: User = Depends(get_admin_user)):
    reports = db.query(CitizenReport).all()
    clusters = db.query(IssueCluster).all()

    report_points = [
        {
            "id": r.id,
            "type": "report",
            "citizen_name": r.citizen_name,
            "category": r.category,
            "issue_type": r.issue_type,
            "description": r.description,
            "severity": r.severity,
            "latitude": r.latitude or 18.5204,
            "longitude": r.longitude or 73.8567,
            "status": r.status,
            "district": r.district,
            "created_at": r.created_at
        }
        for r in reports
    ]

    cluster_points = [
        {
            "id": c.id,
            "type": "cluster",
            "name": c.name,
            "category": c.category,
            "latitude": c.latitude,
            "longitude": c.longitude,
            "report_count": c.report_count,
            "severity_score": c.severity_score,
            "infrastructure_gap": c.infrastructure_gap,
            "population_affected": c.population_affected,
            "district": c.district
        }
        for c in clusters
    ]

    return {
        "reports": report_points,
        "clusters": cluster_points
    }

# 5. Issue Clusters
@router.get("/clusters", response_model=List[ClusterResponse])
def get_clusters(db: Session = Depends(get_db), admin: User = Depends(get_admin_user)):
    return db.query(IssueCluster).all()

@router.get("/clusters/{id}", response_model=ClusterResponse)
def get_cluster(id: int, db: Session = Depends(get_db), admin: User = Depends(get_admin_user)):
    cluster = db.query(IssueCluster).filter(IssueCluster.id == id).first()
    if not cluster:
        raise HTTPException(status_code=404, detail="Cluster not found")
    return cluster

# 6. Priority Engine (Deterministic JanSetu formula calculated in Python)
@router.get("/priorities", response_model=List[PriorityScoreResponse])
def get_priorities(db: Session = Depends(get_db), admin: User = Depends(get_admin_user)):
    # Recalculate deterministic scores in Python to ensure complete accuracy
    clusters = db.query(IssueCluster).all()
    results = []

    for c in clusters:
        # Base factor normalization
        demand = min(100.0, float(c.report_count * 15.0))
        gap = float(c.infrastructure_gap)
        pop_impact = min(100.0, float((c.population_affected / 1000.0) * 1.2))
        sev = min(100.0, float(c.severity_score * 10.0))
        inv_gap = 70.0 # Standard benchmark

        calc = calculate_priority_score(
            citizen_demand=demand,
            infrastructure_gap=gap,
            population_impact=pop_impact,
            severity=sev,
            investment_gap=inv_gap
        )

        # Check or update stored PriorityScore
        ps = db.query(PriorityScore).filter(PriorityScore.cluster_id == c.id).first()
        if not ps:
            ps = PriorityScore(
                cluster_id=c.id,
                citizen_demand_score=calc["citizen_demand_score"],
                infrastructure_gap_score=calc["infrastructure_gap_score"],
                population_impact_score=calc["population_impact_score"],
                severity_score=calc["severity_score"],
                investment_gap_score=calc["investment_gap_score"],
                final_score=calc["final_score"],
                priority_level=calc["priority_level"]
            )
            db.add(ps)
            db.commit()
            db.refresh(ps)
        else:
            ps.citizen_demand_score = calc["citizen_demand_score"]
            ps.infrastructure_gap_score = calc["infrastructure_gap_score"]
            ps.population_impact_score = calc["population_impact_score"]
            ps.severity_score = calc["severity_score"]
            ps.investment_gap_score = calc["investment_gap_score"]
            ps.final_score = calc["final_score"]
            ps.priority_level = calc["priority_level"]
            db.commit()

        ps.cluster = c
        results.append(ps)

    results.sort(key=lambda x: x.final_score, reverse=True)
    return results

# 7. Infrastructure Gaps
@router.get("/infrastructure-gaps")
def get_infrastructure_gaps(db: Session = Depends(get_db), admin: User = Depends(get_admin_user)):
    indicators = db.query(InfrastructureIndicator).all()
    if not indicators:
        # Seed default benchmark indicators if empty
        default_indicators = [
            InfrastructureIndicator(
                state="Maharashtra", district="Pune", category="Roads & Infrastructure",
                indicator_name="All-weather Road Connectivity", indicator_value=62.4,
                benchmark_value=95.0, gap_score=32.6, source="PMGSY State Survey", year=2025
            ),
            InfrastructureIndicator(
                state="Maharashtra", district="Pune", category="Water Supply",
                indicator_name="Piped Drinking Water Access", indicator_value=54.1,
                benchmark_value=100.0, gap_score=45.9, source="Jal Jeevan Mission", year=2025
            ),
            InfrastructureIndicator(
                state="Madhya Pradesh", district="Satna", category="Roads & Infrastructure",
                indicator_name="Rural Primary Road Index", indicator_value=41.2,
                benchmark_value=90.0, gap_score=48.8, source="Rural Development Dept", year=2025
            ),
            InfrastructureIndicator(
                state="Madhya Pradesh", district="Satna", category="Drainage & Sewage",
                indicator_name="Covered Stormwater Drainage", indicator_value=28.5,
                benchmark_value=85.0, gap_score=56.5, source="Swachh Bharat Urban/Rural", year=2025
            )
        ]
        db.add_all(default_indicators)
        db.commit()
        indicators = db.query(InfrastructureIndicator).all()

    return indicators

# 8. AI Civic Insights (Grounded query on DB evidence)
@router.post("/insights/query", response_model=InsightResponse)
def query_ai_insights(
    query_in: InsightQuery,
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    # 1. Collect structured evidence from DB
    reports = db.query(CitizenReport).all()
    clusters = db.query(IssueCluster).all()
    priorities = db.query(PriorityScore).all()

    evidence = {
        "total_reports": len(reports),
        "recent_reports": [
            {
                "category": r.category,
                "issue_type": r.issue_type,
                "description": r.description,
                "district": r.district,
                "severity": r.severity,
                "status": r.status
            }
            for r in reports[-15:]
        ],
        "clusters": [
            {
                "name": c.name,
                "category": c.category,
                "district": c.district,
                "report_count": c.report_count,
                "severity": c.severity_score,
                "infrastructure_gap": c.infrastructure_gap
            }
            for c in clusters
        ],
        "top_priority_score": priorities[0].final_score if priorities else 0
    }

    # 2. Call Gemini to synthesize strictly grounded evidence
    result = generate_civic_insight(query_in.query, evidence)
    return InsightResponse(**result)

# 9. Recommendations
@router.get("/recommendations", response_model=List[RecommendationResponse])
def get_recommendations(db: Session = Depends(get_db), admin: User = Depends(get_admin_user)):
    return db.query(Recommendation).order_by(Recommendation.created_at.desc()).all()

@router.post("/recommendations/{cluster_id}", response_model=RecommendationResponse)
def create_recommendation(
    cluster_id: int, 
    db: Session = Depends(get_db), 
    admin: User = Depends(get_admin_user)
):
    cluster = db.query(IssueCluster).filter(IssueCluster.id == cluster_id).first()
    if not cluster:
        raise HTTPException(status_code=404, detail="Cluster not found")
        
    priority = db.query(PriorityScore).filter(PriorityScore.cluster_id == cluster_id).first()
    
    evidence = {
        "cluster_name": cluster.name,
        "category": cluster.category,
        "district": cluster.district,
        "report_count": cluster.report_count,
        "severity": cluster.severity_score,
        "infrastructure_gap": cluster.infrastructure_gap,
        "priority_score": priority.final_score if priority else None
    }
    
    rec_data = generate_recommendation_text(evidence)
    
    new_rec = Recommendation(
        cluster_id=cluster_id,
        title=rec_data.get("title", f"Action Strategy for {cluster.name}"),
        explanation=rec_data.get("explanation", "High citizen density and infrastructure lag detected."),
        suggested_action=rec_data.get("suggested_action", "Dispatch departmental taskforce for expedited resolution."),
        evidence_summary=rec_data.get("evidence_summary", f"{cluster.report_count} citizen reports in {cluster.district}"),
        generated_by="JanSetu AI Engine"
    )
    db.add(new_rec)
    db.commit()
    db.refresh(new_rec)
    return new_rec

# 10. Admin Notifications / Alerts
@router.get("/notifications", response_model=List[NotificationResponse])
def get_admin_notifications(db: Session = Depends(get_db), admin: User = Depends(get_admin_user)):
    # Admin sees system notifications and high severity reports
    notifs = db.query(Notification).filter(Notification.user_id == admin.id).order_by(Notification.created_at.desc()).all()
    if not notifs:
        # Create initial alert for demonstration if empty
        alert = Notification(
            user_id=admin.id,
            title="High Severity Hotspot Detected",
            message="Road Connectivity cluster in Pune has surpassed critical demand threshold.",
            type="priority_alert"
        )
        db.add(alert)
        db.commit()
        notifs = [alert]
    return notifs
