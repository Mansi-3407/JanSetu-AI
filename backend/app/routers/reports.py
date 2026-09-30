from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models.domain import User, CitizenReport, IssueCluster, IssueStatusHistory, Notification, IssueStatusEnum, PriorityScore
from app.schemas.domain import ReportCreate, ReportResponse
from app.routers.auth import get_current_user
from app.ai.gemini import process_citizen_text, DISTRICT_COORDINATES
from app.scoring.priority import calculate_priority_score
from typing import List

router = APIRouter(prefix="/api/reports", tags=["reports"])

@router.post("", response_model=ReportResponse)
def create_report(
    report_in: ReportCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    text_to_process = report_in.transcription if report_in.transcription else report_in.original_text
    
    # 1. AI processing with Gemini & Pydantic validation
    try:
        ai_data = process_citizen_text(
            text=text_to_process,
            language=report_in.language,
            citizen_address=report_in.citizen_address
        )
    except Exception as e:
        print(f"Gemini processing error: {e}")
        # Honest error reporting without pretending success
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="We couldn't analyze your complaint. The AI service encountered an error or was temporarily unavailable. Please retry."
        )

    # 2. Location Geocoding resolution
    lat = ai_data.latitude
    lng = ai_data.longitude
    if not lat or not lng:
        dist_key = (ai_data.district or "").lower().strip()
        if dist_key in DISTRICT_COORDINATES:
            lat, lng = DISTRICT_COORDINATES[dist_key]
        else:
            # Default to Pune, Maharashtra coordinates if unknown
            lat, lng = 18.5204, 73.8567

    # 3. Cluster Association / Aggregation
    # Search for an existing cluster with same category and district
    cluster = db.query(IssueCluster).filter(
        IssueCluster.category == ai_data.category,
        IssueCluster.district == ai_data.district
    ).first()

    if not cluster:
        # Also check for category match anywhere
        cluster = db.query(IssueCluster).filter(
            IssueCluster.category == ai_data.category
        ).first()

    if not cluster:
        # Create a new civic issue cluster dynamically
        cluster = IssueCluster(
            name=f"{ai_data.category} Hotspot - {ai_data.district or 'Civic Cluster'}",
            category=ai_data.category,
            state=ai_data.state or "Maharashtra",
            district=ai_data.district or "Pune",
            latitude=lat,
            longitude=lng,
            report_count=1,
            severity_score=float(ai_data.severity * 2.0),
            population_affected=15000,
            infrastructure_gap=75.0
        )
        db.add(cluster)
        db.commit()
        db.refresh(cluster)

        # Create corresponding priority score
        p_calc = calculate_priority_score(
            citizen_demand=45.0,
            infrastructure_gap=75.0,
            population_impact=60.0,
            severity=float(ai_data.severity * 20),
            investment_gap=50.0
        )
        ps = PriorityScore(
            cluster_id=cluster.id,
            citizen_demand_score=p_calc["citizen_demand_score"],
            infrastructure_gap_score=p_calc["infrastructure_gap_score"],
            population_impact_score=p_calc["population_impact_score"],
            severity_score=p_calc["severity_score"],
            investment_gap_score=p_calc["investment_gap_score"],
            final_score=p_calc["final_score"],
            priority_level=p_calc["priority_level"]
        )
        db.add(ps)
        db.commit()
    else:
        # Increment existing cluster report count and update severity
        cluster.report_count += 1
        cluster.severity_score = round((cluster.severity_score + (ai_data.severity * 2.0)) / 2.0, 1)
        db.commit()

    # 4. Create CitizenReport with full Contact Snapshot
    new_report = CitizenReport(
        user_id=current_user.id,
        citizen_name=report_in.citizen_name.strip(),
        citizen_email=report_in.citizen_email.strip() if report_in.citizen_email else None,
        citizen_phone=report_in.citizen_phone.strip() if report_in.citizen_phone else None,
        citizen_address=report_in.citizen_address.strip(),
        original_text=report_in.original_text.strip(),
        language=report_in.language,
        transcription=report_in.transcription,
        category=ai_data.category,
        issue_type=ai_data.issue_type,
        description=ai_data.description,
        severity=ai_data.severity,
        urgency=ai_data.urgency,
        state=ai_data.state,
        district=ai_data.district,
        block=ai_data.block,
        village=ai_data.village,
        latitude=lat,
        longitude=lng,
        ai_confidence=ai_data.ai_confidence,
        status=IssueStatusEnum.AI_UNDERSTOOD.value,
        cluster_id=cluster.id
    )
    db.add(new_report)
    db.commit()
    db.refresh(new_report)

    # 5. Status History Timeline Entries
    h1 = IssueStatusHistory(
        report_id=new_report.id,
        old_status="None",
        new_status=IssueStatusEnum.SUBMITTED.value,
        changed_by="Citizen (Verified)",
        note="Complaint submitted with contact snapshot."
    )
    h2 = IssueStatusHistory(
        report_id=new_report.id,
        old_status=IssueStatusEnum.SUBMITTED.value,
        new_status=IssueStatusEnum.AI_UNDERSTOOD.value,
        changed_by="JanSetu AI Engine",
        note=f"Parsed category '{ai_data.category}' with severity {ai_data.severity}/5."
    )
    db.add(h1)
    db.add(h2)

    # 6. Citizen Notification
    notif = Notification(
        user_id=current_user.id,
        title="Complaint Registered & Analyzed",
        message=f"Your complaint regarding '{ai_data.issue_type}' in {ai_data.district} was categorized as '{ai_data.category}'.",
        type="complaint_submitted"
    )
    db.add(notif)
    db.commit()
    db.refresh(new_report)

    return new_report

@router.get("/my", response_model=List[ReportResponse])
def get_my_reports(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    reports = db.query(CitizenReport).filter(
        CitizenReport.user_id == current_user.id
    ).order_by(CitizenReport.created_at.desc()).all()
    return reports

@router.get("/{id}", response_model=ReportResponse)
def get_report(
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
