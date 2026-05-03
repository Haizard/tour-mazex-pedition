const roundCurrency = (value) => Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;

const normalizeLabel = (value = "") => value.toString().trim().toLowerCase();

export const calculateDynamicPricePreview = ({
  basePrice = 0,
  seasonMultiplier = 1,
  demandMultiplier = 1,
  occupancyMultiplier = 1,
  minimumPrice = 0,
} = {}) => {
  const rawPrice =
    Number(basePrice || 0) *
    Number(seasonMultiplier || 1) *
    Number(demandMultiplier || 1) *
    Number(occupancyMultiplier || 1);

  const roundedRawPrice = roundCurrency(rawPrice);
  const floorPrice = Number(minimumPrice || 0);
  const finalPrice = floorPrice > 0 ? Math.max(roundedRawPrice, floorPrice) : roundedRawPrice;
  const adjustmentPercent =
    Number(basePrice || 0) > 0
      ? roundCurrency(((finalPrice - Number(basePrice || 0)) / Number(basePrice || 0)) * 100)
      : 0;

  return {
    finalPrice,
    adjustmentPercent,
    minimumApplied: floorPrice > 0 && finalPrice === floorPrice && finalPrice !== roundedRawPrice,
  };
};

export const doesDynamicPricingRuleMatchTour = (rule = {}, tour = {}) => {
  const routeLabel = normalizeLabel(rule.routeLabel);

  if (!routeLabel) {
    return false;
  }

  const tourCandidates = [
    tour.title,
    tour.location,
    tour.destinationSlug,
    ...(Array.isArray(tour.destinationsVisited) ? tour.destinationsVisited : []),
  ]
    .map((value) => normalizeLabel(value))
    .filter(Boolean);

  return tourCandidates.some(
    (candidate) => candidate.includes(routeLabel) || routeLabel.includes(candidate)
  );
};

export const buildDynamicPricingImpactBoard = (rules = [], tours = []) =>
  (rules || [])
    .filter((rule) => rule.status === "active")
    .map((rule) => {
      const matchedTours = (tours || [])
        .filter((tour) => doesDynamicPricingRuleMatchTour(rule, tour))
        .map((tour) => {
          const preview = calculateDynamicPricePreview({
            ...rule,
            basePrice: tour.price || rule.basePrice || 0,
          });

          return {
            tourId: tour._id,
            title: tour.title,
            location: tour.location,
            basePrice: Number(tour.price || 0),
            adjustedPrice: preview.finalPrice,
            adjustmentPercent: preview.adjustmentPercent,
            minimumApplied: preview.minimumApplied,
          };
        });

      return {
        ruleId: rule._id,
        ruleName: rule.ruleName,
        routeLabel: rule.routeLabel,
        matchedTours,
        impactedTourCount: matchedTours.length,
      };
    });
