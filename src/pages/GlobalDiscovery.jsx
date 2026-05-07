import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaArrowRight,
  FaCompass,
  FaMapMarkerAlt,
  FaMoneyBillWave,
  FaSearch,
  FaSlidersH,
  FaStar,
} from "react-icons/fa";

const createInitialFilters = () => ({
  q: "",
  location: "",
  category: "",
  operator: "",
  duration: "",
  minPrice: "",
  maxPrice: "",
  sort: "featured",
});

const categoryOptions = ["Luxury", "Midrange", "Budget", "Family", "Honeymoon", "Adventure"];
const durationOptions = ["1-3", "4-6", "7-10", "10+"];

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
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState(createInitialFilters);

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

  useEffect(() => {
    fetchOperators();
  }, [fetchOperators]);

  useEffect(() => {
    fetchTours();
  }, [fetchTours]);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => setFilters(createInitialFilters());

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

  return (
    <div className="min-h-screen bg-[#f6f1e8] pt-20 text-slate-900">
      <section className="relative overflow-hidden border-b border-[#d8c8ae] bg-[#234232] px-6 py-16 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.16),_transparent_35%),linear-gradient(135deg,_rgba(20,43,31,0.96),_rgba(53,90,63,0.8))]" />
        <div className="absolute -right-12 top-10 h-48 w-48 rounded-full bg-[#d9a441]/20 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-white/10 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.3fr_0.9fr]">
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

      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="grid gap-8 xl:grid-cols-[320px_1fr]">
          <aside className="space-y-6">
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
            <div className="flex flex-col gap-4 rounded-[32px] border border-[#e2d2b7] bg-white px-6 py-5 shadow-[0_20px_60px_rgba(35,66,50,0.08)] md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#8b7451]">
                  Results Snapshot
                </p>
                <h2 className="mt-2 text-2xl font-black uppercase tracking-tight text-slate-900">
                  {loading ? "Scanning operators..." : `${tours.length} trips ready to compare`}
                </h2>
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
              </div>
            </div>

            {featuredTour && !loading && (
              <Link
                to={`/discover/tour/${featuredTour._id}`}
                className="group grid overflow-hidden rounded-[36px] border border-[#d8c8ae] bg-white shadow-[0_26px_80px_rgba(35,66,50,0.12)] lg:grid-cols-[1.2fr_0.8fr]"
              >
                <div className="relative min-h-[360px] overflow-hidden">
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

                <div className="flex flex-col justify-between p-6 md:p-8">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="rounded-full bg-[#234232] px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-white">
                        {featuredTour.operator?.name || "Verified Operator"}
                      </span>
                      <span className="rounded-full bg-[#f4e4be] px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#6b531f]">
                        {featuredTour.category || "Curated"}
                      </span>
                    </div>
                    <p className="mt-5 text-sm font-medium leading-7 text-slate-600">
                      {featuredTour.description}
                    </p>
                    <div className="mt-6 grid gap-3 sm:grid-cols-2">
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
                    </div>
                  </div>

                  <div className="mt-8 inline-flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.2em] text-primary">
                    Explore this tour <FaArrowRight />
                  </div>
                </div>
              </Link>
            )}

            {loading ? (
              <div className="grid gap-6 md:grid-cols-2">
                {[1, 2, 3, 4].map((item) => (
                  <div
                    key={item}
                    className="h-[320px] animate-pulse rounded-[32px] border border-[#e2d2b7] bg-white shadow-[0_20px_60px_rgba(35,66,50,0.08)]"
                  />
                ))}
              </div>
            ) : secondaryTours.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
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
    </div>
  );
};

export default GlobalDiscovery;
