from pydantic import BaseModel, EmailStr, model_validator, Field
from typing import Optional, List
from datetime import datetime
from app.models.domain import RoleEnum, LanguageEnum, IssueStatusEnum, PriorityLevelEnum

class UserBase(BaseModel):
    full_name: str
    email: EmailStr
    phone: Optional[str] = None
    address: Optional[str] = None
    preferred_language: LanguageEnum = LanguageEnum.ENGLISH

class UserCreate(UserBase):
    password: str

class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    preferred_language: Optional[LanguageEnum] = None

class UserResponse(UserBase):
    id: int
    role: RoleEnum
    created_at: datetime
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class IssueStatusHistoryResponse(BaseModel):
    id: int
    report_id: int
    old_status: str
    new_status: str
    changed_by: str
    note: Optional[str] = None
    created_at: datetime
    class Config:
        from_attributes = True

class ReportBase(BaseModel):
    citizen_name: str
    citizen_email: Optional[str] = None
    citizen_phone: Optional[str] = None
    citizen_address: str
    original_text: str
    language: str = "English"
    transcription: Optional[str] = None

class ReportCreate(ReportBase):
    @model_validator(mode='after')
    def validate_mandatory_fields(self):
        if not self.citizen_name or not self.citizen_name.strip():
            raise ValueError('Citizen name is mandatory')
        if not self.citizen_address or not self.citizen_address.strip():
            raise ValueError('Citizen address is mandatory')
        if not self.original_text or not self.original_text.strip():
            raise ValueError('Complaint text is mandatory')
        
        has_email = self.citizen_email and self.citizen_email.strip()
        has_phone = self.citizen_phone and self.citizen_phone.strip()
        if not has_email and not has_phone:
            raise ValueError('At least one contact method (email or phone number) must be provided')
        return self

class ReportUpdate(BaseModel):
    status: IssueStatusEnum
    note: Optional[str] = None

class ReportAIProcessed(BaseModel):
    category: str
    issue_type: str
    description: str
    severity: int
    urgency: int
    state: str
    district: str
    block: Optional[str] = None
    village: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    ai_confidence: float = 0.95

class ReportResponse(BaseModel):
    id: int
    user_id: int
    citizen_name: str
    citizen_email: Optional[str] = None
    citizen_phone: Optional[str] = None
    citizen_address: str
    original_text: str
    language: str
    transcription: Optional[str] = None
    category: Optional[str] = None
    issue_type: Optional[str] = None
    description: Optional[str] = None
    severity: Optional[int] = None
    urgency: Optional[int] = None
    state: Optional[str] = None
    district: Optional[str] = None
    block: Optional[str] = None
    village: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    ai_confidence: Optional[float] = None
    status: str
    cluster_id: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    status_history: List[IssueStatusHistoryResponse] = []
    
    class Config:
        from_attributes = True

class ClusterResponse(BaseModel):
    id: int
    name: str
    category: str
    state: str
    district: str
    latitude: float
    longitude: float
    report_count: int
    severity_score: float
    population_affected: int
    infrastructure_gap: float
    created_at: datetime
    class Config:
        from_attributes = True

class InfrastructureIndicatorResponse(BaseModel):
    id: int
    state: str
    district: str
    category: str
    indicator_name: str
    indicator_value: float
    benchmark_value: float
    gap_score: float
    source: str
    year: int
    class Config:
        from_attributes = True

class PriorityScoreResponse(BaseModel):
    id: int
    cluster_id: int
    citizen_demand_score: float
    infrastructure_gap_score: float
    population_impact_score: float
    severity_score: float
    investment_gap_score: float
    final_score: float
    priority_level: PriorityLevelEnum
    calculated_at: datetime
    cluster: Optional[ClusterResponse] = None
    class Config:
        from_attributes = True

class RecommendationResponse(BaseModel):
    id: int
    cluster_id: int
    title: str
    explanation: str
    suggested_action: str
    evidence_summary: str
    generated_by: str
    created_at: datetime
    class Config:
        from_attributes = True

class NotificationResponse(BaseModel):
    id: int
    user_id: int
    title: str
    message: str
    type: str
    is_read: bool
    created_at: datetime
    class Config:
        from_attributes = True

class InsightQuery(BaseModel):
    query: str

class InsightResponse(BaseModel):
    query: str
    summary: str
    key_findings: List[str]
    recommended_focus: str
    grounded_evidence: str
    label: str = "AI-generated insight"
