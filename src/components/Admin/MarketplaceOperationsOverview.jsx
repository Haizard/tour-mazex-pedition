import { useEffect, useState } from "react";
import { FaBell, FaBolt, FaCalendarCheck, FaCamera, FaHeart, FaQuestionCircle, FaStar } from "react-icons/fa";

import { fetchMarketplaceOperationsSnapshot } from "../../services/api";
import Badge from "../UI/Badge";
import Card from "../UI/Card";

const statCards = (totals = {}) => [
  {
    label: "Live Packages",
    value: totals.liveCount || 0,
    hint: `${totals.partnerReadyCount || 0} partner-ready`,
    icon: FaStar,
    tone: "bg-[#224433] text-white",
  },
  {
    label: "Upcoming Departures",
    value: totals.upcomingDepartureCount || 0,
    hint: `${totals.instantReadyCount || 0} instant-ready packages`,
    icon: FaCalendarCheck,
    tone: "bg-[#f2e6cf] text-[#5d4221]",
  },
  {
    label: "Saved Trips",
    value: totals.savedTripCount || 0,
    hint: `${totals.reminderWatcherCount || 0} reminder watchers`,
    icon: FaHeart,
    tone: "bg-[#e1efe6] text-[#234232]",
  },
  {
    label: "Community Queue",
    value:
      Number(totals.pendingReviewCount || 0) +
      Number(totals.pendingPhotoCount || 0) +
      Number(totals.pendingQuestionCount || 0),
    hint: `${totals.publicReviewCount || 0} public reviews live`,
    icon: FaBell,
    tone: "bg-[#fff3d6] text-[#8a5a05]",
  },
];

const formatAvailabilityDate = (value = "") => {
  if (!value) return "On request";
  return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

const MarketplaceOperationsOverview = () => {
  const [snapshot, setSnapshot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await fetchMarketplaceOperationsSnapshot();
        setSnapshot(response.data || null);
      } catch (requestError) {
        setError(requestError.response?.data?.message || "Unable to load marketplace operations.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const totals = snapshot?.totals || {};
  const packages = snapshot?.packages || [];

  return (
    <Card className="border-none p-8 shadow-xl">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="mb-2 text-[10px] font-black uppercase tracking-[0.3em] text-primary">
            Marketplace Ops
          </p>
          <h2 className="text-3xl font-black uppercase tracking-tighter text-gray-900">
            Marketplace Operations Snapshot
          </h2>
          <p className="mt-2 max-w-3xl text-sm font-medium text-slate-500">
            See which packages are live, getting saved by travelers, collecting community activity,
            and carrying future departures without jumping between multiple admin screens.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="primary">{totals.packageCount || 0} Packages</Badge>
          <Badge variant="accent">{totals.publicPhotoCount || 0} Public Moments</Badge>
          <Badge variant="secondary">{totals.publicQuestionCount || 0} Public Questions</Badge>
        </div>
      </div>

      {error ? (
        <div className="mt-6 rounded-[28px] border border-red-200 bg-red-50 px-6 py-5 text-sm font-bold text-red-700">
          {error}
        </div>
      ) : null}

      <div className="mt-6 grid gap-4 lg:grid-cols-4">
        {statCards(totals).map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className={`rounded-[28px] p-5 ${item.tone}`}>
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] opacity-80">{item.label}</p>
                <Icon className="text-base opacity-80" />
              </div>
              <p className="mt-4 text-4xl font-black tracking-tight">{item.value}</p>
              <p className="mt-2 text-sm font-medium opacity-80">{item.hint}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[1050px] text-left">
          <thead>
            <tr className="border-b border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400">
              <th className="pb-4">Package</th>
              <th className="pb-4">Availability</th>
              <th className="pb-4">Reviews</th>
              <th className="pb-4">Travel Moments</th>
              <th className="pb-4">Questions</th>
              <th className="pb-4">Saved Trips</th>
              <th className="pb-4">Instant</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
            {loading ? (
              <tr>
                <td colSpan="7" className="py-10 text-center text-slate-400">
                  Loading marketplace operations...
                </td>
              </tr>
            ) : null}
            {!loading && packages.length === 0 ? (
              <tr>
                <td colSpan="7" className="py-10 text-center text-slate-400">
                  No packages are available to summarize yet.
                </td>
              </tr>
            ) : null}
            {!loading &&
              packages.map((item) => (
                <tr key={item.id}>
                  <td className="py-4">
                    <p className="font-black uppercase tracking-tight text-slate-900">{item.title}</p>
                    <p className="mt-1 text-xs uppercase tracking-wide text-slate-400">
                      {item.location || "Unassigned"} {item.category ? `- ${item.category}` : ""}
                    </p>
                  </td>
                  <td className="py-4">
                    <p className="font-bold text-slate-900">{formatAvailabilityDate(item.nextPublishedDate)}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {item.upcomingDatesCount || 0} upcoming departures
                    </p>
                  </td>
                  <td className="py-4">
                    <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-xs font-black uppercase tracking-wide text-slate-700">
                      <FaStar className="text-amber-500" />
                      {item.publicReviewCount || 0} public / {item.pendingReviewCount || 0} pending
                    </div>
                  </td>
                  <td className="py-4">
                    <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-xs font-black uppercase tracking-wide text-slate-700">
                      <FaCamera className="text-emerald-600" />
                      {item.publicPhotoCount || 0} public / {item.pendingPhotoCount || 0} pending
                    </div>
                  </td>
                  <td className="py-4">
                    <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-xs font-black uppercase tracking-wide text-slate-700">
                      <FaQuestionCircle className="text-sky-600" />
                      {item.publicQuestionCount || 0} public / {item.pendingQuestionCount || 0} pending
                    </div>
                  </td>
                  <td className="py-4">
                    <p className="font-bold text-slate-900">{item.savedTripCount || 0}</p>
                    <p className="mt-1 text-xs text-slate-500">{item.reminderWatcherCount || 0} watchers</p>
                  </td>
                  <td className="py-4">
                    <Badge variant={item.instantBookingEnabled ? "primary" : "secondary"}>
                      <span className="inline-flex items-center gap-2">
                        <FaBolt />
                        {item.instantBookingEnabled ? "Ready" : "Request"}
                      </span>
                    </Badge>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

export default MarketplaceOperationsOverview;
