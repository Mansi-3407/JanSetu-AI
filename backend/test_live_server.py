import urllib.request
import urllib.parse
import json

BASE = "http://127.0.0.1:8000/api"

def make_req(endpoint, method="GET", data=None, token=None, form=False):
    url = f"{BASE}{endpoint}"
    headers = {}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    
    body = None
    if data:
        if form:
            body = urllib.parse.urlencode(data).encode("utf-8")
            headers["Content-Type"] = "application/x-www-form-urlencoded"
        else:
            body = json.dumps(data).encode("utf-8")
            headers["Content-Type"] = "application/json"

    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode("utf-8"))

print("--> 1. Citizen Login on Live Server...")
auth = make_req("/auth/login", method="POST", data={"username": "demo.citizen@jansetu.ai", "password": "citizen123"}, form=True)
citizen_token = auth["access_token"]
print("    Citizen Token received.")

print("--> 2. Citizen Profile Persistence...")
prof = make_req("/citizen/profile", token=citizen_token)
print(f"    Current Profile: {prof['full_name']} | Address: {prof.get('address')} | Phone: {prof.get('phone')}")

updated_prof = make_req("/citizen/profile", method="PUT", data={
    "full_name": "Ramesh Sharma",
    "phone": "+91 94251 12345",
    "address": "Ward 4, Near Govt School, Maihar, Satna, Madhya Pradesh",
    "preferred_language": "Hindi"
}, token=citizen_token)
print(f"    Updated Profile: {updated_prof['full_name']} | {updated_prof['phone']} | {updated_prof['address']}")
assert updated_prof["full_name"] == "Ramesh Sharma"

print("--> 3. Citizen Submits Complaint with Contact Snapshot...")
complaint = {
    "citizen_name": "Ramesh Sharma",
    "citizen_email": "demo.citizen@jansetu.ai",
    "citizen_phone": "+91 94251 12345",
    "citizen_address": "Ward 4, Near Govt School, Maihar, Satna, Madhya Pradesh",
    "original_text": "हमारे मैहर क्षेत्र के मुख्य अस्पताल मार्ग की सड़क विगत छह माह से अत्यंत क्षतिग्रस्त है। बड़े-बड़े गड्ढों में जलभराव हो जाने से एंबुलेंस और गंभीर मरीजों का आवागमन रुक जाता है।",
    "language": "Hindi"
}
rep = make_req("/reports", method="POST", data=complaint, token=citizen_token)
print(f"    Report Created ID #{rep['id']}")
print(f"    Category: {rep['category']}")
print(f"    Issue: {rep['issue_type']}")
print(f"    Location: {rep['district']}, {rep['state']}")
print(f"    Severity: {rep['severity']} / 5")
print(f"    Status: {rep['status']}")
print(f"    Contact Snapshot: {rep['citizen_name']} | {rep['citizen_phone']} | {rep['citizen_address']}")

assert rep["category"] != "Uncategorized", "Category should not be Uncategorized!"
assert rep["issue_type"] != "Processing Error", "Issue should not be Processing Error!"

print("--> 4. Admin Login...")
admin_auth = make_req("/auth/login", method="POST", data={"username": "demo.admin@jansetu.ai", "password": "admin123"}, form=True)
admin_token = admin_auth["access_token"]
print("    Admin Token received.")

print("--> 5. Admin Views Reports...")
admin_reports = make_req("/admin/reports", token=admin_token)
found = next((r for r in admin_reports if r["id"] == rep["id"]), None)
assert found is not None, "Report not visible to Admin!"
print(f"    Admin verified report #{found['id']} with contact snapshot: {found['citizen_name']}, {found['citizen_phone']}")

print("--> 6. Admin Updates Status to 'Under Review'...")
updated_rep = make_req(f"/admin/reports/{rep['id']}/status", method="PATCH", data={
    "status": "Under Review",
    "note": "Field inspection squad dispatched by Executive Engineer PWD."
}, token=admin_token)
print(f"    Admin updated status to: {updated_rep['status']}")

print("--> 7. Citizen Feedback Loop: Citizen checks report & sees status update...")
citizen_check = make_req(f"/citizen/reports/{rep['id']}", token=citizen_token)
assert citizen_check["status"] == "Under Review", "Citizen did not see updated status!"
print(f"    Citizen sees current status: {citizen_check['status']}")
print(f"    Status Timeline Entries: {len(citizen_check['status_history'])}")
for h in citizen_check['status_history']:
    print(f"      - {h['new_status']} by {h['changed_by']}: {h['note']}")

print("--> 8. Citizen Notification Check...")
notifs = make_req("/citizen/notifications", token=citizen_token)
print(f"    Citizen received {len(notifs)} notification(s).")
print(f"    Latest: {notifs[0]['title']} -> {notifs[0]['message']}")

print("--> 9. Admin AI Insights Grounded Query...")
insight = make_req("/admin/insights/query", method="POST", data={
    "query": "What are the major hospital and road connectivity problems in Satna?"
}, token=admin_token)
print(f"    AI Insight Label: {insight.get('label')}")
print(f"    Summary: {insight.get('summary')}")
print(f"    Focus: {insight.get('recommended_focus')}")

print("\n LIVE SYSTEM END-TO-END VERIFICATION: 100% SUCCESSFUL! ")
