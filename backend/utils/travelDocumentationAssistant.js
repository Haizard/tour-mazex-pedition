export const summarizeTravelDocumentationGuide = (guide = {}) => {
  const market = guide.market || "Traveler market";
  const topic = guide.topic || "Travel requirement";

  if (guide.status === "active") {
    return {
      badgeLabel: "Active",
      summary: `${topic} guidance for ${market} is active and ready for traveler support flows.`,
    };
  }

  if (guide.status === "archived") {
    return {
      badgeLabel: "Archived",
      summary: `${topic} guidance for ${market} is archived and no longer shown as current advice.`,
    };
  }

  return {
    badgeLabel: "Draft",
    summary: `${topic} guidance for ${market} is still being prepared and reviewed.`,
  };
};
