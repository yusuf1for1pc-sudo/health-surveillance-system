import { Patient, MedicalRecord } from './types';
import { SYMPTOM_DISEASE_MAP, DISEASE_LAB_TEST_MAP, VITAL_THRESHOLDS } from '../data/cdssData';

export interface CDSSInsights {
  possibleDiagnoses: string[];
  recommendedTests: string[];
  warnings: string[];
}

export const analyzePatient = (patient: Patient | null, records: MedicalRecord[]): CDSSInsights => {
  if (!patient || !records || records.length === 0) {
    return { possibleDiagnoses: [], recommendedTests: [], warnings: [] };
  }

  const possibleDiagnosesSet = new Set<string>();
  const recommendedTestsSet = new Set<string>();
  const warningsSet = new Set<string>();

  // 1 & 2. Analyze Symptoms to Diagnoses and Tests
  const allSymptoms = new Set<string>();
  records.forEach(record => {
    // Extract symptoms from description if available
    if (record.description) {
      const desc = record.description.toLowerCase();
      // Simple heuristic: just check if the description contains symptoms
      Object.keys(SYMPTOM_DISEASE_MAP).forEach(symptom => {
        if (desc.includes(symptom)) {
          allSymptoms.add(symptom);
        }
      });
    }
  });

  // Find matching diagnoses based on symptoms
  allSymptoms.forEach(symptom => {
    // Exact or partial matching
    Object.keys(SYMPTOM_DISEASE_MAP).forEach(key => {
        if (symptom.includes(key) || key.includes(symptom)) {
            SYMPTOM_DISEASE_MAP[key].forEach(disease => {
                possibleDiagnosesSet.add(disease);
            });
            // check if tests exist for symptom directly
            if (DISEASE_LAB_TEST_MAP[key]) {
                 DISEASE_LAB_TEST_MAP[key].forEach(test => recommendedTestsSet.add(test));
            }
        }
    });
  });

  // Find matching tests based on possible diagnoses
  possibleDiagnosesSet.forEach(disease => {
     Object.keys(DISEASE_LAB_TEST_MAP).forEach(key => {
         if (disease.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(disease.toLowerCase())) {
             DISEASE_LAB_TEST_MAP[key].forEach(test => recommendedTestsSet.add(test));
         }
     });
  });


  // 3. Early Warning Scoring (Check Vitals)
  // For demo purposes, we will extract vitals from the patient's records if they are formatted nicely,
  // or we can simulate it if there are specific keywords.
  records.forEach(record => {
    if (record.description) {
      const desc = record.description.toLowerCase();
      
      // Simulate finding high blood pressure
      if (desc.includes("bp: 150/") || desc.includes("blood pressure: 150/") || desc.includes("hypertension")) {
          warningsSet.add(`High Risk: Elevated Systolic BP (Simulated > 140 mmHg)`);
      }

      // Simulate finding high heart rate
      if (desc.includes("hr: 110") || desc.includes("heart rate: 110") || desc.includes("tachycardia")) {
          warningsSet.add(`High Risk: Tachycardia (Simulated > 100 bpm)`);
      }

      // Simulate finding fever
      if (desc.includes("fever") || desc.includes("temp: 101") || desc.includes("temperature: 101")) {
          warningsSet.add(`High Risk: Fever (Simulated > 100.4 °F)`);
      }

      // Simulate finding low spo2
      if (desc.includes("spo2: 92") || desc.includes("hypoxia")) {
          warningsSet.add(`High Risk: Low Oxygen saturation (Simulated < 95%)`);
      }
    }
  });

  return {
    possibleDiagnoses: Array.from(possibleDiagnosesSet),
    recommendedTests: Array.from(recommendedTestsSet),
    warnings: Array.from(warningsSet)
  };
};
