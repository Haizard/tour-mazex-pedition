export const generateFollowUpSequence = (inquiry = {}) => {
  const firstName = inquiry.firstName || inquiry.name?.split(" ")[0] || "there";
  const destinations = Array.isArray(inquiry.destinations) && inquiry.destinations.length > 0 
    ? inquiry.destinations.join(" & ") 
    : "your trip";

  const now = new Date();

  return [
    {
      scheduledAt: new Date(now.getTime() + 24 * 60 * 60 * 1000), // 1 day later
      channel: inquiry.contactPreference || "whatsapp",
      content: `Hi ${firstName}, just checking in to see if you had any questions about the ${destinations} itinerary we discussed yesterday. We're excited to help you plan this journey!`,
      status: "pending",
    },
    {
      scheduledAt: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000), // 3 days later
      channel: inquiry.contactPreference || "whatsapp",
      content: `Hello again ${firstName}! We've seen some new availability for ${destinations} that might fit your dates. Would you like us to refresh your quote with these latest options?`,
      status: "pending",
    },
    {
      scheduledAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days later
      channel: inquiry.contactPreference || "whatsapp",
      content: `Hi ${firstName}, we haven't heard back yet, so we'll put your ${destinations} request on hold for now. Whenever you're ready to pick things back up, just reply here and we'll be ready to go!`,
      status: "pending",
    },
  ];
};
