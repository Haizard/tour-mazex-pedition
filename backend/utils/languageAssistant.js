export const summarizeLanguageAssistantProfile = (profile = {}) => {
  const language = profile.language || "Language pack";
  const useCases = Array.isArray(profile.useCases) ? profile.useCases.filter(Boolean) : [];

  if (profile.status === "active") {
    return {
      badgeLabel: "Active",
      summary: `${language} assistant is active${useCases.length ? ` for ${useCases.join(", ")}` : ""}.`,
    };
  }

  if (profile.status === "paused") {
    return {
      badgeLabel: "Paused",
      summary: `${language} assistant is paused and not currently used for traveler communication.`,
    };
  }

  return {
    badgeLabel: "Draft",
    summary: `${language} assistant is still in draft setup and needs content review before launch.`,
  };
};
