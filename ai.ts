import { GoogleGenAI, Type } from "@google/genai";

let aiClient: GoogleGenAI | null = null;
let missingApiKeyWarned = false;

function getApiKey(): string {
  const fromVite =
    typeof import.meta !== "undefined" &&
    import.meta.env &&
    typeof import.meta.env.VITE_GEMINI_API_KEY === "string"
      ? import.meta.env.VITE_GEMINI_API_KEY
      : "";
  const fromProcess =
    typeof process !== "undefined"
      ? process.env.API_KEY || process.env.GEMINI_API_KEY || ""
      : "";
  return (fromVite || fromProcess || "").trim();
}

function getAIClient(): GoogleGenAI | null {
  if (aiClient) return aiClient;

  const apiKey = getApiKey();
  if (!apiKey) {
    if (!missingApiKeyWarned) {
      console.warn("GEMINI_API_KEY is missing. AI features are disabled.");
      missingApiKeyWarned = true;
    }
    return null;
  }

  aiClient = new GoogleGenAI({ apiKey });
  return aiClient;
}

export async function getJournalInsights(note: string, consistency: number, output: number) {
  if (!note && consistency === 5 && output === 5) return "Please write some notes or adjust your scores first!";

  const ai = getAIClient();
  if (!ai) {
    return "⚠️ AI Assistant unavailable. Configure GEMINI_API_KEY in Vercel environment variables.";
  }
  
  try {
    // Using gemini-3-flash-preview because it has much higher rate limits on the free tier (15 RPM)
    // compared to Pro (2 RPM), ensuring the app doesn't crash if you click buttons quickly.
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `
        Act as a high-performance productivity coach (LifeOS). Analyze this daily record:
        Consistency Score: ${consistency}/10
        Output Score: ${output}/10
        User Notes: "${note || 'No notes provided.'}"

        Provide a structured response with 3 distinct sections using Markdown:
        ### 🔍 Observation
        (1-2 sentences insight into their patterns or mindset)

        ### 💡 Tactical Advice
        (One specific, actionable thing to do differently)

        ### 🎯 Tomorrow's Focus
        (A short mantra or focus area)

        Keep it concise, encouraging, but stoic and sharp.
      `,
    });
    return response.text;
  } catch (e) {
    console.error("AI Error:", e);
    return "⚠️ AI Assistant unavailable. Please check your API key configuration.";
  }
}

export async function breakDownTask(task: string): Promise<string[]> {
  const ai = getAIClient();
  if (!ai) return [task];

  try {
    // Using gemini-3-flash-preview for speed and reliability
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Break down the task "${task}" into 3-5 smaller, concrete, actionable steps that can be done in <30 mins each.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });
    
    const text = response.text;
    if (!text) return [task];
    return JSON.parse(text);
  } catch (e) {
    console.error("AI Error:", e);
    return [task]; 
  }
}

export async function generateVisionImage(goal: string): Promise<string | null> {
  const ai = getAIClient();
  if (!ai) return null;

  try {
    // gemini-2.5-flash-image is the most reliable image model on the free tier.
    // Pro image models often return 403 Forbidden without billing enabled.
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            text: `A futuristic, high-tech, cinematic visualization of this goal being achieved: "${goal}". 
                   Style: Cyberpunk, Neon, Solarpunk, Highly detailed, Inspirational, 4k. 
                   No text in the image.`
          }
        ]
      },
      config: {
        imageConfig: {
          aspectRatio: "16:9"
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (e) {
    console.error("Image Gen Error:", e);
    return null;
  }
}
