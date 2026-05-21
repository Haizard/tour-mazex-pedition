import axios from "axios";
import { createGetRequestCache } from "./apiCache.js";

const isBrowser = typeof window !== "undefined";
const API_URL = isBrowser && window.location.hostname === "localhost"
  ? "http://127.0.0.1:5000/api"
  : "/api";
const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "::1"]);
const PLATFORM_HOSTNAMES = new Set([
  "mazexpeditions.vercel.app",
]);
const LEGACY_HOSTNAMES = new Set([
  "mazexpeditions.com",
  "www.mazexpeditions.com",
  "tourism-website-inky.vercel.app",
]);

export const isPlatformHostname = (hostname = "") => {
  const normalizedHostname = hostname.toString().trim().toLowerCase();
  return (
    PLATFORM_HOSTNAMES.has(normalizedHostname) ||
    (normalizedHostname.endsWith(".vercel.app") &&
      !LEGACY_HOSTNAMES.has(normalizedHostname))
  );
};

export const shouldUsePlatformBootstrapFallback = (hostname = "", pathname = "") =>
  !pathname.startsWith("/demo/") &&
  (
    isPlatformHostname(hostname) ||
    pathname === "/" ||
    pathname.startsWith("/platform") ||
    pathname.startsWith("/super-admin") ||
    pathname.startsWith("/discover") ||
    pathname.startsWith("/pricing") ||
    pathname.startsWith("/templates")
  );

export const getPlatformBootstrapFallback = () => ({
  isPlatform: true,
  tenant: null,
  theme: {
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
  },
  siteConfig: {
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
      brandName: "MAZ Expeditions Platform",
      brandDescription: "Tourism operators, templates, and marketplace tools in one platform.",
      primaryCtaLabel: "Explore Marketplace",
      primaryCtaHref: "/discover",
      secondaryCtaLabel: "See Pricing",
      secondaryCtaHref: "/pricing",
      copyrightLabel: "Copyright ©2025 MAZ Expeditions | All rights reserved",
    },
    enabledFeatures: ["legacy-ui", "ai-content", "dynamic-menu"],
  },
  siteSettings: null,
});

const emptySiteSettings = {
  facebook: "",
  twitter: "",
  instagram: "",
  whatsapp: "",
  youtube: "",
  reddit: "",
  logoUrl: "",
};

const platformDemoHotels = [
  {
    _id: "platform-hotel-arusha-garden-lodge",
    name: "Arusha Garden Lodge",
    slug: "arusha-garden-lodge",
    summary: "A calm garden lodge suited to arrival nights before northern circuit safaris.",
    description:
      "Arusha Garden Lodge is presented as a demo marketplace hotel for platform previews. It is useful for showing how travelers can assess stay style, destination fit, amenities, and itinerary intent without implying live rates or confirmed inventory.",
    destination: "Arusha",
    region: "Northern Tanzania",
    accommodationType: "lodge",
    amenities: ["Airport transfer", "Pool", "Garden rooms", "Breakfast"],
    roomStyleSummary: "quiet garden rooms and easy transfer access",
    photos: ["https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1400&q=80"],
    averageRating: 4.7,
    reviewCount: 18,
    sponsoredPlacement: true,
    published: true,
    marketplaceVisible: true,
    operator: {
      id: "platform-demo-operator",
      name: "MAZ Demo Operator",
      slug: "maz-demo",
    },
    trust: {
      reviewLabel: "4.7/5 from 18 reviews",
      summary: "Demo trust signals are grounded in visible sample fields for preview only.",
    },
    fitTags: ["Lodge stay", "Arusha", "Airport transfer", "Pool", "Garden rooms"],
  },
  {
    _id: "platform-hotel-serengeti-migration-camp",
    name: "Serengeti Migration Camp",
    slug: "serengeti-migration-camp",
    summary: "A tented camp preview for travelers comparing safari route comfort and wildlife access.",
    description:
      "Serengeti Migration Camp demonstrates how hotel detail pages can support comfort-level explanations, route fit, and itinerary add-on requests while keeping availability and prices human-confirmed.",
    destination: "Serengeti",
    region: "Northern Tanzania",
    accommodationType: "tented camp",
    amenities: ["Game drive access", "Full board", "Lounge", "Sundowner deck"],
    roomStyleSummary: "canvas suites close to game-drive routes",
    photos: ["https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1400&q=80"],
    averageRating: 4.9,
    reviewCount: 26,
    sponsoredPlacement: false,
    published: true,
    marketplaceVisible: true,
    operator: {
      id: "platform-demo-operator",
      name: "MAZ Demo Operator",
      slug: "maz-demo",
    },
    trust: {
      reviewLabel: "4.9/5 from 26 reviews",
      summary: "Demo review signals show where verified traveler proof will appear.",
    },
    fitTags: ["Tented camp stay", "Serengeti", "Game drive access", "Full board", "Lounge"],
  },
  {
    _id: "platform-hotel-zanzibar-boutique-retreat",
    name: "Zanzibar Boutique Retreat",
    slug: "zanzibar-boutique-retreat",
    summary: "A coastal retreat preview for post-safari rest, honeymoon extensions, and beach add-ons.",
    description:
      "Zanzibar Boutique Retreat helps preview how beach stays can be folded into wider itineraries after safari or trekking plans. Confirm live rates and reservation details with the operator.",
    destination: "Zanzibar",
    region: "Coast",
    accommodationType: "boutique hotel",
    amenities: ["Beach access", "Spa", "Sea-view rooms", "Restaurant"],
    roomStyleSummary: "sea-view rooms and quiet boutique spaces",
    photos: ["https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1400&q=80"],
    averageRating: 4.6,
    reviewCount: 14,
    sponsoredPlacement: false,
    published: true,
    marketplaceVisible: true,
    operator: {
      id: "platform-demo-operator",
      name: "MAZ Demo Operator",
      slug: "maz-demo",
    },
    trust: {
      reviewLabel: "4.6/5 from 14 reviews",
      summary: "Demo trust content is for interface preview and avoids live confirmation claims.",
    },
    fitTags: ["Boutique hotel stay", "Zanzibar", "Beach access", "Spa", "Sea-view rooms"],
  },
];

const buildPlatformDemoHotelDetail = (hotel) => ({
  ...hotel,
  geo: { latitude: null, longitude: null },
  partnerAccountId: "",
  conversion: {
    sendInquiry: {
      hotelId: hotel._id,
      hotelName: hotel.name,
      hotelIntentType: "direct-hotel",
    },
    requestInItinerary: {
      hotelId: hotel._id,
      hotelName: hotel.name,
      hotelIntentType: "itinerary-add-on",
    },
  },
  aiConcierge: {
    groundingWarning:
      "AI guidance is based on known hotel fields and must not invent availability, prices, or confirmations.",
  },
});

export const getPlatformPublicApiFallback = (url = "") => {
  const path = String(url || "").split("?")[0];

  if (path === "/hotels/public") {
    return { hotels: platformDemoHotels };
  }

  if (path.startsWith("/hotels/public/")) {
    const slug = decodeURIComponent(path.replace("/hotels/public/", ""));
    const hotel = platformDemoHotels.find((item) => item.slug === slug);
    return hotel ? buildPlatformDemoHotelDetail(hotel) : undefined;
  }

  if (
    path === "/tours" ||
    path === "/blogs" ||
    path === "/menu-items" ||
    path === "/taxonomies" ||
    path === "/bookings/public-testimonials" ||
    path === "/gallery" ||
    path === "/home-content" ||
    path === "/visionaries" ||
    path === "/faqs"
  ) {
    return [];
  }

  if (path === "/site-settings") {
    return emptySiteSettings;
  }

  if (path === "/page-config/home") {
    return {
      pageType: "home",
      slug: "/",
      title: "Home",
      status: "published",
      seo: {},
      sections: [],
      tenantId: null,
    };
  }

  return undefined;
};

const shouldUsePlatformApiFallback = (url = "") =>
  isBrowser &&
  shouldUsePlatformBootstrapFallback(window.location.hostname, window.location.pathname) &&
  getPlatformPublicApiFallback(url) !== undefined;

const API = axios.create({ baseURL: API_URL });
const getRequestCache = createGetRequestCache({ ttlMs: 8000 });

const getDemoTenantSlug = () => {
  if (!isBrowser) {
    return "";
  }

  const match = window.location.pathname.match(/^\/demo\/([^/?#]+)/);
  return match ? decodeURIComponent(match[1]).trim().toLowerCase() : "";
};

const getTenantHeaders = () => {
  if (!isBrowser) {
    return {};
  }

  const hostname = window.location.hostname.toLowerCase();
  const demoTenantSlug = getDemoTenantSlug();
  const storedTenantSlug = window.localStorage.getItem("activeTenantSlug");

  if (demoTenantSlug) {
    return {
      "x-tenant-slug": demoTenantSlug,
      "x-tenant-subdomain": demoTenantSlug,
      "x-tenant-source": "demo",
    };
  }

  if (storedTenantSlug && LOCAL_HOSTNAMES.has(hostname)) {
    return { "x-tenant-slug": storedTenantSlug };
  }

  // On the default production domains, trust hostname-based tenant resolution
  // instead of any stale localStorage override from local tenant testing.
  if (storedTenantSlug && (LEGACY_HOSTNAMES.has(hostname) || isPlatformHostname(hostname))) {
    window.localStorage.removeItem("activeTenantSlug");
  }

  if (LOCAL_HOSTNAMES.has(hostname)) {
    return { "x-tenant-slug": "maz-expeditions" };
  }

  return {};
};

const getAdminHeaders = () => {
  if (!isBrowser) {
    return {};
  }

  const token = window.localStorage.getItem("adminAuthToken");

  if (!token) {
    return {};
  }

  return {
    Authorization: `Bearer ${token}`,
  };
};

const getPlatformAdminHeaders = () => {
  if (!isBrowser) {
    return {};
  }

  const token = window.localStorage.getItem("platformAdminAuthToken");

  if (!token) {
    return {};
  }

  return {
    Authorization: `Bearer ${token}`,
  };
};

const getHotelPartnerHeaders = () => {
  if (!isBrowser) {
    return {};
  }

  const token = window.localStorage.getItem("hotelPartnerAuthToken");

  if (!token) {
    return {};
  }

  return {
    Authorization: `Bearer ${token}`,
  };
};

const getAuthHeadersForUrl = (url = "") => {
  if (url.includes("/hotel-partner")) {
    return getHotelPartnerHeaders();
  }

  const adminHeaders = getAdminHeaders();
  const platformHeaders = getPlatformAdminHeaders();

  if (url.includes("/platform-") || url.includes("/tenant/")) {
    return platformHeaders.Authorization ? platformHeaders : adminHeaders;
  }

  return adminHeaders.Authorization ? adminHeaders : platformHeaders;
};

const stableStringify = (value) => {
  if (!value || typeof value !== "object") {
    return JSON.stringify(value ?? null);
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }

  return `{${Object.keys(value)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
    .join(",")}}`;
};

const buildGetCacheKey = (url, config = {}) => {
  const headers = Object.assign(
    {},
    getTenantHeaders(),
    getAuthHeadersForUrl(url),
    config.headers || {}
  );

  return stableStringify({
    url,
    params: config.params || null,
    headers,
  });
};

export const clearApiGetCache = () => {
  getRequestCache.clear();
};

const cachedGet = (url, config = {}, options = {}) =>
  shouldUsePlatformApiFallback(url)
    ? Promise.resolve({ data: getPlatformPublicApiFallback(url) })
    :
  getRequestCache.get(
    buildGetCacheKey(url, config),
    () => API.get(url, config),
    options
  );

API.interceptors.request.use((config) => {
  const tenantHeaders = getTenantHeaders();
  const authHeader = getAuthHeadersForUrl(config.url);

  config.headers = Object.assign(
    {},
    config.headers || {},
    tenantHeaders,
    authHeader
  );

  return config;
});

// Response Interceptor for global error handling
API.interceptors.response.use(
  (response) => {
    if (response.config?.method && response.config.method !== "get") {
      clearApiGetCache();
    }

    return response;
  },
  (error) => {
    const requestUrl = error.config?.url || "";
    const isLoginRequest =
      requestUrl.includes("/auth/login") ||
      requestUrl.includes("/hotel-partner-auth/login") ||
      requestUrl.includes("/platform-auth/login");

    // A login request returning 401 is just wrong credentials. Other 401s mean
    // a stored session expired and should redirect to the matching admin login.
    if (error.response && error.response.status === 401 && !isLoginRequest && isBrowser) {
      const isAuthPath =
        window.location.pathname.includes("/admin") ||
        window.location.pathname.includes("/platform") ||
        window.location.pathname.includes("/super-admin") ||
        window.location.pathname.includes("/login");

      if (isAuthPath) {
        console.warn("Session expired. Clearing local auth state and redirecting...");
        window.localStorage.removeItem("adminAuthToken");
        window.localStorage.removeItem("platformAdminAuthToken");
        window.localStorage.removeItem("hotelPartnerAuthToken");

        if (!window.location.pathname.endsWith("/login")) {
          const isPlatformPath =
            window.location.pathname.includes("/platform") ||
            window.location.pathname.includes("/super-admin");
          window.location.href = isPlatformPath
            ? "/platform/login?expired=true"
            : "/admin/login?expired=true";
        }
      }
    } else if (isLoginRequest && error.response?.status === 401) {
      console.error("Login failed: Invalid credentials.", error.response.data?.message || "");
    } else if (error.response) {
      console.error(`API Error (${error.response.status}):`, error.response.data?.message || error.message);
    }
    
    return Promise.reject(error);
  }
);

export const loginAdmin = (data) => API.post("/auth/login", data);
export const fetchAdminSession = () => API.get("/auth/me");
export const loginPlatformAdmin = (data) =>
  API.post("/platform-auth/login", data, {
    headers: getPlatformAdminHeaders(),
  });
export const fetchPlatformAdminSession = () =>
  API.get("/platform-auth/me", {
    headers: getPlatformAdminHeaders(),
  });
export const loginHotelPartnerAdmin = (data) => API.post("/hotel-partner-auth/login", data);
export const fetchHotelPartnerSession = () =>
  API.get("/hotel-partner-auth/me", {
    headers: getHotelPartnerHeaders(),
  });
export const fetchHotelPartnerHotels = () =>
  cachedGet("/hotel-partner/hotels", {
    headers: getHotelPartnerHeaders(),
  });
export const updateHotelPartnerHotel = (hotelId, data) =>
  API.patch(`/hotel-partner/hotels/${hotelId}`, data, {
    headers: getHotelPartnerHeaders(),
  });
export const fetchHotelPartnerAccommodationRequests = (params = {}) =>
  cachedGet("/hotel-partner/accommodation-requests", {
    params,
    headers: getHotelPartnerHeaders(),
  });
export const updateHotelPartnerAccommodationRequest = (requestId, data) =>
  API.patch(`/hotel-partner/accommodation-requests/${requestId}`, data, {
    headers: getHotelPartnerHeaders(),
  });
export const fetchPlatformSummary = () =>
  cachedGet("/platform-admin/summary", {
    headers: getPlatformAdminHeaders(),
  });
export const fetchPlatformTenants = () =>
  cachedGet("/platform-admin/tenants", {
    headers: getPlatformAdminHeaders(),
  });
export const fetchTemplateMarketplace = () => cachedGet("/page-builder-templates");
export const fetchPlatformPageBuilderTemplates = () =>
  cachedGet("/platform-admin/page-builder-templates", {
    headers: getPlatformAdminHeaders(),
  });
export const fetchPlatformTemplateAssignments = () =>
  cachedGet("/platform-admin/template-assignments", {
    headers: getPlatformAdminHeaders(),
  });
export const fetchPlatformTenantActiveTemplateAssignment = (tenantId) =>
  cachedGet(`/platform-admin/template-assignments/${tenantId}/active`, {
    headers: getPlatformAdminHeaders(),
  });
export const assignPlatformTemplateToTenant = (data) =>
  API.post("/platform-admin/template-assignments", data, {
    headers: getPlatformAdminHeaders(),
  });
export const createPlatformPageBuilderTemplate = (data) =>
  API.post("/platform-admin/page-builder-templates", data, {
    headers: getPlatformAdminHeaders(),
  });
export const generatePlatformPageBuilderTemplateDraft = (data) =>
  API.post("/platform-admin/page-builder-templates/ai-draft", data, {
    headers: getPlatformAdminHeaders(),
  });
export const createPlatformPageBuilderTemplateFromStudio = (data) =>
  API.post("/platform-admin/page-builder-templates/import", data, {
    headers: getPlatformAdminHeaders(),
  });
export const createPlatformTenant = (data) =>
  API.post("/platform-admin/tenants", data, {
    headers: getPlatformAdminHeaders(),
  });
export const fetchPlatformTenantSupport = (tenantId, options = {}) =>
  cachedGet(`/platform-admin/tenants/${tenantId}/support`, {
    params: options.mode ? { mode: options.mode } : undefined,
    headers: getPlatformAdminHeaders(),
  });
export const fetchPlatformTenantMarketing = (tenantId) =>
  cachedGet(`/platform-admin/tenants/${tenantId}/marketing`, {
    headers: getPlatformAdminHeaders(),
  });
export const fetchPlatformTenantPageConfig = (tenantId, pageType = "home") =>
  cachedGet(`/platform-admin/tenants/${tenantId}/page-config/${encodeURIComponent(pageType)}`, {
    headers: getPlatformAdminHeaders(),
  });
export const fetchPlatformTenantTemplateStudioPage = (tenantId, pageType = "home") =>
  cachedGet(`/platform-admin/tenants/${tenantId}/page-config/studio/${encodeURIComponent(pageType)}`, {
    headers: getPlatformAdminHeaders(),
  });
export const fetchPlatformTenantTemplateStudioActiveAssignment = (tenantId) =>
  cachedGet(`/platform-admin/tenants/${tenantId}/page-config/studio/assignment`, {
    headers: getPlatformAdminHeaders(),
  });
export const fetchPlatformTenantPageConfigs = (tenantId) =>
  cachedGet(`/platform-admin/tenants/${tenantId}/page-configs`, {
    headers: getPlatformAdminHeaders(),
  });
export const updatePlatformTenant = (tenantId, data) =>
  API.put(`/platform-admin/tenants/${tenantId}`, data, {
    headers: getPlatformAdminHeaders(),
  });
export const updatePlatformTenantPageConfig = (tenantId, pageType = "home", data) =>
  API.put(`/platform-admin/tenants/${tenantId}/page-config/${encodeURIComponent(pageType)}`, data, {
    headers: getPlatformAdminHeaders(),
  });
export const updatePlatformTenantTemplateStudioPage = (tenantId, pageType = "home", studioPage) =>
  API.put(
    `/platform-admin/tenants/${tenantId}/page-config/studio/${encodeURIComponent(pageType)}`,
    { studioPage },
    {
      headers: getPlatformAdminHeaders(),
    }
  );
export const applyPlatformTenantPageBuilderTemplate = (tenantId, templateId) =>
  API.post(
    `/platform-admin/tenants/${tenantId}/page-config/templates/${encodeURIComponent(templateId)}/apply`,
    {},
    { headers: getPlatformAdminHeaders() }
  );
export const generatePlatformTenantPageBuilderVariants = (tenantId, pageType = "home", data) =>
  API.post(
    `/platform-admin/tenants/${tenantId}/page-config/${encodeURIComponent(pageType)}/ai-variants`,
    data,
    { headers: getPlatformAdminHeaders() }
  );
export const importPlatformTenantPageBuilderSource = (tenantId, data) =>
  API.post(`/platform-admin/tenants/${tenantId}/page-config/import-source`, data, {
    headers: getPlatformAdminHeaders(),
  });
export const importPlatformTenantTemplateStudioSource = (tenantId, data) =>
  API.post(`/platform-admin/tenants/${tenantId}/page-config/studio/import`, data, {
    headers: getPlatformAdminHeaders(),
  });
export const requestPlatformTenantTemplateStudioBindingSuggestions = (tenantId, data) =>
  API.post(`/platform-admin/tenants/${tenantId}/page-config/studio/binding-suggestions`, data, {
    headers: getPlatformAdminHeaders(),
  });
export const fetchPlatformTenantTemplateStudioReusableSections = (tenantId) =>
  cachedGet(`/platform-admin/tenants/${tenantId}/page-config/studio/reusable-sections`, {
    headers: getPlatformAdminHeaders(),
  });
export const createPlatformTenantTemplateStudioReusableSection = (tenantId, data) =>
  API.post(`/platform-admin/tenants/${tenantId}/page-config/studio/reusable-sections`, data, {
    headers: getPlatformAdminHeaders(),
  });
export const deletePlatformTenantTemplateStudioReusableSection = (tenantId, sectionId) =>
  API.delete(`/platform-admin/tenants/${tenantId}/page-config/studio/reusable-sections/${encodeURIComponent(sectionId)}`, {
    headers: getPlatformAdminHeaders(),
  });
export const fetchPlatformTenantSiteConfig = (tenantId) =>
  cachedGet(`/platform-admin/tenants/${tenantId}/site-config`, {
    headers: getPlatformAdminHeaders(),
  });
export const updatePlatformTenantSiteConfig = (tenantId, data) =>
  API.put(`/platform-admin/tenants/${tenantId}/site-config`, data, {
    headers: getPlatformAdminHeaders(),
  });
export const fetchPlatformTenantMenuItems = (tenantId) =>
  cachedGet(`/platform-admin/tenants/${tenantId}/menu-items`, {
    headers: getPlatformAdminHeaders(),
  });
export const createPlatformTenantMenuItem = (tenantId, data) =>
  API.post(`/platform-admin/tenants/${tenantId}/menu-items`, data, {
    headers: getPlatformAdminHeaders(),
  });
export const updatePlatformTenantMenuItem = (tenantId, menuItemId, data) =>
  API.put(`/platform-admin/tenants/${tenantId}/menu-items/${menuItemId}`, data, {
    headers: getPlatformAdminHeaders(),
  });
export const deletePlatformTenantMenuItem = (tenantId, menuItemId) =>
  API.delete(`/platform-admin/tenants/${tenantId}/menu-items/${menuItemId}`, {
    headers: getPlatformAdminHeaders(),
  });
export const resetPlatformTenantMenuItemsToDefaults = (tenantId) =>
  API.post(`/platform-admin/tenants/${tenantId}/menu-items/reset-defaults`, {}, {
    headers: getPlatformAdminHeaders(),
  });
export const updatePlatformTenantAdmin = (tenantId, data) =>
  API.patch(`/platform-admin/tenants/${tenantId}/admin`, data, {
    headers: getPlatformAdminHeaders(),
  });
export const markPlatformTenantDomainVerified = (tenantId, domain) =>
  API.post(
    `/platform-admin/tenants/${tenantId}/domains/${encodeURIComponent(domain)}/mark-verified`,
    {},
    {
      headers: getPlatformAdminHeaders(),
    }
  );
export const checkPlatformTenantDomainVerification = (tenantId, domain) =>
  API.post(
    `/platform-admin/tenants/${tenantId}/domains/${encodeURIComponent(domain)}/check`,
    {},
    {
      headers: getPlatformAdminHeaders(),
    }
  );
export const fetchPlatformTenantDomainSetupPlan = (tenantId, domain) =>
  API.get(
    `/platform-admin/tenants/${tenantId}/domains/${encodeURIComponent(domain)}/setup-plan`,
    {
      headers: getPlatformAdminHeaders(),
    }
  );
export const applyPlatformTenantManagedDns = (tenantId, domain) =>
  API.post(
    `/platform-admin/tenants/${tenantId}/domains/${encodeURIComponent(domain)}/apply-dns`,
    {},
    {
      headers: getPlatformAdminHeaders(),
    }
  );
export const renewPlatformTenantDomainService = (tenantId, data) =>
  API.post(`/platform-admin/tenants/${tenantId}/renew-domain-service`, data, {
    headers: getPlatformAdminHeaders(),
  });
export const fetchEmailConnections = () => API.get("/email/connections");
export const fetchEmailAudienceContacts = () => API.get("/email/audience-contacts");
export const createEmailAudienceContact = (data) =>
  API.post("/email/audience-contacts", data);
export const importEmailAudienceContactsFromLeads = () =>
  API.post("/email/audience-contacts/import-leads");
export const updateEmailAudienceContact = (contactId, data) =>
  API.patch(`/email/audience-contacts/${contactId}`, data);
export const deleteEmailAudienceContact = (contactId) =>
  API.delete(`/email/audience-contacts/${contactId}`);
export const fetchEmailProviders = () => API.get("/email/providers");
export const createEmailConnection = (data) => API.post("/email/connections", data);
export const runEmailConnectionHealthCheck = (connectionId) =>
  API.post(`/email/connections/${connectionId}/health-check`);
export const fetchEmailSyncJobs = () => API.get("/email/sync-jobs");
export const runEmailConnectionSync = (connectionId) =>
  API.post(`/email/connections/${connectionId}/sync`);
export const fetchEmailThreads = () => API.get("/email/threads");
export const linkEmailThread = (threadId, data) =>
  API.post(`/email/threads/${threadId}/link`, data);
export const updateEmailThread = (threadId, data) =>
  API.patch(`/email/threads/${threadId}`, data);
export const createEmailThread = (data) => API.post("/email/threads", data);
export const fetchUnifiedInboxItems = () => API.get("/unified-inbox");
export const recordUnifiedInboxAgentAction = (data) =>
  API.post("/unified-inbox/agent-actions", data);
export const fetchTenantBootstrap = () => {
  if (
    isBrowser &&
    shouldUsePlatformBootstrapFallback(window.location.hostname, window.location.pathname)
  ) {
    return Promise.resolve({ data: getPlatformBootstrapFallback() });
  }

  return API.get("/tenant/bootstrap", {
    headers: getTenantHeaders(),
    validateStatus: (status) => status < 500,
  }).then((response) => {
    if (response.status === 404 && isBrowser && !window.location.pathname.startsWith("/demo/")) {
      return { ...response, data: getPlatformBootstrapFallback() };
    }

    return response;
  });
};
export const fetchTenantSiteConfig = () => cachedGet("/tenant/site-config");
export const updateTenantSiteConfig = (data) => API.put("/tenant/site-config", data);
export const updateTenantDomainRequest = (data) => API.put("/tenant/domain-request", data);
export const updateTenantMarketplaceSettings = (data) =>
  API.put("/tenant/marketplace-settings", data);
export const requestTenantTemplate = (templateId) =>
  API.post(`/tenant/template-requests/${encodeURIComponent(templateId)}`, {});
export const fetchPageConfig = (pageType = "home") =>
  cachedGet(`/page-config/${encodeURIComponent(pageType)}`);
export const fetchPageConfigs = () => cachedGet("/page-config/list/all");
export const fetchTemplateStudioPage = (pageType = "home") =>
  cachedGet(`/page-config/studio/${encodeURIComponent(pageType)}`, {
    headers: getAuthHeadersForUrl("/page-config/studio"),
  });
export const fetchTemplateStudioActiveAssignment = () =>
  cachedGet("/page-config/studio/assignment", {
    headers: getAuthHeadersForUrl("/page-config/studio/assignment"),
  });
export const resolvePageConfigBySlug = (slug) =>
  cachedGet("/page-config/resolve/by-slug", {
    params: { slug },
  });
export const updatePageConfig = (pageType = "home", data) =>
  API.put(`/page-config/${encodeURIComponent(pageType)}`, data);
export const updateTemplateStudioPage = (pageType = "home", studioPage) =>
  API.put(
    `/page-config/studio/${encodeURIComponent(pageType)}`,
    { studioPage },
    {
      headers: getAuthHeadersForUrl("/page-config/studio"),
    }
  );
export const applyPageBuilderTemplate = (templateId) =>
  API.post(`/page-config/templates/${encodeURIComponent(templateId)}/apply`, {});
export const generatePageBuilderVariants = (pageType = "home", data) =>
  API.post(`/page-config/${encodeURIComponent(pageType)}/ai-variants`, data);
export const importPageBuilderSource = (data) =>
  API.post("/page-config/import-source", data);
export const importTemplateStudioSource = (data) =>
  API.post("/page-config/studio/import", data, {
    headers: getAuthHeadersForUrl("/page-config/studio/import"),
  });
export const requestTemplateStudioBindingSuggestions = (data) =>
  API.post("/page-config/studio/binding-suggestions", data, {
    headers: getAuthHeadersForUrl("/page-config/studio/binding-suggestions"),
  });
export const fetchTemplateStudioReusableSections = () =>
  cachedGet("/page-config/studio/reusable-sections", {
    headers: getAuthHeadersForUrl("/page-config/studio/reusable-sections"),
  });
export const createTemplateStudioReusableSection = (data) =>
  API.post("/page-config/studio/reusable-sections", data, {
    headers: getAuthHeadersForUrl("/page-config/studio/reusable-sections"),
  });
export const deleteTemplateStudioReusableSection = (sectionId) =>
  API.delete(`/page-config/studio/reusable-sections/${encodeURIComponent(sectionId)}`, {
    headers: getAuthHeadersForUrl("/page-config/studio/reusable-sections"),
  });
export const fetchTenantTheme = () => cachedGet("/tenant/bootstrap"); // Bootstrap contains theme
export const updateTenantTheme = (data) => API.put("/tenant/theme", data);

// Tour Packages
export const fetchTours = (params = "") => cachedGet(`/tours${params}`);
export const fetchTour = (id) => cachedGet(`/tours/${id}`);
export const fetchTourBySlug = (slug) =>
  cachedGet(`/tours/slug/${encodeURIComponent(slug)}`);
export const createTour = (newTour) => API.post("/tours", newTour);
export const updateTour = (id, updatedTour) =>
  API.put(`/tours/${id}`, updatedTour);
export const deleteTour = (id) => API.delete(`/tours/${id}`);
export const regenerateTourDescription = (data) =>
  API.post("/tours/regenerate-description", data);
export const generateTourSeo = (data) =>
  API.post("/tours/generate-seo", data);
export const generateFullTourPackage = (data) =>
  API.post("/tours/generate-full", data);

// Hotels
export const fetchHotels = () => cachedGet("/hotels");
export const createHotel = (data) => API.post("/hotels", data);
export const updateHotel = (id, data) => API.patch(`/hotels/${id}`, data);
export const deleteHotel = (id) => API.delete(`/hotels/${id}`);
export const createHotelPartnerAdmin = (id, data) =>
  API.post(`/hotels/${id}/partner-admins`, data);
export const reviewHotelPartnerProfileUpdate = (id, data) =>
  API.post(`/hotels/${id}/partner-profile-review`, data);
export const fetchPublicHotels = (params = {}) => cachedGet("/hotels/public", { params });
export const fetchPublicHotelBySlug = (slug) =>
  cachedGet(`/hotels/public/${encodeURIComponent(slug)}`);
export const requestHotelConciergeRecommendations = (data) =>
  API.post("/hotels/public/concierge/recommendations", data);

// Social Posts
export const fetchSocialPosts = (params = {}) =>
  cachedGet("/social-posts", { params });
export const fetchSocialAutomationDashboard = () =>
  cachedGet("/social-posts/dashboard");
export const generateSocialPost = (data) =>
  API.post("/social-posts/generate", data);
export const runScheduledSocialAutomation = () =>
  API.post("/social-posts/run-scheduled");
export const createSocialPost = (data) =>
  API.post("/social-posts", data);
export const updateSocialPost = (id, data) =>
  API.patch(`/social-posts/${id}`, data);
export const deleteSocialPost = (id) =>
  API.delete(`/social-posts/${id}`);
export const publishSocialPostLive = (id) =>
  API.post(`/social-accounts/social-posts/${id}/publish`);
export const fetchSocialAccounts = () => cachedGet("/social-accounts");
export const createSocialAccount = (data) => API.post("/social-accounts", data);
export const updateSocialAccount = (id, data) =>
  API.patch(`/social-accounts/${id}`, data);
export const deleteSocialAccount = (id) =>
  API.delete(`/social-accounts/${id}`);
export const verifySocialAccount = (id) =>
  API.post(`/social-accounts/${id}/verify`);
export const sendInquiryWhatsAppViaApi = (id, data = {}) =>
  API.post(`/social-accounts/inquiries/${id}/send-whatsapp`, data);

// Gallery
export const fetchGallery = () => cachedGet("/gallery");
export const createGallery = (newItem) => API.post("/gallery", newItem);
export const deleteGallery = (id) => API.delete(`/gallery/${id}`);

// Guide & Drivers
export const fetchGuideDrivers = (params = {}) => cachedGet("/guide-drivers", { params });
export const fetchGuideDriverDashboard = (params = {}) =>
  cachedGet("/guide-drivers/dashboard", { params });
export const createGuideDriver = (data) => API.post("/guide-drivers", data);
export const updateGuideDriver = (id, data) => API.patch(`/guide-drivers/${id}`, data);
export const deleteGuideDriver = (id) => API.delete(`/guide-drivers/${id}`);
export const fetchAccommodationReservations = (params = {}) =>
  cachedGet("/accommodations", { params });
export const fetchAccommodationDashboard = (params = {}) =>
  cachedGet("/accommodations/dashboard", { params });
export const createAccommodationReservation = (data) => API.post("/accommodations", data);
export const updateAccommodationReservation = (id, data) =>
  API.patch(`/accommodations/${id}`, data);
export const deleteAccommodationReservation = (id) =>
  API.delete(`/accommodations/${id}`);
export const fetchAirportPickups = (params = {}) => cachedGet("/airport-pickups", { params });
export const fetchAirportPickupDashboard = (params = {}) =>
  cachedGet("/airport-pickups/dashboard", { params });
export const createAirportPickup = (data) => API.post("/airport-pickups", data);
export const updateAirportPickup = (id, data) =>
  API.patch(`/airport-pickups/${id}`, data);
export const deleteAirportPickup = (id) => API.delete(`/airport-pickups/${id}`);
export const fetchPartnerAccounts = (params = {}) => cachedGet("/partners", { params });
export const createPartnerAccount = (data) => API.post("/partners", data);
export const updatePartnerAccount = (id, data) => API.patch(`/partners/${id}`, data);
export const deletePartnerAccount = (id) => API.delete(`/partners/${id}`);
export const fetchPaymentTransactions = (params = {}) => cachedGet("/payments", { params });
export const createPaymentTransaction = (data) => API.post("/payments", data);
export const updatePaymentTransaction = (id, data) => API.patch(`/payments/${id}`, data);
export const deletePaymentTransaction = (id) => API.delete(`/payments/${id}`);
export const fetchPublicPaymentCheckout = (token) => API.get(`/payments/checkout/${token}`);
export const respondToPublicPaymentCheckout = (token, data) =>
  API.post(`/payments/checkout/${token}/respond`, data);
export const fetchDynamicPricingRules = () => cachedGet("/dynamic-pricing");
export const fetchDynamicPricingDashboard = () => cachedGet("/dynamic-pricing/dashboard");
export const fetchBusinessTruthRegistry = () => API.get("/infrastructure/business-truth");
export const fetchInfrastructureHealth = () => API.get("/infrastructure/health");
export const fetchEcosystemIntelligence = () => API.get("/infrastructure/intelligence");
export const fetchDemandForecast = () => API.get("/infrastructure/demand-forecast");
export const fetchRevenueRecordReadModel = (params = {}) =>
  API.get("/infrastructure/revenue-records", { params });
export const fetchTravelerRecordReadModel = (params = {}) =>
  API.get("/infrastructure/traveler-records", { params });
export const fetchOperationsRecordReadModel = (params = {}) =>
  API.get("/infrastructure/operations-records", { params });
export const fetchPartnerRecordReadModel = (params = {}) =>
  API.get("/infrastructure/partner-records", { params });
export const fetchMediaRecordReadModel = (params = {}) =>
  API.get("/infrastructure/media-records", { params });
export const fetchCompetitorRecordReadModel = (params = {}) =>
  API.get("/infrastructure/competitor-records", { params });
export const fetchAssistantRecordReadModel = (params = {}) =>
  API.get("/infrastructure/assistant-records", { params });
export const fetchEngagementRecordReadModel = (params = {}) =>
  API.get("/infrastructure/engagement-records", { params });
export const fetchDistributionSummary = () => API.get("/distribution/summary");
export const fetchDistributionBootstrap = (params = {}) =>
  API.get("/distribution/bootstrap", { params });
export const fetchReferralPartners = (params = {}) =>
  cachedGet("/distribution/partners", { params });
export const createReferralPartner = (data) =>
  API.post("/distribution/partners", data);
export const deleteReferralPartner = (id) =>
  API.delete(`/distribution/partners/${id}`);
export const analyzeTourismLeadDiscoverySource = (data) =>
  API.post("/marketplace/lead-discovery/analyze", data);
export const fetchTourismLeadDiscoveryCandidates = (params = {}) =>
  cachedGet("/marketplace/lead-discovery/candidates", { params });
export const fetchMarketplaceReviews = (tourId, params = {}) =>
  cachedGet(`/marketplace/tours/${tourId}/reviews`, { params });
export const createMarketplaceReview = (payload) =>
  API.post("/marketplace/reviews", payload);
export const updateMarketplaceReviewModeration = (id, payload) =>
  API.patch(`/marketplace/reviews/${id}`, payload);
export const fetchMarketplacePhotos = (tourId) =>
  cachedGet(`/marketplace/tours/${tourId}/photos`);
export const createMarketplacePhoto = (payload) =>
  API.post("/marketplace/photos", payload);
export const updateMarketplacePhotoModeration = (id, payload) =>
  API.patch(`/marketplace/photos/${id}`, payload);
export const fetchMarketplaceQuestions = (tourId) =>
  cachedGet(`/marketplace/tours/${tourId}/questions`);
export const createMarketplaceQuestion = (payload) =>
  API.post("/marketplace/questions", payload);
export const answerMarketplaceQuestion = (questionId, payload) =>
  API.post(`/marketplace/questions/${questionId}/answers`, payload);
export const updateMarketplaceQuestionModeration = (id, payload) =>
  API.patch(`/marketplace/questions/${id}`, payload);
export const fetchMarketplaceModerationQueue = () =>
  cachedGet("/marketplace/moderation");
export const fetchMarketplaceOperationsSnapshot = () =>
  cachedGet("/marketplace/operations");
export const fetchMarketplaceAvailabilityWorkspace = () =>
  cachedGet("/marketplace/availability");
export const fetchMarketplaceAvailabilityTourSchedule = (tourId) =>
  cachedGet(`/marketplace/availability/${tourId}`);
export const createMarketplaceAvailabilityEntry = (tourId, payload) =>
  API.post(`/marketplace/availability/${tourId}/entries`, payload);
export const updateMarketplaceAvailabilityEntry = (tourId, dateKey, payload) =>
  API.patch(`/marketplace/availability/${tourId}/entries/${dateKey}`, payload);
export const deleteMarketplaceAvailabilityEntry = (tourId, dateKey) =>
  API.delete(`/marketplace/availability/${tourId}/entries/${dateKey}`);
export const applyMarketplaceAvailabilityBulkAction = (tourId, payload) =>
  API.post(`/marketplace/availability/${tourId}/bulk`, payload);
export const fetchMarketplaceSavedTrips = (params = {}) =>
  cachedGet("/marketplace/saved-trips", { params });
export const updateMarketplaceSavedTrips = (payload) =>
  API.post("/marketplace/saved-trips", payload);
export const updateMarketplaceSavedTripReminders = (payload) =>
  API.post("/marketplace/saved-trips/reminders", payload);
export const fetchMarketplaceComparisons = (params = {}) =>
  cachedGet("/marketplace/comparisons", { params });
export const updateMarketplaceComparisons = (payload) =>
  API.post("/marketplace/comparisons", payload);
export const fetchMarketplaceMapRegions = () =>
  cachedGet("/marketplace/map/regions");
export const createMarketplaceInstantBookingIntent = (payload) =>
  API.post("/marketplace/instant-booking-intents", payload);
export const createDynamicPricingRule = (data) => API.post("/dynamic-pricing", data);
export const updateDynamicPricingRule = (id, data) => API.patch(`/dynamic-pricing/${id}`, data);
export const deleteDynamicPricingRule = (id) => API.delete(`/dynamic-pricing/${id}`);
export const fetchCompetitorInsights = (params = {}) =>
  cachedGet("/competitor-intelligence", { params });
export const createCompetitorInsight = (data) => API.post("/competitor-intelligence", data);
export const updateCompetitorInsight = (id, data) => API.patch(`/competitor-intelligence/${id}`, data);
export const deleteCompetitorInsight = (id) => API.delete(`/competitor-intelligence/${id}`);
export const fetchLanguageAssistantProfiles = (params = {}) =>
  cachedGet("/language-assistants", { params });
export const createLanguageAssistantProfile = (data) => API.post("/language-assistants", data);
export const updateLanguageAssistantProfile = (id, data) => API.patch(`/language-assistants/${id}`, data);
export const deleteLanguageAssistantProfile = (id) => API.delete(`/language-assistants/${id}`);
export const fetchTravelDocumentationGuides = (params = {}) =>
  cachedGet("/travel-docs", { params });
export const createTravelDocumentationGuide = (data) => API.post("/travel-docs", data);
export const updateTravelDocumentationGuide = (id, data) => API.patch(`/travel-docs/${id}`, data);
export const deleteTravelDocumentationGuide = (id) => API.delete(`/travel-docs/${id}`);

// Bookings
export const fetchBookings = (params = {}) => cachedGet("/bookings", { params });
export const createBooking = (newBooking) => API.post("/bookings", newBooking);
export const updateBookingStatus = (id, status) =>
  API.patch(`/bookings/${id}`, { status });
export const deleteBooking = (id) => API.delete(`/bookings/${id}`);
export const fetchReviewRequests = (params = {}) =>
  cachedGet("/bookings/review-requests", { params });
export const generateBookingReviewRequest = (id) =>
  API.post(`/bookings/${id}/review-request`);
export const updateReviewRequest = (id, data) =>
  API.patch(`/bookings/review-requests/${id}`, data);
export const fetchRepeatCustomerCampaigns = (params = {}) =>
  cachedGet("/bookings/repeat-customer-campaigns", { params });
export const generateRepeatCustomerCampaign = (id) =>
  API.post(`/bookings/${id}/repeat-customer-campaign`);
export const updateRepeatCustomerCampaign = (id, data) =>
  API.patch(`/bookings/repeat-customer-campaigns/${id}`, data);
export const fetchPublicFeedback = (token) =>
  API.get(`/bookings/public-feedback/${token}`);
export const submitPublicFeedback = (token, data) =>
  API.post(`/bookings/public-feedback/${token}`, data);
export const fetchPublicTestimonials = () =>
  shouldUsePlatformApiFallback("/bookings/public-testimonials")
    ? Promise.resolve({ data: getPlatformPublicApiFallback("/bookings/public-testimonials") })
    : API.get("/bookings/public-testimonials");
export const fetchFeedbackReport = () =>
  API.get("/bookings/feedback-report");

// Blogs
export const fetchBlogs = () => cachedGet("/blogs");
export const fetchBlog = (id) => cachedGet(`/blogs/${id}`);
export const fetchBlogBySlug = (slug) =>
  cachedGet(`/blogs/slug/${encodeURIComponent(slug)}`);
export const createBlog = (data) => API.post("/blogs", data);
export const updateBlog = (id, data) => API.put(`/blogs/${id}`, data);
export const deleteBlog = (id) => API.delete(`/blogs/${id}`);
export const generateAiBlog = () => API.post("/blogs/auto-generate");
export const regenerateBlogContent = (data) =>
  API.post("/blogs/regenerate-content", data);
export const generateBlogSeo = (data) =>
  API.post("/blogs/generate-seo", data);
export const repurposeBlogContent = (data) =>
  API.post("/marketing/repurpose-blog", data);
export const fetchCampaigns = () => cachedGet("/marketing/campaigns");
export const generateCampaignDraft = (data) =>
  API.post("/marketing/campaigns/generate", data);
export const createCampaign = (data) =>
  API.post("/marketing/campaigns", data);
export const updateCampaign = (id, data) =>
  API.patch(`/marketing/campaigns/${id}`, data);
export const deleteCampaign = (id) =>
  API.delete(`/marketing/campaigns/${id}`);

// Custom Inquiries
export const fetchInquiries = (params = { source: "postgres" }) =>
  cachedGet("/custom-inquiries", { params });
export const createInquiry = (data) => API.post("/custom-inquiries", data);
export const createWhatsAppLead = (data) =>
  API.post("/custom-inquiries/whatsapp-lead", data);
export const updateInquiryStatus = (id, status) =>
  API.patch(`/custom-inquiries/${id}`, { status });
export const updateInquiryLeadStage = (id, leadStage) =>
  API.patch(`/custom-inquiries/${id}`, { leadStage });
export const fetchInquiryQuotes = (id, params = { source: "postgres" }) =>
  API.get(`/custom-inquiries/${id}/quotes`, { params });
export const generateInquiryQuote = (id) =>
  API.post(`/custom-inquiries/${id}/generate-quote`);
export const sendInquiryQuote = (inquiryId, quoteId) =>
  API.post(`/custom-inquiries/${inquiryId}/quotes/${quoteId}/send`);
export const fetchPublicQuote = (token) =>
  API.get(`/custom-inquiries/public-quote/${token}`);
export const respondToPublicQuote = (token, data) =>
  API.post(`/custom-inquiries/public-quote/${token}/respond`, data);
export const deleteInquiry = (id) => API.delete(`/custom-inquiries/${id}`);
export const startFollowUpSequence = (inquiryId) =>
  API.post(`/follow-ups/start/${inquiryId}`);
export const fetchInquiryFollowUp = (inquiryId, params = {}) =>
  API.get(`/follow-ups/inquiry/${inquiryId}`, { params });
export const updateFollowUpStatus = (id, status) =>
  API.patch(`/follow-ups/${id}/status`, { status });
export const fetchWhatsAppTemplates = () =>
  API.get("/social-accounts/whatsapp/templates");

// FAQs
export const fetchFaqs = () => cachedGet("/faqs");
export const createFaq = (data) => API.post("/faqs", data);
export const deleteFaq = (id) => API.delete(`/faqs/${id}`);

// Contact Messages
export const fetchContactMessages = () => cachedGet("/contact-messages");
export const createContactMessage = (data) => API.post("/contact-messages", data);
export const updateContactMessageStatus = (id, status) =>
  API.patch(`/contact-messages/${id}`, { status });
export const deleteContactMessage = (id) => API.delete(`/contact-messages/${id}`);

// Menu Items
export const fetchMenuItems = () => cachedGet("/menu-items");
export const createMenuItem = (data) => API.post("/menu-items", data);
export const updateMenuItem = (id, data) => API.put(`/menu-items/${id}`, data);
export const deleteMenuItem = (id) => API.delete(`/menu-items/${id}`);
export const resetMenuItemsToDefaults = () => API.post("/menu-items/reset-defaults");

// Taxonomies (Dynamic Filters)
export const fetchTaxonomies = (type = "") =>
  cachedGet(`/taxonomies${type ? `?type=${type}` : ""}`);
export const createTaxonomy = (data) => API.post("/taxonomies", data);
export const resetTaxonomiesToDefaults = () => API.post("/taxonomies/reset-defaults");
export const deleteTaxonomy = (id) => API.delete(`/taxonomies/${id}`);

// Visionaries (Team Members)
export const fetchVisionaries = () => cachedGet("/visionaries");
export const createVisionary = (data) => API.post("/visionaries", data);
export const updateVisionary = (id, data) => API.put(`/visionaries/${id}`, data);
export const deleteVisionary = (id) => API.delete(`/visionaries/${id}`);

// Home Content
export const fetchHomeContent = () => cachedGet("/home-content");
export const updateHomeContent = (data) => API.post("/home-content", data);

// Site Settings (Social Links, etc.)
export const fetchSiteSettings = () => cachedGet("/site-settings");
export const updateSiteSettings = (data) => API.put("/site-settings", data);

// Chat
export const sendChatMessage = (data) => API.post("/chat", data);
export const updateChatConversationStatus = (id, status) =>
  API.patch(`/chat/conversations/${id}`, { status });

// Media
export const uploadMedia = (file, tenantId) => {
  return fileToBase64(file).then((base64Data) => {
    return API.post("/media/upload", {
      filename: file.name,
      contentType: file.type,
      data: base64Data.split(",")[1],
      tenantId,
    });
  });
};

const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};

/**
 * Resolve a media path (e.g. "/api/media/ID") to a full URL.
 * On localhost the frontend runs on a different port to the backend,
 * so we need the absolute backend origin. In production everything is
 * served from the same origin, so the relative path works fine.
 */
export const getMediaUrl = (url) => {
  if (!url) return url;
  if (!url.startsWith("/api/media/")) return url; // already absolute or a public asset
  if (typeof window !== "undefined" && LOCAL_HOSTNAMES.has(window.location.hostname)) {
    return `http://127.0.0.1:5000${url}`;
  }
  return url; // relative path works fine in production
};

export default API;
