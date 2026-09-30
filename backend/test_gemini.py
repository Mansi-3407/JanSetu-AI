import os
import json
from dotenv import load_dotenv

load_dotenv()
from google import genai
from google.genai import types

api_key = os.getenv("GEMINI_API_KEY", "").strip()
client = genai.Client(api_key=api_key)

models = ["gemini-2.5-flash-lite", "gemini-flash-latest", "gemini-3.5-flash", "gemini-3.8-flash"]
prompt = """
You are an expert AI civic intelligence parser for JanSetu AI.
Analyze the citizen complaint below. The complaint may be in English, Hindi, or Hinglish.
Extract structured civic data adhering strictly to this JSON format:
{
    "category": "Must be exactly one of: ['Roads & Infrastructure', 'Water Supply', 'Electricity & Streetlights', 'Waste Management', 'Drainage & Sewage', 'Healthcare', 'Education', 'Public Transport', 'Public Safety', 'Other']",
    "issue_type": "Concise title of the issue (e.g., Damaged Road, Contaminated Water, Streetlight Outage)",
    "description": "Clear factual summary in English describing the problem and citizen impact",
    "severity": 4,
    "urgency": 4,
    "state": "State name (extracted from complaint or provided address)",
    "district": "District name (extracted from complaint or provided address)",
    "block": "Block or locality name, or null",
    "village": "Village or colony name, or null",
    "keywords": ["road", "rain", "school"],
    "ai_confidence": 0.95
}

Citizen Complaint: "The road near our village school has been damaged for months and becomes impossible to use during rain."
Citizen Address: "Village Rampur, Block Maihar, District Satna, Madhya Pradesh"
"""

for m in models:
    try:
        print(f"Trying model: {m}...")
        res = client.models.generate_content(
            model=m,
            contents=prompt,
            config=types.GenerateContentConfig(response_mime_type="application/json")
        )
        print(f"SUCCESS with {m}!")
        print("RESULT:", res.text)
        break
    except Exception as e:
        print(f"Model {m} failed: {e}")
