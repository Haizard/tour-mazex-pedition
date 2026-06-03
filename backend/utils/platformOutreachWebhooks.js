import { normalizeEmail, normalizeWhatsAppNumber } from "./platformOutreachProspects.js";

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
