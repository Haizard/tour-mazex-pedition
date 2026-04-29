export const processDueTouchpoints = async ({
  sequence,
  now = new Date(),
  sendWhatsAppMessage = async () => {},
} = {}) => {
  if (!sequence || !Array.isArray(sequence.touchpoints)) {
    return { changed: false };
  }

  let changed = false;

  for (const touchpoint of sequence.touchpoints) {
    if (touchpoint.status !== "pending") {
      continue;
    }

    const scheduledAt = touchpoint.scheduledAt instanceof Date
      ? touchpoint.scheduledAt
      : new Date(touchpoint.scheduledAt);

    if (Number.isNaN(scheduledAt.getTime()) || scheduledAt > now) {
      continue;
    }

    try {
      if (touchpoint.channel === "whatsapp" && sequence.inquiryId?.phone) {
        await sendWhatsAppMessage({
          phone: sequence.inquiryId.phone,
          message: touchpoint.content,
        });
      }

      touchpoint.status = "sent";
      touchpoint.sentAt = new Date(now);
      changed = true;
    } catch (_error) {
      touchpoint.status = "failed";
      touchpoint.sentAt = null;
      changed = true;
    }
  }

  return { changed };
};
