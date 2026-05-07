import { useMemo, useState } from "react";

import Badge from "../UI/Badge";
import Card from "../UI/Card";

const statusBadgeVariant = (isActive) => (isActive ? "primary" : "secondary");

const MarketplaceVisibilityManager = ({ tours = [], onToggle }) => {
  const [query, setQuery] = useState("");

  const filteredTours = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return tours;
    }

    return tours.filter((tour) =>
      `${tour.title || ""} ${tour.location || ""} ${tour.category || ""} ${tour.tourType || ""}`
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [query, tours]);

  const visibleCount = tours.filter((tour) => tour.isMarketplaceVisible).length;
  const distributableCount = tours.filter((tour) => tour.isPubliclyDistributable !== false).length;

  return (
    <Card className="border-none p-8 shadow-xl">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="mb-2 text-[10px] font-black uppercase tracking-[0.3em] text-primary">
            Marketplace Desk
          </p>
          <h2 className="text-3xl font-black uppercase tracking-tighter text-gray-900">
            Discover Visibility
          </h2>
          <p className="mt-2 max-w-3xl text-sm font-medium text-slate-500">
            This is where tenants enable packages for the public discover page and partner distribution.
            Use the package editor for one-by-one control, or manage the whole inventory here.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="primary">{visibleCount} Live on Discover</Badge>
          <Badge variant="accent">{distributableCount} Partner Ready</Badge>
        </div>
      </div>

      <div className="mt-6 rounded-[28px] border border-slate-200 bg-slate-50 p-4">
        <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">
          Search Inventory
        </label>
        <input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Find a package by title, location, or category"
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[900px] text-left">
          <thead>
            <tr className="border-b border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400">
              <th className="pb-4">Package</th>
              <th className="pb-4">Location</th>
              <th className="pb-4">Category</th>
              <th className="pb-4">Price</th>
              <th className="pb-4">Discover Status</th>
              <th className="pb-4">Partner Status</th>
              <th className="pb-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
            {filteredTours.map((tour) => (
              <tr key={tour._id}>
                <td className="py-4">
                  <p className="font-black uppercase tracking-tight text-slate-900">{tour.title}</p>
                  <p className="mt-1 text-xs uppercase tracking-wide text-slate-400">
                    {tour.duration || "Multi-day"} {tour.tourType ? `• ${tour.tourType}` : ""}
                  </p>
                </td>
                <td className="py-4 text-slate-600">{tour.location || "Unassigned"}</td>
                <td className="py-4 text-slate-600">{tour.category || "General"}</td>
                <td className="py-4 font-bold text-slate-900">${Number(tour.price || 0).toLocaleString()}</td>
                <td className="py-4">
                  <Badge variant={statusBadgeVariant(tour.isMarketplaceVisible)}>
                    {tour.isMarketplaceVisible ? "Visible" : "Hidden"}
                  </Badge>
                </td>
                <td className="py-4">
                  <Badge variant={statusBadgeVariant(tour.isPubliclyDistributable !== false)}>
                    {tour.isPubliclyDistributable !== false ? "Enabled" : "Blocked"}
                  </Badge>
                </td>
                <td className="py-4">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        onToggle?.(tour._id, "isMarketplaceVisible", !tour.isMarketplaceVisible)
                      }
                      className="rounded-2xl border border-slate-200 px-4 py-2 text-[11px] font-black uppercase tracking-widest text-slate-700 transition hover:border-primary hover:text-primary"
                    >
                      {tour.isMarketplaceVisible ? "Hide from Discover" : "Show on Discover"}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onToggle?.(
                          tour._id,
                          "isPubliclyDistributable",
                          !(tour.isPubliclyDistributable !== false),
                        )
                      }
                      className="rounded-2xl border border-slate-200 px-4 py-2 text-[11px] font-black uppercase tracking-widest text-slate-700 transition hover:border-primary hover:text-primary"
                    >
                      {tour.isPubliclyDistributable !== false
                        ? "Disable Partner Use"
                        : "Enable Partner Use"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredTours.length === 0 && (
              <tr>
                <td colSpan="7" className="py-10 text-center text-sm font-medium text-slate-400">
                  No packages matched that search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

export default MarketplaceVisibilityManager;
