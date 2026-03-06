import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()
sb = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_KEY"])

# Check total patients
all_p = sb.table("patients").select("id", count="exact").execute()
print(f"Total patients: {all_p.count}")

# Check patients with null ward_name
nulls = sb.table("patients").select("id", count="exact").is_("ward_name", "null").execute()
print(f"Patients with NULL ward_name: {nulls.count}")

# Check sample data
sample = sb.table("patients").select("ward_name, pincode, city, state").limit(10).execute()
for r in sample.data:
    print(f"  ward={r.get('ward_name')}, pin={r.get('pincode')}, city={r.get('city')}, state={r.get('state')}")

# Check distinct pincodes
pincodes = sb.table("patients").select("pincode").execute()
unique_pins = set(r.get("pincode") for r in pincodes.data if r.get("pincode"))
print(f"\nDistinct pincodes in DB: {sorted(unique_pins)}")
