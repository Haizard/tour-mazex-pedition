export const buildWhatsAppUrl = (phoneNumber = "", message = "") => {
  const digitsOnly = phoneNumber.toString().replace(/[^\d]/g, "");

  if (!digitsOnly) {
    return "";
  }

  return `https://wa.me/${digitsOnly}?text=${encodeURIComponent(message)}`;
};

export const generateInquiryLeadAutomation = (
  inquiry = {},
  { tenantName = "Our Safari Team", whatsappNumber = "" } = {}
) => {
  const travelerName =
    inquiry.firstName?.trim() || inquiry.name?.split(" ")?.[0]?.trim() || "Traveler";
  const destinationLabel =
    Array.isArray(inquiry.destinations) && inquiry.destinations.length > 0
      ? inquiry.destinations.join(", ")
      : "a Tanzania safari";
  const tripLength = inquiry.tripLengthDays
    ? `${inquiry.tripLengthDays} day${Number(inquiry.tripLengthDays) === 1 ? "" : "s"}`
    : inquiry.duration || "a flexible itinerary";
  const travelWhen = inquiry.travelWhen?.trim() || "flexible dates";
  const adults = inquiry.adults || 1;
  const budget = inquiry.budget?.trim() || "budget not shared yet";
  const travelerMessage = inquiry.message?.trim() || "No extra trip notes shared yet.";

  const summary = `${travelerName} wants ${destinationLabel} for ${adults} traveler(s), around ${travelWhen}, for ${tripLength}. Budget: ${budget}.`;
  const followUpMessage = [
    `Hello ${travelerName}, thanks for reaching out to ${tenantName}.`,
    `We have your request for ${destinationLabel} around ${travelWhen} for ${adults} traveler(s).`,
    `We noted this preference: "${travelerMessage}"`,
    "Reply with your preferred travel dates and ideal budget range, and we will shape the best itinerary for you.",
  ].join(" ");

  return {
    summary,
    followUpMessage,
    whatsappUrl: buildWhatsAppUrl(whatsappNumber, followUpMessage),
  };
};
