const normalizeBudgetText = (budget = "") => budget.toString().trim().toLowerCase();

export const scoreInquiryLead = (inquiry = {}) => {
  let score = 0;
  const reasons = [];

  const destinationCount = Array.isArray(inquiry.destinations)
    ? inquiry.destinations.filter(Boolean).length
    : 0;
  const tripLengthDays = Number(inquiry.tripLengthDays || 0);
  const adults = Number(inquiry.adults || 0);
  const messageLength = inquiry.message?.toString().trim().length || 0;
  const budgetText = normalizeBudgetText(inquiry.budget);
  const travelWhen = inquiry.travelWhen?.toString().trim().toLowerCase() || "";
  const accommodationPreferences = Array.isArray(inquiry.accommodationPreferences)
    ? inquiry.accommodationPreferences.map((item) => item?.toString().trim().toLowerCase())
    : [];
  const servicesCount = Array.isArray(inquiry.services) ? inquiry.services.filter(Boolean).length : 0;

  if (destinationCount >= 1) {
    score += 12;
    reasons.push("Selected destination interests");
  }

  if (destinationCount >= 2) {
    score += 6;
    reasons.push("Considering multiple destination combinations");
  }

  if (tripLengthDays >= 4 && tripLengthDays <= 10) {
    score += 12;
    reasons.push("Trip duration fits a strong safari buying window");
  } else if (tripLengthDays > 10) {
    score += 8;
    reasons.push("Long-stay traveler with larger itinerary potential");
  }

  if (adults >= 2) {
    score += 10;
    reasons.push("Multi-traveler booking potential");
  }

  if (adults >= 4) {
    score += 6;
    reasons.push("Higher group size value");
  }

  if (budgetText && !["", "flexible", "not sure", "unknown"].includes(budgetText)) {
    score += 10;
    reasons.push("Budget information shared");
  }

  if (travelWhen && !travelWhen.includes("flexible")) {
    score += 12;
    reasons.push("Travel timing is defined");
  }

  if (messageLength >= 50) {
    score += 8;
    reasons.push("Detailed inquiry intent");
  }

  if (servicesCount > 0) {
    score += 5;
    reasons.push("Additional services requested");
  }

  if (accommodationPreferences.some((item) => item && item !== "flexible")) {
    score += 5;
    reasons.push("Accommodation preference is clear");
  }

  if (inquiry.contactPreference === "whatsapp" || inquiry.contactPreference === "phone") {
    score += 6;
    reasons.push("High-response contact preference");
  }

  if (inquiry.sourceChannel === "plan-my-trip") {
    score += 10;
    reasons.push("Came through tailor-made planning flow");
  } else if (inquiry.sourceChannel === "whatsapp-button" || inquiry.sourceChannel === "chatbot") {
    score += 7;
    reasons.push("Came through an active engagement channel");
  }

  const clampedScore = Math.max(0, Math.min(100, Math.round(score)));
  const temperature = clampedScore >= 70 ? "hot" : clampedScore >= 40 ? "warm" : "cold";

  return {
    leadScore: clampedScore,
    leadTemperature: temperature,
    leadScoreReasons: reasons.slice(0, 6),
  };
};
