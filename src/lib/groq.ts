const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

export const isGroqConfigured = () => !!GROQ_API_KEY;

const fileToBase64 = async (file: File): Promise<string> => {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve((reader.result as string).split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const extractLabDataFromImage = async (file: File, schema: any) => {
  if (!GROQ_API_KEY) throw new Error("GROQ_API_KEY is missing from your .env file!");
  
  const base64Data = await fileToBase64(file);
  
  const prompt = `You are a medical OCR engine. Extract lab results from this image into JSON.
Match this exact schema: ${JSON.stringify(schema)}

Return ONLY valid JSON with this exact shape:
{
  "patient_name": "Full name of patient found on report",
  "test_name": "General name of the test (e.g. Complete Blood Count)",
  "panels": [
    {
      "panelId": "cbc",
      "values": {
        "wbc": { "value": "7.5" }
      }
    }
  ],
  "rawText": "Raw extracted OCR text here.",
  "analysis": "Provide a 2-3 sentence clinical analysis of these results. Mention if any values are critically out of range and what they might indicate. Be concise and professional."
}`;

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: `data:${file.type};base64,${base64Data}` } }
          ]
        }
      ],
      temperature: 0.1,
      response_format: { type: "json_object" }
    })
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(`Groq API Error: ${err.error?.message || response.status}`);
  }

  const data = await response.json();
  const text = data.choices[0].message.content;

  try {
    return JSON.parse(text);
  } catch (err) {
    console.error("Failed to parse Groq JSON:", text);
    return { panels: [], rawText: text };
  }
};
