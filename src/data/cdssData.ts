// src/data/cdssData.ts

// 1. Symptom to Disease Mapping
// This helps the engine suggest possible diagnoses based on symptoms found in the patient's records.
export const SYMPTOM_DISEASE_MAP: Record<string, string[]> = {
  // Cardiovascular
  "chest pain": ["Myocardial Infarction", "Angina", "Pulmonary Embolism", "GERD"],
  "shortness of breath": ["Asthma", "COPD", "Pneumonia", "Heart Failure"],
  "palpitations": ["Arrhythmia", "Hyperthyroidism", "Anxiety"],

  // Respiratory
  "cough": ["URI", "Bronchitis", "Pneumonia", "COVID-19", "Asthma"],
  "wheezing": ["Asthma", "COPD", "Anaphylaxis"],

  // Gastrointestinal
  "nausea": ["Gastroenteritis", "Food Poisoning", "Migraine", "Pregnancy (if applicable)"],
  "vomiting": ["Gastroenteritis", "Food Poisoning", "Appendicitis", "Bowel Obstruction"],
  "abdominal pain": ["Appendicitis", "Gallstones", "Peptic Ulcer", "IBS"],
  "diarrhea": ["Gastroenteritis", "IBS", "IBD", "C. diff infection"],

  // Neurological/General
  "headache": ["Tension Headache", "Migraine", "Sinusitis", "Hypertension"],
  "dizziness": ["Vertigo", "Dehydration", "Hypotension", "Anemia"],
  "fatigue": ["Anemia", "Hypothyroidism", "Depression", "Sleep Apnea"],
  "fever": ["Viral Infection", "Bacterial Infection", "Malaria", "Dengue", "COVID-19"],

  // Endocrine/Metabolic
  "polyuria (frequent urination)": ["Diabetes Mellitus", "UTI", "Diuretic Use"],
  "polydipsia (excessive thirst)": ["Diabetes Mellitus", "Dehydration"],
  "weight loss": ["Hyperthyroidism", "Diabetes (Type 1)", "Malignancy", "Depression"],
};

// 2. Disease/Symptom to Lab Test Mapping
// This helps the engine recommend appropriate lab tests.
export const DISEASE_LAB_TEST_MAP: Record<string, string[]> = {
  // Related to Cardiovascular
  "Myocardial Infarction": ["Troponin", "ECG", "Lipid Panel"],
  "Heart Failure": ["BNP", "Echocardiogram", "Chest X-Ray"],
  "chest pain": ["ECG", "Troponin"],

  // Related to Endocrine/Metabolic
  "Diabetes Mellitus": ["HbA1c", "Fasting Blood Glucose", "Urinalysis"],
  "Hyperthyroidism": ["TSH", "Free T4", "Free T3"],
  "Hypothyroidism": ["TSH", "Free T4"],
  "polyuria (frequent urination)": ["Urinalysis", "Blood Glucose"],

  // Related to General/Infectious
  "fever": ["CBC (Complete Blood Count)", "CRP (C-Reactive Protein)", "Blood Culture"],
  "Anemia": ["CBC", "Iron Panel", "Vitamin B12", "Folate"],
  "Infection": ["CBC", "WBC Differential", "CRP"],
  
  // Respiratory
  "Pneumonia": ["Chest X-Ray", "Sputum Culture", "CBC"],
  "shortness of breath": ["Chest X-Ray", "Arterial Blood Gas (ABG)", "BNP"],

  // Hepatic/Renal
  "Liver Disease": ["LFTs (Liver Function Tests) - AST, ALT, Bilirubin", "Hepatitis Panel"],
  "Kidney Disease": ["KFTs (Kidney Function Tests) - Creatinine, BUN", "Urinalysis", "Electrolytes"],
};

// 3. Vital Thresholds for Early Warning Scoring
// Simple thresholding to identify high-risk patients.
export interface VitalThresholds {
  min: number;
  max: number;
  unit: string;
  name: string;
}

export const VITAL_THRESHOLDS: Record<string, VitalThresholds> = {
  systolicBP: { min: 90, max: 140, unit: "mmHg", name: "Systolic Blood Pressure" },
  diastolicBP: { min: 60, max: 90, unit: "mmHg", name: "Diastolic Blood Pressure" },
  heartRate: { min: 50, max: 100, unit: "bpm", name: "Heart Rate" },
  temperature: { min: 97.0, max: 100.4, unit: "°F", name: "Temperature" },
  spo2: { min: 95, max: 100, unit: "%", name: "Oxygen Saturation (SpO2)" },
  respiratoryRate: { min: 12, max: 20, unit: "breaths/min", name: "Respiratory Rate" }
};
