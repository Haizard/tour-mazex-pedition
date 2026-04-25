const roundCurrency = (value) => Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;

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
