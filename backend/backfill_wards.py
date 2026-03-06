import os
import sys
from dotenv import load_dotenv
from supabase import create_client, Client

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from seed.constants import LOCATIONS

def get_supabase() -> Client:
    load_dotenv()
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_KEY")
    if not url or not key:
        print("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in backend/.env")
        sys.exit(1)
    return create_client(url, key)

def main():
    print("Starting Ward Backfill based on Pincodes...")
    supabase = get_supabase()
    
    # Build mapping
    pincode_to_ward = {loc["pincode"]: loc["ward"] for loc in LOCATIONS}
    print(f"Loaded {len(pincode_to_ward)} pincode mappings.")
    
    # Fetch all patients who don't have a ward_name
    print("Fetching patients without a ward_name...")
    response = supabase.table("patients").select("id, pincode").is_("ward_name", "null").execute()
    patients = response.data
    
    if not patients:
        print("All patients already have a ward_name! Nothing to do.")
        return
        
    print(f"Found {len(patients)} patients needing ward updates.")
    
    updated_count = 0
    for p in patients:
        pincode = p.get("pincode")
        if pincode in pincode_to_ward:
            ward = pincode_to_ward[pincode]
            try:
                supabase.table("patients").update({"ward_name": ward}).eq("id", p["id"]).execute()
                updated_count += 1
                if updated_count % 50 == 0:
                    print(f"Updated {updated_count} patients...")
            except Exception as e:
                print(f"Failed to update patient {p['id']}: {e}")
        else:
            print(f"Warning: Patient {p['id']} has unknown pincode {pincode}")
            
    print(f"Successfully updated {updated_count} patients with their ward name.")
    print("Done!")

if __name__ == "__main__":
    main()
