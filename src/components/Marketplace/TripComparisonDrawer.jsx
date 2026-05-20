import { Link } from "react-router-dom";
import { buildTripComparisonFields } from "./tripComparisonUtils";

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
      <>
        <div className="mt-6 space-y-4 md:hidden">
          {trips.map((trip) => (
            <article key={trip._id} className="rounded-[28px] border border-slate-200 bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-black uppercase tracking-tight text-slate-900">{trip.title}</p>
                  <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[#8b7451]">
                    {trip.operator?.name || "Verified Operator"}
                  </p>
                  <p className="mt-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
                    {trip.marketplaceAvailability?.[0]
                      ? `${trip.marketplaceAvailability[0].status} • ${formatAvailabilityDate(
                          trip.marketplaceAvailability[0].date,
                        )}`
                      : "Dates on request"}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
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

              <div className="mt-4 space-y-3">
                {buildTripComparisonFields(trip).map(([label, value]) => (
                  <div
                    key={`${trip._id}-${label}`}
                    className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3"
                  >
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                      {label}
                    </p>
                    <p className="mt-1 text-sm font-medium leading-6 text-slate-700">{value}</p>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>

        <div className="mt-6 hidden overflow-x-auto md:block">
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
            {buildTripComparisonFields(trips[0]).map(([label]) => (
              <tr key={label} className="border-b border-slate-100">
                <td className="py-4 pr-4 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                  {label}
                </td>
                {trips.map((trip) => (
                  <td key={`${trip._id}-${label}`} className="py-4 pr-4 leading-7">
                    {buildTripComparisonFields(trip).find(([fieldLabel]) => fieldLabel === label)?.[1]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </>
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
