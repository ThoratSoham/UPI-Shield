import re
import sqlite3
import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()

# Enable CORS for local testing from any frontend origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_FILE = "database.db"

# Initialize Database when the app starts
@app.on_event("startup")
def startup_event():
    # Connect to the database (creates it if it doesn't exist)
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
    # Ensure blacklist table exists (it was missing from the raw SQL)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS blacklist (
            vpa VARCHAR(255) PRIMARY KEY,
            reason VARCHAR(255)
        )
    """)
    
    # Execute the user's SQL file to populate data
    sql_path = "brands_data.sql"
    if os.path.exists(sql_path):
        with open(sql_path, "r", encoding="utf-8") as f:
            sql_script = f.read()
            try:
                # Use executescript to run multiple statements safely
                cursor.executescript(sql_script)
                print("Successfully loaded brands_data.sql")
            except Exception as e:
                print(f"Notice during SQL initialization (might be duplicate entries): {e}")
                
    conn.commit()
    conn.close()

class ScanRequest(BaseModel):
    qr_raw: str
    user_intent: str # 'pay' or 'receive'

@app.post("/check-safety")
async def check_safety(request: ScanRequest):
    # Basic validation for UPI strings
    if "upi://pay" not in request.qr_raw.lower():
        # If it's not a standard UPI string, it could be a raw website or generic text
        # Fast fail or flag it
        return {
             "is_safe": False,
             "risk_level": "High",
             "alerts": ["ALERT: This is not a standard UPI payment code. Scanning unknown links is dangerous."]
        }
        
    try:
        # 1. Parse the code
        pa_match = re.search(r'pa=([^&]*)', request.qr_raw)
        pn_match = re.search(r'pn=([^&]*)', request.qr_raw)
        
        vpa = pa_match.group(1).lower() if pa_match else ""
        display_name = pn_match.group(1).lower() if pn_match else "unknown"
    except Exception:
        vpa = "unknown"
        display_name = "unknown"

    warnings = []
    score = 0

    # 2. THE RECEIVE TRAP (The #1 Scam)
    if request.user_intent == "receive":
        score += 90
        warnings.append("ALERT: Scanning QRs is ONLY for sending money. Never for receiving. This is a scam trap.")

    # Open DB Connection for checks
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()

    # 3. THE BRAND MIMICRY CHECK
    # Fetch all brands from the DB
    cursor.execute("SELECT brand_name, official_pattern FROM brands")
    brands = cursor.fetchall()
    
    # Process mimicry dynamically from DB
    mimicry_found = False
    for brand_row in brands:
        db_brand_name = brand_row[0].lower()
        db_official_vpa = brand_row[1].lower()
        
        if db_brand_name in display_name:
            # The display name contains the brand name, now verify VPA
            # Handle cases where multiple patterns exist for one brand
            if db_official_vpa not in vpa:
                mimicry_found = True
                suspicious_brand = db_brand_name
                
    # We add the score once if any mimicry is detected
    if mimicry_found:
        score += 60
        warnings.append(f"SUSPICIOUS: The name claims to be affiliated with '{suspicious_brand.title()}' but uses an unofficial personal VPA ({vpa}).")

    # 4. DATABASE BLACKLIST CHECK
    # Check if the exact VPA is in the blacklist
    cursor.execute("SELECT reason FROM blacklist WHERE vpa = ?", (vpa,))
    blacklist_entry = cursor.fetchone()
    
    if blacklist_entry:
        score += 100
        malicious_reason = blacklist_entry[0]
        warnings.append(f"CRITICAL DANGER: This VPA ({vpa}) is blacklisted in the national database for: {malicious_reason}.")

    conn.close()

    # Calculate safety
    return {
        "is_safe": score < 50,
        "risk_level": "High" if score >= 70 else "Medium" if score >= 40 else "Low",
        "alerts": warnings
    }
