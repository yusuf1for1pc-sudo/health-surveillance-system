import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { mockPatients as initialMockPatients, mockRecords as initialMockRecords, mockOrganizations, mockStaff } from '@/lib/mockData';
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
    const [patients, setPatients] = useState<Patient[]>(initialMockPatients);
    const [records, setRecords] = useState<MedicalRecord[]>(initialMockRecords);
    const [organizations] = useState<Organization[]>(mockOrganizations);
    const [staff] = useState<User[]>(mockStaff);
    const [loading, setLoading] = useState(false);

    // ─── Fetch from Supabase if real auth user ────────────────
    const fetchData = useCallback(async () => {
        if (!isSupabaseConfigured() || !user || isDemoUser(user.id)) return;

        setLoading(true);
        try {
            const [patientsRes, recordsRes] = await Promise.all([
                supabase.from('patients').select('*').order('created_at', { ascending: false }),
                supabase.from('medical_records').select('*').order('created_at', { ascending: false }),
            ]);

            if (patientsRes.data && patientsRes.data.length > 0) {
                setPatients(patientsRes.data);
            }
            if (recordsRes.data && recordsRes.data.length > 0) {
                setRecords(recordsRes.data);
            }
        } catch (err) {
            console.error('Error fetching data from Supabase:', err);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchData();
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
                } else if (data) {
                    const supaRecord = data as MedicalRecord;
                    setRecords(prev => [supaRecord, ...prev]);
                    return supaRecord;
                }
            } catch (err) {
                console.error('Supabase insert failed:', err);
            }
        }

        setRecords(prev => [newRecord, ...prev]);
        return newRecord;
    };

    // ─── Lookups ──────────────────────────────────────────
    const getPatient = (id: string) => patients.find(p => p.id === id);
    const getPatientByPatientId = (patientId: string) => patients.find(p => p.patient_id === patientId);
    const getRecord = (id: string) => records.find(r => r.id === id);
    const getRecordsForPatient = (patientId: string) => records.filter(r => r.patient_id === patientId);

    return (
        <DataContext.Provider value={{
            patients, addPatient, getPatient, getPatientByPatientId,
            records, addRecord, getRecord, getRecordsForPatient,
            organizations, staff, loading, refresh: fetchData,
        }}>
            {children}
        </DataContext.Provider>
    );
};

export const useData = (): DataContextType => {
    const context = useContext(DataContext);
    if (!context) throw new Error('useData must be used within DataProvider');
    return context;
};
