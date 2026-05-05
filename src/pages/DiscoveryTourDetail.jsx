import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { FaArrowLeft, FaMapMarkerAlt, FaClock, FaCalendarCheck } from "react-icons/fa";
import PlanMyTripWizard from "../components/PlanMyTrip/PlanMyTripWizard";

const DiscoveryTourDetail = () => {
  const { id } = useParams();
  const [tour, setTour] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTour = async () => {
      try {
        const apiUrl = import.meta.env.VITE_SITE_URL 
          ? `${import.meta.env.VITE_SITE_URL}/api/discovery/tours/${id}`
          : `/api/discovery/tours/${id}`;
          
        const res = await fetch(apiUrl);
        if (!res.ok) throw new Error("Tour not found");
        const data = await res.json();
        setTour(data);
      } catch (error) {
        console.error("Discovery error:", error);
      } finally {
        setLoading(false);
      }
    };
    
    if (id) fetchTour();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 pt-24 px-6 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!tour) {
    return (
      <div className="min-h-screen bg-slate-50 pt-24 px-6 flex flex-col justify-center items-center">
        <h2 className="text-2xl font-black uppercase text-slate-800">Tour Not Found</h2>
        <p className="mt-2 text-slate-500">This tour may no longer be available on the marketplace.</p>
        <Link to="/discover" className="mt-6 px-6 py-3 bg-primary text-white text-xs font-black uppercase tracking-widest rounded-xl">
          Back to Discovery
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-16 px-4 md:px-6 font-sans">
      <div className="max-w-6xl mx-auto">
        <Link to="/discover" className="inline-flex items-center text-sm font-bold text-slate-500 uppercase tracking-widest hover:text-primary mb-6 transition-colors">
          <FaArrowLeft className="mr-2" /> Back to Discovery
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8">
          {/* Main Content */}
          <div className="space-y-8">
            <div className="bg-white rounded-[32px] overflow-hidden shadow-sm border border-slate-100 p-6 md:p-10">
              <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <div className="bg-primary/10 text-primary px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-primary/20">
                  Operated by {tour.tenantId?.name || "Global Network"}
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wide">
                  <FaMapMarkerAlt className="text-slate-400" />
                  {tour.location}
                </div>
              </div>

              <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-slate-900 leading-tight mb-4">
                {tour.title}
              </h1>

              <div className="flex flex-wrap gap-4 mb-8">
                <span className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl text-xs font-bold text-slate-700 uppercase">
                  <FaClock className="text-slate-400" /> {tour.duration || "Multi-day"}
                </span>
                <span className="flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-xl text-xs font-bold text-emerald-700 uppercase border border-emerald-100">
                  <FaCalendarCheck className="text-emerald-400" /> Starting from ${tour.price}
                </span>
              </div>

              {/* Cover Image */}
              <div className="w-full h-64 md:h-96 rounded-2xl overflow-hidden mb-8">
                <img src={tour.image} alt={tour.title} className="w-full h-full object-cover" />
              </div>

              <div className="prose prose-slate max-w-none font-medium text-slate-600 leading-relaxed mb-8">
                <p>{tour.description}</p>
              </div>

              {/* Itinerary Snippet */}
              {tour.itinerary && tour.itinerary.length > 0 && (
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tight text-slate-900 mb-4 border-b border-slate-100 pb-2">
                    Itinerary Overview
                  </h3>
                  <div className="space-y-4">
                    {tour.itinerary.map((day) => (
                      <div key={day.day} className="flex gap-4">
                        <div className="flex-shrink-0 w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-sm font-black text-slate-400">
                          D{day.day}
                        </div>
                        <div className="pt-1">
                          <p className="text-sm font-bold text-slate-800">{day.events.join(", ")}</p>
                          {day.accommodation && (
                            <p className="text-xs text-slate-500 mt-1">Stay: {day.accommodation}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar / Booking Widget */}
          <div className="lg:sticky lg:top-24 h-fit">
            <div className="bg-white rounded-[32px] shadow-xl border border-slate-100 overflow-hidden">
              <div className="bg-slate-900 p-6 text-white text-center">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70 mb-1">
                  Book This Experience
                </p>
                <h3 className="text-xl font-black uppercase tracking-tight">
                  Request a Quote
                </h3>
              </div>
              <div className="p-1">
                {/* Embedded PlanMyTripWidget configured for Global Marketplace attribution */}
                <PlanMyTripWizard 
                  compact={true} 
                  showIntro={false}
                  sourceChannel="global-marketplace"
                  campaignLabel={`tour_${tour._id}`}
                  defaultDestinations={[tour.title]}
                  defaultMessage={`I'm interested in booking the "${tour.title}" operated by ${tour.tenantId?.name || 'your partner'}.`}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiscoveryTourDetail;
