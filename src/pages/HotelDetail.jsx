import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { FaArrowLeft, FaHotel, FaMapMarkerAlt } from "react-icons/fa";
import PlanMyTripWizard from "../components/PlanMyTrip/PlanMyTripWizard";
import HotelDirectInquiryForm from "../components/Marketplace/HotelDirectInquiryForm";
import HotelAiConciergeCard from "../components/Marketplace/HotelAiConciergeCard";
import HotelBookingWidget from "../components/Marketplace/HotelBookingWidget";
import HospitalityPairingPanel from "../components/Marketplace/HospitalityPairingPanel";
import { fetchPublicHotelBySlug, fetchRelatedHotels } from "../services/api";
import { getHotelTrustLabel } from "../components/Marketplace/hotelTrustUtils";
import { buildHotelIntentOptions } from "./hotelDiscoveryUtils";

const HotelDetail = () => {
  const { slug } = useParams();
  const [hotel, setHotel] = useState(null);
  const [relatedHotels, setRelatedHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIntentId, setSelectedIntentId] = useState("direct");

  useEffect(() => {
    const loadHotel = async () => {
      setLoading(true);
      try {
        const response = await fetchPublicHotelBySlug(slug);
        setHotel(response.data || null);
        const relatedResponse = await fetchRelatedHotels(slug).catch(() => ({ data: { hotels: [] } }));
        setRelatedHotels(relatedResponse.data?.hotels || []);
      } catch (error) {
        console.error("Hotel detail error:", error);
        setHotel(null);
        setRelatedHotels([]);
      } finally {
        setLoading(false);
      }
    };

    if (slug) loadHotel();
  }, [slug]);

  const intentOptions = useMemo(() => buildHotelIntentOptions(hotel || {}), [hotel]);
  const selectedIntent = useMemo(
    () => intentOptions.find((option) => option.id === selectedIntentId) || intentOptions[0],
    [intentOptions, selectedIntentId]
  );
  const defaultMessage = useMemo(() => {
    if (!hotel || !selectedIntent) return "";
    return selectedIntent.payload.message;
  }, [hotel, selectedIntent]);

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
        <Link
          to="/discover/hotels/claim"
          className="ml-4 inline-flex items-center gap-2 rounded-full border border-[#d8c8ae] bg-white px-4 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-[#234232]"
        >
          <FaHotel /> Claim your hotel
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
              {hotel.inventorySummary?.nextAvailableDate ? (
                <div className="mt-4 rounded-2xl bg-[#eef6f0] px-4 py-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#234232]">Inventory signal</p>
                  <p className="mt-2 text-sm font-bold text-slate-900">
                    {hotel.inventorySummary.nextStatusLabel || "Available"} from {String(hotel.inventorySummary.nextAvailableDate).slice(0, 10)}
                  </p>
                  <p className="mt-1 text-sm font-medium text-slate-600">
                    {hotel.inventorySummary.roomTypeCount} room types tracked
                    {hotel.inventorySummary.fromRate ? ` · From ${hotel.inventorySummary.fromRate} ${hotel.inventorySummary.currency || "USD"}` : ""}
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        </section>

        <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1fr)_420px]">
          <HotelAiConciergeCard hotel={hotel} />
          <aside className="rounded-[36px] border border-[#d8c8ae] bg-white shadow-[0_24px_80px_rgba(35,66,50,0.12)]">
            <div className="bg-[#234232] p-6 text-white">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#d9c79f]">Hotel Inquiry</p>
              <h2 className="mt-2 text-2xl font-black uppercase tracking-tight">
                {selectedIntent?.label || "Request this hotel"}
              </h2>
              <p className="mt-3 text-sm font-medium leading-6 text-white/75">
                {selectedIntent?.description || "Ask directly about this hotel or request it inside a wider itinerary."}
              </p>
              <div className="mt-5 grid grid-cols-2 gap-2 rounded-2xl bg-white/10 p-1">
                {intentOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setSelectedIntentId(option.id)}
                    className={`rounded-xl px-3 py-3 text-[10px] font-black uppercase tracking-[0.14em] transition ${
                      selectedIntentId === option.id
                        ? "bg-white text-[#234232]"
                        : "text-white/75 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    {option.id === "direct" ? "Direct" : "Itinerary"}
                  </button>
                ))}
              </div>
            </div>
            <div className="p-1">
              {selectedIntent?.intentType === "direct-hotel" ? (
                <HotelDirectInquiryForm hotel={hotel} />
              ) : (
                <PlanMyTripWizard
                  compact
                  showIntro={false}
                  sourceChannel={selectedIntent.payload.sourceChannel}
                  campaignLabel={selectedIntent.payload.campaignLabel}
                  defaultDestinations={selectedIntent.payload.destinations}
                  defaultMessage={defaultMessage}
                  operatorTenantId={selectedIntent.payload.operatorTenantId}
                  operatorTenantSlug={selectedIntent.payload.operatorTenantSlug}
                  hotelId={selectedIntent.payload.hotelId}
                  hotelName={selectedIntent.payload.hotelName}
                  hotelIntentType={selectedIntent.payload.hotelIntentType}
                />
              )}
            </div>
          </aside>
        </div>

        <div className="mt-8">
          <HotelBookingWidget hotel={hotel} />
        </div>

        <div className="mt-8">
          <HospitalityPairingPanel
            title="Complete this stay with trips and dining"
            context={{
              sourceType: "hotel",
              sourceSlug: hotel.slug,
              surface: "hotel-detail",
              destination: hotel.destination,
              region: hotel.region,
            }}
          />
        </div>

        {relatedHotels.length ? (
          <section className="mt-10">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#8b7451]">
                  Similar stays
                </p>
                <h2 className="mt-2 text-2xl font-black uppercase tracking-tight text-slate-900">
                  AI-grounded nearby hotel fits
                </h2>
              </div>
            </div>
            <div className="mt-5 grid gap-5 md:grid-cols-3">
              {relatedHotels.map((item) => (
                <Link
                  key={item._id}
                  to={`/discover/hotels/${item.slug}`}
                  className="rounded-[28px] border border-[#d8c8ae] bg-white p-5 shadow-[0_18px_50px_rgba(35,66,50,0.08)] transition hover:-translate-y-1"
                >
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#8b7451]">
                    {item.accommodationType || "Hotel"}
                  </p>
                  <h3 className="mt-3 text-lg font-black uppercase tracking-tight text-slate-900">
                    {item.name}
                  </h3>
                  <p className="mt-2 text-sm font-medium text-slate-500">
                    {item.destination || "Destination on request"}
                  </p>
                  <p className="mt-3 line-clamp-3 text-sm font-medium leading-6 text-slate-600">
                    {item.summary || "Operator details are being prepared."}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        ) : null}
      </main>
    </div>
  );
};

export default HotelDetail;
