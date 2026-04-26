import { useEffect, useState } from "react";

import Badge from "../UI/Badge";
import Button from "../UI/Button";
import Card from "../UI/Card";
import {
  createDynamicPricingRule,
  deleteDynamicPricingRule,
  fetchDynamicPricingDashboard,
  fetchDynamicPricingRules,
  updateDynamicPricingRule,
} from "../../services/api";

const initialForm = {
  ruleName: "",
  routeLabel: "",
  basePrice: "",
  seasonMultiplier: "1",
  demandMultiplier: "1",
  occupancyMultiplier: "1",
  minimumPrice: "",
  status: "draft",
  notes: "",
};

const statusTone = {
  draft: "bg-amber-50 text-amber-700",
  active: "bg-emerald-50 text-emerald-700",
  paused: "bg-slate-100 text-slate-600",
};

const DynamicPricingManager = () => {
  const [rules, setRules] = useState([]);
  const [impactBoard, setImpactBoard] = useState([]);
  const [stats, setStats] = useState({ totalRules: 0, activeRules: 0, impactedTours: 0 });
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [response, dashboardResponse] = await Promise.all([
        fetchDynamicPricingRules(),
        fetchDynamicPricingDashboard(),
      ]);
      setRules(Array.isArray(response.data) ? response.data : []);
      setImpactBoard(Array.isArray(dashboardResponse.data?.impactBoard) ? dashboardResponse.data.impactBoard : []);
      setStats(dashboardResponse.data?.stats || { totalRules: 0, activeRules: 0, impactedTours: 0 });
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to load dynamic pricing rules right now.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

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
      basePrice: Number(form.basePrice || 0),
      seasonMultiplier: Number(form.seasonMultiplier || 1),
      demandMultiplier: Number(form.demandMultiplier || 1),
      occupancyMultiplier: Number(form.occupancyMultiplier || 1),
      minimumPrice: Number(form.minimumPrice || 0),
    };

    try {
      if (editingId) {
        await updateDynamicPricingRule(editingId, payload);
      } else {
        await createDynamicPricingRule(payload);
      }

      resetForm();
      await loadData();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to save this dynamic pricing rule.");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (rule) => {
    setEditingId(rule._id);
    setForm({
      ruleName: rule.ruleName || "",
      routeLabel: rule.routeLabel || "",
      basePrice: String(rule.basePrice || ""),
      seasonMultiplier: String(rule.seasonMultiplier || 1),
      demandMultiplier: String(rule.demandMultiplier || 1),
      occupancyMultiplier: String(rule.occupancyMultiplier || 1),
      minimumPrice: String(rule.minimumPrice || ""),
      status: rule.status || "draft",
      notes: rule.notes || "",
    });
  };

  const handleDelete = async (ruleId) => {
    setSaving(true);
    setError("");
    try {
      await deleteDynamicPricingRule(ruleId);
      if (editingId === ruleId) {
        resetForm();
      }
      await loadData();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to delete this dynamic pricing rule.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="mb-2 text-[10px] font-black uppercase tracking-[0.3em] text-primary">
            Revenue Desk
          </p>
          <h2 className="text-3xl font-black uppercase tracking-tighter text-gray-900">
            Dynamic Pricing Engine
          </h2>
          <p className="mt-2 max-w-3xl text-sm font-medium text-slate-500">
            Create enterprise pricing rules using season, demand, and occupancy multipliers with previewed final pricing.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Badge variant="accent">{stats.totalRules} Pricing Rules</Badge>
          <Badge variant="secondary">{stats.activeRules} Active</Badge>
          <Badge variant="secondary">{stats.impactedTours} Tour Matches</Badge>
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
            {editingId ? "Edit Rule" : "Create Rule"}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <input
                type="text"
                value={form.ruleName}
                onChange={(event) => setForm((current) => ({ ...current, ruleName: event.target.value }))}
                placeholder="Rule name"
                className="w-full rounded-2xl border-none bg-slate-50 px-4 py-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-primary"
              />
              <input
                type="text"
                value={form.routeLabel}
                onChange={(event) => setForm((current) => ({ ...current, routeLabel: event.target.value }))}
                placeholder="Route or package label"
                className="w-full rounded-2xl border-none bg-slate-50 px-4 py-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <input
                type="number"
                min="0"
                value={form.basePrice}
                onChange={(event) => setForm((current) => ({ ...current, basePrice: event.target.value }))}
                placeholder="Base price"
                className="w-full rounded-2xl border-none bg-slate-50 px-4 py-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-primary"
              />
              <input
                type="number"
                min="0"
                value={form.minimumPrice}
                onChange={(event) => setForm((current) => ({ ...current, minimumPrice: event.target.value }))}
                placeholder="Minimum price"
                className="w-full rounded-2xl border-none bg-slate-50 px-4 py-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <input
                type="number"
                step="0.01"
                value={form.seasonMultiplier}
                onChange={(event) => setForm((current) => ({ ...current, seasonMultiplier: event.target.value }))}
                placeholder="Season"
                className="w-full rounded-2xl border-none bg-slate-50 px-4 py-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-primary"
              />
              <input
                type="number"
                step="0.01"
                value={form.demandMultiplier}
                onChange={(event) => setForm((current) => ({ ...current, demandMultiplier: event.target.value }))}
                placeholder="Demand"
                className="w-full rounded-2xl border-none bg-slate-50 px-4 py-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-primary"
              />
              <input
                type="number"
                step="0.01"
                value={form.occupancyMultiplier}
                onChange={(event) => setForm((current) => ({ ...current, occupancyMultiplier: event.target.value }))}
                placeholder="Occupancy"
                className="w-full rounded-2xl border-none bg-slate-50 px-4 py-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-primary"
              />
            </div>
            <select
              value={form.status}
              onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}
              className="w-full rounded-2xl border-none bg-slate-50 px-4 py-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-primary"
            >
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
            </select>
            <textarea
              rows={4}
              value={form.notes}
              onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
              placeholder="Commercial notes, assumptions, season logic..."
              className="w-full rounded-2xl border-none bg-slate-50 px-4 py-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-primary"
            />

            <div className="flex gap-3">
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : editingId ? "Update Rule" : "Create Rule"}
              </Button>
              {editingId && (
                <Button type="button" variant="secondary" onClick={resetForm} disabled={saving}>
                  Cancel Edit
                </Button>
              )}
            </div>
          </form>
        </Card>

        <Card className="border-none p-8 shadow-xl">
          <h3 className="mb-6 text-xl font-black uppercase tracking-tight text-slate-900">
            Pricing Rules
          </h3>

          <div className="space-y-4">
            {loading && <p className="text-sm font-medium text-slate-500">Loading dynamic pricing rules...</p>}

            {!loading && rules.length === 0 && (
              <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-sm font-medium text-slate-500">
                No dynamic pricing rules created yet.
              </div>
            )}

            {!loading &&
              rules.map((rule) => (
                <div key={rule._id} className="rounded-[28px] border border-slate-200 bg-white px-5 py-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-xs font-black uppercase tracking-wide text-slate-900">
                          {rule.ruleName}
                        </p>
                        <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${statusTone[rule.status] || statusTone.draft}`}>
                          {rule.status}
                        </span>
                        {rule.routeLabel && <Badge variant="secondary">{rule.routeLabel}</Badge>}
                      </div>
                      <p className="text-sm font-medium leading-6 text-slate-600">
                        Preview final price: USD {rule.preview?.finalPrice ?? 0} with {rule.preview?.adjustmentPercent ?? 0}% adjustment.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary">Season {rule.seasonMultiplier}x</Badge>
                        <Badge variant="secondary">Demand {rule.demandMultiplier}x</Badge>
                        <Badge variant="secondary">Occupancy {rule.occupancyMultiplier}x</Badge>
                        {Number(rule.minimumPrice || 0) > 0 && (
                          <Badge variant="secondary">Floor USD {rule.minimumPrice}</Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <button type="button" onClick={() => handleEdit(rule)} className="rounded-2xl border border-slate-200 px-4 py-2 text-[11px] font-black uppercase tracking-widest text-slate-700">
                        Edit
                      </button>
                      <button type="button" onClick={() => handleDelete(rule._id)} className="rounded-2xl border border-red-200 px-4 py-2 text-[11px] font-black uppercase tracking-widest text-red-600">
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </Card>
      </div>

      <Card className="border-none p-8 shadow-xl">
        <h3 className="mb-6 text-xl font-black uppercase tracking-tight text-slate-900">
          Live Package Impact
        </h3>

        <div className="space-y-4">
          {impactBoard.length === 0 && (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-sm font-medium text-slate-500">
              No active pricing rules are matched to live tour packages yet.
            </div>
          )}

          {impactBoard.map((item) => (
            <div key={item.ruleId} className="rounded-[28px] border border-slate-200 bg-white px-5 py-5">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-black uppercase tracking-wide text-slate-900">
                    {item.ruleName}
                  </p>
                  <p className="text-sm font-medium text-slate-600">
                    Route match: {item.routeLabel || "All routes"}
                  </p>
                </div>
                <Badge variant={item.impactedTourCount > 0 ? "accent" : "secondary"}>
                  {item.impactedTourCount} Impacted Tour{item.impactedTourCount === 1 ? "" : "s"}
                </Badge>
              </div>

              <div className="mt-4 space-y-3">
                {item.matchedTours.length === 0 && (
                  <div className="rounded-2xl bg-slate-50 p-4 text-sm font-medium text-slate-500">
                    No published package currently matches this rule label.
                  </div>
                )}

                {item.matchedTours.map((tour) => (
                  <div key={tour.tourId} className="rounded-2xl bg-slate-50 p-4">
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-sm font-black uppercase tracking-wide text-slate-900">
                          {tour.title}
                        </p>
                        <p className="text-sm font-medium text-slate-500">{tour.location}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary">Base USD {tour.basePrice}</Badge>
                        <Badge variant="accent">Adjusted USD {tour.adjustedPrice}</Badge>
                        <Badge variant="secondary">{tour.adjustmentPercent}%</Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default DynamicPricingManager;
