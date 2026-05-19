import React from "react";

const copyByReason = {
  "missing-published-dates": "This tour is marketplace-visible but has no published departures.",
  "instant-booking-blocked": "Instant booking is enabled, but no qualifying departure is ready.",
};

const AvailabilityHealthPanel = ({ health = [], topDemandTours = [], onOpenTour }) => (
  <div className="rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-white p-6 shadow-sm">
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-700">
          Availability Health
        </p>
        <h3 className="mt-2 text-xl font-black tracking-tight text-zinc-950">
          Watchlist
        </h3>
      </div>
      <div className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-amber-800">
        {health.length} alerts
      </div>
    </div>

    <div className="mt-5 space-y-3">
      {topDemandTours.length > 0 && (
        <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-4">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-sky-700">
            Demand Pulse
          </p>
          <div className="mt-3 space-y-2">
            {topDemandTours.map((tour) => (
              <button
                key={tour.id}
                type="button"
                onClick={() => onOpenTour?.(tour.id)}
                className="flex w-full items-center justify-between rounded-2xl bg-white px-3 py-3 text-left shadow-sm transition hover:bg-sky-100"
              >
                <div>
                  <p className="text-sm font-black text-zinc-950">{tour.title}</p>
                  <p className="mt-1 text-xs font-semibold text-zinc-500">{tour.location}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-sky-800">{tour.demandScore || 0}</p>
                  <p className="text-[11px] font-semibold text-zinc-500">demand score</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {health.length === 0 && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm font-semibold text-emerald-800">
          No marketplace availability warnings right now.
        </div>
      )}

      {health.map((warning) => (
        <div
          key={`${warning.tourId}:${warning.reason}`}
          className="flex items-start justify-between gap-4 rounded-2xl border border-amber-200 bg-white px-4 py-4"
        >
          <div>
            <p className="text-sm font-black text-zinc-950">{warning.title || "Untitled tour"}</p>
            <p className="mt-1 text-sm text-zinc-600">
              {copyByReason[warning.reason] || "Availability needs attention."}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onOpenTour?.(warning.tourId)}
            className="rounded-full border border-zinc-300 px-3 py-2 text-xs font-black uppercase tracking-[0.18em] text-zinc-700 transition hover:border-zinc-950 hover:text-zinc-950"
          >
            Open
          </button>
        </div>
      ))}
    </div>
  </div>
);

export default AvailabilityHealthPanel;
