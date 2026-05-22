const uniqueStrings = (values = []) => [
  ...new Set(
    values
      .map((value) => String(value || "").trim())
      .filter(Boolean)
  ),
];

export const createHotelDirectInquiryInitialState = ({ hotel = {} } = {}) => ({
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  travelWhen: "",
  adults: 1,
  tripLengthDays: 1,
  contactPreference: "whatsapp",
  message: `I'm interested in ${hotel.name || "this hotel"} and would like guidance on availability, room fit, and next steps.`,
});

export const buildHotelDirectInquirySubmission = ({
  hotel = {},
  traveler = {},
  sourceChannel = "global-marketplace",
} = {}) => ({
  firstName: String(traveler.firstName || "").trim(),
  lastName: String(traveler.lastName || "").trim(),
  email: String(traveler.email || "").trim(),
  phone: String(traveler.phone || "").trim(),
  name: `${String(traveler.firstName || "").trim()} ${String(
    traveler.lastName || ""
  ).trim()}`.trim(),
  destinations: uniqueStrings([hotel.destination || "Flexible"]),
  tripLengthDays: Math.max(1, Number(traveler.tripLengthDays || 1)),
  adults: Math.max(1, Number(traveler.adults || 1)),
  childrenUnder5: 0,
  children6To15: 0,
  travelWhen: String(traveler.travelWhen || "Flexible dates").trim(),
  sleepingArrangement: "Flexible",
  accommodationPreferences: uniqueStrings([
    hotel.name || "",
    hotel.accommodationType || "",
  ]),
  contactPreference: String(traveler.contactPreference || "whatsapp").trim(),
  message: String(traveler.message || "").trim(),
  sourceChannel,
  campaignLabel: `hotel_${hotel._id || hotel.id || "unknown"}`,
  operatorTenantId: hotel.operator?.id || "",
  operatorTenantSlug: hotel.operator?.slug || "",
  hotelId: String(hotel._id || hotel.id || ""),
  hotelName: hotel.name || "",
  hotelIntentType: "direct-hotel",
});
