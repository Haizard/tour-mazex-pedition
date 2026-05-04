const normalizeText = (value = "") =>
  value
    .toString()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const tokenize = (value = "") =>
  normalizeText(value)
    .split(" ")
    .map((token) => token.trim())
    .filter(Boolean);

const uniq = (items = []) => [...new Set(items.filter(Boolean))];

const clip = (value = "", maxLength = 320) => {
  const normalized = value.toString().trim();
  if (!normalized) {
    return "";
  }

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength - 3).trim()}...`;
};

export const rankContentByVectorMatches = ({
  items = [],
  vectorMatchIds = [],
} = {}) => {
  const vectorRank = new Map(
    (vectorMatchIds || []).map((id, index) => [String(id), index])
  );

  return [...(items || [])].sort((left, right) => {
    const leftRank = vectorRank.has(String(left?._id || ""))
      ? vectorRank.get(String(left?._id || ""))
      : Number.POSITIVE_INFINITY;
    const rightRank = vectorRank.has(String(right?._id || ""))
      ? vectorRank.get(String(right?._id || ""))
      : Number.POSITIVE_INFINITY;

    if (leftRank !== rightRank) {
      return leftRank - rightRank;
    }

    return 0;
  });
};

export const selectLanguageAssistantProfile = ({
  profiles = [],
  visitorProfile = {},
  message = "",
  vectorMatchIds = [],
}) => {
  const activeProfiles = (profiles || []).filter(
    (profile) => profile?.status === "active"
  );

  if (!activeProfiles.length) {
    return null;
  }

  const localeHints = uniq([
    visitorProfile.preferredLocale,
    visitorProfile.browserLanguage,
    visitorProfile.localeCode,
    visitorProfile.market,
    visitorProfile.language,
  ]).map((item) => normalizeText(item));

  const messageTokens = tokenize(message);
  const vectorRank = new Map(
    (vectorMatchIds || []).map((id, index) => [String(id), Math.max(1, 100 - index)])
  );

  const rankedProfiles = activeProfiles
    .map((profile) => {
      const searchable = normalizeText(
        [
          profile.language,
          profile.localeCode,
          ...(Array.isArray(profile.useCases) ? profile.useCases : []),
          ...(Array.isArray(profile.glossary) ? profile.glossary : []),
          profile.notes,
        ].join(" ")
      );

      let score = 0;

      localeHints.forEach((hint) => {
        if (hint && searchable.includes(hint)) {
          score += 5;
        }
      });

      messageTokens.forEach((token) => {
        if (token && searchable.includes(token)) {
          score += 1;
        }
      });

      const profileId = String(profile?._id || "");
      if (profileId && vectorRank.has(profileId)) {
        score += vectorRank.get(profileId);
      }

      return {
        ...profile,
        matchScore: score,
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore);

  return rankedProfiles[0]?.matchScore > 0 ? rankedProfiles[0] : null;
};

export const selectTravelDocumentationGuides = ({
  guides = [],
  visitorProfile = {},
  message = "",
  limit = 3,
  vectorMatchIds = [],
}) => {
  const activeGuides = (guides || []).filter((guide) => guide?.status === "active");
  if (!activeGuides.length) {
    return [];
  }

  const searchableHints = uniq([
    visitorProfile.market,
    visitorProfile.nationality,
    visitorProfile.departureCountry,
    visitorProfile.originCountry,
    visitorProfile.preferredLocale,
    visitorProfile.browserLanguage,
    message,
  ])
    .map((item) => normalizeText(item))
    .filter(Boolean);
  const vectorRank = new Map(
    (vectorMatchIds || []).map((id, index) => [String(id), Math.max(2, 100 - index)])
  );

  return activeGuides
    .map((guide) => {
      const searchable = normalizeText(
        [
          guide.market,
          guide.topic,
          guide.requirementSummary,
          guide.sourceLabel,
          guide.notes,
        ].join(" ")
      );

      const matchScore = searchableHints.reduce(
        (score, hint) => (searchable.includes(hint) ? score + Math.max(2, hint.length > 4 ? 3 : 1) : score),
        0
      );
      const guideId = String(guide?._id || "");
      const vectorBoost = guideId && vectorRank.has(guideId) ? vectorRank.get(guideId) : 0;

      return {
        ...guide,
        matchScore: matchScore + vectorBoost,
      };
    })
    .filter((guide) => guide.matchScore > 0)
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, limit);
};

export const selectFaqEntries = ({
  faqs = [],
  message = "",
  limit = 3,
  vectorMatchIds = [],
} = {}) => {
  const activeFaqs = (faqs || []).filter((faq) => faq?.question && faq?.answer);
  if (!activeFaqs.length) {
    return [];
  }

  const messageTokens = tokenize(message);
  const vectorRank = new Map(
    (vectorMatchIds || []).map((id, index) => [String(id), Math.max(2, 100 - index)])
  );

  return activeFaqs
    .map((faq) => {
      const searchable = normalizeText(
        [faq.question, faq.answer, faq.category].filter(Boolean).join(" ")
      );

      let score = 0;
      messageTokens.forEach((token) => {
        if (token && searchable.includes(token)) {
          score += token.length > 4 ? 3 : 1;
        }
      });

      const faqId = String(faq?._id || "");
      if (faqId && vectorRank.has(faqId)) {
        score += vectorRank.get(faqId);
      }

      return {
        ...faq,
        matchScore: score,
      };
    })
    .filter((faq) => faq.matchScore > 0)
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, limit);
};

export const selectCampaignEntries = ({
  campaigns = [],
  message = "",
  limit = 3,
  vectorMatchIds = [],
} = {}) => {
  const activeCampaigns = (campaigns || []).filter((campaign) =>
    ["active", "scheduled", "draft"].includes(String(campaign?.status || "").toLowerCase())
  );

  if (!activeCampaigns.length) {
    return [];
  }

  const messageTokens = tokenize(message);
  const vectorRank = new Map(
    (vectorMatchIds || []).map((id, index) => [String(id), Math.max(2, 100 - index)])
  );

  return activeCampaigns
    .map((campaign) => {
      const searchable = normalizeText(
        [
          campaign.title,
          campaign.summary,
          campaign.campaignType,
          ...(Array.isArray(campaign.channels) ? campaign.channels : []),
        ]
          .filter(Boolean)
          .join(" ")
      );

      let score = 0;
      messageTokens.forEach((token) => {
        if (token && searchable.includes(token)) {
          score += token.length > 4 ? 3 : 1;
        }
      });

      const campaignId = String(campaign?._id || "");
      if (campaignId && vectorRank.has(campaignId)) {
        score += vectorRank.get(campaignId);
      }

      return {
        ...campaign,
        matchScore: score,
      };
    })
    .filter((campaign) => campaign.matchScore > 0)
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, limit);
};

export const buildCustomerSupportContext = ({
  tenantName = "MAZ Expeditions",
  tours = [],
  blogs = [],
  faqs = [],
  campaigns = [],
  message = "",
  visitorProfile = {},
  languageProfiles = [],
  travelDocumentationGuides = [],
  vectorMatches = {},
  featureAccess = {},
}) => {
  const matchedLanguageProfile = featureAccess.multilingualAiAssistant
    ? selectLanguageAssistantProfile({
        profiles: languageProfiles,
        visitorProfile,
        message,
        vectorMatchIds: vectorMatches.languageProfileIds || [],
      })
    : null;

  const matchedTravelGuides = featureAccess.travelDocumentationAssistant
    ? selectTravelDocumentationGuides({
        guides: travelDocumentationGuides,
        visitorProfile,
        message,
        vectorMatchIds: vectorMatches.travelGuideIds || [],
      })
    : [];
  const matchedFaqs = selectFaqEntries({
    faqs,
    message,
    vectorMatchIds: vectorMatches.faqIds || [],
  });
  const matchedCampaigns = selectCampaignEntries({
    campaigns,
    message,
    vectorMatchIds: vectorMatches.campaignIds || [],
  });

  const compactTours = (tours || []).slice(0, 8).map((tour) =>
    `- ${tour.title} | ${tour.location || "Tanzania"} | ${tour.duration || "Custom duration"} | $${tour.price || "Quote"} | ${clip(tour.description, 140)}`
  );

  const compactBlogs = (blogs || []).slice(0, 5).map((blog) =>
    `- ${blog.title}${blog.category ? ` (${blog.category})` : ""}: ${clip(blog.content, 140)}`
  );
  const compactFaqs = matchedFaqs.map((faq) =>
    `- ${faq.question}${faq.category ? ` (${faq.category})` : ""}: ${clip(faq.answer, 180)}`
  );
  const compactCampaigns = matchedCampaigns.map((campaign) =>
    `- ${campaign.title}${campaign.campaignType ? ` (${campaign.campaignType})` : ""}: ${clip(campaign.summary, 180)}${Array.isArray(campaign.channels) && campaign.channels.length ? ` Channels: ${campaign.channels.join(", ")}.` : ""}`
  );

  const languageSection = matchedLanguageProfile
    ? [
        "Active language assistant:",
        `- Reply in ${matchedLanguageProfile.language}${matchedLanguageProfile.localeCode ? ` (${matchedLanguageProfile.localeCode})` : ""}.`,
        matchedLanguageProfile.tone ? `- Tone target: ${matchedLanguageProfile.tone}.` : null,
        Array.isArray(matchedLanguageProfile.glossary) && matchedLanguageProfile.glossary.length
          ? `- Keep terminology aligned with: ${matchedLanguageProfile.glossary.slice(0, 8).join(", ")}.`
          : null,
      ]
        .filter(Boolean)
        .join("\n")
    : featureAccess.multilingualAiAssistant
      ? "Language assistant is available, but no active language pack matched this visitor. Respond clearly in the user's apparent language when practical, otherwise default to English."
      : "Multilingual assistant is not enabled for this tenant. Default to English unless the user clearly writes in another language, then keep the reply simple.";

  const travelDocumentationSection = matchedTravelGuides.length
    ? [
        "Travel documentation guidance currently relevant to this visitor:",
        ...matchedTravelGuides.map(
          (guide) =>
            `- ${guide.market} | ${guide.topic}: ${clip(guide.requirementSummary || guide.notes || "Guidance available.", 220)}${guide.sourceLabel ? ` Source: ${guide.sourceLabel}.` : ""}`
        ),
        "If documentation guidance is incomplete or time-sensitive, tell the traveler to verify with the relevant embassy, airline, or official authority.",
      ].join("\n")
    : featureAccess.travelDocumentationAssistant
      ? "No market-specific documentation guide matched this visitor. Give only cautious general guidance and tell the traveler to verify official requirements."
      : "Travel documentation assistant is not enabled for this tenant.";

  const visitorContext = [
    visitorProfile.preferredLocale ? `Preferred locale: ${visitorProfile.preferredLocale}` : null,
    visitorProfile.browserLanguage ? `Browser language: ${visitorProfile.browserLanguage}` : null,
    visitorProfile.market ? `Market: ${visitorProfile.market}` : null,
    visitorProfile.currentPage ? `Current page: ${visitorProfile.currentPage}` : null,
    visitorProfile.timezone ? `Timezone: ${visitorProfile.timezone}` : null,
  ]
    .filter(Boolean)
    .join(" | ");

  const systemInstruction = `
You are the "${tenantName} Travel Expert", a commercially sharp but warm Tanzanian travel support assistant.

Architecture rules:
- Think in stages: identify intent, pull the most relevant support context, answer briefly, then give one clear next step.
- Prefer precise grounded guidance over generic sales language.
- If the request is about visas, vaccines, entry rules, passports, insurance, or airport requirements, use the documentation section below and be explicit about verification.
- If you do not know a policy with confidence, say so and direct the traveler to an official authority or human support.
- Keep answers under 170 words unless the user explicitly asks for detail.
- Use short paragraphs or tight bullets.
- Always end with one actionable CTA when natural: a package page, /plan-my-trip, WhatsApp, or a human follow-up.

Brand context:
- Brand: ${tenantName}
- Goal: help travelers confidently choose a safari, trekking, or Zanzibar plan and remove booking friction.
- Signature guidance: combine safari, trekking, and Zanzibar when it truly fits the request.

Visitor context:
${visitorContext || "No extra visitor context captured yet."}

${languageSection}

${travelDocumentationSection}

Relevant frequently asked questions:
${compactFaqs.join("\n") || "- No matching FAQ entries found."}

Current commercial campaigns:
${compactCampaigns.join("\n") || "- No campaign matches found."}

Current tours:
${compactTours.join("\n") || "- No tour catalog loaded."}

Recent content and support signals:
${compactBlogs.join("\n") || "- No recent blog/news context loaded."}
`.trim();

  return {
    systemInstruction,
    assistantSignals: {
      preferredLocale:
        visitorProfile.preferredLocale ||
        visitorProfile.browserLanguage ||
        "",
      matchedLanguage: matchedLanguageProfile
        ? {
            language: matchedLanguageProfile.language || "",
            localeCode: matchedLanguageProfile.localeCode || "",
            tone: matchedLanguageProfile.tone || "",
          }
        : null,
      travelDocumentation: matchedTravelGuides.map((guide) => ({
        market: guide.market || "",
        topic: guide.topic || "",
        sourceLabel: guide.sourceLabel || "",
      })),
      capabilitySummary: {
        multilingualAiAssistant: Boolean(featureAccess.multilingualAiAssistant),
        travelDocumentationAssistant: Boolean(
          featureAccess.travelDocumentationAssistant
        ),
      },
    },
  };
};
