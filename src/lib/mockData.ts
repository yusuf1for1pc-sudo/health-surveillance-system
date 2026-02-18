import type { Patient, MedicalRecord, Organization, User, DiseaseMetric, TrendDataPoint, RegionDataPoint } from '@/lib/types';

// ─── Outbreak Generator (Wadala Dengue Cluster) ──────────
const generateWadalaOutbreak = () => {
    const patients: Patient[] = [];
    const records: MedicalRecord[] = [];
    const CENTER = { lat: 19.0222, lng: 72.8706 }; // Vidyalankar College, Wadala

    for (let i = 0; i < 78; i++) {
        // Random jitter within ~1km radius (approx 0.009 deg)
        // Using square root of random for uniform distribution within circle
        const r = 0.009 * Math.sqrt(Math.random());
        const theta = Math.random() * 2 * Math.PI;
        const lat = CENTER.lat + r * Math.cos(theta);
        const lng = CENTER.lng + r * Math.sin(theta);

        const id = `wadala-pt-${i + 1}`;

        patients.push({
            id,
            patient_id: `HSS-2026-WAD-${String(i + 1).padStart(3, '0')}`,
            full_name: `Wadala Resident ${i + 1}`,
            phone: `+91 99000-${String(i).padStart(5, '0')}`,
            gender: i % 2 === 0 ? 'Male' : 'Female',
            date_of_birth: '1990-01-01', // Placeholder
            blood_type: 'O+',
            organization_id: 'org-2', // Lilavati (nearest major)
            created_by: 'staff-3',
            city: 'Mumbai',
            state: 'Maharashtra',
            country: 'India',
            pincode: '400037', // Wadala pincode
            latitude: lat,
            longitude: lng,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        });

        records.push({
            id: `wadala-rec-${i + 1}`,
            patient_id: id,
            record_type: 'Clinical Note',
            title: 'Dengue Outbreak Case',
            description: 'High fever, rash, joint pain. Suspected Dengue during Wadala outbreak surveillance.',
            diagnosis: 'Dengue fever',
            icd_code: 'A90',
            icd_label: 'Dengue fever',
            created_by: 'staff-3',
            creator_name: 'Dr. Michael Patel',
            organization_id: 'org-2',
            created_at: new Date(Date.now() - Math.random() * 5 * 24 * 60 * 60 * 1000).toISOString(), // Last 5 days
            updated_at: new Date().toISOString()
        });
    }
    return { patients, records };
};

const wadalaOutbreak = generateWadalaOutbreak();

export const mockPatients: Patient[] = [
    ...wadalaOutbreak.patients,
    // ── Andheri / Jogeshwari ──
    { id: '1', patient_id: 'HSS-2026-0001', full_name: 'Aarav Sharma', phone: '+91 98200-10001', gender: 'Male', date_of_birth: '1985-03-12', blood_type: 'A+', allergies: 'None', emergency_contact: '+91 98200-10002', organization_id: 'org-1', created_by: 'staff-1', city: 'Mumbai', state: 'Maharashtra', country: 'India', pincode: '400058', latitude: 19.1136, longitude: 72.8697, created_at: '2026-01-10T10:00:00Z', updated_at: '2026-01-10T10:00:00Z' },
    { id: '2', patient_id: 'HSS-2026-0002', full_name: 'Priya Deshmukh', phone: '+91 98200-10003', gender: 'Female', date_of_birth: '1990-07-24', blood_type: 'O-', allergies: 'Penicillin', emergency_contact: '+91 98200-10004', organization_id: 'org-1', created_by: 'staff-1', city: 'Mumbai', state: 'Maharashtra', country: 'India', pincode: '400060', latitude: 19.1260, longitude: 72.8495, created_at: '2026-01-12T09:00:00Z', updated_at: '2026-01-12T09:00:00Z' },
    { id: '3', patient_id: 'HSS-2026-0003', full_name: 'Sneha Patil', phone: '+91 98200-10005', gender: 'Female', date_of_birth: '1978-11-05', blood_type: 'B+', allergies: 'Sulfa drugs', emergency_contact: '+91 98200-10006', organization_id: 'org-1', created_by: 'staff-2', city: 'Mumbai', state: 'Maharashtra', country: 'India', pincode: '400058', latitude: 19.1187, longitude: 72.8460, created_at: '2026-01-14T14:00:00Z', updated_at: '2026-01-14T14:00:00Z' },
    // ── Bandra / Khar ──
    { id: '4', patient_id: 'HSS-2026-0004', full_name: 'Rohit Mehta', phone: '+91 98200-10007', gender: 'Male', date_of_birth: '1995-01-18', blood_type: 'AB+', allergies: 'None', emergency_contact: '+91 98200-10008', organization_id: 'org-2', created_by: 'staff-3', city: 'Mumbai', state: 'Maharashtra', country: 'India', pincode: '400050', latitude: 19.0596, longitude: 72.8295, created_at: '2026-01-15T11:00:00Z', updated_at: '2026-01-15T11:00:00Z' },
    { id: '5', patient_id: 'HSS-2026-0005', full_name: 'Kavita Joshi', phone: '+91 98200-10009', gender: 'Female', date_of_birth: '1988-06-15', blood_type: 'O+', allergies: 'None', emergency_contact: '+91 98200-10010', organization_id: 'org-2', created_by: 'staff-3', city: 'Mumbai', state: 'Maharashtra', country: 'India', pincode: '400052', latitude: 19.0726, longitude: 72.8362, created_at: '2026-01-16T08:00:00Z', updated_at: '2026-01-16T08:00:00Z' },
    // ── Dadar / Prabhadevi ──
    { id: '6', patient_id: 'HSS-2026-0006', full_name: 'Vikram Singh', phone: '+91 98200-10011', gender: 'Male', date_of_birth: '1992-09-22', blood_type: 'A-', allergies: 'None', emergency_contact: '+91 98200-10012', organization_id: 'org-1', created_by: 'staff-1', city: 'Mumbai', state: 'Maharashtra', country: 'India', pincode: '400028', latitude: 19.0178, longitude: 72.8478, created_at: '2026-01-18T10:00:00Z', updated_at: '2026-01-18T10:00:00Z' },
    { id: '7', patient_id: 'HSS-2026-0007', full_name: 'Meena Kulkarni', phone: '+91 98200-10013', gender: 'Female', date_of_birth: '1980-04-10', blood_type: 'B-', allergies: 'Aspirin', emergency_contact: '+91 98200-10014', organization_id: 'org-1', created_by: 'staff-2', city: 'Mumbai', state: 'Maharashtra', country: 'India', pincode: '400014', latitude: 19.0166, longitude: 72.8432, created_at: '2026-01-19T09:00:00Z', updated_at: '2026-01-19T09:00:00Z' },
    // ── Kurla / Ghatkopar ──
    { id: '8', patient_id: 'HSS-2026-0008', full_name: 'Anita Pawar', phone: '+91 98200-10015', gender: 'Female', date_of_birth: '1999-12-01', blood_type: 'O+', allergies: 'None', emergency_contact: '+91 98200-10016', organization_id: 'org-1', created_by: 'staff-2', city: 'Mumbai', state: 'Maharashtra', country: 'India', pincode: '400070', latitude: 19.0726, longitude: 72.8845, created_at: '2026-01-20T14:00:00Z', updated_at: '2026-01-20T14:00:00Z' },
    { id: '9', patient_id: 'HSS-2026-0009', full_name: 'Suresh Gaikwad', phone: '+91 98200-10017', gender: 'Male', date_of_birth: '1975-05-30', blood_type: 'A+', allergies: 'None', emergency_contact: '+91 98200-10018', organization_id: 'org-1', created_by: 'staff-1', city: 'Mumbai', state: 'Maharashtra', country: 'India', pincode: '400086', latitude: 19.0860, longitude: 72.9080, created_at: '2026-01-22T10:00:00Z', updated_at: '2026-01-22T10:00:00Z' },
    // ── Thane ──
    { id: '10', patient_id: 'HSS-2026-0010', full_name: 'Rajesh Thakur', phone: '+91 98200-10019', gender: 'Male', date_of_birth: '1982-08-14', blood_type: 'B+', allergies: 'None', emergency_contact: '+91 98200-10020', organization_id: 'org-2', created_by: 'staff-3', city: 'Thane', state: 'Maharashtra', country: 'India', pincode: '400601', latitude: 19.2183, longitude: 72.9781, created_at: '2026-01-25T09:00:00Z', updated_at: '2026-01-25T09:00:00Z' },
    { id: '11', patient_id: 'HSS-2026-0011', full_name: 'Deepa Nair', phone: '+91 98200-10021', gender: 'Female', date_of_birth: '1997-02-20', blood_type: 'AB-', allergies: 'None', emergency_contact: '+91 98200-10022', organization_id: 'org-2', created_by: 'staff-4', city: 'Thane', state: 'Maharashtra', country: 'India', pincode: '400607', latitude: 19.2403, longitude: 72.9629, created_at: '2026-01-26T11:00:00Z', updated_at: '2026-01-26T11:00:00Z' },
    // ── Borivali / Kandivali ──
    { id: '12', patient_id: 'HSS-2026-0012', full_name: 'Amit Yadav', phone: '+91 98200-10023', gender: 'Male', date_of_birth: '1991-11-08', blood_type: 'O-', allergies: 'Peanuts', emergency_contact: '+91 98200-10024', organization_id: 'org-1', created_by: 'staff-1', city: 'Mumbai', state: 'Maharashtra', country: 'India', pincode: '400066', latitude: 19.2307, longitude: 72.8567, created_at: '2026-01-28T10:00:00Z', updated_at: '2026-01-28T10:00:00Z' },
    { id: '13', patient_id: 'HSS-2026-0013', full_name: 'Pooja Sawant', phone: '+91 98200-10025', gender: 'Female', date_of_birth: '1986-03-25', blood_type: 'A+', allergies: 'None', emergency_contact: '+91 98200-10026', organization_id: 'org-1', created_by: 'staff-2', city: 'Mumbai', state: 'Maharashtra', country: 'India', pincode: '400067', latitude: 19.2047, longitude: 72.8525, created_at: '2026-01-29T14:00:00Z', updated_at: '2026-01-29T14:00:00Z' },
    // ── Navi Mumbai ──
    { id: '14', patient_id: 'HSS-2026-0014', full_name: 'Nitin Bhosale', phone: '+91 98200-10027', gender: 'Male', date_of_birth: '1993-07-12', blood_type: 'B+', allergies: 'None', emergency_contact: '+91 98200-10028', organization_id: 'org-3', created_by: 'staff-4', city: 'Navi Mumbai', state: 'Maharashtra', country: 'India', pincode: '400703', latitude: 19.0330, longitude: 73.0297, created_at: '2026-02-01T09:00:00Z', updated_at: '2026-02-01T09:00:00Z' },
    { id: '15', patient_id: 'HSS-2026-0015', full_name: 'Sonal Kadam', phone: '+91 98200-10029', gender: 'Female', date_of_birth: '1989-10-03', blood_type: 'O+', allergies: 'None', emergency_contact: '+91 98200-10030', organization_id: 'org-3', created_by: 'staff-4', city: 'Navi Mumbai', state: 'Maharashtra', country: 'India', pincode: '400706', latitude: 19.0478, longitude: 73.0698, created_at: '2026-02-02T11:00:00Z', updated_at: '2026-02-02T11:00:00Z' },
    // ── Malad / Goregaon ──
    { id: '16', patient_id: 'HSS-2026-0016', full_name: 'Manish Tiwari', phone: '+91 98200-10031', gender: 'Male', date_of_birth: '1984-06-18', blood_type: 'A+', allergies: 'None', emergency_contact: '+91 98200-10032', organization_id: 'org-1', created_by: 'staff-1', city: 'Mumbai', state: 'Maharashtra', country: 'India', pincode: '400064', latitude: 19.1735, longitude: 72.8514, created_at: '2026-02-03T10:00:00Z', updated_at: '2026-02-03T10:00:00Z' },
    { id: '17', patient_id: 'HSS-2026-0017', full_name: 'Rekha Gupta', phone: '+91 98200-10033', gender: 'Female', date_of_birth: '1996-01-30', blood_type: 'AB+', allergies: 'Dust', emergency_contact: '+91 98200-10034', organization_id: 'org-1', created_by: 'staff-2', city: 'Mumbai', state: 'Maharashtra', country: 'India', pincode: '400063', latitude: 19.1663, longitude: 72.8494, created_at: '2026-02-04T09:00:00Z', updated_at: '2026-02-04T09:00:00Z' },
    // ── Colaba / South Mumbai ──
    { id: '18', patient_id: 'HSS-2026-0018', full_name: 'Farid Khan', phone: '+91 98200-10035', gender: 'Male', date_of_birth: '1970-12-05', blood_type: 'O+', allergies: 'None', emergency_contact: '+91 98200-10036', organization_id: 'org-2', created_by: 'staff-3', city: 'Mumbai', state: 'Maharashtra', country: 'India', pincode: '400005', latitude: 18.9067, longitude: 72.8147, created_at: '2026-02-05T10:00:00Z', updated_at: '2026-02-05T10:00:00Z' },
    // ── Mulund ──
    { id: '19', patient_id: 'HSS-2026-0019', full_name: 'Smita More', phone: '+91 98200-10037', gender: 'Female', date_of_birth: '1994-04-22', blood_type: 'B-', allergies: 'None', emergency_contact: '+91 98200-10038', organization_id: 'org-1', created_by: 'staff-1', city: 'Mumbai', state: 'Maharashtra', country: 'India', pincode: '400080', latitude: 19.1726, longitude: 72.9563, created_at: '2026-02-06T14:00:00Z', updated_at: '2026-02-06T14:00:00Z' },
    // ── Chembur ──
    { id: '20', patient_id: 'HSS-2026-0020', full_name: 'Ganesh Shinde', phone: '+91 98200-10039', gender: 'Male', date_of_birth: '1987-09-15', blood_type: 'A-', allergies: 'Shellfish', emergency_contact: '+91 98200-10040', organization_id: 'org-1', created_by: 'staff-2', city: 'Mumbai', state: 'Maharashtra', country: 'India', pincode: '400071', latitude: 19.0522, longitude: 72.8994, created_at: '2026-02-07T10:00:00Z', updated_at: '2026-02-07T10:00:00Z' },
    // ── Pune (secondary cluster) ──
    { id: '21', patient_id: 'HSS-2026-0021', full_name: 'Nandini Deshpande', phone: '+91 98200-10041', gender: 'Female', date_of_birth: '1983-02-14', blood_type: 'O+', allergies: 'None', emergency_contact: '+91 98200-10042', organization_id: 'org-4', created_by: 'staff-4', city: 'Pune', state: 'Maharashtra', country: 'India', pincode: '411001', latitude: 18.5204, longitude: 73.8567, created_at: '2026-02-08T09:00:00Z', updated_at: '2026-02-08T09:00:00Z' },
    { id: '22', patient_id: 'HSS-2026-0022', full_name: 'Sachin Jadhav', phone: '+91 98200-10043', gender: 'Male', date_of_birth: '1998-08-08', blood_type: 'B+', allergies: 'None', emergency_contact: '+91 98200-10044', organization_id: 'org-4', created_by: 'staff-4', city: 'Pune', state: 'Maharashtra', country: 'India', pincode: '411038', latitude: 18.5089, longitude: 73.8259, created_at: '2026-02-09T10:00:00Z', updated_at: '2026-02-09T10:00:00Z' },
];

// ─── Mock Medical Records (Outbreak Simulation) ──────────
export const mockRecords: MedicalRecord[] = [
    ...wadalaOutbreak.records,
    // ════════ DENGUE CLUSTER — Andheri/Jogeshwari (Hotspot) ════════
    { id: 'rec-1', patient_id: '1', record_type: 'Clinical Note', title: 'Dengue Fever', description: 'High fever 103°F, body ache, low platelets (85k). NS1 Ag positive.', diagnosis: 'Dengue fever', icd_code: 'A90', icd_label: 'Dengue fever', created_by: 'staff-1', creator_name: 'Dr. Emily Watson', organization_id: 'org-1', created_at: '2026-02-10T09:00:00Z', updated_at: '2026-02-10T09:00:00Z' },
    { id: 'rec-2', patient_id: '2', record_type: 'Lab Report', title: 'Dengue NS1 Antigen', description: 'NS1 Ag: Positive. IgM: Positive. Platelet count: 72,000.', icd_code: 'A90', icd_label: 'Dengue fever', attachment_name: 'dengue-ns1-report.pdf', created_by: 'staff-2', creator_name: 'Lisa Chen', organization_id: 'org-1', created_at: '2026-02-11T14:00:00Z', updated_at: '2026-02-11T14:00:00Z' },
    { id: 'rec-3', patient_id: '3', record_type: 'Clinical Note', title: 'Dengue Warning Signs', description: 'Abdominal pain, persistent vomiting, platelets 65k. Admitted for observation.', diagnosis: 'Dengue with warning signs', icd_code: 'A90', icd_label: 'Dengue fever', created_by: 'staff-1', creator_name: 'Dr. Emily Watson', organization_id: 'org-1', created_at: '2026-02-12T10:00:00Z', updated_at: '2026-02-12T10:00:00Z' },
    { id: 'rec-4', patient_id: '16', record_type: 'Prescription', title: 'Dengue Support', description: 'ORS, Paracetamol 500mg QID, IV fluids. Avoid NSAIDs.', diagnosis: 'Dengue fever', icd_code: 'A90', icd_label: 'Dengue fever', created_by: 'staff-1', creator_name: 'Dr. Emily Watson', organization_id: 'org-1', created_at: '2026-02-13T09:00:00Z', updated_at: '2026-02-13T09:00:00Z' },
    { id: 'rec-5', patient_id: '17', record_type: 'Lab Report', title: 'CBC - Dengue Suspect', description: 'Platelet count: 90,000. WBC: 3.2k (low). Hematocrit: 44%.', icd_code: 'A90', icd_label: 'Dengue fever', created_by: 'staff-2', creator_name: 'Lisa Chen', organization_id: 'org-1', created_at: '2026-02-14T11:00:00Z', updated_at: '2026-02-14T11:00:00Z' },
    { id: 'rec-6', patient_id: '12', record_type: 'Clinical Note', title: 'Dengue Fever', description: 'Classic dengue triad: fever, rash, body pain. Platelets 98k.', diagnosis: 'Dengue fever', icd_code: 'A90', icd_label: 'Dengue fever', created_by: 'staff-1', creator_name: 'Dr. Emily Watson', organization_id: 'org-1', created_at: '2026-02-15T08:30:00Z', updated_at: '2026-02-15T08:30:00Z' },

    // ════════ MALARIA CLUSTER — Kurla/Ghatkopar ════════
    { id: 'rec-7', patient_id: '8', record_type: 'Lab Report', title: 'Malaria Smear', description: 'Peripheral smear: Plasmodium vivax trophozoites seen. Parasitemia: 2%.', icd_code: 'B51', icd_label: 'Plasmodium vivax malaria', created_by: 'staff-2', creator_name: 'Lisa Chen', organization_id: 'org-1', created_at: '2026-02-08T10:00:00Z', updated_at: '2026-02-08T10:00:00Z' },
    { id: 'rec-8', patient_id: '9', record_type: 'Prescription', title: 'Chloroquine + PQ', description: 'Chloroquine 600mg stat, then 300mg at 6h, 24h, 48h. Primaquine 15mg x 14 days.', diagnosis: 'P. vivax malaria', icd_code: 'B51', icd_label: 'Plasmodium vivax malaria', created_by: 'staff-1', creator_name: 'Dr. Emily Watson', organization_id: 'org-1', created_at: '2026-02-09T09:00:00Z', updated_at: '2026-02-09T09:00:00Z' },
    { id: 'rec-9', patient_id: '20', record_type: 'Clinical Note', title: 'Malaria - Chills & Fever', description: 'Cyclical high fever with chills every 48h. RDT positive for P. vivax.', diagnosis: 'Vivax malaria', icd_code: 'B51', icd_label: 'Plasmodium vivax malaria', created_by: 'staff-1', creator_name: 'Dr. Emily Watson', organization_id: 'org-1', created_at: '2026-02-13T10:00:00Z', updated_at: '2026-02-13T10:00:00Z' },

    // ════════ INFLUENZA — Bandra/Dadar ════════
    { id: 'rec-10', patient_id: '4', record_type: 'Prescription', title: 'Oseltamivir 75mg', description: 'Influenza A confirmed by rapid test. Oseltamivir 75mg BD x 5 days.', diagnosis: 'Influenza A', icd_code: 'J09', icd_label: 'Influenza due to identified virus', created_by: 'staff-3', creator_name: 'Dr. Michael Patel', organization_id: 'org-2', created_at: '2026-02-10T09:30:00Z', updated_at: '2026-02-10T09:30:00Z' },
    { id: 'rec-11', patient_id: '5', record_type: 'Clinical Note', title: 'Flu Symptoms', description: 'Sudden onset high fever, myalgia, dry cough, sore throat. Rapid flu test: A positive.', diagnosis: 'Influenza A', icd_code: 'J09', icd_label: 'Influenza due to identified virus', created_by: 'staff-3', creator_name: 'Dr. Michael Patel', organization_id: 'org-2', created_at: '2026-02-11T10:00:00Z', updated_at: '2026-02-11T10:00:00Z' },
    { id: 'rec-12', patient_id: '6', record_type: 'Clinical Note', title: 'Influenza', description: 'Fever 102°F, headache, muscle pain. Contact with confirmed flu case at workplace.', diagnosis: 'Influenza A', icd_code: 'J09', icd_label: 'Influenza due to identified virus', created_by: 'staff-1', creator_name: 'Dr. Emily Watson', organization_id: 'org-1', created_at: '2026-02-12T11:00:00Z', updated_at: '2026-02-12T11:00:00Z' },
    { id: 'rec-13', patient_id: '7', record_type: 'Prescription', title: 'Flu Treatment', description: 'Oseltamivir 75mg BD. Paracetamol PRN. Rest and fluids.', diagnosis: 'Influenza A', icd_code: 'J09', icd_label: 'Influenza due to identified virus', created_by: 'staff-2', creator_name: 'Lisa Chen', organization_id: 'org-1', created_at: '2026-02-13T14:00:00Z', updated_at: '2026-02-13T14:00:00Z' },

    // ════════ GASTROENTERITIS — Thane ════════
    { id: 'rec-14', patient_id: '10', record_type: 'Clinical Note', title: 'Acute Gastroenteritis', description: 'Watery diarrhea x 3 days, vomiting, dehydration. Likely contaminated water.', diagnosis: 'Gastroenteritis', icd_code: 'A09', icd_label: 'Infectious gastroenteritis', created_by: 'staff-3', creator_name: 'Dr. Michael Patel', organization_id: 'org-2', created_at: '2026-02-09T10:00:00Z', updated_at: '2026-02-09T10:00:00Z' },
    { id: 'rec-15', patient_id: '11', record_type: 'Prescription', title: 'ORS + Antibiotics', description: 'ORS sachets, Ciprofloxacin 500mg BD x 3 days. IV fluid if needed.', diagnosis: 'Acute gastroenteritis', icd_code: 'A09', icd_label: 'Infectious gastroenteritis', created_by: 'staff-4', creator_name: 'Dr. Sarah Jones', organization_id: 'org-2', created_at: '2026-02-10T11:00:00Z', updated_at: '2026-02-10T11:00:00Z' },

    // ════════ COVID-19 — Scattered ════════
    { id: 'rec-16', patient_id: '14', record_type: 'Lab Report', title: 'RT-PCR COVID-19', description: 'SARS-CoV-2 RT-PCR: POSITIVE. Ct value: 24. Mild symptoms.', icd_code: 'U07.1', icd_label: 'COVID-19', created_by: 'staff-4', creator_name: 'Dr. Sarah Jones', organization_id: 'org-3', created_at: '2026-02-14T09:00:00Z', updated_at: '2026-02-14T09:00:00Z' },
    { id: 'rec-17', patient_id: '18', record_type: 'Clinical Note', title: 'COVID Moderate', description: 'SpO2 93%, bilateral lung infiltrates. Started on Remdesivir.', diagnosis: 'COVID-19 moderate', icd_code: 'U07.1', icd_label: 'COVID-19', created_by: 'staff-3', creator_name: 'Dr. Michael Patel', organization_id: 'org-2', created_at: '2026-02-15T10:00:00Z', updated_at: '2026-02-15T10:00:00Z' },

    // ════════ TUBERCULOSIS — Mulund/Chembur ════════
    { id: 'rec-18', patient_id: '19', record_type: 'Lab Report', title: 'Sputum AFB', description: 'Sputum AFB: 2+ positive. GeneXpert: MTB detected, Rifampicin sensitive.', icd_code: 'A15', icd_label: 'Respiratory tuberculosis', created_by: 'staff-2', creator_name: 'Lisa Chen', organization_id: 'org-1', created_at: '2026-02-11T11:00:00Z', updated_at: '2026-02-11T11:00:00Z' },
    { id: 'rec-19', patient_id: '20', record_type: 'Prescription', title: 'ATT DOTS', description: 'RNTCP DOTS Cat-I: HRZE intensive phase 2 months.', diagnosis: 'Pulmonary TB', icd_code: 'A15', icd_label: 'Respiratory tuberculosis', created_by: 'staff-1', creator_name: 'Dr. Emily Watson', organization_id: 'org-1', created_at: '2026-02-12T09:00:00Z', updated_at: '2026-02-12T09:00:00Z' },

    // ════════ DIABETES / HYPERTENSION (Chronic) ════════
    { id: 'rec-20', patient_id: '13', record_type: 'Prescription', title: 'Metformin 500mg', description: 'Metformin 500mg BD with meals. HbA1c: 8.2%.', diagnosis: 'Type 2 diabetes', icd_code: 'E11', icd_label: 'Type 2 diabetes mellitus', created_by: 'staff-1', creator_name: 'Dr. Emily Watson', organization_id: 'org-1', created_at: '2026-02-05T09:00:00Z', updated_at: '2026-02-05T09:00:00Z' },
    { id: 'rec-21', patient_id: '18', record_type: 'Prescription', title: 'Amlodipine 5mg', description: 'BP 160/95. Start Amlodipine 5mg OD. Review in 2 weeks.', diagnosis: 'Hypertension', icd_code: 'I10', icd_label: 'Essential hypertension', created_by: 'staff-3', creator_name: 'Dr. Michael Patel', organization_id: 'org-2', created_at: '2026-02-06T10:00:00Z', updated_at: '2026-02-06T10:00:00Z' },
    { id: 'rec-22', patient_id: '6', record_type: 'Lab Report', title: 'HbA1c', description: 'HbA1c: 7.8%. Fasting glucose: 142 mg/dL.', icd_code: 'E11', icd_label: 'Type 2 diabetes mellitus', created_by: 'staff-2', creator_name: 'Lisa Chen', organization_id: 'org-1', created_at: '2026-02-07T14:00:00Z', updated_at: '2026-02-07T14:00:00Z' },

    // ════════ PNEUMONIA — Navi Mumbai ════════
    { id: 'rec-23', patient_id: '14', record_type: 'Clinical Note', title: 'Community Pneumonia', description: 'Productive cough, fever, crackles in right lower lobe. CXR: consolidation.', diagnosis: 'Community-acquired pneumonia', icd_code: 'J18', icd_label: 'Pneumonia', created_by: 'staff-4', creator_name: 'Dr. Sarah Jones', organization_id: 'org-3', created_at: '2026-02-01T10:00:00Z', updated_at: '2026-02-01T10:00:00Z' },
    { id: 'rec-24', patient_id: '15', record_type: 'Prescription', title: 'Azithromycin 500mg', description: 'Azithromycin 500mg OD x 5 days. Cough syrup PRN.', diagnosis: 'Pneumonia', icd_code: 'J18', icd_label: 'Pneumonia', created_by: 'staff-4', creator_name: 'Dr. Sarah Jones', organization_id: 'org-3', created_at: '2026-02-02T09:00:00Z', updated_at: '2026-02-02T09:00:00Z' },

    // ════════ DENGUE in Pune (spillover) ════════
    { id: 'rec-25', patient_id: '21', record_type: 'Clinical Note', title: 'Dengue Fever', description: 'High fever, retro-orbital pain, rash. NS1 positive.', diagnosis: 'Dengue fever', icd_code: 'A90', icd_label: 'Dengue fever', created_by: 'staff-4', creator_name: 'Dr. Sarah Jones', organization_id: 'org-4', created_at: '2026-02-16T09:00:00Z', updated_at: '2026-02-16T09:00:00Z' },
    { id: 'rec-26', patient_id: '22', record_type: 'Lab Report', title: 'Dengue Serology', description: 'NS1: Positive. IgM: Negative (early). Platelets: 105k.', icd_code: 'A90', icd_label: 'Dengue fever', created_by: 'staff-4', creator_name: 'Dr. Sarah Jones', organization_id: 'org-4', created_at: '2026-02-17T10:00:00Z', updated_at: '2026-02-17T10:00:00Z' },

    // ════════ Additional respiratory for Borivali cluster ════════
    { id: 'rec-27', patient_id: '12', record_type: 'Clinical Note', title: 'Upper Resp Infection', description: 'Sore throat, nasal congestion, mild cough. No fever.', diagnosis: 'URI', icd_code: 'J06', icd_label: 'Acute upper respiratory infections', created_by: 'staff-1', creator_name: 'Dr. Emily Watson', organization_id: 'org-1', created_at: '2026-02-01T10:00:00Z', updated_at: '2026-02-01T10:00:00Z' },
    { id: 'rec-28', patient_id: '13', record_type: 'Clinical Note', title: 'Bronchitis', description: 'Persistent cough x 2 weeks, yellow sputum. Lungs: scattered rhonchi.', diagnosis: 'Acute bronchitis', icd_code: 'J20', icd_label: 'Acute bronchitis', created_by: 'staff-2', creator_name: 'Lisa Chen', organization_id: 'org-1', created_at: '2026-02-08T14:00:00Z', updated_at: '2026-02-08T14:00:00Z' },

    // ════════ LEPTOSPIROSIS — Mumbai monsoon aftermath ════════
    { id: 'rec-29', patient_id: '9', record_type: 'Lab Report', title: 'Lepto IgM', description: 'Leptospira IgM: Positive. Jaundice, fever, myalgia. Waded through floodwater.', icd_code: 'A27', icd_label: 'Leptospirosis', created_by: 'staff-2', creator_name: 'Lisa Chen', organization_id: 'org-1', created_at: '2026-02-14T10:00:00Z', updated_at: '2026-02-14T10:00:00Z' },
    { id: 'rec-30', patient_id: '8', record_type: 'Prescription', title: 'Doxycycline', description: 'Doxycycline 100mg BD x 7 days. IV Penicillin if severe.', diagnosis: 'Leptospirosis', icd_code: 'A27', icd_label: 'Leptospirosis', created_by: 'staff-1', creator_name: 'Dr. Emily Watson', organization_id: 'org-1', created_at: '2026-02-15T09:00:00Z', updated_at: '2026-02-15T09:00:00Z' },
];

// ─── Mock Organizations (Mumbai Region) ──────────────────
export const mockOrganizations: Organization[] = [
    {
        id: 'org-1', name: 'Kokilaben Dhirubhai Ambani Hospital', type: 'Hospital', email: 'admin@kokilaben.com',
        phone: '+91 22-3099-9999', address: 'Rao Saheb, Achutrao Patwardhan Marg, Four Bunglows', status: 'approved',
        city: 'Mumbai', state: 'Maharashtra', country: 'India', pincode: '400053',
        certificate_status: 'verified', staff_count: 34, patient_count: 456,
        created_at: '2025-06-15T00:00:00Z', updated_at: '2026-01-01T00:00:00Z',
    },
    {
        id: 'org-2', name: 'Lilavati Hospital', type: 'Hospital', email: 'info@lilavatihospital.com',
        phone: '+91 22-2675-1000', address: 'A-791, Bandra Reclamation, Bandra West', status: 'approved',
        city: 'Mumbai', state: 'Maharashtra', country: 'India', pincode: '400050',
        certificate_status: 'verified', staff_count: 28, patient_count: 320,
        created_at: '2025-08-10T00:00:00Z', updated_at: '2026-01-01T00:00:00Z',
    },
    {
        id: 'org-3', name: 'Apollo Hospital Navi Mumbai', type: 'Hospital', email: 'contact@apollonavimumbai.com',
        phone: '+91 22-3350-3350', address: 'Plot #13, Sector 23, CBD Belapur', status: 'approved',
        city: 'Navi Mumbai', state: 'Maharashtra', country: 'India', pincode: '400614',
        certificate_status: 'verified', staff_count: 12, patient_count: 180,
        created_at: '2025-09-20T00:00:00Z', updated_at: '2025-12-01T00:00:00Z',
    },
    {
        id: 'org-4', name: 'Sassoon General Hospital', type: 'Hospital', email: 'admin@sassoon.gov.in',
        phone: '+91 20-2612-0000', address: 'Near Pune Station, J.P. Narayan Rd', status: 'approved',
        city: 'Pune', state: 'Maharashtra', country: 'India', pincode: '411001',
        certificate_status: 'verified', staff_count: 22, patient_count: 310,
        created_at: '2026-01-01T00:00:00Z', updated_at: '2026-02-01T00:00:00Z',
    },
    {
        id: 'org-5', name: 'Thane Civil Hospital', type: 'Hospital', email: 'civil@thane.gov.in',
        phone: '+91 22-2534-1234', address: 'Thane Station Rd, Thane West', status: 'pending',
        city: 'Thane', state: 'Maharashtra', country: 'India', pincode: '400601',
        certificate_status: 'pending', staff_count: 15, patient_count: 200,
        created_at: '2026-02-01T00:00:00Z', updated_at: '2026-02-01T00:00:00Z',
    },
];

// ─── Mock Staff ──────────────────────────────────────────
export const mockStaff: User[] = [
    { id: 'staff-1', email: 'emily.watson@kokilaben.com', full_name: 'Dr. Emily Watson', role: 'doctor', organization_id: 'org-1', phone: '+91 98200-20001', created_at: '2025-07-01T00:00:00Z', updated_at: '2025-07-01T00:00:00Z' },
    { id: 'staff-2', email: 'lisa.chen@kokilaben.com', full_name: 'Lisa Chen', role: 'lab_staff', organization_id: 'org-1', phone: '+91 98200-20002', created_at: '2025-07-15T00:00:00Z', updated_at: '2025-07-15T00:00:00Z' },
    { id: 'staff-3', email: 'michael.patel@lilavati.com', full_name: 'Dr. Michael Patel', role: 'doctor', organization_id: 'org-2', phone: '+91 98200-20003', created_at: '2025-08-01T00:00:00Z', updated_at: '2025-08-01T00:00:00Z' },
    { id: 'staff-4', email: 'sarah.jones@apollo.com', full_name: 'Dr. Sarah Jones', role: 'doctor', organization_id: 'org-3', phone: '+91 98200-20004', created_at: '2026-01-20T00:00:00Z', updated_at: '2026-01-20T00:00:00Z' },
];

// ─── Surveillance Mock Data (anonymized) ─────────────────
export const mockDiseaseMetrics: DiseaseMetric[] = [
    { disease: 'Dengue fever', icd_code: 'A90', cases: 8, trend_percent: 28 },
    { disease: 'Influenza A', icd_code: 'J09', cases: 4, trend_percent: 12 },
    { disease: 'P. vivax malaria', icd_code: 'B51', cases: 3, trend_percent: 18 },
    { disease: 'COVID-19', icd_code: 'U07.1', cases: 2, trend_percent: -5 },
    { disease: 'Gastroenteritis', icd_code: 'A09', cases: 2, trend_percent: 7 },
    { disease: 'Tuberculosis', icd_code: 'A15', cases: 2, trend_percent: -3 },
    { disease: 'Pneumonia', icd_code: 'J18', cases: 2, trend_percent: 15 },
    { disease: 'Leptospirosis', icd_code: 'A27', cases: 2, trend_percent: 40 },
    { disease: 'Type 2 Diabetes', icd_code: 'E11', cases: 2, trend_percent: 5 },
];

export const mockTrendData: TrendDataPoint[] = [
    { month: 'Sep', influenza: 12, covid: 20, dengue: 4, tb: 3 },
    { month: 'Oct', influenza: 18, covid: 16, dengue: 8, tb: 3 },
    { month: 'Nov', influenza: 25, covid: 13, dengue: 12, tb: 4 },
    { month: 'Dec', influenza: 31, covid: 11, dengue: 14, tb: 5 },
    { month: 'Jan', influenza: 34, covid: 9, dengue: 15, tb: 6 },
    { month: 'Feb', influenza: 34, covid: 8, dengue: 15, tb: 6 },
];

export const mockRegionData: RegionDataPoint[] = [
    { region: 'Andheri', cases: 8, prev: 4 },
    { region: 'Bandra', cases: 5, prev: 3 },
    { region: 'Dadar', cases: 4, prev: 3 },
    { region: 'Kurla', cases: 5, prev: 2 },
    { region: 'Thane', cases: 3, prev: 2 },
    { region: 'Borivali', cases: 4, prev: 3 },
    { region: 'Navi Mumbai', cases: 3, prev: 1 },
    { region: 'Pune', cases: 2, prev: 1 },
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
    const id = `HSS-${year}-${String(patientCounter++).padStart(4, '0')}`;
    return id;
};
