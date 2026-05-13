import { Link } from "react-router-dom";

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

const SavedTripsRail = ({ trips = [], onRemove }) => (
  <section className="rounded-[36px] border border-[#d8c8ae] bg-white p-6 shadow-[0_20px_60px_rgba(35,66,50,0.08)] md:p-8">
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#8b7451]">
          Saved trips
        </p>
        <h2 className="mt-2 text-2xl font-black uppercase tracking-tight text-slate-900">
          Your shortlist
        </h2>
      </div>
      <p className="text-sm font-medium text-slate-500">
        Keep a few strong options nearby while you compare route style, price, and operator fit.
      </p>
    </div>

    {trips.length > 0 ? (
      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {trips.map((trip) => (
          <article key={trip._id} className="overflow-hidden rounded-[28px] border border-slate-100 bg-slate-50">
            <img src={trip.image} alt={trip.title} className="h-40 w-full object-cover" />
            <div className="p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#8b7451]">
                {trip.operator?.name || "Verified Operator"}
              </p>
              <h3 className="mt-2 text-lg font-black uppercase tracking-tight text-slate-900">
                {trip.title}
              </h3>
              {trip.marketplaceAvailability?.[0] ? (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] ${getAvailabilityTone(
                      trip.marketplaceAvailability[0].status
                    )}`}
                  >
                    {trip.marketplaceAvailability[0].status}
                  </span>
                  <span className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">
                    {formatAvailabilityDate(trip.marketplaceAvailability[0].date)}
                    {typeof trip.marketplaceAvailability[0].remainingSpots === "number"
                      ? ` - ${trip.marketplaceAvailability[0].remainingSpots} spots`
                      : ""}
                  </span>
                </div>
              ) : (
                <p className="mt-3 text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">
                  Dates on request
                </p>
              )}
              <p className="mt-2 text-sm font-medium text-slate-500">
                {[trip.location || "East Africa", trip.duration || "Multi-day"].join(" • ")}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  to={`/discover/tour/${trip._id}`}
                  className="rounded-full bg-[#224433] px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-white"
                >
                  View tour
                </Link>
                <button
                  type="button"
                  onClick={() => onRemove?.(trip._id)}
                  className="rounded-full border border-slate-200 px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-600"
                >
                  Remove
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    ) : (
      <div className="mt-6 rounded-[28px] border border-dashed border-slate-300 bg-slate-50 px-6 py-8">
        <p className="text-sm font-medium leading-7 text-slate-600">
          Save the tours that feel promising. Your shortlist will stay here while you keep browsing the marketplace.
        </p>
      </div>
    )}
  </section>
);

export default SavedTripsRail;
