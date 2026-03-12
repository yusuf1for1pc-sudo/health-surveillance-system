const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log("Checking for syndromic records...");
    const { data, error } = await supabase.from('medical_records').select('id, title, diagnosis, icd_code, status, created_at, patient_id').ilike('title', '%syndromic%');
    if (error) {
        console.error("Error fetching records:", error);
    } else {
        console.log(`Found ${data.length} syndromic records.`);
        if (data.length > 0) {
            console.log(data.slice(0, 3));
            
            // let's check patients to see if they match nerul
            const pIds = data.map(d => d.patient_id);
            const { data: pData } = await supabase.from('patients').select('id, city, ward_name').in('id', pIds);
            console.log("Patients matched:", pData?.length);
            if (pData?.length > 0) {
                console.log(pData.slice(0, 3));
            }
        }
    }
}
check();
