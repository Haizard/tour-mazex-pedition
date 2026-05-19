import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaHeart,
  FaArrowRight,
  FaBalanceScale,
  FaCompass,
  FaTimes,
  FaMapMarkerAlt,
  FaMoneyBillWave,
  FaSearch,
  FaSlidersH,
  FaStar,
} from "react-icons/fa";
import DiscoveryRegionMap from "../components/Marketplace/DiscoveryRegionMap";
import SavedTripsRail from "../components/Marketplace/SavedTripsRail";
import TripComparisonDrawer from "../components/Marketplace/TripComparisonDrawer";
import {
  fetchMarketplaceComparisons,
  fetchMarketplaceMapRegions,
  fetchMarketplaceSavedTrips,
  updateMarketplaceComparisons,
  updateMarketplaceSavedTrips,
} from "../services/api";
import { getMarketplaceTravelerSessionKey } from "../components/Marketplace/travelerSession";
import { countActiveDiscoveryFilters } from "./discoveryFilterUtils";

const createInitialFilters = () => ({
  q: "",
  location: "",
  category: "",
  operator: "",
  duration: "",
  availability: "",
  departureMonth: "",
  minPrice: "",
  maxPrice: "",
  sort: "featured",
});

const categoryOptions = ["Luxury", "Midrange", "Budget", "Family", "Honeymoon", "Adventure"];
const durationOptions = ["1-3", "4-6", "7-10", "10+"];

const formatAvailabilityDate = (value = "") => {
  if (!value) return "";
  return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

const getAvailabilityTone = (status = "") => {
  if (status === "available") return "bg-[#e1efe6] text-[#234232]";
  if (status === "limited") return "bg-[#fff3d6] text-[#8a5a05]";
  if (status === "unavailable") return "bg-[#fde7e7] text-[#a33b3b]";
  return "bg-slate-100 text-slate-700";
};

const getAvailabilityCopy = (entry = null) => {
  if (!entry) {
    return "Travel dates are confirmed on request.";
  }

  if (typeof entry.remainingSpots === "number") {
    return `${entry.remainingSpots} spots currently noted for this departure.`;
  }

  if (entry.status === "unavailable") {
    return "This published date is currently unavailable. Ask the operator for the next opening.";
  }

  if (entry.status === "limited") {
    return "Published departure with limited availability remaining.";
  }

  return "Published departure date ready for traveler inquiries.";
};

const getDiscoveryApiUrl = (path, params = null) => {
  const query = params ? `?${params.toString()}` : "";

  if (import.meta.env.VITE_SITE_URL) {
    return `${import.meta.env.VITE_SITE_URL}${path}${query}`;
  }

  return `${path}${query}`;
};

const GlobalDiscovery = () => {
  const [tours, setTours] = useState([]);
  const [operators, setOperators] = useState([]);
  const [regions, setRegions] = useState([]);
  const [savedTrips, setSavedTrips] = useState([]);
  const [comparisonTrips, setComparisonTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState(createInitialFilters);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const fetchOperators = useCallback(async () => {
    try {
      const res = await fetch(getDiscoveryApiUrl("/api/discovery/operators"));
      if (!res.ok) {
        throw new Error("Failed to fetch marketplace operators");
      }

      const data = await res.json();
      setOperators(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Discovery operators error:", error);
    }
  }, []);

  const fetchTours = useCallback(async () => {
    setLoading(true);

    try {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          queryParams.append(key, value);
        }
      });

      const res = await fetch(getDiscoveryApiUrl("/api/discovery/tours", queryParams));
      if (!res.ok) {
        throw new Error("Failed to fetch tours");
      }

      const data = await res.json();
      setTours(data.tours || []);
    } catch (error) {
      console.error("Discovery error:", error);
      setTours([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const fetchSavedTrips = useCallback(async () => {
    try {
      const response = await fetchMarketplaceSavedTrips({
        sessionKey: getMarketplaceTravelerSessionKey(),
      });
      setSavedTrips(response.data?.tours || []);
    } catch (error) {
      console.error("Saved trips error:", error);
      setSavedTrips([]);
    }
  }, []);

  const fetchComparisons = useCallback(async () => {
    try {
      const response = await fetchMarketplaceComparisons({
        sessionKey: getMarketplaceTravelerSessionKey(),
      });
      setComparisonTrips(response.data?.tours || []);
    } catch (error) {
      console.error("Comparison error:", error);
      setComparisonTrips([]);
    }
  }, []);

  const fetchRegions = useCallback(async () => {
    try {
      const response = await fetchMarketplaceMapRegions();
      setRegions(response.data?.regions || []);
    } catch (error) {
      console.error("Marketplace regions error:", error);
      setRegions([]);
    }
  }, []);

  useEffect(() => {
    fetchOperators();
  }, [fetchOperators]);

  useEffect(() => {
    fetchTours();
  }, [fetchTours]);

  useEffect(() => {
    fetchSavedTrips();
    fetchComparisons();
    fetchRegions();
  }, [fetchComparisons, fetchRegions, fetchSavedTrips]);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => setFilters(createInitialFilters());
  const activeFilterCount = useMemo(() => countActiveDiscoveryFilters(filters), [filters]);

  const saveIds = useMemo(() => new Set(savedTrips.map((trip) => trip._id)), [savedTrips]);
  const comparisonIds = useMemo(() => new Set(comparisonTrips.map((trip) => trip._id)), [comparisonTrips]);

  const syncSavedTrips = async (nextIds) => {
    const response = await updateMarketplaceSavedTrips({
      sessionKey: getMarketplaceTravelerSessionKey(),
      selectedTourIds: nextIds,
    });
    setSavedTrips(response.data?.tours || []);
  };

  const syncComparisonTrips = async (nextIds) => {
    const response = await updateMarketplaceComparisons({
      sessionKey: getMarketplaceTravelerSessionKey(),
      selectedTourIds: nextIds,
    });
    setComparisonTrips(response.data?.tours || []);
  };

  const toggleSavedTrip = async (tourId) => {
    const nextIds = saveIds.has(tourId)
      ? savedTrips.map((trip) => trip._id).filter((id) => id !== tourId)
      : [...savedTrips.map((trip) => trip._id), tourId];

    try {
      await syncSavedTrips(nextIds);
    } catch (error) {
      console.error("Unable to update saved trips:", error);
    }
  };

  const toggleComparisonTrip = async (tourId) => {
    const currentIds = comparisonTrips.map((trip) => trip._id);
    const nextIds = comparisonIds.has(tourId)
      ? currentIds.filter((id) => id !== tourId)
      : [...currentIds, tourId];

    try {
      await syncComparisonTrips(nextIds);
    } catch (error) {
      console.error("Unable to update comparison set:", error);
    }
  };

  const handleSelectRegion = (regionLabel) => {
    setFilters((current) => ({ ...current, location: regionLabel }));
  };

  const handleClearRegion = () => {
    setFilters((current) => ({ ...current, location: "" }));
  };

  const featuredTour = useMemo(
    () => tours.find((tour) => tour.featured) || tours[0] || null,
    [tours],
  );

  const secondaryTours = useMemo(() => {
    if (!featuredTour) {
      return tours;
    }

    return tours.filter((tour) => tour._id !== featuredTour._id);
  }, [featuredTour, tours]);
  const featuredAvailability = featuredTour?.marketplaceAvailability?.[0] || null;
  const toursWithPublishedDates = useMemo(
    () => tours.filter((tour) => Array.isArray(tour.marketplaceAvailability) && tour.marketplaceAvailability.length > 0).length,
    [tours],
  );

  return (
    <div className="min-h-screen bg-[#f6f1e8] pt-32 text-slate-900 md:pt-40">
      <section className="relative overflow-hidden border-b border-[#d8c8ae] bg-[#234232] px-6 py-14 text-white md:py-16">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.16),_transparent_35%),linear-gradient(135deg,_rgba(20,43,31,0.96),_rgba(53,90,63,0.8))]" />
        <div className="absolute -right-12 top-10 h-48 w-48 rounded-full bg-[#d9a441]/20 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-white/10 blur-3xl" />

        <div className="relative mx-auto grid max-w-[1680px] gap-10 lg:grid-cols-[1.3fr_0.9fr] 2xl:max-w-[1820px]">
          <div>
            <p className="mb-4 text-[11px] font-black uppercase tracking-[0.35em] text-[#d9c79f]">
              MAZ Marketplace
            </p>
            <h1 className="max-w-4xl text-4xl font-black uppercase tracking-[-0.05em] md:text-6xl">
              Discover trusted East Africa journeys with real operator context.
            </h1>
            <p className="mt-6 max-w-2xl text-base font-medium leading-7 text-white/80 md:text-lg">
              Compare safari circuits, trekking escapes, and cultural itineraries from verified operators
              across the platform. Browse faster, filter harder, and send an inquiry without losing the
              original operator relationship.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              {["Verified operators", "Curated itineraries", "Review-aware discovery"].map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-white/90 backdrop-blur"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
            <div className="rounded-[30px] border border-white/10 bg-white/10 p-6 backdrop-blur">
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#d9c79f]">Live packages</p>
              <p className="mt-3 text-4xl font-black">{tours.length}</p>
              <p className="mt-2 text-sm font-medium text-white/70">
                Marketplace-visible tours flowing from tenant inventory.
              </p>
            </div>
            <div className="rounded-[30px] border border-white/10 bg-white/10 p-6 backdrop-blur">
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#d9c79f]">Operators</p>
              <p className="mt-3 text-4xl font-black">{operators.length}</p>
              <p className="mt-2 text-sm font-medium text-white/70">
                Active partners with tours discoverable in the network.
              </p>
            </div>
            <div className="rounded-[30px] border border-white/10 bg-white/10 p-6 backdrop-blur">
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#d9c79f]">Traveler flow</p>
              <p className="mt-3 text-4xl font-black">1</p>
              <p className="mt-2 text-sm font-medium text-white/70">
                One inquiry path that keeps attribution with the selling operator.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1680px] px-5 py-10 sm:px-6 xl:px-8 2xl:max-w-[1820px]">
        <div className="grid gap-8 xl:grid-cols-[340px_minmax(0,1fr)] 2xl:grid-cols-[360px_minmax(0,1fr)]">
          <aside className="hidden space-y-6 xl:block">
            <div className="rounded-[32px] border border-[#e2d2b7] bg-white p-6 shadow-[0_20px_60px_rgba(35,66,50,0.08)]">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-[#234232] p-3 text-white">
                  <FaSlidersH />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#8b7451]">
                    Filter Trips
                  </p>
                  <h2 className="text-xl font-black uppercase tracking-tight text-slate-900">
                    Refine the list
                  </h2>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <label className="block">
                  <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                    Search
                  </span>
                  <div className="flex items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <FaSearch className="mr-3 text-slate-400" />
                    <input
                      type="text"
                      name="q"
                      value={filters.q}
                      onChange={handleFilterChange}
                      placeholder="Big five, Kilimanjaro, Zanzibar..."
                      className="w-full bg-transparent text-sm font-medium outline-none placeholder:text-slate-400"
                    />
                  </div>
                </label>

                <label className="block">
                  <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                    Location
                  </span>
                  <div className="flex items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <FaMapMarkerAlt className="mr-3 text-slate-400" />
                    <input
                      type="text"
                      name="location"
                      value={filters.location}
                      onChange={handleFilterChange}
                      placeholder="Tanzania, Kenya, Uganda..."
                      className="w-full bg-transparent text-sm font-medium outline-none placeholder:text-slate-400"
                    />
                  </div>
                </label>

                <label className="block">
                  <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                    Operator
                  </span>
                  <select
                    name="operator"
                    value={filters.operator}
                    onChange={handleFilterChange}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="">All operators</option>
                    {operators.map((operator) => (
                      <option key={operator._id} value={operator.slug || operator.name}>
                        {operator.name}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                      Category
                    </span>
                    <select
                      name="category"
                      value={filters.category}
                      onChange={handleFilterChange}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="">All styles</option>
                      {categoryOptions.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                      Duration
                    </span>
                    <select
                      name="duration"
                      value={filters.duration}
                      onChange={handleFilterChange}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="">Any length</option>
                      {durationOptions.map((duration) => (
                        <option key={duration} value={duration}>
                          {duration} days
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                      Availability
                    </span>
                    <select
                      name="availability"
                      value={filters.availability}
                      onChange={handleFilterChange}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="">Any availability</option>
                      <option value="upcoming">Has upcoming dates</option>
                      <option value="bookable">Bookable departures</option>
                      <option value="instant">Instant-booking ready</option>
                      <option value="request">Request next dates</option>
                    </select>
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                      Departure Month
                    </span>
                    <input
                      type="month"
                      name="departureMonth"
                      value={filters.departureMonth}
                      onChange={handleFilterChange}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </label>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                      Minimum Price
                    </span>
                    <div className="flex items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <FaMoneyBillWave className="mr-3 text-slate-400" />
                      <input
                        type="number"
                        name="minPrice"
                        value={filters.minPrice}
                        onChange={handleFilterChange}
                        placeholder="0"
                        className="w-full bg-transparent text-sm font-medium outline-none placeholder:text-slate-400"
                      />
                    </div>
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                      Maximum Price
                    </span>
                    <div className="flex items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <FaMoneyBillWave className="mr-3 text-slate-400" />
                      <input
                        type="number"
                        name="maxPrice"
                        value={filters.maxPrice}
                        onChange={handleFilterChange}
                        placeholder="5000"
                        className="w-full bg-transparent text-sm font-medium outline-none placeholder:text-slate-400"
                      />
                    </div>
                  </label>
                </div>

                <label className="block">
                  <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                    Sort Results
                  </span>
                  <select
                    name="sort"
                    value={filters.sort}
                    onChange={handleFilterChange}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="featured">Featured first</option>
                    <option value="price-asc">Price: low to high</option>
                    <option value="price-desc">Price: high to low</option>
                    <option value="newest">Newest additions</option>
                  </select>
                </label>
              </div>

              <button
                type="button"
                onClick={clearFilters}
                className="mt-6 w-full rounded-2xl border border-slate-200 px-4 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-slate-700 transition hover:border-primary hover:text-primary"
              >
                Clear all filters
              </button>
            </div>
          </aside>

          <div className="space-y-8">
            <div className="flex flex-wrap gap-3 xl:hidden">
              <button
                type="button"
                onClick={() => setShowMobileFilters(true)}
                className="inline-flex items-center gap-3 rounded-2xl border border-[#d8c8ae] bg-white px-4 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-slate-900 shadow-[0_12px_30px_rgba(35,66,50,0.08)]"
              >
                <FaSlidersH className="text-primary" />
                Filters
                {activeFilterCount > 0 ? (
                  <span className="rounded-full bg-[#224433] px-2 py-1 text-[10px] text-white">
                    {activeFilterCount}
                  </span>
                ) : null}
              </button>
              {activeFilterCount > 0 ? (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="inline-flex items-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-slate-700 shadow-[0_12px_30px_rgba(35,66,50,0.08)]"
                >
                  Clear filters
                </button>
              ) : null}
            </div>

            <DiscoveryRegionMap
              regions={regions}
              tours={tours}
              activeRegion={filters.location}
              onSelectRegion={handleSelectRegion}
              onClearRegion={handleClearRegion}
            />

            <SavedTripsRail
              trips={savedTrips}
              onRemove={(tourId) => toggleSavedTrip(tourId)}
            />

            <TripComparisonDrawer
              trips={comparisonTrips}
              onRemove={(tourId) => toggleComparisonTrip(tourId)}
              onClear={() => syncComparisonTrips([])}
            />

            <div className="flex flex-col gap-4 rounded-[32px] border border-[#e2d2b7] bg-white px-6 py-5 shadow-[0_20px_60px_rgba(35,66,50,0.08)] md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#8b7451]">
                  Results Snapshot
                </p>
                <h2 className="mt-2 text-2xl font-black uppercase tracking-tight text-slate-900">
                  {loading ? "Scanning operators..." : `${tours.length} trips ready to compare`}
                </h2>
                {!loading ? (
                  <p className="mt-2 text-sm font-medium text-slate-500">
                    {toursWithPublishedDates} package{toursWithPublishedDates === 1 ? "" : "s"} currently show published departure dates.
                  </p>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-2">
                {filters.operator && (
                  <span className="rounded-full bg-[#f4e4be] px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#6b531f]">
                    Operator: {filters.operator}
                  </span>
                )}
                {filters.category && (
                  <span className="rounded-full bg-[#e1efe6] px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#234232]">
                    Style: {filters.category}
                  </span>
                )}
                {filters.maxPrice && (
                  <span className="rounded-full bg-slate-100 px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-700">
                    Up to ${filters.maxPrice}
                  </span>
                )}
                {filters.availability && (
                  <span className="rounded-full bg-[#eef4ed] px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#234232]">
                    {filters.availability}
                  </span>
                )}
                {filters.departureMonth && (
                  <span className="rounded-full bg-[#fff7e6] px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#6b531f]">
                    {filters.departureMonth}
                  </span>
                )}
              </div>
            </div>

            {featuredTour && !loading && (
              <Link
                to={`/discover/tour/${featuredTour._id}`}
                className="group grid overflow-hidden rounded-[36px] border border-[#d8c8ae] bg-white shadow-[0_26px_80px_rgba(35,66,50,0.12)] lg:grid-cols-[0.95fr_1.05fr]"
              >
                <div className="relative min-h-[260px] overflow-hidden lg:min-h-[320px]">
                  <img
                    src={featuredTour.image}
                    alt={featuredTour.title}
                    className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/5 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#f2d59b]">
                      Featured operator pick
                    </p>
                    <h3 className="mt-3 max-w-2xl text-3xl font-black uppercase tracking-[-0.04em]">
                      {featuredTour.title}
                    </h3>
                    <div className="mt-4 flex flex-wrap gap-3 text-[11px] font-black uppercase tracking-[0.16em] text-white/90">
                      <span className="rounded-full bg-white/15 px-3 py-2 backdrop-blur">
                        {featuredTour.location}
                      </span>
                      <span className="rounded-full bg-white/15 px-3 py-2 backdrop-blur">
                        {featuredTour.duration || "Multi-day"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col justify-between p-6 md:p-7">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="rounded-full bg-[#234232] px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-white">
                        {featuredTour.operator?.name || "Verified Operator"}
                      </span>
                      <span className="rounded-full bg-[#f4e4be] px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#6b531f]">
                        {featuredTour.category || "Curated"}
                      </span>
                    </div>
                    <p className="mt-4 line-clamp-4 text-sm font-medium leading-7 text-slate-600">
                      {featuredTour.description}
                    </p>
                    <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      <div className="rounded-[24px] bg-slate-50 px-4 py-4">
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                          Review signal
                        </p>
                        <p className="mt-2 flex items-center gap-2 text-lg font-black text-slate-900">
                          <FaStar className="text-[#d9a441]" />
                          {featuredTour.tripAdvisorRating || "New"}
                        </p>
                        <p className="mt-1 text-sm font-medium text-slate-500">
                          {featuredTour.tripAdvisorReviewCount
                            ? `${featuredTour.tripAdvisorReviewCount} external reviews`
                            : "Waiting for published review data"}
                        </p>
                      </div>
                      <div className="rounded-[24px] bg-slate-50 px-4 py-4">
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                          Starting price
                        </p>
                        <p className="mt-2 text-3xl font-black uppercase tracking-tight text-slate-900">
                          ${featuredTour.price}
                        </p>
                        <p className="mt-1 text-sm font-medium text-slate-500">
                          Send an inquiry to receive operator-specific availability.
                        </p>
                      </div>
                      <div className="rounded-[24px] bg-slate-50 px-4 py-4 sm:col-span-2 xl:col-span-1">
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                          {featuredAvailability ? "Next departure" : "Trip shape"}
                        </p>
                        {featuredAvailability ? (
                          <>
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <span
                                className={`rounded-full px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] ${getAvailabilityTone(
                                  featuredAvailability.status
                                )}`}
                              >
                                {featuredAvailability.status}
                              </span>
                              <span className="text-base font-black uppercase tracking-tight text-slate-900">
                                {formatAvailabilityDate(featuredAvailability.date)}
                              </span>
                            </div>
                            <p className="mt-2 text-sm font-medium text-slate-500">
                              {featuredAvailability.note || getAvailabilityCopy(featuredAvailability)}
                            </p>
                          </>
                        ) : (
                          <>
                            <p className="mt-2 text-base font-black uppercase tracking-tight text-slate-900">
                              {featuredTour.duration || "Multi-day"}
                            </p>
                            <p className="mt-1 text-sm font-medium text-slate-500">
                              {featuredTour.location || "East Africa"} • {featuredTour.category || "Curated"}
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 inline-flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.2em] text-primary">
                    Explore this tour <FaArrowRight />
                  </div>
                  <div className="mt-5 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.preventDefault();
                        toggleSavedTrip(featuredTour._id);
                      }}
                      className={`rounded-full px-4 py-2 text-[10px] font-black uppercase tracking-[0.16em] ${
                        saveIds.has(featuredTour._id)
                          ? "bg-[#224433] text-white"
                          : "border border-slate-200 text-slate-700"
                      }`}
                    >
                      <span className="inline-flex items-center gap-2">
                        <FaHeart /> {saveIds.has(featuredTour._id) ? "Saved" : "Save trip"}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.preventDefault();
                        toggleComparisonTrip(featuredTour._id);
                      }}
                      className={`rounded-full px-4 py-2 text-[10px] font-black uppercase tracking-[0.16em] ${
                        comparisonIds.has(featuredTour._id)
                          ? "bg-[#d9a441] text-[#224433]"
                          : "border border-slate-200 text-slate-700"
                      }`}
                    >
                      <span className="inline-flex items-center gap-2">
                        <FaBalanceScale /> {comparisonIds.has(featuredTour._id) ? "Comparing" : "Add to compare"}
                      </span>
                    </button>
                  </div>
                </div>
              </Link>
            )}

            {loading ? (
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {[1, 2, 3, 4].map((item) => (
                  <div
                    key={item}
                    className="h-[320px] animate-pulse rounded-[32px] border border-[#e2d2b7] bg-white shadow-[0_20px_60px_rgba(35,66,50,0.08)]"
                  />
                ))}
              </div>
            ) : secondaryTours.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {secondaryTours.map((tour) => (
                  <Link
                    key={tour._id}
                    to={`/discover/tour/${tour._id}`}
                    className="group flex h-full flex-col overflow-hidden rounded-[30px] border border-[#e2d2b7] bg-white shadow-[0_18px_50px_rgba(35,66,50,0.08)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_70px_rgba(35,66,50,0.12)]"
                  >
                    <div className="relative h-56 overflow-hidden">
                      <img
                        src={tour.image}
                        alt={tour.title}
                        className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                      <div className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-900 backdrop-blur">
                        {tour.operator?.name || "Verified Operator"}
                      </div>
                    </div>

                    <div className="flex flex-1 flex-col p-5">
                      <div className="flex items-start justify-between gap-4">
                        <span className="rounded-full bg-[#e1efe6] px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-[#234232]">
                          {tour.category || "Curated"}
                        </span>
                        <span className="text-lg font-black text-slate-900">${tour.price}</span>
                      </div>

                      <h3 className="mt-4 text-xl font-black uppercase tracking-tight text-slate-900">
                        {tour.title}
                      </h3>
                      <p className="mt-3 line-clamp-3 text-sm font-medium leading-6 text-slate-600">
                        {tour.description}
                      </p>

                      {tour.marketplaceAvailability?.[0] ? (
                        <div className="mt-4 flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-full px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] ${getAvailabilityTone(
                              tour.marketplaceAvailability[0].status
                            )}`}
                          >
                            {tour.marketplaceAvailability[0].status}
                          </span>
                          <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                            {formatAvailabilityDate(tour.marketplaceAvailability[0].date)}
                            {typeof tour.marketplaceAvailability[0].remainingSpots === "number"
                              ? ` - ${tour.marketplaceAvailability[0].remainingSpots} spots`
                              : ""}
                          </span>
                        </div>
                      ) : null}

                      <div className="mt-5 flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
                        <span className="rounded-full bg-slate-100 px-3 py-2">{tour.location}</span>
                        <span className="rounded-full bg-slate-100 px-3 py-2">{tour.duration || "Multi-day"}</span>
                      </div>

                      <div className="mt-auto flex items-end justify-between pt-6">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                            Review context
                          </p>
                          <p className="mt-2 flex items-center gap-2 text-sm font-black text-slate-900">
                            <FaStar className="text-[#d9a441]" />
                            {tour.tripAdvisorRating || "New listing"}
                          </p>
                          <p className="mt-1 text-xs font-medium text-slate-500">
                            {tour.tripAdvisorReviewCount
                              ? `${tour.tripAdvisorReviewCount} published reviews`
                              : "No external review count yet"}
                          </p>
                        </div>

                        <div className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-primary">
                          View trip <FaCompass />
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.preventDefault();
                            toggleSavedTrip(tour._id);
                          }}
                          className={`rounded-full px-4 py-2 text-[10px] font-black uppercase tracking-[0.16em] ${
                            saveIds.has(tour._id)
                              ? "bg-[#224433] text-white"
                              : "border border-slate-200 text-slate-700"
                          }`}
                        >
                          <span className="inline-flex items-center gap-2">
                            <FaHeart /> {saveIds.has(tour._id) ? "Saved" : "Save"}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.preventDefault();
                            toggleComparisonTrip(tour._id);
                          }}
                          className={`rounded-full px-4 py-2 text-[10px] font-black uppercase tracking-[0.16em] ${
                            comparisonIds.has(tour._id)
                              ? "bg-[#d9a441] text-[#224433]"
                              : "border border-slate-200 text-slate-700"
                          }`}
                        >
                          <span className="inline-flex items-center gap-2">
                            <FaBalanceScale /> {comparisonIds.has(tour._id) ? "Comparing" : "Compare"}
                          </span>
                        </button>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="rounded-[36px] border border-dashed border-[#c9b89d] bg-white px-6 py-20 text-center shadow-[0_18px_50px_rgba(35,66,50,0.06)]">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#8b7451]">
                  No matches yet
                </p>
                <h3 className="mt-3 text-2xl font-black uppercase tracking-tight text-slate-900">
                  Nothing fits those filters right now.
                </h3>
                <p className="mx-auto mt-4 max-w-xl text-sm font-medium leading-7 text-slate-600">
                  Clear the current filters or widen the location, duration, or price range to bring more
                  marketplace packages into view.
                </p>
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-8 rounded-2xl bg-[#234232] px-6 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-white transition hover:bg-[#1c3427]"
                >
                  Reset search
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {showMobileFilters ? (
        <div className="fixed inset-0 z-50 bg-slate-950/55 px-4 py-6 xl:hidden">
          <div className="mx-auto flex h-full max-w-xl flex-col overflow-hidden rounded-[32px] border border-[#d8c8ae] bg-[#f6f1e8] shadow-[0_30px_90px_rgba(15,23,42,0.32)]">
            <div className="flex items-center justify-between border-b border-[#e2d2b7] bg-white px-5 py-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#8b7451]">
                  Marketplace Filters
                </p>
                <h2 className="mt-1 text-lg font-black uppercase tracking-tight text-slate-900">
                  Refine discovery
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowMobileFilters(false)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 text-slate-600"
                aria-label="Close filters"
              >
                <FaTimes />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <div className="rounded-[32px] border border-[#e2d2b7] bg-white p-6 shadow-[0_20px_60px_rgba(35,66,50,0.08)]">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-[#234232] p-3 text-white">
                    <FaSlidersH />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#8b7451]">
                      Filter Trips
                    </p>
                    <h2 className="text-xl font-black uppercase tracking-tight text-slate-900">
                      Refine the list
                    </h2>
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  <label className="block">
                    <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                      Search
                    </span>
                    <div className="flex items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <FaSearch className="mr-3 text-slate-400" />
                      <input
                        type="text"
                        name="q"
                        value={filters.q}
                        onChange={handleFilterChange}
                        placeholder="Big five, Kilimanjaro, Zanzibar..."
                        className="w-full bg-transparent text-sm font-medium outline-none placeholder:text-slate-400"
                      />
                    </div>
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                      Location
                    </span>
                    <div className="flex items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <FaMapMarkerAlt className="mr-3 text-slate-400" />
                      <input
                        type="text"
                        name="location"
                        value={filters.location}
                        onChange={handleFilterChange}
                        placeholder="Tanzania, Kenya, Uganda..."
                        className="w-full bg-transparent text-sm font-medium outline-none placeholder:text-slate-400"
                      />
                    </div>
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                      Operator
                    </span>
                    <select
                      name="operator"
                      value={filters.operator}
                      onChange={handleFilterChange}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="">All operators</option>
                      {operators.map((operator) => (
                        <option key={operator._id} value={operator.slug || operator.name}>
                          {operator.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block">
                      <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                        Category
                      </span>
                      <select
                        name="category"
                        value={filters.category}
                        onChange={handleFilterChange}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                      >
                        <option value="">All styles</option>
                        {categoryOptions.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                        Duration
                      </span>
                      <select
                        name="duration"
                        value={filters.duration}
                        onChange={handleFilterChange}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                      >
                        <option value="">Any length</option>
                        {durationOptions.map((duration) => (
                          <option key={duration} value={duration}>
                            {duration} days
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block">
                      <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                        Availability
                      </span>
                      <select
                        name="availability"
                        value={filters.availability}
                        onChange={handleFilterChange}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                      >
                        <option value="">Any availability</option>
                        <option value="upcoming">Has upcoming dates</option>
                        <option value="bookable">Bookable departures</option>
                        <option value="instant">Instant-booking ready</option>
                        <option value="request">Request next dates</option>
                      </select>
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                        Departure Month
                      </span>
                      <input
                        type="month"
                        name="departureMonth"
                        value={filters.departureMonth}
                        onChange={handleFilterChange}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                      />
                    </label>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block">
                      <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                        Minimum Price
                      </span>
                      <div className="flex items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                        <FaMoneyBillWave className="mr-3 text-slate-400" />
                        <input
                          type="number"
                          name="minPrice"
                          value={filters.minPrice}
                          onChange={handleFilterChange}
                          placeholder="0"
                          className="w-full bg-transparent text-sm font-medium outline-none placeholder:text-slate-400"
                        />
                      </div>
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                        Maximum Price
                      </span>
                      <div className="flex items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                        <FaMoneyBillWave className="mr-3 text-slate-400" />
                        <input
                          type="number"
                          name="maxPrice"
                          value={filters.maxPrice}
                          onChange={handleFilterChange}
                          placeholder="5000"
                          className="w-full bg-transparent text-sm font-medium outline-none placeholder:text-slate-400"
                        />
                      </div>
                    </label>
                  </div>

                  <label className="block">
                    <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                      Sort Results
                    </span>
                    <select
                      name="sort"
                      value={filters.sort}
                      onChange={handleFilterChange}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="featured">Featured first</option>
                      <option value="price-asc">Price: low to high</option>
                      <option value="price-desc">Price: high to low</option>
                      <option value="newest">Newest additions</option>
                    </select>
                  </label>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 border-t border-[#e2d2b7] bg-white p-4">
              <button
                type="button"
                onClick={clearFilters}
                className="rounded-2xl border border-slate-200 px-4 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-slate-700"
              >
                Clear all
              </button>
              <button
                type="button"
                onClick={() => setShowMobileFilters(false)}
                className="rounded-2xl bg-[#224433] px-4 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-white"
              >
                Show {tours.length} trips
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default GlobalDiscovery;
