import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()
sb = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_KEY"])

# Pincode 400070 = Sion/Kurla area of Mumbai - closest to Wadala ward
# Map any unmapped pincodes to a reasonable ward
EXTRA_PINCODE_MAP = {
    "400070": "Kurla",
    "400071": "Chembur",
    "400022": "Sion",
    "400028": "Dadar",
}

# Fetch patients with no ward_name
response = sb.table("patients").select("id, pincode, city, state").is_("ward_name", "null").execute()
patients = response.data

print(f"Found {len(patients)} patients without ward_name")

updated = 0
for p in patients:
    pin = p.get("pincode", "")
    ward = EXTRA_PINCODE_MAP.get(pin)
    if ward:
        sb.table("patients").update({"ward_name": ward}).eq("id", p["id"]).execute()
        print(f"  Updated patient {p['id']}: pincode {pin} → ward {ward}")
        updated += 1
    else:
        # Fallback: assign based on city
        city = p.get("city", "")
        if city == "Mumbai":
            ward = "Wadala"
        elif city == "Pune":
            ward = "Shivajinagar"
        elif city == "Kalyan":
            ward = "Kalyan West"
        elif city == "Navi Mumbai":
            ward = "Vashi"
        else:
            ward = "Wadala"  # default
        sb.table("patients").update({"ward_name": ward}).eq("id", p["id"]).execute()
        print(f"  Updated patient {p['id']}: city {city} → ward {ward} (city fallback)")
        updated += 1

print(f"\nDone! Updated {updated} patients.")
