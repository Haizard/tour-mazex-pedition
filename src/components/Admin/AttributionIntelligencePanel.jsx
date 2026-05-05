import React, { useEffect, useState } from "react";
import { fetchEcosystemIntelligence, fetchDemandForecast } from "../../services/api";

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtCurrency = (n) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(n || 0));

const pct = (n, total) =>
  total > 0 ? ((Number(n || 0) / Number(total)) * 100).toFixed(1) : "0.0";

// ── Stat card ─────────────────────────────────────────────────────────────────
const KPICard = ({ label, value, sub, accent = "#6366f1" }) => (
  <div style={{ border: `1px solid ${accent}30`, borderRadius: "16px", background: `${accent}08` }}
    className="p-4">
    <p style={{ color: accent }} className="text-[10px] font-bold uppercase tracking-widest">{label}</p>
    <p className="mt-1 text-2xl font-black text-white">{value}</p>
    {sub && <p className="mt-0.5 text-xs text-slate-400">{sub}</p>}
  </div>
);

// ── Bar component ─────────────────────────────────────────────────────────────
const BarRow = ({ label, value, max, color = "#6366f1", suffix = "" }) => {
  const pctWidth = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="font-medium text-slate-300">{label}</span>
        <span className="font-bold text-white">{value}{suffix}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
        <div style={{ width: `${pctWidth}%`, background: color, transition: "width 0.8s ease" }}
          className="h-full rounded-full" />
      </div>
    </div>
  );
};

// ── Main component ────────────────────────────────────────────────────────────
const AttributionIntelligencePanel = () => {
  const [data, setData]       = useState(null);
  const [demand, setDemand]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    Promise.all([
      fetchEcosystemIntelligence(),
      fetchDemandForecast().catch(() => ({ data: null })),
    ])
      .then(([intRes, demRes]) => {
        setData(intRes.data);
        setDemand(demRes.data);
        setLoading(false);
      })
      .catch(() => { setError("Unable to load intelligence data."); setLoading(false); });
  }, []);

  if (loading) return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500/30 border-t-indigo-500" />
    </div>
  );

  if (error) return (
    <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-center">
      <p className="text-sm text-red-400">{error}</p>
    </div>
  );

  const funnel  = data?.funnelVelocity || {};
  const channels = data?.channelROI || [];
  const partners = data?.partnerPerformance || [];

  const totalInquiries  = Number(funnel.totalInquiries || 0);
  const totalConverted  = Number(funnel.totalConverted || 0);
  const totalRevenue    = Number(funnel.grossRevenue || 0);
  const convRate        = pct(totalConverted, totalInquiries);

  const maxChannelRev   = Math.max(...channels.map(c => Number(c.revenue || 0)), 1);
  const maxPartnerRev   = Math.max(...partners.map(p => Number(p.attributedRevenue || 0)), 1);

  const demandVelocity  = demand?.monthlyVelocity || [];
  const peakDay         = demand?.peakDayOfWeek || "—";
  const fillChange      = demand?.fillRate?.changePercent;
  const fillTrend       = demand?.trend || "stable";

  const trendMeta = {
    growing:  { label: "▲ Growing",  color: "#10b981" },
    declining:{ label: "▼ Declining",color: "#ef4444" },
    stable:   { label: "→ Stable",   color: "#f59e0b" },
  };
  const trendInfo = trendMeta[fillTrend] || trendMeta.stable;

  return (
    <div className="space-y-6" style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-400">
          Milestone 5 · Network Intelligence
        </p>
        <h2 className="mt-1 text-xl font-black text-white">Attribution & Demand Intelligence</h2>
        <p className="mt-1 text-xs text-slate-400">
          Full-funnel channel ROI, partner attribution, and demand forecasting across all distribution layers.
        </p>
      </div>

      {/* ── Funnel KPIs ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KPICard label="Total Inquiries"   value={totalInquiries.toLocaleString()} sub="All sources"          accent="#6366f1" />
        <KPICard label="Converted"         value={totalConverted.toLocaleString()} sub={`${convRate}% rate`}  accent="#10b981" />
        <KPICard label="Gross Revenue"     value={fmtCurrency(totalRevenue)}       sub="Paid bookings"        accent="#f59e0b" />
        <KPICard label="Demand Trend"      value={trendInfo.label}                 sub={`Peak day: ${peakDay}`} accent={trendInfo.color} />
      </div>

      {/* ── Channel ROI ────────────────────────────────────────────────────── */}
      {channels.length > 0 && (
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "20px" }}
          className="p-5">
          <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-400">Channel Revenue Attribution</h3>
          <div className="space-y-3">
            {[...channels]
              .sort((a, b) => Number(b.revenue || 0) - Number(a.revenue || 0))
              .map((ch, i) => {
                const colors = ["#6366f1","#10b981","#f59e0b","#ec4899","#3b82f6","#8b5cf6"];
                return (
                  <BarRow
                    key={ch.channel || i}
                    label={ch.channel || "Unknown"}
                    value={fmtCurrency(ch.revenue)}
                    max={maxChannelRev}
                    color={colors[i % colors.length]}
                  />
                );
              })}
          </div>
        </div>
      )}

      {/* ── Partner ROI ────────────────────────────────────────────────────── */}
      {partners.length > 0 && (
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "20px" }}
          className="p-5">
          <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-400">Partner Revenue Leaderboard</h3>
          <div className="space-y-3">
            {[...partners]
              .sort((a, b) => Number(b.attributedRevenue || 0) - Number(a.attributedRevenue || 0))
              .slice(0, 8)
              .map((p, i) => (
                <div key={p.referralCode || i} className="flex items-center gap-3">
                  <span className="w-5 shrink-0 text-center text-xs font-black text-slate-500">
                    {i + 1}
                  </span>
                  <div className="flex-1">
                    <BarRow
                      label={p.referralCode || "Direct"}
                      value={fmtCurrency(p.attributedRevenue)}
                      max={maxPartnerRev}
                      color="#a855f7"
                    />
                  </div>
                  <span className="shrink-0 text-xs text-slate-500">
                    {p.bookingCount || 0} bkgs
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ── Demand Velocity Chart (simple bar) ────────────────────────────── */}
      {demandVelocity.length > 0 && (
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "20px" }}
          className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Monthly Booking Velocity (12m)</h3>
            {fillChange !== "N/A" && (
              <span className={`text-xs font-bold ${Number(fillChange) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                {Number(fillChange) >= 0 ? "+" : ""}{fillChange}% MoM
              </span>
            )}
          </div>
          <div className="flex h-24 items-end gap-1">
            {demandVelocity.map((m, i) => {
              const maxBookings = Math.max(...demandVelocity.map(x => x.bookings), 1);
              const h = Math.max(4, (m.bookings / maxBookings) * 100);
              return (
                <div key={m.month || i} className="group relative flex flex-1 flex-col items-center">
                  <div style={{ height: `${h}%`, background: "linear-gradient(180deg,#6366f1,#8b5cf6)", borderRadius: "4px 4px 0 0" }}
                    className="w-full transition-all duration-300 group-hover:opacity-80" />
                  <span className="mt-1 hidden text-[8px] text-slate-600 group-hover:block">
                    {m.month?.slice(5)}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="mt-2 flex justify-between text-[9px] text-slate-600">
            <span>{demandVelocity[0]?.month}</span>
            <span>{demandVelocity[demandVelocity.length - 1]?.month}</span>
          </div>
        </div>
      )}

    </div>
  );
};

export default AttributionIntelligencePanel;
