// ─── User & Auth ─────────────────────────────────────────
export type UserRole = 'platform_admin' | 'org_admin' | 'doctor' | 'lab_staff' | 'patient' | 'government';

export interface User {
    id: string;
    email: string;
    full_name: string;
    role: UserRole;
    organization_id?: string;
    phone?: string;
    avatar_url?: string;
    created_at: string;
    updated_at: string;
}

// ─── Organization ────────────────────────────────────────
export type OrgStatus = 'pending' | 'approved' | 'rejected';
export type CertificateStatus = 'pending' | 'verified' | 'rejected';

export interface Organization {
    id: string;
    name: string;
    type: string; // Hospital, Clinic, Laboratory
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    country: string;
    pincode: string;
    status: OrgStatus;
    certificate_url?: string;
    certificate_status: CertificateStatus;
    staff_count: number;
    patient_count: number;
    created_at: string;
    updated_at: string;
}

// ─── Patient ─────────────────────────────────────────────
export interface Patient {
    id: string;
    patient_id: string; // e.g. TMP-2026-0042
    full_name: string;
    phone: string;
    email?: string;
    gender: 'Male' | 'Female' | 'Other';
    date_of_birth: string;
    blood_type?: string;
    allergies?: string;
    emergency_contact?: string;
    address?: string;
    city: string;
    state: string;
    country: string;
    pincode: string;
    latitude?: number;
    longitude?: number;
    organization_id?: string;
    created_by: string; // staff user id
    created_at: string;
    updated_at: string;
}

// ─── Medical Record ──────────────────────────────────────
export type RecordType = 'Prescription' | 'Lab Report' | 'Clinical Note';

export interface MedicalRecord {
    id: string;
    patient_id: string;
    record_type: RecordType;
    title: string;
    description: string;
    diagnosis?: string;
    icd_code?: string;
    icd_label?: string;
    attachment_url?: string;
    attachment_name?: string;
    created_by: string;
    creator_name: string;
    organization_id: string;
    created_at: string;
    updated_at: string;
}

// ─── Certificate ─────────────────────────────────────────
export interface Certificate {
    id: string;
    entity_type: 'organization' | 'staff';
    entity_id: string;
    file_url: string;
    file_name: string;
    status: CertificateStatus;
    reviewed_by?: string;
    reviewed_at?: string;
    created_at: string;
}

// ─── ICD Code ────────────────────────────────────────────
export interface ICDCode {
    code: string;
    label: string;
    category: string;
}

// ─── Surveillance (aggregated, anonymized) ───────────────
export interface DiseaseMetric {
    disease: string;
    icd_code: string;
    cases: number;
    trend_percent: number;
}

export interface TrendDataPoint {
    month: string;
    [disease: string]: string | number;
}

export interface RegionDataPoint {
    region: string;
    cases: number;
    prev: number;
}

// ─── Gemini AI ───────────────────────────────────────────
export interface DiagnosisSuggestion {
    diagnosis: string;
    icd_code: string;
    icd_label: string;
    confidence: number;
    reasoning: string;
}
