const toTitleCase = (value = "") =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/(^|\s|-)\S/g, (match) => match.toUpperCase());

const slugWords = (value = "") =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(" ")
    .filter(Boolean);

const normalizeStringArray = (value = []) =>
  (Array.isArray(value) ? value : String(value || "").split(/[\n,]/))
    .map((item) => item.toString().trim())
    .filter(Boolean)
    .slice(0, 6);

const normalizeSections = (sections = []) =>
  (Array.isArray(sections) ? sections : [])
    .filter((section) => section?.type)
    .slice(0, 8)
    .map((section, index) => ({
      type: section.type,
      variant: section.variant || (index === 0 ? "cinematic" : "editorial"),
      order: index + 1,
      enabled: section.enabled !== false,
      dataConfig: section.dataConfig && typeof section.dataConfig === "object" ? section.dataConfig : {},
      contentConfig: section.contentConfig && typeof section.contentConfig === "object" ? section.contentConfig : {},
      styleConfig: section.styleConfig && typeof section.styleConfig === "object" ? section.styleConfig : {},
    }));

const buildId = (name = "") => {
  const words = slugWords(name);
  return words.length ? `platform-${words.join("-")}` : "platform-ai-template";
};

export const buildPlatformTemplateAiPrompt = ({
  concept = "",
  audience = "",
  destination = "",
  style = "",
  offer = "",
} = {}) =>
  [
    "You are creating a reusable tourism website template for a page builder.",
    "Return only valid JSON with this shape: { \"template\": { \"name\": string, \"category\": string, \"pageType\": string, \"priceLabel\": string, \"purchaseStatus\": string, \"status\": string, \"preview\": string, \"bestFor\": string[], \"sections\": [] } }.",
    "Use only supported section objects with type, variant, order, enabled, dataConfig, contentConfig, and styleConfig.",
    "Avoid scripts, unsupported widgets, fake external integrations, or tenant-specific private data.",
    `Concept: ${concept || "premium tourism campaign"}`,
    `Audience: ${audience || "tour operators and travel clients"}`,
    `Destination: ${destination || "Tanzania and East Africa"}`,
    `Visual style: ${style || "light, premium, editorial tourism UI"}`,
    `Offer: ${offer || "tailor-made journeys and inquiry conversion"}`,
  ].join("\n");

export const buildDeterministicTemplateDraft = ({
  concept = "",
  audience = "",
  destination = "",
  style = "",
  offer = "",
} = {}) => {
  const conceptName = toTitleCase(concept || "Signature Tourism Campaign");
  const destinationName = toTitleCase(destination || "Tanzania");
  const audienceLabel = audience || "high-intent travel clients";
  const offerLabel = offer || "tailor-made journeys";
  const category = concept.toLowerCase().includes("beach")
    ? "Beach Escape"
    : concept.toLowerCase().includes("trek")
      ? "Trekking Campaign"
      : "Safari Campaign";

  return normalizeTemplateDraft({
    name: `${conceptName} Template`,
    category,
    pageType: "landing",
    priceLabel: "$249",
    purchaseStatus: "available",
    status: "draft",
    preview: `A ${style || "light premium"} tourism template for ${audienceLabel}, focused on ${offerLabel} in ${destinationName}.`,
    bestFor: [
      audienceLabel,
      `${destinationName} itineraries`,
      offerLabel,
    ],
    sections: [
      {
        type: "hero",
        variant: "cinematic",
        contentConfig: {
          eyebrow: `${destinationName} Travel Design`,
          headlineScript: conceptName,
          description: `A polished page-builder template for ${offerLabel}, built to be personalized for each client brand.`,
          primaryCtaLabel: "Start Planning",
          primaryCtaHref: "/contact",
        },
        styleConfig: {
          spacingPreset: "spacious",
          backgroundColor: "#f7f3ea",
          textColor: "#1f2933",
        },
      },
      {
        type: "feature-grid",
        variant: "editorial",
        contentConfig: {
          eyebrow: "Why This Works",
          heading: `Built for ${audienceLabel}`,
          description: "Use this structure to highlight signature routes, trust signals, and clear inquiry paths.",
        },
        styleConfig: {
          spacingPreset: "comfortable",
          backgroundColor: "#ffffff",
        },
      },
      {
        type: "cta",
        variant: "split",
        contentConfig: {
          eyebrow: "Client Ready",
          heading: "Personalize the copy, images, and sections before publishing",
          description: "The same template can serve many operators without making their websites look identical.",
          primaryCtaLabel: "Customize Template",
          primaryCtaHref: "/admin/page-builder",
        },
        styleConfig: {
          spacingPreset: "comfortable",
          backgroundColor: "#12312f",
          textColor: "#ffffff",
        },
      },
    ],
  });
};

export const normalizeTemplateDraft = (draft = {}) => {
  const name = draft.name?.toString().trim() || "AI Tourism Template";
  return {
    id: draft.id?.toString().trim() || buildId(name),
    name,
    category: draft.category?.toString().trim() || "Safari Campaign",
    pageType: draft.pageType?.toString().trim() || "landing",
    priceLabel: draft.priceLabel?.toString().trim() || "$249",
    purchaseStatus: ["included", "available"].includes(draft.purchaseStatus)
      ? draft.purchaseStatus
      : "available",
    status: ["published", "draft"].includes(draft.status) ? draft.status : "draft",
    previewImage: draft.previewImage?.toString().trim() || "",
    preview: draft.preview?.toString().trim() || "AI-generated tourism page-builder template draft.",
    bestFor: normalizeStringArray(draft.bestFor),
    sections: normalizeSections(draft.sections).length
      ? normalizeSections(draft.sections)
      : buildDeterministicTemplateDraft({ concept: name }).sections,
  };
};

export const parseTemplateBuilderResponse = (rawText = "") => {
  const parsed = JSON.parse(rawText);
  return normalizeTemplateDraft(parsed.template || parsed);
};
