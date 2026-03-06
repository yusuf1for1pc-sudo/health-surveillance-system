"""
Constants and configuration for the Health Surveillance System seed script.
"""

# -----------------------------------------------------------------------------
# 1. Geographic & Organization Data
# -----------------------------------------------------------------------------

ORGANIZATIONS = [
    # Wadala Zone
    {"name": "Wadala Municipal Hospital", "type": "Hospital", "email": "contact@wadalahospital.in", "phone": "+912224111001", "country": "India", "city": "Mumbai", "state": "Maharashtra", "ward_name": "Wadala", "latitude": 19.0178, "longitude": 72.8478, "pincode": "400037", "address": "Antop Hill Road Wadala Mumbai"},
    {"name": "Antop Hill Urban Health Centre", "type": "Clinic", "email": "info@antopuHC.in", "phone": "+912224111002", "country": "India", "city": "Mumbai", "state": "Maharashtra", "ward_name": "Antop Hill", "latitude": 19.0220, "longitude": 72.8420, "pincode": "400037", "address": "Antop Hill Road Mumbai"},
    {"name": "Sewri General Hospital", "type": "Hospital", "email": "admin@sewrihospital.in", "phone": "+912224111003", "country": "India", "city": "Mumbai", "state": "Maharashtra", "ward_name": "Sewri", "latitude": 19.0089, "longitude": 72.8456, "pincode": "400015", "address": "Sewri Cross Road Mumbai"},
    {"name": "M-West Ward Health Post", "type": "Clinic", "email": "wardmwest@mcgm.gov.in", "phone": "+912224111004", "country": "India", "city": "Mumbai", "state": "Maharashtra", "ward_name": "Wadala", "latitude": 19.0150, "longitude": 72.8460, "pincode": "400037", "address": "M-West Ward Office Compound Mumbai"},
    {"name": "Kohinoor Diagnostic Centre", "type": "Laboratory", "email": "labs@kohinoordiagnostics.in", "phone": "+912224111005", "country": "India", "city": "Mumbai", "state": "Maharashtra", "ward_name": "Antop Hill", "latitude": 19.0200, "longitude": 72.8440, "pincode": "400037", "address": "Kohinoor Nagar Antop Hill Mumbai"},
    {"name": "Wadala Railway Hospital", "type": "Hospital", "email": "medical@wadalarailways.in", "phone": "+912224111006", "country": "India", "city": "Mumbai", "state": "Maharashtra", "ward_name": "Wadala", "latitude": 19.0190, "longitude": 72.8490, "pincode": "400037", "address": "Wadala Railway Colony Mumbai"},

    # South Mumbai Zone
    {"name": "St. George Hospital", "type": "Hospital", "email": "info@stgeorge.in", "phone": "+912222621001", "country": "India", "city": "Mumbai", "state": "Maharashtra", "ward_name": "Fort", "latitude": 18.9378, "longitude": 72.8359, "pincode": "400001", "address": "CST Road Fort Mumbai"},
    {"name": "Colaba Community Health Centre", "type": "Clinic", "email": "colabachc@mcgm.gov.in", "phone": "+912222621002", "country": "India", "city": "Mumbai", "state": "Maharashtra", "ward_name": "Colaba", "latitude": 18.9067, "longitude": 72.8147, "pincode": "400005", "address": "Colaba Causeway Mumbai"},
    {"name": "Bombay Port Trust Hospital", "type": "Hospital", "email": "medical@jnpt.gov.in", "phone": "+912222621003", "country": "India", "city": "Mumbai", "state": "Maharashtra", "ward_name": "Colaba", "latitude": 18.9100, "longitude": 72.8200, "pincode": "400001", "address": "Indira Dock Road Colaba Mumbai"},
    {"name": "Fort Area Diagnostic Lab", "type": "Laboratory", "email": "results@fortlabs.in", "phone": "+912222621004", "country": "India", "city": "Mumbai", "state": "Maharashtra", "ward_name": "Fort", "latitude": 18.9322, "longitude": 72.8264, "pincode": "400001", "address": "Horniman Circle Fort Mumbai"},

    # Matunga-Dadar Zone
    {"name": "Hinduja Hospital Mahim", "type": "Hospital", "email": "info@hindujahospital.com", "phone": "+912224441001", "country": "India", "city": "Mumbai", "state": "Maharashtra", "ward_name": "Matunga", "latitude": 19.0454, "longitude": 72.8395, "pincode": "400016", "address": "Swami Vivekanand Road Mahim Mumbai"},
    {"name": "Dadar Health Post", "type": "Clinic", "email": "dadarpost@mcgm.gov.in", "phone": "+912224441002", "country": "India", "city": "Mumbai", "state": "Maharashtra", "ward_name": "Dadar", "latitude": 19.0176, "longitude": 72.8562, "pincode": "400014", "address": "Dadar West Mumbai"},

    # Kalyan-Dombivli Zone
    {"name": "Kalyan District Hospital", "type": "Hospital", "email": "kalyanhospital@dhma.gov.in", "phone": "+912512301001", "country": "India", "city": "Kalyan", "state": "Maharashtra", "ward_name": "Kalyan West", "latitude": 19.2437, "longitude": 73.1355, "pincode": "421301", "address": "Station Road Kalyan West"},
    {"name": "Rukminibai Hospital", "type": "Hospital", "email": "rukminibai@kdmc.gov.in", "phone": "+912512301002", "country": "India", "city": "Kalyan", "state": "Maharashtra", "ward_name": "Kalyan East", "latitude": 19.2354, "longitude": 73.1558, "pincode": "421306", "address": "Kalyan East Maharashtra"},
    {"name": "Dombivli Municipal Clinic", "type": "Clinic", "email": "warddombivli@kdmc.gov.in", "phone": "+912512301003", "country": "India", "city": "Dombivli", "state": "Maharashtra", "ward_name": "Dombivli", "latitude": 19.2183, "longitude": 73.0868, "pincode": "421201", "address": "Manpada Road Dombivli"},
    {"name": "Kalyan Diagnostic Centre", "type": "Laboratory", "email": "labs@kalyandiagnostics.in", "phone": "+912512301004", "country": "India", "city": "Kalyan", "state": "Maharashtra", "ward_name": "Kalyan West", "latitude": 19.2400, "longitude": 73.1400, "pincode": "421301", "address": "Kalyan West Maharashtra"},

    # Navi Mumbai Zone
    {"name": "MGM Hospital Belapur", "type": "Hospital", "email": "info@mgmbelapur.in", "phone": "+912227561001", "country": "India", "city": "Navi Mumbai", "state": "Maharashtra", "ward_name": "Belapur", "latitude": 19.0227, "longitude": 73.0389, "pincode": "400614", "address": "Sector 18 CBD Belapur Navi Mumbai"},
    {"name": "Vashi Sector 9 Health Centre", "type": "Clinic", "email": "vashi9@nmmc.gov.in", "phone": "+912227561002", "country": "India", "city": "Navi Mumbai", "state": "Maharashtra", "ward_name": "Vashi", "latitude": 19.0771, "longitude": 72.9988, "pincode": "400703", "address": "Sector 9 Vashi Navi Mumbai"},
    {"name": "Nerul Community Clinic", "type": "Clinic", "email": "nerulclinic@nmmc.gov.in", "phone": "+912227561003", "country": "India", "city": "Navi Mumbai", "state": "Maharashtra", "ward_name": "Nerul", "latitude": 19.0330, "longitude": 73.0169, "pincode": "400706", "address": "Sector 21 Nerul Navi Mumbai"},

    # Pune Zone
    {"name": "Shivajinagar District Hospital", "type": "Hospital", "email": "shivajinagar@punehealth.gov.in", "phone": "+912025531001", "country": "India", "city": "Pune", "state": "Maharashtra", "ward_name": "Shivajinagar", "latitude": 18.5308, "longitude": 73.8474, "pincode": "411005", "address": "University Road Shivajinagar Pune"},
]

# -----------------------------------------------------------------------------
# 2. Patient Distribution (Ward-level counts & disease prevalence)
# -----------------------------------------------------------------------------

WARD_DISTRIBUTIONS = {
    "Wadala": {"count": 80, "center": (19.0178, 72.8478), "pincode": "400037", "city": "Mumbai", "diseases": {"Leptospirosis": 50, "Malaria": 25, "Typhoid": 15, "Tuberculosis": 10}},
    "Antop Hill": {"count": 60, "center": (19.0220, 72.8420), "pincode": "400037", "city": "Mumbai", "diseases": {"Leptospirosis": 45, "Dengue": 25, "Gastroenteritis": 20, "Tuberculosis": 10}},
    "Wadala": {"count": 45, "center": (19.015, 72.859), "pincode": "400031", "city": "Mumbai", "diseases": {"Leptospirosis": 50, "Dengue": 20, "Tuberculosis": 10}},
    "Antop Hill": {"count": 40, "center": (19.025, 72.865), "pincode": "400037", "city": "Mumbai", "diseases": {"Leptospirosis": 40, "Dengue": 25, "Typhoid": 15}},
    "Sewri": {"count": 50, "center": (19.0089, 72.8456), "pincode": "400015", "city": "Mumbai", "diseases": {"Leptospirosis": 40, "Typhoid": 25, "Malaria": 20, "Tuberculosis": 15}},
    "Colaba": {"count": 40, "center": (18.9067, 72.8147), "pincode": "400005", "city": "Mumbai", "diseases": {"Leptospirosis": 30, "Dengue": 30, "Gastroenteritis": 25, "Tuberculosis": 15}},
    "Fort": {"count": 30, "center": (18.9322, 72.8264), "pincode": "400001", "city": "Mumbai", "diseases": {"Dengue": 35, "Gastroenteritis": 30, "Leptospirosis": 20, "Tuberculosis": 15}},
    "Matunga": {"count": 25, "center": (19.0454, 72.8395), "pincode": "400019", "city": "Mumbai", "diseases": {"Dengue": 40, "Malaria": 30, "Chikungunya": 20, "Tuberculosis": 10}},
    "Dadar": {"count": 15, "center": (19.0176, 72.8562), "pincode": "400014", "city": "Mumbai", "diseases": {"Dengue": 35, "Malaria": 30, "Typhoid": 20, "Tuberculosis": 15}},
    "Kalyan West": {"count": 30, "center": (19.2437, 73.1355), "pincode": "421301", "city": "Kalyan", "diseases": {"Malaria": 45, "Dengue": 30, "Tuberculosis": 15, "Chikungunya": 10}},
    "Kalyan East": {"count": 25, "center": (19.2354, 73.1558), "pincode": "421306", "city": "Kalyan", "diseases": {"Malaria": 40, "Dengue": 30, "Leptospirosis": 20, "Tuberculosis": 10}},
    "Dombivli": {"count": 25, "center": (19.2183, 73.0868), "pincode": "421201", "city": "Dombivli", "diseases": {"Dengue": 40, "Malaria": 30, "Chikungunya": 20, "Tuberculosis": 10}},
    "Vashi": {"count": 25, "center": (19.0771, 72.9988), "pincode": "400703", "city": "Navi Mumbai", "diseases": {"Dengue": 45, "Chikungunya": 25, "Tuberculosis": 20, "Malaria": 10}},
    "Belapur": {"count": 25, "center": (19.0227, 73.0389), "pincode": "400614", "city": "Navi Mumbai", "diseases": {"Dengue": 40, "Chikungunya": 30, "Tuberculosis": 20, "Malaria": 10}},
    "Nerul": {"count": 20, "center": (19.0330, 73.0169), "pincode": "400706", "city": "Navi Mumbai", "diseases": {"Chikungunya": 40, "Dengue": 35, "Tuberculosis": 15, "Malaria": 10}},
    "Shivajinagar": {"count": 20, "center": (18.5308, 73.8474), "pincode": "411005", "city": "Pune", "diseases": {"Tuberculosis": 40, "Dengue": 35, "Typhoid": 25}},
    "Hadapsar": {"count": 15, "center": (18.5089, 73.9259), "pincode": "411028", "city": "Pune", "diseases": {"Dengue": 45, "Tuberculosis": 30, "Typhoid": 25}},
    "Pimpri": {"count": 15, "center": (18.6279, 73.7997), "pincode": "411017", "city": "Pune", "diseases": {"Malaria": 40, "Dengue": 35, "Tuberculosis": 25}},
}

# -----------------------------------------------------------------------------
# 3. Geo Offsets & Bias (Simulating environmental spread)
# -----------------------------------------------------------------------------

WATER_INFRA_BIAS = {
    "Wadala": (19.0089, 72.8456), # Wadala Pumping Station
    "Antop Hill": (19.0290, 72.8470), # Dharavi Water Tank
    "Sewri": (19.0050, 72.8430), # Sewri Water Works
    "Colaba": (18.9050, 72.8130),
    "Fort": (18.9300, 72.8280),
    "Kalyan East": (19.2380, 73.1520),
    "Belapur": (19.0200, 73.0360),
}

# -----------------------------------------------------------------------------
# 4. Disease Demographics (BMC Epidemiological Ratios)
# -----------------------------------------------------------------------------

DISEASE_DEMOGRAPHICS = {
    "Leptospirosis": {
        "gender": {"Male": 0.62, "Female": 0.38},
        "age": {"0_14": 0.08, "15_30": 0.25, "31_45": 0.35, "46_60": 0.20, "61_plus": 0.12}
    },
    "Dengue": {
        "gender": {"Male": 0.55, "Female": 0.45},
        "age": {"0_14": 0.30, "15_30": 0.25, "31_45": 0.20, "46_60": 0.15, "61_plus": 0.10}
    },
    "Malaria": {
        "gender": {"Male": 0.65, "Female": 0.35},
        "age": {"0_14": 0.15, "15_30": 0.30, "31_45": 0.30, "46_60": 0.15, "61_plus": 0.10}
    },
    "Typhoid": {
        "gender": {"Male": 0.55, "Female": 0.45},
        "age": {"0_14": 0.20, "15_30": 0.35, "31_45": 0.25, "46_60": 0.15, "61_plus": 0.05}
    },
    "Gastroenteritis": {
        "gender": {"Male": 0.50, "Female": 0.50},
        "age": {"0_14": 0.25, "15_30": 0.25, "31_45": 0.25, "46_60": 0.15, "61_plus": 0.10}
    },
    "Chikungunya": {
        "gender": {"Male": 0.48, "Female": 0.52},
        "age": {"0_14": 0.15, "15_30": 0.20, "31_45": 0.30, "46_60": 0.25, "61_plus": 0.10}
    },
    "Tuberculosis": {
        "gender": {"Male": 0.60, "Female": 0.40},
        "age": {"0_14": 0.05, "15_30": 0.20, "31_45": 0.30, "46_60": 0.25, "61_plus": 0.20}
    }
}

# -----------------------------------------------------------------------------
# 5. Outbreak Sequencing (Weekly Case Targets)
# -----------------------------------------------------------------------------

# For 12-week diseases, indices 0-11 map to Week 1 to Week 12
TIMELINE_WEEKS = {
    "Leptospirosis": [1.5, 1.5, 1.5, 1.5, 1.5, 1.5, 1.5, 1.5, 4.5, 7.0, 10.0, 15.0],  # Major outbreal peak week 12
    "Malaria":       [2.5, 2.5, 2.5, 2.5, 4.5, 4.5, 4.5, 4.5, 6.5, 6.5, 9.0, 9.0],    # Pre-monsoon build (18% rise)
    "Dengue":        [1.5, 1.5, 1.5, 1.5, 3.5, 3.5, 3.5, 3.5, 5.5, 5.5, 7.5, 7.5],    # 48% surge
    "Typhoid":       [1.5, 1.5, 1.5, 1.5, 1.5, 1.5, 1.5, 1.5, 1.5, 1.5, 3.0, 3.0],    # Slight rise at end
    "Gastroenteritis":[2.5, 2.5, 2.5, 2.5, 2.5, 2.5, 3.5, 3.5, 3.5, 3.5, 4.5, 4.5],   # Steady rise
    "Chikungunya":   [0.5, 0.5, 0.5, 0.5, 0.0, 0.0, 2.5, 2.5, 0.5, 0.5, 1.5, 1.5],    # Spiky 447% surge
    # Tuberculosis is handled separately (24 weeks flat)
}

# -----------------------------------------------------------------------------
# 6. Patient Visit Protocols & Prescriptions
# -----------------------------------------------------------------------------

VISIT_PATTERNS = {
    "Leptospirosis": [
        {"day": 0, "type": "Prescription"},
        {"day": 3, "type": "Lab Report", "test": "Lepto IgM ELISA"},
        {"day": 7, "type": "Prescription"},
        {"day": 10, "type": "Clinical Note"},
        {"day": 14, "type": "Clinical Note"},
    ],
    "Malaria": [
        {"day": 0, "type": "Prescription"},
        {"day": 3, "type": "Lab Report", "test": "Peripheral Blood Smear & Rapid Diagnostic Test"},
        {"day": 7, "type": "Clinical Note"},
    ],
    "Dengue": [
        {"day": 0, "type": "Prescription"},
        {"day": 2, "type": "Lab Report", "test": "NS1 Antigen & Complete Blood Count (Platelets)"},
        {"day": 6, "type": "Clinical Note"},
    ],
    "Typhoid": [
        {"day": 0, "type": "Prescription"},
        {"day": 14, "type": "Clinical Note"},
    ],
    "Gastroenteritis": [
        {"day": 0, "type": "Prescription"},
        {"day": 3, "type": "Clinical Note"},
    ],
    "Chikungunya": [
        {"day": 0, "type": "Prescription"},
        {"day": 5, "type": "Clinical Note"},
        {"day": 15, "type": "Clinical Note"},
    ],
    "Tuberculosis": [
        {"day": 0,   "type": "Prescription"},
        {"day": 30,  "type": "Prescription"},
        {"day": 60,  "type": "Lab Report", "test": "Sputum AFB Smear"},
        {"day": 90,  "type": "Prescription"},
        {"day": 120, "type": "Prescription"},
        {"day": 150, "type": "Lab Report", "test": "Sputum AFB Smear"},
        {"day": 180, "type": "Prescription"},
        {"day": 210, "type": "Prescription"},
    ],
}

PRESCRIPTIONS = {
    "Leptospirosis": [
        {"medication_name": "Doxycycline", "dosage": "100mg", "frequency": {"times": 2, "period": "day", "label": "BD"}, "duration_days": 7},
        {"medication_name": "Paracetamol", "dosage": "500mg", "frequency": {"times": 3, "period": "day", "label": "TDS"}, "duration_days": 3, "notes": "SOS as needed"},
    ],
    "Malaria": [
        {"medication_name": "Artemether-Lumefantrine", "dosage": "80/480mg", "frequency": {"times": 2, "period": "day", "label": "BD"}, "duration_days": 3},
        {"medication_name": "Primaquine", "dosage": "7.5mg", "frequency": {"times": 1, "period": "day", "label": "OD"}, "duration_days": 14},
    ],
    "Dengue": [
        {"medication_name": "Paracetamol", "dosage": "500mg", "frequency": {"times": 3, "period": "day", "label": "TDS"}, "duration_days": 5, "notes": "SOS only. NO NSAIDs (Avoid Ibuprofen/Aspirin)"},
    ],
    "Tuberculosis": [
        {"medication_name": "Rifampicin", "dosage": "600mg", "frequency": {"times": 1, "period": "day", "label": "OD"}, "duration_days": 180, "notes": "DOTS Ongoing"},
        {"medication_name": "Isoniazid", "dosage": "300mg", "frequency": {"times": 1, "period": "day", "label": "OD"}, "duration_days": 180, "notes": "DOTS Ongoing"},
        {"medication_name": "Pyrazinamide", "dosage": "1500mg", "frequency": {"times": 1, "period": "day", "label": "OD"}, "duration_days": 60, "notes": "DOTS Intensive Phase"},
    ],
    "Typhoid": [
        {"medication_name": "Azithromycin", "dosage": "500mg", "frequency": {"times": 1, "period": "day", "label": "OD"}, "duration_days": 7},
    ],
    "Gastroenteritis": [
        {"medication_name": "Ondansetron", "dosage": "4mg", "frequency": {"times": 3, "period": "day", "label": "TDS"}, "duration_days": 3},
        {"medication_name": "Metronidazole", "dosage": "400mg", "frequency": {"times": 3, "period": "day", "label": "TDS"}, "duration_days": 5},
        {"medication_name": "ORS Sachet", "dosage": "1 packet", "frequency": {"times": 1, "period": "day", "label": "SOS"}, "duration_days": 5, "notes": "After every loose stool"},
    ],
    "Chikungunya": [
        {"medication_name": "Paracetamol", "dosage": "500mg", "frequency": {"times": 3, "period": "day", "label": "TDS"}, "duration_days": 5, "notes": "SOS"},
        {"medication_name": "Chloroquine", "dosage": "250mg", "frequency": {"times": 1, "period": "day", "label": "OD"}, "duration_days": 5},
    ],
}

# -----------------------------------------------------------------------------
# 7. ICD Codes to Insert
# -----------------------------------------------------------------------------

ICD_CODES = [
    {"code": "A27.9", "short_description": "Leptospirosis", "category": "Bacterial", "body_system": "Systemic"},
    {"code": "A90", "short_description": "Dengue Fever", "category": "Viral", "body_system": "Systemic"},
    {"code": "B54", "short_description": "Malaria Unspecified", "category": "Parasitic", "body_system": "Blood"},
    {"code": "A01.0", "short_description": "Typhoid Fever", "category": "Bacterial", "body_system": "Gastrointestinal"},
    {"code": "A92.0", "short_description": "Chikungunya Virus Disease", "category": "Viral", "body_system": "Musculoskeletal"},
    {"code": "A09", "short_description": "Gastroenteritis and Colitis", "category": "Mixed", "body_system": "Gastrointestinal"},
    {"code": "A15", "short_description": "Respiratory Tuberculosis", "category": "Bacterial", "body_system": "Respiratory"},
]

ICD_MAP = {
    "Leptospirosis": "A27.9",
    "Dengue": "A90",
    "Malaria": "B54",
    "Typhoid": "A01.0",
    "Chikungunya": "A92.0",
    "Gastroenteritis": "A09",
    "Tuberculosis": "A15",
}
