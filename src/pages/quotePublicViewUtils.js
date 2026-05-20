export const getQuoteStatusLabel = (status = "") => {
  const normalized = String(status || "").trim().toLowerCase();
  if (normalized === "accepted") {
    return "Accepted";
  }
  if (normalized === "sent") {
    return "Awaiting traveler response";
  }
  if (normalized === "rejected") {
    return "Changes requested";
  }
  return "Draft proposal";
};

export const getMarketplaceQuoteContext = (quote = {}) => {
  const leadSource = String(quote?.leadSource || "").trim().toLowerCase();
  const campaignLabel = String(quote?.campaignLabel || "").trim();

  if (leadSource !== "global-marketplace") {
    return null;
  }

  return {
    eyebrow: "Marketplace inquiry",
    title: "This proposal came from a marketplace trip request.",
    detail: campaignLabel
      ? `The operator is responding to the traveler journey that started on ${campaignLabel}.`
      : "The operator is responding to the traveler journey that started in public marketplace discovery.",
  };
};
