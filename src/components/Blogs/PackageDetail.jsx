import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  IoBedOutline,
  IoCalendarOutline,
  IoCameraOutline,
  IoChevronDownOutline,
  IoHelpCircleOutline,
  IoLogoFacebook,
  IoLogoInstagram,
  IoLogoTwitter,
  IoLocationOutline,
  IoPeopleOutline,
  IoPricetagOutline,
  IoRibbonOutline,
  IoShareSocialOutline,
  IoStarOutline,
  IoTimeOutline,
} from "react-icons/io5";
import OrderPopup from "../OrderPopup/OrderPopup";
import { createBooking, fetchTour, fetchTourBySlug, fetchTours } from "../../services/api";
import Testimonial from "../Testimonial/Testimonial";
import TripCTA from "../Home/TripCTA";
import LogoSlider from "../Home/LogoSlider";
import SEO from "../UI/SEO";
import PackageCard from "./PackageCard";


const slugifyTitle = (value = "") =>
  value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const PackageDetail = () => {
  const location = useLocation();
  const { title: slug } = useParams();
  const [searchParams] = useSearchParams();
  const tourId = searchParams.get("tourId");
  const [tourData, setTourData] = useState(location.state || null);
  const [isPageLoading, setIsPageLoading] = useState(!location.state);
  const [loadError, setLoadError] = useState("");
  const [selectedGalleryImage, setSelectedGalleryImage] = useState("");

  const [isOrderPopupVisible, setOrderPopupVisible] = useState(false);
  const [isInclusionsOpen, setIsInclusionsOpen] = useState(true);
  const [isExclusionsOpen, setIsExclusionsOpen] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState(0);
  const [activeTab, setActiveTab] = useState("overview");

  const [planForm, setPlanForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    travelDate: "",
    adults: 2,
    children: 0,
    notes: "",
  });
  const [planSubmitting, setPlanSubmitting] = useState(false);
  const [planSuccess, setPlanSuccess] = useState(false);
  const [relatedTours, setRelatedTours] = useState([]);

  useEffect(() => {
    window.scrollTo(0, 0);
    const loadRelated = async () => {
      try {
        const res = await fetchTours();
        setRelatedTours(res.data.filter(t => t._id !== tourData?._id).slice(0, 3));
      } catch (err) {
        console.error("Related tours load fail:", err);
      }
    };
    if (tourData) loadRelated();
  }, [tourData?._id]);

  useEffect(() => {
    const loadTour = async () => {
      if (!slug && !tourId) return;

      setIsPageLoading(true);
      try {
        if (tourId) {
          const byIdResponse = await fetchTour(tourId);
          setTourData(byIdResponse.data);
          setLoadError("");
          return;
        }

        const response = await fetchTourBySlug(slug);
        setTourData(response.data);
        setLoadError("");
      } catch (error) {
        try {
          const allToursResponse = await fetchTours();
          const matchedTour = allToursResponse.data.find(
            (item) => slugifyTitle(item.title) === slugifyTitle(slug),
          );

          if (matchedTour) {
            setTourData(matchedTour);
            setLoadError("");
          } else {
            setLoadError("We couldn't find this package.");
          }
        } catch (fallbackError) {
          console.error("Error loading package detail:", fallbackError);
          setLoadError("We couldn't load this package right now.");
        }
      } finally {
        setIsPageLoading(false);
      }
    };

    loadTour();
  }, [slug, tourId]);

  const galleryImages = useMemo(() => {
    if (!tourData) return [];
    const images = [tourData.image, ...(tourData.galleryImages || [])].filter(Boolean);
    return [...new Set(images)];
  }, [tourData]);

  useEffect(() => {
    if (galleryImages.length > 0) {
      setSelectedGalleryImage(galleryImages[0]);
    }
  }, [galleryImages]);

  if (isPageLoading && !tourData) {
    return <div className="text-center py-20">Loading package...</div>;
  }

  if (!tourData) {
    return (
      <div className="text-center py-20">
        {loadError || "No package data found"}
      </div>
    );
  }

  const {
    image,
    title,
    location: loc,
    price,
    description,
    tourType,
    category,
    itinerary,
    inclusions,
    exclusions,
    duration,
    maxGroupSize,
    pricingTable,
    faqs,
    startLocation,
    endLocation,
    destinationsVisited,
    accommodationType,
    tripAdvisorUrl,
    tripAdvisorRating,
    tripAdvisorReviewCount,
  } = tourData;

  const activeImage = selectedGalleryImage || image;
  const travelerCount = Number(planForm.adults || 0) + Number(planForm.children || 0);
  const totalEstimate = travelerCount > 0 ? travelerCount * Number(price || 0) : 0;

  const seasonalPrices = [
    { label: "Green Season", months: "Apr - May", value: pricingTable?.greenSeason },
    { label: "High Season", months: "Jun - Oct", value: pricingTable?.highSeason },
    { label: "Peak Season", months: "Dec - Feb", value: pricingTable?.peakSeason },
  ].filter((season) => season.value);

  const validFaqs = (faqs || []).filter(
    (faq) => faq?.question?.trim() && faq?.answer?.trim(),
  );

  const handlePlanFieldChange = (event) => {
    const { name, value } = event.target;
    setPlanForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePlanSubmit = async (event) => {
    event.preventDefault();
    setPlanSubmitting(true);

    try {
      await createBooking({
        ...planForm,
        packageTour: title,
        pax: travelerCount || 1,
        adults: Number(planForm.adults || 0),
        children: Number(planForm.children || 0),
        totalPrice: totalEstimate || Number(price || 0),
      });

      setPlanSuccess(true);
      setPlanForm({
        name: "",
        email: "",
        phone: "",
        address: "",
        travelDate: "",
        adults: 2,
        children: 0,
        notes: "",
      });
    } catch (error) {
      console.error("Planning form submission failed:", error);
      alert(
        error.response?.data?.message ||
          "We couldn't send your trip request right now.",
      );
    } finally {
      setPlanSubmitting(false);
    }
  };

  return (
    <div className="pb-20 pt-24 px-4 lg:px-24 bg-gray-50 min-h-screen">
      <SEO 
        title={tourData.seo?.title || tourData.title}
        description={tourData.seo?.description || tourData.description}
        keywords={tourData.seo?.keywords}
        ogImage={tourData.seo?.ogImage || tourData.image}
        canonicalUrl={tourData.seo?.canonicalUrl || window.location.href}
        schema={tourData.seo?.schema}
        type="article"
      />
      <div className="relative left-1/2 right-1/2 w-screen -translate-x-1/2 h-[280px] md:h-[420px] lg:h-[520px] overflow-hidden mb-10 md:mb-14">
        <img src={activeImage} alt={title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/25 flex items-center justify-center px-6">
          <div className="text-center">
            <h1 className="text-2xl md:text-4xl font-black text-white tracking-tight drop-shadow-[0_2px_10px_rgba(0,0,0,0.45)]">
              {title}
            </h1>
            <div className="mt-3 flex items-center justify-center gap-2 md:gap-3 flex-wrap">
              <span className="bg-primary/90 text-white px-3 py-1 rounded-full text-[10px] md:text-xs font-black uppercase">
                {tourType}
              </span>
              <span className="bg-secondary/90 text-white px-3 py-1 rounded-full text-[10px] md:text-xs font-black uppercase">
                {category}
              </span>
              <span className="bg-white/15 backdrop-blur text-white px-3 py-1 rounded-full text-[10px] md:text-xs font-black uppercase">
                {loc}
              </span>
              {accommodationType && (
                <span className="bg-white/15 backdrop-blur text-white px-3 py-1 rounded-full text-[10px] md:text-xs font-black uppercase">
                  {accommodationType}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto bg-white rounded-[40px] shadow-2xl overflow-hidden border">

        {galleryImages.length > 1 && (
          <div className="px-8 md:px-12 pt-8">
            <div className="flex items-center gap-2 mb-4">
              <IoCameraOutline className="text-primary text-lg" />
              <p className="text-sm font-black uppercase tracking-[0.2em] text-gray-500">Tour Gallery</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {galleryImages.map((galleryImage, index) => (
                <button
                  key={`${galleryImage}-${index}`}
                  type="button"
                  onClick={() => setSelectedGalleryImage(galleryImage)}
                  className={`overflow-hidden rounded-3xl border-2 transition-all ${
                    galleryImage === activeImage ? "border-primary shadow-lg scale-[1.02]" : "border-transparent hover:border-primary/30"
                  }`}
                >
                  <img src={galleryImage} alt={`${title} gallery ${index + 1}`} className="w-full h-28 object-cover" />
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="px-8 md:px-12 pt-8">
          <div className="rounded-[28px] border border-[#8b5e34]/15 bg-[#faf6f1] p-5 md:p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 text-[#8b5e34]">
                {[...Array(5)].map((_, index) => (
                  <IoStarOutline key={index} className="text-lg" />
                ))}
                <span className="text-xs font-black uppercase tracking-[0.2em] text-gray-500 ml-2">
                  Top rated safari experience
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600 font-medium flex-wrap">
                <span className="inline-flex items-center gap-2">
                  <IoRibbonOutline className="text-primary text-lg" />
                  Fully registered African local tour operator
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4 flex-wrap">
              <span className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-gray-400">
                <IoShareSocialOutline className="text-primary text-lg" />
                Follow us
              </span>
              <a
                href="https://www.instagram.com/tanzania_inside_and_safari/"
                target="_blank"
                rel="noreferrer"
                className="w-11 h-11 rounded-full bg-white border border-[#8b5e34]/15 text-[#8b5e34] flex items-center justify-center hover:bg-[#8b5e34] hover:text-white transition"
              >
                <IoLogoInstagram className="text-xl" />
              </a>
              <a
                href="https://www.facebook.com/profile.php?id=100088374186954"
                target="_blank"
                rel="noreferrer"
                className="w-11 h-11 rounded-full bg-white border border-[#8b5e34]/15 text-[#8b5e34] flex items-center justify-center hover:bg-[#8b5e34] hover:text-white transition"
              >
                <IoLogoFacebook className="text-xl" />
              </a>
              <a
                href="https://twitter.com/inside_safari"
                target="_blank"
                rel="noreferrer"
                className="w-11 h-11 rounded-full bg-white border border-[#8b5e34]/15 text-[#8b5e34] flex items-center justify-center hover:bg-[#8b5e34] hover:text-white transition"
              >
                <IoLogoTwitter className="text-xl" />
              </a>
            </div>
          </div>
        </div>

        <div className="p-8 md:p-12 grid grid-cols-1 xl:grid-cols-[minmax(0,1.5fr)_420px] gap-12">
          <div className="space-y-10">
            <div className="overflow-hidden rounded-[32px] border border-[#8b5e34]/15 bg-white shadow-sm">
              <div className="w-full h-[280px] md:h-[380px] lg:h-[460px]">
                <img
                  src={galleryImages[1] || image}
                  alt={`${title} feature`}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-6 md:p-8 lg:p-10 bg-[#fcfaf7] border-t border-[#8b5e34]/10">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#8b5e34] mb-3">
                  Tour Description
                </p>
                <h2 className="text-3xl md:text-4xl font-black text-gray-900 uppercase tracking-tight mb-5">
                  {title}
                </h2>
                <p className="text-gray-600 leading-relaxed text-base md:text-lg whitespace-pre-line">
                  {description}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-3xl bg-gray-50 border p-5">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2">Start Location</p>
                <p className="text-lg font-black text-gray-900">{startLocation || loc}</p>
              </div>
              <div className="rounded-3xl bg-gray-50 border p-5">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2">End Location</p>
                <p className="text-lg font-black text-gray-900">{endLocation || loc}</p>
              </div>
              <div className="rounded-3xl bg-gray-50 border p-5">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2">Accommodation Style</p>
                <p className="text-lg font-black text-gray-900">{accommodationType || category}</p>
              </div>
            </div>

            {destinationsVisited?.length > 0 && (
              <div>
                <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight mb-4">Destinations Visited</h2>
                <div className="flex flex-wrap gap-3">
                  {destinationsVisited.map((destination, index) => (
                    <span key={`${destination}-${index}`} className="px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-black uppercase tracking-wide">
                      {destination}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-[32px] border border-[#8b5e34]/20 bg-white shadow-sm overflow-hidden">
              <div className="p-4 md:p-6 border-b border-[#8b5e34]/15">
                <div className="flex flex-wrap gap-3">
                  {[
                    { id: "overview", label: "Overview" },
                    { id: "itinerary", label: "Itinerary" },
                    { id: "pricing", label: "Pricing" },
                    { id: "faq", label: "FAQ" },
                    { id: "reviews", label: "Reviews" },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-4 py-2 rounded-xl border font-black uppercase text-xs tracking-widest transition ${
                        activeTab === tab.id
                          ? "bg-[#8b5e34] text-white border-[#8b5e34]"
                          : "bg-white text-[#8b5e34] border-[#8b5e34]/40 hover:bg-[#8b5e34]/5"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-6 md:p-8 bg-white">
                {activeTab === "overview" && (
                  <div className="space-y-8">
                    <div>
                      <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight mb-4">
                        Tour Overview
                      </h2>
                      <p className="text-gray-600 leading-relaxed text-lg whitespace-pre-line">
                        {description}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="rounded-2xl border bg-gray-50 p-5">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2">
                          Route
                        </p>
                        <p className="text-sm font-bold text-gray-800">
                          {startLocation || loc} to {endLocation || loc}
                        </p>
                      </div>
                      <div className="rounded-2xl border bg-gray-50 p-5">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2">
                          Accommodation
                        </p>
                        <p className="text-sm font-bold text-gray-800">
                          {accommodationType || category}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "itinerary" && (
                  <div className="space-y-6">
                    {itinerary?.length > 0 ? (
                      itinerary.map((day, index) => (
                        <div
                          key={`${day.day}-${index}`}
                          className="flex gap-6 items-start"
                        >
                          <div className="bg-[#8b5e34] text-white w-10 h-10 rounded-full flex items-center justify-center font-black shrink-0">
                            {day.day}
                          </div>
                          <div className="bg-gray-50 p-6 rounded-3xl flex-1 border">
                            <ul className="space-y-2">
                              {(day.events || []).map((event, eventIndex) => (
                                <li
                                  key={`${event}-${eventIndex}`}
                                  className="text-gray-700 text-sm italic"
                                >
                                  - {event}
                                </li>
                              ))}
                            </ul>
                            {day.accommodation && (
                              <div className="mt-5 pt-4 border-t border-gray-200 flex items-start gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-white text-primary flex items-center justify-center shadow-sm shrink-0">
                                  <IoBedOutline className="text-lg" />
                                </div>
                                <div>
                                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1">
                                    Accommodation
                                  </p>
                                  <p className="text-sm font-bold text-gray-700">
                                    {day.accommodation}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500">No itinerary details available.</p>
                    )}
                  </div>
                )}

                {activeTab === "pricing" && (
                  <div className="space-y-6">
                    <div className="overflow-hidden rounded-2xl border">
                      <table className="w-full text-left">
                        <thead className="bg-[#6d4320] text-white">
                          <tr>
                            <th className="px-4 py-3 text-sm font-black uppercase">Season</th>
                            <th className="px-4 py-3 text-sm font-black uppercase">Months</th>
                            <th className="px-4 py-3 text-sm font-black uppercase">Price</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(seasonalPrices.length > 0
                            ? seasonalPrices
                            : [{ label: "Standard", months: "Year Round", value: `$${price}` }]
                          ).map((season) => (
                            <tr key={season.label} className="border-t even:bg-gray-50">
                              <td className="px-4 py-3 font-bold text-gray-800">{season.label}</td>
                              <td className="px-4 py-3 text-gray-600">{season.months}</td>
                              <td className="px-4 py-3 font-black text-primary">{season.value}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <p className="text-sm text-gray-500">
                      Rates are shown per person unless otherwise noted.
                    </p>
                  </div>
                )}

                {activeTab === "faq" && (
                  <div className="space-y-3">
                    {validFaqs.length > 0 ? (
                      validFaqs.map((faq, index) => {
                        const isOpen = openFaqIndex === index;
                        return (
                          <div key={`${faq.question}-${index}`} className="rounded-2xl border border-gray-100 bg-gray-50 overflow-hidden">
                            <button
                              onClick={() => setOpenFaqIndex(isOpen ? -1 : index)}
                              className="w-full px-5 py-4 flex items-center justify-between gap-4 text-left"
                            >
                              <span className="text-sm font-black text-gray-900">{faq.question}</span>
                              <motion.div animate={{ rotate: isOpen ? 180 : 0 }} className="text-primary shrink-0">
                                <IoChevronDownOutline />
                              </motion.div>
                            </button>
                            <AnimatePresence>
                              {isOpen && (
                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                  <div className="px-5 pb-5 text-sm text-gray-600 leading-relaxed border-t border-gray-100 bg-white">
                                    <div className="pt-4 whitespace-pre-line">{faq.answer}</div>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-gray-500">No FAQs available for this package yet.</p>
                    )}
                  </div>
                )}

                {activeTab === "reviews" && (
                  <div className="space-y-5">
                    {(tripAdvisorUrl || tripAdvisorRating || tripAdvisorReviewCount) ? (
                      <div className="rounded-3xl border bg-[#f5f9f7] p-6">
                        <div className="flex items-center gap-3 mb-5">
                          <div className="w-12 h-12 rounded-2xl bg-[#34e0a1]/15 text-[#00aa6c] flex items-center justify-center">
                            <IoStarOutline className="text-2xl" />
                          </div>
                          <div>
                            <h4 className="font-black uppercase tracking-tight text-gray-900">TripAdvisor Reviews</h4>
                            <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Traveler feedback snapshot</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                          <div className="rounded-2xl bg-white border p-5">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2">Rating</p>
                            <p className="text-3xl font-black text-[#00aa6c]">{tripAdvisorRating || "Excellent"}</p>
                          </div>
                          <div className="rounded-2xl bg-white border p-5">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2">Review Count</p>
                            <p className="text-3xl font-black text-[#00aa6c]">{tripAdvisorReviewCount || "Traveler feedback"}</p>
                          </div>
                        </div>
                        {tripAdvisorUrl && (
                          <a
                            href={tripAdvisorUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center justify-center bg-[#00aa6c] text-white font-black px-6 py-3 rounded-2xl uppercase tracking-widest hover:opacity-90 transition"
                          >
                            View on TripAdvisor
                          </a>
                        )}
                      </div>
                    ) : (
                      <p className="text-gray-500">No review widget data available for this package yet.</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div className="bg-gray-900 text-white p-8 rounded-[32px] shadow-xl">
              <p className="text-gray-400 font-black uppercase text-xs mb-2 tracking-widest">
                Starting From
              </p>
              <h3 className="text-5xl font-black text-primary mb-6">
                ${price}
                <span className="text-sm text-gray-400">/PP</span>
              </h3>
              <button
                onClick={() => setOrderPopupVisible(true)}
                className="w-full bg-primary text-white font-black py-4 rounded-2xl hover:bg-white hover:text-primary transition shadow-lg uppercase tracking-widest"
              >
                Book This Tour
              </button>
            </div>

            <div className="border p-8 rounded-[32px] overflow-hidden bg-gradient-to-br from-white to-gray-50">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                  <IoCalendarOutline className="text-2xl" />
                </div>
                <div>
                  <h4 className="font-black uppercase tracking-tight text-gray-900">
                    Plan My Trip
                  </h4>
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
                    Send your preferred dates and traveler mix
                  </p>
                </div>
              </div>

              {planSuccess ? (
                <div className="rounded-3xl bg-green-50 border border-green-100 p-6 text-center">
                  <p className="text-lg font-black text-green-700 uppercase">
                    Trip Request Sent
                  </p>
                  <p className="text-sm text-green-700/80 mt-2">
                    Our team will reach out with a tailored plan shortly.
                  </p>
                </div>
              ) : (
                <form onSubmit={handlePlanSubmit} className="space-y-4">
                  <input
                    type="text"
                    name="name"
                    value={planForm.name}
                    onChange={handlePlanFieldChange}
                    placeholder="Full Name"
                    className="w-full bg-white p-4 rounded-2xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 font-medium"
                    required
                  />
                  <input
                    type="email"
                    name="email"
                    value={planForm.email}
                    onChange={handlePlanFieldChange}
                    placeholder="Email Address"
                    className="w-full bg-white p-4 rounded-2xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 font-medium"
                    required
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      name="phone"
                      value={planForm.phone}
                      onChange={handlePlanFieldChange}
                      placeholder="Phone"
                      className="w-full bg-white p-4 rounded-2xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 font-medium"
                      required
                    />
                    <input
                      type="text"
                      name="address"
                      value={planForm.address}
                      onChange={handlePlanFieldChange}
                      placeholder="Country"
                      className="w-full bg-white p-4 rounded-2xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 font-medium"
                      required
                    />
                  </div>
                  <input
                    type="date"
                    name="travelDate"
                    value={planForm.travelDate}
                    onChange={handlePlanFieldChange}
                    className="w-full bg-white p-4 rounded-2xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 font-medium"
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="number"
                      min="1"
                      name="adults"
                      value={planForm.adults}
                      onChange={handlePlanFieldChange}
                      placeholder="Adults"
                      className="w-full bg-white p-4 rounded-2xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 font-medium"
                    />
                    <input
                      type="number"
                      min="0"
                      name="children"
                      value={planForm.children}
                      onChange={handlePlanFieldChange}
                      placeholder="Children"
                      className="w-full bg-white p-4 rounded-2xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 font-medium"
                    />
                  </div>
                  <textarea
                    name="notes"
                    value={planForm.notes}
                    onChange={handlePlanFieldChange}
                    placeholder="Special requests, room setup, or questions..."
                    className="w-full bg-white p-4 rounded-2xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 font-medium h-28"
                  ></textarea>

                  <div className="rounded-3xl bg-white border border-gray-100 p-5 space-y-3">
                    <div className="flex items-center justify-between text-sm font-bold text-gray-500 uppercase">
                      <span className="flex items-center gap-2">
                        <IoPeopleOutline className="text-primary text-lg" /> Travelers
                      </span>
                      <span>{travelerCount || 1}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm font-bold text-gray-500 uppercase">
                      <span className="flex items-center gap-2">
                        <IoPricetagOutline className="text-primary text-lg" /> Estimated Total
                      </span>
                      <span className="text-primary text-xl font-black">
                        ${totalEstimate || Number(price || 0)}
                      </span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={planSubmitting}
                    className="w-full bg-primary text-white font-black py-4 rounded-2xl shadow-xl hover:translate-y-[-2px] transition-all disabled:bg-gray-400 uppercase tracking-widest"
                  >
                    {planSubmitting ? "Sending..." : "Send Trip Plan Request"}
                  </button>
                </form>
              )}
            </div>

            {seasonalPrices.length > 0 && (
              <div className="border p-8 rounded-[32px] overflow-hidden bg-gradient-to-br from-white to-gray-50">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                    <IoPricetagOutline className="text-2xl" />
                  </div>
                  <div>
                    <h4 className="font-black uppercase tracking-tight text-gray-900">
                      Seasonal Pricing
                    </h4>
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
                      Compare rates by travel season
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  {seasonalPrices.map((season) => (
                    <div
                      key={season.label}
                      className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white px-5 py-4"
                    >
                      <div>
                        <p className="text-sm font-black text-gray-900 uppercase tracking-tight">
                          {season.label}
                        </p>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                          {season.months}
                        </p>
                      </div>
                      <p className="text-xl font-black text-primary">
                        {season.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="border p-8 rounded-[32px] overflow-hidden">
              <button
                onClick={() => setIsInclusionsOpen(!isInclusionsOpen)}
                className="w-full flex justify-between items-center mb-6"
              >
                <h4 className="font-black uppercase tracking-tight text-gray-900">
                  What's Included
                </h4>
                <motion.div
                  animate={{ rotate: isInclusionsOpen ? 180 : 0 }}
                  className="text-gray-400"
                >
                  <IoChevronDownOutline />
                </motion.div>
              </button>
              <AnimatePresence>
                {isInclusionsOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <ul className="space-y-3">
                      {inclusions?.length > 0 ? (
                        inclusions.map((item, index) => (
                          <li
                            key={`${item}-${index}`}
                            className="flex items-start gap-2 text-sm text-gray-600 font-medium"
                          >
                            <span className="text-primary">+</span> {item}
                          </li>
                        ))
                      ) : (
                        <li className="text-sm text-gray-400 italic">No inclusions listed</li>
                      )}
                    </ul>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {exclusions?.length > 0 && (
              <div className="border p-8 rounded-[32px] overflow-hidden">
                <button
                  onClick={() => setIsExclusionsOpen(!isExclusionsOpen)}
                  className="w-full flex justify-between items-center mb-6"
                >
                  <h4 className="font-black uppercase tracking-tight text-gray-900">
                    What's Not Included
                  </h4>
                  <motion.div
                    animate={{ rotate: isExclusionsOpen ? 180 : 0 }}
                    className="text-gray-400"
                  >
                    <IoChevronDownOutline />
                  </motion.div>
                </button>
                <AnimatePresence>
                  {isExclusionsOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <ul className="space-y-3">
                        {exclusions.map((item, index) => (
                          <li
                            key={`${item}-${index}`}
                            className="flex items-start gap-2 text-sm text-gray-600 font-medium"
                          >
                            <span className="text-red-500">x</span> {item}
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {(tripAdvisorUrl || tripAdvisorRating || tripAdvisorReviewCount) && (
              <div className="border p-8 rounded-[32px] overflow-hidden bg-[#f5f9f7]">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-[#34e0a1]/15 text-[#00aa6c] flex items-center justify-center">
                    <IoStarOutline className="text-2xl" />
                  </div>
                  <div>
                    <h4 className="font-black uppercase tracking-tight text-gray-900">
                      Traveler Reviews
                    </h4>
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
                      TripAdvisor snapshot
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-5">
                  {tripAdvisorRating ? (
                    <div className="bg-white rounded-2xl p-4 border border-[#34e0a1]/20">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1">Rating</p>
                      <p className="text-3xl font-black text-[#00aa6c]">{tripAdvisorRating}/5</p>
                    </div>
                  ) : null}
                  {tripAdvisorReviewCount ? (
                    <div className="bg-white rounded-2xl p-4 border border-[#34e0a1]/20">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1">Reviews</p>
                      <p className="text-3xl font-black text-[#00aa6c]">{tripAdvisorReviewCount}</p>
                    </div>
                  ) : null}
                </div>

                {tripAdvisorUrl && (
                  <a
                    href={tripAdvisorUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="block w-full text-center bg-[#00aa6c] text-white font-black py-4 rounded-2xl uppercase tracking-widest hover:opacity-90 transition"
                  >
                    View on TripAdvisor
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 lg:px-24 mt-24 mb-16">
        <div className="flex justify-between items-end mb-12">
          <div>
            <span className="text-primary font-black uppercase text-xs tracking-widest mb-2 block">
              Discover More
            </span>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 uppercase tracking-tighter">
              Related Adventures
            </h2>
          </div>
          <Link
            to="/packages"
            className="mb-2 text-gray-400 font-bold hover:text-primary uppercase text-xs tracking-widest"
          >
            All Packages
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {relatedTours.map((tour) => (
            <PackageCard key={tour._id} {...tour} />
          ))}
        </div>
      </div>

      <div className="mt-16">
        <Testimonial />
      </div>

      <div className="mt-12 md:mt-16">
        <TripCTA />
      </div>

      <LogoSlider />

      <OrderPopup
        isVisible={isOrderPopupVisible}
        setOrderPopupVisible={setOrderPopupVisible}
        packageTour={title}
        packagePrice={price}
      />
    </div>
  );
};

export default PackageDetail;
