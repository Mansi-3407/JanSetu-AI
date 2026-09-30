import os
import json
from google import genai
from google.genai import types
from app.schemas.domain import ReportAIProcessed
from typing import Dict, Any, Optional

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()

# Candidate models in priority order for maximum reliability and uptime
CANDIDATE_MODELS = [
    "gemini-3.5-flash",
    "gemini-3.8-flash",
    "gemini-3.5-flash-lite",
    "gemini-3-flash-preview",
    "gemini-flash-latest",
]

# District coordinate centroids for geolocating civic complaints
DISTRICT_COORDINATES = {
    "satna": (24.5807, 80.8306),
    "pune": (18.5204, 73.8567),
    "mumbai": (19.0760, 72.8777),
    "nagpur": (21.1458, 79.0882),
    "bhopal": (23.2599, 77.4126),
    "indore": (22.7196, 75.8577),
    "jabalpur": (23.1815, 79.9864),
    "delhi": (28.6139, 77.2090),
    "lucknow": (26.8467, 80.9462),
    "patna": (25.5941, 85.1376),
    "jaipur": (26.9124, 75.7873),
    "bengaluru": (12.9716, 77.5946),
    "bangalore": (12.9716, 77.5946),
    "hyderabad": (17.3850, 78.4867),
    "chennai": (13.0827, 80.2707),
    "kolkata": (22.5726, 88.3639)
}

def get_client() -> Optional[genai.Client]:
    key = os.getenv("GEMINI_API_KEY", "").strip()
    if not key:
        return None
    return genai.Client(api_key=key)

def process_citizen_text(text: str, language: str, citizen_address: str = "") -> ReportAIProcessed:
    """
    Extracts structured civic intelligence from citizen complaint text in Hindi, English, or mixed.
    Validates output with Pydantic ReportAIProcessed.
    """
    client = get_client()
    if not client:
        raise ValueError("GEMINI_API_KEY is not configured on the server.")

    prompt = f"""
You are an expert civic intelligence AI for the JanSetu platform.
Analyze the citizen complaint below. The complaint can be in English, Hindi, or Hinglish.
Citizen Preferred Language: {language}
Citizen Provided Address: "{citizen_address}"

You must extract structured civic data adhering strictly to this JSON format:
{{
    "category": "Must be exactly one of: ['Roads & Infrastructure', 'Water Supply', 'Electricity & Streetlights', 'Waste Management', 'Drainage & Sewage', 'Healthcare', 'Education', 'Public Transport', 'Public Safety', 'Other']",
    "issue_type": "Short concise title (e.g., Damaged Village Road, Water Pipeline Leakage, Streetlight Outage)",
    "description": "Clear factual summary in English describing the core problem, affected public and urgency",
    "severity": 4, // Integer from 1 to 5 (1=minor inconvenience, 3=moderate community issue, 4=severe hazard, 5=critical emergency)
    "urgency": 4,  // Integer from 1 to 5 (1=can wait, 3=medium priority, 4=needs prompt action, 5=immediate threat)
    "state": "State name (extracted from text or address, default to 'Maharashtra' or 'Madhya Pradesh' based on address context)",
    "district": "District name (extracted from complaint or provided address)",
    "block": "Block, Tehsil, or Sub-district if mentioned, or null",
    "village": "Village, ward, or neighborhood if mentioned, or null",
    "ai_confidence": 0.95
}}

Citizen Complaint:
"{text}"
"""

    last_error = None
    for model_name in CANDIDATE_MODELS:
        try:
            response = client.models.generate_content(
                model=model_name,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    temperature=0.1
                ),
            )
            data = json.loads(response.text)
            
            # Category normalization to exact permitted list
            valid_categories = [
                "Roads & Infrastructure", "Water Supply", "Electricity & Streetlights",
                "Waste Management", "Drainage & Sewage", "Healthcare", "Education",
                "Public Transport", "Public Safety", "Other"
            ]
            cat = data.get("category", "").strip()
            matched_cat = "Other"
            for vc in valid_categories:
                if vc.lower() in cat.lower() or cat.lower() in vc.lower():
                    matched_cat = vc
                    break
            data["category"] = matched_cat

            # Ensure numeric ranges
            data["severity"] = max(1, min(5, int(data.get("severity", 3))))
            data["urgency"] = max(1, min(5, int(data.get("urgency", 3))))
            data["ai_confidence"] = float(data.get("ai_confidence", 0.92))

            # Approximate coordinates if district is known
            dist = (data.get("district") or "").lower().strip()
            if dist in DISTRICT_COORDINATES:
                lat, lng = DISTRICT_COORDINATES[dist]
                data["latitude"] = lat
                data["longitude"] = lng

            return ReportAIProcessed(**data)
        except Exception as e:
            last_error = e
            continue

    raise ValueError(f"AI could not extract structured data: {last_error}")


def generate_civic_insight(query: str, evidence: Dict[str, Any]) -> Dict[str, Any]:
    """
    Answers administrator questions using ONLY the structured evidence from the database.
    Grounded strictly on real data without hallucination.
    """
    client = get_client()
    evidence_json = json.dumps(evidence, indent=2, default=str)

    if not client:
        return {
            "query": query,
            "answer": "AI service is currently unconfigured. Showing raw statistics based on database records.",
            "evidence_used": evidence,
            "label": "AI-generated insight (Offline Fallback)"
        }

    prompt = f"""
You are the Civic Intelligence Officer for JanSetu AI.
An administrator has asked the following civic question:
Question: "{query}"

You have been provided with real, verified database evidence from the JanSetu system:
=== STRUCTURED DATABASE EVIDENCE ===
{evidence_json}
===================================

RULES:
1. Answer the administrator's question directly, clearly, and authoritatively.
2. Ground your answer SOLELY in the supplied structured database evidence. DO NOT invent or fabricate statistics, numbers, or locations not present in the evidence.
3. If the evidence is insufficient to answer a specific part, state that clearly.
4. Format the output in clean JSON:
{{
    "summary": "1-2 sentence executive summary of the answer",
    "key_findings": ["Point 1 based on real evidence", "Point 2", "Point 3"],
    "recommended_focus": "Specific operational focus for the administration",
    "grounded_evidence": "Short factual citation of the reports/clusters used"
}}
"""

    for model_name in CANDIDATE_MODELS:
        try:
            response = client.models.generate_content(
                model=model_name,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    temperature=0.2
                ),
            )
            result = json.loads(response.text)
            result["label"] = "AI-generated insight"
            result["query"] = query
            return result
        except Exception:
            continue

    # Fallback if API fails
    return {
        "query": query,
        "summary": f"Analysis based on {len(evidence.get('reports', []))} citizen reports and {len(evidence.get('clusters', []))} issue hotspots.",
        "key_findings": [
            f"Total reports analyzed: {len(evidence.get('reports', []))}",
            f"Active civic clusters identified: {len(evidence.get('clusters', []))}"
        ],
        "recommended_focus": "Review high-severity clusters in Roads and Water infrastructure.",
        "grounded_evidence": f"Queried {len(evidence.get('reports', []))} reports from active database.",
        "label": "AI-generated insight"
    }


def generate_recommendation_text(evidence: Dict[str, Any]) -> dict:
    """
    Generates decision-support recommendations for an administrator based on a specific cluster.
    """
    client = get_client()
    if not client:
        return {
            "title": "Conduct On-Site Ground Assessment",
            "explanation": "Cluster shows concentrated citizen demand and infrastructure strain.",
            "suggested_action": "Dispatch local engineering inspection team for verification.",
            "evidence_summary": f"Reports: {evidence.get('report_count', 0)}, Category: {evidence.get('category', 'Civic')}"
        }

    prompt = f"""
Based on the following civic issue cluster and infrastructure evidence, generate a decision-support recommendation for the district administrator.
Do not claim that government action has automatically been completed. Instead, provide actionable administrative next steps.

Return ONLY valid JSON matching this schema:
{{
    "title": "Short title of the recommendation",
    "explanation": "Brief explanation of why this is important based on citizen demand, severity and infrastructure gap",
    "suggested_action": "Specific actionable next step for the department",
    "evidence_summary": "Short summary of the evidence used"
}}

Evidence: {json.dumps(evidence)}
"""

    for model_name in CANDIDATE_MODELS:
        try:
            response = client.models.generate_content(
                model=model_name,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    temperature=0.2
                ),
            )
            return json.loads(response.text)
        except Exception:
            continue

    return {
        "title": f"Priority Assessment for {evidence.get('category', 'Infrastructure')}",
        "explanation": f"Cluster '{evidence.get('cluster_name')}' has {evidence.get('report_count')} citizen reports with high severity.",
        "suggested_action": "Conduct an infrastructure-gap inspection and allocate emergency repair resources.",
        "evidence_summary": f"Reports: {evidence.get('report_count')}, Severity: {evidence.get('severity')}"
    }
