const accentPalette = ["#0f766e", "#b45309", "#7c3aed", "#be123c", "#1d4ed8"];

const cloneValue = (value) => JSON.parse(JSON.stringify(value));

export const templateCatalog = [
  {
    id: "safari-signature-home",
    name: "Safari Signature Home",
    category: "Safari Operator",
    pageType: "home",
    priceLabel: "Purchased",
    purchaseStatus: "purchased",
    previewImage:
      "https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=1200&q=80",
    featuredRank: 98,
    releaseOrder: 3,
    preview: "A premium homepage for safari companies selling private and group itineraries.",
    bestFor: ["Luxury safari brands", "Private guide operators", "Tanzania and Kenya packages"],
    seo: {
      title: "Signature Safari Website Template",
      description: "Premium safari homepage template for tour operators.",
      keywords: ["safari website", "tour operator template", "travel website"],
    },
    sections: [
      {
        type: "hero",
        variant: "cinematic",
        order: 1,
        enabled: true,
        dataConfig: {},
        contentConfig: {
          eyebrow: "Signature Safaris",
          headlineScript: "Wild Africa",
          description:
            "A cinematic homepage for operators who want high-trust safari storytelling, polished CTAs, and package discovery above the fold.",
          primaryCtaLabel: "Plan A Safari",
          primaryCtaHref: "/plan-my-trip",
          secondaryCtaLabel: "View Packages",
          secondaryCtaHref: "/packages",
          imageSlides: [
            "https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=1600&q=80",
            "https://images.unsplash.com/photo-1547970810-dc1eac37d174?auto=format&fit=crop&w=1600&q=80",
          ],
        },
        styleConfig: { accentColor: "#0f766e", spacingPreset: "spacious" },
      },
      {
        type: "featuredPackages",
        variant: "popular-grid",
        order: 2,
        enabled: true,
        dataConfig: { source: "tours", limit: 6 },
        contentConfig: {
          prefixLabel: "Featured",
          scriptLabel: "Safari",
          suffixLabel: "Trips",
          introText: "Showcase the itineraries that convert curious travelers into qualified leads.",
        },
        styleConfig: { spacingPreset: "comfortable" },
      },
      {
        type: "reviewWall",
        variant: "default",
        order: 3,
        enabled: true,
        dataConfig: {},
        contentConfig: {
          notes: "Use verified traveler proof near the buying decision.",
        },
        styleConfig: { backgroundColor: "#f8fafc", spacingPreset: "comfortable" },
      },
      {
        type: "cta",
        variant: "trip-cta",
        order: 4,
        enabled: true,
        dataConfig: {},
        contentConfig: {
          heading: "Ready to shape your",
          subheading: "next safari?",
          description: "Invite travelers to request a tailor-made itinerary while the excitement is still fresh.",
          primaryLabel: "Start Planning",
          primaryHref: "/plan-my-trip",
          secondaryLabel: "Contact Us",
          secondaryHref: "/contact",
        },
        styleConfig: { accentColor: "#0f766e", spacingPreset: "spacious" },
      },
    ],
  },
  {
    id: "kilimanjaro-expedition-home",
    name: "Kilimanjaro Expedition Home",
    category: "Trekking",
    pageType: "home",
    priceLabel: "Included",
    purchaseStatus: "included",
    previewImage:
      "https://images.unsplash.com/photo-1521150932951-303a95503ed3?auto=format&fit=crop&w=1200&q=80",
    featuredRank: 88,
    releaseOrder: 2,
    preview: "A route-led homepage for Kilimanjaro, mountain trekking, and adventure travel brands.",
    bestFor: ["Kilimanjaro operators", "Adventure companies", "Route comparison content"],
    seo: {
      title: "Kilimanjaro Trekking Website Template",
      description: "Adventure homepage template for trekking operators.",
      keywords: ["kilimanjaro website", "trekking template", "adventure travel"],
    },
    sections: [
      {
        type: "hero",
        variant: "cinematic",
        order: 1,
        enabled: true,
        dataConfig: {},
        contentConfig: {
          eyebrow: "Summit Ready",
          headlineScript: "Kilimanjaro",
          description:
            "A focused template for operators who need route confidence, safety proof, and clear expedition planning pathways.",
          primaryCtaLabel: "Compare Routes",
          primaryCtaHref: "/packages",
          secondaryCtaLabel: "Ask A Guide",
          secondaryCtaHref: "/contact",
          imageSlides: [
            "https://images.unsplash.com/photo-1521150932951-303a95503ed3?auto=format&fit=crop&w=1600&q=80",
          ],
        },
        styleConfig: { accentColor: "#1d4ed8", spacingPreset: "spacious" },
      },
      {
        type: "destinations",
        variant: "quote-list",
        order: 2,
        enabled: true,
        dataConfig: { source: "taxonomy-destinations" },
        contentConfig: {
          title: "Routes, acclimatization, and summit planning",
          subtitle: "Mountain Operations",
          description: "Help travelers understand where they are going and why your planning process is safer.",
        },
        styleConfig: { spacingPreset: "comfortable" },
      },
      {
        type: "cta",
        variant: "trip-cta",
        order: 3,
        enabled: true,
        dataConfig: {},
        contentConfig: {
          heading: "Build a trek around",
          subheading: "your pace",
          description: "Guide travelers into a qualified inquiry with route, timing, and fitness context.",
          primaryLabel: "Plan My Trek",
          primaryHref: "/tailor-made",
        },
        styleConfig: { accentColor: "#1d4ed8", spacingPreset: "comfortable" },
      },
    ],
  },
  {
    id: "island-escape-landing",
    name: "Island Escape Landing",
    category: "Beach & Islands",
    pageType: "landing",
    priceLabel: "$149",
    purchaseStatus: "available",
    previewImage:
      "https://images.unsplash.com/photo-1586861635167-e5223aadc9fe?auto=format&fit=crop&w=1200&q=80",
    featuredRank: 74,
    releaseOrder: 1,
    preview: "A conversion landing page for Zanzibar beach packages, honeymoons, and add-on escapes.",
    bestFor: ["Beach extensions", "Honeymoon offers", "Seasonal campaign pages"],
    seo: {
      title: "Island Escape Landing Page Template",
      description: "Beach travel landing page template for tourism campaigns.",
      keywords: ["zanzibar template", "beach travel landing page", "honeymoon tours"],
    },
    sections: [
      {
        type: "hero",
        variant: "cinematic",
        order: 1,
        enabled: true,
        dataConfig: {},
        contentConfig: {
          eyebrow: "Island Escape",
          headlineScript: "Zanzibar",
          description:
            "A campaign-ready page for beach add-ons, honeymoon offers, and warm-weather seasonal travel.",
          primaryCtaLabel: "Request Dates",
          primaryCtaHref: "/contact",
        },
        styleConfig: { accentColor: "#b45309", spacingPreset: "spacious" },
      },
      {
        type: "cta",
        variant: "trip-cta",
        order: 2,
        enabled: true,
        dataConfig: {},
        contentConfig: {
          heading: "Turn safari plans into",
          subheading: "island days",
          description: "Invite travelers to add a relaxed coastal finish to an active itinerary.",
          primaryLabel: "Check Availability",
          primaryHref: "/contact",
        },
        styleConfig: { accentColor: "#b45309", spacingPreset: "comfortable" },
      },
    ],
  },
];

const mergeTemplateCatalog = (builtInTemplates = [], platformTemplates = []) => {
  const merged = new Map();

  builtInTemplates.forEach((template) => {
    merged.set(template.id, template);
  });
  platformTemplates.forEach((template) => {
    merged.set(template.id, template);
  });

  return Array.from(merged.values());
};

export const getTemplateCatalog = (platformTemplates = []) =>
  mergeTemplateCatalog(templateCatalog, platformTemplates).map((template) => cloneValue(template));

export const getTemplateById = (templateId) =>
  getTemplateCatalog().find((template) => template.id === templateId) || null;

export const isTemplateUsable = (template) =>
  ["purchased", "included", "assigned"].includes(template?.purchaseStatus);

export const resolveTemplateCatalogForTenant = (tenant = {}, platformTemplates = []) => {
  const purchasedTemplates = new Set(tenant?.purchasedTemplates || []);
  const requestedTemplates = new Set(tenant?.requestedTemplates || []);
  const activeAssignedTemplateId =
    tenant?.activeTemplateAssignment?.masterTemplateId || tenant?.activeAssignedTemplateId || "";

  return getTemplateCatalog(platformTemplates).map((template) => {
    if (activeAssignedTemplateId && template.id === activeAssignedTemplateId) {
      return {
        ...template,
        purchaseStatus: "assigned",
        priceLabel: "Assigned Site Template",
      };
    }

    if (purchasedTemplates.has(template.id)) {
      return {
        ...template,
        purchaseStatus: "purchased",
        priceLabel: "Purchased",
      };
    }

    if (requestedTemplates.has(template.id) && template.purchaseStatus === "available") {
      return {
        ...template,
        purchaseStatus: "requested",
        priceLabel: "Requested",
      };
    }

    return template;
  });
};

const getAccentForSeed = (seed = "") => {
  const total = String(seed)
    .split("")
    .reduce((sum, character) => sum + character.charCodeAt(0), 0);

  return accentPalette[total % accentPalette.length];
};

const personalizeText = (value, clientName) => {
  if (!value || !clientName) {
    return value;
  }

  if (value.includes(clientName)) {
    return value;
  }

  return `${value} Built for ${clientName}.`;
};

export const buildPersonalizedTemplatePage = (template, options = {}) => {
  if (!template?.id) {
    throw new Error("A valid template is required.");
  }

  if (!isTemplateUsable(template)) {
    throw new Error(`${template.name || "Template"} is not purchased yet.`);
  }

  const clientName = options.clientName || "this operator";
  const accentColor = getAccentForSeed(options.accentSeed || clientName || template.id);
  const sections = cloneValue(template.sections || []).map((section, index) => ({
    ...section,
    order: index + 1,
    contentConfig: {
      ...(section.contentConfig || {}),
      description: personalizeText(section.contentConfig?.description, clientName),
    },
    styleConfig: {
      ...(section.styleConfig || {}),
      accentColor,
    },
  }));

  return {
    pageType: template.pageType || "home",
    slug: template.pageType === "landing" ? "/landing" : "/",
    title: `${clientName} ${template.name}`,
    status: "draft",
    seo: cloneValue(template.seo || {}),
    sections,
    templateSource: {
      templateId: template.id,
      templateName: template.name,
      personalizedFor: clientName,
      personalizationNote:
        "Template copy and accent styling were adjusted before applying so tenant sites do not look identical.",
    },
  };
};
