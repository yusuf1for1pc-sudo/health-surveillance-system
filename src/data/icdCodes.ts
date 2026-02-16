import type { ICDCode } from '@/lib/types';

export const icdCodes: ICDCode[] = [
    // ── Infectious Diseases ─────────────────────────────────
    { code: 'A00', label: 'Cholera', category: 'Infectious' },
    { code: 'A01', label: 'Typhoid and paratyphoid fevers', category: 'Infectious' },
    { code: 'A02', label: 'Other salmonella infections', category: 'Infectious' },
    { code: 'A03', label: 'Shigellosis', category: 'Infectious' },
    { code: 'A04', label: 'Other bacterial intestinal infections', category: 'Infectious' },
    { code: 'A05', label: 'Other bacterial foodborne intoxications', category: 'Infectious' },
    { code: 'A06', label: 'Amoebiasis', category: 'Infectious' },
    { code: 'A09', label: 'Infectious gastroenteritis and colitis', category: 'Infectious' },
    { code: 'A15', label: 'Respiratory tuberculosis', category: 'Infectious' },
    { code: 'A16', label: 'Tuberculosis of other organs', category: 'Infectious' },
    { code: 'A20', label: 'Plague', category: 'Infectious' },
    { code: 'A21', label: 'Tularaemia', category: 'Infectious' },
    { code: 'A33', label: 'Tetanus neonatorum', category: 'Infectious' },
    { code: 'A35', label: 'Other tetanus', category: 'Infectious' },
    { code: 'A36', label: 'Diphtheria', category: 'Infectious' },
    { code: 'A37', label: 'Whooping cough', category: 'Infectious' },
    { code: 'A38', label: 'Scarlet fever', category: 'Infectious' },
    { code: 'A39', label: 'Meningococcal infection', category: 'Infectious' },
    { code: 'A50', label: 'Congenital syphilis', category: 'Infectious' },
    { code: 'A60', label: 'Anogenital herpesviral infection', category: 'Infectious' },
    { code: 'A80', label: 'Acute poliomyelitis', category: 'Infectious' },
    { code: 'A82', label: 'Rabies', category: 'Infectious' },
    { code: 'A90', label: 'Dengue fever', category: 'Infectious' },
    { code: 'A91', label: 'Dengue hemorrhagic fever', category: 'Infectious' },
    { code: 'A92', label: 'Other mosquito-borne viral fevers', category: 'Infectious' },

    // ── Viral Infections ────────────────────────────────────
    { code: 'B00', label: 'Herpesviral infections', category: 'Viral' },
    { code: 'B01', label: 'Varicella (chickenpox)', category: 'Viral' },
    { code: 'B02', label: 'Zoster (herpes zoster / shingles)', category: 'Viral' },
    { code: 'B05', label: 'Measles', category: 'Viral' },
    { code: 'B06', label: 'Rubella', category: 'Viral' },
    { code: 'B15', label: 'Acute hepatitis A', category: 'Viral' },
    { code: 'B16', label: 'Acute hepatitis B', category: 'Viral' },
    { code: 'B17', label: 'Other acute viral hepatitis', category: 'Viral' },
    { code: 'B20', label: 'HIV disease', category: 'Viral' },
    { code: 'B34', label: 'Viral infection of unspecified site', category: 'Viral' },
    { code: 'U07.1', label: 'COVID-19, virus identified', category: 'Viral' },
    { code: 'U07.2', label: 'COVID-19, virus not identified', category: 'Viral' },

    // ── Neoplasms ───────────────────────────────────────────
    { code: 'C34', label: 'Malignant neoplasm of bronchus and lung', category: 'Neoplasms' },
    { code: 'C50', label: 'Malignant neoplasm of breast', category: 'Neoplasms' },
    { code: 'C61', label: 'Malignant neoplasm of prostate', category: 'Neoplasms' },
    { code: 'C18', label: 'Malignant neoplasm of colon', category: 'Neoplasms' },
    { code: 'D50', label: 'Iron deficiency anaemia', category: 'Blood Disorders' },

    // ── Endocrine / Metabolic ───────────────────────────────
    { code: 'E03', label: 'Hypothyroidism', category: 'Endocrine' },
    { code: 'E05', label: 'Thyrotoxicosis (hyperthyroidism)', category: 'Endocrine' },
    { code: 'E10', label: 'Type 1 diabetes mellitus', category: 'Endocrine' },
    { code: 'E11', label: 'Type 2 diabetes mellitus', category: 'Endocrine' },
    { code: 'E14', label: 'Unspecified diabetes mellitus', category: 'Endocrine' },
    { code: 'E66', label: 'Obesity', category: 'Endocrine' },
    { code: 'E78', label: 'Disorders of lipoprotein metabolism', category: 'Endocrine' },

    // ── Mental / Behavioural ────────────────────────────────
    { code: 'F10', label: 'Alcohol-related disorders', category: 'Mental Health' },
    { code: 'F20', label: 'Schizophrenia', category: 'Mental Health' },
    { code: 'F32', label: 'Depressive episode', category: 'Mental Health' },
    { code: 'F41', label: 'Other anxiety disorders', category: 'Mental Health' },

    // ── Nervous System ──────────────────────────────────────
    { code: 'G20', label: "Parkinson's disease", category: 'Nervous System' },
    { code: 'G30', label: "Alzheimer's disease", category: 'Nervous System' },
    { code: 'G40', label: 'Epilepsy', category: 'Nervous System' },
    { code: 'G43', label: 'Migraine', category: 'Nervous System' },

    // ── Eye / Ear ───────────────────────────────────────────
    { code: 'H10', label: 'Conjunctivitis', category: 'Eye/Ear' },
    { code: 'H66', label: 'Otitis media', category: 'Eye/Ear' },

    // ── Cardiovascular ──────────────────────────────────────
    { code: 'I10', label: 'Essential (primary) hypertension', category: 'Cardiovascular' },
    { code: 'I11', label: 'Hypertensive heart disease', category: 'Cardiovascular' },
    { code: 'I20', label: 'Angina pectoris', category: 'Cardiovascular' },
    { code: 'I21', label: 'Acute myocardial infarction', category: 'Cardiovascular' },
    { code: 'I25', label: 'Chronic ischemic heart disease', category: 'Cardiovascular' },
    { code: 'I48', label: 'Atrial fibrillation and flutter', category: 'Cardiovascular' },
    { code: 'I50', label: 'Heart failure', category: 'Cardiovascular' },
    { code: 'I63', label: 'Cerebral infarction (stroke)', category: 'Cardiovascular' },
    { code: 'I64', label: 'Stroke, not specified', category: 'Cardiovascular' },

    // ── Respiratory ─────────────────────────────────────────
    { code: 'J00', label: 'Acute nasopharyngitis (common cold)', category: 'Respiratory' },
    { code: 'J02', label: 'Acute pharyngitis', category: 'Respiratory' },
    { code: 'J03', label: 'Acute tonsillitis', category: 'Respiratory' },
    { code: 'J06', label: 'Acute upper respiratory infections', category: 'Respiratory' },
    { code: 'J09', label: 'Influenza due to identified avian influenza virus', category: 'Respiratory' },
    { code: 'J10', label: 'Influenza due to other identified influenza virus', category: 'Respiratory' },
    { code: 'J11', label: 'Influenza, virus not identified', category: 'Respiratory' },
    { code: 'J12', label: 'Viral pneumonia', category: 'Respiratory' },
    { code: 'J18', label: 'Pneumonia, unspecified organism', category: 'Respiratory' },
    { code: 'J20', label: 'Acute bronchitis', category: 'Respiratory' },
    { code: 'J40', label: 'Bronchitis, not specified', category: 'Respiratory' },
    { code: 'J44', label: 'Chronic obstructive pulmonary disease', category: 'Respiratory' },
    { code: 'J45', label: 'Asthma', category: 'Respiratory' },
    { code: 'J46', label: 'Status asthmaticus', category: 'Respiratory' },

    // ── Digestive ───────────────────────────────────────────
    { code: 'K21', label: 'Gastro-esophageal reflux disease', category: 'Digestive' },
    { code: 'K25', label: 'Gastric ulcer', category: 'Digestive' },
    { code: 'K29', label: 'Gastritis and duodenitis', category: 'Digestive' },
    { code: 'K35', label: 'Acute appendicitis', category: 'Digestive' },
    { code: 'K40', label: 'Inguinal hernia', category: 'Digestive' },
    { code: 'K80', label: 'Cholelithiasis (gallstones)', category: 'Digestive' },

    // ── Skin ────────────────────────────────────────────────
    { code: 'L20', label: 'Atopic dermatitis', category: 'Skin' },
    { code: 'L40', label: 'Psoriasis', category: 'Skin' },
    { code: 'L50', label: 'Urticaria', category: 'Skin' },

    // ── Musculoskeletal ─────────────────────────────────────
    { code: 'M05', label: 'Rheumatoid arthritis', category: 'Musculoskeletal' },
    { code: 'M15', label: 'Polyarthrosis (osteoarthritis)', category: 'Musculoskeletal' },
    { code: 'M54', label: 'Dorsalgia (back pain)', category: 'Musculoskeletal' },
    { code: 'M79', label: 'Soft tissue disorders', category: 'Musculoskeletal' },

    // ── Genitourinary ───────────────────────────────────────
    { code: 'N18', label: 'Chronic kidney disease', category: 'Genitourinary' },
    { code: 'N39', label: 'Urinary tract infection', category: 'Genitourinary' },
    { code: 'N40', label: 'Benign prostatic hyperplasia', category: 'Genitourinary' },

    // ── Pregnancy ───────────────────────────────────────────
    { code: 'O80', label: 'Single spontaneous delivery', category: 'Pregnancy' },
    { code: 'O82', label: 'Delivery by caesarean section', category: 'Pregnancy' },

    // ── Symptoms / Signs ────────────────────────────────────
    { code: 'R05', label: 'Cough', category: 'Symptoms' },
    { code: 'R06', label: 'Dyspnoea (shortness of breath)', category: 'Symptoms' },
    { code: 'R07', label: 'Chest pain', category: 'Symptoms' },
    { code: 'R10', label: 'Abdominal and pelvic pain', category: 'Symptoms' },
    { code: 'R11', label: 'Nausea and vomiting', category: 'Symptoms' },
    { code: 'R50', label: 'Fever of other and unknown origin', category: 'Symptoms' },
    { code: 'R51', label: 'Headache', category: 'Symptoms' },

    // ── Injury / External Causes ────────────────────────────
    { code: 'S52', label: 'Fracture of forearm', category: 'Injury' },
    { code: 'S72', label: 'Fracture of femur', category: 'Injury' },
    { code: 'S82', label: 'Fracture of lower leg', category: 'Injury' },
    { code: 'T78', label: 'Adverse effects, not elsewhere classified', category: 'Injury' },

    // ── External Causes ─────────────────────────────────────
    { code: 'Z00', label: 'General examination without complaint', category: 'Factors' },
    { code: 'Z23', label: 'Encounter for immunization', category: 'Factors' },
    { code: 'Z71', label: 'Persons encountering health services for counselling', category: 'Factors' },
];

export const icdCategories = [...new Set(icdCodes.map(c => c.category))];

export const getIcdByCode = (code: string): ICDCode | undefined =>
    icdCodes.find(c => c.code === code);

export const searchIcdCodes = (query: string): ICDCode[] => {
    if (!query) return icdCodes;
    const q = query.toLowerCase();
    return icdCodes.filter(
        c =>
            c.code.toLowerCase().includes(q) ||
            c.label.toLowerCase().includes(q) ||
            c.category.toLowerCase().includes(q)
    );
};
