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

function buildCollectionItems(items = [], sourceKey = "") {
  return items
    .filter(Boolean)
    .slice(0, 3)
    .map((item, index) => {
      if (item?.title && item?.meta) {
        return item;
      }

      if (sourceKey === "tourPackages") {
        return {
          title: item?.name || item?.title || `Tour Package ${index + 1}`,
          meta:
            item?.location ||
            item?.destination ||
            item?.summary ||
            item?.duration ||
            "Tour package preview",
        };
      }

      if (sourceKey === "blogs") {
        return {
          title: item?.title || item?.name || `Blog Story ${index + 1}`,
          meta: item?.excerpt || item?.summary || item?.category || "Blog preview",
        };
      }

      if (sourceKey === "testimonials") {
        return {
          title:
            item?.title ||
            item?.quote ||
            item?.testimonial ||
            item?.message ||
            `Traveler Review ${index + 1}`,
          meta: item?.author || item?.name || item?.travelerName || "Verified traveler",
        };
      }

      if (sourceKey === "taxonomies.destinations") {
        return {
          title: item?.name || item?.title || `Destination ${index + 1}`,
          meta: item?.description || item?.summary || item?.slug || "Destination preview",
        };
      }

      return {
        title: item?.title || item?.name || `Preview Item ${index + 1}`,
        meta: item?.meta || item?.description || item?.summary || sourceKey || "CMS preview",
      };
    });
}

function resolveCmsSource(cmsSources = {}, sourceKey = "") {
  const explicitSource = cmsSources?.[sourceKey];

  if (explicitSource !== undefined) {
    return explicitSource;
  }

  if (sourceKey === "taxonomies.destinations") {
    const taxonomySource = cmsSources?.taxonomies?.destinations;

    if (taxonomySource !== undefined) {
      return taxonomySource;
    }
  }

  if (sourceKey === "siteSettings.contact") {
    const siteSettings = cmsSources?.siteSettings;

    if (siteSettings) {
      return {
        email: siteSettings.email || siteSettings.contactEmail || "",
        phone: siteSettings.phone || siteSettings.contactPhone || "",
        location: siteSettings.location || siteSettings.address || "",
      };
    }
  }

  return SAMPLE_CMS_SOURCES[sourceKey];
}

function firstBinding(section = {}) {
  return (section.bindings || [])[0] || null;
}

function buildBindingPreview(section = {}, cmsSources = {}) {
  const binding = firstBinding(section);

  if (!binding?.sourceKey) {
    return null;
  }

  if (binding.sourceKey === "siteSettings.contact") {
    const data = resolveCmsSource(cmsSources, "siteSettings.contact");
    return {
      kind: "contact",
      data,
      label: "Live contact details",
    };
  }

  if (binding.sourceKey === "inquiryForm") {
    const data = resolveCmsSource(cmsSources, "inquiryForm");
    return {
      kind: "form",
      data,
      label: "Inquiry capture form",
    };
  }

  const collection = resolveCmsSource(cmsSources, binding.sourceKey);

  if (Array.isArray(collection)) {
    return {
      kind: "collection",
      items: buildCollectionItems(collection, binding.sourceKey),
      label: binding.sourceKey,
      bindingType: binding.bindingType,
    };
  }

  return null;
}

export function buildPreviewPageModel({ page = {}, viewport = "desktop", cmsSources = {} } = {}) {
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
      previewData: buildBindingPreview(section, cmsSources),
      presentation: buildCanvasSectionStyle(section, viewport, false, themeTokens),
    })),
  };
}
