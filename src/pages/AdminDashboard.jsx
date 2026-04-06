import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  fetchTours,
  createTour,
  updateTour,
  deleteTour,
  regenerateTourDescription,
  fetchGallery,
  createGallery,
  deleteGallery,
  fetchBookings,
  deleteBooking,
  fetchBlogs,
  createBlog,
  updateBlog,
  deleteBlog,
  generateAiBlog,
  regenerateBlogContent,
  generateBlogSeo,
  generateTourSeo,
  generateFullTourPackage,
  fetchInquiries,
  updateInquiryStatus,
  deleteInquiry,
  fetchContactMessages,
  updateContactMessageStatus,
  deleteContactMessage,
  fetchMenuItems,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  resetMenuItemsToDefaults,
  fetchFaqs,
  createFaq,
  deleteFaq,
    fetchTaxonomies,
    createTaxonomy,
    resetTaxonomiesToDefaults,
    deleteTaxonomy,
  fetchVisionaries,
  createVisionary,
  updateVisionary,
  deleteVisionary,
} from "../services/api";
import { useNavigate } from "react-router-dom";

import Button from "../components/UI/Button";
import Card from "../components/UI/Card";
import Badge from "../components/UI/Badge";
import AdminSidebar from "../components/Admin/AdminSidebar";

const AdminDashboard = () => {
  const getPreferredTaxonomyName = (items, type, preferredName, fallbackName) =>
    items.find((item) => item.type === type && item.name === preferredName)?.name ||
    items.find((item) => item.type === type)?.name ||
    fallbackName;

  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("packages");
  const [tours, setTours] = useState([]);
  const [gallery, setGallery] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [blogs, setBlogs] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [contactMessages, setContactMessages] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [faqs, setFaqs] = useState([]);
  const [taxonomies, setTaxonomies] = useState([]);
  const [visionaries, setVisionaries] = useState([]);

  // Auth Check
  useEffect(() => {
    const auth = localStorage.getItem("adminAuth");
    if (auth !== "true") {
      navigate("/login");
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("adminAuth");
    navigate("/login");
  };

  // Form States
  const [tourFormData, setTourFormData] = useState({
    title: "",
    description: "",
    price: "",
    image: "",
    galleryImages: "",
    location: "",
    startLocation: "",
    endLocation: "",
    destinationsVisited: "",
    author: "Admin",
    date: "",
    duration: "",
    maxGroupSize: "",
    tourType: "Safari",
    category: "Luxury",
    accommodationType: "",
    inclusions: "",
    exclusions: "",
    itinerary: [{ day: 1, events: "", accommodation: "" }],
    faqs: [{ question: "", answer: "" }],
    pricingTable: { greenSeason: "", highSeason: "", peakSeason: "" },
    tripAdvisorUrl: "",
    tripAdvisorRating: "",
    tripAdvisorReviewCount: "",
    isGroupTour: false,
    maxCapacity: 12,
    currentBookings: 0,
    launchDate: "",
    seoTitle: "",
    seoDescription: "",
    seoKeywords: "",
    seoOgImage: "",
    seoCanonicalUrl: "",
    seoSchema: "",
  });

  const [blogFormData, setBlogFormData] = useState({
    title: "",
    content: "",
    image: "",
    category: "Safari Articles",
    author: "Admin",
    seoTitle: "",
    seoDescription: "",
    seoKeywords: "",
    seoOgImage: "",
    seoCanonicalUrl: "",
    seoSchema: "",
  });

  const [galleryFormData, setGalleryFormData] = useState({
    img: "",
    location: "",
    caption: "",
  });
  const [taxFormData, setTaxFormData] = useState({
    name: "",
    type: "tourType",
  });
  const [faqFormData, setFaqFormData] = useState({
    question: "",
    answer: "",
  });
  const [menuFormData, setMenuFormData] = useState({
    label: "",
    link: "",
    itemType: "link",
    categoryKey: "",
    menuTitle: "",
    imageKey: "tembo",
    sortOrder: "",
    childrenText: "",
  });

  const [visionaryFormData, setVisionaryFormData] = useState({
    name: "",
    duty: "",
    image: "",
  });

  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [selectedContactMessage, setSelectedContactMessage] = useState(null);

  const [editingTourId, setEditingTourId] = useState(null);
  const [editingBlogId, setEditingBlogId] = useState(null);
  const [editingMenuId, setEditingMenuId] = useState(null);
  const [editingVisionaryId, setEditingVisionaryId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isAiRegeneratingTour, setIsAiRegeneratingTour] = useState(false);
  const [isAiRegeneratingBlog, setIsAiRegeneratingBlog] = useState(false);
  const [isGeneratingFullTour, setIsGeneratingFullTour] = useState(false);
  const [isGeneratingFullBlog, setIsGeneratingFullBlog] = useState(false);

  const handleGenerateFullTour = async () => {
    if (!tourFormData.title || !tourFormData.description) {
      alert("Please provide at least a Title and a brief Idea/Description for the AI to work with.");
      return;
    }

    setIsGeneratingFullTour(true);
    try {
      // Ask for duration if not set to be wise about it
      const durationDays = tourFormData.duration?.match(/\d+/)?.[0] || prompt("How many days should this tour be?", "7");
      
      const res = await generateFullTourPackage({
        title: tourFormData.title,
        description: tourFormData.description,
        tourType: tourFormData.tourType,
        category: tourFormData.category,
        location: tourFormData.location,
        durationDays: durationDays
      });

      const data = res.data;
      setTourFormData(prev => ({
        ...prev,
        description: data.description,
        startLocation: data.startLocation,
        endLocation: data.endLocation,
        duration: data.duration,
        inclusions: data.inclusions?.join("\n") || "",
        exclusions: data.exclusions?.join("\n") || "",
        itinerary: data.itinerary?.map(day => ({
          day: day.day,
          events: Array.isArray(day.events) ? day.events.join("\n") : day.events,
          accommodation: day.accommodation
        })) || prev.itinerary,
        pricingTable: data.pricingTable || prev.pricingTable,
        faqs: data.faqs || prev.faqs,
        seoTitle: data.seoTitle,
        seoDescription: data.seoDescription,
        seoKeywords: data.seoKeywords,
      }));
      alert("Full tour package generated successfully!");
    } catch (e) {
      console.error(e);
      alert("Failed to generate full tour package: " + (e.response?.data?.message || e.message));
    } finally {
      setIsGeneratingFullTour(false);
    }
  };

  const handleGenerateFullBlog = async () => {
    if (!blogFormData.title) {
      alert("Please provide a Title for the blog post.");
      return;
    }

    setIsGeneratingFullBlog(true);
    try {
      // We'll reuse the regenerate logic but with an empty content to signify "Generate New"
      const response = await regenerateBlogContent({
        content: blogFormData.content || "Write a comprehensive blog post about this title.",
        title: blogFormData.title,
        category: blogFormData.category,
      });

      setBlogFormData((prev) => ({
        ...prev,
        content: response.data?.content || prev.content,
      }));

      // Also generate SEO
      const seoRes = await generateBlogSeo({
        title: blogFormData.title,
        content: response.data?.content
      });

      setBlogFormData(prev => ({
        ...prev,
        seoTitle: seoRes.data.title,
        seoDescription: seoRes.data.description,
        seoKeywords: seoRes.data.keywords
      }));

      alert("Blog content and SEO generated!");
    } catch (error) {
       console.error(error);
       alert("Failed to generate blog content.");
    } finally {
      setIsGeneratingFullBlog(false);
    }
  };

  const [isGeneratingTourSeo, setIsGeneratingTourSeo] = useState(false);
  const [isGeneratingBlogSeo, setIsGeneratingBlogSeo] = useState(false);
  const [bodyImageUrl, setBodyImageUrl] = useState("");
  const blogContentTextareaRef = useRef(null);

  useEffect(() => {
    loadTours();
    loadGallery();
    loadBookings();
    loadBlogs();
    loadInquiries();
    loadContactMessages();
    loadMenuItems();
    loadFaqs();
    loadTaxonomies();
    loadVisionaries();
  }, []);

  const loadTours = async () => {
    try {
      const res = await fetchTours();
      setTours(res.data);
    } catch (e) {
      console.error(e);
    }
  };
  const loadGallery = async () => {
    try {
      const res = await fetchGallery();
      setGallery(res.data);
    } catch (e) {
      console.error(e);
    }
  };
  const loadBookings = async () => {
    try {
      const res = await fetchBookings();
      setBookings(res.data);
    } catch (e) {
      console.error(e);
    }
  };
  const loadBlogs = async () => {
    try {
      const res = await fetchBlogs();
      setBlogs(res.data);
    } catch (e) {
      console.error(e);
    }
  };
  const loadInquiries = async () => {
    try {
      const res = await fetchInquiries();
      setInquiries(res.data);
    } catch (e) {
      console.error(e);
    }
  };
  const loadContactMessages = async () => {
    try {
      const res = await fetchContactMessages();
      setContactMessages(res.data);
    } catch (e) {
      console.error(e);
    }
  };
  const loadMenuItems = async () => {
    try {
      const res = await fetchMenuItems();
      setMenuItems(res.data);
    } catch (e) {
      console.error(e);
    }
  };
  const loadFaqs = async () => {
    try {
      const res = await fetchFaqs();
      setFaqs(res.data);
    } catch (e) {
      console.error(e);
    }
  };
  const loadTaxonomies = async () => {
    try {
      const res = await fetchTaxonomies();
      setTaxonomies(res.data);
    } catch (e) {
      console.error(e);
    }
  };
  const loadVisionaries = async () => {
    try {
      const res = await fetchVisionaries();
      setVisionaries(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleTourInputChange = (e) =>
    setTourFormData({ ...tourFormData, [e.target.name]: e.target.value });
  const handleBlogInputChange = (e) =>
    setBlogFormData({ ...blogFormData, [e.target.name]: e.target.value });
  const handleFaqInputChange = (e) =>
    setFaqFormData({ ...faqFormData, [e.target.name]: e.target.value });
  const handleMenuInputChange = (e) =>
    setMenuFormData({ ...menuFormData, [e.target.name]: e.target.value });
    
  const insertIntoBlogContent = (snippet) => {
    const textarea = blogContentTextareaRef.current;

    if (!textarea) {
      setBlogFormData((prev) => ({
        ...prev,
        content: `${prev.content}${prev.content ? "\n\n" : ""}${snippet}`,
      }));
      return;
    }

    const start = textarea.selectionStart ?? blogFormData.content.length;
    const end = textarea.selectionEnd ?? blogFormData.content.length;
    const current = blogFormData.content || "";
    const nextContent = `${current.slice(0, start)}${snippet}${current.slice(end)}`;

    setBlogFormData((prev) => ({
      ...prev,
      content: nextContent,
    }));

    requestAnimationFrame(() => {
      textarea.focus();
      const cursor = start + snippet.length;
      textarea.setSelectionRange(cursor, cursor);
    });
  };
  const handleInsertBodyImage = () => {
    const url = bodyImageUrl.trim();
    if (!url) return;

    insertIntoBlogContent(`\n\n![Body image](${url})\n\n`);
    setBodyImageUrl("");
  };
  const handleRegenerateTourWithAi = async () => {
    if (!tourFormData.description?.trim()) {
      alert("Please add a tour description first.");
      return;
    }

    setIsAiRegeneratingTour(true);
    try {
      const response = await regenerateTourDescription({
        description: tourFormData.description,
        title: tourFormData.title,
        tourType: tourFormData.tourType,
        category: tourFormData.category,
        location: tourFormData.location,
        duration: tourFormData.duration,
      });

      setTourFormData((prev) => ({
        ...prev,
        description: response.data?.description || prev.description,
      }));
      alert("Tour description regenerated.");
    } catch (error) {
      console.error(error);
      if (error?.response?.status === 404) {
        alert("AI regenerate endpoint not found. Please restart the backend server and try again.");
      } else {
        alert(error?.response?.data?.message || "Failed to regenerate description.");
      }
    } finally {
      setIsAiRegeneratingTour(false);
    }
  };
  const handleRegenerateBlogWithAi = async () => {
    if (!blogFormData.content?.trim()) {
      alert("Please add blog content first.");
      return;
    }

    setIsAiRegeneratingBlog(true);
    try {
      const response = await regenerateBlogContent({
        content: blogFormData.content,
        title: blogFormData.title,
        category: blogFormData.category,
      });

      setBlogFormData((prev) => ({
        ...prev,
        content: response.data?.content || prev.content,
      }));
      alert("Blog content regenerated.");
    } catch (error) {
      console.error(error);
      if (error?.response?.status === 404) {
        alert("AI regenerate endpoint not found. Please restart the backend server and try again.");
      } else {
        alert(error?.response?.data?.message || "Failed to regenerate blog content.");
      }
    } finally {
      setIsAiRegeneratingBlog(false);
    }
  };

  const handleGenerateTourSeoWithAi = async () => {
    if (!tourFormData.title || !tourFormData.description) {
      alert("Please provide at least a title and description to generate SEO metadata.");
      return;
    }
    setIsGeneratingTourSeo(true);
    try {
      const res = await generateTourSeo({
        title: tourFormData.title,
        description: tourFormData.description
      });
      setTourFormData(prev => ({
        ...prev,
        seoTitle: res.data.title,
        seoDescription: res.data.description,
        seoKeywords: res.data.keywords
      }));
      alert("SEO Metadata generated!");
    } catch (e) {
      console.error(e);
      alert("Failed to generate SEO metadata.");
    } finally {
      setIsGeneratingTourSeo(false);
    }
  };

  const handleGenerateBlogSeoWithAi = async () => {
    if (!blogFormData.title || !blogFormData.content) {
      alert("Please provide a title and content to generate SEO metadata.");
      return;
    }
    setIsGeneratingBlogSeo(true);
    try {
      const res = await generateBlogSeo({
        title: blogFormData.title,
        content: blogFormData.content
      });
      setBlogFormData(prev => ({
        ...prev,
        seoTitle: res.data.title,
        seoDescription: res.data.description,
        seoKeywords: res.data.keywords
      }));
      alert("SEO Metadata generated!");
    } catch (e) {
      console.error(e);
      alert("Failed to generate SEO metadata.");
    } finally {
      setIsGeneratingBlogSeo(false);
    }
  };

  const handleGalleryInputChange = (e) =>
    setGalleryFormData({ ...galleryFormData, [e.target.name]: e.target.value });
  const handleVisionaryInputChange = (e) =>
    setVisionaryFormData({ ...visionaryFormData, [e.target.name]: e.target.value });

  // Tour Submit
  const handleTourSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const processed = {
      ...tourFormData,
      price: Number(tourFormData.price),
      galleryImages: tourFormData.galleryImages
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean),
      destinationsVisited: tourFormData.destinationsVisited
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean),
      inclusions: tourFormData.inclusions.split("\n").filter((i) => i.trim()),
      exclusions: tourFormData.exclusions.split("\n").filter((i) => i.trim()),
      itinerary: tourFormData.itinerary
        .map((item) => ({
          day: item.day,
          events: typeof item.events === 'string' ? item.events.split("\n").filter((e) => e.trim()) : item.events,
          accommodation: item.accommodation || "",
        }))
        .filter((item) => item.events.length > 0 || item.accommodation),
      faqs: tourFormData.faqs?.filter((f) => f.question.trim()),
      pricingTable: tourFormData.pricingTable,
      tripAdvisorRating: tourFormData.tripAdvisorRating
        ? Number(tourFormData.tripAdvisorRating)
        : undefined,
      tripAdvisorReviewCount: tourFormData.tripAdvisorReviewCount
        ? Number(tourFormData.tripAdvisorReviewCount)
        : undefined,
      seo: {
        title: tourFormData.seoTitle,
        description: tourFormData.seoDescription,
        keywords: tourFormData.seoKeywords.split(",").map(k => k.trim()).filter(Boolean),
        ogImage: tourFormData.seoOgImage,
        canonicalUrl: tourFormData.seoCanonicalUrl,
        schema: tourFormData.seoSchema,
      },
    };
    try {
      if (editingTourId) await updateTour(editingTourId, processed);
      else await createTour(processed);
        setTourFormData({
          ...tourFormData,
          title: "",
          description: "",
          price: "",
          image: "",
          galleryImages: "",
          location: "",
          startLocation: "",
          endLocation: "",
          destinationsVisited: "",
          accommodationType: "",
          inclusions: "",
          exclusions: "",
          itinerary: [{ day: 1, events: "", accommodation: "" }],
          faqs: [{ question: "", answer: "" }],
          pricingTable: { greenSeason: "", highSeason: "", peakSeason: "" },
          tripAdvisorUrl: "",
          tripAdvisorRating: "",
          tripAdvisorReviewCount: "",
          seoTitle: "",
          seoDescription: "",
          seoKeywords: "",
          seoOgImage: "",
          seoCanonicalUrl: "",
          seoSchema: "",
        });
      setEditingTourId(null);
      loadTours();
      alert("Tour saved!");
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Blog Submit
  const handleBlogSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const processed = {
      ...blogFormData,
      seo: {
        title: blogFormData.seoTitle,
        description: blogFormData.seoDescription,
        keywords: blogFormData.seoKeywords.split(",").map(k => k.trim()).filter(Boolean),
        ogImage: blogFormData.seoOgImage,
        canonicalUrl: blogFormData.seoCanonicalUrl,
        schema: blogFormData.seoSchema,
      }
    };
    try {
      if (editingBlogId) await updateBlog(editingBlogId, processed);
      else await createBlog(processed);
      setBlogFormData({
        title: "",
        content: "",
        image: "",
        category: getPreferredTaxonomyName(
          taxonomies,
          "blogCategory",
          "Safari Articles",
          "Travel Tips"
        ),
        author: "Admin",
        seoTitle: "",
        seoDescription: "",
        seoKeywords: "",
        seoOgImage: "",
        seoCanonicalUrl: "",
        seoSchema: "",
      });
      setBodyImageUrl("");
      setEditingBlogId(null);
      loadBlogs();
      alert("Blog saved!");
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Gallery Submit
  const handleGallerySubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createGallery(galleryFormData);
      setGalleryFormData({ img: "", location: "", caption: "" });
      loadGallery();
      alert("Photo added to gallery!");
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Visionary Submit
  const handleVisionarySubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingVisionaryId)
        await updateVisionary(editingVisionaryId, visionaryFormData);
      else await createVisionary(visionaryFormData);
      setVisionaryFormData({ name: "", duty: "", image: "" });
      setEditingVisionaryId(null);
      loadVisionaries();
      alert("Visionary saved!");
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVisionary = async (id) => {
    if (window.confirm("Delete this team member?")) {
      try {
        await deleteVisionary(id);
        loadVisionaries();
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleEditVisionary = (visionary) => {
    setVisionaryFormData({
      name: visionary.name,
      duty: visionary.duty,
      image: visionary.image,
    });
    setEditingVisionaryId(visionary._id);
    setActiveTab("visionaries");
    window.scrollTo(0, 0);
  };

  // Taxonomy Submit
  const handleTaxSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createTaxonomy(taxFormData);
      setTaxFormData({ name: "", type: "tourType" });
      loadTaxonomies();
      alert("Filter created!");
    } catch (e) {
      console.error(e);
      alert(e.response?.data?.message || "Failed to create filter");
    } finally {
      setLoading(false);
    }
  };

  // Form logic to ensure initial values for selects match taxonomies
  useEffect(() => {
    if (taxonomies.length > 0) {
      const firstType = getPreferredTaxonomyName(
        taxonomies,
        "tourType",
        "Safari",
        "Safari"
      );
      const firstCat = getPreferredTaxonomyName(
        taxonomies,
        "tourCategory",
        "Luxury",
        "Luxury"
      );
      const firstBlogCat = getPreferredTaxonomyName(
        taxonomies,
        "blogCategory",
        "Safari Articles",
        "Travel Tips"
      );

      setTourFormData((prev) => ({
        ...prev,
        tourType: prev.tourType && taxonomies.some((t) => t.type === "tourType" && t.name === prev.tourType)
          ? prev.tourType
          : firstType,
        category: prev.category && taxonomies.some((t) => t.type === "tourCategory" && t.name === prev.category)
          ? prev.category
          : firstCat,
      }));
      setBlogFormData((prev) => ({
        ...prev,
        category: prev.category && taxonomies.some((t) => t.type === "blogCategory" && t.name === prev.category)
          ? prev.category
          : firstBlogCat,
      }));
    }
  }, [taxonomies]);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <AdminSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        handleLogout={handleLogout}
      />

      {/* Main Content Area */}
      <div className="flex-1 ml-64 min-h-screen">
        {/* Top bar (for spacing/branding) */}
        <div className="h-16 bg-white border-b border-slate-200 sticky top-0 z-40 flex items-center justify-between px-12">
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter italic">
            Control <span className="text-primary italic">Center</span>
          </h2>
          <div className="flex items-center gap-4">
            <Badge variant="primary">Online</Badge>
          </div>
        </div>

        <div className="p-12">
          {/* Header information removed in favor of sidebar context */}
          <div className="mb-12">
            <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter mb-2">
              {activeTab} Management
            </h1>
            <p className="text-slate-500 font-medium">
              Manage your {activeTab} inventory and resources from here.
            </p>
          </div>

          {/* Packages Section */}
          {activeTab === "packages" && (
            <div className="animate-fade-in">
              <div className="flex justify-between items-center mb-10">
                <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tighter">
                  Tour Inventory
                </h2>
                <Badge variant="primary">{tours.length} Active Packages</Badge>
              </div>

              <Card className="p-8 mb-12 border-none shadow-xl">
                <h3 className="text-xl font-bold mb-8 flex items-center gap-2">
                  <span className="w-2 h-8 bg-primary rounded-full" />
                  {editingTourId
                    ? "Update Existing Package"
                    : "Create New Adventure"}
                </h3>
                <form onSubmit={handleTourSubmit} className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="md:col-span-2 space-y-2">
                      <label className="text-[10px] font-black uppercase text-gray-400 ml-2">
                        Package Title
                      </label>
                      <input
                        type="text"
                        name="title"
                        value={tourFormData.title}
                        onChange={handleTourInputChange}
                        placeholder="e.g. Serengeti Luxury Escape"
                        className="w-full bg-gray-50 p-4 rounded-xl border-none focus:ring-2 focus:ring-primary font-bold"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-gray-400 ml-2">
                        Location
                      </label>
                      <input
                        type="text"
                        name="location"
                        value={tourFormData.location}
                        onChange={handleTourInputChange}
                        placeholder="e.g. Tanzania"
                        className="w-full bg-gray-50 p-4 rounded-xl border-none focus:ring-2 focus:ring-primary font-bold"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-gray-400 ml-2">
                        Price ($)
                      </label>
                      <input
                        type="number"
                        name="price"
                        value={tourFormData.price}
                        onChange={handleTourInputChange}
                        placeholder="0.00"
                        className="w-full bg-gray-50 p-4 rounded-xl border-none focus:ring-2 focus:ring-primary font-black text-primary"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-gray-400 ml-2">
                        Adventure Type
                      </label>
                      <select
                        name="tourType"
                        value={tourFormData.tourType}
                        onChange={handleTourInputChange}
                        className="w-full bg-gray-50 p-4 rounded-xl border-none focus:ring-2 focus:ring-primary font-bold"
                      >
                        {taxonomies
                          .filter((t) => t.type === "tourType")
                          .map((ext) => (
                            <option key={ext._id} value={ext.name}>
                              {ext.name}
                            </option>
                          ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-gray-400 ml-2">
                        Style Category
                      </label>
                      <select
                        name="category"
                        value={tourFormData.category}
                        onChange={handleTourInputChange}
                        className="w-full bg-gray-50 p-4 rounded-xl border-none focus:ring-2 focus:ring-primary font-bold"
                      >
                        {taxonomies
                          .filter((t) => t.type === "tourCategory")
                          .map((ext) => (
                            <option key={ext._id} value={ext.name}>
                              {ext.name}
                            </option>
                          ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-gray-400 ml-2">
                        Duration
                      </label>
                      <input
                        type="text"
                        name="duration"
                        value={tourFormData.duration}
                        onChange={handleTourInputChange}
                        placeholder="e.g. 5 Days"
                        className="w-full bg-gray-50 p-4 rounded-xl border-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-gray-400 ml-2">
                        Image URL
                      </label>
                      <input
                        type="text"
                        name="image"
                        value={tourFormData.image}
                        onChange={handleTourInputChange}
                        placeholder="https://..."
                        className="w-full bg-gray-50 p-4 rounded-xl border-none focus:ring-2 focus:ring-primary"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-gray-400 ml-2">
                        Start Location
                      </label>
                      <input
                        type="text"
                        name="startLocation"
                        value={tourFormData.startLocation}
                        onChange={handleTourInputChange}
                        placeholder="e.g. Arusha"
                        className="w-full bg-gray-50 p-4 rounded-xl border-none focus:ring-2 focus:ring-primary font-medium"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-gray-400 ml-2">
                        End Location
                      </label>
                      <input
                        type="text"
                        name="endLocation"
                        value={tourFormData.endLocation}
                        onChange={handleTourInputChange}
                        placeholder="e.g. Zanzibar"
                        className="w-full bg-gray-50 p-4 rounded-xl border-none focus:ring-2 focus:ring-primary font-medium"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-gray-400 ml-2">
                        Accommodation Type
                      </label>
                      <input
                        type="text"
                        name="accommodationType"
                        value={tourFormData.accommodationType}
                        onChange={handleTourInputChange}
                        placeholder="e.g. Luxury Lodge"
                        className="w-full bg-gray-50 p-4 rounded-xl border-none focus:ring-2 focus:ring-primary font-medium"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase text-gray-400 ml-2">
                        Gallery Images (One URL per line)
                      </label>
                      <textarea
                        name="galleryImages"
                        value={tourFormData.galleryImages}
                        onChange={handleTourInputChange}
                        placeholder="https://...&#10;https://..."
                        className="w-full bg-gray-50 p-4 rounded-xl border-none h-32 outline-none focus:ring-2 focus:ring-primary font-medium"
                      ></textarea>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase text-gray-400 ml-2">
                        Destinations Visited (One per line)
                      </label>
                      <textarea
                        name="destinationsVisited"
                        value={tourFormData.destinationsVisited}
                        onChange={handleTourInputChange}
                        placeholder="Tarangire&#10;Ngorongoro&#10;Serengeti"
                        className="w-full bg-gray-50 p-4 rounded-xl border-none h-32 outline-none focus:ring-2 focus:ring-primary font-medium"
                      ></textarea>
                    </div>
                  </div>

                  <div className="glass-card bg-primary/5 p-8 rounded-2xl border-none">
                    <div className="flex items-center gap-4 mb-6">
                      <input
                        type="checkbox"
                        id="isGroupTour"
                        name="isGroupTour"
                        checked={tourFormData.isGroupTour}
                        onChange={(e) =>
                          setTourFormData({
                            ...tourFormData,
                            isGroupTour: e.target.checked,
                          })
                        }
                        className="w-6 h-6 rounded accent-primary cursor-pointer"
                      />
                      <label
                        htmlFor="isGroupTour"
                        className="font-black text-gray-900 uppercase text-xs tracking-widest cursor-pointer"
                      >
                        Enable as Group Tour Package
                      </label>
                    </div>

                    {tourFormData.isGroupTour && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-slide-up">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-gray-400 ml-1">
                            Max Capacity
                          </label>
                          <input
                            type="number"
                            name="maxCapacity"
                            value={tourFormData.maxCapacity}
                            onChange={handleTourInputChange}
                            className="w-full bg-white p-4 rounded-xl border-none shadow-sm focus:ring-2 focus:ring-primary font-bold"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-gray-400 ml-1">
                            Pre-booked
                          </label>
                          <input
                            type="number"
                            name="currentBookings"
                            value={tourFormData.currentBookings}
                            onChange={handleTourInputChange}
                            className="w-full bg-white p-4 rounded-xl border-none shadow-sm focus:ring-2 focus:ring-primary font-bold"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-gray-400 ml-1">
                            Launch Date
                          </label>
                          <input
                            type="date"
                            name="launchDate"
                            value={
                              tourFormData.launchDate
                                ? tourFormData.launchDate.split("T")[0]
                                : ""
                            }
                            onChange={handleTourInputChange}
                            className="w-full bg-white p-4 rounded-xl border-none shadow-sm focus:ring-2 focus:ring-primary font-bold"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-4">
                      <label className="text-[10px] font-black uppercase text-gray-400 ml-2">
                        Description
                      </label>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          onClick={handleGenerateFullTour}
                          disabled={isGeneratingFullTour || loading}
                          className="bg-primary text-white text-[10px] px-4 py-2"
                        >
                          {isGeneratingFullTour ? "Full AI Generating..." : "🤖 Full AI Generator"}
                        </Button>
                        <Button
                          type="button"
                          onClick={handleRegenerateTourWithAi}
                          disabled={isAiRegeneratingTour || loading || !tourFormData.description?.trim()}
                          className="bg-primary/10 text-primary border border-primary/20 hover:bg-primary hover:text-white text-[10px] px-4 py-2"
                        >
                          {isAiRegeneratingTour ? "Regenerating..." : "Regenerate with AI"}
                        </Button>
                      </div>
                    </div>
                    <textarea
                      name="description"
                      value={tourFormData.description}
                      onChange={handleTourInputChange}
                      placeholder="Tell a cinematic story about this tour..."
                      className="w-full bg-gray-50 p-6 rounded-2xl border-none focus:ring-2 focus:ring-primary h-40 font-medium leading-relaxed"
                      required
                    ></textarea>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase text-gray-400 ml-2">
                        Inclusions (One per line)
                      </label>
                      <textarea
                        name="inclusions"
                        value={tourFormData.inclusions}
                        onChange={handleTourInputChange}
                        placeholder="Example:&#10;Professional Guide&#10;Park Fees&#10;Meals"
                        className="w-full bg-gray-50 p-4 rounded-xl border-none h-40 outline-none focus:ring-2 focus:ring-primary font-medium"
                      ></textarea>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase text-gray-400 ml-2">
                        Exclusions (One per line)
                      </label>
                      <textarea
                        name="exclusions"
                        value={tourFormData.exclusions}
                        onChange={handleTourInputChange}
                        placeholder="Example:&#10;International Flights&#10;Tips&#10;Personal Items"
                        className="w-full bg-gray-50 p-4 rounded-xl border-none h-40 outline-none focus:ring-2 focus:ring-primary font-medium"
                      ></textarea>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-black uppercase text-gray-900">
                        Itinerary Days
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          setTourFormData({
                            ...tourFormData,
                              itinerary: [
                                ...tourFormData.itinerary,
                                {
                                  day: tourFormData.itinerary.length + 1,
                                  events: "",
                                  accommodation: "",
                                },
                              ],
                            })
                          }
                        className="text-primary font-black text-xs uppercase hover:underline"
                      >
                        + Add Day
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {tourFormData.itinerary.map((item, index) => (
                        <div
                          key={index}
                          className="bg-gray-50 p-4 rounded-xl border-none space-y-2"
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-black text-xs text-primary">
                              Day {item.day}
                            </span>
                            {index > 0 && (
                              <button
                                type="button"
                                onClick={() =>
                                  setTourFormData({
                                    ...tourFormData,
                                    itinerary: tourFormData.itinerary.filter(
                                      (_, i) => i !== index,
                                    ),
                                  })
                                }
                                className="text-red-400 text-[10px] font-black uppercase"
                              >
                                Remove
                              </button>
                            )}
                          </div>
                          <textarea
                            placeholder="Events for this day (One per line)"
                            value={item.events}
                            className="w-full bg-white p-3 rounded-lg border-none text-sm outline-none focus:ring-2 focus:ring-primary h-24"
                            onChange={(e) => {
                              const newItinerary = [...tourFormData.itinerary];
                              newItinerary[index].events = e.target.value;
                              setTourFormData({
                                ...tourFormData,
                                itinerary: newItinerary,
                              });
                            }}
                          ></textarea>
                          <input
                            type="text"
                            placeholder="Accommodation for this day"
                            value={item.accommodation || ""}
                            className="w-full bg-white p-3 rounded-lg border-none text-sm outline-none focus:ring-2 focus:ring-primary font-medium text-gray-700"
                            onChange={(e) => {
                              const newItinerary = [...tourFormData.itinerary];
                              newItinerary[index].accommodation = e.target.value;
                              setTourFormData({ ...tourFormData, itinerary: newItinerary });
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Pricing Table */}
                  <div className="space-y-4">
                    <label className="text-sm font-black uppercase text-gray-900">
                      Seasonal Pricing Table
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-gray-50 p-4 rounded-xl border-none space-y-2">
                        <label className="text-xs font-black uppercase text-gray-400">Green Season (Apr-May)</label>
                        <input
                          type="text"
                          value={tourFormData.pricingTable?.greenSeason || ""}
                          onChange={(e) => setTourFormData({...tourFormData, pricingTable: {...tourFormData.pricingTable, greenSeason: e.target.value}})}
                          placeholder="$ PP"
                          className="w-full bg-white p-3 rounded-lg border-none text-sm outline-none focus:ring-2 focus:ring-primary font-medium"
                        />
                      </div>
                      <div className="bg-gray-50 p-4 rounded-xl border-none space-y-2">
                        <label className="text-xs font-black uppercase text-gray-400">High Season (Jun-Oct)</label>
                        <input
                          type="text"
                          value={tourFormData.pricingTable?.highSeason || ""}
                          onChange={(e) => setTourFormData({...tourFormData, pricingTable: {...tourFormData.pricingTable, highSeason: e.target.value}})}
                          placeholder="$ PP"
                          className="w-full bg-white p-3 rounded-lg border-none text-sm outline-none focus:ring-2 focus:ring-primary font-medium"
                        />
                      </div>
                      <div className="bg-gray-50 p-4 rounded-xl border-none space-y-2">
                        <label className="text-xs font-black uppercase text-gray-400">Peak Season (Dec-Feb)</label>
                        <input
                          type="text"
                          value={tourFormData.pricingTable?.peakSeason || ""}
                          onChange={(e) => setTourFormData({...tourFormData, pricingTable: {...tourFormData.pricingTable, peakSeason: e.target.value}})}
                          placeholder="$ PP"
                          className="w-full bg-white p-3 rounded-lg border-none text-sm outline-none focus:ring-2 focus:ring-primary font-medium"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-sm font-black uppercase text-gray-900">
                      TripAdvisor Review Widget
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="md:col-span-2 bg-gray-50 p-4 rounded-xl border-none space-y-2">
                        <label className="text-xs font-black uppercase text-gray-400">
                          TripAdvisor URL
                        </label>
                        <input
                          type="text"
                          name="tripAdvisorUrl"
                          value={tourFormData.tripAdvisorUrl}
                          onChange={handleTourInputChange}
                          placeholder="https://www.tripadvisor.com/..."
                          className="w-full bg-white p-3 rounded-lg border-none text-sm outline-none focus:ring-2 focus:ring-primary font-medium"
                        />
                      </div>
                      <div className="bg-gray-50 p-4 rounded-xl border-none space-y-2">
                        <label className="text-xs font-black uppercase text-gray-400">
                          Rating / 5
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="5"
                          name="tripAdvisorRating"
                          value={tourFormData.tripAdvisorRating}
                          onChange={handleTourInputChange}
                          placeholder="4.9"
                          className="w-full bg-white p-3 rounded-lg border-none text-sm outline-none focus:ring-2 focus:ring-primary font-medium"
                        />
                      </div>
                      <div className="bg-gray-50 p-4 rounded-xl border-none space-y-2">
                        <label className="text-xs font-black uppercase text-gray-400">
                          Review Count
                        </label>
                        <input
                          type="number"
                          min="0"
                          name="tripAdvisorReviewCount"
                          value={tourFormData.tripAdvisorReviewCount}
                          onChange={handleTourInputChange}
                          placeholder="128"
                          className="w-full bg-white p-3 rounded-lg border-none text-sm outline-none focus:ring-2 focus:ring-primary font-medium"
                        />
                      </div>
                    </div>
                  </div>

                  {/* FAQs */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-black uppercase text-gray-900">
                        Package FAQs
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          setTourFormData({
                            ...tourFormData,
                            faqs: [...(tourFormData.faqs || []), { question: "", answer: "" }],
                          })
                        }
                        className="text-primary font-black text-xs uppercase hover:underline"
                      >
                        + Add FAQ
                      </button>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                      {(tourFormData.faqs || []).map((faq, index) => (
                        <div key={index} className="bg-gray-50 p-4 rounded-xl border-none space-y-2 relative">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-black text-xs text-primary">FAQ {index + 1}</span>
                            {index > 0 && (
                              <button
                                type="button"
                                onClick={() => setTourFormData({...tourFormData, faqs: tourFormData.faqs.filter((_, i) => i !== index)})}
                                className="text-red-400 text-[10px] font-black uppercase"
                              >
                                Remove
                              </button>
                            )}
                          </div>
                          <input
                            type="text"
                            placeholder="Question"
                            value={faq.question}
                            onChange={(e) => {
                              const newFaqs = [...tourFormData.faqs];
                              newFaqs[index].question = e.target.value;
                              setTourFormData({...tourFormData, faqs: newFaqs});
                            }}
                            className="w-full bg-white p-3 rounded-lg border-none text-sm outline-none focus:ring-2 focus:ring-primary font-bold"
                          />
                          <textarea
                            placeholder="Answer"
                            value={faq.answer}
                            onChange={(e) => {
                              const newFaqs = [...tourFormData.faqs];
                              newFaqs[index].answer = e.target.value;
                              setTourFormData({...tourFormData, faqs: newFaqs});
                            }}
                            className="w-full bg-white p-3 rounded-lg border-none text-sm outline-none focus:ring-2 focus:ring-primary h-20"
                          ></textarea>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* SEO Optimization */}
                  <div className="bg-primary/5 p-8 rounded-2xl border border-primary/10 space-y-6">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter flex items-center gap-3">
                        <span className="w-2 h-6 bg-primary rounded-full"></span>
                        SEO Optimization
                      </h3>
                      <Button
                        type="button"
                        onClick={handleGenerateTourSeoWithAi}
                        disabled={isGeneratingTourSeo || loading}
                        className="bg-primary text-white text-[10px] px-6 py-2"
                      >
                        {isGeneratingTourSeo ? "Generating..." : "Auto-generate with AI"}
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-gray-400 ml-2">SEO Title Tag</label>
                        <input
                          type="text"
                          name="seoTitle"
                          value={tourFormData.seoTitle}
                          onChange={handleTourInputChange}
                          placeholder="Meta Title (Max 60 chars)"
                          className="w-full bg-white p-4 rounded-xl border-none focus:ring-2 focus:ring-primary font-bold shadow-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-gray-400 ml-2">Canonical URL</label>
                        <input
                          type="text"
                          name="seoCanonicalUrl"
                          value={tourFormData.seoCanonicalUrl}
                          onChange={handleTourInputChange}
                          placeholder="https://mazexpeditions.com/..."
                          className="w-full bg-white p-4 rounded-xl border-none focus:ring-2 focus:ring-primary font-bold shadow-sm"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-gray-400 ml-2">Meta Description (155-160 chars)</label>
                      <textarea
                        name="seoDescription"
                        value={tourFormData.seoDescription}
                        onChange={handleTourInputChange}
                        placeholder="Snippet for search results..."
                        className="w-full bg-white p-4 rounded-xl border-none h-24 focus:ring-2 focus:ring-primary font-medium shadow-sm"
                      ></textarea>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-gray-400 ml-2">Focus Keywords (Comma separated)</label>
                        <input
                          type="text"
                          name="seoKeywords"
                          value={tourFormData.seoKeywords}
                          onChange={handleTourInputChange}
                          placeholder="Safari, Serengeti, Adventure..."
                          className="w-full bg-white p-4 rounded-xl border-none focus:ring-2 focus:ring-primary font-bold shadow-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-gray-400 ml-2">OG Image URL (Social Sharing)</label>
                        <input
                          type="text"
                          name="seoOgImage"
                          value={tourFormData.seoOgImage}
                          onChange={handleTourInputChange}
                          placeholder="https://..."
                          className="w-full bg-white p-4 rounded-xl border-none focus:ring-2 focus:ring-primary font-bold shadow-sm"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-gray-400 ml-2">JSON-LD Schema Markup (Advanced)</label>
                      <textarea
                        name="seoSchema"
                        value={tourFormData.seoSchema}
                        onChange={handleTourInputChange}
                        placeholder='{ "@context": "https://schema.org", "@type": "Product", ... }'
                        className="w-full bg-white p-4 rounded-xl border-none h-24 focus:ring-2 focus:ring-primary font-mono text-xs shadow-sm"
                      ></textarea>
                    </div>
                  </div>

                  <div className="flex justify-end gap-4">
                    {editingTourId && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          setEditingTourId(null);
                          setTourFormData({
                            ...tourFormData,
                            title: "",
                            description: "",
                            image: tourFormData.image || "",
                            location: tourFormData.location || "",
                            startLocation: tourFormData.startLocation || "",
                            endLocation: tourFormData.endLocation || "",
                            accommodationType: tourFormData.accommodationType || "",
                            inclusions: tourFormData.inclusions || "",
                            exclusions: tourFormData.exclusions || "",
                          });
                        }}
                      >
                        Cancel
                      </Button>
                    )}
                    <Button type="submit" disabled={loading} className="px-12">
                      {editingTourId ? "Confirm Update" : "Launch Package"}
                    </Button>
                  </div>
                </form>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {tours.map((t) => (
                  <Card
                    key={t._id}
                    className="group relative overflow-hidden flex flex-col h-full border-none shadow-lg hover:shadow-2xl"
                  >
                    <div className="h-48 overflow-hidden relative">
                      <img
                        src={t.image}
                        className="w-full h-full object-fill transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute top-4 right-4 flex gap-2">
                        <button
                          onClick={() => {
                            setEditingTourId(t._id);
                            setTourFormData({
                              ...t,
                              title: t.title || "",
                              description: t.description || "",
                              price: t.price ?? "",
                              image: t.image || "",
                              location: t.location || "",
                              startLocation: t.startLocation || "",
                              endLocation: t.endLocation || "",
                              duration: t.duration || "",
                              tourType: t.tourType || "Safari",
                              category: t.category || "Luxury",
                              accommodationType: t.accommodationType || "",
                              galleryImages: t.galleryImages?.join("\n") || "",
                              destinationsVisited:
                                t.destinationsVisited?.join("\n") || "",
                              inclusions: t.inclusions?.join("\n") || "",
                              exclusions: t.exclusions?.join("\n") || "",
                              itinerary:
                                t.itinerary?.map((i) => ({
                                  day: i.day,
                                  events: i.events.join("\n"),
                                  accommodation: i.accommodation || "",
                                })) || [],
                              faqs: t.faqs && t.faqs.length > 0 ? t.faqs : [{ question: "", answer: "" }],
                              pricingTable: t.pricingTable || { greenSeason: "", highSeason: "", peakSeason: "" },
                              tripAdvisorUrl: t.tripAdvisorUrl || "",
                              tripAdvisorRating: t.tripAdvisorRating || "",
                              tripAdvisorReviewCount:
                                t.tripAdvisorReviewCount || "",
                              launchDate: t.launchDate || "",
                              isGroupTour: Boolean(t.isGroupTour),
                              maxCapacity: t.maxCapacity ?? 12,
                              currentBookings: t.currentBookings ?? 0,
                              seoTitle: t.seo?.title || "",
                              seoDescription: t.seo?.description || "",
                              seoKeywords: t.seo?.keywords?.join(", ") || "",
                              seoOgImage: t.seo?.ogImage || "",
                              seoCanonicalUrl: t.seo?.canonicalUrl || "",
                              seoSchema: t.seo?.schema || "",
                            });
                            window.scrollTo(0, 0);
                          }}
                          className="p-2 bg-white/90 backdrop-blur-sm rounded-lg text-blue-600 hover:bg-blue-600 hover:text-white transition shadow-sm"
                        >
                          <span className="text-xs font-black uppercase tracking-widest">
                            Edit
                          </span>
                        </button>
                        <button
                          onClick={() => deleteTour(t._id).then(loadTours)}
                          className="p-2 bg-white/90 backdrop-blur-sm rounded-lg text-red-600 hover:bg-red-600 hover:text-white transition shadow-sm"
                        >
                          <span className="text-xs font-black uppercase tracking-widest">
                            Delete
                          </span>
                        </button>
                      </div>
                      <div className="absolute bottom-4 left-4">
                        <Badge variant="luxury">{t.category}</Badge>
                      </div>
                    </div>
                    <div className="p-6 flex-1 flex flex-col justify-between">
                      <div>
                        <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">
                          {t.tourType}
                        </p>
                        <h4 className="font-black text-xl text-gray-900 mb-2 leading-tight">
                          {t.title}
                        </h4>
                        <p className="text-gray-500 text-sm line-clamp-2">
                          {t.description}
                        </p>
                      </div>
                      <div className="mt-6 pt-6 border-t flex justify-between items-center">
                        <p className="font-black text-2xl text-primary">
                          ${t.price}
                        </p>
                        <p className="text-xs font-bold text-gray-400">
                          {t.duration}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Blogs Section */}
          {activeTab === "blogs" && (
            <div className="animate-fade-in">
              <div className="flex justify-between items-center mb-10">
                <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tighter">
                  Content Hub
                </h2>
                <Button
                  onClick={async () => {
                    setLoading(true);
                    try {
                      await generateAiBlog();
                      alert("AI is writing a new blog post...");
                      loadBlogs();
                    } catch (e) {
                      alert("AI Generation failed.");
                    } finally {
                      setLoading(false);
                    }
                  }}
                  className="bg-primary/10 text-primary border border-primary/20 hover:bg-primary hover:text-white"
                >
                  🤖 AI Generator
                </Button>
              </div>

              <Card className="p-8 mb-12 border-none shadow-xl">
                <h3 className="text-xl font-bold mb-8 flex items-center gap-2">
                  <span className="w-2 h-8 bg-secondary rounded-full" />
                  {editingBlogId ? "Refine Story" : "Compose New Story"}
                </h3>
                <form onSubmit={handleBlogSubmit} className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="md:col-span-3 space-y-2">
                      <label className="text-[10px] font-black uppercase text-gray-400 ml-2">
                        Story Title
                      </label>
                      <input
                        type="text"
                        name="title"
                        value={blogFormData.title}
                        onChange={handleBlogInputChange}
                        placeholder="A cinematic title..."
                        className="w-full bg-gray-50 p-4 rounded-xl border-none focus:ring-2 focus:ring-secondary font-bold"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-gray-400 ml-2">
                        Category
                      </label>
                      <select
                        name="category"
                        value={blogFormData.category}
                        onChange={handleBlogInputChange}
                        className="w-full bg-gray-50 p-4 rounded-xl border-none focus:ring-2 focus:ring-secondary font-bold uppercase text-xs"
                      >
                        {taxonomies
                          .filter((t) => t.type === "blogCategory")
                          .map((ext) => (
                            <option key={ext._id} value={ext.name}>
                              {ext.name}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-400 ml-2">
                      Cover Image URL
                    </label>
                    <input
                      type="text"
                      name="image"
                      value={blogFormData.image}
                      onChange={handleBlogInputChange}
                      placeholder="https://..."
                      className="w-full bg-gray-50 p-4 rounded-xl border-none focus:ring-2 focus:ring-secondary"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-4">
                      <label className="text-[10px] font-black uppercase text-gray-400 ml-2">
                        Story Content
                      </label>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          onClick={handleGenerateFullBlog}
                          disabled={isGeneratingFullBlog || loading}
                          className="bg-secondary text-white text-[10px] px-4 py-2"
                        >
                          {isGeneratingFullBlog ? "Full AI Creating..." : "🤖 Full AI Creator"}
                        </Button>
                        <Button
                          type="button"
                          onClick={handleRegenerateBlogWithAi}
                          disabled={isAiRegeneratingBlog || loading || !blogFormData.content?.trim()}
                          className="bg-secondary/10 text-secondary border border-secondary/20 hover:bg-secondary hover:text-white text-[10px] px-4 py-2"
                        >
                          {isAiRegeneratingBlog ? "Regenerating..." : "Regenerate with AI"}
                        </Button>
                      </div>
                    </div>
                    <div className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-4 md:flex-row md:items-end">
                      <div className="flex-1 space-y-2">
                        <label className="text-[10px] font-black uppercase text-gray-400">
                          Body Image URL
                        </label>
                        <input
                          type="text"
                          value={bodyImageUrl}
                          onChange={(e) => setBodyImageUrl(e.target.value)}
                          placeholder="https://... image to place inside the article"
                          className="w-full bg-gray-50 p-4 rounded-xl border-none focus:ring-2 focus:ring-secondary"
                        />
                      </div>
                      <Button
                        type="button"
                        onClick={handleInsertBodyImage}
                        className="bg-primary/10 text-primary border border-primary/20 hover:bg-primary hover:text-white"
                      >
                        Insert Image
                      </Button>
                    </div>
                    <p className="text-xs text-gray-400 px-2">
                      Body images use markdown format like `![Body image](https://...)`. The insert button adds that syntax at your cursor position.
                    </p>
                    <textarea
                      ref={blogContentTextareaRef}
                      name="content"
                      value={blogFormData.content}
                      onChange={handleBlogInputChange}
                      placeholder="Write your epic travel story here..."
                      className="w-full bg-gray-50 p-6 rounded-2xl border-none focus:ring-2 focus:ring-secondary h-64 font-medium leading-relaxed"
                      required
                    ></textarea>
                  </div>
                  {/* Blog SEO Optimization */}
                  <div className="bg-secondary/5 p-8 rounded-2xl border border-secondary/10 space-y-6">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-bold text-gray-900 uppercase tracking-tighter flex items-center gap-3">
                        <span className="w-2 h-6 bg-secondary rounded-full"></span>
                        Search Engine Optimization
                      </h3>
                      <Button
                        type="button"
                        onClick={handleGenerateBlogSeoWithAi}
                        disabled={isGeneratingBlogSeo || loading}
                        className="bg-secondary text-white text-[10px] px-6 py-2"
                      >
                        {isGeneratingBlogSeo ? "Generating..." : "Auto-fill with AI"}
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-gray-400 ml-2">SEO Page Title</label>
                        <input
                          type="text"
                          name="seoTitle"
                          value={blogFormData.seoTitle}
                          onChange={handleBlogInputChange}
                          placeholder="Max 60 characters..."
                          className="w-full bg-white p-4 rounded-xl border-none focus:ring-2 focus:ring-secondary font-bold shadow-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-gray-400 ml-2">Canonical Link</label>
                        <input
                          type="text"
                          name="seoCanonicalUrl"
                          value={blogFormData.seoCanonicalUrl}
                          onChange={handleBlogInputChange}
                          placeholder="Specific URL link..."
                          className="w-full bg-white p-4 rounded-xl border-none focus:ring-2 focus:ring-secondary font-bold shadow-sm"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-gray-400 ml-2">SEO Meta Description</label>
                      <textarea
                        name="seoDescription"
                        value={blogFormData.seoDescription}
                        onChange={handleBlogInputChange}
                        placeholder="Write a compelling snippet for search engines..."
                        className="w-full bg-white p-4 rounded-xl border-none h-24 focus:ring-2 focus:ring-secondary font-medium shadow-sm"
                      ></textarea>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-gray-400 ml-2">Keywords (Comma separated)</label>
                        <input
                          type="text"
                          name="seoKeywords"
                          value={blogFormData.seoKeywords}
                          onChange={handleBlogInputChange}
                          placeholder="e.g. Travel, Africa, Tourism"
                          className="w-full bg-white p-4 rounded-xl border-none focus:ring-2 focus:ring-secondary font-bold shadow-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-gray-400 ml-2">Social Preview Image (OG Image)</label>
                        <input
                          type="text"
                          name="seoOgImage"
                          value={blogFormData.seoOgImage}
                          onChange={handleBlogInputChange}
                          placeholder="https://..."
                          className="w-full bg-white p-4 rounded-xl border-none focus:ring-2 focus:ring-secondary font-bold shadow-sm"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-gray-400 ml-2">JSON-LD Schema Markup (Advanced)</label>
                      <textarea
                        name="seoSchema"
                        value={blogFormData.seoSchema}
                        onChange={handleBlogInputChange}
                        placeholder='{ "@context": "https://schema.org", "@type": "BlogPosting", ... }'
                        className="w-full bg-white p-4 rounded-xl border-none h-24 focus:ring-2 focus:ring-secondary font-mono text-xs shadow-sm"
                      ></textarea>
                    </div>
                  </div>

                  <div className="flex justify-end gap-4">
                    {editingBlogId && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          setEditingBlogId(null);
                          setBlogFormData({
                            title: "",
                            content: "",
                            image: "",
                            category: getPreferredTaxonomyName(
                              taxonomies,
                              "blogCategory",
                              "Safari Articles",
                              "Travel Tips"
                            ),
                            author: "Admin",
                          });
                        }}
                      >
                        Cancel
                      </Button>
                    )}
                    <Button
                      type="submit"
                      variant="secondary"
                      disabled={loading}
                      className="px-12"
                    >
                      {editingBlogId ? "Save Changes" : "Publish Story"}
                    </Button>
                  </div>
                </form>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {blogs.map((b) => (
                  <Card
                    key={b._id}
                    className="group relative overflow-hidden flex flex-col md:flex-row h-64 border-none shadow-lg hover:shadow-2xl"
                  >
                    <div className="w-full md:w-48 h-full overflow-hidden shrink-0">
                      <img
                        src={b.image}
                        className="w-full h-full object-fill transition-transform duration-500 group-hover:scale-110"
                      />
                    </div>
                    <div className="p-8 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <Badge variant="secondary">{b.category}</Badge>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setEditingBlogId(b._id);
                                setBlogFormData({
                                  title: b.title || "",
                                  content: b.content || "",
                                  image: b.image || "",
                                  category:
                                    b.category ||
                                    getPreferredTaxonomyName(
                                      taxonomies,
                                      "blogCategory",
                                      "Safari Articles",
                                      "Travel Tips"
                                    ),
                                  author: b.author || "Admin",
                                  seoTitle: b.seo?.title || "",
                                  seoDescription: b.seo?.description || "",
                                  seoKeywords: b.seo?.keywords?.join(", ") || "",
                                  seoOgImage: b.seo?.ogImage || "",
                                  seoCanonicalUrl: b.seo?.canonicalUrl || "",
                                  seoSchema: b.seo?.schema || "",
                                });
                                window.scrollTo(0, 0);
                              }}
                              className="text-blue-500 hover:text-blue-700 transition font-black text-[10px] uppercase"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => deleteBlog(b._id).then(loadBlogs)}
                              className="text-red-500 hover:text-red-700 transition font-black text-[10px] uppercase"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                        <h4 className="font-black text-xl text-gray-900 leading-tight mb-4 line-clamp-2">
                          {b.title}
                        </h4>
                      </div>
                      <div className="flex items-center gap-2 text-gray-400 text-[10px] font-black tracking-widest uppercase italic">
                        <span>Published by {b.author || "Admin"}</span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Bookings Section */}
          {activeTab === "bookings" && (
            <div className="animate-fade-in">
              <div className="flex justify-between items-center mb-10">
                <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tighter">
                  Reservations
                </h2>
                <Badge variant="accent">{bookings.length} New Bookings</Badge>
              </div>
              <div className="grid grid-cols-1 gap-6">
                {bookings.map((b) => (
                  <Card
                    key={b._id}
                    className="p-8 border-none shadow-md hover:shadow-xl flex flex-col md:flex-row justify-between items-center gap-8"
                  >
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary text-2xl font-black">
                        {b.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-black text-xl text-gray-900">
                          {b.name}
                        </h4>
                        <p className="text-gray-500 font-bold mb-1">{b.email}</p>
                        <div className="flex gap-4">
                          <Badge variant="primary" className="text-[10px]">
                            {b.packageTour || b.tourTitle}
                          </Badge>
                          <span className="text-[10px] font-black uppercase text-gray-400">
                            Date:{" "}
                            {new Date(
                              b.bookingDate || b.createdAt,
                            ).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <p className="text-2xl font-black text-gray-900">
                        ${b.totalPrice}
                      </p>
                      <Badge
                        variant={b.status === "confirmed" ? "primary" : "accent"}
                      >
                        {b.status}
                      </Badge>
                      <button
                        onClick={() => deleteBooking(b._id).then(loadBookings)}
                        className="text-[10px] text-red-500 font-black uppercase hover:underline"
                      >
                        Clear Record
                      </button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Inquiries Section */}
          {(activeTab === "inquiries" || activeTab === "plan-my-trip") && (
            <div className="animate-fade-in relative">
              <div className="flex justify-between items-center mb-10">
                <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tighter">
                  Plan My Trip Requests
                </h2>
                <Badge variant="secondary">{inquiries.length} Messages</Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {inquiries.map((i) => (
                  <Card key={i._id} className="p-6 border-none shadow-lg hover:shadow-xl transition-all group flex flex-col justify-between h-72">
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-black text-lg uppercase">
                          {i.name.charAt(0)}
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <Badge variant="primary" className="text-[8px]">Inquiry</Badge>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteInquiry(i._id).then(loadInquiries);
                            }}
                            className="text-[9px] text-red-400 opacity-0 group-hover:opacity-100 transition uppercase font-black hover:text-red-600"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                      <h4 className="font-black text-lg text-gray-900 truncate">
                        {i.name || `${i.firstName || ""} ${i.lastName || ""}`.trim()}
                      </h4>
                      <p className="text-primary font-bold text-xs truncate mb-4">
                        {i.email}
                      </p>
                      <div className="bg-gray-50/50 p-4 rounded-xl mb-4 border border-gray-100">
                        <p className="text-gray-600 text-sm italic line-clamp-2 leading-relaxed">
                          "{i.message}"
                        </p>
                      </div>
                    </div>
                    <div className="flex justify-between items-center mt-auto">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        {new Date(i.createdAt).toLocaleDateString()}
                      </span>
                      <Button
                        variant="outline"
                        className="py-1.5 px-4 text-[10px] rounded-lg border-primary/30"
                        onClick={() => setSelectedInquiry(i)}
                      >
                        View Full Detail
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Inquiry Detail Modal Overlay */}
              {selectedInquiry && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden relative"
                  >
                    <button
                      onClick={() => setSelectedInquiry(null)}
                      className="absolute top-6 right-6 w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors z-10"
                    >
                      <span className="text-2xl">&times;</span>
                    </button>

                    <div className="p-8 md:p-12">
                      <Badge variant="primary" className="mb-4">Message Details</Badge>
                      <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter mb-8 italic">
                        Inquiry from <span className="text-primary">{selectedInquiry.name || `${selectedInquiry.firstName || ""} ${selectedInquiry.lastName || ""}`.trim()}</span>
                      </h2>

                      <div className="grid grid-cols-1 gap-8 mb-8 pb-8 border-b border-slate-100 md:grid-cols-2 lg:grid-cols-3">
                        <div className="space-y-4">
                          <div>
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Traveler Name</p>
                            <p className="font-bold text-slate-900 break-words">
                              {[selectedInquiry.firstName, selectedInquiry.lastName].filter(Boolean).join(" ") || selectedInquiry.name}
                            </p>
                          </div>
                          {selectedInquiry.familyName && (
                            <div>
                              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Family Name</p>
                              <p className="font-bold text-slate-900 break-words">{selectedInquiry.familyName}</p>
                            </div>
                          )}
                          <div>
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Email Address</p>
                            <p className="font-bold text-slate-900 break-all">{selectedInquiry.email}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Phone Number</p>
                            <p className="font-bold text-slate-900 break-words">{selectedInquiry.phone || "Not provided"}</p>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div>
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Destinations</p>
                            <p className="font-bold text-slate-900 break-words">
                              {Array.isArray(selectedInquiry.destinations)
                                ? selectedInquiry.destinations.join(", ")
                                : selectedInquiry.destinations || "General Interest"}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Trip Length</p>
                            <p className="font-bold text-slate-900 break-words">
                              {selectedInquiry.tripLengthDays
                                ? `${selectedInquiry.tripLengthDays} days`
                                : selectedInquiry.duration || "TBD"}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Travel Window</p>
                            <p className="font-bold text-slate-900 break-words">{selectedInquiry.travelWhen || "TBD"}</p>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div>
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Travelers</p>
                            <p className="font-bold text-slate-900 break-words">
                              {`${selectedInquiry.adults || 0} adults, ${selectedInquiry.childrenUnder5 || 0} children (0-5), ${selectedInquiry.children6To15 || 0} children (6-15)`}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Contact Preference</p>
                            <p className="font-bold text-slate-900 break-words">{selectedInquiry.contactPreference || "Not set"}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Status</p>
                            <Badge variant="secondary" className="mt-1">{selectedInquiry.status}</Badge>
                          </div>
                        </div>
                      </div>

                      {selectedInquiry.sleepingArrangement && (
                        <div className="mb-8 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3">Preferred Sleeping Arrangements</p>
                          <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">
                            {selectedInquiry.sleepingArrangement}
                          </p>
                        </div>
                      )}

                      {selectedInquiry.accommodationPreferences && selectedInquiry.accommodationPreferences.length > 0 && (
                        <div className="mb-8">
                          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3">Preferred Accommodation</p>
                          <div className="flex flex-wrap gap-2">
                            {selectedInquiry.accommodationPreferences.map((s, idx) => (
                              <Badge key={idx} variant="secondary" className="bg-slate-100 text-slate-600 border-none font-bold">
                                {s}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {selectedInquiry.services && selectedInquiry.services.length > 0 && (
                        <div className="mb-8">
                          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3">Requested Services</p>
                          <div className="flex flex-wrap gap-2">
                            {selectedInquiry.services.map((s, idx) => (
                              <Badge key={idx} variant="secondary" className="bg-slate-100 text-slate-600 border-none font-bold">
                                {s}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="mb-8 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3">Custom Requirements</p>
                        <p className="text-slate-600 italic leading-relaxed whitespace-pre-wrap">
                          "{selectedInquiry.message}"
                        </p>
                      </div>

                      <div className="flex flex-col md:flex-row gap-4">
                        <Button
                          variant="primary"
                          className="flex-1 rounded-2xl"
                          onClick={() => window.location.href = `mailto:${selectedInquiry.email}`}
                        >
                          Send Official Reply
                        </Button>
                        <Button
                          variant="outline"
                          className="flex-1 rounded-2xl border-slate-200 text-slate-600"
                          onClick={() => setSelectedInquiry(null)}
                        >
                          Close Preview
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                </div>
              )}
            </div>
          )}

          {/* Contact Messages Section */}
          {activeTab === "contact-messages" && (
            <div className="animate-fade-in relative">
              <div className="flex justify-between items-center mb-10">
                <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tighter">
                  Contact Messages
                </h2>
                <Badge variant="secondary">{contactMessages.length} Messages</Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {contactMessages.map((message) => (
                  <Card key={message._id} className="p-6 border-none shadow-lg hover:shadow-xl transition-all group flex flex-col justify-between h-72">
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-black text-lg uppercase">
                          {message.name.charAt(0)}
                        </div>
                        <Badge variant="secondary" className="text-[8px]">
                          {message.status}
                        </Badge>
                      </div>
                      <h4 className="font-black text-lg text-gray-900 truncate">
                        {message.name}
                      </h4>
                      <p className="text-primary font-bold text-xs truncate mb-4">
                        {message.email}
                      </p>
                      <div className="bg-gray-50/50 p-4 rounded-xl mb-4 border border-gray-100">
                        <p className="text-gray-600 text-sm italic line-clamp-2 leading-relaxed">
                          "{message.message}"
                        </p>
                      </div>
                    </div>
                    <div className="flex justify-between items-center mt-auto">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        {new Date(message.createdAt).toLocaleDateString()}
                      </span>
                      <Button
                        variant="outline"
                        className="py-1.5 px-4 text-[10px] rounded-lg border-primary/30"
                        onClick={() => setSelectedContactMessage(message)}
                      >
                        View Full Detail
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>

              {selectedContactMessage && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden relative"
                  >
                    <button
                      onClick={() => setSelectedContactMessage(null)}
                      className="absolute top-6 right-6 w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors z-10"
                    >
                      <span className="text-2xl">&times;</span>
                    </button>

                    <div className="p-8 md:p-12">
                      <Badge variant="primary" className="mb-4">Contact Message</Badge>
                      <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter mb-8 italic">
                        Message from <span className="text-primary">{selectedContactMessage.name}</span>
                      </h2>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8 pb-8 border-b border-slate-100">
                        <div>
                          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Email Address</p>
                          <p className="font-bold text-slate-900 break-all">{selectedContactMessage.email}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Phone Number</p>
                          <p className="font-bold text-slate-900 break-words">{selectedContactMessage.phone}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Status</p>
                          <Badge variant="secondary" className="mt-1">{selectedContactMessage.status}</Badge>
                        </div>
                      </div>

                      <div className="mb-8 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3">Message</p>
                        <p className="text-slate-600 italic leading-relaxed whitespace-pre-wrap">
                          "{selectedContactMessage.message}"
                        </p>
                      </div>

                      <div className="flex flex-col md:flex-row gap-4">
                        <Button
                          variant="primary"
                          className="flex-1 rounded-2xl"
                          onClick={() => updateContactMessageStatus(selectedContactMessage._id, "Read").then(loadContactMessages)}
                        >
                          Mark As Read
                        </Button>
                        <Button
                          variant="outline"
                          className="flex-1 rounded-2xl border-slate-200 text-slate-600"
                          onClick={() => window.location.href = `mailto:${selectedContactMessage.email}`}
                        >
                          Reply by Email
                        </Button>
                        <Button
                          variant="outline"
                          className="rounded-2xl border-red-200 text-red-500"
                          onClick={() => deleteContactMessage(selectedContactMessage._id).then(() => {
                            setSelectedContactMessage(null);
                            loadContactMessages();
                          })}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                </div>
              )}
            </div>
          )}

          {/* FAQ CMS Section */}
          {activeTab === "faqs" && (
            <div className="animate-fade-in">
              <div className="flex justify-between items-center mb-10">
                <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tighter">
                  Safari FAQs CMS
                </h2>
                <Badge variant="secondary">{faqs.length} Questions</Badge>
              </div>

              <Card className="p-8 mb-12 border-none shadow-xl">
                <form
                  className="space-y-6"
                  onSubmit={(e) => {
                    e.preventDefault();
                    createFaq(faqFormData).then(() => {
                      setFaqFormData({ question: "", answer: "" });
                      loadFaqs();
                    });
                  }}
                >
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-400 ml-2">
                      Question
                    </label>
                    <input
                      type="text"
                      name="question"
                      value={faqFormData.question}
                      onChange={handleFaqInputChange}
                      className="w-full bg-gray-50 p-4 rounded-xl border-none focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-400 ml-2">
                      Answer
                    </label>
                    <textarea
                      name="answer"
                      value={faqFormData.answer}
                      onChange={handleFaqInputChange}
                      className="w-full bg-gray-50 p-4 rounded-2xl border-none focus:ring-2 focus:ring-primary h-36"
                      required
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button type="submit" variant="primary">Add FAQ</Button>
                  </div>
                </form>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {faqs.map((faq) => (
                  <Card key={faq._id} className="p-6 border-none shadow-md hover:shadow-lg">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <h4 className="font-black text-lg text-slate-900 mb-3">{faq.question}</h4>
                        <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                          {faq.answer}
                        </p>
                      </div>
                      <button
                        onClick={() => deleteFaq(faq._id).then(loadFaqs)}
                        className="text-[10px] text-red-500 font-black uppercase hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Gallery Section */}
          {activeTab === "gallery" && (
            <div className="animate-fade-in">
              <div className="flex justify-between items-center mb-10">
                <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tighter">
                  Visual Gallery
                </h2>
                <Badge variant="luxury">{gallery.length} High-Res Assets</Badge>
              </div>

              <Card className="p-8 mb-12 border-none shadow-xl">
                <h3 className="text-xl font-bold mb-8">Add New Asset</h3>
                <form onSubmit={handleGallerySubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <input
                      type="text"
                      name="location"
                      value={galleryFormData.location}
                      onChange={handleGalleryInputChange}
                      placeholder="Location"
                      className="bg-gray-50 p-4 rounded-xl border-none focus:ring-2 focus:ring-primary font-bold"
                      required
                    />
                    <input
                      type="text"
                      name="caption"
                      value={galleryFormData.caption}
                      onChange={handleGalleryInputChange}
                      placeholder="Caption"
                      className="bg-gray-50 p-4 rounded-xl border-none focus:ring-2 focus:ring-primary font-bold md:col-span-2"
                      required
                    />
                  </div>
                  <div className="flex gap-4">
                    <input
                      type="text"
                      name="img"
                      value={galleryFormData.img}
                      onChange={handleGalleryInputChange}
                      placeholder="Image URL"
                      className="flex-1 bg-gray-50 p-4 rounded-xl border-none focus:ring-2 focus:ring-primary"
                      required
                    />
                    <Button type="submit" disabled={loading} className="px-10">
                      Upload Asset
                    </Button>
                  </div>
                </form>
              </Card>

              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {gallery.map((g) => (
                  <div
                    key={g._id}
                    className="group relative aspect-square rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-500"
                  >
                    <img
                      src={g.img}
                      className="w-full h-full object-fill transition-transform duration-700 group-hover:scale-125"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-center items-center p-4 text-center">
                      <p className="text-white font-black text-xs uppercase mb-1">
                        {g.location}
                      </p>
                      <p className="text-white/70 text-[10px] mb-4">
                        {g.caption}
                      </p>
                      <button
                        onClick={() => deleteGallery(g._id).then(loadGallery)}
                        className="bg-red-500 text-white p-2 rounded-lg text-[10px] font-black uppercase"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Navigation Section */}
          {activeTab === "navigation" && (
            <div className="animate-fade-in">
              <div className="flex justify-between items-center mb-10">
                <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tighter">
                  Navbar Structure
                </h2>
                <div className="flex items-center gap-3">
                  <Badge variant="secondary">{menuItems.length} Top Links</Badge>
                  <Button
                    variant="outline"
                    onClick={() => resetMenuItemsToDefaults().then(loadMenuItems)}
                  >
                    Restore Defaults
                  </Button>
                </div>
              </div>

              <Card className="p-8 mb-12 border-none shadow-xl">
                <h3 className="text-xl font-bold mb-8 italic">
                  Add Navigation Item
                </h3>
                <form
                  className="space-y-6"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const children = (menuFormData.childrenText || "")
                      .split("\n")
                      .map((line, index) => {
                        const [label, link] = line.split("|").map((part) => part?.trim());
                        if (!label || !link) return null;
                        return { label, link, sortOrder: index + 1 };
                      })
                      .filter(Boolean);

                    const menuPayload = {
                      label: menuFormData.label,
                      link: menuFormData.link,
                      itemType: menuFormData.itemType,
                      categoryKey: menuFormData.categoryKey || undefined,
                      menuTitle: menuFormData.menuTitle || undefined,
                      imageKey:
                        menuFormData.itemType === "megamenu"
                          ? menuFormData.imageKey
                          : undefined,
                      sortOrder: Number(menuFormData.sortOrder || 0),
                      children,
                    };

                    const saveAction = editingMenuId
                      ? updateMenuItem(editingMenuId, menuPayload)
                      : createMenuItem(menuPayload);

                    saveAction.then(() => {
                      setMenuFormData({
                        label: "",
                        link: "",
                        itemType: "link",
                        categoryKey: "",
                        menuTitle: "",
                        imageKey: "tembo",
                        sortOrder: "",
                        childrenText: "",
                      });
                      setEditingMenuId(null);
                      loadMenuItems();
                      alert("Menu item saved!");
                    });
                  }}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <input
                      type="text"
                      name="label"
                      value={menuFormData.label}
                      onChange={handleMenuInputChange}
                      placeholder="Label"
                      className="bg-gray-50 p-4 rounded-xl border-none focus:ring-2 focus:ring-primary font-bold"
                      required
                    />
                    <input
                      type="text"
                      name="link"
                      value={menuFormData.link}
                      onChange={handleMenuInputChange}
                      placeholder="/packages?type=Safari"
                      className="bg-gray-50 p-4 rounded-xl border-none focus:ring-2 focus:ring-primary font-bold"
                      required
                    />
                    <select
                      name="itemType"
                      value={menuFormData.itemType}
                      onChange={handleMenuInputChange}
                      className="bg-gray-50 p-4 rounded-xl border-none focus:ring-2 focus:ring-primary font-black uppercase text-xs"
                    >
                      <option value="link">Simple Link</option>
                      <option value="dropdown">Dropdown</option>
                      <option value="megamenu">Megamenu</option>
                    </select>
                    <input
                      type="number"
                      name="sortOrder"
                      value={menuFormData.sortOrder}
                      onChange={handleMenuInputChange}
                      placeholder="Sort Order"
                      className="bg-gray-50 p-4 rounded-xl border-none focus:ring-2 focus:ring-primary font-bold"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input
                      type="text"
                      name="categoryKey"
                      value={menuFormData.categoryKey}
                      onChange={handleMenuInputChange}
                      placeholder="category key (e.g. safari)"
                      className="bg-gray-50 p-4 rounded-xl border-none focus:ring-2 focus:ring-primary font-bold"
                    />
                    <input
                      type="text"
                      name="menuTitle"
                      value={menuFormData.menuTitle}
                      onChange={handleMenuInputChange}
                      placeholder="Megamenu title"
                      className="bg-gray-50 p-4 rounded-xl border-none focus:ring-2 focus:ring-primary font-bold"
                    />
                    <select
                      name="imageKey"
                      value={menuFormData.imageKey}
                      onChange={handleMenuInputChange}
                      className="bg-gray-50 p-4 rounded-xl border-none focus:ring-2 focus:ring-primary font-black uppercase text-xs"
                    >
                      <option value="tembo">Tembo</option>
                      <option value="kilimanjaro">Kilimanjaro</option>
                      <option value="momentlion">Moment Lion</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-400 ml-2">
                      Child Links
                    </label>
                    <textarea
                      name="childrenText"
                      value={menuFormData.childrenText}
                      onChange={handleMenuInputChange}
                      placeholder={"Use one child per line in this format:\nOur Safari Packages | /packages?type=Safari"}
                      className="w-full bg-gray-50 p-4 rounded-2xl border-none focus:ring-2 focus:ring-primary h-32"
                    />
                  </div>

                  <div className="flex justify-end gap-3">
                    {editingMenuId && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          setEditingMenuId(null);
                          setMenuFormData({
                            label: "",
                            link: "",
                            itemType: "link",
                            categoryKey: "",
                            menuTitle: "",
                            imageKey: "tembo",
                            sortOrder: "",
                            childrenText: "",
                          });
                        }}
                      >
                        Cancel
                      </Button>
                    )}
                    <Button type="submit" variant="primary">
                      {editingMenuId ? "Update Menu Item" : "Save Menu Item"}
                    </Button>
                  </div>
                </form>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {menuItems.map((item) => (
                  <Card key={item._id || `${item.label}-${item.link}`} className="p-6 border-none shadow-md hover:shadow-lg">
                    <div className="flex justify-between items-start gap-4 mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="primary">{item.itemType}</Badge>
                          <Badge variant="secondary">#{item.sortOrder || 0}</Badge>
                        </div>
                        <h4 className="font-black text-xl text-slate-900">{item.label}</h4>
                        <p className="text-sm text-primary font-bold break-all">{item.link}</p>
                      </div>
                      {item._id && (
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => {
                              setMenuFormData({
                                label: item.label,
                                link: item.link,
                                itemType: item.itemType,
                                categoryKey: item.categoryKey || "",
                                menuTitle: item.menuTitle || "",
                                imageKey: item.imageKey || "tembo",
                                sortOrder: item.sortOrder || "",
                                childrenText: item.children?.map(c => `${c.label} | ${c.link}`).join("\n") || ""
                              });
                              setEditingMenuId(item._id);
                              window.scrollTo(0, 0);
                            }}
                            className="text-[10px] text-primary font-black uppercase hover:underline"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteMenuItem(item._id).then(loadMenuItems)}
                            className="text-[10px] text-red-500 font-black uppercase hover:underline"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                    {item.menuTitle && (
                      <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">
                        {item.menuTitle}
                      </p>
                    )}
                    {item.children?.length > 0 && (
                      <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">
                          Child Links
                        </p>
                        <div className="space-y-2">
                          {item.children.map((child) => (
                            <div key={`${child.label}-${child.link}`} className="flex justify-between gap-4 text-sm">
                              <span className="font-bold text-slate-900">{child.label}</span>
                              <span className="text-slate-500 break-all text-right">{child.link}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Filters Section */}
          {activeTab === "filters" && (
            <div className="animate-fade-in">
                <div className="flex justify-between items-center mb-10">
                  <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tighter">
                    Taxonomy & Filters
                  </h2>
                  <div className="flex items-center gap-3">
                    <Badge variant="primary">{taxonomies.length} Dynamic Tags</Badge>
                    <Button
                      variant="outline"
                      onClick={() =>
                        resetTaxonomiesToDefaults()
                          .then(loadTaxonomies)
                          .then(() => alert("Default filters restored!"))
                      }
                    >
                      Restore Defaults
                    </Button>
                  </div>
                </div>

              <Card className="p-8 mb-12 border-none shadow-xl">
                <h3 className="text-xl font-bold mb-8 italic">
                  New Classification
                </h3>
                <form
                  onSubmit={handleTaxSubmit}
                  className="flex flex-col md:flex-row gap-6"
                >
                  <input
                    type="text"
                    name="name"
                    value={taxFormData.name}
                    onChange={(e) =>
                      setTaxFormData({ ...taxFormData, name: e.target.value })
                    }
                    placeholder="Filter Name (e.g. Eco-Luxury)"
                    className="flex-1 bg-gray-50 p-4 rounded-xl border-none focus:ring-2 focus:ring-primary font-bold"
                    required
                  />
                  <select
                    name="type"
                    value={taxFormData.type}
                    onChange={(e) =>
                      setTaxFormData({ ...taxFormData, type: e.target.value })
                    }
                    className="bg-gray-50 p-4 rounded-xl border-none focus:ring-2 focus:ring-primary font-black uppercase text-xs"
                  >
                    <option value="tourType">Adventure Type</option>
                    <option value="tourCategory">Tour Category</option>
                    <option value="blogCategory">Blog Category</option>
                  </select>
                  <Button type="submit" disabled={loading} className="px-10">
                    Create Filter
                  </Button>
                </form>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {["tourType", "tourCategory", "blogCategory"].map((type) => (
                  <Card key={type} className="p-6 border-none shadow-md bg-white">
                    <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-6 border-b pb-2">
                      {type === "tourType"
                        ? "Adventure Types"
                        : type === "tourCategory"
                          ? "Tour Categories"
                          : "Blog Categories"}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {taxonomies
                        .filter((t) => t.type === type)
                        .map((tax) => (
                          <div
                            key={tax._id}
                            className="flex items-center gap-2 bg-gray-50 pl-4 pr-2 py-2 rounded-full border border-gray-100 group hover:border-red-200 transition"
                          >
                            <span className="text-xs font-bold text-gray-700">
                              {tax.name}
                            </span>
                            <button
                              onClick={() =>
                                deleteTaxonomy(tax._id).then(loadTaxonomies)
                              }
                              className="w-5 h-5 rounded-full bg-gray-200 text-gray-400 group-hover:bg-red-500 group-hover:text-white flex items-center justify-center text-[10px]"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Visionaries Section */}
          {activeTab === "visionaries" && (
            <div className="animate-fade-in">
              <div className="flex justify-between items-center mb-10">
                <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tighter">
                  Team Visionaries
                </h2>
                <Badge variant="primary">{visionaries.length} Team Members</Badge>
              </div>

              <Card className="p-8 mb-12 border-none shadow-xl">
                <h3 className="text-xl font-bold mb-8 italic">
                  {editingVisionaryId ? "Update Member" : "Add New Visionary"}
                </h3>
                <form onSubmit={handleVisionarySubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-gray-400 ml-2">Member Name</label>
                      <input
                        type="text"
                        name="name"
                        value={visionaryFormData.name}
                        onChange={handleVisionaryInputChange}
                        placeholder="e.g. John Doe"
                        className="w-full bg-gray-50 p-4 rounded-xl border-none focus:ring-2 focus:ring-primary font-bold"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-gray-400 ml-2">Role / Duty</label>
                      <input
                        type="text"
                        name="duty"
                        value={visionaryFormData.duty}
                        onChange={handleVisionaryInputChange}
                        placeholder="e.g. CEO & Founder"
                        className="w-full bg-gray-50 p-4 rounded-xl border-none focus:ring-2 focus:ring-primary font-bold"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-gray-400 ml-2">Image URL</label>
                      <input
                        type="text"
                        name="image"
                        value={visionaryFormData.image}
                        onChange={handleVisionaryInputChange}
                        placeholder="https://..."
                        className="w-full bg-gray-50 p-4 rounded-xl border-none focus:ring-2 focus:ring-primary font-bold"
                        required
                      />
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <Button type="submit" disabled={loading} className="px-10">
                      {editingVisionaryId ? "Update Member" : "Add to Team"}
                    </Button>
                    {editingVisionaryId && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingVisionaryId(null);
                          setVisionaryFormData({ name: "", duty: "", image: "" });
                        }}
                        className="text-gray-400 font-bold hover:text-gray-600"
                      >
                        Cancel Edit
                      </button>
                    )}
                  </div>
                </form>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {visionaries.map((v) => (
                  <Card key={v._id} className="p-6 border-none shadow-lg bg-white group flex items-center gap-6">
                    <div className="relative">
                      <img
                        src={v.image}
                        alt={v.name}
                        className="w-20 h-20 rounded-full object-fill border-2 border-white shadow-md group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-lg font-black text-gray-900 leading-tight uppercase tracking-tight mb-1">
                        {v.name}
                      </h4>
                      <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-4">
                        {v.duty}
                      </p>
                      <div className="flex gap-4">
                        <button
                          onClick={() => handleEditVisionary(v)}
                          className="text-primary font-black text-[10px] uppercase hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteVisionary(v._id)}
                          className="text-red-500 font-black text-[10px] uppercase hover:underline"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
