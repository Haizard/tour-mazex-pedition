import { useEffect, useState } from "react";
import { FaChartBar, FaHandshake, FaLink, FaPercent, FaPlus, FaSave, FaTrash } from "react-icons/fa";
import {
  fetchTenantPartnerships,
  createTenantPartnership,
  updateTenantPartnership,
  deleteTenantPartnership,
  fetchAvailablePropertiesForPartnership,
} from "../../services/api";
import CommissionDashboard from "./CommissionDashboard";

const PartnerPropertyManager = () => {
  const [view, setView] = useState("partnerships");
  const [partnerships, setPartnerships] = useState([]);
  const [availableProperties, setAvailableProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  // Add partnership form
  const [showAddForm, setShowAddForm] = useState(false);
  const [propertyType, setPropertyType] = useState("restaurant");
  const [propertySearch, setPropertySearch] = useState("");
  const [selectedPropertyId, setSelectedPropertyId] = useState("");
  const [commissionPercent, setCommissionPercent] = useState("7");
  const [dealNotes, setDealNotes] = useState("");

  // Edit state
  const [editingId, setEditingId] = useState("");
  const [editCommission, setEditCommission] = useState("");
  const [editDealNotes, setEditDealNotes] = useState("");

  const loadPartnerships = async () => {
    try {
      const response = await fetchTenantPartnerships();
      setPartnerships(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      setMessage(error?.response?.data?.message || "Unable to load partnerships.");
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableProperties = async () => {
    try {
      const response = await fetchAvailablePropertiesForPartnership(propertyType, propertySearch);
      setAvailableProperties(
        Array.isArray(response.data?.properties) ? response.data.properties : []
      );
    } catch (error) {
      setAvailableProperties([]);
    }
  };

  useEffect(() => {
    loadPartnerships();
  }, []);

  useEffect(() => {
    if (showAddForm) {
      loadAvailableProperties();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showAddForm, propertyType, propertySearch]);

  const resetAddForm = () => {
    setShowAddForm(false);
    setPropertyType("restaurant");
    setPropertySearch("");
    setSelectedPropertyId("");
    setCommissionPercent("7");
    setDealNotes("");
  };

  const handleCreatePartnership = async (event) => {
    event.preventDefault();
    if (!selectedPropertyId) {
      setMessage("Please select a property to partner with.");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      await createTenantPartnership({
        propertyId: selectedPropertyId,
        propertyType,
        commissionPercent: Number(commissionPercent),
        dealNotes,
      });
      resetAddForm();
      await loadPartnerships();
      setMessage("Partnership created! This property will now appear on your site.");
    } catch (error) {
      setMessage(error?.response?.data?.message || "Unable to create partnership.");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (partnership) => {
    setEditingId(partnership.id);
    setEditCommission(String(partnership.commissionPercent));
    setEditDealNotes(partnership.dealNotes || "");
  };

  const cancelEdit = () => {
    setEditingId("");
    setEditCommission("");
    setEditDealNotes("");
  };

  const saveEdit = async (partnershipId) => {
    setSaving(true);
    setMessage("");

    try {
      await updateTenantPartnership(partnershipId, {
        commissionPercent: Number(editCommission),
        dealNotes: editDealNotes,
      });
      cancelEdit();
      await loadPartnerships();
      setMessage("Partnership updated.");
    } catch (error) {
      setMessage(error?.response?.data?.message || "Unable to update partnership.");
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (partnership) => {
    setSaving(true);
    try {
      await updateTenantPartnership(partnership.id, {
        status: partnership.status === "active" ? "suspended" : "active",
      });
      await loadPartnerships();
      setMessage(
        partnership.status === "active"
          ? "Partnership suspended. Property hidden from your site."
          : "Partnership reactivated."
      );
    } catch (error) {
      setMessage(error?.response?.data?.message || "Unable to update status.");
    } finally {
      setSaving(false);
    }
  };

  const removePartnership = async (partnershipId) => {
    if (!window.confirm("Remove this partnership? The property will no longer appear on your site."))
      return;

    try {
      await deleteTenantPartnership(partnershipId);
      await loadPartnerships();
      setMessage("Partnership removed.");
    } catch (error) {
      setMessage(error?.response?.data?.message || "Unable to remove partnership.");
    }
  };

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-zinc-500">
              Commission Partnerships
            </p>
            <h2 className="mt-2 flex items-center gap-3 text-2xl font-black tracking-tight text-zinc-950">
              <FaHandshake className="text-emerald-600" /> Partner Properties
            </h2>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setView("partnerships")}
              className={`rounded-xl px-4 py-2.5 text-xs font-black uppercase tracking-[0.12em] transition ${
                view === "partnerships"
                  ? "bg-zinc-950 text-white shadow-sm"
                  : "border border-zinc-200 text-zinc-600 hover:border-zinc-300"
              }`}
            >
              <FaHandshake className="mr-1.5 inline" /> Partnerships
            </button>
            <button
              type="button"
              onClick={() => setView("commission")}
              className={`rounded-xl px-4 py-2.5 text-xs font-black uppercase tracking-[0.12em] transition ${
                view === "commission"
                  ? "bg-zinc-950 text-white shadow-sm"
                  : "border border-zinc-200 text-zinc-600 hover:border-zinc-300"
              }`}
            >
              <FaChartBar className="mr-1.5 inline" /> Commission Report
            </button>
          </div>
        </div>
        <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-zinc-600">
          Partner with hotels and restaurants to feature their properties on your website.
          Set a commission percentage for bookings that come through your site.
        </p>
      </div>

      {view === "commission" && <CommissionDashboard />}

      {view !== "commission" && (
        <>

      {message ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-800">
          {message}
        </div>
      ) : null}

      {/* Current Partnerships */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-lg font-black text-zinc-950">Current Partnerships</h3>
          <button
            type="button"
            onClick={() => setShowAddForm(!showAddForm)}
            className="inline-flex items-center gap-2 rounded-xl bg-zinc-950 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-white"
          >
            <FaPlus /> Add partnership
          </button>
        </div>

        {loading ? (
          <div className="mt-4 rounded-2xl bg-zinc-50 p-10 text-center text-sm font-bold text-zinc-500">
            Loading partnerships...
          </div>
        ) : partnerships.length === 0 ? (
          <div className="mt-4 rounded-2xl bg-zinc-50 p-10 text-center text-sm font-bold text-zinc-500">
            No partnerships yet. Partner with hotels and restaurants to feature them on your site.
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            {partnerships.map((p) => (
              <div
                key={p.id}
                className={`rounded-2xl border p-4 ${
                  p.status === "active"
                    ? "border-emerald-200 bg-emerald-50/30"
                    : "border-zinc-200 bg-zinc-50/50"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-lg font-black tracking-tight text-zinc-950">
                      {p.propertyName || "Unnamed property"}
                    </p>
                    <p className="mt-1 text-sm font-medium uppercase tracking-[0.12em] text-zinc-500">
                      {p.propertyType === "restaurant" ? "🍽 Restaurant" : "🏨 Hotel"}
                    </p>
                    {editingId === p.id ? (
                      <div className="mt-3 flex flex-wrap gap-3">
                        <label className="block">
                          <span className="text-[10px] font-black uppercase text-zinc-500">
                            Commission %
                          </span>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={editCommission}
                            onChange={(e) => setEditCommission(e.target.value)}
                            className="mt-1 w-24 rounded-xl border border-zinc-200 px-3 py-2 text-sm font-bold outline-none focus:border-emerald-500"
                          />
                        </label>
                        <label className="block flex-1">
                          <span className="text-[10px] font-black uppercase text-zinc-500">
                            Deal notes
                          </span>
                          <input
                            value={editDealNotes}
                            onChange={(e) => setEditDealNotes(e.target.value)}
                            className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                          />
                        </label>
                        <div className="flex items-end gap-2">
                          <button
                            type="button"
                            onClick={() => saveEdit(p.id)}
                            disabled={saving}
                            className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-black uppercase text-white disabled:opacity-50"
                          >
                            <FaSave className="inline" /> Save
                          </button>
                          <button
                            type="button"
                            onClick={cancelEdit}
                            className="rounded-xl border border-zinc-200 px-3 py-2 text-xs font-black uppercase"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-2 flex flex-wrap items-center gap-4">
                        <span className="inline-flex items-center gap-1 rounded-full bg-zinc-950 px-3 py-1 text-xs font-black text-white">
                          <FaPercent /> {p.commissionPercent}%
                        </span>
                        {p.dealNotes ? (
                          <span className="text-sm font-medium text-zinc-600">
                            {p.dealNotes}
                          </span>
                        ) : null}
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${
                            p.status === "active"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-zinc-200 text-zinc-600"
                          }`}
                        >
                          {p.status === "active" ? "● Active" : "○ Suspended"}
                        </span>
                      </div>
                    )}
                  </div>
                  {editingId !== p.id ? (
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(p)}
                        className="rounded-xl border border-zinc-200 px-3 py-2 text-xs font-black uppercase"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleStatus(p)}
                        disabled={saving}
                        className="rounded-xl border border-amber-200 px-3 py-2 text-xs font-black uppercase text-amber-700 disabled:opacity-50"
                      >
                        {p.status === "active" ? "Suspend" : "Reactivate"}
                      </button>
                      <button
                        type="button"
                        onClick={() => removePartnership(p.id)}
                        className="rounded-xl border border-red-200 px-3 py-2 text-xs font-black uppercase text-red-600"
                      >
                        <FaTrash className="inline" /> Remove
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Partnership Form */}
      {showAddForm ? (
        <form
          onSubmit={handleCreatePartnership}
          className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"
        >
          <h3 className="text-lg font-black text-zinc-950">
            <FaLink className="inline" /> New Partnership
          </h3>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setPropertyType("restaurant")}
              className={`rounded-xl px-4 py-3 text-sm font-black uppercase ${
                propertyType === "restaurant"
                  ? "bg-emerald-600 text-white"
                  : "border border-zinc-200 text-zinc-600"
              }`}
            >
              🍽 Restaurants
            </button>
            <button
              type="button"
              onClick={() => setPropertyType("hotel")}
              className={`rounded-xl px-4 py-3 text-sm font-black uppercase ${
                propertyType === "hotel"
                  ? "bg-emerald-600 text-white"
                  : "border border-zinc-200 text-zinc-600"
              }`}
            >
              🏨 Hotels
            </button>
          </div>

          <label className="block">
            <span className="mb-1 block text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">
              Search {propertyType === "restaurant" ? "restaurants" : "hotels"}
            </span>
            <input
              value={propertySearch}
              onChange={(e) => setPropertySearch(e.target.value)}
              placeholder={`Type to search ${propertyType === "restaurant" ? "restaurants" : "hotels"}...`}
              className="w-full rounded-xl border border-zinc-200 px-3 py-3 text-sm font-medium outline-none focus:border-emerald-500"
            />
          </label>

          {availableProperties.length > 0 ? (
            <div className="max-h-60 space-y-2 overflow-y-auto rounded-2xl border border-zinc-100 p-2">
              {availableProperties.map((prop) => (
                <button
                  key={prop._id}
                  type="button"
                  onClick={() => setSelectedPropertyId(prop._id)}
                  className={`w-full rounded-xl p-3 text-left text-sm transition ${
                    selectedPropertyId === prop._id
                      ? "bg-emerald-100 border border-emerald-300"
                      : "bg-zinc-50 border border-transparent hover:border-zinc-200"
                  }`}
                >
                  <p className="font-black text-zinc-950">{prop.name}</p>
                  <p className="mt-1 text-xs font-medium text-zinc-500">
                    {prop.destination || "Destination pending"}
                    {prop.cuisineTypes?.length ? ` · ${prop.cuisineTypes.slice(0, 2).join(", ")}` : ""}
                    {prop.accommodationType ? ` · ${prop.accommodationType}` : ""}
                  </p>
                </button>
              ))}
            </div>
          ) : propertySearch ? (
            <p className="rounded-xl bg-zinc-50 p-4 text-sm font-semibold text-zinc-500">
              No matching {propertyType === "restaurant" ? "restaurants" : "hotels"} found.
            </p>
          ) : (
            <p className="rounded-xl bg-zinc-50 p-4 text-sm font-semibold text-zinc-500">
              Search above to find {propertyType === "restaurant" ? "restaurants" : "hotels"} to partner with.
            </p>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">
                Commission percentage (%)
              </span>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-zinc-400">
                  <FaPercent />
                </span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={commissionPercent}
                  onChange={(e) => setCommissionPercent(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 py-3 pl-8 pr-3 text-sm font-bold outline-none focus:border-emerald-500"
                  required
                />
              </div>
              <p className="mt-1 text-xs font-medium text-zinc-500">
                You earn this % on each booking from your site
              </p>
            </label>
            <label className="block">
              <span className="mb-1 block text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">
                Deal notes (optional)
              </span>
              <input
                value={dealNotes}
                onChange={(e) => setDealNotes(e.target.value)}
                placeholder="e.g. 7% commission on all direct bookings"
                className="w-full rounded-xl border border-zinc-200 px-3 py-3 text-sm outline-none focus:border-emerald-500"
              />
            </label>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving || !selectedPropertyId}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-black uppercase tracking-[0.16em] text-white disabled:opacity-50"
            >
              <FaHandshake />
              {saving ? "Creating..." : "Create partnership"}
            </button>
            <button
              type="button"
              onClick={resetAddForm}
              className="rounded-xl border border-zinc-200 px-4 py-3 text-sm font-black uppercase"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : null}

      {/* How it works */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">
          How it works
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl bg-zinc-50 p-4">
            <p className="text-lg font-black text-emerald-700">1</p>
            <p className="mt-2 text-sm font-black text-zinc-950">Find a property</p>
            <p className="mt-1 text-sm font-medium text-zinc-600">
              Browse available restaurants and hotels and select ones you want to partner with.
            </p>
          </div>
          <div className="rounded-2xl bg-zinc-50 p-4">
            <p className="text-lg font-black text-emerald-700">2</p>
            <p className="mt-2 text-sm font-black text-zinc-950">Set your commission</p>
            <p className="mt-1 text-sm font-medium text-zinc-600">
              Agree on a commission percentage (e.g., 7%) for bookings that originate from your site.
            </p>
          </div>
          <div className="rounded-2xl bg-zinc-50 p-4">
            <p className="text-lg font-black text-emerald-700">3</p>
            <p className="mt-2 text-sm font-black text-zinc-950">Properties appear on your site</p>
            <p className="mt-1 text-sm font-medium text-zinc-600">
              Partnered properties automatically show on your website for travelers to discover and book.
            </p>
          </div>
        </div>
      </div>
        </>
      )}
    </section>
  );
};

export default PartnerPropertyManager;
