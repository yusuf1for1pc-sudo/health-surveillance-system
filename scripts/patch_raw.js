import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

try {
    const supabaseUrl = 'https://jkhkgviyxkmuayenohhd.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpraGtndml5eGttdWF5ZW5vaGhkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTA1NjY5NCwiZXhwIjoyMDg2NjMyNjk0fQ.2yo4L9ts4PPp4G6EWC5nwazY7-qm7Ql58OFqbn3gJKg';
    if (!supabaseUrl || !supabaseKey) { throw new Error("Missing env vars"); }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    async function patch() {
        console.log("Connected...");
        const { data, error } = await supabase.from('medical_records').select('id').ilike('title', '%syndromic%');
        if (error) throw error;
        console.log("Found", data?.length, "syndromic cases to delete.");
        
        if (data && data.length > 0) {
            await supabase.from('medical_records').delete().in('id', data.map(d=>d.id));
        }
        
        const { data: nPts, error: pErr } = await supabase.from('patients').select('*').or('ward_name.eq.Nerul,city.eq.Navi Mumbai');
        if (pErr) throw pErr;
        
        const now = new Date();
        const sus = nPts.filter(p => {
            if (!p.date_of_birth) return true;
            const age = now.getFullYear() - new Date(p.date_of_birth).getFullYear();
            return (age >= 5 && age <= 15) || (age >= 20 && age <= 45);
        });
        
        const pool = sus.length > 0 ? sus : nPts;
        if (!pool.length) throw new Error("No patients found in Nerul");
        
        const recs = [];
        for(let i=0; i<15; i++) {
            const p = pool[Math.floor(Math.random() * pool.length)];
            recs.push({
                id: randomUUID(),
                patient_id: p.id,
                record_type: 'Clinical Note',
                title: 'Initial Evaluation (Syndromic)',
                description: `Patient presents with acute high-grade fever (103°F), severe frontal headache, prominent retro-orbital pain (pain behind the eyes), and intense myalgia/arthralgia ('breakbone fever'). Mild petechial rash appearing on extremities. Suspected Dengue Fever; pending NS1 antigen and IgG/IgM lab confirmation.`,
                diagnosis: null,
                icd_code: null,
                icd_label: null,
                created_by: p.created_by || 'a43f5996-e4bd-4147-b016-113cf95e9f77',
                creator_name: 'Dr. Asha Pawar',
                organization_id: p.organization_id || '057935f0-817b-4c40-862c-7b44ecfb1eaf',
                status: 'ACTIVE',
                created_at: new Date(2026, 2, Math.floor(Math.random() * 4) + 7).toISOString()
            });
        }
        
        const { error: insErr } = await supabase.from('medical_records').insert(recs);
        if (insErr) throw insErr;
        console.log("Successfully injected 15 cases.");
    }
    
    patch().catch(e => {
        console.log("CAUGHT ASYNC ERROR:", JSON.stringify(e, null, 2), e.message, e.stack);
    });
} catch(e) {
    console.log("CAUGHT SYNC ERROR:", e.message, e.stack);
}
