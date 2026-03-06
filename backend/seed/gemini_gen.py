"""
Offline fallback generator for realistic Indian names and clinical text.
Used when Gemini API is unavailable.
"""
import random

# Realistic Indian name components
MALE_FIRST = ["Aarav", "Ramesh", "Suresh", "Ravi", "Amit", "Rahul", "Vivek", "Sanjay", "Anil", "Sunil", "Prakash", "Kiran", "Vijay", "Rajesh", "Deepak", "Vikram"]
FEMALE_FIRST = ["Sunita", "Priya", "Neha", "Anita", "Kavita", "Pooja", "Anjali", "Sneha", "Rekha", "Geeta", "Maya", "Meena", "Asha", "Usha", "Ritu"]
LAST_NAMES_MH = ["Patil", "Desai", "Kulkarni", "Joshi", "Pawar", "Shinde", "Kale", "Gaikwad", "Jadhav", "Kadam"]
LAST_NAMES_SI = ["Nair", "Pillai", "Reddy", "Iyer", "Rao", "Menon", "Krishnan"]
LAST_NAMES_NI = ["Sharma", "Gupta", "Singh", "Verma", "Mishra", "Kumar", "Yadav"]
LAST_NAMES_GJ = ["Shah", "Mehta", "Patel", "Deshmukh", "Chauhan"]
LAST_NAMES_OTHER = ["Das", "Bose", "Banerjee", "Chatterjee", "Sen"]

CLINICAL_NOTES_START = [
    "Patient presented with high grade fever, chills, and severe body ache.",
    "Complains of persistent fever with headache and joint pain for 3 days.",
    "Admitted with acute febrile illness, nausea, and generalized weakness.",
    "Reported to clinic with sudden onset fever, myalgia, and retro-orbital pain.",
    "Initial assessment shows elevated temperature, tachycardia, and signs of dehydration."
]

CLINICAL_NOTES_MID = [
    "Vitals stable. Patient reporting mild improvement but fever spikes persist.",
    "Symptoms are gradually subsiding. Advised complete bed rest and hydration.",
    "Lab reports reviewed. Treatment protocol initiated as per guidelines.",
    "Patient is responding to medication. Fever is low grade now.",
    "Complaining of severe weakness, but vitals are within acceptable limits."
]

CLINICAL_NOTES_END = [
    "Patient is afebrile for 48 hours. General condition is good. Discharged.",
    "Significant improvement noted. All symptoms resolved. Cleared to resume normal activities.",
    "Follow-up visit. Patient indicates full recovery. Stopping active medication.",
    "Vitals normal. No active complaints. Advised routine follow-up if symptoms return.",
    "Fully recovered. Discharged with advice on preventive measures."
]

LAB_RESULTS_START = {
    "Lepto IgM ELISA": "Positive for Leptospira IgM antibodies, indicating acute infection.",
    "Peripheral Blood Smear & Rapid Diagnostic Test": "Smear positive for Plasmodium vivax. RDT positive for P. vivax antigen.",
    "NS1 Antigen & Complete Blood Count (Platelets)": "Dengue NS1 Antigen Reactive. Platelet count reduced to 95,000/microL.",
    "Sputum AFB Smear": "Sputum smear POSITIVE for Acid Fast Bacilli (AFB). Grading: 2+",
}

LAB_RESULTS_FOLLOWUP = {
    "Lepto IgM ELISA": "Titers decreasing. Clinical correlation required for confirmation of recovery.",
    "Peripheral Blood Smear & Rapid Diagnostic Test": "Smear negative for Plasmodium species. Parasitemia cleared.",
    "NS1 Antigen & Complete Blood Count (Platelets)": "Platelet count improving, currently at 135,000/microL. Hematocrit stable.",
    "Sputum AFB Smear": "Sputum smear NEGATIVE for Acid Fast Bacilli (AFB) after 60 days of DOTS.",
}


def _get_random_last_name():
    # Mix: 40% MH, 20% SI, 15% NI, 15% GJ, 10% Other
    r = random.random()
    if r < 0.40: return random.choice(LAST_NAMES_MH)
    elif r < 0.60: return random.choice(LAST_NAMES_SI)
    elif r < 0.75: return random.choice(LAST_NAMES_NI)
    elif r < 0.90: return random.choice(LAST_NAMES_GJ)
    else: return random.choice(LAST_NAMES_OTHER)

def generate_doctor_names(count: int) -> list:
    """Generate offline Indian doctor names."""
    names = []
    for _ in range(count):
        is_male = random.random() < 0.60
        first = random.choice(MALE_FIRST) if is_male else random.choice(FEMALE_FIRST)
        last = _get_random_last_name()
        names.append(f"Dr. {first} {last}")
    return names

_phone_counter = 0
def generate_patient_demographics(demographics_list: list) -> list:
    """Generate offline realistic Mumbai names/phones matching gender."""
    global _phone_counter
    for idx, d in enumerate(demographics_list):
        gender = d.get('gender', 'Male')
        first = random.choice(MALE_FIRST) if gender == 'Male' else random.choice(FEMALE_FIRST)
        last = _get_random_last_name()
        
        d['full_name'] = f"{first} {last}"
        
        # Phone logic +91 followed by 9 and 9 sequential digits to prevent unique constraint errors
        _phone_counter += 1
        rest = f"{_phone_counter:09d}"
        d['phone'] = f"+919{rest}"
        
        if random.random() < 0.5:
            d['email'] = f"{first.lower()}.{last.lower()}{random.randint(10,99)}@gmail.com"
        else:
            d['email'] = ""
            
    return demographics_list

def generate_clinical_note(disease: str, visit_number: int) -> str:
    """Generate offline realistic clinical note."""
    if visit_number == 1:
        note = random.choice(CLINICAL_NOTES_START)
        return f"{note} Suspected {disease}."
    elif visit_number == 3:
        return random.choice(CLINICAL_NOTES_MID)
    else:
        return random.choice(CLINICAL_NOTES_END)

def generate_lab_result(test_name: str, disease: str, visit_number: int) -> str:
    """Generate offline realistic lab result summary."""
    if visit_number == 1 or visit_number == 2:
        # Abnormal / Positive
        return LAB_RESULTS_START.get(test_name, f"Abnormal findings consistent with {disease}.")
    else:
        # Follow up
        return LAB_RESULTS_FOLLOWUP.get(test_name, f"Follow-up test shows normalizing values for {disease}.")
