import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { mockPatients as initialMockPatients, mockRecords as initialMockRecords, mockOrganizations, mockStaff } from '../lib/mockData';
import type { Patient, MedicalRecord, Organization, User } from '@/lib/types';

interface DataContextType {
    // Patients
    patients: Patient[];
    addPatient: (patient: Omit<Patient, 'id' | 'created_at' | 'updated_at'>) => Promise<Patient>;
    getPatient: (id: string) => Patient | undefined;
    getPatientByPatientId: (patientId: string) => Patient | undefined;

    // Records
    records: MedicalRecord[];
    addRecord: (record: Omit<MedicalRecord, 'id' | 'created_at' | 'updated_at'>) => Promise<MedicalRecord>;
    getRecord: (id: string) => MedicalRecord | undefined;
    getRecordsForPatient: (patientId: string) => MedicalRecord[];

    // Organizations
    organizations: Organization[];

    // Staff
    staff: User[];

    // Loading
    loading: boolean;
    refresh: () => Promise<void>;
    updateOrganizationStatus: (id: string, status: 'approved' | 'rejected') => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// ─── Patient ID generator ────────────────────────────────
let counter = 43;
const generatePatientId = (): string => {
    const year = new Date().getFullYear();
    return `TMP-${year}-${String(counter++).padStart(4, '0')}`;
};

// Check if user is a demo (non-Supabase-auth) user
const isDemoUser = (userId?: string) => !userId || userId.startsWith('demo-') || userId === 'mock-user-id';

export const DataProvider = ({ children }: { children: ReactNode }) => {
    const { user } = useAuth();
    const [patients, setPatients] = useState<Patient[]>([]);
    const [records, setRecords] = useState<MedicalRecord[]>([]);
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [staff] = useState<User[]>(mockStaff);
    const [loading, setLoading] = useState(true);
    const lastFetchKey = React.useRef<string>('');

    // ─── Load mock data ONLY for demo users ────────────────
    useEffect(() => {
        if (user && isDemoUser(user.id)) {
            setPatients(initialMockPatients);
            setRecords(initialMockRecords);
            setLoading(false);
        } else if (!user) {
            // No user logged in yet — keep empty
            setPatients([]);
            setRecords([]);
            setLoading(false);
        }
    }, [user]);

    // ─── Fetch from Supabase if real auth user ────────────────
    const fetchData = useCallback(async () => {
        if (!isSupabaseConfigured() || !user || isDemoUser(user.id)) return;

        setLoading(true);
        try {
            // Helper to fetch all pages since Supabase caps at 1000 rows
            const fetchAll = async (baseQuery: any) => {
                let allData: any[] = [];
                let from = 0;
                const step = 1000;
                while (true) {
                    const { data, error } = await baseQuery.range(from, from + step - 1);
                    if (error) {
                        console.error('Pagination error:', error);
                        break;
                    }
                    if (!data || data.length === 0) break;
                    allData = allData.concat(data);
                    if (data.length < step) break;
                    from += step;
                }
                return allData;
            };

            // Build queries based on role
            let patientsQuery = supabase.from('patients').select('*').order('created_at', { ascending: false });
            let recordsQuery = supabase.from('medical_records').select('*').order('created_at', { ascending: false });

            // For patient role, only fetch their own data
            if (user.role === 'patient') {
                patientsQuery = patientsQuery.eq('id', user.id);
                recordsQuery = recordsQuery.eq('patient_id', user.id);
            }

            const promises: Promise<any>[] = [
                fetchAll(patientsQuery),
                fetchAll(recordsQuery),
            ];

            // If Admin, fetch organizations
            if (user.role === 'platform_admin') {
                promises.push(
                    fetchAll(supabase.from('organizations').select('*').order('created_at', { ascending: false }))
                );
            }

            const results = await Promise.all(promises);
            const patientsRes = results[0];
            const recordsRes = results[1];
            const orgsRes = user.role === 'platform_admin' ? results[2] : null;

            // Always overwrite state with Supabase result (even if empty)
            if (patientsRes) {
                setPatients(patientsRes);
            }
            if (recordsRes) {
                setRecords(recordsRes);
            }
            if (orgsRes) {
                setOrganizations(orgsRes);
            }
        } catch (err) {
            console.error('Error fetching data from Supabase:', err);
        } finally {
            setLoading(false);
        }
    }, [user?.id, user?.role, user?.organization_id]);

    // Fetch data once when user identity stabilizes, prevent re-fetch loops
    useEffect(() => {
        const key = `${user?.id}-${user?.role}-${user?.organization_id}`;
        if (key !== lastFetchKey.current) {
            lastFetchKey.current = key;
            fetchData();
        }
    }, [fetchData]);

    // ─── Add Patient ──────────────────────────────────────
    const addPatient = async (patientData: Omit<Patient, 'id' | 'created_at' | 'updated_at'>): Promise<Patient> => {
        const newPatient: Patient = {
            ...patientData,
            id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
            patient_id: patientData.patient_id || generatePatientId(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };

        if (isSupabaseConfigured() && user && !isDemoUser(user.id)) {
            try {
                const { data, error } = await supabase
                    .from('patients')
                    .insert({
                        patient_id: newPatient.patient_id,
                        full_name: newPatient.full_name,
                        phone: newPatient.phone,
                        email: newPatient.email || null,
                        gender: newPatient.gender,
                        date_of_birth: newPatient.date_of_birth,
                        blood_type: newPatient.blood_type || null,
                        allergies: newPatient.allergies || null,
                        emergency_contact: newPatient.emergency_contact || null,
                        address: newPatient.address || null,
                        city: newPatient.city,
                        state: newPatient.state,
                        country: newPatient.country,
                        pincode: newPatient.pincode,
                        latitude: newPatient.latitude || null,
                        longitude: newPatient.longitude || null,
                        ward_name: newPatient.ward_name || null,
                        auth_user_id: newPatient.auth_user_id || null,
                        organization_id: newPatient.organization_id || null, // Now nullable
                        created_by: newPatient.created_by,
                    })
                    .select()
                    .single();

                if (error) {
                    console.error('Supabase insert error:', error);
                    throw new Error(error.message || "Failed to save patient to database");
                } else if (data) {
                    const supaPatient = data as Patient;
                    setPatients(prev => [supaPatient, ...prev]);
                    return supaPatient;
                }
            } catch (err) {
                console.error('Supabase insert failed:', err);
                throw err;
            }
        }

        // Local state update (demo mode or Supabase fallback)
        setPatients(prev => [newPatient, ...prev]);
        return newPatient;
    };

    // ─── Add Record ───────────────────────────────────────
    const addRecord = async (recordData: Omit<MedicalRecord, 'id' | 'created_at' | 'updated_at'>): Promise<MedicalRecord> => {
        const newRecord: MedicalRecord = {
            ...recordData,
            id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };

        if (isSupabaseConfigured() && user && !isDemoUser(user.id)) {
            try {
                const { data, error } = await supabase
                    .from('medical_records')
                    .insert({
                        patient_id: newRecord.patient_id,
                        record_type: newRecord.record_type,
                        title: newRecord.title,
                        description: newRecord.description || null,
                        diagnosis: newRecord.diagnosis || null,
                        icd_code: newRecord.icd_code || null,
                        icd_label: newRecord.icd_label || null,
                        attachment_url: newRecord.attachment_url || null,
                        attachment_name: newRecord.attachment_name || null,
                        created_by: newRecord.created_by,
                        creator_name: newRecord.creator_name,
                        organization_id: newRecord.organization_id,
                    })
                    .select()
                    .single();

                if (error) {
                    console.error('Supabase insert error:', error);
                    throw new Error(error.message || "Failed to save record");
                } else if (data) {
                    const supaRecord = data as MedicalRecord;
                    setRecords(prev => [supaRecord, ...prev]);
                    return supaRecord;
                }
            } catch (err) {
                console.error('Supabase insert failed:', err);
                throw err;
            }
        }

        setRecords(prev => [newRecord, ...prev]);
        return newRecord;
    };

    // ─── Update Organization Status ───────────────────────
    const updateOrganizationStatus = async (id: string, status: 'approved' | 'rejected') => {
        // Optimistic update
        setOrganizations(prev => prev.map(org => org.id === id ? { ...org, status } : org));

        if (isSupabaseConfigured() && user && !isDemoUser(user.id)) {
            const { error } = await supabase
                .from('organizations')
                .update({ status })
                .eq('id', id);

            if (error) {
                console.error("Failed to update org status:", error);
                // Revert on error (fetching fresh data would be safer but let's just warn for now)
                // In a production app, we'd revert the optimistic update here.
                fetchData();
            }
        }
    };

    // ─── Lookups ──────────────────────────────────────────
    const getPatient = useCallback((id: string) => patients.find(p => p.id === id), [patients]);
    const getPatientByPatientId = useCallback((patientId: string) => patients.find(p => p.patient_id === patientId), [patients]);
    const getRecord = useCallback((id: string) => records.find(r => r.id === id), [records]);
    const getRecordsForPatient = useCallback((patientId: string) => records.filter(r => r.patient_id === patientId), [records]);

    const value = useMemo(() => ({
        patients, addPatient, getPatient, getPatientByPatientId,
        records, addRecord, getRecord, getRecordsForPatient,
        organizations, staff, loading, refresh: fetchData,
        updateOrganizationStatus
    }), [
        patients, records, organizations, staff, loading, fetchData,
        getPatient, getPatientByPatientId, getRecord, getRecordsForPatient
    ]);

    return (
        <DataContext.Provider value={value}>
            {children}
        </DataContext.Provider>
    );
};

export const useData = (): DataContextType => {
    const context = useContext(DataContext);
    if (!context) throw new Error('useData must be used within DataProvider');
    return context;
};
