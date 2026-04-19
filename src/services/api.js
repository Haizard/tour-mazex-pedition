import axios from "axios";

const isBrowser = typeof window !== "undefined";
const API_URL = isBrowser && window.location.hostname === "localhost"
  ? "http://127.0.0.1:5000/api"
  : "/api";

const API = axios.create({ baseURL: API_URL });

const getTenantHeaders = () => {
  if (!isBrowser) {
    return {};
  }

  const hostname = window.location.hostname.toLowerCase();
  const storedTenantSlug = window.localStorage.getItem("activeTenantSlug");

  if (storedTenantSlug) {
    return { "x-tenant-slug": storedTenantSlug };
  }

  if (hostname === "localhost" || hostname === "127.0.0.1") {
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
  config.headers = {
    ...(config.headers || {}),
    ...getTenantHeaders(),
    ...getAdminHeaders(),
  };
  return config;
});

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
export const fetchPlatformTenantSupport = (tenantId, options = {}) =>
  API.get(`/platform-admin/tenants/${tenantId}/support`, {
    params: options.mode ? { mode: options.mode } : undefined,
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
export const fetchPageConfig = (pageType = "home") =>
  API.get(`/page-config/${encodeURIComponent(pageType)}`);
export const updatePageConfig = (pageType = "home", data) =>
  API.put(`/page-config/${encodeURIComponent(pageType)}`, data);

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

// Custom Inquiries
export const fetchInquiries = () => API.get("/custom-inquiries");
export const createInquiry = (data) => API.post("/custom-inquiries", data);
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

export default API;
