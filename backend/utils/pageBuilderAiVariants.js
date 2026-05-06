const cloneSection = (section = {}) => ({
  ...section,
  dataConfig: { ...(section.dataConfig || {}) },
  contentConfig: { ...(section.contentConfig || {}) },
  styleConfig: { ...(section.styleConfig || {}) },
});

const normalizeSections = (sections = []) =>
  sections
    .filter((section) => section?.type)
    .map((section, index) => ({
      ...section,
      order: index + 1,
      enabled: section.enabled !== false,
      dataConfig: { ...(section.dataConfig || {}) },
      contentConfig: { ...(section.contentConfig || {}) },
      styleConfig: { ...(section.styleConfig || {}) },
    }));

const improveText = (value = "", fallback = "Curated journeys, beautifully planned") => {
  const text = String(value || "").trim();
  if (!text) {
    return fallback;
  }

  if (text.length > 90) {
    return text;
  }

  return `${text} with refined local detail`;
};

const buildSectionVariant = (section = {}, tone, index) => {
  const next = cloneSection(section);
  const contentConfig = next.contentConfig || {};

  next.contentConfig = {
    ...contentConfig,
    eyebrow: improveText(contentConfig.eyebrow, "Signature travel design"),
    headlineScript: improveText(
      contentConfig.headlineScript || contentConfig.heading || contentConfig.title,
      "Classic Tanzania, beautifully arranged"
    ),
    heading: improveText(
      contentConfig.heading || contentConfig.headlineScript || contentConfig.title,
      "Classic Tanzania, beautifully arranged"
    ),
    description: improveText(
      contentConfig.description || contentConfig.bodyText || contentConfig.body,
      "A calmer, more polished way to plan memorable journeys with local experts."
    ),
    primaryCtaLabel: contentConfig.primaryCtaLabel || contentConfig.ctaLabel || "Plan the journey",
  };

  next.styleConfig = {
    ...(next.styleConfig || {}),
    spacingPreset: index === 0 ? "spacious" : "comfortable",
    containerWidth: index === 2 ? "wide" : next.styleConfig?.containerWidth || "standard",
    borderRadius: index === 1 ? "xl" : next.styleConfig?.borderRadius || "",
    shadowLevel: index === 1 ? "sm" : next.styleConfig?.shadowLevel || "",
    backgroundColor:
      index === 0 ? "#0f172a" : index === 1 ? "#f8fafc" : next.styleConfig?.backgroundColor || "",
    textColor: index === 0 ? "#ffffff" : next.styleConfig?.textColor || "",
  };

  next.variantNotes = tone;
  return next;
};

export const normalizeAiVariantSections = ({ baseSections = [], incomingSections = [] }) => {
  const baseByType = new Map(baseSections.filter((section) => section?.type).map((section) => [section.type, section]));

  return normalizeSections(
    incomingSections
      .filter((section) => section?.type && baseByType.has(section.type))
      .map((section) => {
        const base = baseByType.get(section.type);
        return {
          ...cloneSection(base),
          ...section,
          type: base.type,
          dataConfig: {
            ...(base.dataConfig || {}),
            ...(section.dataConfig || {}),
          },
          contentConfig: {
            ...(base.contentConfig || {}),
            ...(section.contentConfig || {}),
          },
          styleConfig: {
            ...(base.styleConfig || {}),
            ...(section.styleConfig || {}),
          },
        };
      })
  );
};

export const buildAiVariantPrompt = ({
  scope = "section",
  customPrompt = "",
  pageConfig = {},
  targetSection = null,
}) => {
  const sections = scope === "page" ? pageConfig.sections || [] : [targetSection].filter(Boolean);

  return [
    "You are improving a tourism page builder layout with advanced classic tourism design.",
    "Preserve existing section types, CMS field names, routes, media URLs, and business meaning.",
    "Improve visual hierarchy, spacing, premium travel tone, CTA clarity, and refined classic appearance.",
    "Do not return unsupported section types or executable scripts.",
    customPrompt ? `Operator prompt: ${customPrompt}` : "",
    "Return only valid JSON with this shape: { \"variants\": [{ \"name\": string, \"summary\": string, \"sections\": [] }] }.",
    `Page context: ${JSON.stringify(
      {
        pageType: pageConfig.pageType,
        title: pageConfig.title,
        slug: pageConfig.slug,
        sections,
      },
      null,
      2
    )}`,
  ]
    .filter(Boolean)
    .join("\n");
};

export const buildClassicDesignVariants = ({ scope = "section", pageConfig = {}, targetSection = null }) => {
  const baseSections = normalizeSections(scope === "page" ? pageConfig.sections || [] : [targetSection].filter(Boolean));
  const tones = [
    ["Classic Editorial", "Refines hierarchy, spacing, and premium travel copy."],
    ["Quiet Luxury", "Adds softer surfaces, calmer rhythm, and elegant proof points."],
    ["Expedition Magazine", "Creates a more cinematic, content-rich travel feel."],
  ];

  return tones.map(([name, summary], index) => ({
    name,
    summary,
    sections: baseSections.map((section) => buildSectionVariant(section, summary, index)),
  }));
};

export const parseAiVariantResponse = ({ rawText = "", baseSections = [] }) => {
  const parsed = JSON.parse(rawText);
  const variants = Array.isArray(parsed?.variants) ? parsed.variants : [];

  return variants
    .map((variant, index) => ({
      name: variant.name || `AI Variant ${index + 1}`,
      summary: variant.summary || "AI-generated page builder variant.",
      sections: normalizeAiVariantSections({
        baseSections,
        incomingSections: Array.isArray(variant.sections) ? variant.sections : [],
      }),
    }))
    .filter((variant) => variant.sections.length);
};
