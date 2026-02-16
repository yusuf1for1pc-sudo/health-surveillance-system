import type { DiagnosisSuggestion } from '@/lib/types';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

const SYSTEM_PROMPT = `You are a medical diagnosis assistant. Given a description of symptoms or a clinical note, suggest:
1. A structured diagnosis statement
2. The most appropriate ICD-10 code
3. The ICD-10 code label
4. A confidence level (0-1)
5. Brief reasoning

Respond ONLY with valid JSON in this exact format:
{
  "diagnosis": "structured diagnosis text",
  "icd_code": "ICD-10 code",
  "icd_label": "ICD-10 label",
  "confidence": 0.85,
  "reasoning": "brief explanation"
}

Do not include any text outside the JSON object.`;

// ─── Mock fallback when no API key ───────────────────────
const mockSuggestions: Record<string, DiagnosisSuggestion> = {
    default: {
        diagnosis: 'Upper respiratory tract infection with acute pharyngitis',
        icd_code: 'J06',
        icd_label: 'Acute upper respiratory infections',
        confidence: 0.82,
        reasoning: 'Symptoms consistent with viral upper respiratory infection based on reported sore throat, nasal congestion, and mild fever.',
    },
    fever: {
        diagnosis: 'Fever of unknown origin, requires investigation',
        icd_code: 'R50',
        icd_label: 'Fever of other and unknown origin',
        confidence: 0.75,
        reasoning: 'Elevated temperature without clear localizing signs suggests need for further workup.',
    },
    cough: {
        diagnosis: 'Acute bronchitis',
        icd_code: 'J20',
        icd_label: 'Acute bronchitis',
        confidence: 0.78,
        reasoning: 'Persistent cough with possible chest discomfort suggests acute bronchitis.',
    },
    diabetes: {
        diagnosis: 'Type 2 diabetes mellitus',
        icd_code: 'E11',
        icd_label: 'Type 2 diabetes mellitus',
        confidence: 0.90,
        reasoning: 'Elevated blood glucose levels, polyuria, and polydipsia in adult patient consistent with type 2 diabetes.',
    },
    headache: {
        diagnosis: 'Migraine without aura',
        icd_code: 'G43',
        icd_label: 'Migraine',
        confidence: 0.72,
        reasoning: 'Recurrent unilateral headache with nausea and photosensitivity consistent with migraine presentation.',
    },
};

const getMockSuggestion = (text: string): DiagnosisSuggestion => {
    const lower = text.toLowerCase();
    for (const [key, suggestion] of Object.entries(mockSuggestions)) {
        if (key !== 'default' && lower.includes(key)) return suggestion;
    }
    return mockSuggestions.default;
};

// ─── Gemini API call ─────────────────────────────────────
export const suggestDiagnosis = async (clinicalText: string): Promise<DiagnosisSuggestion> => {
    if (!GEMINI_API_KEY) {
        // Simulate network delay for demo
        await new Promise(resolve => setTimeout(resolve, 1500));
        return getMockSuggestion(clinicalText);
    }

    try {
        const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [
                            { text: `${SYSTEM_PROMPT}\n\nClinical input:\n${clinicalText}` }
                        ],
                    },
                ],
                generationConfig: {
                    temperature: 0.3,
                    maxOutputTokens: 256,
                },
            }),
        });

        if (!response.ok) {
            throw new Error(`Gemini API error: ${response.status}`);
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!text) throw new Error('No response from Gemini');

        // Extract JSON from response (handle markdown code blocks)
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error('No JSON in Gemini response');

        const parsed = JSON.parse(jsonMatch[0]) as DiagnosisSuggestion;
        return parsed;
    } catch (error) {
        console.error('Gemini API error, falling back to mock:', error);
        return getMockSuggestion(clinicalText);
    }
};

export const isGeminiConfigured = (): boolean => !!GEMINI_API_KEY;
