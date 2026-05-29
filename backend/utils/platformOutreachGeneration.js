const ESCALATION_TERMS = [
  "guarantee",
  "legal",
  "privacy",
  "data processing",
  "discount",
  "revenue share",
  "refund",
  "spam",
  "abuse",
  "partnership terms",
];

export const buildPlatformOutreachPrompt = ({
  campaign = {},
  prospect = {},
  channel = "email",
} = {}) => `
You are the Mazex platform growth assistant.
Represent the platform brand only. Do not impersonate tenant tour operators.
Do not invent prices, guarantees, rankings, partnerships, or client results.
Use configured pricing ranges only when supplied.
Include appropriate opt-out language for commercial outreach.

Campaign:
Title: ${campaign.title || ""}
Objective: ${campaign.objective || ""}
Tone: ${campaign.tone || "professional, helpful, direct"}
Offer: ${campaign.offer || ""}

Prospect:
Company: ${prospect.companyName || ""}
Country: ${prospect.country || ""}
Website: ${prospect.website || ""}
Source: ${prospect.sourceUrl || ""}

Channel: ${channel}
Return concise JSON with subject, body, confidence, and guardrailNotes.
`.trim();

export const classifyPlatformReplyIntent = (text = "") => {
  const normalized = String(text || "").toLowerCase();
  const matchedTerm = ESCALATION_TERMS.find((term) => normalized.includes(term));

  if (matchedTerm) {
    return {
      intent: "needs-human-review",
      requiresEscalation: true,
      reason: `Matched sensitive term: ${matchedTerm}`,
      confidence: 0.9,
    };
  }

  return {
    intent: "platform-sales-question",
    requiresEscalation: false,
    reason: "",
    confidence: normalized.trim() ? 0.75 : 0.2,
  };
};

export const validateGeneratedOutreach = (payload = {}) => {
  if (!String(payload.body || "").trim()) {
    throw new Error("Generated outreach body is required.");
  }

  return {
    subject: String(payload.subject || "").trim(),
    body: String(payload.body || "").trim(),
    confidence: Number(payload.confidence || 0.7),
    guardrailNotes: Array.isArray(payload.guardrailNotes) ? payload.guardrailNotes : [],
  };
};

export const parseGeneratedOutreachJson = (text = "") => {
  const raw = String(text || "").trim();
  const fencedMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fencedMatch?.[1]?.trim() || raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1);

  if (!candidate || !candidate.startsWith("{")) {
    throw new Error("AI outreach response must be valid JSON.");
  }

  return JSON.parse(candidate);
};

const defaultGenerateText = async ({ prompt, model, apiKey }) => {
  const { GoogleGenAI } = await import("@google/genai");
  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model,
    contents: [{ role: "user", parts: [{ text: prompt }] }],
  });

  return response.text || "";
};

export const generatePlatformOutreachWithLlm = async ({
  campaign = {},
  prospect = {},
  channel = "email",
  env = process.env,
  generateText = defaultGenerateText,
  model = env.PLATFORM_OUTREACH_AI_MODEL || env.PAGE_BUILDER_AI_MODEL || "gemini-2.5-flash",
} = {}) => {
  const apiKey = env.GEMINI_API_KEY || env.GOOGLE_API_KEY || env.PLATFORM_OUTREACH_AI_API_KEY;
  if (!apiKey) {
    throw new Error("AI credentials are required for platform outreach generation.");
  }

  const prompt = buildPlatformOutreachPrompt({ campaign, prospect, channel });
  const text = await generateText({ prompt, model, apiKey });
  const parsed = parseGeneratedOutreachJson(text);

  return {
    ...validateGeneratedOutreach(parsed),
    prompt,
    model,
  };
};
