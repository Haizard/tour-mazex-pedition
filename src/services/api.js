import axios from "axios";

const API_URL = window.location.hostname === "localhost"
  ? "http://localhost:5000/api"
  : "/api";

const API = axios.create({ baseURL: API_URL });

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

// Chat
export const sendChatMessage = (data) => API.post("/chat", data);

export default API;
