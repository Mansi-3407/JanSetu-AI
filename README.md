# JANSETU AI
Raise Voice. Make Impact.

JanSetu AI is an AI-assisted civic decision-support platform that converts collective citizen voices into structured, location-aware, and actionable civic intelligence.

## Architecture & Technology Stack
- **Frontend**: React, TypeScript, Vite, Tailwind CSS, React Router, Recharts, Lucide React
- **Backend**: Python 3.11+, FastAPI, Pydantic, SQLAlchemy
- **Database**: PostgreSQL (Development uses SQLite as fallback)
- **AI Integration**: Google Gemini 2.5 Pro for text understanding and recommendations.

## Requirements
- Node.js 18+
- Python 3.11+
- PostgreSQL (Optional for local testing, required for production)
- Gemini API Key

## Setup Instructions

### 1. Backend Setup
Navigate to the `backend` directory:
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

Configure `.env` file with your PostgreSQL URL and Gemini API Key:
```env
DATABASE_URL=postgresql://user:password@localhost/jansetu
JWT_SECRET=supersecretkey123
GEMINI_API_KEY=your_gemini_api_key_here
```
*(If no DATABASE_URL is provided, it falls back to SQLite.)*

Seed the database with demo users and synthetic data:
```bash
python seeds/seed.py
```

Run the backend server:
```bash
uvicorn app.main:app --reload
```

### 2. Frontend Setup
Navigate to the `frontend` directory:
```bash
cd frontend
npm install
npm run dev
```

## Demo Credentials
- **Administrator**: `demo.admin@jansetu.ai` / `admin123`
- **Citizen**: `demo.citizen@jansetu.ai` / `citizen123`

## End-to-End Flow
1. Citizen logs in and submits a complaint in Hindi or English (Voice or Text).
2. Gemini AI parses the language and extracts structured metadata (Location, Issue Type, Category, Severity).
3. The report is stored and linked to a local Issue Cluster.
4. Python scoring engine recalculates Priority Score using deterministic weights (Demand, Infrastructure Gap, Impact, Severity).
5. Administrator reviews hotspots on the dashboard and asks AI for specific intervention recommendations based on data.

## Folder Structure
- `backend/app`: FastAPI application (routers, services, AI integration, scoring).
- `backend/seeds`: Seed script for demo data.
- `frontend/src/pages`: React components for Citizen and Admin dashboards.
