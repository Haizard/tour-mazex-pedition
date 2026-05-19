const average = (values = []) =>
  values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;

const normalizeText = (value = "") => value.toString().trim().toLowerCase();

const buildDestinationTerms = (inquiry = {}) => {
  const terms = new Set();

  (inquiry.destinations || []).forEach((destination) => {
    const normalized = normalizeText(destination);
    if (normalized) {
      terms.add(normalized);
    }
  });

  return Array.from(terms);
};

export const findMatchingToursForInquiry = (inquiry = {}, tours = []) => {
  const destinationTerms = buildDestinationTerms(inquiry);

  return [...tours]
    .map((tour) => {
      const haystack = [
        tour.title,
        tour.location,
        ...(tour.destinationsVisited || []),
        tour.category,
        tour.tourType,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      let matchScore = 0;
      for (const term of destinationTerms) {
        if (haystack.includes(term)) {
          matchScore += 10;
        }
      }

      if (Number.isFinite(Number(tour.price)) && Number(tour.price) > 0) {
        matchScore += 2;
      }

      return {
        ...tour,
        matchScore,
      };
    })
    .sort((left, right) => right.matchScore - left.matchScore || Number(left.price || 0) - Number(right.price || 0));
};

export const generateQuoteProposal = ({
  inquiry = {},
  tours = [],
  tenantName = "Tour Operator",
  generatedBy = "",
} = {}) => {
  const matchedTours = findMatchingToursForInquiry(inquiry, tours).filter((tour) => tour.matchScore > 0);
  const recommendedTours = matchedTours.slice(0, 3);
  const travelerCount = Math.max(
    1,
    Number(inquiry.adults || 0) + Number(inquiry.children6To15 || 0) + Number(inquiry.childrenUnder5 || 0)
  );
  const tripLengthDays = Math.max(1, Number(inquiry.tripLengthDays || 0) || 5);
  const travelerName =
    inquiry.name?.trim() ||
    [inquiry.firstName, inquiry.lastName].filter(Boolean).join(" ").trim() ||
    "Guest";
  const destinationLabel = Array.isArray(inquiry.destinations) && inquiry.destinations.length
    ? inquiry.destinations.join(", ")
    : "Tanzania safari";

  const basePricePerTraveler =
    average(recommendedTours.map((tour) => Number(tour.price || 0)).filter((price) => price > 0)) ||
    tripLengthDays * 320;
  const accommodationMultiplier = (inquiry.accommodationPreferences || []).some((item) =>
    normalizeText(item).includes("luxury")
  )
    ? 1.2
    : 1;

  const safariPackageAmount = Math.round(basePricePerTraveler * travelerCount * accommodationMultiplier);
  const logisticsAmount = Math.round(Math.max(180, tripLengthDays * 45));
  const supportAmount = (inquiry.services || []).length > 0 ? Math.round((inquiry.services || []).length * 40) : 0;

  const lineItems = [
    {
      label: "Core itinerary package",
      quantity: travelerCount,
      amount: safariPackageAmount,
      notes: recommendedTours[0]?.title || `Tailor-made ${destinationLabel} journey`,
    },
    {
      label: "Logistics and destination coordination",
      quantity: 1,
      amount: logisticsAmount,
      notes: `${tripLengthDays}-day planning, routing, and supplier coordination`,
    },
  ];

  if (supportAmount > 0) {
    lineItems.push({
      label: "Requested add-on services",
      quantity: 1,
      amount: supportAmount,
      notes: (inquiry.services || []).join(", "),
    });
  }

  const subtotal = lineItems.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const totalPrice = subtotal;
  const itineraryOutline =
    recommendedTours[0]?.itinerary?.length > 0
      ? recommendedTours[0].itinerary
          .slice(0, Math.min(4, recommendedTours[0].itinerary.length))
          .map((day) => `Day ${day.day}: ${Array.isArray(day.events) ? day.events.join(", ") : day.events}`)
      : [
          `Day 1: Arrival, briefing, and transfer into ${destinationLabel}`,
          `Day 2-${Math.max(2, tripLengthDays - 1)}: Guided safari activities and tailored experiences`,
          `Final Day: Wrap-up, transfer, and departure support`,
        ];

  return {
    title: `${destinationLabel} Quote for ${travelerName}`,
    travelerName,
    destinationLabel,
    summary: `Prepared for ${travelerName} based on a ${tripLengthDays}-day request for ${destinationLabel} with ${travelerCount} traveler(s).`,
    currency: "USD",
    travelerCount,
    tripLengthDays,
    lineItems,
    subtotal,
    totalPrice,
    recommendedTourIds: recommendedTours.map((tour) => tour._id),
    itineraryOutline,
    nextSteps: [
      `Confirm preferred travel window (${inquiry.travelWhen || "flexible dates"})`,
      "Review accommodation level and final inclusions",
      "Approve quote so the itinerary can move to booking confirmation",
    ],
    validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    generatedBy,
    generationMeta: {
      source: "smart-quote-v1",
      recommendedTourTitles: recommendedTours.map((tour) => tour.title),
      inquiryBudget: inquiry.budget || "",
      leadSource: inquiry.sourceChannel || "website",
      campaignLabel: inquiry.campaignLabel || "",
    },
  };
};
