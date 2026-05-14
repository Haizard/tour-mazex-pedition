import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FaArrowRight, FaCompass, FaMapMarkerAlt, FaRoute, FaSearch } from "react-icons/fa";

const filterTourByRegion = (tour = {}, regionLabel = "") => {
  const target = String(regionLabel || "").trim().toLowerCase();
  if (!target) {
    return false;
  }

  const haystack = [
    tour.location,
    tour.title,
    tour.category,
    ...(Array.isArray(tour.destinationsVisited) ? tour.destinationsVisited : []),
  ]
    .map((value) => String(value || "").trim().toLowerCase())
    .filter(Boolean)
    .join(" ");

  return haystack.includes(target);
};

const getRegionStatusTone = (isActive) =>
  isActive
    ? "border-[#224433] bg-[#224433] text-white shadow-lg"
    : "border-slate-200 bg-slate-50 text-slate-800 hover:border-primary hover:bg-white";

const formatAvailabilityDate = (value = "") => {
  if (!value) return "";
  return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

const DiscoveryRegionMap = ({
  regions = [],
  tours = [],
  activeRegion = "",
  onSelectRegion,
  onClearRegion,
}) => {
  const [regionSearch, setRegionSearch] = useState("");

  const filteredRegions = useMemo(() => {
    const query = regionSearch.trim().toLowerCase();
    if (!query) {
      return regions;
    }

    return regions.filter((region) => {
      const searchable = [
        region.label,
        ...(region.destinations || []),
        ...(region.sampleTours || []).map((tour) => tour.title),
      ]
        .join(" ")
        .toLowerCase();

      return searchable.includes(query);
    });
  }, [regionSearch, regions]);

  const selectedRegion = useMemo(() => {
    const exactMatch = filteredRegions.find((region) => region.label === activeRegion);
    if (exactMatch) {
      return exactMatch;
    }

    return filteredRegions[0] || null;
  }, [activeRegion, filteredRegions]);

  const selectedRegionTours = useMemo(() => {
    if (!selectedRegion?.label) {
      return [];
    }

    return tours.filter((tour) => filterTourByRegion(tour, selectedRegion.label)).slice(0, 4);
  }, [selectedRegion, tours]);

  return (
    <section className="rounded-[36px] border border-[#d8c8ae] bg-white p-6 shadow-[0_20px_60px_rgba(35,66,50,0.08)] md:p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#8b7451]">
            Region-first discovery
          </p>
          <h2 className="mt-2 text-2xl font-black uppercase tracking-tight text-slate-900">
            Search the route map like a trip planner
          </h2>
          <p className="mt-3 max-w-3xl text-sm font-medium leading-7 text-slate-600">
            Search a region, click its map marker, and immediately preview the packages currently
            available there before you dive into the full result list.
          </p>
        </div>
        {activeRegion ? (
          <button
            type="button"
            onClick={onClearRegion}
            className="rounded-full border border-slate-200 px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-600 transition hover:border-primary hover:text-primary"
          >
            Clear region filter
          </button>
        ) : null}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-5">
          <div className="rounded-[30px] border border-[#d9cfbe] bg-[#f8f4eb] p-4">
            <svg
              viewBox="0 0 100 100"
              className="h-[380px] w-full rounded-[24px] bg-[linear-gradient(180deg,#eef4ed_0%,#fdf8ef_100%)]"
            >
              <defs>
                <linearGradient id="eastAfricaGlow" x1="0%" x2="100%" y1="0%" y2="100%">
                  <stop offset="0%" stopColor="#dae9da" />
                  <stop offset="100%" stopColor="#f0eadc" />
                </linearGradient>
              </defs>
              <path
                d="M18 12C26 10 33 11 39 14C45 17 49 23 54 24C59 25 67 22 73 26C79 30 83 38 83 46C83 53 79 58 77 63C74 70 72 75 67 80C61 87 50 90 42 88C35 86 29 81 24 76C20 72 18 67 17 61C16 55 14 49 13 43C12 35 13 26 18 12Z"
                fill="url(#eastAfricaGlow)"
                stroke="#bfd2bf"
                strokeWidth="1.4"
              />
              <path
                d="M58 19C66 21 74 25 79 32C82 37 83 41 82 46"
                fill="none"
                stroke="#aac3aa"
                strokeWidth="1.2"
                strokeDasharray="2.2 2.2"
              />
              <path
                d="M23 31C31 34 39 40 45 48C52 57 57 66 63 74"
                fill="none"
                stroke="#d8c29a"
                strokeWidth="1.2"
                strokeDasharray="1.6 2.4"
              />
              {filteredRegions.map((region) => {
                const isActive = activeRegion === region.label;
                const x = region.coordinates?.x || 50;
                const y = region.coordinates?.y || 50;
                return (
                  <g key={region.id}>
                    <circle
                      cx={x}
                      cy={y}
                      r={isActive ? 7.6 : 6}
                      fill={isActive ? "#224433" : "#d9a441"}
                      stroke="#ffffff"
                      strokeWidth="2.2"
                      className="cursor-pointer transition-all"
                      onClick={() => onSelectRegion?.(region.label)}
                    />
                    <circle
                      cx={x}
                      cy={y}
                      r={isActive ? 11 : 9}
                      fill="transparent"
                      stroke={isActive ? "rgba(34,68,51,0.32)" : "rgba(217,164,65,0.26)"}
                      strokeWidth="1.5"
                    />
                    <text
                      x={x + 4}
                      y={y - 7}
                      fontSize="3.2"
                      fontWeight="800"
                      fill="#29412f"
                    >
                      {region.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-[24px] bg-[#224433] px-5 py-5 text-white">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#d9c79f]">
                Regions mapped
              </p>
              <p className="mt-3 text-3xl font-black">{regions.length}</p>
              <p className="mt-2 text-sm font-medium text-white/75">
                Live marketplace clusters currently searchable from the map.
              </p>
            </div>
            <div className="rounded-[24px] bg-[#f4e4be] px-5 py-5 text-[#5c421d]">
              <p className="text-[10px] font-black uppercase tracking-[0.2em]">Filtered regions</p>
              <p className="mt-3 text-3xl font-black">{filteredRegions.length}</p>
              <p className="mt-2 text-sm font-medium text-[#6b531f]">
                Narrow the region list by name, destination, or sample route title.
              </p>
            </div>
            <div className="rounded-[24px] bg-[#e1efe6] px-5 py-5 text-[#234232]">
              <p className="text-[10px] font-black uppercase tracking-[0.2em]">Preview trips</p>
              <p className="mt-3 text-3xl font-black">{selectedRegionTours.length}</p>
              <p className="mt-2 text-sm font-medium text-[#345242]">
                Packages currently previewed from the selected region.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-4">
            <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">
              Search the map
            </label>
            <div className="flex items-center rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <FaSearch className="mr-3 text-slate-400" />
              <input
                type="text"
                value={regionSearch}
                onChange={(event) => setRegionSearch(event.target.value)}
                placeholder="Serengeti, Zanzibar, Kilimanjaro..."
                className="w-full bg-transparent text-sm font-medium outline-none placeholder:text-slate-400"
              />
            </div>
          </div>

          <div className="max-h-[360px] space-y-3 overflow-y-auto pr-1">
            {filteredRegions.map((region) => {
              const isActive = activeRegion === region.label;
              return (
                <button
                  key={region.id}
                  type="button"
                  onClick={() => onSelectRegion?.(region.label)}
                  className={`w-full rounded-[24px] border px-5 py-4 text-left transition ${getRegionStatusTone(
                    isActive,
                  )}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-black uppercase tracking-wide">{region.label}</p>
                      <p className={`mt-2 text-sm font-medium ${isActive ? "text-white/80" : "text-slate-500"}`}>
                        {region.tourCount} tour{region.tourCount === 1 ? "" : "s"} from {region.operatorCount} operator
                        {region.operatorCount === 1 ? "" : "s"}
                      </p>
                    </div>
                    <span className={`text-sm font-black ${isActive ? "text-[#f4d589]" : "text-[#224433]"}`}>
                      From ${Number(region.startingPrice || 0).toLocaleString()}
                    </span>
                  </div>
                  {(region.destinations || []).length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {region.destinations.slice(0, 4).map((destination) => (
                        <span
                          key={`${region.id}-${destination}`}
                          className={`rounded-full px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] ${
                            isActive ? "bg-white/10 text-white" : "bg-white text-slate-500"
                          }`}
                        >
                          {destination}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </button>
              );
            })}
          </div>

          <div className="rounded-[28px] border border-[#d8c8ae] bg-[#fffaf1] p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#8b7451]">
                  Region preview
                </p>
                <h3 className="mt-2 text-xl font-black uppercase tracking-tight text-slate-900">
                  {selectedRegion?.label || "Choose a route region"}
                </h3>
                <p className="mt-2 text-sm font-medium leading-6 text-slate-600">
                  {selectedRegion
                    ? `Preview marketplace packages for ${selectedRegion.label} before opening the full trip detail.`
                    : "Pick a region on the map or search list to preview packages here."}
                </p>
              </div>
              {selectedRegion ? (
                <div className="rounded-full bg-[#224433] px-4 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-white">
                  {selectedRegion.tourCount} trips
                </div>
              ) : null}
            </div>

            <div className="mt-4 space-y-3">
              {selectedRegionTours.length > 0 ? (
                selectedRegionTours.map((tour) => (
                  <Link
                    key={tour._id}
                    to={`/discover/tour/${tour._id}`}
                    className="flex items-center justify-between gap-4 rounded-[22px] border border-[#e2d2b7] bg-white px-4 py-4 transition hover:border-primary hover:shadow-md"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black uppercase tracking-wide text-slate-900">
                        {tour.title}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">
                        <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2">
                          <FaMapMarkerAlt />
                          {tour.location || selectedRegion.label}
                        </span>
                        <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2">
                          <FaRoute />
                          {tour.duration || "Multi-day"}
                        </span>
                        {tour.marketplaceAvailability?.[0]?.date ? (
                          <span className="inline-flex items-center gap-2 rounded-full bg-[#eef4ed] px-3 py-2 text-[#234232]">
                            <FaCompass />
                            {formatAvailabilityDate(tour.marketplaceAvailability[0].date)}
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-right">
                      <div>
                        <p className="text-lg font-black text-slate-900">${tour.price}</p>
                        <p className="text-[10px] font-black uppercase tracking-[0.15em] text-primary">
                          Open trip
                        </p>
                      </div>
                      <FaArrowRight className="text-primary" />
                    </div>
                  </Link>
                ))
              ) : (
                <div className="rounded-[22px] border border-dashed border-[#d8c8ae] bg-white px-4 py-5 text-sm font-medium text-slate-500">
                  No package preview is available for this region under the current filters yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DiscoveryRegionMap;
