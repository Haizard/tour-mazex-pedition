import axios from "axios";

const isBrowser = typeof window !== "undefined";
const API_URL = isBrowser && window.location.hostname === "localhost"
  ? "http://127.0.0.1:5000/api"
  : "/api";
const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "::1"]);
const LEGACY_HOSTNAMES = new Set([
  "mazexpeditions.com",
  "www.mazexpeditions.com",
  "tourism-website-inky.vercel.app",
  "mazexpeditions.vercel.app",
]);

const API = axios.create({ baseURL: API_URL });

const getTenantHeaders = () => {
  if (!isBrowser) {
    return {};
  }

  const hostname = window.location.hostname.toLowerCase();
  const storedTenantSlug = window.localStorage.getItem("activeTenantSlug");

  if (storedTenantSlug && LOCAL_HOSTNAMES.has(hostname)) {
    return { "x-tenant-slug": storedTenantSlug };
  }

  // On the default production domains, trust hostname-based tenant resolution
  // instead of any stale localStorage override from local tenant testing.
  if (storedTenantSlug && LEGACY_HOSTNAMES.has(hostname)) {
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

API.interceptors.request.use((config) => {
  const tenantHeaders = getTenantHeaders();
  const adminHeaders = getAdminHeaders();
  const platformHeaders = getPlatformAdminHeaders();

  // Determine which authorization header to use based on the path
  let authHeader = {};
  if (config.url?.includes("/platform-") || config.url?.includes("/tenant/")) {
     // For platform or cross-tenant operations, prioritize platform token
     authHeader = platformHeaders.Authorization ? platformHeaders : adminHeaders;
  } else {
     // Standard behavior: prioritize tenant admin token
     authHeader = adminHeaders.Authorization ? adminHeaders : platformHeaders;
  }

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
  (response) => response,
  (error) => {
    const requestUrl = error.config?.url || "";
    const isLoginRequest =
      requestUrl.includes("/auth/login") ||
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
export const fetchPlatformSummary = () =>
  API.get("/platform-admin/summary", {
    headers: getPlatformAdminHeaders(),
  });
export const fetchPlatformTenants = () =>
  API.get("/platform-admin/tenants", {
    headers: getPlatformAdminHeaders(),
  });
export const createPlatformTenant = (data) =>
  API.post("/platform-admin/tenants", data, {
    headers: getPlatformAdminHeaders(),
  });
export const fetchPlatformTenantSupport = (tenantId, options = {}) =>
  API.get(`/platform-admin/tenants/${tenantId}/support`, {
    params: options.mode ? { mode: options.mode } : undefined,
    headers: getPlatformAdminHeaders(),
  });
export const fetchPlatformTenantMarketing = (tenantId) =>
  API.get(`/platform-admin/tenants/${tenantId}/marketing`, {
    headers: getPlatformAdminHeaders(),
  });
export const updatePlatformTenant = (tenantId, data) =>
  API.put(`/platform-admin/tenants/${tenantId}`, data, {
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
export const renewPlatformTenantDomainService = (tenantId, data) =>
  API.post(`/platform-admin/tenants/${tenantId}/renew-domain-service`, data, {
    headers: getPlatformAdminHeaders(),
  });
export const fetchEmailConnections = () => API.get("/email/connections");
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
export const createEmailThread = (data) => API.post("/email/threads", data);
export const fetchTenantBootstrap = () => API.get("/tenant/bootstrap");
export const fetchTenantSiteConfig = () => API.get("/tenant/site-config");
export const updateTenantSiteConfig = (data) => API.put("/tenant/site-config", data);
export const updateTenantDomainRequest = (data) => API.put("/tenant/domain-request", data);
export const fetchPageConfig = (pageType = "home") =>
  API.get(`/page-config/${encodeURIComponent(pageType)}`);
export const updatePageConfig = (pageType = "home", data) =>
  API.put(`/page-config/${encodeURIComponent(pageType)}`, data);
export const fetchTenantTheme = () => API.get("/tenant/bootstrap"); // Bootstrap contains theme
export const updateTenantTheme = (data) => API.put("/tenant/theme", data);

// Tour Packages
export const fetchTours = (params = "") => API.get(`/tours${params}`);
export const fetchTour = (id) => API.get(`/tours/${id}`);
export const fetchTourBySlug = (slug) =>
  API.get(`/tours/slug/${encodeURIComponent(slug)}`);
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

// Social Posts
export const fetchSocialPosts = (params = {}) =>
  API.get("/social-posts", { params });
export const generateSocialPost = (data) =>
  API.post("/social-posts/generate", data);
export const createSocialPost = (data) =>
  API.post("/social-posts", data);
export const updateSocialPost = (id, data) =>
  API.patch(`/social-posts/${id}`, data);
export const deleteSocialPost = (id) =>
  API.delete(`/social-posts/${id}`);
export const publishSocialPostLive = (id) =>
  API.post(`/social-accounts/social-posts/${id}/publish`);
export const fetchSocialAccounts = () => API.get("/social-accounts");
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
export const fetchGallery = () => API.get("/gallery");
export const createGallery = (newItem) => API.post("/gallery", newItem);
export const deleteGallery = (id) => API.delete(`/gallery/${id}`);

// Bookings
export const fetchBookings = () => API.get("/bookings");
export const createBooking = (newBooking) => API.post("/bookings", newBooking);
export const updateBookingStatus = (id, status) =>
  API.patch(`/bookings/${id}`, { status });
export const deleteBooking = (id) => API.delete(`/bookings/${id}`);

// Blogs
export const fetchBlogs = () => API.get("/blogs");
export const fetchBlog = (id) => API.get(`/blogs/${id}`);
export const fetchBlogBySlug = (slug) =>
  API.get(`/blogs/slug/${encodeURIComponent(slug)}`);
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
export const fetchCampaigns = () => API.get("/marketing/campaigns");
export const generateCampaignDraft = (data) =>
  API.post("/marketing/campaigns/generate", data);
export const createCampaign = (data) =>
  API.post("/marketing/campaigns", data);
export const updateCampaign = (id, data) =>
  API.patch(`/marketing/campaigns/${id}`, data);
export const deleteCampaign = (id) =>
  API.delete(`/marketing/campaigns/${id}`);

// Custom Inquiries
export const fetchInquiries = () => API.get("/custom-inquiries");
export const createInquiry = (data) => API.post("/custom-inquiries", data);
export const createWhatsAppLead = (data) =>
  API.post("/custom-inquiries/whatsapp-lead", data);
export const updateInquiryStatus = (id, status) =>
  API.patch(`/custom-inquiries/${id}`, { status });
export const deleteInquiry = (id) => API.delete(`/custom-inquiries/${id}`);

// FAQs
export const fetchFaqs = () => API.get("/faqs");
export const createFaq = (data) => API.post("/faqs", data);
export const deleteFaq = (id) => API.delete(`/faqs/${id}`);

// Contact Messages
export const fetchContactMessages = () => API.get("/contact-messages");
export const createContactMessage = (data) => API.post("/contact-messages", data);
export const updateContactMessageStatus = (id, status) =>
  API.patch(`/contact-messages/${id}`, { status });
export const deleteContactMessage = (id) => API.delete(`/contact-messages/${id}`);

// Menu Items
export const fetchMenuItems = () => API.get("/menu-items");
export const createMenuItem = (data) => API.post("/menu-items", data);
export const updateMenuItem = (id, data) => API.put(`/menu-items/${id}`, data);
export const deleteMenuItem = (id) => API.delete(`/menu-items/${id}`);
export const resetMenuItemsToDefaults = () => API.post("/menu-items/reset-defaults");

// Taxonomies (Dynamic Filters)
export const fetchTaxonomies = (type = "") =>
  API.get(`/taxonomies${type ? `?type=${type}` : ""}`);
export const createTaxonomy = (data) => API.post("/taxonomies", data);
export const resetTaxonomiesToDefaults = () => API.post("/taxonomies/reset-defaults");
export const deleteTaxonomy = (id) => API.delete(`/taxonomies/${id}`);

// Visionaries (Team Members)
export const fetchVisionaries = () => API.get("/visionaries");
export const createVisionary = (data) => API.post("/visionaries", data);
export const updateVisionary = (id, data) => API.put(`/visionaries/${id}`, data);
export const deleteVisionary = (id) => API.delete(`/visionaries/${id}`);

// Home Content
export const fetchHomeContent = () => API.get("/home-content");
export const updateHomeContent = (data) => API.post("/home-content", data);

// Site Settings (Social Links, etc.)
export const fetchSiteSettings = () => API.get("/site-settings");
export const updateSiteSettings = (data) => API.put("/site-settings", data);

// Chat
export const sendChatMessage = (data) => API.post("/chat", data);

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
