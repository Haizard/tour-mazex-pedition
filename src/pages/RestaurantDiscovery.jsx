import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FaSearch, FaStar, FaUtensils } from "react-icons/fa";
import { fetchPublicRestaurants, fetchTenantPartnershipIds } from "../services/api";
import {
  countActiveRestaurantFilters,
  filterRestaurantCards,
  sortRestaurantCards,
} from "./restaurantDiscoveryUtils";
import {
  getRestaurantOperatorTrustLabel,
  getRestaurantSponsoredDisclosure,
  getRestaurantTrustLabel,
} from "../components/Marketplace/restaurantTrustUtils";

const initialFilters = {
  q: "",
  destination: "",
  cuisine: "",
  mealType: "",
  dietaryFit: "",
  sort: "featured",
};

const RestaurantDiscovery = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [filters, setFilters] = useState(initialFilters);
  const [loading, setLoading] = useState(true);
  const [partneredIds, setPartneredIds] = useState(undefined);

  // Fetch partnership IDs once on mount
  useEffect(() => {
    fetchTenantPartnershipIds()
      .then((res) => setPartneredIds(res.data || null))
      .catch(() => setPartneredIds(null));
  }, []);

  // Fetch restaurants — wait for partnership data to resolve first
  useEffect(() => {
    if (partneredIds === undefined) return;

    const loadRestaurants = async () => {
      setLoading(true);
      try {
        const response = await fetchPublicRestaurants(filters);
        const allRestaurants = response.data?.restaurants || [];

        if (partneredIds?.restaurantIds?.length) {
          const validIds = new Set(
            partneredIds.restaurantIds.map((id) => String(id))
          );
          setRestaurants(
            allRestaurants.filter((r) => validIds.has(String(r._id)))
          );
        } else if (partneredIds?.hasTenantContext) {
          // Tenant context but no partnerships — show empty
          setRestaurants([]);
        } else {
          // No tenant context (platform page) — show all
          setRestaurants(allRestaurants);
        }
      } catch (error) {
        console.error("Restaurant discovery error:", error);
        setRestaurants([]);
      } finally {
        setLoading(false);
      }
    };

    loadRestaurants();
  }, [filters, partneredIds]);

  const visibleRestaurants = useMemo(
    () => sortRestaurantCards(filterRestaurantCards(restaurants, filters), filters.sort),
    [restaurants, filters]
  );
  const activeCount = countActiveRestaurantFilters(filters);

  const updateFilter = (event) => {
    const { name, value } = event.target;
    setFilters((current) => ({ ...current, [name]: value }));
  };

  return (
    <div className="min-h-screen bg-[#f6f1e8] px-5 pb-16 pt-32 text-slate-900 md:pt-40">
      <section className="mx-auto max-w-7xl">
        <p className="text-[11px] font-black uppercase tracking-[0.3em] text-[#8b7451]">Hospitality Marketplace</p>
        <h1 className="mt-4 max-w-4xl text-4xl font-black uppercase tracking-tight md:text-6xl">
          Restaurants that match the route, the mood, and the traveler.
        </h1>
        <p className="mt-5 max-w-2xl text-base font-medium leading-7 text-slate-600">
          Browse operator-linked dining options for arrival dinners, family lunches, special occasions, and itinerary add-ons.
        </p>
        <div className="mt-6">
          <Link
            to="/discover/restaurants/claim"
            className="inline-flex items-center gap-2 rounded-full border border-[#d8c8ae] bg-white px-5 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-[#234232]"
          >
            <FaUtensils /> Claim your restaurant
          </Link>
        </div>

        <div className="mt-8 grid gap-3 rounded-[28px] border border-[#d8c8ae] bg-white p-4 shadow-sm md:grid-cols-6">
          <label className="flex items-center rounded-2xl border border-slate-200 px-3 py-2 md:col-span-2">
            <FaSearch className="mr-2 text-slate-400" />
            <input name="q" value={filters.q} onChange={updateFilter} placeholder="Search restaurants" className="w-full bg-transparent text-sm font-medium outline-none" />
          </label>
          <input name="destination" value={filters.destination} onChange={updateFilter} placeholder="Destination" className="rounded-2xl border border-slate-200 px-3 py-2 text-sm font-medium outline-none" />
          <input name="cuisine" value={filters.cuisine} onChange={updateFilter} placeholder="Cuisine" className="rounded-2xl border border-slate-200 px-3 py-2 text-sm font-medium outline-none" />
          <input name="mealType" value={filters.mealType} onChange={updateFilter} placeholder="Lunch, dinner..." className="rounded-2xl border border-slate-200 px-3 py-2 text-sm font-medium outline-none" />
          <select name="sort" value={filters.sort} onChange={updateFilter} className="rounded-2xl border border-slate-200 px-3 py-2 text-sm font-black uppercase tracking-[0.12em] text-slate-600 outline-none">
            <option value="featured">Featured</option>
            <option value="rating">Top rated</option>
            <option value="newest">Newest</option>
          </select>
        </div>
        <p className="mt-3 text-xs font-black uppercase tracking-[0.18em] text-slate-500">
          {activeCount} active filters · {visibleRestaurants.length} restaurants
        </p>

        {loading ? (
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[1, 2, 3].map((item) => <div key={item} className="h-72 animate-pulse rounded-[30px] bg-white" />)}
          </div>
        ) : (
          <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {visibleRestaurants.map((restaurant) => (
              <Link key={restaurant._id} to={`/discover/restaurants/${restaurant.slug}`} className="group overflow-hidden rounded-[30px] border border-[#d8c8ae] bg-white shadow-[0_18px_50px_rgba(35,66,50,0.08)] transition hover:-translate-y-1">
                <div className="h-52 bg-slate-200">
                  {restaurant.photos?.[0] ? <img src={restaurant.photos[0]} alt={restaurant.name} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-4xl text-slate-400"><FaUtensils /></div>}
                </div>
                <div className="p-5">
                  <div className="flex items-center justify-between gap-4">
                    <span className="rounded-full bg-[#e1efe6] px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-[#234232]">
                      {(restaurant.cuisineTypes || [])[0] || "Restaurant"}
                    </span>
                    {restaurant.sponsoredPlacement ? (
                      <span className="rounded-full bg-[#fff3d6] px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-[#8a5a05]">
                        Sponsored
                      </span>
                    ) : null}
                  </div>
                  <h2 className="mt-4 text-xl font-black uppercase tracking-tight text-slate-900">{restaurant.name}</h2>
                  <p className="mt-2 text-sm font-medium text-slate-500">{restaurant.destination || "Destination on request"}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="rounded-full bg-[#f3ecdf] px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-[#8b7451]">
                      {restaurant.diningContextLabel || "Dining fit building"}
                    </span>
                    <span className="rounded-full bg-slate-100 px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-slate-600">
                      {getRestaurantTrustLabel(restaurant)}
                    </span>
                  </div>
                  <p className="mt-3 text-[11px] font-black uppercase tracking-[0.16em] text-[#234232]">
                    {getRestaurantOperatorTrustLabel(restaurant)}
                  </p>
                  <p className="mt-3 line-clamp-3 text-sm font-medium leading-6 text-slate-600">{restaurant.summary || "Restaurant details are being prepared by the listed operator."}</p>
                  <p className="mt-5 flex items-center gap-2 text-sm font-black text-slate-900"><FaStar className="text-[#d9a441]" /> {getRestaurantTrustLabel(restaurant)}</p>
                  <p className="mt-2 text-xs font-medium leading-5 text-slate-500">
                    {getRestaurantSponsoredDisclosure(restaurant)}
                  </p>
                </div>
              </Link>
            ))}
            {!visibleRestaurants.length ? <p className="rounded-[28px] bg-white p-10 text-center font-bold text-slate-500 md:col-span-2 xl:col-span-3">No restaurants match this search yet.</p> : null}
          </div>
        )}
      </section>
    </div>
  );
};

export default RestaurantDiscovery;
