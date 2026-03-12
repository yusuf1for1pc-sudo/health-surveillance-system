import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY; // USE SERVICE ROLE TO BYPASS RLS
if (!supabaseUrl || !supabaseKey) { throw new Error("Missing Supabase env vars"); }
const supabase = createClient(supabaseUrl, supabaseKey);

async function patchSyndromicData() {
    console.log("Connected as Service Role.");
    
    // 1. Delete old Syndromic Leptospirosis data
    const { data: oldCases, error: delCheckErr } = await supabase
        .from('medical_records')
        .select('id')
        .ilike('title', '%syndromic%');
    
    if (delCheckErr) { console.error("Error fetching old cases:", delCheckErr); return; }
    
    if (oldCases && oldCases.length > 0) {
        const idsToDelete = oldCases.map(c => c.id);
        const { error: delErr } = await supabase.from('medical_records').delete().in('id', idsToDelete);
        if (delErr) { console.error("Error deleting old cases:", delErr); return; }
        console.log(`Deleted ${idsToDelete.length} old syndromic records.`);
    } else {
        console.log("No old syndromic cases found to delete.");
    }

    // 2. Fetch Navi Mumbai / Nerul patients
    const { data: nerulPatients, error: pError } = await supabase
        .from('patients')
        .select('*')
        .or('ward_name.eq.Nerul,city.eq.Navi Mumbai');
        
    if (pError || !nerulPatients || nerulPatients.length === 0) {
        console.error("Failed to find Nerul/Navi Mumbai patients for syndromic seeding.", pError); return;
    }
    
    // 3. Filter by Age (5-15 or 20-45)
    const now = new Date();
    const susceptiblePts = nerulPatients.filter(p => {
        if (!p.date_of_birth) return true;
        const dob = new Date(p.date_of_birth);
        const age = now.getFullYear() - dob.getFullYear();
        return (age >= 5 && age <= 15) || (age >= 20 && age <= 45);
    });
    
    const ptsPool = susceptiblePts.length > 0 ? susceptiblePts : nerulPatients;
    console.log(`Found ${ptsPool.length} targetable susceptible patients.`);
    
    // 4. Generate 15 Records
    const newRecords = [];
    const defaultOrgId = '057935f0-817b-4c40-862c-7b44ecfb1eaf'; // Default org fallback
    const defaultStaffId = 'a43f5996-e4bd-4147-b016-113cf95e9f77'; // Dr. Asha Pawar fallback
    
    for (let i = 0; i < 15; i++) {
        const p = ptsPool[Math.floor(Math.random() * ptsPool.length)];
        const date = new Date(2026, 2, Math.floor(Math.random() * 4) + 7); // Mar 7 - Mar 10
        newRecords.push({
            id: randomUUID(),
            patient_id: p.id,
            record_type: 'Clinical Note',
            title: 'Initial Evaluation (Syndromic)',
            description: `Patient presents with acute high-grade fever (103°F), severe frontal headache, prominent retro-orbital pain (pain behind the eyes), and intense myalgia/arthralgia ('breakbone fever'). Mild petechial rash appearing on extremities. Suspected Dengue Fever; pending NS1 antigen and IgG/IgM lab confirmation.`,
            diagnosis: null,
            icd_code: null,
            icd_label: null,
            created_by: p.created_by || defaultStaffId,
            creator_name: 'Dr. Asha Pawar', // Assuming generic placeholder
            organization_id: p.organization_id || defaultOrgId,
            status: 'ACTIVE',
            created_at: date.toISOString()
        });
    }

    // 5. Insert Records
    const { error: insErr } = await supabase.from('medical_records').insert(newRecords);
    if (insErr) { console.error("Error inserting new records:", insErr); return; }
    
    console.log(`Successfully injected 15 Syndromic Dengue Cases into Navi Mumbai (Nerul)!!!`);
}

patchSyndromicData().catch(e => console.error("Uncaught FATAL:", e));
