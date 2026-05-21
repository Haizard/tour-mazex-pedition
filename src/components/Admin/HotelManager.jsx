import { useEffect, useMemo, useState } from "react";
import { FaCheck, FaHotel, FaKey, FaPlus, FaSave, FaSearch, FaTimes, FaTrash } from "react-icons/fa";
import {
  createHotelPartnerAdmin,
  createHotel,
  deleteHotel,
  fetchHotels,
  reviewHotelPartnerProfileUpdate,
  updateHotel,
} from "../../services/api";
import {
  buildPartnerProfileReviewSummary,
  buildHotelPartnerAdminPayload,
  buildHotelPayload,
  createEmptyHotelDraft,
  createEmptyHotelPartnerAdminDraft,
  filterHotelRows,
  getHotelPartnerLoginPath,
  hasPendingPartnerUpdate,
} from "./hotelManagerState";

const HotelManager = () => {
  const [hotels, setHotels] = useState([]);
  const [draft, setDraft] = useState(createEmptyHotelDraft);
  const [editingId, setEditingId] = useState("");
  const [filters, setFilters] = useState({ search: "", status: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [partnerDraft, setPartnerDraft] = useState(createEmptyHotelPartnerAdminDraft);
  const [partnerMessage, setPartnerMessage] = useState("");
  const [savingPartner, setSavingPartner] = useState(false);
  const [reviewingPartnerUpdate, setReviewingPartnerUpdate] = useState("");

  const visibleHotels = useMemo(() => filterHotelRows(hotels, filters), [hotels, filters]);
  const partnerLoginPath = getHotelPartnerLoginPath(
    typeof window !== "undefined" ? window.location.pathname : ""
  );

  const loadHotels = async () => {
    setLoading(true);
    try {
      const response = await fetchHotels();
      setHotels(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      setMessage(error?.response?.data?.message || "Unable to load hotels.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHotels();
  }, []);

  const updateDraft = (key, value) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const startEdit = (hotel) => {
    setEditingId(hotel._id);
    setDraft({
      ...createEmptyHotelDraft(),
      ...hotel,
      amenitiesText: (hotel.amenities || []).join(", "),
      latitude: hotel.geo?.latitude ?? "",
      longitude: hotel.geo?.longitude ?? "",
    });
  };

  const resetForm = () => {
    setEditingId("");
    setDraft(createEmptyHotelDraft());
    setPartnerDraft(createEmptyHotelPartnerAdminDraft());
    setPartnerMessage("");
  };

  const saveHotel = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      const payload = buildHotelPayload(draft);
      if (editingId) {
        await updateHotel(editingId, payload);
      } else {
        await createHotel(payload);
      }
      resetForm();
      await loadHotels();
      setMessage("Hotel saved.");
    } catch (error) {
      setMessage(error?.response?.data?.message || "Unable to save hotel.");
    } finally {
      setSaving(false);
    }
  };

  const removeHotel = async (hotelId) => {
    if (!window.confirm("Delete this hotel listing?")) return;
    try {
      await deleteHotel(hotelId);
      await loadHotels();
      if (editingId === hotelId) resetForm();
    } catch (error) {
      setMessage(error?.response?.data?.message || "Unable to delete hotel.");
    }
  };

  const updatePartnerDraft = (key, value) => {
    setPartnerDraft((current) => ({ ...current, [key]: value }));
  };

  const createPartnerAdmin = async (event) => {
    event.preventDefault();

    if (!editingId) {
      setPartnerMessage("Save or select a hotel before creating partner access.");
      return;
    }

    setSavingPartner(true);
    setPartnerMessage("");

    try {
      const payload = buildHotelPartnerAdminPayload(partnerDraft);
      await createHotelPartnerAdmin(editingId, payload);
      setPartnerMessage(`Partner account created. Share ${partnerLoginPath} with the hotel admin.`);
      setPartnerDraft(createEmptyHotelPartnerAdminDraft());
    } catch (error) {
      setPartnerMessage(error?.response?.data?.message || "Unable to create hotel partner account.");
    } finally {
      setSavingPartner(false);
    }
  };

  const reviewPartnerProfileUpdate = async (hotelId, action) => {
    setReviewingPartnerUpdate(`${hotelId}:${action}`);
    setMessage("");

    try {
      await reviewHotelPartnerProfileUpdate(hotelId, { action });
      await loadHotels();
      setMessage(action === "reject" ? "Partner profile update rejected." : "Partner profile update approved.");
    } catch (error) {
      setMessage(error?.response?.data?.message || "Unable to review partner profile update.");
    } finally {
      setReviewingPartnerUpdate("");
    }
  };

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <p className="text-[11px] font-black uppercase tracking-[0.24em] text-zinc-500">
          Hospitality Marketplace
        </p>
        <h2 className="mt-2 flex items-center gap-3 text-2xl font-black tracking-tight text-zinc-950">
          <FaHotel className="text-primary" /> Hotels
        </h2>
        <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-zinc-600">
          Manage canonical hotel entities for public discovery, itinerary requests, and accommodation operations linkage.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
        <form onSubmit={saveHotel} className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black text-zinc-950">{editingId ? "Edit Hotel" : "New Hotel"}</h3>
            <button type="button" onClick={resetForm} className="rounded-xl border px-3 py-2 text-xs font-black uppercase">
              <FaPlus className="inline" /> New
            </button>
          </div>
          {[
            ["name", "Hotel name"],
            ["slug", "Slug"],
            ["destination", "Destination"],
            ["region", "Region"],
            ["accommodationType", "Accommodation type"],
            ["roomStyleSummary", "Room style summary"],
            ["amenitiesText", "Amenities, comma separated"],
          ].map(([key, label]) => (
            <label key={key} className="block">
              <span className="mb-1 block text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">{label}</span>
              <input
                value={draft[key] || ""}
                onChange={(event) => updateDraft(key, event.target.value)}
                className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm font-medium outline-none focus:border-primary"
              />
            </label>
          ))}
          <label className="block">
            <span className="mb-1 block text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">Summary</span>
            <textarea
              value={draft.summary || ""}
              onChange={(event) => updateDraft("summary", event.target.value)}
              rows={3}
              className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm font-medium outline-none focus:border-primary"
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex items-center gap-2 text-sm font-bold text-zinc-700">
              <input type="checkbox" checked={draft.published} onChange={(event) => updateDraft("published", event.target.checked)} />
              Published
            </label>
            <label className="flex items-center gap-2 text-sm font-bold text-zinc-700">
              <input type="checkbox" checked={draft.marketplaceVisible} onChange={(event) => updateDraft("marketplaceVisible", event.target.checked)} />
              Marketplace
            </label>
            <label className="flex items-center gap-2 text-sm font-bold text-zinc-700">
              <input type="checkbox" checked={draft.sponsoredPlacement} onChange={(event) => updateDraft("sponsoredPlacement", event.target.checked)} />
              Sponsored
            </label>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-950 px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-white disabled:bg-zinc-300"
          >
            <FaSave /> {saving ? "Saving..." : "Save Hotel"}
          </button>
          {message ? <p className="text-sm font-semibold text-zinc-600">{message}</p> : null}
        </form>

        <form onSubmit={createPartnerAdmin} className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
              Hotel partner onboarding
            </p>
            <h3 className="mt-2 flex items-center gap-2 text-lg font-black text-zinc-950">
              <FaKey className="text-primary" /> Create hotel admin access
            </h3>
            <p className="mt-2 text-xs font-semibold leading-5 text-zinc-500">
              Partner admins can edit assigned hotel profile details only. Publishing, marketplace visibility, and sponsored placement stay here with the tourism admin.
            </p>
          </div>
          <label className="block">
            <span className="mb-1 block text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">Hotel partner login</span>
            <input
              readOnly
              value={partnerLoginPath}
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm font-bold text-zinc-700"
            />
          </label>
          {[
            ["username", "Username"],
            ["password", "Temporary password"],
            ["displayName", "Display name"],
          ].map(([key, label]) => (
            <label key={key} className="block">
              <span className="mb-1 block text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">{label}</span>
              <input
                type={key === "password" ? "password" : "text"}
                value={partnerDraft[key] || ""}
                onChange={(event) => updatePartnerDraft(key, event.target.value)}
                className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm font-medium outline-none focus:border-primary"
                required={key !== "displayName"}
              />
            </label>
          ))}
          <label className="block">
            <span className="mb-1 block text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">Role</span>
            <select
              value={partnerDraft.role}
              onChange={(event) => updatePartnerDraft("role", event.target.value)}
              className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm font-bold outline-none focus:border-primary"
            >
              <option value="hotel-owner">Hotel owner</option>
              <option value="hotel-manager">Hotel manager</option>
            </select>
          </label>
          <button
            type="submit"
            disabled={savingPartner || !editingId}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-white disabled:bg-zinc-300"
          >
            <FaKey /> {savingPartner ? "Creating..." : "Create Partner Access"}
          </button>
          {partnerMessage ? <p className="text-sm font-semibold text-zinc-600">{partnerMessage}</p> : null}
        </form>

        <div className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center rounded-xl border border-zinc-200 px-3 py-2">
              <FaSearch className="mr-2 text-zinc-400" />
              <input
                value={filters.search}
                onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
                placeholder="Search hotels"
                className="bg-transparent text-sm font-medium outline-none"
              />
            </div>
            <select
              value={filters.status}
              onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
              className="rounded-xl border border-zinc-200 px-3 py-2 text-sm font-bold"
            >
              <option value="">All hotels</option>
              <option value="public">Public marketplace</option>
              <option value="draft">Drafts</option>
              <option value="sponsored">Sponsored</option>
            </select>
          </div>

          {loading ? (
            <p className="py-10 text-center text-sm font-bold text-zinc-500">Loading hotels...</p>
          ) : (
            <div className="grid gap-3">
              {visibleHotels.map((hotel) => {
                const pendingReview = buildPartnerProfileReviewSummary(hotel);
                const reviewPrefix = String(hotel._id);

                return (
                <div key={hotel._id} className="rounded-xl border border-zinc-200 p-4">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-lg font-black text-zinc-950">{hotel.name}</p>
                      <p className="text-sm font-medium text-zinc-600">{hotel.destination || "No destination"} · {hotel.accommodationType || "hotel"}</p>
                      <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-[0.14em]">
                        {hotel.published ? <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">Published</span> : <span className="rounded-full bg-zinc-100 px-3 py-1 text-zinc-500">Draft</span>}
                        {hotel.marketplaceVisible ? <span className="rounded-full bg-blue-50 px-3 py-1 text-blue-700">Marketplace</span> : null}
                        {hotel.sponsoredPlacement ? <span className="rounded-full bg-amber-50 px-3 py-1 text-amber-700">Sponsored</span> : null}
                        {hasPendingPartnerUpdate(hotel) ? <span className="rounded-full bg-orange-50 px-3 py-1 text-orange-700">Partner Review</span> : null}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => startEdit(hotel)} className="rounded-xl border px-3 py-2 text-xs font-black uppercase">
                        Edit
                      </button>
                      <button type="button" onClick={() => removeHotel(hotel._id)} className="rounded-xl border border-red-200 px-3 py-2 text-xs font-black uppercase text-red-600">
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                  {hasPendingPartnerUpdate(hotel) ? (
                    <div className="mt-4 rounded-xl border border-orange-200 bg-orange-50 p-4">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                          <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-700">
                            Partner profile edit pending
                          </p>
                          <p className="mt-1 text-sm font-bold text-zinc-800">{pendingReview.label}</p>
                          <p className="mt-1 text-xs font-semibold text-zinc-600">
                            {pendingReview.changedFields.join(", ")}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => reviewPartnerProfileUpdate(hotel._id, "approve")}
                            disabled={reviewingPartnerUpdate === `${reviewPrefix}:approve`}
                            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-black uppercase text-white disabled:bg-zinc-300"
                          >
                            <FaCheck /> {reviewingPartnerUpdate === `${reviewPrefix}:approve` ? "Approving..." : "Approve"}
                          </button>
                          <button
                            type="button"
                            onClick={() => reviewPartnerProfileUpdate(hotel._id, "reject")}
                            disabled={reviewingPartnerUpdate === `${reviewPrefix}:reject`}
                            className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-3 py-2 text-xs font-black uppercase text-red-600 disabled:text-zinc-300"
                          >
                            <FaTimes /> {reviewingPartnerUpdate === `${reviewPrefix}:reject` ? "Rejecting..." : "Reject"}
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
                );
              })}
              {!visibleHotels.length ? (
                <p className="py-10 text-center text-sm font-bold text-zinc-500">No hotel listings match this view.</p>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default HotelManager;
