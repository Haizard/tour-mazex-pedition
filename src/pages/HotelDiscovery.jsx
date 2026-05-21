import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FaHotel, FaSearch, FaStar } from "react-icons/fa";
import { fetchPublicHotels } from "../services/api";
import { countActiveHotelFilters, filterHotelCards } from "./hotelDiscoveryUtils";
import { getHotelTrustLabel } from "../components/Marketplace/hotelTrustUtils";

const initialFilters = {
  q: "",
  destination: "",
  accommodationType: "",
  amenity: "",
  sort: "featured",
};

const HotelDiscovery = () => {
  const [hotels, setHotels] = useState([]);
  const [filters, setFilters] = useState(initialFilters);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHotels = async () => {
      setLoading(true);
      try {
        const response = await fetchPublicHotels(filters);
        setHotels(response.data?.hotels || []);
      } catch (error) {
        console.error("Hotel discovery error:", error);
        setHotels([]);
      } finally {
        setLoading(false);
      }
    };

    loadHotels();
  }, [filters]);

  const visibleHotels = useMemo(() => filterHotelCards(hotels, filters), [hotels, filters]);
  const activeCount = countActiveHotelFilters(filters);

  const updateFilter = (event) => {
    const { name, value } = event.target;
    setFilters((current) => ({ ...current, [name]: value }));
  };

  return (
    <div className="min-h-screen bg-[#f6f1e8] px-5 pb-16 pt-32 text-slate-900 md:pt-40">
      <section className="mx-auto max-w-7xl">
        <p className="text-[11px] font-black uppercase tracking-[0.3em] text-[#8b7451]">Hospitality Marketplace</p>
        <h1 className="mt-4 max-w-4xl text-4xl font-black uppercase tracking-tight md:text-6xl">
          Hotels that fit the journey, not just the night.
        </h1>
        <p className="mt-5 max-w-2xl text-base font-medium leading-7 text-slate-600">
          Browse operator-linked hotels for pre-safari stays, post-trip comfort, and itinerary add-ons.
        </p>

        <div className="mt-8 grid gap-3 rounded-[28px] border border-[#d8c8ae] bg-white p-4 shadow-sm md:grid-cols-4">
          <label className="flex items-center rounded-2xl border border-slate-200 px-3 py-2">
            <FaSearch className="mr-2 text-slate-400" />
            <input name="q" value={filters.q} onChange={updateFilter} placeholder="Search hotels" className="w-full bg-transparent text-sm font-medium outline-none" />
          </label>
          <input name="destination" value={filters.destination} onChange={updateFilter} placeholder="Destination" className="rounded-2xl border border-slate-200 px-3 py-2 text-sm font-medium outline-none" />
          <input name="accommodationType" value={filters.accommodationType} onChange={updateFilter} placeholder="Lodge, hotel, camp" className="rounded-2xl border border-slate-200 px-3 py-2 text-sm font-medium outline-none" />
          <input name="amenity" value={filters.amenity} onChange={updateFilter} placeholder="Pool, transfer..." className="rounded-2xl border border-slate-200 px-3 py-2 text-sm font-medium outline-none" />
        </div>
        <p className="mt-3 text-xs font-black uppercase tracking-[0.18em] text-slate-500">
          {activeCount} active filters · {visibleHotels.length} hotels
        </p>

        {loading ? (
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[1, 2, 3].map((item) => <div key={item} className="h-72 animate-pulse rounded-[30px] bg-white" />)}
          </div>
        ) : (
          <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {visibleHotels.map((hotel) => (
              <Link key={hotel._id} to={`/discover/hotels/${hotel.slug}`} className="group overflow-hidden rounded-[30px] border border-[#d8c8ae] bg-white shadow-[0_18px_50px_rgba(35,66,50,0.08)] transition hover:-translate-y-1">
                <div className="h-52 bg-slate-200">
                  {hotel.photos?.[0] ? <img src={hotel.photos[0]} alt={hotel.name} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-4xl text-slate-400"><FaHotel /></div>}
                </div>
                <div className="p-5">
                  <div className="flex items-center justify-between gap-4">
                    <span className="rounded-full bg-[#e1efe6] px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-[#234232]">{hotel.accommodationType || "Hotel"}</span>
                    {hotel.sponsoredPlacement ? <span className="rounded-full bg-[#fff3d6] px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-[#8a5a05]">Sponsored</span> : null}
                  </div>
                  <h2 className="mt-4 text-xl font-black uppercase tracking-tight text-slate-900">{hotel.name}</h2>
                  <p className="mt-2 text-sm font-medium text-slate-500">{hotel.destination || "Destination on request"}</p>
                  <p className="mt-3 line-clamp-3 text-sm font-medium leading-6 text-slate-600">{hotel.summary || "Hotel details are being prepared by the listed operator."}</p>
                  <p className="mt-5 flex items-center gap-2 text-sm font-black text-slate-900"><FaStar className="text-[#d9a441]" /> {getHotelTrustLabel(hotel)}</p>
                </div>
              </Link>
            ))}
            {!visibleHotels.length ? <p className="rounded-[28px] bg-white p-10 text-center font-bold text-slate-500 md:col-span-2 xl:col-span-3">No hotels match this search yet.</p> : null}
          </div>
        )}
      </section>
    </div>
  );
};

export default HotelDiscovery;
