export const LEGACY_TENANT_SLUG = "maz-expeditions";
export const LEGACY_TENANT_NAME = "MAZ Expeditions";
export const LEGACY_TENANT_SUBDOMAIN = "maz";
export const LEGACY_TENANT_DOMAINS = [
  "mazexpeditions.com",
  "www.mazexpeditions.com",
  "tourism-website-inky.vercel.app",
];

export const DEFAULT_TENANT_THEME = {
  primaryColor: "#0d9488",
  secondaryColor: "#eab308",
  accentColor: "#f97316",
  backgroundColor: "#ffffff",
  surfaceColor: "#f8fafc",
  textColor: "#1e293b",
  headingColor: "#0f172a",
  headingFont: "'Playfair Display', serif",
  bodyFont: "'Montserrat', sans-serif",
  borderRadius: "1rem",
  cardRadius: "1.5rem",
  buttonRadius: "9999px",
  shadowStyle: "0 10px 30px rgba(15, 23, 42, 0.12)",
  spacingScale: "1",
};

export const DEFAULT_TENANT_SITE_CONFIG = {
  homepageConfig: {
    pageType: "legacy-home",
    sections: [],
  },
  navigationConfig: {
    ctaLabel: "PLAN MY TRIP",
    ctaHref: "/plan-my-trip",
    aboutLabel: "About Us",
    aboutHref: "/about",
  },
  footerConfig: {
    brandName: "MAZ Expeditions",
    brandDescription:
      "Tanzania-based safari experts, creating personalized African journeys with local expertise and trusted guides.",
    primaryCtaLabel: "Plan My Trip",
    primaryCtaHref: "/plan-my-trip",
    secondaryCtaLabel: "Articles",
    secondaryCtaHref: "/blogs",
    copyrightLabel: "Copyright ©2025 MAZ Expeditions | All rights reserved",
  },
  enabledFeatures: ["legacy-ui", "ai-content", "dynamic-menu"],
};
