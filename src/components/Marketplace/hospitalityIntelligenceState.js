const toTrimmedString = (value) => String(value || "").trim();

export const getHospitalityRecommendationLabel = (targetType = "") => {
  const labels = {
    hotel: "Stay add-on",
    restaurant: "Dining add-on",
    tour: "Trip add-on",
  };

  return labels[toTrimmedString(targetType)] || "Hospitality add-on";
};

export const getHospitalityConfidenceLabel = (fitScore = 0) => {
  const score = Number(fitScore || 0);

  if (score >= 70) return "High fit";
  if (score >= 45) return "Good fit";
  return "Emerging fit";
};

export const buildHospitalityRecommendationQuery = (context = {}) => ({
  sourceType: toTrimmedString(context.sourceType),
  sourceSlug: toTrimmedString(context.sourceSlug),
  sourceId: toTrimmedString(context.sourceId),
  surface: toTrimmedString(context.surface || "marketplace"),
  destination: toTrimmedString(context.destination),
  region: toTrimmedString(context.region),
  sessionKey: toTrimmedString(context.sessionKey),
});

export const normalizeHospitalityRecommendations = (recommendations = []) =>
  (Array.isArray(recommendations) ? recommendations : []).map((item = {}) => {
    const targetType = toTrimmedString(item.targetType);
    const sponsored = item.sponsored === true || item.attribution?.sponsored === true;
    const primaryReason = Array.isArray(item.reasons)
      ? toTrimmedString(item.reasons.find((reason) => toTrimmedString(reason)))
      : "";

    return {
      ...item,
      id:
        toTrimmedString(item.recommendationId) ||
        `${targetType}:${toTrimmedString(item.targetId)}`,
      label: getHospitalityRecommendationLabel(targetType),
      sponsoredLabel: sponsored ? "Sponsored" : "Organic fit",
      confidenceLabel: getHospitalityConfidenceLabel(item.fitScore),
      primaryReason: primaryReason || "Recommended from hospitality context.",
      href: toTrimmedString(item.url) || "/discover",
      disclaimer:
        toTrimmedString(item.disclaimer) ||
        "AI recommendation only. Confirm availability, pricing, and commitments before booking.",
    };
  });
