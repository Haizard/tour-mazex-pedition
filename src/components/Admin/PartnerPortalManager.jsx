import { useEffect, useState } from "react";

import Badge from "../UI/Badge";
import Button from "../UI/Button";
import Card from "../UI/Card";
import {
  createPartnerAccount,
  deletePartnerAccount,
  fetchPartnerAccounts,
  updatePartnerAccount,
} from "../../services/api";

const initialForm = {
  partnerType: "hotel",
  companyName: "",
  contactName: "",
  email: "",
  phone: "",
  location: "",
  serviceFocus: "",
  contractLabel: "",
  payoutTerms: "",
  status: "pending",
  notes: "",
};

const statusTone = {
  pending: "bg-amber-50 text-amber-700",
  active: "bg-emerald-50 text-emerald-700",
  inactive: "bg-slate-100 text-slate-600",
};

const PartnerPortalManager = () => {
  const [partners, setPartners] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetchPartnerAccounts({ source: "postgres" });
      setPartners(Array.isArray(response.data) ? response.data : []);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to load partner portal right now.");
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

    try {
      if (editingId) {
        await updatePartnerAccount(editingId, form);
      } else {
        await createPartnerAccount(form);
      }

      resetForm();
      await loadData();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to save this partner account.");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (partner) => {
    setEditingId(partner._id);
    setForm({
      partnerType: partner.partnerType || "hotel",
      companyName: partner.companyName || "",
      contactName: partner.contactName || "",
      email: partner.email || "",
      phone: partner.phone || "",
      location: partner.location || "",
      serviceFocus: partner.serviceFocus || "",
      contractLabel: partner.contractLabel || "",
      payoutTerms: partner.payoutTerms || "",
      status: partner.status || "pending",
      notes: partner.notes || "",
    });
  };

  const handleDelete = async (partnerId) => {
    setSaving(true);
    setError("");
    try {
      await deletePartnerAccount(partnerId);
      if (editingId === partnerId) {
        resetForm();
      }
      await loadData();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to delete this partner account.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="mb-2 text-[10px] font-black uppercase tracking-[0.3em] text-primary">
            Enterprise Desk
          </p>
          <h2 className="text-3xl font-black uppercase tracking-tighter text-gray-900">
            Partner Portal
          </h2>
          <p className="mt-2 max-w-3xl text-sm font-medium text-slate-500">
            Manage hotels, agencies, and supplier relationships in one tenant-owned partner workspace.
          </p>
        </div>
        <Badge variant="accent">{partners.length} Partners</Badge>
      </div>

      {error && (
        <div className="rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="border-none p-8 shadow-xl">
          <h3 className="mb-6 text-xl font-black uppercase tracking-tight text-slate-900">
            {editingId ? "Edit Partner" : "Add Partner"}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <select
                value={form.partnerType}
                onChange={(event) => setForm((current) => ({ ...current, partnerType: event.target.value }))}
                className="w-full rounded-2xl border-none bg-slate-50 px-4 py-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-primary"
              >
                <option value="hotel">Hotel</option>
                <option value="agency">Agency</option>
                <option value="supplier">Supplier</option>
              </select>
              <select
                value={form.status}
                onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}
                className="w-full rounded-2xl border-none bg-slate-50 px-4 py-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-primary"
              >
                <option value="pending">Pending</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <input
              type="text"
              value={form.companyName}
              onChange={(event) => setForm((current) => ({ ...current, companyName: event.target.value }))}
              placeholder="Company name"
              className="w-full rounded-2xl border-none bg-slate-50 px-4 py-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-primary"
            />
            <div className="grid gap-4 md:grid-cols-2">
              <input
                type="text"
                value={form.contactName}
                onChange={(event) => setForm((current) => ({ ...current, contactName: event.target.value }))}
                placeholder="Contact name"
                className="w-full rounded-2xl border-none bg-slate-50 px-4 py-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-primary"
              />
              <input
                type="text"
                value={form.location}
                onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))}
                placeholder="Location"
                className="w-full rounded-2xl border-none bg-slate-50 px-4 py-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <input
                type="email"
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                placeholder="Email"
                className="w-full rounded-2xl border-none bg-slate-50 px-4 py-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-primary"
              />
              <input
                type="text"
                value={form.phone}
                onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                placeholder="Phone"
                className="w-full rounded-2xl border-none bg-slate-50 px-4 py-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-primary"
              />
            </div>
            <input
              type="text"
              value={form.serviceFocus}
              onChange={(event) => setForm((current) => ({ ...current, serviceFocus: event.target.value }))}
              placeholder="Service focus"
              className="w-full rounded-2xl border-none bg-slate-50 px-4 py-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-primary"
            />
            <div className="grid gap-4 md:grid-cols-2">
              <input
                type="text"
                value={form.contractLabel}
                onChange={(event) => setForm((current) => ({ ...current, contractLabel: event.target.value }))}
                placeholder="Contract label"
                className="w-full rounded-2xl border-none bg-slate-50 px-4 py-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-primary"
              />
              <input
                type="text"
                value={form.payoutTerms}
                onChange={(event) => setForm((current) => ({ ...current, payoutTerms: event.target.value }))}
                placeholder="Payout terms"
                className="w-full rounded-2xl border-none bg-slate-50 px-4 py-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-primary"
              />
            </div>
            <textarea
              rows={4}
              value={form.notes}
              onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
              placeholder="Notes, relationship details, commercial context..."
              className="w-full rounded-2xl border-none bg-slate-50 px-4 py-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-primary"
            />

            <div className="flex gap-3">
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : editingId ? "Update Partner" : "Create Partner"}
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
            Partner Accounts
          </h3>

          <div className="space-y-4">
            {loading && (
              <p className="text-sm font-medium text-slate-500">Loading partner accounts...</p>
            )}

            {!loading && partners.length === 0 && (
              <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-sm font-medium text-slate-500">
                No partner accounts added yet.
              </div>
            )}

            {!loading &&
              partners.map((partner) => (
                <div
                  key={partner._id}
                  className="rounded-[28px] border border-slate-200 bg-white px-5 py-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-xs font-black uppercase tracking-wide text-slate-900">
                          {partner.companyName}
                        </p>
                        <span
                          className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${
                            statusTone[partner.status] || statusTone.pending
                          }`}
                        >
                          {partner.status}
                        </span>
                        <Badge variant="secondary">{partner.partnerType}</Badge>
                      </div>
                      <p className="text-sm font-medium leading-6 text-slate-600">
                        {partner.partnerSummary?.summary || "No partner summary available."}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {partner.location && <Badge variant="secondary">{partner.location}</Badge>}
                        {partner.serviceFocus && <Badge variant="secondary">{partner.serviceFocus}</Badge>}
                        {partner.contractLabel && <Badge variant="secondary">{partner.contractLabel}</Badge>}
                        {partner.payoutTerms && <Badge variant="secondary">{partner.payoutTerms}</Badge>}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={() => handleEdit(partner)}
                        className="rounded-2xl border border-slate-200 px-4 py-2 text-[11px] font-black uppercase tracking-widest text-slate-700"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(partner._id)}
                        className="rounded-2xl border border-red-200 px-4 py-2 text-[11px] font-black uppercase tracking-widest text-red-600"
                      >
                        Delete
                      </button>
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

export default PartnerPortalManager;
