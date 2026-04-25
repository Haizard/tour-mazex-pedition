const formatPrice = (currency = "USD", value) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "price not recorded";
  }

  return `${currency.toUpperCase()} ${Number(value).toLocaleString()}`;
};

export const summarizeCompetitorInsight = (insight = {}) => {
  const competitorName = insight.competitorName || "Unknown competitor";
  const focusRoute = insight.focusRoute || "general market coverage";
  const marketTrend = insight.marketTrend || "no trend recorded yet";
  const observedPrice = formatPrice(insight.currency, insight.observedPriceUsd);

  if (insight.status === "active") {
    return {
      badgeLabel: "Active",
      summary: `${competitorName} is actively tracked on ${focusRoute} with ${observedPrice} and a market signal of ${marketTrend}.`,
    };
  }

  if (insight.status === "archived") {
    return {
      badgeLabel: "Archived",
      summary: `${competitorName} is archived in the intelligence library for ${focusRoute}.`,
    };
  }

  return {
    badgeLabel: "Watchlist",
    summary: `${competitorName} remains on the watchlist for ${focusRoute}, with ${marketTrend}.`,
  };
};
