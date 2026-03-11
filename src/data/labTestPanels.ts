// Lab Test Panel definitions with reference ranges
// Reference ranges are based on standard clinical guidelines

export interface TestField {
    key: string;
    label: string;
    unit: string;
    refRange: {
        male?: { min: number; max: number };
        female?: { min: number; max: number };
        general?: { min: number; max: number };
        // For age-specific ranges
        child?: { min: number; max: number }; // < 16 yrs
        // For qualitative tests
        normal?: string;
    };
}

export interface TestPanel {
    id: string;
    name: string;
    shortName: string;
    fields: TestField[];
}

export interface LabTestValue {
    value: string;
    status?: 'normal' | 'borderline' | 'abnormal';
}

export interface LabTestPanelData {
    panelId: string;
    values: Record<string, LabTestValue>;
}

// Interpret a value against reference ranges
export function interpretValue(
    value: string,
    field: TestField,
    gender: 'Male' | 'Female' | 'Other' = 'Male',
    age?: number | null
): 'normal' | 'borderline' | 'abnormal' | undefined {
    if (!value || value.trim() === '') return undefined;

    // Handle qualitative tests (Negative/Positive)
    if (field.refRange.normal) {
        const v = value.trim().toLowerCase();
        const expected = field.refRange.normal.toLowerCase();
        return v === expected ? 'normal' : 'abnormal';
    }

    const num = parseFloat(value);
    if (isNaN(num)) return undefined;

    let range = gender === 'Female' ? (field.refRange.female || field.refRange.general) : (field.refRange.male || field.refRange.general);

    // Override with child range if applicable
    if (age !== undefined && age !== null && age < 16 && field.refRange.child) {
        range = field.refRange.child;
    }

    if (!range) return undefined;

    const margin = (range.max - range.min) * 0.1; // 10% margin for borderline

    if (num >= range.min && num <= range.max) return 'normal';
    if (num < range.min - margin || num > range.max + margin) return 'abnormal';
    return 'borderline';
}

export const STATUS_COLORS = {
    normal: { bg: 'bg-emerald-500/10', text: 'text-emerald-600', border: 'border-emerald-500/30', dot: 'bg-emerald-500' },
    borderline: { bg: 'bg-amber-500/10', text: 'text-amber-600', border: 'border-amber-500/30', dot: 'bg-amber-500' },
    abnormal: { bg: 'bg-red-500/10', text: 'text-red-600', border: 'border-red-500/30', dot: 'bg-red-500' },
};

export function getRefRangeText(field: TestField, gender: 'Male' | 'Female' | 'Other' = 'Male', age?: number | null): string {
    if (field.refRange.normal) return field.refRange.normal;
    let range = gender === 'Female' ? (field.refRange.female || field.refRange.general) : (field.refRange.male || field.refRange.general);

    if (age !== undefined && age !== null && age < 16 && field.refRange.child) {
        range = field.refRange.child;
    }

    if (!range) return '—';
    return `${range.min} – ${range.max}`;
}

// ════════════════════════════════════════════════
// PANEL DEFINITIONS
// ════════════════════════════════════════════════

export const TEST_PANELS: TestPanel[] = [
    {
        id: 'cbc',
        name: 'Complete Blood Count',
        shortName: 'CBC',
        fields: [
            { key: 'hemoglobin', label: 'Hemoglobin', unit: 'g/dL', refRange: { male: { min: 13.8, max: 17.2 }, female: { min: 12.1, max: 15.1 } } },
            { key: 'rbc', label: 'RBC Count', unit: 'M cells/mcL', refRange: { male: { min: 4.7, max: 6.1 }, female: { min: 4.2, max: 5.4 } } },
            { key: 'wbc', label: 'WBC Count', unit: 'cells/mcL', refRange: { general: { min: 4000, max: 11000 } } },
            { key: 'platelets', label: 'Platelet Count', unit: '/mcL', refRange: { general: { min: 150000, max: 450000 } } },
            { key: 'hematocrit', label: 'Hematocrit', unit: '%', refRange: { male: { min: 40, max: 54 }, female: { min: 36, max: 48 } } },
            { key: 'mcv', label: 'MCV', unit: 'fL', refRange: { general: { min: 80, max: 100 } } },
            { key: 'mch', label: 'MCH', unit: 'pg', refRange: { general: { min: 27, max: 33 } } },
            { key: 'mchc', label: 'MCHC', unit: 'g/dL', refRange: { general: { min: 32, max: 36 } } },
            { key: 'neutrophils', label: 'Neutrophils', unit: '%', refRange: { general: { min: 40, max: 70 } } },
            { key: 'lymphocytes', label: 'Lymphocytes', unit: '%', refRange: { general: { min: 20, max: 40 } } },
            { key: 'monocytes', label: 'Monocytes', unit: '%', refRange: { general: { min: 2, max: 8 } } },
            { key: 'eosinophils', label: 'Eosinophils', unit: '%', refRange: { general: { min: 1, max: 4 } } },
            { key: 'basophils', label: 'Basophils', unit: '%', refRange: { general: { min: 0, max: 1 } } },
        ],
    },
    {
        id: 'lipid_profile',
        name: 'Lipid Profile',
        shortName: 'Lipid',
        fields: [
            { key: 'total_cholesterol', label: 'Total Cholesterol', unit: 'mg/dL', refRange: { general: { min: 0, max: 200 } } },
            { key: 'ldl', label: 'LDL Cholesterol', unit: 'mg/dL', refRange: { general: { min: 0, max: 100 } } },
            { key: 'hdl', label: 'HDL Cholesterol', unit: 'mg/dL', refRange: { male: { min: 40, max: 200 }, female: { min: 50, max: 200 } } },
            { key: 'triglycerides', label: 'Triglycerides', unit: 'mg/dL', refRange: { general: { min: 0, max: 150 } } },
            { key: 'vldl', label: 'VLDL', unit: 'mg/dL', refRange: { general: { min: 5, max: 40 } } },
        ],
    },
    {
        id: 'blood_sugar',
        name: 'Blood Sugar Panel',
        shortName: 'Sugar',
        fields: [
            { key: 'fasting', label: 'Fasting Blood Sugar', unit: 'mg/dL', refRange: { general: { min: 70, max: 99 } } },
            { key: 'post_meal', label: 'Post Meal Sugar', unit: 'mg/dL', refRange: { general: { min: 70, max: 140 } } },
            { key: 'random', label: 'Random Blood Sugar', unit: 'mg/dL', refRange: { general: { min: 70, max: 200 } } },
            { key: 'hba1c', label: 'HbA1c', unit: '%', refRange: { general: { min: 0, max: 5.7 } } },
        ],
    },
    {
        id: 'lft',
        name: 'Liver Function Test',
        shortName: 'LFT',
        fields: [
            { key: 'alt', label: 'ALT (SGPT)', unit: 'U/L', refRange: { general: { min: 7, max: 56 } } },
            { key: 'ast', label: 'AST (SGOT)', unit: 'U/L', refRange: { general: { min: 10, max: 40 } } },
            { key: 'alp', label: 'Alkaline Phosphatase', unit: 'U/L', refRange: { child: { min: 60, max: 400 }, general: { min: 44, max: 147 } } },
            { key: 'total_bilirubin', label: 'Total Bilirubin', unit: 'mg/dL', refRange: { general: { min: 0.1, max: 1.2 } } },
            { key: 'direct_bilirubin', label: 'Direct Bilirubin', unit: 'mg/dL', refRange: { general: { min: 0, max: 0.3 } } },
            { key: 'albumin', label: 'Albumin', unit: 'g/dL', refRange: { general: { min: 3.4, max: 5.4 } } },
            { key: 'total_protein', label: 'Total Protein', unit: 'g/dL', refRange: { general: { min: 6, max: 8.3 } } },
        ],
    },
    {
        id: 'kft',
        name: 'Kidney Function Test',
        shortName: 'KFT',
        fields: [
            { key: 'creatinine', label: 'Creatinine', unit: 'mg/dL', refRange: { male: { min: 0.74, max: 1.35 }, female: { min: 0.59, max: 1.04 } } },
            { key: 'bun', label: 'Blood Urea Nitrogen', unit: 'mg/dL', refRange: { general: { min: 7, max: 20 } } },
            { key: 'urea', label: 'Urea', unit: 'mg/dL', refRange: { general: { min: 15, max: 40 } } },
            { key: 'uric_acid', label: 'Uric Acid', unit: 'mg/dL', refRange: { male: { min: 3.4, max: 7.0 }, female: { min: 2.4, max: 6.0 } } },
        ],
    },
    {
        id: 'tft',
        name: 'Thyroid Function Test',
        shortName: 'TFT',
        fields: [
            { key: 'tsh', label: 'TSH', unit: 'mIU/L', refRange: { general: { min: 0.4, max: 4.0 } } },
            { key: 't3', label: 'T3', unit: 'ng/dL', refRange: { general: { min: 80, max: 200 } } },
            { key: 't4', label: 'T4', unit: 'µg/dL', refRange: { general: { min: 5, max: 12 } } },
        ],
    },
    {
        id: 'electrolytes',
        name: 'Electrolyte Panel',
        shortName: 'Electrolytes',
        fields: [
            { key: 'sodium', label: 'Sodium', unit: 'mEq/L', refRange: { general: { min: 135, max: 145 } } },
            { key: 'potassium', label: 'Potassium', unit: 'mEq/L', refRange: { general: { min: 3.5, max: 5.0 } } },
            { key: 'chloride', label: 'Chloride', unit: 'mEq/L', refRange: { general: { min: 96, max: 106 } } },
            { key: 'calcium', label: 'Calcium', unit: 'mg/dL', refRange: { general: { min: 8.6, max: 10.2 } } },
            { key: 'magnesium', label: 'Magnesium', unit: 'mg/dL', refRange: { general: { min: 1.7, max: 2.2 } } },
        ],
    },
    {
        id: 'urine_routine',
        name: 'Urine Routine Test',
        shortName: 'Urine',
        fields: [
            { key: 'ph', label: 'pH', unit: '', refRange: { general: { min: 4.5, max: 8 } } },
            { key: 'protein', label: 'Protein', unit: '', refRange: { normal: 'Negative' } },
            { key: 'glucose', label: 'Glucose', unit: '', refRange: { normal: 'Negative' } },
            { key: 'ketones', label: 'Ketones', unit: '', refRange: { normal: 'Negative' } },
            { key: 'rbc', label: 'RBC', unit: '/HPF', refRange: { general: { min: 0, max: 4 } } },
            { key: 'wbc', label: 'WBC', unit: '/HPF', refRange: { general: { min: 0, max: 5 } } },
        ],
    },
    {
        id: 'vitamins',
        name: 'Vitamin Panel',
        shortName: 'Vitamins',
        fields: [
            { key: 'vitamin_d', label: 'Vitamin D', unit: 'ng/mL', refRange: { general: { min: 20, max: 50 } } },
            { key: 'vitamin_b12', label: 'Vitamin B12', unit: 'pg/mL', refRange: { general: { min: 200, max: 900 } } },
        ],
    },
    {
        id: 'iron_studies',
        name: 'Iron Studies',
        shortName: 'Iron',
        fields: [
            { key: 'serum_iron', label: 'Serum Iron', unit: 'µg/dL', refRange: { general: { min: 60, max: 170 } } },
            { key: 'ferritin', label: 'Ferritin', unit: 'ng/mL', refRange: { male: { min: 24, max: 336 }, female: { min: 11, max: 307 } } },
            { key: 'tibc', label: 'TIBC', unit: 'µg/dL', refRange: { general: { min: 240, max: 450 } } },
        ],
    },
    {
        id: 'cardiac_markers',
        name: 'Cardiac Markers',
        shortName: 'Cardiac',
        fields: [
            { key: 'troponin', label: 'Troponin', unit: 'ng/mL', refRange: { general: { min: 0, max: 0.04 } } },
            { key: 'ck_mb', label: 'CK-MB', unit: 'ng/mL', refRange: { general: { min: 0, max: 7 } } },
        ],
    },
    {
        id: 'inflammation',
        name: 'Inflammation Markers',
        shortName: 'CRP/ESR',
        fields: [
            { key: 'crp', label: 'CRP', unit: 'mg/L', refRange: { general: { min: 0, max: 3 } } },
            { key: 'esr', label: 'ESR', unit: 'mm/hr', refRange: { male: { min: 0, max: 15 }, female: { min: 0, max: 20 } } },
        ],
    },
    {
        id: 'coagulation',
        name: 'Coagulation Profile',
        shortName: 'Coag',
        fields: [
            { key: 'pt', label: 'Prothrombin Time', unit: 'seconds', refRange: { general: { min: 11, max: 13.5 } } },
            { key: 'inr', label: 'INR', unit: '', refRange: { general: { min: 0.8, max: 1.1 } } },
        ],
    },
    {
        id: 'infection_markers',
        name: 'Infection Markers',
        shortName: 'Infection',
        fields: [
            { key: 'dengue_ns1', label: 'Dengue NS1', unit: '', refRange: { normal: 'Negative' } },
            { key: 'malaria', label: 'Malaria Antigen', unit: '', refRange: { normal: 'Negative' } },
            { key: 'widal', label: 'Typhoid (Widal)', unit: '', refRange: { normal: 'Negative' } },
        ],
    },
];

// Custom panel template (user adds rows dynamically)
export const CUSTOM_PANEL: TestPanel = {
    id: 'custom',
    name: 'Custom Test Panel',
    shortName: 'Custom',
    fields: [], // Fields added dynamically
};
