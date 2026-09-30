from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Boolean, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.database import Base

class RoleEnum(str, enum.Enum):
    CITIZEN = "CITIZEN"
    ADMIN = "ADMIN"

class LanguageEnum(str, enum.Enum):
    ENGLISH = "English"
    HINDI = "Hindi"

class IssueStatusEnum(str, enum.Enum):
    SUBMITTED = "Submitted"
    AI_UNDERSTOOD = "AI Understood"
    UNDER_REVIEW = "Under Review"
    ACTION_PLANNED = "Action Planned"
    IN_PROGRESS = "In Progress"
    RESOLVED = "Resolved"
    # Legacy aliases
    DETECTED = "Detected"
    ANALYZED = "Analyzed"

class PriorityLevelEnum(str, enum.Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"
    CRITICAL = "Critical"

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String)
    email = Column(String, unique=True, index=True)
    phone = Column(String)
    address = Column(String, nullable=True)
    password_hash = Column(String)
    role = Column(String, default=RoleEnum.CITIZEN.value)
    preferred_language = Column(String, default=LanguageEnum.ENGLISH.value)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    reports = relationship("CitizenReport", back_populates="user")
    notifications = relationship("Notification", back_populates="user")

class CitizenReport(Base):
    __tablename__ = "citizen_reports"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    citizen_name = Column(String)
    citizen_email = Column(String, nullable=True)
    citizen_phone = Column(String, nullable=True)
    citizen_address = Column(String)
    original_text = Column(String)
    language = Column(String)
    transcription = Column(String, nullable=True)
    category = Column(String, index=True)
    issue_type = Column(String)
    description = Column(String)
    severity = Column(Integer)
    urgency = Column(Integer)
    state = Column(String, index=True)
    district = Column(String, index=True)
    block = Column(String)
    village = Column(String)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    ai_confidence = Column(Float)
    status = Column(String, default=IssueStatusEnum.SUBMITTED.value, index=True)
    cluster_id = Column(Integer, ForeignKey("issue_clusters.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="reports")
    cluster = relationship("IssueCluster", back_populates="reports")
    status_history = relationship("IssueStatusHistory", back_populates="report")

class IssueCluster(Base):
    __tablename__ = "issue_clusters"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    category = Column(String, index=True)
    state = Column(String, index=True)
    district = Column(String, index=True)
    latitude = Column(Float)
    longitude = Column(Float)
    report_count = Column(Integer, default=0)
    severity_score = Column(Float, default=0.0)
    population_affected = Column(Integer, default=0)
    infrastructure_gap = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    reports = relationship("CitizenReport", back_populates="cluster")
    priority_score = relationship("PriorityScore", back_populates="cluster", uselist=False)
    recommendations = relationship("Recommendation", back_populates="cluster")

class InfrastructureIndicator(Base):
    __tablename__ = "infrastructure_indicators"
    id = Column(Integer, primary_key=True, index=True)
    state = Column(String, index=True)
    district = Column(String, index=True)
    category = Column(String, index=True)
    indicator_name = Column(String)
    indicator_value = Column(Float)
    benchmark_value = Column(Float)
    gap_score = Column(Float)
    source = Column(String)
    year = Column(Integer)

class PopulationData(Base):
    __tablename__ = "population_data"
    id = Column(Integer, primary_key=True, index=True)
    state = Column(String, index=True)
    district = Column(String, index=True)
    population = Column(Integer)
    potentially_affected_population = Column(Integer)
    source = Column(String)
    year = Column(Integer)

class InvestmentProject(Base):
    __tablename__ = "investment_projects"
    id = Column(Integer, primary_key=True, index=True)
    state = Column(String, index=True)
    district = Column(String, index=True)
    category = Column(String, index=True)
    project_name = Column(String)
    allocated_amount = Column(Float)
    spent_amount = Column(Float)
    status = Column(String)
    source = Column(String)
    year = Column(Integer)

class PriorityScore(Base):
    __tablename__ = "priority_scores"
    id = Column(Integer, primary_key=True, index=True)
    cluster_id = Column(Integer, ForeignKey("issue_clusters.id"), unique=True)
    citizen_demand_score = Column(Float)
    infrastructure_gap_score = Column(Float)
    population_impact_score = Column(Float)
    severity_score = Column(Float)
    investment_gap_score = Column(Float)
    final_score = Column(Float)
    priority_level = Column(String)
    calculated_at = Column(DateTime, default=datetime.utcnow)

    cluster = relationship("IssueCluster", back_populates="priority_score")

class Recommendation(Base):
    __tablename__ = "recommendations"
    id = Column(Integer, primary_key=True, index=True)
    cluster_id = Column(Integer, ForeignKey("issue_clusters.id"))
    title = Column(String)
    explanation = Column(String)
    suggested_action = Column(String)
    evidence_summary = Column(String)
    generated_by = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

    cluster = relationship("IssueCluster", back_populates="recommendations")

class IssueStatusHistory(Base):
    __tablename__ = "issue_status_history"
    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(Integer, ForeignKey("citizen_reports.id"))
    old_status = Column(String)
    new_status = Column(String)
    changed_by = Column(String)
    note = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    report = relationship("CitizenReport", back_populates="status_history")

class Notification(Base):
    __tablename__ = "notifications"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    title = Column(String)
    message = Column(String)
    type = Column(String)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="notifications")
