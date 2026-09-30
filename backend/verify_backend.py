import os
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

print("1. Testing Citizen Login...")
res = client.post("/api/auth/login", data={"username": "demo.citizen@jansetu.ai", "password": "citizen123"})
assert res.status_code == 200, f"Login failed: {res.text}"
token = res.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}
print(" Citizen login successful! Token acquired.")

print("2. Testing Citizen Profile...")
res = client.get("/api/citizen/profile", headers=headers)
assert res.status_code == 200, f"Get profile failed: {res.text}"
profile = res.json()
print(f" Profile: {profile['full_name']} | Address: {profile.get('address')} | Phone: {profile.get('phone')}")

print("3. Testing Citizen Profile Update...")
res = client.put("/api/citizen/profile", json={
    "full_name": "Citizen Demo User",
    "phone": "+91 98765 43210",
    "address": "Village Rampur, Block Maihar, District Satna, Madhya Pradesh",
    "preferred_language": "Hindi"
}, headers=headers)
assert res.status_code == 200, f"Profile update failed: {res.text}"
updated_prof = res.json()
assert updated_prof["address"] == "Village Rampur, Block Maihar, District Satna, Madhya Pradesh"
print(" Profile update persistent in database!")

print("4. Testing Complaint Submission with Contact Snapshot & AI Categorization...")
complaint_payload = {
    "citizen_name": "Citizen Demo User",
    "citizen_email": "demo.citizen@jansetu.ai",
    "citizen_phone": "+91 98765 43210",
    "citizen_address": "Village Rampur, Block Maihar, District Satna, Madhya Pradesh",
    "original_text": "हमारे गांव के स्कूल के पास की मुख्य सड़क पूरी तरह टूट गई है और गड्ढों की वजह से बच्चों और ग्रामीणों का आना जाना बहुत खतरनाक हो गया है।",
    "language": "Hindi"
}
res = client.post("/api/reports", json=complaint_payload, headers=headers)
assert res.status_code == 200, f"Report submission failed: {res.text}"
report = res.json()
print(" Report created successfully!")
print(f"   ID: {report['id']}")
print(f"   Category: {report['category']}")
print(f"   Issue Type: {report['issue_type']}")
print(f"   District: {report['district']}")
print(f"   Severity: {report['severity']}")
print(f"   Status: {report['status']}")
print(f"   Contact Snapshot: {report['citizen_name']} | {report['citizen_phone']} | {report['citizen_address']}")
assert report["category"] != "Uncategorized", "Category should not be Uncategorized!"
assert report["issue_type"] != "Processing Error", "Issue type should not be Processing Error!"

print("5. Testing Admin Login...")
res = client.post("/api/auth/login", data={"username": "demo.admin@jansetu.ai", "password": "admin123"})
assert res.status_code == 200, f"Admin login failed: {res.text}"
admin_token = res.json()["access_token"]
admin_headers = {"Authorization": f"Bearer {admin_token}"}
print(" Admin login successful!")

print("6. Testing Admin Reports List...")
res = client.get("/api/admin/reports", headers=admin_headers)
assert res.status_code == 200, f"Admin reports failed: {res.text}"
reports = res.json()
assert len(reports) > 0, "No reports found for admin!"
found = any(r["id"] == report["id"] for r in reports)
assert found, "Submitted report not found in admin reports list!"
print(f" Admin successfully sees submitted report (Total reports in DB: {len(reports)})")

print("7. Testing Admin Status Update -> 'Under Review'...")
res = client.patch(f"/api/admin/reports/{report['id']}/status", json={
    "status": "Under Review",
    "note": "Assigned to Public Works Department inspection team."
}, headers=admin_headers)
assert res.status_code == 200, f"Status update failed: {res.text}"
updated_report = res.json()
assert updated_report["status"] == "Under Review"
print(" Status updated to 'Under Review' with history note!")

print("8. Testing Citizen Feedback Loop: Citizen checks report status...")
res = client.get(f"/api/citizen/reports/{report['id']}", headers=headers)
assert res.status_code == 200
citizen_view = res.json()
assert citizen_view["status"] == "Under Review", "Citizen does not see updated status!"
assert len(citizen_view["status_history"]) >= 3, "Status history timeline missing entries!"
print(" Citizen sees updated status 'Under Review' and full timeline!")

print("9. Testing Citizen Notifications...")
res = client.get("/api/citizen/notifications", headers=headers)
assert res.status_code == 200
notifs = res.json()
assert len(notifs) >= 2, "Notifications not generated!"
print(f" Citizen has {len(notifs)} real notifications in DB!")

print("10. Testing Admin AI Insights Query...")
res = client.post("/api/admin/insights/query", json={
    "query": "What are the major road and infrastructure issues reported by citizens?"
}, headers=admin_headers)
assert res.status_code == 200, f"Insights query failed: {res.text}"
insight = res.json()
print(f" AI Insight Label: {insight.get('label')}")
print(f" Summary: {insight.get('summary')}")
print(f" Focus: {insight.get('recommended_focus')}")

print("\n ALL BACKEND FUNCTIONAL TESTS PASSED FLAWLESSLY! ")
