import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { randomUUID } from 'crypto';

dotenv.config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const monthlyDistribution = [
    { year: 2025, month: 3, TB: 32, Typhoid: 18, Malaria: 24, Dengue: 19, Gastro: 28, Chikungunya: 4, Leptospirosis: 6 },
    { year: 2025, month: 4, TB: 31, Typhoid: 22, Malaria: 31, Dengue: 22, Gastro: 31, Chikungunya: 3, Leptospirosis: 5 },
    { year: 2025, month: 5, TB: 33, Typhoid: 28, Malaria: 45, Dengue: 29, Gastro: 35, Chikungunya: 5, Leptospirosis: 7 },
    { year: 2025, month: 6, TB: 34, Typhoid: 52, Malaria: 89, Dengue: 67, Gastro: 58, Chikungunya: 9, Leptospirosis: 18 },
    { year: 2025, month: 7, TB: 33, Typhoid: 78, Malaria: 134, Dengue: 145, Gastro: 74, Chikungunya: 14, Leptospirosis: 38 },
    { year: 2025, month: 8, TB: 35, Typhoid: 91, Malaria: 156, Dengue: 189, Gastro: 81, Chikungunya: 19, Leptospirosis: 52 },
    { year: 2025, month: 9, TB: 32, Typhoid: 89, Malaria: 145, Dengue: 178, Gastro: 67, Chikungunya: 21, Leptospirosis: 44 },
    { year: 2025, month: 10, TB: 34, Typhoid: 76, Malaria: 98, Dengue: 134, Gastro: 58, Chikungunya: 18, Leptospirosis: 28 },
    { year: 2025, month: 11, TB: 31, Typhoid: 52, Malaria: 64, Dengue: 89, Gastro: 44, Chikungunya: 14, Leptospirosis: 16 },
    { year: 2025, month: 12, TB: 33, Typhoid: 38, Malaria: 41, Dengue: 52, Gastro: 38, Chikungunya: 11, Leptospirosis: 11 },
    { year: 2026, month: 1, TB: 35, Typhoid: 29, Malaria: 32, Dengue: 31, Gastro: 35, Chikungunya: 8, Leptospirosis: 8 },
    { year: 2026, month: 2, TB: 32, Typhoid: 24, Malaria: 28, Dengue: 24, Gastro: 31, Chikungunya: 9, Leptospirosis: 19 },
    { year: 2026, month: 3, TB: 34, Typhoid: 21, Malaria: 31, Dengue: 22, Gastro: 33, Chikungunya: 11, Leptospirosis: 87 }
];

const icdMap: Record<string, string> = {
    'TB': 'A15.9',
    'Typhoid': 'A01.0',
    'Malaria': 'B54',
    'Gastro': 'A09',
    'Dengue': 'A90',
    'Chikungunya': 'A92.0',
    'Leptospirosis': 'A27.9'
};

const fullDiseaseNames: Record<string, string> = {
    'TB': 'Tuberculosis',
    'Typhoid': 'Typhoid',
    'Malaria': 'Malaria',
    'Gastro': 'Gastroenteritis',
    'Dengue': 'Dengue',
    'Chikungunya': 'Chikungunya',
    'Leptospirosis': 'Leptospirosis'
};

const getDaysInMonth = (year: number, month: number) => new Date(year, month, 0).getDate();

function getStatus(disease: string, date: Date) {
    if (disease === 'TB') return 'ACTIVE';

    const feb1 = new Date(2026, 1, 1); // Month is 0-indexed, so 1 = Feb
    if (date < feb1) return 'RECOVERED';

    if (date.getFullYear() === 2026 && date.getMonth() === 1) { // Feb 2026
        return date.getDate() >= 22 ? 'ACTIVE' : 'RECOVERED';
    }

    // Mar 2026
    return 'ACTIVE';
}

function getLeptospirosisWard(patients: any[], patientMapByWard: Record<string, any[]>) {
    const rnd = Math.random();
    let ward = 'Wadala';
    if (rnd > 0.6 && rnd <= 0.85) ward = 'Sewri';
    else if (rnd > 0.85) ward = 'Antop Hill';

    const pts = patientMapByWard[ward];
    if (pts && pts.length > 0) {
        return pts[Math.floor(Math.random() * pts.length)];
    }
    return patients[Math.floor(Math.random() * patients.length)];
}

async function generateAndSeed() {
    console.log('Fetching existing patients and reference data...');
    const { data: patients, error: pError } = await supabase.from('patients').select('id, ward_name, city, created_by, organization_id');
    if (pError || !patients) { console.error('Error fetching patients:', pError); return; }

    const defaultOrg = { id: '057935f0-817b-4c40-862c-7b44ecfb1eaf' };
    const defaultStaff = { id: 'a43f5996-e4bd-4147-b016-113cf95e9f77', full_name: 'Dr. Asha Pawar' };

    const patientMapByWard: Record<string, typeof patients> = {};
    patients.forEach(p => {
        const w = p.ward_name || 'Unknown';
        if (!patientMapByWard[w]) patientMapByWard[w] = [];
        patientMapByWard[w].push(p);
    });

    const newRecords: any[] = [];
    const diseasesList = ['TB', 'Typhoid', 'Malaria', 'Dengue', 'Gastro', 'Chikungunya', 'Leptospirosis'];

    for (const data of monthlyDistribution) {
        const year = data.year;
        const month = data.month;
        const daysInMonth = getDaysInMonth(year, month);

        const isMar2026 = year === 2026 && month === 3;
        const maxDay = isMar2026 ? 10 : daysInMonth;

        for (const d of diseasesList) {
            let count = (data as any)[d];
            for (let i = 0; i < count; i++) {
                let day = Math.floor(Math.random() * maxDay) + 1;

                if (isMar2026 && d === 'Leptospirosis') {
                    if (i < 8) day = Math.floor(Math.random() * 2) + 1; // 1-2
                    else if (i < 20) day = Math.floor(Math.random() * 2) + 3; // 3-4
                    else if (i < 34) day = Math.floor(Math.random() * 2) + 5; // 5-6
                    else if (i < 50) day = Math.floor(Math.random() * 2) + 7; // 7-8
                    else day = Math.floor(Math.random() * 2) + 9; // 9-10
                }

                const hour = Math.floor(Math.random() * 24);
                const min = Math.floor(Math.random() * 60);
                const recordDate = new Date(year, month - 1, day, hour, min);

                let selectedPatient;
                if (d === 'Leptospirosis') {
                    selectedPatient = getLeptospirosisWard(patients, patientMapByWard);
                } else {
                    selectedPatient = patients[Math.floor(Math.random() * patients.length)];
                }

                const diseaseName = fullDiseaseNames[d];
                const status = getStatus(d, recordDate);

                newRecords.push({
                    id: randomUUID(),
                    patient_id: selectedPatient.id,
                    record_type: 'Lab Report',
                    title: `Lab Results for ${diseaseName}`,
                    description: `Routine laboratory confirmation of ${diseaseName}.`,
                    diagnosis: diseaseName,
                    icd_code: icdMap[d] || 'A00.0',
                    icd_label: diseaseName,
                    created_by: selectedPatient.created_by || defaultStaff.id,
                    creator_name: defaultStaff.full_name,
                    organization_id: selectedPatient.organization_id || defaultOrg.id,
                    status: status,
                    created_at: recordDate.toISOString()
                });
            }
        }
    }

    const syndromicCount = 20;
    for (let i = 0; i < syndromicCount; i++) {
        const pts = patientMapByWard['Wadala'] || patients;
        if (!pts || pts.length === 0) continue;
        const p = pts[Math.floor(Math.random() * pts.length)];
        const date = new Date(2026, 2, Math.floor(Math.random() * 4) + 7); // Mar 7 to Mar 10
        newRecords.push({
            id: randomUUID(),
            patient_id: p.id,
            record_type: 'Clinical Note',
            title: 'Initial Evaluation (Syndromic)',
            description: `Patient complains of sudden high fever, red eyes, and muscle aches (suspected leptospirosis). Pending lab confirmation.`,
            diagnosis: null,
            icd_code: null,
            icd_label: null,
            created_by: p.created_by || defaultStaff.id,
            creator_name: defaultStaff.full_name,
            organization_id: p.organization_id || defaultOrg.id,
            status: 'ACTIVE',
            created_at: date.toISOString()
        });
    }

    console.log(`Generated ${newRecords.length} realistic medical records.`);
    console.log('Inserting new deterministic medical records in batches...');

    for (let i = newRecords.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newRecords[i], newRecords[j]] = [newRecords[j], newRecords[i]];
    }

    const batchSize = 1000;
    for (let i = 0; i < newRecords.length; i += batchSize) {
        const batch = newRecords.slice(i, i + batchSize);
        const { error: iError } = await supabase.from('medical_records').insert(batch);
        if (iError) {
            console.error(`Error inserting batch ${i / batchSize + 1}:`, iError);
            return;
        }
        console.log(`Inserted batch ${i / batchSize + 1}/${Math.ceil(newRecords.length / batchSize)}`);
    }

    console.log('Successfully completed tempest dataset migration!');
}

generateAndSeed();
