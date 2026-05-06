const REVIEW_PLATFORM_HOSTS = [
  "tripadvisor.",
  "viator.",
  "getyourguide.",
  "booking.",
  "expedia.",
];

const PERSONAL_EMAIL_DOMAINS = new Set([
  "gmail.com",
  "yahoo.com",
  "hotmail.com",
  "outlook.com",
  "icloud.com",
  "aol.com",
  "proton.me",
  "protonmail.com",
]);

const TOURISM_TERMS = [
  "tour",
  "safari",
  "travel",
  "trip",
  "lodge",
  "hotel",
  "accommodation",
  "guide",
  "transport",
  "transfer",
  "dmc",
  "destination",
];

const PARTNERSHIP_TERMS = [
  "partner",
  "partnership",
  "affiliate",
  "commission",
  "agency",
  "b2b",
  "reseller",
  "supplier",
  "marketplace",
];

const normalizeText = (value = "") => value.toString().trim();
const normalizeLower = (value = "") => normalizeText(value).toLowerCase();

const getHostname = (url = "") => {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch (_error) {
    return "";
  }
};

const dedupeContacts = (contacts = []) => {
  const seen = new Set();
  return contacts.filter((contact) => {
    const key = `${contact.type}:${contact.value}`.toLowerCase();
    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
};

export const evaluateLeadSourcePolicy = ({ sourceUrl = "", officialWebsiteUrl = "" } = {}) => {
  const sourceHost = getHostname(sourceUrl);
  const officialHost = getHostname(officialWebsiteUrl);
  const reviewSource = REVIEW_PLATFORM_HOSTS.some((host) => sourceHost.includes(host));

  if (reviewSource && !officialHost) {
    return {
      allowed: false,
      reason: "review-platform-direct-scraping-blocked",
      sourceHost,
      officialHost,
    };
  }

  if (reviewSource && officialHost) {
    return {
      allowed: true,
      reason: "official-business-website-from-review-source",
      sourceHost,
      officialHost,
    };
  }

  return {
    allowed: true,
    reason: "public-business-source",
    sourceHost,
    officialHost,
  };
};

const extractEmails = (text = "") =>
  [...text.matchAll(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi)].map((match) => match[0]);

const extractWhatsAppNumbers = (text = "") => {
  const waLinks = [...text.matchAll(/(?:wa\.me\/|whatsapp\.com\/send\?phone=)(\+?\d{8,15})/gi)].map(
    (match) => `+${match[1].replace(/\D/g, "")}`
  );
  const labelledNumbers = [...text.matchAll(/(?:whatsapp|wa)[:\s-]+(\+?\d[\d\s().-]{7,}\d)/gi)].map(
    (match) => `+${match[1].replace(/\D/g, "")}`
  );

  return [...waLinks, ...labelledNumbers];
};

const classifyEmail = (email = "", sourceHost = "") => {
  const domain = email.split("@")[1]?.toLowerCase() || "";

  if (PERSONAL_EMAIL_DOMAINS.has(domain)) {
    return {
      allowed: false,
      reason: "personal-email-provider",
    };
  }

  if (sourceHost && domain && !sourceHost.includes(domain) && !domain.includes(sourceHost.replace(/^www\./, ""))) {
    return {
      allowed: true,
      reason: "public-business-email",
      confidence: 0.78,
    };
  }

  return {
    allowed: true,
    reason: "domain-matched-business-email",
    confidence: 0.92,
  };
};

export const extractBusinessContacts = ({ sourceUrl = "", pageText = "" } = {}) => {
  const sourceHost = getHostname(sourceUrl);
  const allowedContacts = [];
  const blockedContacts = [];

  for (const email of extractEmails(pageText)) {
    const classification = classifyEmail(email, sourceHost);
    const contact = {
      type: "email",
      value: email.toLowerCase(),
      confidence: classification.confidence || 0.5,
      reason: classification.reason,
    };

    if (classification.allowed) {
      allowedContacts.push(contact);
    } else {
      blockedContacts.push({ ...contact, reason: classification.reason });
    }
  }

  for (const phone of extractWhatsAppNumbers(pageText)) {
    allowedContacts.push({
      type: "whatsapp",
      value: phone,
      confidence: 0.86,
      reason: "public-whatsapp-business-contact",
    });
  }

  return {
    allowedContacts: dedupeContacts(allowedContacts),
    blockedContacts: dedupeContacts(blockedContacts),
  };
};

const inferCategories = (text = "") => {
  const normalized = normalizeLower(text);
  return TOURISM_TERMS.filter((term) => normalized.includes(term));
};

export const scoreTourismLeadCandidate = ({
  organizationName = "",
  categories = [],
  allowedContacts = [],
  sourcePolicy = {},
  complianceFlags = [],
  pageText = "",
} = {}) => {
  let leadScore = 0;
  const reasons = [];
  const normalizedText = normalizeLower(`${organizationName} ${pageText}`);
  const categorySet = new Set([...categories, ...inferCategories(pageText)]);

  if (sourcePolicy.allowed) {
    leadScore += 20;
    reasons.push("Source policy allows compliant B2B discovery");
  }

  if (allowedContacts.some((contact) => contact.type === "email")) {
    leadScore += 16;
    reasons.push("Public business email available");
  }

  if (allowedContacts.some((contact) => contact.type === "whatsapp")) {
    leadScore += 12;
    reasons.push("Public WhatsApp business contact available");
  }

  if (categorySet.size >= 2) {
    leadScore += 14;
    reasons.push("Multiple tourism business categories detected");
  }

  if (PARTNERSHIP_TERMS.some((term) => normalizedText.includes(term))) {
    leadScore += 22;
    reasons.push("Partnership or commission language detected");
  }

  if (complianceFlags.includes("source-attributed")) {
    leadScore += 8;
    reasons.push("Source attribution captured");
  }

  if (complianceFlags.includes("public-business-contact")) {
    leadScore += 8;
    reasons.push("Contact is marked as public business contact");
  }

  const recommendedUseCases = [];
  if (leadScore >= 50) {
    recommendedUseCases.push("marketplace-partnership");
  }
  if (PARTNERSHIP_TERMS.some((term) => normalizedText.includes(term))) {
    recommendedUseCases.push("commission-growth");
  }
  if (allowedContacts.some((contact) => contact.type === "whatsapp")) {
    recommendedUseCases.push("human-reviewed-whatsapp-outreach");
  }
  if (allowedContacts.some((contact) => contact.type === "email")) {
    recommendedUseCases.push("partner-onboarding-email");
  }

  const clampedScore = Math.max(0, Math.min(100, leadScore));

  return {
    leadScore: clampedScore,
    leadTemperature: clampedScore >= 70 ? "hot" : clampedScore >= 40 ? "warm" : "cold",
    leadScoreReasons: reasons.slice(0, 6),
    recommendedUseCases,
    outreachAllowed: Boolean(sourcePolicy.allowed && allowedContacts.length > 0),
  };
};

export const analyzeTourismLeadSource = ({
  sourceUrl = "",
  officialWebsiteUrl = "",
  pageText = "",
  organizationName = "",
  categories = [],
} = {}) => {
  const sourcePolicy = evaluateLeadSourcePolicy({ sourceUrl, officialWebsiteUrl });

  if (!sourcePolicy.allowed) {
    return {
      sourceUrl,
      officialWebsiteUrl,
      organizationName,
      sourcePolicy,
      allowedContacts: [],
      blockedContacts: [],
      complianceFlags: ["blocked-source"],
      leadScore: 0,
      leadTemperature: "cold",
      leadScoreReasons: ["Source policy blocked contact extraction"],
      recommendedUseCases: [],
      outreachAllowed: false,
    };
  }

  const contacts = extractBusinessContacts({
    sourceUrl: officialWebsiteUrl || sourceUrl,
    pageText,
  });
  const complianceFlags = ["source-attributed"];

  if (contacts.allowedContacts.length > 0) {
    complianceFlags.push("public-business-contact");
  }

  const scoring = scoreTourismLeadCandidate({
    organizationName,
    categories,
    allowedContacts: contacts.allowedContacts,
    sourcePolicy,
    complianceFlags,
    pageText,
  });

  return {
    sourceUrl,
    officialWebsiteUrl,
    organizationName,
    sourcePolicy,
    ...contacts,
    complianceFlags,
    ...scoring,
  };
};
