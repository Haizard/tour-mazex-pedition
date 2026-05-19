export const LEAD_STATUS_FILTERS = ["all", "Pending", "Contacted", "Booked", "Cancelled"];
export const LEAD_SOURCE_FILTERS = [
  "all",
  "website",
  "plan-my-trip",
  "global-marketplace",
  "whatsapp-button",
  "chatbot",
];

export const readLeadInboxFiltersFromSearchParams = (searchParams) => {
  const source = searchParams?.get("source") || "all";
  const status = searchParams?.get("status") || "all";
  const campaign = searchParams?.get("campaign") || "";

  return {
    status: LEAD_STATUS_FILTERS.includes(status) ? status : "all",
    source: LEAD_SOURCE_FILTERS.includes(source) ? source : "all",
    campaign,
  };
};

export const filterLeadInboxItems = (inquiries = [], filters = {}) =>
  (Array.isArray(inquiries) ? inquiries : []).filter((inquiry) => {
    const matchesStatus =
      !filters.status || filters.status === "all" || inquiry.status === filters.status;
    const matchesSource =
      !filters.source ||
      filters.source === "all" ||
      (inquiry.sourceChannel || "website") === filters.source;
    const matchesCampaign =
      !filters.campaign || String(inquiry.campaignLabel || "") === String(filters.campaign);

    return matchesStatus && matchesSource && matchesCampaign;
  });
