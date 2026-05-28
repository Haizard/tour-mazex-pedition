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
