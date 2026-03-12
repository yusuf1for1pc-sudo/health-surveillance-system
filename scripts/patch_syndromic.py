import os
import random
import uuid
import datetime
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(__file__), '../backend/.env'))

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_KEY")

if not url or not key:
    raise Exception("Supabase credentials not found in backend/.env")

supabase: Client = create_client(url, key)

def seed_syndromic():
    print("Connected to Supabase. Deleting preexisting syndromic cases...")
    
    # 1. Clear old records
    res = supabase.table("medical_records").select("id").ilike("title", "%syndromic%").execute()
    old_cases = res.data
    if old_cases:
        ids = [c["id"] for c in old_cases]
        print(f"Found {len(ids)} old syndromic cases to delete.")
        # supabase python client does not have .in() delete properly without multiple calls sometimes,
        # but eq allows single deletion. Let's chunk or use .in_()
        supabase.table("medical_records").delete().in_("id", ids).execute()
        print("Deleted.")

    # 2. Fetch Navi Mumbai patients
    print("Fetching patients from Navi Mumbai/Nerul...")
    res = supabase.table("patients").select("*").or_("ward_name.eq.Nerul,city.eq.Navi Mumbai").execute()
    patients = res.data
    
    if not patients:
        print("No patients found in Nerul/Navi Mumbai!")
        return
        
    # 3. Filter age 5-15 or 20-45
    current_year = datetime.datetime.now().year
    susceptible = []
    for p in patients:
        if not p.get("date_of_birth"):
            susceptible.append(p)
            continue
            
        dob = datetime.datetime.fromisoformat(p["date_of_birth"].replace('Z', '+00:00'))
        age = current_year - dob.year
        if (5 <= age <= 15) or (20 <= age <= 45):
            susceptible.append(p)
            
    pool = susceptible if susceptible else patients
    print(f"Found {len(pool)} susceptible candidates for Dengue out of {len(patients)} total Nerul patients.")
    
    # 4. Generate 15 fresh records
    records = []
    
    for _ in range(15):
        p = random.choice(pool)
        
        # Random date between Mar 7 - Mar 10, 2026
        day = random.randint(7, 10)
        date = datetime.datetime(2026, 3, day, random.randint(0,23), random.randint(0,59))
        
        rec = {
            "id": str(uuid.uuid4()),
            "patient_id": p["id"],
            "record_type": "Clinical Note",
            "title": "Initial Evaluation (Syndromic)",
            "description": "Patient presents with acute high-grade fever (103°F), severe frontal headache, prominent retro-orbital pain (pain behind the eyes), and intense myalgia/arthralgia ('breakbone fever'). Mild petechial rash appearing on extremities. Suspected Dengue Fever; pending NS1 antigen and IgG/IgM lab confirmation.",
            "diagnosis": None,
            "icd_code": None,
            "icd_label": None,
            "created_by": p.get("created_by") or "a43f5996-e4bd-4147-b016-113cf95e9f77",
            "creator_name": "Dr. Asha Pawar",
            "organization_id": p.get("organization_id") or "057935f0-817b-4c40-862c-7b44ecfb1eaf",
            "status": "ACTIVE",
            "created_at": date.isoformat()
        }
        records.append(rec)
        
    # 5. Insert records
    print(f"Inserting {len(records)} records directly using Python...")
    supabase.table("medical_records").insert(records).execute()
    print("✅ Successfully seeded 15 Syndromic Dengue cases directly via Python.")

if __name__ == "__main__":
    seed_syndromic()
