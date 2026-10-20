import type { UserRole } from '@/lib/types';

/**
 * Built-in demo accounts. These match real accounts in your Supabase project, so signing in
 * tries the real account first (real data, approvals and requests work). Only when Supabase
 * is unreachable, or rejects the login, does it fall back to the offline demo session, whose
 * data comes from the in-memory demo dataset (see demoSupabase.ts and mockData.ts).
 * The credentials are visible in the client bundle by design.
 */
export interface DemoUser {
    id: string;
    email: string;
    full_name: string;
    role: UserRole;
    phone?: string;
    organization_id?: string;
}

export interface DemoAccount {
    label: string;
    email: string;
    password: string;
    user: DemoUser;
}

export const DEMO_STORAGE_KEY = 'tempest_demo_user';
export const DEMO_ORG_ID = 'org-mh-1';
export const DEMO_DOCTOR_ID = 'demo-doctor';
export const DEMO_PATIENT_AUTH_ID = 'demo-patient';

export const DEMO_ACCOUNTS: DemoAccount[] = [
    {
        label: 'Doctor',
        email: 'droctopus@mail.com',
        password: 'pass123',
        user: { id: DEMO_DOCTOR_ID, email: 'droctopus@mail.com', full_name: 'Dr. Octopus', role: 'doctor', phone: '+91 98200-20001', organization_id: DEMO_ORG_ID },
    },
    {
        label: 'Patient',
        email: 'swayam@mail.com',
        password: 'pass123',
        user: { id: DEMO_PATIENT_AUTH_ID, email: 'swayam@mail.com', full_name: 'Swayam Sonawane', role: 'patient', phone: '+91 99000-00001' },
    },
    {
        label: 'Org Admin',
        email: 'bhartiyahospital@gmail.com',
        password: 'pass123',
        user: { id: 'demo-org', email: 'bhartiyahospital@gmail.com', full_name: 'Bhartiya Hospital', role: 'org_admin', phone: '+91 22-2410-7000', organization_id: DEMO_ORG_ID },
    },
    {
        label: 'Admin',
        email: 'admin@tempest.com',
        password: 'admin123',
        user: { id: 'demo-admin', email: 'admin@tempest.com', full_name: 'Tempest Admin', role: 'platform_admin' },
    },
    {
        label: 'Government',
        email: 'gov@gov.mail',
        password: 'gov123',
        user: { id: 'demo-gov', email: 'gov@gov.mail', full_name: 'Public Health Dept.', role: 'government' },
    },
];

export const findDemoAccount = (email: string, password: string): DemoAccount | undefined =>
    DEMO_ACCOUNTS.find(a => a.email.toLowerCase() === email.trim().toLowerCase() && a.password === password);

const findByEmail = (email: string | null): DemoAccount | undefined =>
    email ? DEMO_ACCOUNTS.find(a => a.email.toLowerCase() === email.toLowerCase()) : undefined;

export const saveDemoSession = (account: DemoAccount) => {
    try { localStorage.setItem(DEMO_STORAGE_KEY, account.email); } catch { /* storage unavailable */ }
};

/** The demo user for the current browser session, if one is signed in. */
export const loadDemoSession = (): DemoUser | null => {
    try {
        return findByEmail(localStorage.getItem(DEMO_STORAGE_KEY))?.user ?? null;
    } catch {
        return null;
    }
};

export const isDemoSession = (): boolean => loadDemoSession() !== null;
