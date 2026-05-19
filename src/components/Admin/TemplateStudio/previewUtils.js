import { buildCanvasSectionStyle } from "./canvasSectionStyles.js";
import { DEFAULT_STUDIO_THEME_TOKENS } from "./studioTypes.js";

const SAMPLE_CMS_SOURCES = {
  tourPackages: [
    { title: "7-Day Northern Circuit Safari", meta: "Serengeti • Ngorongoro • Tarangire" },
    { title: "Kilimanjaro Machame Trek", meta: "6 nights • Guided summit route" },
    { title: "Zanzibar Escape", meta: "Stone Town • Kendwa • Snorkeling" },
  ],
  blogs: [
    { title: "When To Visit Tanzania", meta: "Seasonal guide • Wildlife timing" },
    { title: "How To Prepare For Kilimanjaro", meta: "Gear • Fitness • Acclimatization" },
    { title: "Safari Packing Checklist", meta: "Clothing • Camera • Essentials" },
  ],
  testimonials: [
    { title: "“Incredible planning and flawless guides.”", meta: "Asha & David • Verified traveler" },
    { title: "“The smoothest honeymoon trip we’ve ever taken.”", meta: "Lina • Zanzibar guest" },
    { title: "“Every transfer and lodge felt intentional.”", meta: "K. Mollel • Safari guest" },
  ],
  "taxonomies.destinations": [
    { title: "Serengeti", meta: "Big Five • Migration country" },
    { title: "Ngorongoro", meta: "Crater game drive • Luxury lodges" },
    { title: "Zanzibar", meta: "Beach stay • Spice tours" },
  ],
  "siteSettings.contact": {
    email: "journeys@example.com",
    phone: "+255 777 000 111",
    location: "Arusha, Tanzania",
  },
  inquiryForm: {
    fields: ["Full name", "Email address", "Travel dates", "Traveler count"],
    cta: "Plan My Trip",
  },
};

function firstBinding(section = {}) {
  return (section.bindings || [])[0] || null;
}

function buildBindingPreview(section = {}) {
  const binding = firstBinding(section);

  if (!binding?.sourceKey) {
    return null;
  }

  if (binding.sourceKey === "siteSettings.contact") {
    return {
      kind: "contact",
      data: SAMPLE_CMS_SOURCES["siteSettings.contact"],
      label: "Live contact details",
    };
  }

  if (binding.sourceKey === "inquiryForm") {
    return {
      kind: "form",
      data: SAMPLE_CMS_SOURCES.inquiryForm,
      label: "Inquiry capture form",
    };
  }

  const collection = SAMPLE_CMS_SOURCES[binding.sourceKey];

  if (Array.isArray(collection)) {
    return {
      kind: "collection",
      items: collection,
      label: binding.sourceKey,
      bindingType: binding.bindingType,
    };
  }

  return null;
}

export function buildPreviewPageModel({ page = {}, viewport = "desktop" } = {}) {
  const themeTokens = {
    ...DEFAULT_STUDIO_THEME_TOKENS,
    ...(page.themeTokens || {}),
  };

  return {
    pageName: page.pageName || page.title || "Untitled Page",
    slug: page.slug || "/",
    status: page.status || "draft",
    viewport,
    theme: {
      canvasBackground: themeTokens.canvasBackground || "#f4f7fb",
      contentWidth: themeTokens.contentWidth || "1600px",
      textColor: themeTokens.textColor,
      accentColor: themeTokens.accentColor,
    },
    sections: (page.sections || []).map((section) => ({
      ...section,
      previewData: buildBindingPreview(section),
      presentation: buildCanvasSectionStyle(section, viewport, false, themeTokens),
    })),
  };
}
