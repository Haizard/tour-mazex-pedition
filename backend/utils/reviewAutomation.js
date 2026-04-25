const DEFAULT_PLATFORMS = [
  { channel: "google", label: "Google Reviews" },
  { channel: "tripadvisor", label: "Tripadvisor" },
  { channel: "booking-com", label: "Booking.com" },
];

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

export const buildReviewRequestDraft = ({
  booking = {},
  tenantName = "Your safari team",
  selectedPlatforms = DEFAULT_PLATFORMS,
} = {}) => {
  const packageTitle = booking.packageTour || "your safari experience";
  const travelDateLabel = formatTravelDate(booking.travelDate);
  const guestName = booking.name || "Guest";
  const sendWindowLabel = travelDateLabel
    ? `2-3 days after ${travelDateLabel}`
    : "within 3 days of trip completion";

  const message = [
    `Hi ${guestName},`,
    "",
    `Thank you for travelling with ${tenantName} on ${packageTitle}.`,
    "If you enjoyed the journey, would you take a minute to leave a review and help future guests feel confident booking with us?",
    "",
    "Your feedback helps us improve and supports more travelers discovering Tanzania with the right operator.",
  ].join("\n");

  return {
    guestName,
    guestEmail: booking.email || "",
    bookingLabel: packageTitle,
    status: "draft",
    sendWindowLabel,
    subject: `${tenantName} would love your review`,
    message,
    platforms: selectedPlatforms.map((platform) => ({
      channel: platform.channel,
      label: platform.label,
      reviewUrl: platform.reviewUrl || "",
    })),
    nextStepChecklist: [
      "Choose which review channels to include",
      "Add each public review URL before sending",
      "Send after the trip is complete or mark as scheduled",
    ],
  };
};
