import React from "react";

const statusClass = {
  available: "bg-emerald-50 text-emerald-700 border-emerald-200",
  limited: "bg-amber-50 text-amber-700 border-amber-200",
  unavailable: "bg-rose-50 text-rose-700 border-rose-200",
  "on-request": "bg-sky-50 text-sky-700 border-sky-200",
};

const AvailabilityOperationsTable = ({
  rows = [],
  selectedRowIds = [],
  onToggleRow,
  onOpenTour,
  onStatusChange,
}) => (
  <div className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm">
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-zinc-200">
        <thead className="bg-zinc-50">
          <tr className="text-left text-xs font-black uppercase tracking-[0.18em] text-zinc-500">
            <th className="px-4 py-4">Pick</th>
            <th className="px-4 py-4">Package</th>
            <th className="px-4 py-4">Departure</th>
            <th className="px-4 py-4">Status</th>
            <th className="px-4 py-4">Spots</th>
            <th className="px-4 py-4">Signals</th>
            <th className="px-4 py-4">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {rows.map((row) => (
            <tr key={row.rowId} className="align-top">
              <td className="px-4 py-4">
                <input
                  type="checkbox"
                  checked={selectedRowIds.includes(row.rowId)}
                  onChange={() => onToggleRow?.(row.rowId)}
                />
              </td>
              <td className="px-4 py-4">
                <p className="text-sm font-black text-zinc-950">{row.packageTitle}</p>
                <p className="mt-1 text-sm text-zinc-500">{row.location}</p>
              </td>
              <td className="px-4 py-4 text-sm font-semibold text-zinc-800">{row.dateKey}</td>
              <td className="px-4 py-4">
                <select
                  value={row.status}
                  onChange={(event) => onStatusChange?.(row, event.target.value)}
                  className={`rounded-full border px-3 py-2 text-xs font-black uppercase tracking-[0.18em] ${statusClass[row.status] || "border-zinc-200 bg-zinc-50 text-zinc-700"}`}
                >
                  <option value="available">Available</option>
                  <option value="limited">Limited</option>
                  <option value="unavailable">Unavailable</option>
                  <option value="on-request">On Request</option>
                </select>
              </td>
              <td className="px-4 py-4 text-sm font-semibold text-zinc-800">
                {typeof row.remainingSpots === "number" ? row.remainingSpots : "—"}
              </td>
              <td className="px-4 py-4">
                <div className="flex flex-wrap gap-2">
                  {row.instantReady && (
                    <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-emerald-800">
                      Instant
                    </span>
                  )}
                  {row.requestOnly && (
                    <span className="rounded-full bg-sky-100 px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-sky-800">
                      Request
                    </span>
                  )}
                </div>
              </td>
              <td className="px-4 py-4">
                <button
                  type="button"
                  onClick={() => onOpenTour?.(row.tourId)}
                  className="rounded-full border border-zinc-300 px-3 py-2 text-xs font-black uppercase tracking-[0.18em] text-zinc-700 transition hover:border-zinc-950 hover:text-zinc-950"
                >
                  Schedule
                </button>
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan="7" className="px-4 py-10 text-center text-sm font-semibold text-zinc-500">
                No departures match the current filters.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
);

export default AvailabilityOperationsTable;
