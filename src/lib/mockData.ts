import type { Patient, MedicalRecord, Organization, User, DiseaseMetric, TrendDataPoint, RegionDataPoint } from '@/lib/types';

// ─── Mock Patients ───────────────────────────────────────
export const mockPatients: Patient[] = [
    {
        id: '1', patient_id: 'TMP-2026-0001', full_name: 'Alice Johnson', phone: '+1 555-0101',
        gender: 'Female', date_of_birth: '1985-03-12', blood_type: 'A+', allergies: 'None',
        emergency_contact: '+1 555-0199', organization_id: 'org-1', created_by: 'staff-1',
        created_at: '2026-01-15T10:00:00Z', updated_at: '2026-01-15T10:00:00Z',
    },
    {
        id: '2', patient_id: 'TMP-2026-0002', full_name: 'Bob Williams', phone: '+1 555-0102',
        gender: 'Male', date_of_birth: '1990-07-24', blood_type: 'O-', allergies: 'Penicillin',
        emergency_contact: '+1 555-0299', organization_id: 'org-1', created_by: 'staff-1',
        created_at: '2026-01-16T09:00:00Z', updated_at: '2026-01-16T09:00:00Z',
    },
    {
        id: '3', patient_id: 'TMP-2026-0003', full_name: 'Carol Davis', phone: '+1 555-0103',
        gender: 'Female', date_of_birth: '1978-11-05', blood_type: 'B+', allergies: 'Sulfa drugs',
        emergency_contact: '+1 555-0399', organization_id: 'org-1', created_by: 'staff-2',
        created_at: '2026-01-20T14:00:00Z', updated_at: '2026-01-20T14:00:00Z',
    },
    {
        id: '4', patient_id: 'TMP-2026-0004', full_name: 'David Kim', phone: '+1 555-0104',
        gender: 'Male', date_of_birth: '1995-01-18', blood_type: 'AB+', allergies: 'None',
        emergency_contact: '+1 555-0499', organization_id: 'org-2', created_by: 'staff-3',
        created_at: '2026-01-22T11:00:00Z', updated_at: '2026-01-22T11:00:00Z',
    },
    {
        id: '5', patient_id: 'TMP-2026-0042', full_name: 'John Doe', phone: '+1 555-0142',
        gender: 'Male', date_of_birth: '1988-06-15', blood_type: 'O+', allergies: 'Penicillin',
        emergency_contact: '+1 555-0199', organization_id: 'org-1', created_by: 'staff-1',
        created_at: '2026-02-01T08:00:00Z', updated_at: '2026-02-01T08:00:00Z',
    },
];

// ─── Mock Medical Records ────────────────────────────────
export const mockRecords: MedicalRecord[] = [
    {
        id: 'rec-1', patient_id: '1', record_type: 'Prescription', title: 'Amoxicillin 500mg',
        description: 'Take 1 capsule (500mg) three times daily for 7 days. Complete the full course even if symptoms improve. Take with food to reduce stomach upset.',
        diagnosis: 'Bacterial upper respiratory infection', icd_code: 'J06', icd_label: 'Acute upper respiratory infections',
        created_by: 'staff-1', creator_name: 'Dr. Emily Watson', organization_id: 'org-1',
        created_at: '2026-02-10T09:00:00Z', updated_at: '2026-02-10T09:00:00Z',
    },
    {
        id: 'rec-2', patient_id: '2', record_type: 'Lab Report', title: 'Complete Blood Count',
        description: 'WBC: 7.2 (Normal)\nRBC: 4.8 (Normal)\nHemoglobin: 14.2 g/dL (Normal)\nHematocrit: 42% (Normal)\nPlatelets: 250,000 (Normal)\n\nAll values within normal reference range.',
        icd_code: 'Z00', icd_label: 'General examination without complaint',
        attachment_name: 'lab-report-2026-02-08.pdf',
        created_by: 'staff-2', creator_name: 'Lisa Chen', organization_id: 'org-1',
        created_at: '2026-02-08T14:00:00Z', updated_at: '2026-02-08T14:00:00Z',
    },
    {
        id: 'rec-3', patient_id: '3', record_type: 'Clinical Note', title: 'Follow-up Visit',
        description: 'Patient presents for follow-up after respiratory infection. Symptoms have improved significantly. Mild residual cough noted. No fever. Lungs clear on auscultation. Recommend continued rest and hydration. Follow-up in 2 weeks if symptoms persist.',
        diagnosis: 'Post-infectious cough', icd_code: 'R05', icd_label: 'Cough',
        created_by: 'staff-3', creator_name: 'Dr. Michael Patel', organization_id: 'org-1',
        created_at: '2026-01-28T10:00:00Z', updated_at: '2026-01-28T10:00:00Z',
    },
    {
        id: 'rec-4', patient_id: '1', record_type: 'Lab Report', title: 'Lipid Panel',
        description: 'Total Cholesterol: 215 mg/dL (Borderline High)\nLDL: 140 mg/dL (Borderline High)\nHDL: 52 mg/dL (Normal)\nTriglycerides: 115 mg/dL (Normal)\n\nRecommend dietary modifications and follow-up in 3 months.',
        icd_code: 'E78', icd_label: 'Disorders of lipoprotein metabolism',
        attachment_name: 'lipid-panel-2026-01-20.pdf',
        created_by: 'staff-2', creator_name: 'Lisa Chen', organization_id: 'org-1',
        created_at: '2026-01-20T11:00:00Z', updated_at: '2026-01-20T11:00:00Z',
    },
    {
        id: 'rec-5', patient_id: '4', record_type: 'Prescription', title: 'Metformin 500mg',
        description: 'Take 1 tablet twice daily with meals. Monitor blood glucose levels regularly.',
        diagnosis: 'Type 2 diabetes mellitus', icd_code: 'E11', icd_label: 'Type 2 diabetes mellitus',
        created_by: 'staff-1', creator_name: 'Dr. Emily Watson', organization_id: 'org-2',
        created_at: '2026-02-05T09:00:00Z', updated_at: '2026-02-05T09:00:00Z',
    },
    {
        id: 'rec-6', patient_id: '5', record_type: 'Clinical Note', title: 'Annual Physical',
        description: 'Patient presents for routine annual physical. All vitals within normal limits. BMI 24.5. No acute complaints.',
        diagnosis: 'General examination', icd_code: 'Z00', icd_label: 'General examination without complaint',
        created_by: 'staff-1', creator_name: 'Dr. Emily Watson', organization_id: 'org-1',
        created_at: '2026-02-12T10:00:00Z', updated_at: '2026-02-12T10:00:00Z',
    },
];

// ─── Mock Organizations ──────────────────────────────────
export const mockOrganizations: Organization[] = [
    {
        id: 'org-1', name: 'City General Hospital', type: 'Hospital', email: 'admin@citygeneral.com',
        phone: '+1 555-1000', address: '123 Medical Ave, Metro City', status: 'approved',
        certificate_status: 'verified', staff_count: 34, patient_count: 456,
        created_at: '2025-06-15T00:00:00Z', updated_at: '2026-01-01T00:00:00Z',
    },
    {
        id: 'org-2', name: 'Sunrise Clinic', type: 'Clinic', email: 'info@sunriseclinic.com',
        phone: '+1 555-2000', address: '456 Health Blvd, Sunrise', status: 'pending',
        certificate_status: 'pending', staff_count: 8, patient_count: 120,
        created_at: '2026-01-10T00:00:00Z', updated_at: '2026-01-10T00:00:00Z',
    },
    {
        id: 'org-3', name: 'MedLab Diagnostics', type: 'Laboratory', email: 'contact@medlab.com',
        phone: '+1 555-3000', address: '789 Lab Lane, Techville', status: 'approved',
        certificate_status: 'verified', staff_count: 12, patient_count: 0,
        created_at: '2025-09-20T00:00:00Z', updated_at: '2025-12-01T00:00:00Z',
    },
    {
        id: 'org-4', name: 'Greenfield Medical Center', type: 'Hospital', email: 'admin@greenfield.com',
        phone: '+1 555-4000', address: '321 Green St, Fieldtown', status: 'pending',
        certificate_status: 'pending', staff_count: 22, patient_count: 310,
        created_at: '2026-02-01T00:00:00Z', updated_at: '2026-02-01T00:00:00Z',
    },
    {
        id: 'org-5', name: 'QuickCare Urgent Center', type: 'Clinic', email: 'info@quickcare.com',
        phone: '+1 555-5000', address: '654 Quick Rd, Urgentville', status: 'rejected',
        certificate_status: 'verified', staff_count: 5, patient_count: 89,
        created_at: '2025-12-05T00:00:00Z', updated_at: '2026-01-15T00:00:00Z',
    },
];

// ─── Mock Staff ──────────────────────────────────────────
export const mockStaff: User[] = [
    { id: 'staff-1', email: 'emily.watson@citygeneral.com', full_name: 'Dr. Emily Watson', role: 'doctor', organization_id: 'org-1', phone: '+1 555-0201', created_at: '2025-07-01T00:00:00Z', updated_at: '2025-07-01T00:00:00Z' },
    { id: 'staff-2', email: 'lisa.chen@citygeneral.com', full_name: 'Lisa Chen', role: 'lab_staff', organization_id: 'org-1', phone: '+1 555-0202', created_at: '2025-07-15T00:00:00Z', updated_at: '2025-07-15T00:00:00Z' },
    { id: 'staff-3', email: 'michael.patel@citygeneral.com', full_name: 'Dr. Michael Patel', role: 'doctor', organization_id: 'org-1', phone: '+1 555-0203', created_at: '2025-08-01T00:00:00Z', updated_at: '2025-08-01T00:00:00Z' },
    { id: 'staff-4', email: 'sarah.jones@sunrise.com', full_name: 'Dr. Sarah Jones', role: 'doctor', organization_id: 'org-2', phone: '+1 555-0204', created_at: '2026-01-20T00:00:00Z', updated_at: '2026-01-20T00:00:00Z' },
];

// ─── Surveillance Mock Data (anonymized) ─────────────────
export const mockDiseaseMetrics: DiseaseMetric[] = [
    { disease: 'Influenza A', icd_code: 'J09', cases: 342, trend_percent: 12 },
    { disease: 'COVID-19', icd_code: 'U07.1', cases: 89, trend_percent: -5 },
    { disease: 'Dengue', icd_code: 'A90', cases: 156, trend_percent: 28 },
    { disease: 'Tuberculosis', icd_code: 'A15', cases: 67, trend_percent: -3 },
    { disease: 'Gastroenteritis', icd_code: 'A09', cases: 43, trend_percent: 7 },
    { disease: 'Viral Infection', icd_code: 'B34', cases: 28, trend_percent: -1 },
    { disease: 'Pneumonia', icd_code: 'J18', cases: 95, trend_percent: 15 },
    { disease: 'Hypertension', icd_code: 'I10', cases: 210, trend_percent: 2 },
    { disease: 'Diabetes', icd_code: 'E11', cases: 178, trend_percent: 5 },
];

export const mockTrendData: TrendDataPoint[] = [
    { month: 'Sep', influenza: 120, covid: 200, dengue: 45, tb: 30 },
    { month: 'Oct', influenza: 180, covid: 160, dengue: 80, tb: 35 },
    { month: 'Nov', influenza: 250, covid: 130, dengue: 120, tb: 40 },
    { month: 'Dec', influenza: 310, covid: 110, dengue: 140, tb: 50 },
    { month: 'Jan', influenza: 340, covid: 95, dengue: 150, tb: 60 },
    { month: 'Feb', influenza: 342, covid: 89, dengue: 156, tb: 67 },
];

export const mockRegionData: RegionDataPoint[] = [
    { region: 'North', cases: 320, prev: 280 },
    { region: 'South', cases: 210, prev: 190 },
    { region: 'East', cases: 180, prev: 220 },
    { region: 'West', cases: 150, prev: 170 },
    { region: 'Central', cases: 290, prev: 250 },
];

// ─── Patient lookup by patient_id ────────────────────────
export const getPatientByPatientId = (patientId: string): Patient | undefined =>
    mockPatients.find(p => p.patient_id === patientId);

export const getPatientById = (id: string): Patient | undefined =>
    mockPatients.find(p => p.id === id);

export const getRecordsForPatient = (patientId: string): MedicalRecord[] =>
    mockRecords.filter(r => r.patient_id === patientId);

export const getRecordById = (id: string): MedicalRecord | undefined =>
    mockRecords.find(r => r.id === id);

// ─── Patient ID generator ────────────────────────────────
let patientCounter = 43;
export const generatePatientId = (): string => {
    const year = new Date().getFullYear();
    const id = `TMP-${year}-${String(patientCounter++).padStart(4, '0')}`;
    return id;
};
