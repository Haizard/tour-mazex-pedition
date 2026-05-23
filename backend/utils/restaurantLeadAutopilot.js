const tokenize = (value = "") =>
  String(value || "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .map((part) => part.trim())
    .filter(Boolean);

const hasAny = (tokens = [], candidates = []) => candidates.some((candidate) => tokens.includes(candidate));

export const buildRestaurantLeadAutopilot = ({
  restaurantId = "",
  restaurantName = "",
  restaurantIntentType = "",
  message = "",
} = {}) => {
  const tokens = tokenize(message);
  const classifications = [];

  if (restaurantIntentType === "direct-restaurant") classifications.push("direct-dining");
  if (restaurantIntentType === "itinerary-add-on") classifications.push("itinerary-dining");
  if (hasAny(tokens, ["group", "guests", "party", "event", "farewell", "welcome"])) classifications.push("group-dining");
  if (hasAny(tokens, ["vegetarian", "vegan", "halal", "gluten", "allergy", "allergies", "nut-free"])) classifications.push("dietary-sensitive");
  if (hasAny(tokens, ["route", "after", "before", "timing", "transfer", "stop", "crater"])) classifications.push("route-sensitive");

  const uniqueClassifications = [...new Set(classifications)];
  const requiresHumanReview =
    uniqueClassifications.includes("dietary-sensitive") &&
    uniqueClassifications.includes("itinerary-dining");

  let intentLabel = "Restaurant lead";
  if (restaurantIntentType === "direct-restaurant") intentLabel = "Direct dining";
  if (restaurantIntentType === "itinerary-add-on") intentLabel = "Itinerary dining add-on";

  let urgency = "warm";
  if (uniqueClassifications.includes("direct-dining") || uniqueClassifications.includes("group-dining")) urgency = "hot";

  let nextBestAction =
    "Confirm the dining date, guest count, and whether this is a direct booking or part of a wider itinerary.";
  if (restaurantIntentType === "direct-restaurant") {
    nextBestAction =
      "Confirm dietary requirements, final guest count, and service timing before proposing the restaurant.";
  } else if (restaurantIntentType === "itinerary-add-on") {
    nextBestAction =
      "Confirm dietary needs, route timing, and whether this stop is essential or optional inside the itinerary.";
  }

  const replyHints = [
    restaurantName ? `Reference ${restaurantName} directly so the traveler knows which dining option you are confirming.` : "",
    uniqueClassifications.includes("dietary-sensitive")
      ? "Ask for dietary needs and restrictions before confirming the fit."
      : "Confirm guest count and preferred meal timing early in the reply.",
    uniqueClassifications.includes("itinerary-dining")
      ? "Clarify how this restaurant should fit into the route, transfer window, or wider itinerary."
      : "Offer the next step for confirmation without implying a guaranteed reservation.",
  ].filter(Boolean);

  return {
    restaurantId: restaurantId ? String(restaurantId) : "",
    restaurantName: restaurantName || "",
    restaurantIntentType: restaurantIntentType || "",
    intentLabel,
    classifications: uniqueClassifications,
    urgency,
    nextBestAction,
    replyHints,
    requiresHumanReview,
  };
};

export const enhanceRestaurantInquiryAutomation = (automation = {}, inquiryData = {}) => {
  const restaurantAutopilot = buildRestaurantLeadAutopilot({
    restaurantId: inquiryData.restaurantId,
    restaurantName: inquiryData.restaurantName,
    restaurantIntentType: inquiryData.restaurantIntentType,
    message: inquiryData.message,
  });

  const summaryParts = [
    automation.summary || "",
    restaurantAutopilot.intentLabel ? `Restaurant intent: ${restaurantAutopilot.intentLabel}.` : "",
    restaurantAutopilot.nextBestAction || "",
  ].filter(Boolean);

  const followUpParts = [
    automation.followUpMessage || "",
    ...restaurantAutopilot.replyHints,
  ].filter(Boolean);

  return {
    ...automation,
    summary: summaryParts.join(" ").trim(),
    followUpMessage: followUpParts.join(" ").trim(),
    restaurantAutopilot,
  };
};
