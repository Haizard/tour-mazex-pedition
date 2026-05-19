import React from "react";

const AvailabilityFiltersBar = ({ filters, onChange, tours = [] }) => (
  <div className="grid gap-3 rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm md:grid-cols-2 xl:grid-cols-6">
    <input
      value={filters.search}
      onChange={(event) => onChange("search", event.target.value)}
      placeholder="Search package, note, date"
      className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-semibold text-zinc-900 outline-none ring-0 transition focus:border-zinc-950"
    />

    <select
      value={filters.packageId}
      onChange={(event) => onChange("packageId", event.target.value)}
      className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-semibold text-zinc-900 outline-none"
    >
      <option value="">All packages</option>
      {tours.map((tour) => (
        <option key={tour.id} value={tour.id}>
          {tour.title}
        </option>
      ))}
    </select>

    <select
      value={filters.status}
      onChange={(event) => onChange("status", event.target.value)}
      className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-semibold text-zinc-900 outline-none"
    >
      <option value="">All states</option>
      <option value="available">Available</option>
      <option value="limited">Limited</option>
      <option value="unavailable">Unavailable</option>
      <option value="on-request">On request</option>
    </select>

    <input
      type="month"
      value={filters.month}
      onChange={(event) => onChange("month", event.target.value)}
      className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-semibold text-zinc-900 outline-none"
    />

    <label className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-semibold text-zinc-800">
      <input
        type="checkbox"
        checked={filters.instantReady}
        onChange={(event) => onChange("instantReady", event.target.checked)}
      />
      Instant-ready only
    </label>

    <label className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-semibold text-zinc-800">
      <input
        type="checkbox"
        checked={filters.requestOnly}
        onChange={(event) => onChange("requestOnly", event.target.checked)}
      />
      Request-only only
    </label>
  </div>
);

export default AvailabilityFiltersBar;
