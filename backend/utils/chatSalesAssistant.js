import { buildRestaurantLeadAutopilot } from "./restaurantLeadAutopilot.js";

const slugifyTitle = (value = "") =>
  value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const tokenize = (value = "") =>
  value
    .toString()
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .map((part) => part.trim())
    .filter(Boolean);

const scoreTextMatch = (messageTokens, searchable = "") =>
  messageTokens.reduce(
    (score, token) => (String(searchable || "").includes(token) ? score + 1 : score),
    0
  );

const scoreTourMatch = (messageTokens, tour = {}) => {
  const searchable = [
    tour.title,
    tour.location,
    tour.tourType,
    tour.category,
    tour.description,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return scoreTextMatch(messageTokens, searchable);
};

const scoreRestaurantMatch = (messageTokens, restaurant = {}) => {
  const searchable = [
    restaurant.name,
    restaurant.destination,
    ...(Array.isArray(restaurant.cuisineTypes) ? restaurant.cuisineTypes : []),
    ...(Array.isArray(restaurant.mealTypes) ? restaurant.mealTypes : []),
    ...(Array.isArray(restaurant.dietaryFits) ? restaurant.dietaryFits : []),
    ...(Array.isArray(restaurant.ambianceTags) ? restaurant.ambianceTags : []),
    restaurant.summary,
    restaurant.description,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return scoreTextMatch(messageTokens, searchable);
};

const inferRestaurantIntentType = (message = "") => {
  const normalized = String(message || "").toLowerCase();

  return ["itinerary", "route", "stop", "after the", "before the", "on the way"].some(
    (phrase) => normalized.includes(phrase)
  )
    ? "itinerary-add-on"
    : "direct-restaurant";
};

export const buildSalesAssistantPayload = ({ message = "", tours = [], restaurants = [] }) => {
  const messageTokens = tokenize(message);
  const rankedTours = tours
    .map((tour) => ({
      ...tour,
      matchScore: scoreTourMatch(messageTokens, tour),
    }))
    .sort((left, right) => right.matchScore - left.matchScore);

  const rankedRestaurants = restaurants
    .map((restaurant) => ({
      ...restaurant,
      matchScore: scoreRestaurantMatch(messageTokens, restaurant),
    }))
    .sort((left, right) => right.matchScore - left.matchScore);

  const bestRestaurant = rankedRestaurants[0];
  const bestMatch = rankedTours[0];

  if (bestRestaurant && bestRestaurant.matchScore > (bestMatch?.matchScore || 0)) {
    const restaurantAutopilot = buildRestaurantLeadAutopilot({
      restaurantId: bestRestaurant._id,
      restaurantName: bestRestaurant.name,
      restaurantIntentType: inferRestaurantIntentType(message),
      message,
    });

    return {
      summary: `${bestRestaurant.name} looks like the strongest dining fit based on your request.`,
      intent: "recommend-restaurant",
      salesStage: "qualified-intent",
      recommendedNextStep: "view-restaurant",
      qualificationQuestion: restaurantAutopilot.requiresHumanReview
        ? "Where should this meal sit in the route, and are there dietary requirements we need to protect?"
        : "What date, guest count, and meal timing should we confirm for this dining request?",
      leadCapturePrompt: `Open the restaurant page and send a dining inquiry so the operator can ${restaurantAutopilot.nextBestAction.charAt(0).toLowerCase()}${restaurantAutopilot.nextBestAction.slice(1)}`,
      restaurantAutopilot,
      quickActions: [
        {
          label: "View Matching Restaurant",
          kind: "restaurant",
          href: `/discover/restaurants/${bestRestaurant.slug || ""}`,
        },
        {
          label: "Design Your Trip",
          kind: "planner",
          href: "/plan-my-trip",
        },
      ],
    };
  }

  if (!bestMatch || bestMatch.matchScore === 0) {
    return {
      summary:
        "This sounds like a custom trip request, so the best next step is to shape it in the tailor-made planner.",
      intent: "custom-trip",
      salesStage: "discovery",
      recommendedNextStep: "open-planner",
      qualificationQuestion:
        "What travel month and budget range should we design around?",
      leadCapturePrompt:
        "If you already know your dates, leave your email or WhatsApp in the planner so the sales team can turn this into a custom quote quickly.",
      quickActions: [
        {
          label: "Design Your Trip",
          kind: "planner",
          href: "/plan-my-trip",
        },
      ],
    };
  }

  return {
    summary: `${bestMatch.title} looks like the strongest fit based on your request.`,
    intent: "recommend-package",
    salesStage: "qualified-intent",
    recommendedNextStep: "view-package",
    matchedTourId: bestMatch._id || "",
    qualificationQuestion:
      "How many travelers and what date window should we plan around?",
    leadCapturePrompt:
      "If this looks close, share your email or WhatsApp after opening the package so we can prepare pricing and availability for you.",
    quickActions: [
      {
        label: "View Matching Package",
        kind: "package",
        href: `/packages/${slugifyTitle(bestMatch.title)}${bestMatch._id ? `?tourId=${bestMatch._id}` : ""}`,
      },
      {
        label: "Design Your Trip",
        kind: "planner",
        href: "/plan-my-trip",
      },
    ],
  };
};
