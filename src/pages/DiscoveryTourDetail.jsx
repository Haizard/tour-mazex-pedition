import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  FaArrowLeft,
  FaBalanceScale,
  FaCalendarCheck,
  FaCheckCircle,
  FaClock,
  FaCompass,
  FaHeadset,
  FaMapMarkerAlt,
  FaRoute,
  FaStar,
  FaSuitcaseRolling,
  FaUsers,
  FaHeart,
} from "react-icons/fa";
import PlanMyTripWizard from "../components/PlanMyTrip/PlanMyTripWizard";
import PackageQuestionsPanel from "../components/Marketplace/PackageQuestionsPanel";
import PublicReviewFeed from "../components/Marketplace/PublicReviewFeed";
import ReviewSubmissionForm from "../components/Marketplace/ReviewSubmissionForm";
import ReviewSummaryPanel from "../components/Marketplace/ReviewSummaryPanel";
import TravelerPhotoGallery from "../components/Marketplace/TravelerPhotoGallery";
import TravelerPhotoSubmissionForm from "../components/Marketplace/TravelerPhotoSubmissionForm";
import {
  fetchMarketplacePhotos,
  fetchMarketplaceQuestions,
  fetchMarketplaceReviews,
  fetchMarketplaceSavedTrips,
  fetchMarketplaceComparisons,
  updateMarketplaceSavedTrips,
  updateMarketplaceComparisons,
} from "../services/api";
import { getMarketplaceTravelerSessionKey } from "../components/Marketplace/travelerSession";

const getDiscoveryApiUrl = (path, params = null) => {
  const query = params ? `?${params.toString()}` : "";

  if (import.meta.env.VITE_SITE_URL) {
    return `${import.meta.env.VITE_SITE_URL}${path}${query}`;
  }

  return `${path}${query}`;
};

const DiscoveryTourDetail = () => {
  const { id } = useParams();
  const [tour, setTour] = useState(null);
  const [relatedTours, setRelatedTours] = useState([]);
  const [reviewData, setReviewData] = useState({ summary: null, reviews: [] });
  const [photoData, setPhotoData] = useState([]);
  const [questionData, setQuestionData] = useState([]);
  const [savedTripIds, setSavedTripIds] = useState([]);
  const [comparisonTripIds, setComparisonTripIds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTour = async () => {
      try {
        const res = await fetch(getDiscoveryApiUrl(`/api/discovery/tours/${id}`));
        if (!res.ok) throw new Error("Tour not found");
        const data = await res.json();
        setTour(data);
      } catch (error) {
        console.error("Discovery error:", error);
        setTour(null);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchTour();
    }
  }, [id]);

  useEffect(() => {
    const fetchRelatedTours = async () => {
      if (!tour) {
        return;
      }

      try {
        const searchParams = new URLSearchParams({
          limit: "4",
          sort: "featured",
        });

        if (tour.operator?.slug) {
          searchParams.set("operator", tour.operator.slug);
        } else if (tour.category) {
          searchParams.set("category", tour.category);
        }

        const res = await fetch(getDiscoveryApiUrl("/api/discovery/tours", searchParams));
        if (!res.ok) {
          throw new Error("Failed to fetch related tours");
        }

        const data = await res.json();
        setRelatedTours((data.tours || []).filter((item) => item._id !== tour._id).slice(0, 3));
      } catch (error) {
        console.error("Related discovery error:", error);
        setRelatedTours([]);
      }
    };

    fetchRelatedTours();
  }, [tour]);

  const reloadMarketplaceEngagement = async (activeTour = tour) => {
    if (!activeTour?._id) {
      return;
    }

    try {
      const [reviewsResponse, photosResponse, questionsResponse] = await Promise.all([
        fetchMarketplaceReviews(activeTour._id, {
          tenantId: activeTour.operator?.id || "",
        }),
        fetchMarketplacePhotos(activeTour._id),
        fetchMarketplaceQuestions(activeTour._id),
      ]);

      setReviewData(reviewsResponse.data || { summary: null, reviews: [] });
      setPhotoData(photosResponse.data || []);
      setQuestionData(questionsResponse.data || []);
    } catch (error) {
      console.error("Marketplace engagement error:", error);
      setReviewData({ summary: null, reviews: [] });
      setPhotoData([]);
      setQuestionData([]);
    }
  };

  useEffect(() => {
    reloadMarketplaceEngagement();
  }, [tour]);

  useEffect(() => {
    const loadShopState = async () => {
      try {
        const sessionKey = getMarketplaceTravelerSessionKey();
        const [savedResponse, comparisonResponse] = await Promise.all([
          fetchMarketplaceSavedTrips({ sessionKey }),
          fetchMarketplaceComparisons({ sessionKey }),
        ]);
        setSavedTripIds((savedResponse.data?.tours || []).map((item) => item._id));
        setComparisonTripIds((comparisonResponse.data?.tours || []).map((item) => item._id));
      } catch (error) {
        console.error("Marketplace traveler state error:", error);
      }
    };

    loadShopState();
  }, []);

  const toggleSavedTrip = async () => {
    if (!tour?._id) {
      return;
    }

    const nextIds = savedTripIds.includes(tour._id)
      ? savedTripIds.filter((id) => id !== tour._id)
      : [...savedTripIds, tour._id];

    try {
      const response = await updateMarketplaceSavedTrips({
        sessionKey: getMarketplaceTravelerSessionKey(),
        selectedTourIds: nextIds,
      });
      setSavedTripIds((response.data?.tours || []).map((item) => item._id));
    } catch (error) {
      console.error("Saved trip toggle error:", error);
    }
  };

  const toggleComparisonTrip = async () => {
    if (!tour?._id) {
      return;
    }

    const nextIds = comparisonTripIds.includes(tour._id)
      ? comparisonTripIds.filter((id) => id !== tour._id)
      : [...comparisonTripIds, tour._id];

    try {
      const response = await updateMarketplaceComparisons({
        sessionKey: getMarketplaceTravelerSessionKey(),
        selectedTourIds: nextIds,
      });
      setComparisonTripIds((response.data?.tours || []).map((item) => item._id));
    } catch (error) {
      console.error("Comparison toggle error:", error);
    }
  };

  const itineraryStops = useMemo(() => {
    if (!Array.isArray(tour?.itinerary)) {
      return [];
    }

    return tour.itinerary.filter((day) => Array.isArray(day.events) && day.events.length > 0);
  }, [tour]);

  const galleryImages = useMemo(() => {
    const images = [];

    if (tour?.image) {
      images.push(tour.image);
    }

    if (Array.isArray(tour?.galleryImages)) {
      for (const image of tour.galleryImages) {
        if (image && !images.includes(image)) {
          images.push(image);
        }
      }
    }

    return images.slice(0, 4);
  }, [tour]);

  const quickStats = useMemo(
    () => [
      {
        label: "Location",
        value: tour?.location || "Custom route",
        icon: <FaMapMarkerAlt className="text-primary" />,
      },
      {
        label: "Duration",
        value: tour?.duration || "Multi-day",
        icon: <FaClock className="text-primary" />,
      },
      {
        label: "Starting price",
        value: `$${Number(tour?.price || 0).toLocaleString()}`,
        icon: <FaCalendarCheck className="text-primary" />,
      },
      {
        label: "Travel style",
        value: tour?.tourType || tour?.category || "Curated package",
        icon: <FaCompass className="text-primary" />,
      },
      {
        label: "Group size",
        value: tour?.maxGroupSize ? `${tour.maxGroupSize} guests` : "Private or custom",
        icon: <FaUsers className="text-primary" />,
      },
      {
        label: "Route type",
        value: tour?.startLocation && tour?.endLocation
          ? `${tour.startLocation} to ${tour.endLocation}`
          : "Operator-planned flow",
        icon: <FaRoute className="text-primary" />,
      },
    ],
    [tour],
  );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f6f1e8] px-6 pt-32 md:pt-40">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!tour) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#f6f1e8] px-6 pt-32 text-center md:pt-40">
        <h2 className="text-2xl font-black uppercase text-slate-800">Tour Not Found</h2>
        <p className="mt-2 text-slate-500">This tour may no longer be available on the marketplace.</p>
        <Link
          to="/discover"
          className="mt-6 rounded-2xl bg-primary px-6 py-3 text-xs font-black uppercase tracking-widest text-white"
        >
          Back to Discovery
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f1e8] px-4 pb-20 pt-32 md:px-6 md:pt-40">
      <div className="mx-auto max-w-7xl">
        <Link
          to="/discover"
          className="mb-8 inline-flex items-center text-sm font-bold uppercase tracking-widest text-slate-500 transition-colors hover:text-primary"
        >
          <FaArrowLeft className="mr-2" /> Back to Discovery
        </Link>

        <div className="grid gap-8 xl:grid-cols-[1fr_380px]">
          <div className="space-y-8">
            <section className="overflow-hidden rounded-[36px] border border-[#d8c8ae] bg-white shadow-[0_24px_80px_rgba(35,66,50,0.12)]">
              <div className="relative h-[320px] md:h-[500px]">
                <img src={tour.image} alt={tour.title} className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#102519]/74 via-[#102519]/18 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-6 md:p-10 text-white">
                  <h1 className="mt-5 max-w-4xl text-3xl font-black uppercase tracking-[-0.05em] md:text-6xl">
                    {tour.title}
                  </h1>
                </div>
              </div>
            </section>

            <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {quickStats.map((item) => (
                <div
                  key={item.label}
                  className="rounded-[30px] border border-[#d8c8ae] bg-white p-6 shadow-[0_18px_60px_rgba(35,66,50,0.08)]"
                >
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#8b7451]">{item.label}</p>
                  <p className="mt-3 flex items-center gap-3 text-xl font-black uppercase tracking-tight text-slate-900">
                    {item.icon}
                    <span>{item.value}</span>
                  </p>
                </div>
              ))}
            </section>

            <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-[36px] border border-[#d8c8ae] bg-white p-6 shadow-[0_20px_70px_rgba(35,66,50,0.08)] md:p-8">
                <div className="flex flex-wrap gap-3">
                  <span className="rounded-full bg-[#224433] px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-white">
                    {tour.operator?.name || "Verified Operator"}
                  </span>
                  <span className="rounded-full bg-[#f4e1b4] px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#6b531f]">
                    {tour.category || "Curated Journey"}
                  </span>
                  <span className="rounded-full bg-[#eef4ed] px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#224433]">
                    {tour.location || "East Africa"}
                  </span>
                  <span className="rounded-full bg-[#eef4ed] px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#224433]">
                    {tour.duration || "Multi-day"}
                  </span>
                  <span className="rounded-full bg-[#fff7e6] px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#6b531f]">
                    From ${Number(tour.price || 0).toLocaleString()}
                  </span>
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#8b7451]">
                  Experience Overview
                </p>
                <div className="mt-5 rounded-[28px] bg-[#fbf8f1] p-5">
                  <p className="text-base font-medium leading-8 text-slate-700">{tour.description}</p>
                </div>

                {(Array.isArray(tour.destinationsVisited) && tour.destinationsVisited.length > 0) && (
                  <div className="mt-8">
                    <h2 className="text-xl font-black uppercase tracking-tight text-slate-900">
                      Destinations on this route
                    </h2>
                    <div className="mt-4 flex flex-wrap gap-3">
                      {tour.destinationsVisited.map((destination) => (
                        <span
                          key={destination}
                          className="rounded-full border border-[#e2d2b7] bg-[#f6f1e8] px-4 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-slate-700"
                        >
                          {destination}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-8">
                <div className="rounded-[36px] border border-[#e4d6be] bg-[#fbf8f1] p-6 shadow-[0_18px_60px_rgba(35,66,50,0.06)]">
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#8b7451]">
                    Marketplace Trust
                  </p>
                  <div className="mt-4 space-y-3">
                    <div className="flex items-start gap-3 rounded-2xl bg-white px-4 py-4">
                      <FaCheckCircle className="mt-1 text-primary" />
                      <div>
                        <p className="text-sm font-black uppercase tracking-wide text-slate-900">
                          Marketplace visibility
                        </p>
                        <p className="mt-1 text-sm font-medium leading-6 text-slate-600">
                          This package is currently published on the marketplace and can accept traveler
                          inquiries from this page.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 rounded-2xl bg-white px-4 py-4">
                      <FaStar className="mt-1 text-[#d9a441]" />
                      <div>
                        <p className="text-sm font-black uppercase tracking-wide text-slate-900">
                          External review signal
                        </p>
                        <p className="mt-1 text-sm font-medium leading-6 text-slate-600">
                          {tour.tripAdvisorRating
                            ? `${tour.tripAdvisorRating}/5 from ${tour.tripAdvisorReviewCount || 0} published reviews.`
                            : "No published external review snapshot is connected to this package yet."}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 rounded-2xl bg-white px-4 py-4">
                      <FaHeadset className="mt-1 text-primary" />
                      <div>
                        <p className="text-sm font-black uppercase tracking-wide text-slate-900">
                          Marketplace inquiry flow
                        </p>
                        <p className="mt-1 text-sm font-medium leading-6 text-slate-600">
                          Use the inquiry form to request dates, availability, and a quote. Marketplace
                          inquiries from this page are routed to {tour.operator?.name || "the listed operator"}.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-[36px] border border-[#d8c8ae] bg-white p-6 shadow-[0_18px_60px_rgba(35,66,50,0.08)]">
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#8b7451]">
                    Why travelers shortlist this
                  </p>
                  <div className="mt-5 space-y-3">
                    <div className="rounded-2xl bg-slate-50 px-4 py-4">
                      <p className="text-sm font-black uppercase tracking-wide text-slate-900">
                        Operator-led itinerary
                      </p>
                      <p className="mt-1 text-sm font-medium leading-6 text-slate-600">
                        Package details, pricing, and responses stay connected to the original operator.
                      </p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 px-4 py-4">
                      <p className="text-sm font-black uppercase tracking-wide text-slate-900">
                        Clear route structure
                      </p>
                      <p className="mt-1 text-sm font-medium leading-6 text-slate-600">
                        Review the journey flow, accommodation notes, and route highlights before you inquire.
                      </p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 px-4 py-4">
                      <p className="text-sm font-black uppercase tracking-wide text-slate-900">
                        Faster comparison
                      </p>
                      <p className="mt-1 text-sm font-medium leading-6 text-slate-600">
                        Compare this package with other marketplace trips without losing context on style or budget.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {(Array.isArray(tour.inclusions) && tour.inclusions.length > 0) || (Array.isArray(tour.exclusions) && tour.exclusions.length > 0) ? (
              <section className="grid gap-6 lg:grid-cols-2">
                <div className="rounded-[36px] border border-[#d8c8ae] bg-white p-6 shadow-[0_20px_70px_rgba(35,66,50,0.08)] md:p-8">
                  <div className="flex items-center gap-3">
                    <FaCheckCircle className="text-primary" />
                    <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900">
                      What’s included
                    </h2>
                  </div>
                  <div className="mt-5 space-y-3">
                    {(tour.inclusions || []).map((item) => (
                      <div key={item} className="rounded-2xl bg-[#f6f1e8] px-4 py-4 text-sm font-medium text-slate-700">
                        {item}
                      </div>
                    ))}
                    {(!tour.inclusions || tour.inclusions.length === 0) && (
                      <p className="text-sm font-medium text-slate-500">No inclusion details provided yet.</p>
                    )}
                  </div>
                </div>

                <div className="rounded-[36px] border border-[#d8c8ae] bg-white p-6 shadow-[0_20px_70px_rgba(35,66,50,0.08)] md:p-8">
                  <div className="flex items-center gap-3">
                    <FaSuitcaseRolling className="text-primary" />
                    <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900">
                      What to plan for
                    </h2>
                  </div>
                  <div className="mt-5 space-y-3">
                    {(tour.exclusions || []).map((item) => (
                      <div key={item} className="rounded-2xl bg-slate-50 px-4 py-4 text-sm font-medium text-slate-700">
                        {item}
                      </div>
                    ))}
                    {(!tour.exclusions || tour.exclusions.length === 0) && (
                      <p className="text-sm font-medium text-slate-500">No exclusion details provided yet.</p>
                    )}
                  </div>
                </div>
              </section>
            ) : null}

            {galleryImages.length > 1 && (
              <section className="rounded-[36px] border border-[#d8c8ae] bg-white p-6 shadow-[0_20px_70px_rgba(35,66,50,0.08)] md:p-8">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#8b7451]">
                  Visual Preview
                </p>
                <h2 className="mt-2 text-2xl font-black uppercase tracking-tight text-slate-900">
                  Gallery from this package
                </h2>
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  {galleryImages.map((image, index) => (
                    <div key={`${image}-${index}`} className="overflow-hidden rounded-[28px] border border-slate-100 bg-slate-50">
                      <img src={image} alt={`${tour.title} gallery ${index + 1}`} className="h-64 w-full object-cover" />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {itineraryStops.length > 0 && (
              <section className="rounded-[36px] border border-[#d8c8ae] bg-white p-6 shadow-[0_20px_70px_rgba(35,66,50,0.08)] md:p-8">
                <div className="mb-6">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#8b7451]">
                    Route Snapshot
                  </p>
                  <h2 className="mt-2 text-2xl font-black uppercase tracking-tight text-slate-900">
                    Itinerary overview
                  </h2>
                </div>
                <div className="space-y-4">
                  {itineraryStops.map((day) => (
                    <div
                      key={day.day}
                      className="grid gap-4 rounded-[28px] border border-slate-100 bg-slate-50 p-5 md:grid-cols-[72px_1fr]"
                    >
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#234232] text-sm font-black uppercase tracking-widest text-white">
                        D{day.day}
                      </div>
                      <div>
                        <p className="text-sm font-black uppercase tracking-wide text-slate-900">
                          {day.events.join(", ")}
                        </p>
                        {day.accommodation && (
                          <p className="mt-2 text-sm font-medium leading-6 text-slate-600">
                            Accommodation: {day.accommodation}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <ReviewSummaryPanel summary={reviewData.summary || tour.marketplace} />
            <PublicReviewFeed reviews={reviewData.reviews || []} />
            <ReviewSubmissionForm
              tenantId={tour.operator?.id || ""}
              tourId={tour._id}
              onSubmitted={() => reloadMarketplaceEngagement(tour)}
            />

            <TravelerPhotoGallery photos={photoData} />
            <TravelerPhotoSubmissionForm
              tenantId={tour.operator?.id || ""}
              tourId={tour._id}
              onSubmitted={() => reloadMarketplaceEngagement(tour)}
            />

            <PackageQuestionsPanel
              questions={questionData}
              tenantId={tour.operator?.id || ""}
              tourId={tour._id}
              communityEnabled={tour.operator?.marketplaceSettings?.allowCommunityQnA !== false}
              onSubmitted={() => reloadMarketplaceEngagement(tour)}
            />

            {(Array.isArray(tour.faqs) && tour.faqs.length > 0) && (
              <section className="rounded-[36px] border border-[#d8c8ae] bg-white p-6 shadow-[0_20px_70px_rgba(35,66,50,0.08)] md:p-8">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#8b7451]">
                  Questions Travelers Ask
                </p>
                <h2 className="mt-2 text-2xl font-black uppercase tracking-tight text-slate-900">
                  Frequently asked questions
                </h2>
                <div className="mt-6 space-y-4">
                  {tour.faqs.map((faq, index) => (
                    <div key={`${faq.question}-${index}`} className="rounded-[28px] border border-slate-100 bg-slate-50 px-5 py-5">
                      <h3 className="text-sm font-black uppercase tracking-wide text-slate-900">
                        {faq.question}
                      </h3>
                      <p className="mt-2 text-sm font-medium leading-7 text-slate-600">{faq.answer}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {relatedTours.length > 0 && (
              <section className="rounded-[36px] border border-[#d8c8ae] bg-white p-6 shadow-[0_20px_70px_rgba(35,66,50,0.08)] md:p-8">
                <div className="mb-6">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#8b7451]">
                    Keep Exploring
                  </p>
                  <h2 className="mt-2 text-2xl font-black uppercase tracking-tight text-slate-900">
                    More from this operator or style
                  </h2>
                </div>
                <div className="grid gap-5 md:grid-cols-3">
                  {relatedTours.map((relatedTour) => (
                    <Link
                      key={relatedTour._id}
                      to={`/discover/tour/${relatedTour._id}`}
                      className="group overflow-hidden rounded-[28px] border border-slate-100 bg-slate-50 transition hover:-translate-y-1 hover:shadow-lg"
                    >
                      <div className="h-40 overflow-hidden">
                        <img
                          src={relatedTour.image}
                          alt={relatedTour.title}
                          className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                        />
                      </div>
                      <div className="p-4">
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#8b7451]">
                          {relatedTour.operator?.name || "Verified Operator"}
                        </p>
                        <h3 className="mt-2 text-lg font-black uppercase tracking-tight text-slate-900">
                          {relatedTour.title}
                        </h3>
                        <p className="mt-2 text-sm font-medium text-slate-600">
                          {relatedTour.duration || "Multi-day"} - ${Number(relatedTour.price || 0).toLocaleString()}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>

          <aside className="space-y-6 xl:sticky xl:top-32 xl:h-fit">
            <div className="overflow-hidden rounded-[36px] border border-[#d8c8ae] bg-white shadow-[0_24px_80px_rgba(35,66,50,0.12)]">
              <div className="bg-[#234232] p-6 text-white">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#d9c79f]">
                  Direct Inquiry
                </p>
                <h3 className="mt-2 text-2xl font-black uppercase tracking-tight">Request this trip</h3>
                <p className="mt-3 text-sm font-medium leading-6 text-white/75">
                  Your request will be tied to {tour.operator?.name || "the operator"} who owns this package.
                </p>
              </div>
              <div className="p-1">
                <PlanMyTripWizard
                  compact={true}
                  showIntro={false}
                  sourceChannel="global-marketplace"
                  campaignLabel={`tour_${tour._id}`}
                  defaultDestinations={[tour.title]}
                  defaultMessage={`I'm interested in booking the "${tour.title}" operated by ${tour.operator?.name || "your partner"}.`}
                  operatorTenantId={tour.operator?.id || ""}
                  operatorTenantSlug={tour.operator?.slug || ""}
                />
              </div>
            </div>

            <div className="rounded-[32px] border border-[#d8c8ae] bg-white p-6 shadow-[0_18px_60px_rgba(35,66,50,0.08)]">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#8b7451]">
                Operator Snapshot
              </p>
              <h3 className="mt-3 text-xl font-black uppercase tracking-tight text-slate-900">
                {tour.operator?.name || "Verified operator"}
              </h3>
              <p className="mt-3 text-sm font-medium leading-7 text-slate-600">
                This package is discoverable through the marketplace, but fulfillment stays with the original
                operator so pricing, availability, and trip details remain accurate.
              </p>
              <div className="mt-5 grid gap-3">
                <button
                  type="button"
                  onClick={toggleSavedTrip}
                  className={`rounded-2xl px-4 py-4 text-left transition ${
                    savedTripIds.includes(tour._id)
                      ? "bg-[#224433] text-white"
                      : "bg-slate-50 text-slate-900 hover:bg-[#eef4ed]"
                  }`}
                >
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-current/70">
                    Saved trips
                  </p>
                  <p className="mt-2 flex items-center gap-2 text-sm font-black uppercase tracking-wide">
                    <FaHeart /> {savedTripIds.includes(tour._id) ? "Saved to shortlist" : "Save for later"}
                  </p>
                </button>
                <button
                  type="button"
                  onClick={toggleComparisonTrip}
                  className={`rounded-2xl px-4 py-4 text-left transition ${
                    comparisonTripIds.includes(tour._id)
                      ? "bg-[#d9a441] text-[#224433]"
                      : "bg-slate-50 text-slate-900 hover:bg-[#fff7e6]"
                  }`}
                >
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-current/70">
                    Comparison set
                  </p>
                  <p className="mt-2 flex items-center gap-2 text-sm font-black uppercase tracking-wide">
                    <FaBalanceScale /> {comparisonTripIds.includes(tour._id) ? "In compare set" : "Add to compare"}
                  </p>
                </button>
                <div className="rounded-2xl bg-slate-50 px-4 py-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                    Marketplace status
                  </p>
                  <p className="mt-2 text-sm font-black uppercase tracking-wide text-slate-900">
                    {tour.isMarketplaceVisible ? "Visible and inquiry-ready" : "Visibility not confirmed"}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                    External reviews
                  </p>
                  <p className="mt-2 text-sm font-black uppercase tracking-wide text-slate-900">
                    {tour.tripAdvisorRating || tour.tripAdvisorReviewCount
                      ? `${tour.tripAdvisorReviewCount || "Some"} published reviews`
                      : "Not connected yet"}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                    Inquiry setup
                  </p>
                  <p className="mt-2 text-sm font-black uppercase tracking-wide text-slate-900">
                    Routes to listed operator
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default DiscoveryTourDetail;
