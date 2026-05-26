const toId = (value) => {
  const explicitId = value?._id ?? value?.id;

  if (explicitId !== undefined && explicitId !== null) return String(explicitId);
  if (["string", "number", "bigint", "boolean"].includes(typeof value)) return String(value);
  return "";
};
const toText = (value) => String(value || "").trim();
const toLower = (value) => toText(value).toLowerCase();
const asArray = (value) => (Array.isArray(value) ? value.filter(Boolean) : []);

const DISCLAIMER =
  "These are AI recommendations only and do not fabricate availability, pricing, table space, room inventory, or supplier commitments. Confirm every detail through the platform workflow.";

const isPublicEntity = (entity = {}) =>
  entity.published !== false && entity.marketplaceVisible !== false && Boolean(toId(entity));

const includesText = (list = [], needle = "") => {
  const normalizedNeedle = toLower(needle);

  return normalizedNeedle
    ? asArray(list).some((item) => {
        const normalizedItem = toLower(item);
        if (!normalizedItem) return false;

        return normalizedItem.includes(normalizedNeedle) || normalizedNeedle.includes(normalizedItem);
      })
    : false;
};

const getCandidateDestination = (candidate = {}) => {
  if (candidate.destination) return candidate.destination;
  if (candidate.location) return candidate.location;
  if (Array.isArray(candidate.destinationsVisited) && candidate.destinationsVisited.length) {
    return candidate.destinationsVisited[0];
  }
  return "";
};

const isDestinationMatch = (source = {}, candidate = {}) => {
  const sourceDestination = toLower(source.destination);
  return sourceDestination ? sourceDestination === toLower(getCandidateDestination(candidate)) : true;
};

const buildTargetUrl = (type, entity = {}) => {
  if (type === "hotel") return `/discover/hotels/${entity.slug || toId(entity)}`;
  if (type === "restaurant") return `/discover/restaurants/${entity.slug || toId(entity)}`;
  if (type === "tour") return `/discover/tour/${toId(entity)}`;
  return "/discover";
};

export const buildHospitalityAttribution = ({
  recommendationSource = "ai-hospitality-intelligence",
  sourceEntityType = "",
  sourceEntityId = "",
  recommendedEntityType = "",
  recommendedEntityId = "",
  surface = "marketplace",
  sponsored = false,
  sessionKey = "",
  inquiryId = null,
  bookingId = null,
  paymentId = null,
} = {}) => ({
  recommendationSource,
  sourceEntityType,
  sourceEntityId,
  recommendedEntityType,
  recommendedEntityId,
  surface,
  sponsored: sponsored === true,
  sessionKey: sessionKey || "",
  inquiryId,
  bookingId,
  paymentId,
});

const scoreCandidate = ({ source = {}, candidate = {}, type = "", travelerContext = {} }) => {
  const reasons = [];
  let score = 20;

  const candidateDestination = getCandidateDestination(candidate);

  if (toLower(source.destination) && toLower(source.destination) === toLower(candidateDestination)) {
    score += 28;
    reasons.push(`Matches ${candidateDestination} trip flow.`);
  }

  if (toLower(source.region) && toLower(source.region) === toLower(candidate.region)) {
    score += 16;
    reasons.push(`Fits the ${candidate.region} region.`);
  }

  if (candidate.sponsoredPlacement === true) {
    score += 6;
    reasons.push("Sponsored partner with marketplace visibility.");
  }

  if (Number(candidate.averageRating || 0) >= 4.5) {
    score += 8;
    reasons.push(`Strong traveler proof from ${candidate.averageRating} rating.`);
  }

  if (Number(candidate.reviewCount || 0) > 0) {
    score += Math.min(8, Number(candidate.reviewCount || 0) / 6);
    reasons.push(`${candidate.reviewCount} review signals available.`);
  }

  if (type === "restaurant") {
    if (includesText(candidate.mealTypes, travelerContext.mealType)) {
      score += 12;
      reasons.push(`Good ${travelerContext.mealType} timing fit.`);
    }

    asArray(travelerContext.dietaryFits).forEach((dietaryFit) => {
      if (includesText(candidate.dietaryFits, dietaryFit)) {
        score += 8;
        reasons.push(`Supports ${dietaryFit} dining needs.`);
      }
    });

    if (includesText(candidate.ambianceTags, travelerContext.tripStyle)) {
      score += 8;
      reasons.push(`Ambiance fits a ${travelerContext.tripStyle} trip.`);
    }
  }

  if (type === "hotel" && candidate.roomStyleSummary) {
    score += 8;
    reasons.push(`Stay style: ${candidate.roomStyleSummary}.`);
  }

  return {
    score: Math.round(score),
    reasons: reasons.length ? reasons : ["Recommended from marketplace hospitality context."],
  };
};

const shapeRecommendation = ({
  source = {},
  candidate = {},
  type = "",
  scored = {},
  surface = "marketplace",
  sessionKey = "",
  inquiryId = null,
  bookingId = null,
  paymentId = null,
}) => {
  const sourceType = source.type || "marketplace";
  const sourceId = toId(source.id || source._id);
  const targetId = toId(candidate);
  const sponsored = candidate.sponsoredPlacement === true;

  return {
    recommendationId: `${sourceType}:${sourceId}:${type}:${targetId}`,
    sourceType,
    sourceId,
    targetType: type,
    targetId,
    title: candidate.name || candidate.title || "Hospitality recommendation",
    slug: candidate.slug || "",
    url: buildTargetUrl(type, candidate),
    destination: getCandidateDestination(candidate),
    region: candidate.region || "",
    fitScore: scored.score,
    confidence: scored.score >= 70 ? "high" : scored.score >= 45 ? "medium" : "emerging",
    reasons: asArray(scored.reasons).slice(0, 4),
    trustNotes: [
      candidate.trustSummary,
      candidate.averageRating ? `${candidate.averageRating} average rating` : "",
      candidate.reviewCount ? `${candidate.reviewCount} reviews` : "",
    ].filter(Boolean),
    sponsored,
    disclaimer: DISCLAIMER,
    attribution: buildHospitalityAttribution({
      sourceEntityType: sourceType,
      sourceEntityId: sourceId,
      recommendedEntityType: type,
      recommendedEntityId: targetId,
      surface,
      sponsored,
      sessionKey,
      inquiryId,
      bookingId,
      paymentId,
    }),
  };
};

export const buildHospitalityRecommendations = ({
  source = {},
  hotels = [],
  restaurants = [],
  tours = [],
  sessionKey = "",
  surface = "marketplace",
  limitPerType = 3,
  inquiryId = null,
  bookingId = null,
  paymentId = null,
} = {}) => {
  const travelerContext = { ...(source.travelerContext || {}) };
  const sourceType = source.type || "marketplace";
  const pools = [
    ["hotel", hotels],
    ["restaurant", restaurants],
    ["tour", tours],
  ].filter(([type]) => type !== sourceType);

  const recommendations = pools.flatMap(([type, candidates]) =>
    asArray(candidates)
      .filter(isPublicEntity)
      .filter((candidate) => isDestinationMatch(source, candidate))
      .map((candidate) => {
        const scored = scoreCandidate({ source, candidate, type, travelerContext });
        return shapeRecommendation({
          source,
          candidate,
          type,
          scored,
          surface,
          sessionKey,
          inquiryId,
          bookingId,
          paymentId,
        });
      })
      .sort((a, b) => b.fitScore - a.fitScore)
      .slice(0, limitPerType)
  );

  return {
    source: {
      type: sourceType,
      id: toId(source.id || source._id),
      name: source.name || source.title || "",
      destination: source.destination || "",
      region: source.region || "",
    },
    recommendations: recommendations.sort((a, b) => b.fitScore - a.fitScore),
    emptyReason: recommendations.length ? "" : "No strong hospitality pairings yet.",
  };
};

export const buildHospitalityOperatorGuidance = ({ source = {}, recommendations = [] } = {}) => {
  const topHotel = recommendations.find((item) => item.targetType === "hotel");
  const topRestaurant = recommendations.find((item) => item.targetType === "restaurant");
  const nextBestActions = [];

  if (topHotel) {
    nextBestActions.push(`Suggest hotel add-on: ${topHotel.title}.`);
  }

  if (topRestaurant) {
    nextBestActions.push(`Suggest dining add-on: ${topRestaurant.title}.`);
  }

  if (!nextBestActions.length) {
    nextBestActions.push("Ask traveler whether they want stay or dining support.");
  }

  return {
    packageCompletionHint: `${
      source.name || "This lead"
    } can be packaged with hospitality add-ons in ${source.destination || "the destination"}.`,
    nextBestActions,
    replyGuidance:
      "Offer these as curated recommendations and confirm availability, pricing, and supplier commitments before promising anything.",
  };
};
