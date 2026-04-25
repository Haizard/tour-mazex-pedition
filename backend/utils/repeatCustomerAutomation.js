const formatTravelDate = (value) => {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

export const buildRepeatCustomerAutomation = ({
  booking = {},
  bookingHistory = [],
  tenantName = "Your safari team",
} = {}) => {
  const guestName = booking.name || "Traveler";
  const packageTitle = booking.packageTour || "your safari";
  const travelDateLabel = formatTravelDate(booking.travelDate);
  const completedTrips = Array.isArray(bookingHistory) ? bookingHistory.length : 0;
  const campaignType = completedTrips > 1 ? "anniversary" : "referral";
  const audienceTag = completedTrips > 1 ? "repeat-guest" : "first-time-guest";
  const offerLabel =
    campaignType === "anniversary"
      ? "Return guest priority offer"
      : "Referral reward for your next safari";

  const subject =
    campaignType === "anniversary"
      ? `${tenantName} is ready for your next safari`
      : `${tenantName} would love to welcome your friends too`;

  const message =
    campaignType === "anniversary"
      ? [
          `Hi ${guestName},`,
          "",
          `Thank you again for travelling with ${tenantName}. Since you have already experienced ${packageTitle}, we would love to help you plan your next return to Tanzania.`,
          travelDateLabel
            ? `Your last safari was around ${travelDateLabel}, which makes this a perfect moment to shape an anniversary-style return offer.`
            : "This is a great moment to shape a return safari offer while your last journey is still fresh in memory.",
          "",
          "Reply if you want us to draft a preferred-return itinerary with loyalty perks and faster planning support.",
        ].join("\n")
      : [
          `Hi ${guestName},`,
          "",
          `We hope you loved ${packageTitle} with ${tenantName}. If you know friends or family dreaming about Tanzania, we would love to welcome them too.`,
          "We can prepare a referral-ready itinerary and add a returning guest reward for your next booking.",
          "",
          "Reply if you want a personal referral invitation you can forward directly.",
        ].join("\n");

  return {
    guestName,
    guestEmail: booking.email || "",
    bookingLabel: packageTitle,
    campaignType,
    audienceTag,
    offerLabel,
    subject,
    message,
    status: "draft",
    recommendedSendAtLabel:
      travelDateLabel || "within 30 days of trip completion",
    nextStepChecklist: [
      "Review the guest message and adjust the offer if needed",
      "Send after the trip is complete and feedback is positive",
      "Track replies and convert interested guests into new inquiries",
    ],
  };
};
