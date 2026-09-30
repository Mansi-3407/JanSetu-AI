import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), "jansetu.db")
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Check users columns
cursor.execute("PRAGMA table_info(users)")
user_cols = [c[1] for c in cursor.fetchall()]
if "address" not in user_cols:
    cursor.execute("ALTER TABLE users ADD COLUMN address TEXT")
    print("Added address to users")

# Check citizen_reports columns
cursor.execute("PRAGMA table_info(citizen_reports)")
report_cols = [c[1] for c in cursor.fetchall()]
if "citizen_name" not in report_cols:
    cursor.execute("ALTER TABLE citizen_reports ADD COLUMN citizen_name TEXT")
    print("Added citizen_name to citizen_reports")
if "citizen_email" not in report_cols:
    cursor.execute("ALTER TABLE citizen_reports ADD COLUMN citizen_email TEXT")
    print("Added citizen_email to citizen_reports")
if "citizen_phone" not in report_cols:
    cursor.execute("ALTER TABLE citizen_reports ADD COLUMN citizen_phone TEXT")
    print("Added citizen_phone to citizen_reports")
if "citizen_address" not in report_cols:
    cursor.execute("ALTER TABLE citizen_reports ADD COLUMN citizen_address TEXT")
    print("Added citizen_address to citizen_reports")

# Update demo citizen with default address and phone if empty
cursor.execute("""
    UPDATE users 
    SET address = 'Plot 42, Green Avenue, Pune, Maharashtra - 411001',
        phone = '+91 98765 43210'
    WHERE email = 'demo.citizen@jansetu.ai' AND (address IS NULL OR address = '')
""")

# Update existing reports with citizen snapshot
cursor.execute("""
    UPDATE citizen_reports
    SET citizen_name = 'Citizen Demo',
        citizen_email = 'demo.citizen@jansetu.ai',
        citizen_phone = '+91 98765 43210',
        citizen_address = 'Plot 42, Green Avenue, Pune, Maharashtra - 411001'
    WHERE citizen_name IS NULL OR citizen_name = ''
""")

conn.commit()
conn.close()
print("Migration completed successfully!")
