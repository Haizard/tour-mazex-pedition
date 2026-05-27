const PERSONAL_EMAIL_DOMAINS = new Set([
  "gmail.com",
  "yahoo.com",
  "hotmail.com",
  "outlook.com",
  "icloud.com",
]);

const trimString = (value = "") => String(value || "").trim();

const normalizeUrl = (value = "") => {
  const raw = trimString(value);
  if (!raw) return "";
  try {
    const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    const url = new URL(withProtocol);
    url.hash = "";
    url.search = "";
    return url.toString().replace(/\/$/, "");
  } catch (_error) {
    return raw.toLowerCase().replace(/\/$/, "");
  }
};

export const normalizeEmail = (value = "") => trimString(value).toLowerCase();

export const normalizeWhatsAppNumber = (value = "") => {
  const raw = trimString(value);
  const hasPlus = raw.startsWith("+");
  const digits = raw.replace(/\D+/g, "");
  return digits ? `${hasPlus ? "+" : ""}${digits}` : "";
};

const normalizeTags = (tags = []) => {
  const values = Array.isArray(tags) ? tags : String(tags || "").split(/[,\n]/);
  return [...new Set(values.map((tag) => trimString(tag)).filter(Boolean))];
};

export const isPersonalEmail = (email = "") => {
  const domain = normalizeEmail(email).split("@")[1] || "";
  return PERSONAL_EMAIL_DOMAINS.has(domain);
};

export const buildPlatformProspectPayload = (body = {}) => {
  const email = normalizeEmail(body.email);
  const whatsappNumber = normalizeWhatsAppNumber(body.whatsappNumber);
  const sourceUrl = normalizeUrl(body.sourceUrl);

  if (!email && !whatsappNumber) {
    throw new Error("A prospect needs an email or WhatsApp number.");
  }

  if (!sourceUrl) {
    throw new Error("A public source URL is required for cold outreach prospects.");
  }

  return {
    companyName: trimString(body.companyName || body.name),
    contactName: trimString(body.contactName),
    email,
    whatsappNumber,
    website: normalizeUrl(body.website),
    country: trimString(body.country),
    sourceUrl,
    sourceType: trimString(body.sourceType || "public-source"),
    tags: normalizeTags(body.tags),
    status: trimString(body.status || "new"),
    emailOptOut: body.emailOptOut === true,
    whatsappOptInStatus: trimString(body.whatsappOptInStatus || "unknown"),
    whatsappOptInSource: trimString(body.whatsappOptInSource),
    metadata: body.metadata || {},
  };
};

export const buildProspectDuplicateQuery = ({ email = "", whatsappNumber = "", website = "" } = {}) => {
  const clauses = [];
  if (email) clauses.push({ email });
  if (whatsappNumber) clauses.push({ whatsappNumber });
  if (website) clauses.push({ website });
  return clauses.length ? { $or: clauses } : { _id: null };
};
