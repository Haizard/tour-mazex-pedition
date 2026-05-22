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

const getHotelIntentLabel = (intentType = "") =>
  intentType === "direct-hotel" ? "Direct hotel inquiry" : "Itinerary hotel add-on";

const getHotelOperatorChecklist = (intentType = "") =>
  intentType === "direct-hotel"
    ? [
        "Confirm room fit, rough availability window, and next-step contact owner.",
        "Clarify whether the traveler wants a hotel-only stay or a wider trip plan.",
      ]
    : [
        "Check route fit, nights, transfer logic, and operator package pairing.",
        "Confirm whether the hotel should be proposed as preferred, optional, or alternative.",
      ];

export const enhanceHotelInquiryAutomation = (automation = {}, inquiry = {}) => {
  if (!inquiry.hotelId && !inquiry.hotelName && !inquiry.hotelIntentType) {
    return automation;
  }

  const hotelName = String(inquiry.hotelName || "Selected hotel").trim();
  const intentLabel = getHotelIntentLabel(inquiry.hotelIntentType);
  const operatorChecklist = getHotelOperatorChecklist(inquiry.hotelIntentType);
  const hotelSummary = `${intentLabel}: ${hotelName}.`;

  return {
    ...automation,
    summary: `${automation.summary || ""} ${hotelSummary}`.trim(),
    operatorChecklist,
    hotelLead: {
      hotelId: String(inquiry.hotelId || ""),
      hotelName,
      intentType: inquiry.hotelIntentType || "itinerary-add-on",
      intentLabel,
      accommodationPreferences: Array.isArray(inquiry.accommodationPreferences)
        ? inquiry.accommodationPreferences
        : [],
    },
  };
};
