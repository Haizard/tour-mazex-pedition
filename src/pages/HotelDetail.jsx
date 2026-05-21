import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { FaArrowLeft, FaHotel, FaMapMarkerAlt } from "react-icons/fa";
import PlanMyTripWizard from "../components/PlanMyTrip/PlanMyTripWizard";
import HotelAiConciergeCard from "../components/Marketplace/HotelAiConciergeCard";
import { fetchPublicHotelBySlug } from "../services/api";
import { getHotelTrustLabel } from "../components/Marketplace/hotelTrustUtils";

const HotelDetail = () => {
  const { slug } = useParams();
  const [hotel, setHotel] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHotel = async () => {
      setLoading(true);
      try {
        const response = await fetchPublicHotelBySlug(slug);
        setHotel(response.data || null);
      } catch (error) {
        console.error("Hotel detail error:", error);
        setHotel(null);
      } finally {
        setLoading(false);
      }
    };

    if (slug) loadHotel();
  }, [slug]);

  const defaultMessage = useMemo(() => {
    if (!hotel) return "";
    return `I'm interested in ${hotel.name} in ${hotel.destination || "your destination"}. Please advise on fit, availability guidance, and whether this can be included in a wider itinerary.`;
  }, [hotel]);

  if (loading) {
    return <div className="min-h-screen bg-[#f6f1e8] pt-40 text-center font-bold text-slate-500">Loading hotel...</div>;
  }

  if (!hotel) {
    return (
      <div className="min-h-screen bg-[#f6f1e8] px-6 pt-40 text-center">
        <h1 className="text-2xl font-black uppercase text-slate-900">Hotel not found</h1>
        <Link to="/discover/hotels" className="mt-6 inline-block rounded-2xl bg-[#224433] px-6 py-3 text-xs font-black uppercase tracking-widest text-white">Back to hotels</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f1e8] px-5 pb-16 pt-32 text-slate-900 md:pt-40">
      <main className="mx-auto max-w-7xl">
        <Link to="/discover/hotels" className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-widest text-slate-500">
          <FaArrowLeft /> Back to hotels
        </Link>

        <section className="mt-8 overflow-hidden rounded-[36px] border border-[#d8c8ae] bg-white shadow-[0_24px_80px_rgba(35,66,50,0.12)]">
          <div className="grid lg:grid-cols-[1.1fr_0.9fr]">
            <div className="flex min-h-[420px] items-center justify-center bg-slate-200">
              {hotel.photos?.[0] ? <img src={hotel.photos[0]} alt={hotel.name} className="h-full w-full object-cover" /> : <FaHotel className="text-7xl text-slate-400" />}
            </div>
            <div className="p-8 md:p-10">
              <p className="text-[11px] font-black uppercase tracking-[0.3em] text-[#8b7451]">Hotel Marketplace</p>
              <h1 className="mt-4 text-4xl font-black uppercase tracking-tight md:text-5xl">{hotel.name}</h1>
              <p className="mt-4 flex items-center gap-2 text-sm font-black uppercase tracking-[0.16em] text-slate-500">
                <FaMapMarkerAlt className="text-primary" /> {hotel.destination || "Destination on request"}
              </p>
              <p className="mt-6 text-base font-medium leading-8 text-slate-600">{hotel.description || hotel.summary || "Hotel details are being prepared by the listed operator."}</p>
              <div className="mt-6 flex flex-wrap gap-2">
                {(hotel.amenities || []).map((amenity) => <span key={amenity} className="rounded-full bg-slate-100 px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-600">{amenity}</span>)}
              </div>
              <p className="mt-6 text-sm font-black text-slate-900">{getHotelTrustLabel(hotel)}</p>
            </div>
          </div>
        </section>

        <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1fr)_420px]">
          <HotelAiConciergeCard hotel={hotel} />
          <aside className="rounded-[36px] border border-[#d8c8ae] bg-white shadow-[0_24px_80px_rgba(35,66,50,0.12)]">
            <div className="bg-[#234232] p-6 text-white">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#d9c79f]">Hotel Inquiry</p>
              <h2 className="mt-2 text-2xl font-black uppercase tracking-tight">Request this hotel</h2>
              <p className="mt-3 text-sm font-medium leading-6 text-white/75">
                Ask directly about this hotel or request it inside a wider itinerary.
              </p>
            </div>
            <div className="p-1">
              <PlanMyTripWizard
                compact
                showIntro={false}
                sourceChannel="global-marketplace"
                campaignLabel={`hotel_${hotel._id}`}
                defaultDestinations={hotel.destination ? [hotel.destination] : [hotel.name]}
                defaultMessage={defaultMessage}
                operatorTenantId={hotel.operator?.id || ""}
                operatorTenantSlug={hotel.operator?.slug || ""}
                hotelId={hotel._id}
                hotelName={hotel.name}
                hotelIntentType="itinerary-add-on"
              />
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default HotelDetail;
