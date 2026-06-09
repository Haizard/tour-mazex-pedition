import { normalizeEmail, normalizeWhatsAppNumber } from "./platformOutreachProspects.js";
import crypto from "node:crypto";

const toDate = (value) => {
  if (!value) return new Date();
  if (/^\d+$/.test(String(value))) return new Date(Number(value) * 1000);
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date() : date;
};

export const normalizePlatformEmailWebhookPayload = (payload = {}) => {
  const data = payload.data || payload.email || payload;
  const body = data.text || data.text_body || data.body || data.html || "";
  const from = data.from?.email || data.from || data.sender || data.reply_from || "";
  const participantAddress = normalizeEmail(from);

  if (!participantAddress || !body) return [];

  return [
    {
      channel: "email",
      participantAddress,
      subject: data.subject || payload.subject || "",
      body: String(body || "").trim(),
      providerMessageId: data.message_id || data.messageId || data.id || payload.id || "",
      receivedAt: toDate(data.created_at || data.receivedAt || payload.created_at),
    },
  ];
};

export const normalizePlatformWhatsAppWebhookPayload = (payload = {}) => {
  const replies = [];
  for (const entry of payload.entry || []) {
    for (const change of entry.changes || []) {
      for (const message of change.value?.messages || []) {
        const body =
          message.text?.body ||
          message.button?.text ||
          message.interactive?.button_reply?.title ||
          message.interactive?.list_reply?.title ||
          "";
        const participantAddress = normalizeWhatsAppNumber(message.from || "");
        if (!participantAddress || !body) continue;
        replies.push({
          channel: "whatsapp",
          participantAddress,
          subject: "",
          body: String(body || "").trim(),
          providerMessageId: message.id || "",
          receivedAt: toDate(message.timestamp),
        });
      }
    }
  }
  return replies;
};

const timingSafeEqual = (actual = "", expected = "") => {
  const actualBuffer = Buffer.from(String(actual || ""));
  const expectedBuffer = Buffer.from(String(expected || ""));
  return actualBuffer.length === expectedBuffer.length && crypto.timingSafeEqual(actualBuffer, expectedBuffer);
};

const hmacSha256 = ({ secret = "", rawBody = "" } = {}) =>
  crypto.createHmac("sha256", String(secret)).update(String(rawBody || "")).digest("hex");

export const verifyPlatformEmailWebhookSignature = ({
  provider = "resend",
  rawBody = "",
  secret = "",
  headers = {},
} = {}) => {
  if (!secret) return { valid: true, reason: "No email signature secret configured." };
  const normalizedHeaders = Object.fromEntries(
    Object.entries(headers || {}).map(([key, value]) => [key.toLowerCase(), value]),
  );
  const suppliedSignature =
    normalizedHeaders["resend-signature"] ||
    normalizedHeaders["x-resend-signature"] ||
    normalizedHeaders["x-webhook-signature"] ||
    "";

  if (!suppliedSignature) {
    return { valid: false, reason: `${provider} webhook signature header is missing.` };
  }

  const expectedSignature = hmacSha256({ secret, rawBody });
  const cleanedSignature = String(suppliedSignature).replace(/^sha256=/i, "");
  return timingSafeEqual(cleanedSignature, expectedSignature)
    ? { valid: true, provider }
    : { valid: false, provider, reason: `${provider} webhook signature is invalid.` };
};

export const verifyPlatformWhatsAppWebhookSignature = ({ rawBody = "", appSecret = "", headers = {} } = {}) => {
  if (!appSecret) return { valid: true, reason: "No Meta app secret configured." };
  const normalizedHeaders = Object.fromEntries(
    Object.entries(headers || {}).map(([key, value]) => [key.toLowerCase(), value]),
  );
  const suppliedSignature = String(normalizedHeaders["x-hub-signature-256"] || "").replace(/^sha256=/i, "");

  if (!suppliedSignature) {
    return { valid: false, reason: "Meta webhook signature header is missing." };
  }

  const expectedSignature = hmacSha256({ secret: appSecret, rawBody });
  return timingSafeEqual(suppliedSignature, expectedSignature)
    ? { valid: true, provider: "meta" }
    : { valid: false, provider: "meta", reason: "Meta webhook signature is invalid." };
};
