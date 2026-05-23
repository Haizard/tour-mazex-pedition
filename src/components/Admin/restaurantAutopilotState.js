export const getRestaurantAutopilotBadge = (autopilot = {}) =>
  autopilot.intentLabel || "Restaurant lead";

export const getRestaurantAutopilotSummary = (autopilot = {}) => ({
  title: autopilot.intentLabel || "Restaurant lead",
  badge: getRestaurantAutopilotBadge(autopilot),
  urgency: autopilot.urgency || "warm",
  nextBestAction: autopilot.nextBestAction || "",
  replyHints: Array.isArray(autopilot.replyHints) ? autopilot.replyHints : [],
  classifications: Array.isArray(autopilot.classifications) ? autopilot.classifications : [],
  requiresHumanReview: autopilot.requiresHumanReview === true,
});
