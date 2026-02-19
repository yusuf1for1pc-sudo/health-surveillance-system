import type { Patient, MedicalRecord, Organization, User, DiseaseMetric, TrendDataPoint, RegionDataPoint } from '@/lib/types';

// ─── Disease definitions ──────────────────────────────────
const DISEASES: { label: string; icd_code: string; diagnosis: string }[] = [
    { label: 'Influenza A', icd_code: 'J09', diagnosis: 'Influenza' },
    { label: 'Migraine', icd_code: 'G43', diagnosis: 'Migraine' },
    { label: 'Bronchitis', icd_code: 'J40', diagnosis: 'Bronchitis' },
    { label: 'Infectious gastro', icd_code: 'A09', diagnosis: 'Gastroenteritis' },
    { label: 'URTI', icd_code: 'J06', diagnosis: 'Upper respiratory tract infection' },
    { label: 'Diabetes', icd_code: 'E11', diagnosis: 'Type 2 Diabetes' },
    { label: 'Lipid Disorder', icd_code: 'E78', diagnosis: 'Lipid disorder' },
    { label: 'Dengue fever', icd_code: 'A90', diagnosis: 'Dengue fever' },
    { label: 'Typhoid', icd_code: 'A01.0', diagnosis: 'Typhoid fever' },
    { label: 'Malaria', icd_code: 'B50', diagnosis: 'Malaria' },
    { label: 'Gastroenteritis', icd_code: 'A09', diagnosis: 'Gastroenteritis' },
    { label: 'Hypertension', icd_code: 'I10', diagnosis: 'Hypertension' },
    { label: 'COVID-19', icd_code: 'U07.1', diagnosis: 'COVID-19' },
    { label: 'Tuberculosis', icd_code: 'A15', diagnosis: 'Pulmonary tuberculosis' },
    { label: 'Typhoid Fever', icd_code: 'A01.0', diagnosis: 'Typhoid fever' },
];

// ─── City definitions ──────────────────────────────────────
interface CityDef { name: string; state: string; lat: number; lng: number; pincode: string; orgId: string; staffId: string }

const CITIES: CityDef[] = [
    // Maharashtra
    { name: 'Mumbai', state: 'Maharashtra', lat: 19.0760, lng: 72.8777, pincode: '400001', orgId: 'org-mh-1', staffId: 'staff-mh-1' },
    { name: 'Nashik', state: 'Maharashtra', lat: 19.9975, lng: 73.7898, pincode: '422001', orgId: 'org-mh-1', staffId: 'staff-mh-1' },
    { name: 'Solapur', state: 'Maharashtra', lat: 17.6817, lng: 75.9064, pincode: '413001', orgId: 'org-mh-1', staffId: 'staff-mh-1' },
    { name: 'Thane', state: 'Maharashtra', lat: 19.2183, lng: 72.9781, pincode: '400601', orgId: 'org-mh-1', staffId: 'staff-mh-1' },
    { name: 'Nagpur', state: 'Maharashtra', lat: 21.1458, lng: 79.0882, pincode: '440001', orgId: 'org-mh-1', staffId: 'staff-mh-1' },
    { name: 'Aurangabad', state: 'Maharashtra', lat: 19.8762, lng: 75.3433, pincode: '431001', orgId: 'org-mh-1', staffId: 'staff-mh-1' },
    { name: 'Pune', state: 'Maharashtra', lat: 18.5204, lng: 73.8567, pincode: '411001', orgId: 'org-mh-1', staffId: 'staff-mh-1' },
    // Delhi
    { name: 'New Delhi', state: 'Delhi', lat: 28.6139, lng: 77.2090, pincode: '110001', orgId: 'org-dl-1', staffId: 'staff-dl-1' },
    { name: 'Noida', state: 'Delhi', lat: 28.5355, lng: 77.3910, pincode: '201301', orgId: 'org-dl-1', staffId: 'staff-dl-1' },
    // Tamil Nadu
    { name: 'Chennai', state: 'Tamil Nadu', lat: 13.0827, lng: 80.2707, pincode: '600001', orgId: 'org-tn-1', staffId: 'staff-tn-1' },
    { name: 'Madurai', state: 'Tamil Nadu', lat: 9.9252, lng: 78.1198, pincode: '625001', orgId: 'org-tn-1', staffId: 'staff-tn-1' },
    // Karnataka
    { name: 'Bengaluru', state: 'Karnataka', lat: 12.9716, lng: 77.5946, pincode: '560001', orgId: 'org-ka-1', staffId: 'staff-ka-1' },
    { name: 'Mysuru', state: 'Karnataka', lat: 12.2958, lng: 76.6394, pincode: '570001', orgId: 'org-ka-1', staffId: 'staff-ka-1' },
    // West Bengal
    { name: 'Kolkata', state: 'West Bengal', lat: 22.5726, lng: 88.3639, pincode: '700001', orgId: 'org-wb-1', staffId: 'staff-wb-1' },
    { name: 'Howrah', state: 'West Bengal', lat: 22.5958, lng: 88.2636, pincode: '711101', orgId: 'org-wb-1', staffId: 'staff-wb-1' },
    // Uttar Pradesh
    { name: 'Lucknow', state: 'Uttar Pradesh', lat: 26.8467, lng: 80.9462, pincode: '226001', orgId: 'org-up-1', staffId: 'staff-up-1' },
    { name: 'Kanpur', state: 'Uttar Pradesh', lat: 26.4499, lng: 80.3319, pincode: '208001', orgId: 'org-up-1', staffId: 'staff-up-1' },
    // Kerala
    { name: 'Kochi', state: 'Kerala', lat: 9.9312, lng: 76.2673, pincode: '682001', orgId: 'org-kl-1', staffId: 'staff-kl-1' },
    { name: 'Thiruvananthapuram', state: 'Kerala', lat: 8.5241, lng: 76.9366, pincode: '695001', orgId: 'org-kl-1', staffId: 'staff-kl-1' },
    // Gujarat
    { name: 'Ahmedabad', state: 'Gujarat', lat: 23.0225, lng: 72.5714, pincode: '380001', orgId: 'org-gj-1', staffId: 'staff-gj-1' },
    { name: 'Surat', state: 'Gujarat', lat: 21.1702, lng: 72.8311, pincode: '395001', orgId: 'org-gj-1', staffId: 'staff-gj-1' },
    // Rajasthan
    { name: 'Jaipur', state: 'Rajasthan', lat: 26.9124, lng: 75.7873, pincode: '302001', orgId: 'org-rj-1', staffId: 'staff-rj-1' },
    { name: 'Jodhpur', state: 'Rajasthan', lat: 26.2389, lng: 73.0243, pincode: '342001', orgId: 'org-rj-1', staffId: 'staff-rj-1' },
    // Bihar
    { name: 'Patna', state: 'Bihar', lat: 25.5941, lng: 85.1376, pincode: '800001', orgId: 'org-bh-1', staffId: 'staff-bh-1' },
    { name: 'Gaya', state: 'Bihar', lat: 24.7955, lng: 85.0073, pincode: '823001', orgId: 'org-bh-1', staffId: 'staff-bh-1' },
];

// ─── Per-city, per-disease case matrix (Heatmap table data) ─
// Reflects screenshot: maharashtra cities x 12 diseases
// Format: cityName -> diseaseName -> count
export const HEATMAP_DATA: Record<string, Record<string, number>> = {
    Mumbai: { 'Influenza A': 17, 'Migraine': 4, 'Bronchitis': 10, 'Infectious gastro': 3, 'URTI': 8, 'Diabetes': 8, 'Lipid Disorder': 7, 'Dengue fever': 3, 'Typhoid': 5, 'Malaria': 6, 'Gastroenteritis': 6, 'Hypertension': 4 },
    Nashik: { 'Influenza A': 9, 'Migraine': 8, 'Bronchitis': 7, 'Infectious gastro': 9, 'URTI': 3, 'Diabetes': 5, 'Lipid Disorder': 3, 'Dengue fever': 3, 'Typhoid': 2, 'Malaria': 1, 'Gastroenteritis': 1, 'Hypertension': 3 },
    Solapur: { 'Influenza A': 4, 'Migraine': 5, 'Bronchitis': 3, 'Infectious gastro': 4, 'URTI': 6, 'Diabetes': 4, 'Lipid Disorder': 4, 'Dengue fever': 4, 'Typhoid': 3, 'Malaria': 2, 'Gastroenteritis': 2, 'Hypertension': 2 },
    Thane: { 'Influenza A': 0, 'Migraine': 5, 'Bronchitis': 3, 'Infectious gastro': 1, 'URTI': 3, 'Diabetes': 1, 'Lipid Disorder': 3, 'Dengue fever': 4, 'Typhoid': 4, 'Malaria': 3, 'Gastroenteritis': 5, 'Hypertension': 2 },
    Nagpur: { 'Influenza A': 4, 'Migraine': 3, 'Bronchitis': 3, 'Infectious gastro': 6, 'URTI': 1, 'Diabetes': 3, 'Lipid Disorder': 0, 'Dengue fever': 2, 'Typhoid': 2, 'Malaria': 4, 'Gastroenteritis': 2, 'Hypertension': 1 },
    Aurangabad: { 'Influenza A': 3, 'Migraine': 5, 'Bronchitis': 2, 'Infectious gastro': 1, 'URTI': 3, 'Diabetes': 3, 'Lipid Disorder': 5, 'Dengue fever': 3, 'Typhoid': 1, 'Malaria': 2, 'Gastroenteritis': 2, 'Hypertension': 3 },
    Pune: { 'Influenza A': 3, 'Migraine': 2, 'Bronchitis': 1, 'Infectious gastro': 3, 'URTI': 1, 'Diabetes': 0, 'Lipid Disorder': 1, 'Dengue fever': 3, 'Typhoid': 4, 'Malaria': 3, 'Gastroenteritis': 2, 'Hypertension': 4 },
};

// Geographic distribution (state-level, matches "Geographic Distribution" bar chart)
export const STATE_DISTRIBUTION: { state: string; current: number; prev: number }[] = [
    { state: 'Maharashtra', current: 420, prev: 330 },
    { state: 'Delhi', current: 340, prev: 320 },
    { state: 'Tamil Nadu', current: 295, prev: 270 },
    { state: 'Karnataka', current: 175, prev: 170 },
    { state: 'West Bengal', current: 165, prev: 175 },
    { state: 'Uttar Pradesh', current: 150, prev: 160 },
    { state: 'Kerala', current: 125, prev: 115 },
    { state: 'Gujarat', current: 100, prev: 95 },
    { state: 'Rajasthan', current: 90, prev: 88 },
    { state: 'Bihar', current: 75, prev: 72 },
];

// Top disease metrics for bar chart "Top Diseases"
export const TOP_DISEASE_STATS: { disease: string; icd_code: string; cases: number }[] = [
    { disease: 'Influenza A', icd_code: 'J09', cases: 342 },
    { disease: 'Dengue Fever', icd_code: 'A90', cases: 278 },
    { disease: 'COVID-19', icd_code: 'U07.1', cases: 156 },
    { disease: 'Malaria', icd_code: 'B50', cases: 118 },
    { disease: 'Tuberculosis', icd_code: 'A15', cases: 94 },
    { disease: 'Typhoid Fever', icd_code: 'A01.0', cases: 64 },
    { disease: 'Gastroenteritis', icd_code: 'A92.0', cases: 52 },
];

// Stat cards: used in upper summary cards
export const STAT_CARDS = [
    { disease: 'Influenza A', icd_code: 'J09', cases: 342, trend_percent: 12, trend_up: true },
    { disease: 'Dengue Fever', icd_code: 'A90', cases: 278, trend_percent: 18, trend_up: true },
    { disease: 'COVID-19', icd_code: 'U07.1', cases: 156, trend_percent: -5, trend_up: false },
    { disease: 'Malaria', icd_code: 'B50', cases: 118, trend_percent: -8, trend_up: false },
];

// ─── Generate patients & records from HEATMAP_DATA ────────
let _patientCounter = 1;
let _recordCounter = 1;

export const mockPatients: Patient[] = [];
export const mockRecords: MedicalRecord[] = [];

// MH cities (heatmap)
const MH_CITIES = ['Mumbai', 'Nashik', 'Solapur', 'Thane', 'Nagpur', 'Aurangabad', 'Pune'];
const MH_DISEASES = ['Influenza A', 'Migraine', 'Bronchitis', 'Infectious gastro', 'URTI', 'Diabetes', 'Lipid Disorder', 'Dengue fever', 'Typhoid', 'Malaria', 'Gastroenteritis', 'Hypertension'];

MH_CITIES.forEach(cityName => {
    const cityDef = CITIES.find(c => c.name === cityName)!;
    const cityData = HEATMAP_DATA[cityName] || {};

    MH_DISEASES.forEach(diseaseName => {
        const count = cityData[diseaseName] || 0;
        const diseaseDef = DISEASES.find(d => d.label === diseaseName) || { label: diseaseName, icd_code: '?', diagnosis: diseaseName };

        // Generate exactly 5 records per patient for demo history
        const recordsCount = 5;
        for (let i = 0; i < count; i++) {
            const pid = `pt-${_patientCounter}`;
            const daysAgo = Math.floor(Math.random() * 730); // 2 years timeline
            const jitter = 0.02;

            // Create Patient
            mockPatients.push({
                id: pid,
                patient_id: `HSS-${String(_patientCounter).padStart(4, '0')}`,
                full_name: `Patient ${_patientCounter}`,
                phone: `+91 99000-${String(_patientCounter).padStart(5, '0')}`,
                gender: _patientCounter % 2 === 0 ? 'Male' : 'Female',
                date_of_birth: '1990-01-01',
                organization_id: cityDef.orgId,
                created_by: cityDef.staffId, // This ensures staff-mh-1 has patients
                city: cityDef.name,
                state: cityDef.state,
                country: 'India',
                pincode: cityDef.pincode,
                latitude: cityDef.lat + (Math.random() - 0.5) * jitter,
                longitude: cityDef.lng + (Math.random() - 0.5) * jitter,
                created_at: new Date(Date.now() - daysAgo * 86400000).toISOString(),
                updated_at: new Date().toISOString(),
            });

            // Create 5 records distributed over time for this patient
            for (let r = 0; r < recordsCount; r++) {
                const rid = `rec-${_recordCounter}`;
                // Distribute records: one recent, others older
                const recordDaysAgo = r === 0 ? daysAgo : daysAgo + (r * 30) + Math.floor(Math.random() * 20);

                mockRecords.push({
                    id: rid,
                    patient_id: pid,
                    record_type: r === 0 ? 'Clinical Note' : (r % 2 === 0 ? 'Lab Report' : 'Prescription'),
                    title: r === 0 ? diseaseDef.label : `Follow-up: ${diseaseDef.label}`,
                    description: `Case of ${diseaseDef.diagnosis} in ${cityName}.`,
                    diagnosis: diseaseDef.diagnosis,
                    icd_code: diseaseDef.icd_code,
                    icd_label: diseaseDef.label,
                    created_by: cityDef.staffId,
                    creator_name: 'Dr. Demo',
                    organization_id: cityDef.orgId,
                    created_at: new Date(Date.now() - recordDaysAgo * 86400000).toISOString(),
                    updated_at: new Date().toISOString(),
                });
                _recordCounter++;
            }
            _patientCounter++;
        }
    });
});

// Also add patients for other states from STATE_DISTRIBUTION
const OTHER_STATES_DISEASES = [
    { label: 'COVID-19', icd_code: 'U07.1', diagnosis: 'COVID-19' },
    { label: 'Influenza A', icd_code: 'J09', diagnosis: 'Influenza' },
    { label: 'Dengue fever', icd_code: 'A90', diagnosis: 'Dengue fever' },
    { label: 'Malaria', icd_code: 'B50', diagnosis: 'Malaria' },
    { label: 'Tuberculosis', icd_code: 'A15', diagnosis: 'Pulmonary tuberculosis' },
];

CITIES.filter(c => c.state !== 'Maharashtra').forEach(cityDef => {
    const baseCases = Math.floor(Math.random() * 15) + 5;
    for (let i = 0; i < baseCases; i++) {
        const pid = `pt-${_patientCounter}`;
        const rid = `rec-${_recordCounter}`;
        const dis = OTHER_STATES_DISEASES[i % OTHER_STATES_DISEASES.length];
        const daysAgo = Math.floor(Math.random() * 90);
        mockPatients.push({
            id: pid,
            patient_id: `HSS-${String(_patientCounter).padStart(4, '0')}`,
            full_name: `Patient ${_patientCounter}`,
            phone: `+91 99000-${String(_patientCounter).padStart(5, '0')}`,
            gender: _patientCounter % 2 === 0 ? 'Male' : 'Female',
            date_of_birth: '1988-06-15',
            organization_id: cityDef.orgId,
            created_by: cityDef.staffId,
            city: cityDef.name,
            state: cityDef.state,
            country: 'India',
            pincode: cityDef.pincode,
            latitude: cityDef.lat + (Math.random() - 0.5) * 0.03,
            longitude: cityDef.lng + (Math.random() - 0.5) * 0.03,
            created_at: new Date(Date.now() - daysAgo * 86400000).toISOString(),
            updated_at: new Date().toISOString(),
        });
        const monthsAgo = Math.floor(Math.random() * 12);
        mockRecords.push({
            id: rid,
            patient_id: pid,
            record_type: 'Clinical Note',
            title: dis.label,
            description: `Case of ${dis.diagnosis} in ${cityDef.name}.`,
            diagnosis: dis.diagnosis,
            icd_code: dis.icd_code,
            icd_label: dis.label,
            created_by: cityDef.staffId,
            creator_name: 'Dr. Demo',
            organization_id: cityDef.orgId,
            created_at: new Date(Date.now() - (daysAgo + monthsAgo * 30) * 86400000).toISOString(),
            updated_at: new Date().toISOString(),
        });
        _patientCounter++;
        _recordCounter++;
    }
});

// ─── Organizations ─────────────────────────────────────────
export const mockOrganizations: Organization[] = [
    { id: 'org-mh-1', name: 'KEM Hospital Mumbai', type: 'Hospital', email: 'admin@kem.gov.in', phone: '+91 22-2410-7000', address: 'Parel', status: 'approved', city: 'Mumbai', state: 'Maharashtra', country: 'India', pincode: '400012', certificate_status: 'verified', staff_count: 24, patient_count: 456, created_at: '2025-06-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
    { id: 'org-dl-1', name: 'AIIMS New Delhi', type: 'Hospital', email: 'admin@aiims.edu', phone: '+91 11-2659-3308', address: 'Ansari Nagar', status: 'approved', city: 'New Delhi', state: 'Delhi', country: 'India', pincode: '110029', certificate_status: 'verified', staff_count: 60, patient_count: 890, created_at: '2025-05-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
    { id: 'org-tn-1', name: 'Rajiv Gandhi Govt Hospital', type: 'Hospital', email: 'admin@rggh.gov.in', phone: '+91 44-2530-5000', address: 'Park Town', status: 'approved', city: 'Chennai', state: 'Tamil Nadu', country: 'India', pincode: '600003', certificate_status: 'verified', staff_count: 38, patient_count: 502, created_at: '2025-08-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
    { id: 'org-ka-1', name: 'Victoria Hospital', type: 'Hospital', email: 'admin@victoria.gov.in', phone: '+91 80-2670-1150', address: 'Fort Rd', status: 'approved', city: 'Bengaluru', state: 'Karnataka', country: 'India', pincode: '560002', certificate_status: 'verified', staff_count: 30, patient_count: 410, created_at: '2025-07-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
    { id: 'org-wb-1', name: 'SSKM Hospital Kolkata', type: 'Hospital', email: 'admin@sskm.gov.in', phone: '+91 33-2223-7800', address: 'A.J.C. Bose Road', status: 'approved', city: 'Kolkata', state: 'West Bengal', country: 'India', pincode: '700020', certificate_status: 'verified', staff_count: 27, patient_count: 345, created_at: '2025-10-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
    { id: 'org-up-1', name: 'KGMU Lucknow', type: 'Hospital', email: 'admin@kgmu.co.in', phone: '+91 522-225-7540', address: 'Shah Mina Road', status: 'approved', city: 'Lucknow', state: 'Uttar Pradesh', country: 'India', pincode: '226003', certificate_status: 'verified', staff_count: 40, patient_count: 480, created_at: '2025-09-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
    { id: 'org-kl-1', name: 'Government Medical College Kochi', type: 'Hospital', email: 'admin@gmck.gov.in', phone: '+91 484-236-1611', address: 'Ernakulam', status: 'approved', city: 'Kochi', state: 'Kerala', country: 'India', pincode: '682011', certificate_status: 'verified', staff_count: 25, patient_count: 290, created_at: '2025-11-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
    { id: 'org-gj-1', name: 'Civil Hospital Ahmedabad', type: 'Hospital', email: 'admin@civil.gov.in', phone: '+91 79-2268-4400', address: 'Asarwa', status: 'approved', city: 'Ahmedabad', state: 'Gujarat', country: 'India', pincode: '380016', certificate_status: 'verified', staff_count: 35, patient_count: 380, created_at: '2025-06-15T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
    { id: 'org-rj-1', name: 'SMS Medical College Hospital', type: 'Hospital', email: 'admin@sms.gov.in', phone: '+91 141-256-0291', address: 'J.L.N. Marg', status: 'approved', city: 'Jaipur', state: 'Rajasthan', country: 'India', pincode: '302004', certificate_status: 'verified', staff_count: 22, patient_count: 280, created_at: '2025-09-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
    { id: 'org-bh-1', name: 'PMCH Patna', type: 'Hospital', email: 'admin@pmch.gov.in', phone: '+91 612-222-3078', address: 'Ashok Rajpath', status: 'approved', city: 'Patna', state: 'Bihar', country: 'India', pincode: '800004', certificate_status: 'verified', staff_count: 18, patient_count: 220, created_at: '2025-12-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
];

// ─── Staff ────────────────────────────────────────────────
export const mockStaff: User[] = [
    { id: 'staff-mh-1', email: 'ravi.kulkarni@kem.gov.in', full_name: 'Dr. Ravi Kulkarni', role: 'doctor', organization_id: 'org-mh-1', phone: '+91 98200-20001', created_at: '2025-06-01T00:00:00Z', updated_at: '2025-06-01T00:00:00Z' },
    { id: 'staff-dl-1', email: 'anjali.singh@aiims.edu', full_name: 'Dr. Anjali Singh', role: 'doctor', organization_id: 'org-dl-1', phone: '+91 11000-20006', created_at: '2025-05-01T00:00:00Z', updated_at: '2025-05-01T00:00:00Z' },
    { id: 'staff-tn-1', email: 'anand.rajan@rggh.gov.in', full_name: 'Dr. Anand Rajan', role: 'doctor', organization_id: 'org-tn-1', phone: '+91 44000-20003', created_at: '2025-08-01T00:00:00Z', updated_at: '2025-08-01T00:00:00Z' },
    { id: 'staff-ka-1', email: 'preethi.sharma@victoria.gov.in', full_name: 'Dr. Preethi Sharma', role: 'doctor', organization_id: 'org-ka-1', phone: '+91 80000-20002', created_at: '2025-07-01T00:00:00Z', updated_at: '2025-07-01T00:00:00Z' },
    { id: 'staff-wb-1', email: 'subrata.das@sskm.gov.in', full_name: 'Dr. Subrata Das', role: 'doctor', organization_id: 'org-wb-1', phone: '+91 33000-20005', created_at: '2025-10-01T00:00:00Z', updated_at: '2025-10-01T00:00:00Z' },
    { id: 'staff-up-1', email: 'rakesh.mishra@kgmu.co.in', full_name: 'Dr. Rakesh Mishra', role: 'doctor', organization_id: 'org-up-1', phone: '+91 52200-20007', created_at: '2025-09-01T00:00:00Z', updated_at: '2025-09-01T00:00:00Z' },
    { id: 'staff-kl-1', email: 'nair.pillai@gmck.gov.in', full_name: 'Dr. Nair Pillai', role: 'doctor', organization_id: 'org-kl-1', phone: '+91 48400-20008', created_at: '2025-11-01T00:00:00Z', updated_at: '2025-11-01T00:00:00Z' },
    { id: 'staff-gj-1', email: 'patel.sharma@civil.gov.in', full_name: 'Dr. Patel Sharma', role: 'doctor', organization_id: 'org-gj-1', phone: '+91 79000-20009', created_at: '2025-06-15T00:00:00Z', updated_at: '2025-06-15T00:00:00Z' },
    { id: 'staff-rj-1', email: 'meena.agarwal@sms.gov.in', full_name: 'Dr. Meena Agarwal', role: 'doctor', organization_id: 'org-rj-1', phone: '+91 14100-20004', created_at: '2025-09-01T00:00:00Z', updated_at: '2025-09-01T00:00:00Z' },
    { id: 'staff-bh-1', email: 'kumar.prasad@pmch.gov.in', full_name: 'Dr. Kumar Prasad', role: 'doctor', organization_id: 'org-bh-1', phone: '+91 61200-20010', created_at: '2025-12-01T00:00:00Z', updated_at: '2025-12-01T00:00:00Z' },
];

// ─── Trend & Region data (for legacy references) ──────────
export const mockDiseaseMetrics: DiseaseMetric[] = STAT_CARDS.map(s => ({
    disease: s.disease, icd_code: s.icd_code, cases: s.cases, trend_percent: s.trend_percent
}));

export const mockTrendData: TrendDataPoint[] = [
    { month: 'Mar 2025', Influenza: 120, 'COVID-19': 160, Dengue: 55, Tuberculosis: 80, Malaria: 40 },
    { month: 'Apr 2025', Influenza: 162, 'COVID-19': 118, Dengue: 72, Tuberculosis: 71, Malaria: 41 },
    { month: 'May 2025', Influenza: 140, 'COVID-19': 90, Dengue: 130, Tuberculosis: 65, Malaria: 50 },
    { month: 'Jun 2025', Influenza: 120, 'COVID-19': 80, Dengue: 230, Tuberculosis: 60, Malaria: 55 },
    { month: 'Jul 2025', Influenza: 100, 'COVID-19': 70, Dengue: 300, Tuberculosis: 58, Malaria: 45 },
    { month: 'Aug 2025', Influenza: 90, 'COVID-19': 65, Dengue: 280, Tuberculosis: 55, Malaria: 42 },
    { month: 'Sep 2025', Influenza: 85, 'COVID-19': 72, Dengue: 180, Tuberculosis: 60, Malaria: 38 },
    { month: 'Oct 2025', Influenza: 95, 'COVID-19': 80, Dengue: 120, Tuberculosis: 65, Malaria: 35 },
    { month: 'Nov 2025', Influenza: 130, 'COVID-19': 95, Dengue: 95, Tuberculosis: 70, Malaria: 32 },
    { month: 'Dec 2025', Influenza: 180, 'COVID-19': 110, Dengue: 80, Tuberculosis: 78, Malaria: 28 },
    { month: 'Jan 2026', Influenza: 260, 'COVID-19': 130, Dengue: 60, Tuberculosis: 85, Malaria: 25 },
    { month: 'Feb 2026', Influenza: 342, 'COVID-19': 156, Dengue: 278, Tuberculosis: 94, Malaria: 118 },
];

export const mockWeeklyTrendData: TrendDataPoint[] = [
    { month: 'Week 1', Influenza: 28, 'COVID-19': 35, Dengue: 12, Tuberculosis: 18, Malaria: 8 },
    { month: 'Week 2', Influenza: 32, 'COVID-19': 30, Dengue: 15, Tuberculosis: 19, Malaria: 9 },
    { month: 'Week 3', Influenza: 35, 'COVID-19': 28, Dengue: 20, Tuberculosis: 18, Malaria: 12 },
    { month: 'Week 4', Influenza: 45, 'COVID-19': 25, Dengue: 25, Tuberculosis: 20, Malaria: 15 },
    { month: 'Week 5', Influenza: 50, 'COVID-19': 22, Dengue: 35, Tuberculosis: 22, Malaria: 18 },
    { month: 'Week 6', Influenza: 42, 'COVID-19': 20, Dengue: 45, Tuberculosis: 21, Malaria: 22 },
    { month: 'Week 7', Influenza: 38, 'COVID-19': 18, Dengue: 55, Tuberculosis: 20, Malaria: 25 },
    { month: 'Week 8', Influenza: 45, 'COVID-19': 20, Dengue: 48, Tuberculosis: 23, Malaria: 20 },
];

export const mockRegionData: RegionDataPoint[] = STATE_DISTRIBUTION.map(s => ({
    region: s.state, cases: s.current, prev: s.prev
}));

// ─── Lookups ──────────────────────────────────────────────
export const getPatientByPatientId = (patientId: string): Patient | undefined =>
    mockPatients.find(p => p.patient_id === patientId);
export const getPatientById = (id: string): Patient | undefined =>
    mockPatients.find(p => p.id === id);
export const getRecordsForPatient = (patientId: string): MedicalRecord[] =>
    mockRecords.filter(r => r.patient_id === patientId);
export const getRecordById = (id: string): MedicalRecord | undefined =>
    mockRecords.find(r => r.id === id);
