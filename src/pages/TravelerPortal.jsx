import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

// ── Status badge helper ───────────────────────────────────────────────────────
const stageMeta = {
  paid:       { label: "Confirmed & Paid",  color: "#10b981", bg: "#d1fae5" },
  confirmed:  { label: "Confirmed",          color: "#3b82f6", bg: "#dbeafe" },
  deposit:    { label: "Deposit Received",   color: "#8b5cf6", bg: "#ede9fe" },
  pending:    { label: "Awaiting Payment",   color: "#f59e0b", bg: "#fef3c7" },
  cancelled:  { label: "Cancelled",          color: "#ef4444", bg: "#fee2e2" },
};

const StatusBadge = ({ stage }) => {
  const meta = stageMeta[stage] || { label: stage || "Pending", color: "#6b7280", bg: "#f3f4f6" };
  return (
    <span style={{ background: meta.bg, color: meta.color }}
      className="inline-block rounded-full px-3 py-1 text-xs font-bold tracking-wide">
      {meta.label}
    </span>
  );
};

// ── Itinerary step icon by type ───────────────────────────────────────────────
const typeIcon = {
  guide:          "🧭",
  accommodation:  "🏨",
  transport:      "🚐",
  airport_pickup: "✈️",
  general:        "📌",
};

// ── Format date ───────────────────────────────────────────────────────────────
const fmtDate = (d) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
};

const fmtCurrency = (amount, currency = "USD") => {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
  } catch {
    return `${currency} ${Number(amount).toLocaleString()}`;
  }
};

// ── Main Component ────────────────────────────────────────────────────────────
const TravelerPortal = () => {
  const { token } = useParams();
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    if (!token) return;
    axios.get(`/api/traveler-portal/trip/${token}`)
      .then(res => { setData(res.data); setLoading(false); })
      .catch(err => {
        setError(err.response?.data?.message || "Unable to load your trip details.");
        setLoading(false);
      });
  }, [token]);

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#0f172a 0%,#1e293b 100%)" }}
      className="flex items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-white/20 border-t-white" />
        <p className="text-sm font-medium text-slate-300">Loading your trip details…</p>
      </div>
    </div>
  );

  // ── Error / Expired ──────────────────────────────────────────────────────────
  if (error) return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#0f172a 0%,#1e293b 100%)" }}
      className="flex items-center justify-center px-4">
      <div className="mx-auto max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur-xl">
        <div className="mb-4 text-5xl">🔒</div>
        <h1 className="mb-2 text-xl font-bold text-white">Trip Link Unavailable</h1>
        <p className="text-sm text-slate-400">{error}</p>
        <p className="mt-4 text-xs text-slate-500">Please contact your tour operator for a new link.</p>
      </div>
    </div>
  );

  const { booking, payment, itinerary } = data || {};

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#0f172a 0%,#1e293b 100%)", fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }} className="px-6 py-5">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🌍</span>
            <span className="text-sm font-semibold tracking-wide text-white">My Trip Portal</span>
          </div>
          {booking && <StatusBadge stage={booking.status} />}
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-6 px-4 py-8">

        {/* ── Hero card ──────────────────────────────────────────────────────── */}
        <div style={{
          background: "linear-gradient(135deg,#6366f1 0%,#8b5cf6 50%,#a855f7 100%)",
          borderRadius: "24px", padding: "2rem",
        }}>
          <p className="mb-1 text-xs font-bold uppercase tracking-[0.18em] text-white/60">Your Journey</p>
          <h1 className="text-2xl font-black text-white">{booking?.tourName || "Your Tour"}</h1>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { label: "Start Date",   value: fmtDate(booking?.startDate) },
              { label: "End Date",     value: fmtDate(booking?.endDate) },
              { label: "Group Size",   value: `${booking?.partySize || 1} traveller${booking?.partySize !== 1 ? "s" : ""}` },
              { label: "Total",        value: fmtCurrency(booking?.totalPrice, booking?.currency) },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-2xl bg-white/10 p-3 backdrop-blur-sm">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-white/60">{label}</p>
                <p className="mt-1 text-sm font-bold text-white">{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Booking Reference ──────────────────────────────────────────────── */}
        <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: "20px", border: "1px solid rgba(255,255,255,0.08)" }}
          className="p-6">
          <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-400">Booking Information</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[
              { label: "Booking Reference", value: booking?.reference },
              { label: "Traveller Name",    value: booking?.travelerName },
              { label: "Booking Date",      value: fmtDate(booking?.bookedAt) },
              { label: "Status",            value: <StatusBadge stage={booking?.status} /> },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">{label}</p>
                <p className="mt-1 text-sm font-semibold text-white">{value}</p>
              </div>
            ))}
          </div>
          {booking?.notes && (
            <div className="mt-4 rounded-xl bg-white/5 p-3">
              <p className="text-xs text-slate-400">{booking.notes}</p>
            </div>
          )}
        </div>

        {/* ── Payment Status ─────────────────────────────────────────────────── */}
        <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: "20px", border: "1px solid rgba(255,255,255,0.08)" }}
          className="p-6">
          <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-400">Payment</h2>
          {payment ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {[
                { label: "Amount Paid", value: fmtCurrency(payment.amountPaid, payment.currency) },
                { label: "Method",      value: payment.method || "—" },
                { label: "Paid On",     value: fmtDate(payment.paidAt) },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">{label}</p>
                  <p className="mt-1 text-sm font-semibold text-white">{value}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400">Payment details will appear here once your payment is confirmed.</p>
          )}
        </div>

        {/* ── Itinerary Timeline ─────────────────────────────────────────────── */}
        {itinerary && itinerary.length > 0 && (
          <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: "20px", border: "1px solid rgba(255,255,255,0.08)" }}
            className="p-6">
            <h2 className="mb-5 text-xs font-bold uppercase tracking-widest text-slate-400">Your Itinerary</h2>
            <div className="relative space-y-4 pl-6 before:absolute before:left-[11px] before:top-2 before:h-full before:w-[2px] before:rounded-full before:bg-white/10">
              {itinerary.map((item, i) => (
                <div key={i} className="relative flex gap-4">
                  <div className="absolute -left-6 flex h-6 w-6 items-center justify-center rounded-full bg-indigo-500 text-xs shadow-lg shadow-indigo-500/30">
                    {typeIcon[item.type] || "📌"}
                  </div>
                  <div className="flex-1 rounded-2xl bg-white/5 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wide text-indigo-400">
                          {(item.type || "").replace(/_/g, " ")}
                        </p>
                        <p className="mt-0.5 text-sm font-semibold text-white">{item.resourceName || "—"}</p>
                        {item.notes && <p className="mt-1 text-xs text-slate-400">{item.notes}</p>}
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-xs text-slate-500">{fmtDate(item.date)}</p>
                        {item.status && (
                          <span className="mt-1 inline-block rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-medium text-slate-300">
                            {item.status}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Help footer ────────────────────────────────────────────────────── */}
        <div className="pb-6 text-center">
          <p className="text-xs text-slate-600">
            Questions about your trip? Contact your tour operator directly.
          </p>
          <p className="mt-1 text-[10px] text-slate-700">
            This link is valid for 72 hours from when it was issued.
          </p>
        </div>

      </main>
    </div>
  );
};

export default TravelerPortal;
