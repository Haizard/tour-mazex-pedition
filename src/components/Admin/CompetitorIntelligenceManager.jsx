import { useEffect, useMemo, useState } from "react";

import Badge from "../UI/Badge";
import Button from "../UI/Button";
import Card from "../UI/Card";
import {
  createCompetitorInsight,
  deleteCompetitorInsight,
  fetchCompetitorInsights,
  updateCompetitorInsight,
} from "../../services/api";

const initialForm = {
  competitorName: "",
  marketRegion: "",
  focusRoute: "",
  observedPriceUsd: "",
  currency: "USD",
  marketTrend: "",
  offerSummary: "",
  sourceLabel: "",
  intelligenceDate: "",
  strengthSignals: "",
  riskSignals: "",
  status: "watchlist",
  notes: "",
};

const statusTone = {
  watchlist: "bg-amber-50 text-amber-700",
  active: "bg-emerald-50 text-emerald-700",
  archived: "bg-slate-100 text-slate-600",
};

const CompetitorIntelligenceManager = () => {
  const [insights, setInsights] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetchCompetitorInsights();
      setInsights(Array.isArray(response.data) ? response.data : []);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to load competitor intelligence right now.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const activeCount = useMemo(
    () => insights.filter((item) => item.status === "active").length,
    [insights]
  );

  const averageObservedPrice = useMemo(() => {
    const priced = insights.filter((item) => Number(item.observedPriceUsd) > 0);
    if (priced.length === 0) {
      return null;
    }

    const total = priced.reduce((sum, item) => sum + Number(item.observedPriceUsd || 0), 0);
    return Math.round(total / priced.length);
  }, [insights]);

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");

    const payload = {
      ...form,
      observedPriceUsd: form.observedPriceUsd ? Number(form.observedPriceUsd) : null,
      intelligenceDate: form.intelligenceDate || null,
      strengthSignals: form.strengthSignals.split(",").map((item) => item.trim()).filter(Boolean),
      riskSignals: form.riskSignals.split(",").map((item) => item.trim()).filter(Boolean),
    };

    try {
      if (editingId) {
        await updateCompetitorInsight(editingId, payload);
      } else {
        await createCompetitorInsight(payload);
      }

      resetForm();
      await loadData();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to save this competitor insight.");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (insight) => {
    setEditingId(insight._id);
    setForm({
      competitorName: insight.competitorName || "",
      marketRegion: insight.marketRegion || "",
      focusRoute: insight.focusRoute || "",
      observedPriceUsd: insight.observedPriceUsd ? String(insight.observedPriceUsd) : "",
      currency: insight.currency || "USD",
      marketTrend: insight.marketTrend || "",
      offerSummary: insight.offerSummary || "",
      sourceLabel: insight.sourceLabel || "",
      intelligenceDate: insight.intelligenceDate
        ? new Date(insight.intelligenceDate).toISOString().slice(0, 10)
        : "",
      strengthSignals: (insight.strengthSignals || []).join(", "),
      riskSignals: (insight.riskSignals || []).join(", "),
      status: insight.status || "watchlist",
      notes: insight.notes || "",
    });
  };

  const handleDelete = async (id) => {
    setSaving(true);
    setError("");
    try {
      await deleteCompetitorInsight(id);
      if (editingId === id) {
        resetForm();
      }
      await loadData();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to delete this competitor insight.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="mb-2 text-[10px] font-black uppercase tracking-[0.3em] text-primary">
            Intelligence Desk
          </p>
          <h2 className="text-3xl font-black uppercase tracking-tighter text-gray-900">
            Competitor Intelligence
          </h2>
          <p className="mt-2 max-w-3xl text-sm font-medium text-slate-500">
            Track competitor pricing, route focus, market trends, strengths, and risks for enterprise strategy planning.
          </p>
        </div>
        <div className="flex gap-3">
          <Badge variant="accent">{insights.length} Competitors</Badge>
          <Badge variant="secondary">{activeCount} Active</Badge>
          {averageObservedPrice ? <Badge variant="secondary">Avg USD {averageObservedPrice}</Badge> : null}
        </div>
      </div>

      {error && (
        <div className="rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="border-none p-8 shadow-xl">
          <h3 className="mb-6 text-xl font-black uppercase tracking-tight text-slate-900">
            {editingId ? "Edit Intelligence Entry" : "Create Intelligence Entry"}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <input type="text" value={form.competitorName} onChange={(event) => setForm((current) => ({ ...current, competitorName: event.target.value }))} placeholder="Competitor name" className="w-full rounded-2xl border-none bg-slate-50 px-4 py-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-primary" required />
              <input type="text" value={form.marketRegion} onChange={(event) => setForm((current) => ({ ...current, marketRegion: event.target.value }))} placeholder="Market region" className="w-full rounded-2xl border-none bg-slate-50 px-4 py-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-primary" />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <input type="text" value={form.focusRoute} onChange={(event) => setForm((current) => ({ ...current, focusRoute: event.target.value }))} placeholder="Focus route or product" className="w-full rounded-2xl border-none bg-slate-50 px-4 py-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-primary" />
              <input type="text" value={form.marketTrend} onChange={(event) => setForm((current) => ({ ...current, marketTrend: event.target.value }))} placeholder="Market trend" className="w-full rounded-2xl border-none bg-slate-50 px-4 py-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-primary" />
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <input type="number" min="0" value={form.observedPriceUsd} onChange={(event) => setForm((current) => ({ ...current, observedPriceUsd: event.target.value }))} placeholder="Observed price" className="w-full rounded-2xl border-none bg-slate-50 px-4 py-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-primary" />
              <input type="text" value={form.currency} onChange={(event) => setForm((current) => ({ ...current, currency: event.target.value.toUpperCase() }))} placeholder="Currency" className="w-full rounded-2xl border-none bg-slate-50 px-4 py-4 text-sm font-bold uppercase text-slate-900 focus:ring-2 focus:ring-primary" />
              <input type="date" value={form.intelligenceDate} onChange={(event) => setForm((current) => ({ ...current, intelligenceDate: event.target.value }))} className="w-full rounded-2xl border-none bg-slate-50 px-4 py-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-primary" />
            </div>
            <input type="text" value={form.sourceLabel} onChange={(event) => setForm((current) => ({ ...current, sourceLabel: event.target.value }))} placeholder="Source label" className="w-full rounded-2xl border-none bg-slate-50 px-4 py-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-primary" />
            <textarea rows={3} value={form.offerSummary} onChange={(event) => setForm((current) => ({ ...current, offerSummary: event.target.value }))} placeholder="Offer summary..." className="w-full rounded-2xl border-none bg-slate-50 px-4 py-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-primary" />
            <input type="text" value={form.strengthSignals} onChange={(event) => setForm((current) => ({ ...current, strengthSignals: event.target.value }))} placeholder="Strength signals (comma separated)" className="w-full rounded-2xl border-none bg-slate-50 px-4 py-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-primary" />
            <input type="text" value={form.riskSignals} onChange={(event) => setForm((current) => ({ ...current, riskSignals: event.target.value }))} placeholder="Risk signals (comma separated)" className="w-full rounded-2xl border-none bg-slate-50 px-4 py-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-primary" />
            <select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))} className="w-full rounded-2xl border-none bg-slate-50 px-4 py-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-primary">
              <option value="watchlist">Watchlist</option>
              <option value="active">Active</option>
              <option value="archived">Archived</option>
            </select>
            <textarea rows={4} value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} placeholder="Strategic notes..." className="w-full rounded-2xl border-none bg-slate-50 px-4 py-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-primary" />
            <div className="flex gap-3">
              <Button type="submit" disabled={saving}>{saving ? "Saving..." : editingId ? "Update Insight" : "Create Insight"}</Button>
              {editingId && <Button type="button" variant="secondary" onClick={resetForm} disabled={saving}>Cancel Edit</Button>}
            </div>
          </form>
        </Card>

        <Card className="border-none p-8 shadow-xl">
          <h3 className="mb-6 text-xl font-black uppercase tracking-tight text-slate-900">
            Competitor Watchlist
          </h3>
          <div className="space-y-4">
            {loading && <p className="text-sm font-medium text-slate-500">Loading competitor insights...</p>}
            {!loading && insights.length === 0 && (
              <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-sm font-medium text-slate-500">
                No competitor intelligence entries created yet.
              </div>
            )}
            {!loading && insights.map((insight) => (
              <div key={insight._id} className="rounded-[28px] border border-slate-200 bg-white px-5 py-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-xs font-black uppercase tracking-wide text-slate-900">{insight.competitorName}</p>
                      <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${statusTone[insight.status] || statusTone.watchlist}`}>{insight.status}</span>
                      {insight.marketRegion && <Badge variant="secondary">{insight.marketRegion}</Badge>}
                    </div>
                    <p className="text-sm font-medium leading-6 text-slate-600">
                      {insight.intelligenceSummary?.summary || "No competitor summary available."}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {insight.focusRoute && <Badge variant="secondary">{insight.focusRoute}</Badge>}
                      {insight.observedPriceUsd ? <Badge variant="secondary">{insight.currency || "USD"} {insight.observedPriceUsd}</Badge> : null}
                      {insight.sourceLabel && <Badge variant="secondary">{insight.sourceLabel}</Badge>}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button type="button" onClick={() => handleEdit(insight)} className="rounded-2xl border border-slate-200 px-4 py-2 text-[11px] font-black uppercase tracking-widest text-slate-700">Edit</button>
                    <button type="button" onClick={() => handleDelete(insight._id)} className="rounded-2xl border border-red-200 px-4 py-2 text-[11px] font-black uppercase tracking-widest text-red-600">Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default CompetitorIntelligenceManager;
