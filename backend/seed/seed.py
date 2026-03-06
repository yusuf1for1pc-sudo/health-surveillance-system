"""
Main seed script for Health Surveillance System.
Truncates old data, generates new realistic epidemiological data using Gemini,
and inserts into Supabase.
"""
import os
import time
import random
import uuid
from datetime import datetime, timedelta
from dotenv import load_dotenv

from supabase import create_client, Client
from constants import (
    ORGANIZATIONS, WARD_DISTRIBUTIONS, WATER_INFRA_BIAS,
    DISEASE_DEMOGRAPHICS, TIMELINE_WEEKS, VISIT_PATTERNS,
    PRESCRIPTIONS, ICD_CODES, ICD_MAP
)
from gemini_gen import (
    generate_doctor_names, generate_patient_demographics,
    generate_clinical_note, generate_lab_result
)

# Load env
load_dotenv()
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    raise ValueError("Missing Supabase credentials in .env")

# Init client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

# -----------------------------------------------------------------------------
# Utility Functions
# -----------------------------------------------------------------------------

def random_date(start: datetime, end: datetime) -> datetime:
    """Generate a random datetime between start and end."""
    delta = end - start
    random_seconds = random.randint(0, int(delta.total_seconds()))
    return start + timedelta(seconds=random_seconds)

def get_age_from_group(age_group: str) -> int:
    """Convert age group string to a random specific age."""
    ranges = {
        "0_14": (1, 14),
        "15_30": (15, 30),
        "31_45": (31, 45),
        "46_60": (46, 60),
        "61_plus": (61, 85)
    }
    r = ranges.get(age_group, (30, 40))
    return random.randint(r[0], r[1])

def get_dob_from_age(age: int) -> str:
    """Calculate a rough DOB from an age."""
    today = datetime.now()
    year = today.year - age
    month = random.randint(1, 12)
    day = random.randint(1, 28)
    return f"{year}-{month:02d}-{day:02d}"

def calculate_coordinates(ward: str, disease: str) -> tuple[float, float]:
    """Calculate realistic biased coordinates for a patient."""
    center = WARD_DISTRIBUTIONS[ward]["center"]
    
    if disease in ["Leptospirosis", "Typhoid", "Gastroenteritis"]:
        # Water-borne: tight spread, bias to water infra
        lat = random.gauss(center[0], 0.002)
        lng = random.gauss(center[1], 0.002)
        
        if ward in WATER_INFRA_BIAS:
            bias_lat, bias_lng = WATER_INFRA_BIAS[ward]
            lat = lat * 0.7 + bias_lat * 0.3
            lng = lng * 0.7 + bias_lng * 0.3
            
    elif disease in ["Dengue", "Malaria", "Chikungunya"]:
        # Vector-borne: wider spread, no bias
        lat = random.gauss(center[0], 0.003)
        lng = random.gauss(center[1], 0.003)
        
    else: # Tuberculosis
        # Airborne/chronic: widest spread
        lat = random.gauss(center[0], 0.004)
        lng = random.gauss(center[1], 0.004)
        
    return round(lat, 6), round(lng, 6)

def determine_gender(disease: str) -> str:
    """Pick gender based on disease demographic distribution."""
    ratios = DISEASE_DEMOGRAPHICS[disease]["gender"]
    return "Male" if random.random() < ratios["Male"] else "Female"

def determine_age(disease: str) -> int:
    """Pick age based on disease demographic distribution."""
    ratios = DISEASE_DEMOGRAPHICS[disease]["age"]
    rand = random.random()
    cumulative = 0
    for group, prob in ratios.items():
        cumulative += prob
        if rand <= cumulative:
            return get_age_from_group(group)
    return 35 # Fallback

def get_visit_date(disease: str, week_num: int, visit_offset_days: int) -> str:
    """Calculate a visit date based on the assigned week and visit offset."""
    today = datetime.now()
    
    # week_num is 1 to 12 (or 1 to 24 for TB).
    # Current week is 12 (or 24 for TB).
    total_weeks = 24 if disease == "Tuberculosis" else 12
    
    weeks_ago = total_weeks - week_num
    
    # The start of the assigned week
    week_start = today - timedelta(weeks=weeks_ago) - timedelta(days=today.weekday())
    
    # Pick a random day within that week for the FIRST visit
    first_visit_date = week_start + timedelta(days=random.randint(0, 6))
    
    # Add the offset for THIS specific visit
    actual_visit_date = first_visit_date + timedelta(days=visit_offset_days)
    
    # Cap at today to not generate future records unexpectedly
    if actual_visit_date > today:
        actual_visit_date = today
        
    return actual_visit_date.isoformat()


# -----------------------------------------------------------------------------
# Main Execution Steps
# -----------------------------------------------------------------------------

def truncate_tables():
    print("--- Truncating existing tables ---")
    tables = [
        "prescriptions",
        "medical_records", 
        "patients", 
        {"table": "profiles", "column": "role", "value": "doctor"},
        "organizations"
    ]
    
    for t in tables:
        try:
            if isinstance(t, dict):
                if t["table"] == "profiles":
                    # Delete auth users to ensure clean slate
                    res = supabase.table(t["table"]).select("id").eq(t["column"], t["value"]).execute()
                    for r in res.data:
                        try:
                            supabase.auth.admin.delete_user(r["id"])
                        except:
                            pass
                    # Ensure profile row is also deleted if no cascade
                    supabase.table(t["table"]).delete().eq(t["column"], t["value"]).execute()
                else:
                    # Delete with filter normal
                    supabase.table(t["table"]).delete().eq(t["column"], t["value"]).execute()
                print(f"Truncated {t['table']} where {t['column']}={t['value']}")
            else:
                # Delete all
                res = supabase.table(t).select("id").execute()
                ids = [r["id"] for r in res.data]
                if ids:
                    for i in range(0, len(ids), 100):
                        batch = ids[i:i+100]
                        supabase.table(t).delete().in_("id", batch).execute()
                print(f"Truncated {t}")
        except Exception as e:
            print(f"Error truncating {t}: {e}")

def seed_icd_codes():
    print("\n--- Seeding ICD Codes ---")
    for icd in ICD_CODES:
        # Use simple insert, rely on Supabase to fail silently on duplicate if we can't do upsert easily
        # Pyresgrest doesn't have a clean ON CONFLICT DO NOTHING without an RPC, so we just try/except
        try:
            supabase.table("icd_codes").insert(icd).execute()
            print(f"Inserted {icd['code']}")
        except Exception as e:
            if "duplicate key value" in str(e).lower() or "23505" in str(e):
                print(f"Skipped {icd['code']} (already exists)")
            else:
                print(f"Error inserting {icd['code']}: {e}")

def seed_organizations():
    print("\n--- Seeding Organizations ---")
    orgs_with_ids = []
    for org in ORGANIZATIONS:
        org_data = org.copy()
        org_data["status"] = "approved"
        org_data["certificate_status"] = "verified"
        
        try:
            res = supabase.table("organizations").insert(org_data).execute()
            orgs_with_ids.append(res.data[0])
        except Exception as e:
            print(f"Error inserting org {org['name']}: {e}")
            
    print(f"Inserted {len(orgs_with_ids)} organizations.")
    return orgs_with_ids

def seed_doctors(orgs):
    print("\n--- Seeding Doctors ---")
    TOTAL_DOCTORS = 100
    
    print("Generating names with Gemini...")
    names = generate_doctor_names(TOTAL_DOCTORS)
    
    doctors = []
    
    for i in range(TOTAL_DOCTORS):
        org = orgs[i % len(orgs)] # Round robin
        
        name = names[i] if i < len(names) else f"Dr. Doctor {i}"
        first_name = name.split(" ")[1] if len(name.split(" ")) > 1 else "Doctor"
        last_name = name.split(" ")[-1] if len(name.split(" ")) > 2 else f"{i}"
        email = f"doc_{i}_{first_name.lower()}.{last_name.lower()}@tempest.health"
        
        try:
            # Create auth user (trigger auto-creates profile)
            auth_res = supabase.auth.admin.create_user({
                "email": email,
                "password": "password123",
                "email_confirm": True
            })
            
            user_id = auth_res.user.id
            
            doc_update = {
                "full_name": name,
                "role": "doctor",
                "organization_id": org["id"],
                "phone": f"+91987654{i:04d}"
            }
            
            res = supabase.table("profiles").update(doc_update).eq("id", user_id).execute()
            if res.data:
                doctors.append(res.data[0])
            
            if (i+1) % 25 == 0:
                print(f"Inserted {i+1} / {TOTAL_DOCTORS} doctors...")
        except Exception as e:
            print(f"Error inserting doctor {name}: {e}")
            
    print(f"Inserted {len(doctors)} doctors.")
    return doctors

def seed_patients_and_records(orgs, doctors):
    print("\n--- Seeding 400 Patients and their Medical Records ---")
    
    # 1. Build the target list of patients based on ward distributions
    target_patients = []
    patient_id_counter = 1
    
    for ward_name, ward_data in WARD_DISTRIBUTIONS.items():
        ward_orgs = [o for o in orgs if o["ward_name"] == ward_name]
        # Fallback to city orgs if no ward orgs match
        if not ward_orgs:
            ward_orgs = [o for o in orgs if o["city"] == ward_data["city"]]
        
        for disease, count_target in ward_data["diseases"].items():
            for _ in range(count_target):
                gender = determine_gender(disease)
                age = determine_age(disease)
                lat, lng = calculate_coordinates(ward_name, disease)
                
                # Pick assignable week based on trajectory weights
                distribution = TIMELINE_WEEKS.get(disease, [3.0] * 24) # Flat 24 if TB
                total_weight = sum(distribution)
                rand_val = random.uniform(0, total_weight)
                
                cumulative = 0
                assigned_week = len(distribution) # Default to last week
                for i, weight in enumerate(distribution):
                    cumulative += weight
                    if rand_val <= cumulative:
                        assigned_week = i + 1
                        break
                
                # Assign to a random doctor in that ward/city
                assigned_org = random.choice(ward_orgs)
                org_doctors = [d for d in doctors if d["organization_id"] == assigned_org["id"]]
                assigned_doctor = random.choice(org_doctors) if org_doctors else random.choice(doctors)
                
                target_patients.append({
                    "tmp_id": f"TMP-{patient_id_counter:04d}",
                    "disease": disease,
                    "ward_name": ward_name,
                    "city": ward_data["city"],
                    "pincode": ward_data["pincode"],
                    "lat": lat,
                    "lng": lng,
                    "gender": gender,
                    "age": age,
                    "assigned_week": assigned_week,
                    "organization_id": assigned_org["id"],
                    "doctor_id": assigned_doctor["id"]
                })
                patient_id_counter += 1

    # 2. Call Gemini in batches to generate names/phones
    print("Generating patient names and details with Gemini (in batches of 50)...")
    BATCH_SIZE = 50
    for i in range(0, len(target_patients), BATCH_SIZE):
        batch = target_patients[i:i+BATCH_SIZE]
        
        # We need a strict index loop for Gemini
        gemini_req = [{"index": idx, "gender": p["gender"], "age": p["age"]} for idx, p in enumerate(batch)]
        
        print(f"  Calling Gemini for batch {i//BATCH_SIZE + 1}...")
        enriched = generate_patient_demographics(gemini_req)
        
        for idx, p in enumerate(batch):
            p["full_name"] = enriched[idx].get("full_name", f"Patient {p['tmp_id']}")
            p["phone"] = enriched[idx].get("phone", "+919999999999")
            p["email"] = enriched[idx].get("email", None)

    # 3. Insert in DB and generate records
    print("\nInserting patients and generating clinical records...")
    
    total_records = 0
    total_prescriptions = 0
    total_patients_inserted = 0
    
    for i, p in enumerate(target_patients):
        db_patient = {
            "patient_id": p["tmp_id"],
            "full_name": p["full_name"],
            "phone": p["phone"],
            "date_of_birth": get_dob_from_age(p["age"]),
            "gender": p["gender"],
            "address": f"Near {p['ward_name']} Center",
            "ward_name": p["ward_name"],
            "city": p["city"],
            "state": "Maharashtra",
            "pincode": p["pincode"],
            "latitude": p["lat"],
            "longitude": p["lng"]
        }
        if p["email"]:
            db_patient["email"] = p["email"]
            
        try:
            # 3a. Insert Patient
            res = supabase.table("patients").insert(db_patient).execute()
            inserted_patient = res.data[0]
            total_patients_inserted += 1
            uuid_id = inserted_patient["id"]
            
            # 3b. Generate Records based on visit pattern
            disease = p["disease"]
            pattern = VISIT_PATTERNS.get(disease, [])
            icd_code = ICD_MAP.get(disease)
            
            for visit_idx, visit in enumerate(pattern):
                visit_num = visit_idx + 1
                visit_date = get_visit_date(disease, p["assigned_week"], visit["day"])
                
                record = {
                    "patient_id": uuid_id,
                    "organization_id": p["organization_id"],
                    "created_by": p["doctor_id"],
                    "record_type": visit["type"],
                    "title": f"{disease} {visit['type']} - Visit {visit_num}",
                    "icd_code": icd_code,
                    "diagnosis": disease,
                    "created_at": visit_date
                }
                
                # Determine status
                today = datetime.now()
                v_date = datetime.fromisoformat(visit_date)
                
                # Rules: Week 12 Lepto is ACTIVE. TB is ACTIVE.
                is_active = True
                if disease == "Tuberculosis":
                    pass # Always active
                elif disease == "Leptospirosis" and p["assigned_week"] == 12:
                    pass # Always active
                elif visit_idx == len(pattern) - 1: # Last visit
                    if (today - v_date).days > 7:
                        is_active = False
                
                record["status"] = "ACTIVE" if is_active else "RECOVERED"
                if not is_active:
                    record["resolved_at"] = (v_date + timedelta(days=5)).isoformat()
                    record["resolution_type"] = "AUTO"
                
                # Next visit date
                if visit_idx < len(pattern) - 1:
                    next_day_offset = pattern[visit_idx+1]["day"]
                    days_diff = next_day_offset - visit["day"]
                    record["recheck_date"] = (v_date + timedelta(days=days_diff)).date().isoformat()
                
                # Gemini text generation
                if visit["type"] == "Prescription":
                    record["description"] = generate_clinical_note(disease, visit_num)
                elif visit["type"] == "Lab Report":
                    record["description"] = generate_lab_result(visit["test"], disease, visit_num)
                elif visit["type"] == "Clinical Note":
                    record["description"] = generate_clinical_note(disease, visit_num)
                    
                # Store
                r_res = supabase.table("medical_records").insert(record).execute()
                inserted_record = r_res.data[0]
                total_records += 1
                
                # 3c. Insert Prescriptions if applicable
                if visit["type"] == "Prescription" and visit_idx == 0:
                    meds = PRESCRIPTIONS.get(disease, [])
                    for med in meds:
                        rx = {
                            "record_id": inserted_record["id"],
                            "medicine_name": med["medication_name"],
                            "dosage": str(med["dosage"]),
                            "frequency": med["frequency"],
                            "duration": str(med["duration_days"])
                        }
                        
                        supabase.table("prescriptions").insert(rx).execute()
                        total_prescriptions += 1
                        
        except Exception as e:
            print(f"Error processing patient {p['tmp_id']}: {e}")
            
        if (i+1) % 25 == 0:
            print(f"Processed {i+1} / {len(target_patients)} patients... Generated {total_records} records.")

    print(f"\nFinished seeding records. Inserted {total_patients_inserted} patients, {total_records} records, {total_prescriptions} prescriptions.")


def verify_and_rpc():
    print("\n--- Running RPC aggregations & Status Check ---")
    try:
        supabase.rpc("refresh_gov_analytics", {}).execute()
        print("refresh_gov_analytics() completed successfully.")
    except Exception as e:
        print(f"RPC refresh_gov_analytics failed: {e}")
        
    try:
        supabase.rpc("generate_alerts", {}).execute()
        print("generate_alerts() completed successfully.")
    except Exception as e:
        print(f"RPC generate_alerts failed: {e}")


def main():
    print("Starting TEMPEST Seed Script...")
    start_time = time.time()
    
    truncate_tables()
    seed_icd_codes()
    orgs = seed_organizations()
    doctors = seed_doctors(orgs)
    
    if orgs and doctors:
        seed_patients_and_records(orgs, doctors)
        verify_and_rpc()
    else:
        print("Seed aborted: Failed to generate orgs or doctors.")
        
    duration = time.time() - start_time
    print(f"\nSeed Script Completed in {duration:.1f} seconds!")

if __name__ == "__main__":
    main()
