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
Rewrite the BLOG content below into fresh, high-quality editorial wording while preserving the exact meaning and factual details.

Strict rules:
- Keep the same language.
- Keep all facts, names, numbers, places, durations, and recommendations.
- Do not invent new claims.
- Keep it sounding natural and human-authored with varied rhythm and sentence length.
- Preserve markdown structure (headings, bullet points, emphasis, links) if present, and improve it when helpful.
- Add tasteful engagement icons/emojis where appropriate (for example: 📍, ✅, 🦁, 🌍, ✨, 🧭). Use them sparingly and naturally.
- Avoid robotic phrasing, repetition, and generic filler lines.
- Improve clarity, flow, and storytelling without changing facts.
- Return only the rewritten blog content, no intro/explanation.

Context:
${contextBlock || "- none"}

Original content:
${text}
    `.trim();
  }

  return `
Rewrite the TOUR DESCRIPTION below into fresh, premium, human-sounding copy while preserving the exact meaning and factual details.

Strict rules:
- Keep the same language.
- Keep all facts, names, numbers, places, durations, and inclusions/exclusions references.
- Do not invent new claims.
- Keep it as plain descriptive text (no markdown headings).
- Use natural, human style with vivid but accurate language and varied sentence rhythm.
- Add light engagement icons/emojis in-line where natural (for example: 📍, ⏱️, ✅, 🌿, 🦓). Do not overuse.
- Avoid robotic phrasing, repetition, and generic filler lines.
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
          temperature: 0.55,
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

export const generateSeoWithAi = async ({ title, description, content, contentType = "tour" }) => {
  const ai = getClient();
  const prompt = `
Generate SEO metadata (Title, Meta Description, Keywords) for the following ${contentType.toUpperCase()}:
Title: ${title}
Description/Content: ${ (description || content || '').substring(0, 1200) }...

Rules:
- SEO Title: Max 60 chars, catchy, includes primary keywords and brand name "Makolo Afrika".
- Meta Description: 150-160 chars, includes a compelling call to action.
- Keywords: Top 5-8 relevant keywords, comma separated.
- Return ONLY a JSON object with: { "title": "...", "description": "...", "keywords": "..." }
- No markdown formatting, just the raw JSON.
`.trim();

  let lastError;
  for (const model of MODELS_TO_TRY) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: { temperature: 0.4 }
      });
      const text = response?.text?.trim().replace(/```json|```/g, "").trim();
      return JSON.parse(text);
    } catch (error) {
      lastError = error;
      console.error(`AI SEO failed for model ${model}:`, error.message);
    }
  }
  throw new Error(lastError?.message || "AI SEO generation failed.");
};

export const generateFullTourPackageWithAi = async ({ title, description, tourType, category, location, durationDays }) => {
  const ai = getClient();
  const prompt = `
Generate a COMPLETE, LUXURY safari tour package for "Makolo Afrika" based on the following:
Title: ${title}
Initial Idea: ${description}
Type: ${tourType}
Category: ${category}
Location: ${location}
Requested Duration: ${durationDays || '7'} days

Strict rules for generation:
1. SEO FOCUS: Use high-intent travel keywords like "Luxury Safari", "Exclusive Experience", "Wildlife Adventure", and specific park names if applicable.
2. CINEMATIC DESCRIPTION: Write a compelling, immersive description (300-500 words) using vivid storytelling but keeping it accurate. 
3. START/END LOCATION: Provide logical hubs (e.g., Arusha, Kilimanjaro Airport, Zanzibar).
4. DURATION: Must match ${durationDays || 'the logical length for this trip'}.
5. INCLUSIONS/EXCLUSIONS: Provide 8-12 comprehensive points for each, as arrays of strings.
6. ITINERARY: For EACH day of the tour, provide:
   - day: Number
   - events: An array of 3-5 high-detail descriptions of activities.
   - accommodation: A realistic luxury lodge/camp name matching the region.
7. PRICING: Realistic "Green Season (Apr-May)", "High Season (Jun-Oct)", and "Peak Season (Dec-Feb)" prices (e.g., "$3500 PP").
8. FAQs: 5-8 common traveler questions and professional answers.
9. SEO METADATA: High-conversion Title, Meta Description, and Keywords.

Return ONLY a valid JSON object with the following structure:
{
  "description": "...",
  "startLocation": "...",
  "endLocation": "...",
  "duration": "... days",
  "inclusions": ["...", "..."],
  "exclusions": ["...", "..."],
  "itinerary": [
    { "day": 1, "events": ["...", "..."], "accommodation": "..." },
    ...
  ],
  "pricingTable": { "greenSeason": "$...", "highSeason": "$...", "peakSeason": "$..." },
  "faqs": [ { "question": "...", "answer": "..." }, ... ],
  "seoTitle": "...",
  "seoDescription": "...",
  "seoKeywords": "keyword1, keyword2, ..."
}

Return ONLY the raw JSON. No markdown blocks.
`.trim();

  let lastError;
  for (const model of MODELS_TO_TRY) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: {
          temperature: 0.7,
          maxOutputTokens: 3500,
        },
      });

      const text = response?.text?.trim().replace(/```json|```/g, "").trim();
      if (text) {
        return JSON.parse(text);
      }
    } catch (error) {
      lastError = error;
      console.error(`Full Tour Generation failed for model ${model}:`, error.message);
    }
  }

  throw new Error(lastError?.message || "AI Full Tour Generation failed.");
};
