export const generateFollowUpSequence = (inquiry = {}, { tenantName = "our team" } = {}) => {
  const firstName = inquiry.firstName || inquiry.name?.split(" ")[0] || "there";
  const destinations = Array.isArray(inquiry.destinations) && inquiry.destinations.length > 0 
    ? inquiry.destinations.join(" & ") 
    : "your trip";

  const now = new Date();

  return [
    {
      scheduledAt: new Date(now.getTime() + 24 * 60 * 60 * 1000), // 1 day later
      channel: inquiry.contactPreference || "whatsapp",
      content: `Hi ${firstName}, it's ${tenantName}. I'm following up on your ${destinations} inquiry. Would you like to hop on a quick call to refine the itinerary, or should I send over a first draft quote?`,
      status: "pending",
    },
    {
      scheduledAt: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000), // 3 days later
      channel: inquiry.contactPreference || "whatsapp",
      content: `Hello ${firstName}! I just checked the availability for ${destinations} around your dates. Some of our top-rated lodges are filling up fast for that period. Shall I secure a provisional booking for you while we finalize the details?`,
      status: "pending",
    },
    {
      scheduledAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days later
      channel: inquiry.contactPreference || "whatsapp",
      content: `Hi ${firstName}, just a final check-in. Since I haven't heard back, I'll close your ${destinations} request for now to keep our queue organized. If you decide to travel later, feel free to reach out anytime!`,
      status: "pending",
    },
  ];
};
