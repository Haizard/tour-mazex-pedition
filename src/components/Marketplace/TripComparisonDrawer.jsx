import { Link } from "react-router-dom";

const formatAvailabilityDate = (value = "") => {
  if (!value) return "";
  return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

const TripComparisonDrawer = ({ trips = [], onRemove, onClear }) => (
  <section className="rounded-[36px] border border-[#d8c8ae] bg-[#fbf8f1] p-6 shadow-[0_20px_60px_rgba(35,66,50,0.08)] md:p-8">
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#8b7451]">
          Compare trips
        </p>
        <h2 className="mt-2 text-2xl font-black uppercase tracking-tight text-slate-900">
          Side-by-side trip fit
        </h2>
      </div>
      {trips.length > 0 ? (
        <button
          type="button"
          onClick={onClear}
          className="rounded-full border border-slate-200 px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-600"
        >
          Clear compare set
        </button>
      ) : null}
    </div>

    {trips.length > 0 ? (
      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[860px] text-left">
          <thead>
            <tr className="border-b border-slate-200 text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
              <th className="pb-4 pr-4">Field</th>
              {trips.map((trip) => (
                <th key={trip._id} className="pb-4 pr-4 align-top">
                  <div className="rounded-[24px] border border-slate-200 bg-white p-4">
                    <p className="text-sm font-black uppercase tracking-tight text-slate-900">{trip.title}</p>
                    <p className="mt-2 text-xs font-medium text-slate-500">{trip.operator?.name || "Verified Operator"}</p>
                    <p className="mt-2 text-[10px] font-black uppercase tracking-[0.16em] text-[#8b7451]">
                      {trip.marketplaceAvailability?.[0]
                        ? `${trip.marketplaceAvailability[0].status} • ${formatAvailabilityDate(
                            trip.marketplaceAvailability[0].date
                          )}`
                        : "Dates on request"}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Link
                        to={`/discover/tour/${trip._id}`}
                        className="rounded-full bg-[#224433] px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-white"
                      >
                        Open
                      </Link>
                      <button
                        type="button"
                        onClick={() => onRemove?.(trip._id)}
                        className="rounded-full border border-slate-200 px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-600"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="align-top text-sm font-medium text-slate-600">
            {[
              ["Starting price", (trip) => `$${Number(trip.price || 0).toLocaleString()}`],
              ["Duration", (trip) => trip.duration || "Multi-day"],
              ["Location", (trip) => trip.location || "East Africa"],
              [
                "Next departure",
                (trip) =>
                  trip.marketplaceAvailability?.[0]
                    ? `${trip.marketplaceAvailability[0].status} - ${formatAvailabilityDate(
                        trip.marketplaceAvailability[0].date
                      )}${
                        typeof trip.marketplaceAvailability[0].remainingSpots === "number"
                          ? ` (${trip.marketplaceAvailability[0].remainingSpots} spots)`
                          : ""
                      }`
                    : "Request next available dates",
              ],
              ["Travel style", (trip) => trip.category || trip.tourType || "Curated journey"],
              [
                "Review summary",
                (trip) =>
                  trip.marketplace?.averageRating
                    ? `${trip.marketplace.averageRating}/5 from ${trip.marketplace.reviewCount || 0} reviews`
                    : "New feedback profile",
              ],
              [
                "Inclusions snapshot",
                (trip) => (trip.inclusions || []).slice(0, 3).join(", ") || "Ask operator for inclusions",
              ],
              [
                "Destinations",
                (trip) => (trip.destinationsVisited || []).slice(0, 4).join(", ") || "Route details on request",
              ],
            ].map(([label, render]) => (
              <tr key={label} className="border-b border-slate-100">
                <td className="py-4 pr-4 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                  {label}
                </td>
                {trips.map((trip) => (
                  <td key={`${trip._id}-${label}`} className="py-4 pr-4 leading-7">
                    {render(trip)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ) : (
      <div className="mt-6 rounded-[28px] border border-dashed border-slate-300 bg-white px-6 py-8">
        <p className="text-sm font-medium leading-7 text-slate-600">
          Add up to four marketplace tours to compare price, route shape, inclusions, and review context.
        </p>
      </div>
    )}
  </section>
);

export default TripComparisonDrawer;
