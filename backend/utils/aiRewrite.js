import { GoogleGenAI } from "@google/genai";

const MODELS_TO_TRY = [
  "models/gemini-2.5-flash",
  "models/gemini-2.0-flash",
  "models/gemini-flash-latest",
];

const getClient = () => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
};

const buildPrompt = ({ text, contentType, context = {} }) => {
  const contextBlock = Object.entries(context)
    .filter(([, value]) => value !== undefined && value !== null && `${value}`.trim() !== "")
    .map(([key, value]) => `- ${key}: ${value}`)
    .join("\n");

  if (contentType === "blog") {
    return `
Paraphrase the BLOG content below into original wording while preserving the exact meaning and factual details.

Strict rules:
- Keep the same language.
- Keep all facts, names, numbers, places, durations, and recommendations.
- Do not invent new claims.
- Preserve markdown structure (headings, bullet points, emphasis, links) if present.
- Improve clarity and readability naturally.
- Return only the rewritten blog content, no intro/explanation.

Context:
${contextBlock || "- none"}

Original content:
${text}
    `.trim();
  }

  return `
Paraphrase the TOUR DESCRIPTION below into original wording while preserving the exact meaning and factual details.

Strict rules:
- Keep the same language.
- Keep all facts, names, numbers, places, durations, and inclusions/exclusions references.
- Do not invent new claims.
- Keep it as plain descriptive text (no markdown headings).
- Improve clarity and readability naturally.
- Return only the rewritten description, no intro/explanation.

Context:
${contextBlock || "- none"}

Original description:
${text}
  `.trim();
};

export const rewriteContentWithAi = async ({ text, contentType = "blog", context = {} }) => {
  const ai = getClient();
  const prompt = buildPrompt({ text, contentType, context });
  let lastError;

  for (const model of MODELS_TO_TRY) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: {
          temperature: 0.35,
          maxOutputTokens: 2400,
        },
      });

      const rewritten = response?.text?.trim();
      if (rewritten) {
        return rewritten;
      }
    } catch (error) {
      lastError = error;
    }
  }

  throw new Error(lastError?.message || "AI rewrite failed.");
};

