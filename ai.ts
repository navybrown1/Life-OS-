import { GoogleGenAI, Type } from "@google/genai";

let aiClient: GoogleGenAI | null = null;
let missingApiKeyWarned = false;
const TEXT_MODEL_PRIMARY = "gemini-2.5-flash-lite";
const TEXT_MODEL_FALLBACK = "gemini-2.5-flash-lite";
const IMAGE_MODEL_PRIMARY = "gemini-2.5-flash-image-preview";
const IMAGE_MODEL_FALLBACK = "gemini-2.5-flash-image";

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

function normalizeJournalInsight(text: string): string {
  return text
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/^\s*[-*]\s+/gm, "")
    .trim();
}

function explainImageError(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error);
  const lowered = raw.toLowerCase();

  if (
    lowered.includes("quota") ||
    lowered.includes("resource_exhausted") ||
    lowered.includes("429")
  ) {
    return "Image generation quota is exhausted for this API key. Wait for quota reset or enable billing.";
  }

  if (lowered.includes("permission") || lowered.includes("403")) {
    return "Image model access is blocked for this API key. Verify Gemini image-model access and billing.";
  }

  return "Image generation failed right now. Please try again.";
}

function summarizeError(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error);
  return raw.replace(/\s+/g, " ").slice(0, 220);
}

export async function getJournalInsights(note: string, consistency: number, output: number) {
  if (!note && consistency === 5 && output === 5) return "Please write some notes or adjust your scores first!";

  const ai = getAIClient();
  if (!ai) {
    return "⚠️ AI Assistant unavailable. Configure GEMINI_API_KEY in Vercel environment variables.";
  }
  
  try {
    const response = await ai.models.generateContent({
      model: TEXT_MODEL_PRIMARY,
      contents: `
        Act as a high-performance productivity coach (LifeOS). Analyze this daily record:
        Consistency Score: ${consistency}/10
        Output Score: ${output}/10
        User Notes: "${note || 'No notes provided.'}"

        Return plain text only (no markdown, no hashtags, no bullet symbols) in exactly this format:
        Observation: <1-2 sentences insight>
        Tactical Advice: <one concrete action>
        Tomorrow's Focus: <short mantra>

        Keep it concise, encouraging, but stoic and sharp.
      `,
    });
    return normalizeJournalInsight(response.text || "");
  } catch (e) {
    console.error(`AI Error (${TEXT_MODEL_PRIMARY}):`, e);
    try {
      const fallback = await ai.models.generateContent({
        model: TEXT_MODEL_FALLBACK,
        contents: `
          Act as a high-performance productivity coach (LifeOS). Analyze this daily record:
          Consistency Score: ${consistency}/10
          Output Score: ${output}/10
          User Notes: "${note || 'No notes provided.'}"

          Return plain text only (no markdown, no hashtags, no bullet symbols) in exactly this format:
          Observation: <1-2 sentences insight>
          Tactical Advice: <one concrete action>
          Tomorrow's Focus: <short mantra>

          Keep it concise, encouraging, but stoic and sharp.
        `,
      });
      return normalizeJournalInsight(fallback.text || "");
    } catch (fallbackError) {
      console.error(`AI Error (${TEXT_MODEL_FALLBACK}):`, fallbackError);
      return "⚠️ AI Assistant unavailable. Please check your API key configuration.";
    }
  }
}

export async function breakDownTask(task: string): Promise<string[]> {
  const ai = getAIClient();
  if (!ai) return [task];

  try {
    const response = await ai.models.generateContent({
      model: TEXT_MODEL_PRIMARY,
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
    console.error(`AI Error (${TEXT_MODEL_PRIMARY}):`, e);
    try {
      const fallback = await ai.models.generateContent({
        model: TEXT_MODEL_FALLBACK,
        contents: `Break down the task "${task}" into 3-5 smaller, concrete, actionable steps that can be done in <30 mins each.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
        },
      });
      const text = fallback.text;
      if (!text) return [task];
      return JSON.parse(text);
    } catch (fallbackError) {
      console.error(`AI Error (${TEXT_MODEL_FALLBACK}):`, fallbackError);
      return [task];
    }
  }
}

export async function generateVisionImage(goal: string): Promise<{ image: string | null; error?: string }> {
  const ai = getAIClient();
  if (!ai) return { image: null, error: "AI client is not configured." };

  const tryGenerateImage = async (model: string): Promise<string | null> => {
    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [
          {
            text: `A futuristic, high-tech, cinematic visualization of this goal being achieved: "${goal}".
                   Style: Cyberpunk, Neon, Solarpunk, Highly detailed, Inspirational, 4k.
                   No text in the image.`,
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: "16:9",
        },
        responseModalities: ["TEXT", "IMAGE"],
      },
    });

    for (const candidate of response.candidates || []) {
      for (const part of candidate.content?.parts || []) {
        if (part.inlineData?.data) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }
    return null;
  };

  try {
    const image = await tryGenerateImage(IMAGE_MODEL_PRIMARY);
    if (image) return { image };
    const fallbackImage = await tryGenerateImage(IMAGE_MODEL_FALLBACK);
    if (fallbackImage) return { image: fallbackImage };
    return { image: null, error: `${IMAGE_MODEL_FALLBACK} returned no image payload.` };
  } catch (e) {
    console.error(`Image Gen Error (${IMAGE_MODEL_PRIMARY}): ${summarizeError(e)}`);
    try {
      const fallbackImage = await tryGenerateImage(IMAGE_MODEL_FALLBACK);
      if (fallbackImage) return { image: fallbackImage };
      return { image: null, error: `${IMAGE_MODEL_FALLBACK} returned no image payload.` };
    } catch (fallbackError) {
      console.error(`Image Gen Error (${IMAGE_MODEL_FALLBACK}): ${summarizeError(fallbackError)}`);
      return {
        image: null,
        error: `${explainImageError(fallbackError)} (${IMAGE_MODEL_FALLBACK})`,
      };
    }
  }
}
