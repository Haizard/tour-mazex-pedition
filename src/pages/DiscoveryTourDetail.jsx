import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  FaArrowLeft,
  FaCalendarCheck,
  FaCheckCircle,
  FaClock,
  FaCompass,
  FaMapMarkerAlt,
  FaStar,
} from "react-icons/fa";
import PlanMyTripWizard from "../components/PlanMyTrip/PlanMyTripWizard";

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

  const itineraryStops = useMemo(() => {
    if (!Array.isArray(tour?.itinerary)) {
      return [];
    }

    return tour.itinerary.filter((day) => Array.isArray(day.events) && day.events.length > 0);
  }, [tour]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f6f1e8] px-6 pt-24">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!tour) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#f6f1e8] px-6 pt-24 text-center">
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
    <div className="min-h-screen bg-[#f6f1e8] px-4 pb-16 pt-24 md:px-6">
      <div className="mx-auto max-w-7xl">
        <Link
          to="/discover"
          className="mb-6 inline-flex items-center text-sm font-bold uppercase tracking-widest text-slate-500 transition-colors hover:text-primary"
        >
          <FaArrowLeft className="mr-2" /> Back to Discovery
        </Link>

        <div className="grid gap-8 xl:grid-cols-[1fr_380px]">
          <div className="space-y-8">
            <section className="overflow-hidden rounded-[36px] border border-[#d8c8ae] bg-white shadow-[0_24px_80px_rgba(35,66,50,0.12)]">
              <div className="relative h-[280px] md:h-[420px]">
                <img src={tour.image} alt={tour.title} className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 text-white">
                  <div className="flex flex-wrap gap-3">
                    <span className="rounded-full bg-white/15 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] backdrop-blur">
                      {tour.operator?.name || "Verified Operator"}
                    </span>
                    <span className="rounded-full bg-[#d9a441]/90 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#2d2312]">
                      {tour.category || "Curated Journey"}
                    </span>
                  </div>
                  <h1 className="mt-4 max-w-4xl text-3xl font-black uppercase tracking-[-0.05em] md:text-5xl">
                    {tour.title}
                  </h1>
                  <div className="mt-5 flex flex-wrap gap-3 text-[11px] font-black uppercase tracking-[0.18em] text-white/90">
                    <span className="rounded-full bg-white/15 px-4 py-2 backdrop-blur">{tour.location}</span>
                    <span className="rounded-full bg-white/15 px-4 py-2 backdrop-blur">
                      {tour.duration || "Multi-day"}
                    </span>
                    <span className="rounded-full bg-white/15 px-4 py-2 backdrop-blur">
                      Starting from ${tour.price}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-6 md:p-8">
                <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#8b7451]">
                      Experience Overview
                    </p>
                    <p className="mt-4 text-base font-medium leading-8 text-slate-600">
                      {tour.description}
                    </p>
                  </div>

                  <div className="rounded-[30px] border border-[#e4d6be] bg-[#fbf8f1] p-5">
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#8b7451]">
                      Marketplace Trust
                    </p>
                    <div className="mt-4 space-y-3">
                      <div className="flex items-start gap-3 rounded-2xl bg-white px-4 py-4">
                        <FaCheckCircle className="mt-1 text-primary" />
                        <div>
                          <p className="text-sm font-black uppercase tracking-wide text-slate-900">
                            Verified operator profile
                          </p>
                          <p className="mt-1 text-sm font-medium leading-6 text-slate-600">
                            This listing is tied to {tour.operator?.name || "a verified operator"} inside the
                            platform, so inquiries keep the correct tenant attribution.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 rounded-2xl bg-white px-4 py-4">
                        <FaStar className="mt-1 text-[#d9a441]" />
                        <div>
                          <p className="text-sm font-black uppercase tracking-wide text-slate-900">
                            Review snapshot
                          </p>
                          <p className="mt-1 text-sm font-medium leading-6 text-slate-600">
                            {tour.tripAdvisorRating
                              ? `${tour.tripAdvisorRating}/5 from ${tour.tripAdvisorReviewCount || 0} published reviews.`
                              : "No external review score has been published for this package yet."}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 rounded-2xl bg-white px-4 py-4">
                        <FaCompass className="mt-1 text-primary" />
                        <div>
                          <p className="text-sm font-black uppercase tracking-wide text-slate-900">
                            Marketplace inquiry flow
                          </p>
                          <p className="mt-1 text-sm font-medium leading-6 text-slate-600">
                            Use the inquiry form to request dates, availability, and a final quote from the
                            operator who owns this itinerary.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="grid gap-6 lg:grid-cols-3">
              <div className="rounded-[30px] border border-[#d8c8ae] bg-white p-6 shadow-[0_18px_60px_rgba(35,66,50,0.08)]">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#8b7451]">Location</p>
                <p className="mt-3 flex items-center gap-3 text-xl font-black uppercase tracking-tight text-slate-900">
                  <FaMapMarkerAlt className="text-primary" />
                  {tour.location}
                </p>
              </div>
              <div className="rounded-[30px] border border-[#d8c8ae] bg-white p-6 shadow-[0_18px_60px_rgba(35,66,50,0.08)]">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#8b7451]">Duration</p>
                <p className="mt-3 flex items-center gap-3 text-xl font-black uppercase tracking-tight text-slate-900">
                  <FaClock className="text-primary" />
                  {tour.duration || "Multi-day"}
                </p>
              </div>
              <div className="rounded-[30px] border border-[#d8c8ae] bg-white p-6 shadow-[0_18px_60px_rgba(35,66,50,0.08)]">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#8b7451]">
                  Starting price
                </p>
                <p className="mt-3 flex items-center gap-3 text-xl font-black uppercase tracking-tight text-slate-900">
                  <FaCalendarCheck className="text-primary" /> ${tour.price}
                </p>
              </div>
            </section>

            {itineraryStops.length > 0 && (
              <section className="rounded-[36px] border border-[#d8c8ae] bg-white p-6 shadow-[0_20px_70px_rgba(35,66,50,0.08)] md:p-8">
                <div className="mb-6 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#8b7451]">
                      Route Snapshot
                    </p>
                    <h2 className="mt-2 text-2xl font-black uppercase tracking-tight text-slate-900">
                      Itinerary overview
                    </h2>
                  </div>
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
                          {relatedTour.duration || "Multi-day"} • ${relatedTour.price}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>

          <aside className="space-y-6 xl:sticky xl:top-24 xl:h-fit">
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
                <div className="rounded-2xl bg-slate-50 px-4 py-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                    Marketplace status
                  </p>
                  <p className="mt-2 text-sm font-black uppercase tracking-wide text-slate-900">
                    Visible and inquiry-ready
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                    External reviews
                  </p>
                  <p className="mt-2 text-sm font-black uppercase tracking-wide text-slate-900">
                    {tour.tripAdvisorReviewCount
                      ? `${tour.tripAdvisorReviewCount} published reviews`
                      : "Review count unavailable"}
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
