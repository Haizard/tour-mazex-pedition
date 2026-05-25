import { useEffect, useMemo, useState } from "react";
import { FaPlus, FaSave, FaTrash, FaUtensils } from "react-icons/fa";
import {
  createRestaurant,
  deleteRestaurant,
  fetchRestaurantAnalytics,
  fetchRestaurantClaimRequests,
  fetchRestaurantReservationOperations,
  fetchRestaurants,
  reviewRestaurantClaimRequest,
  updateRestaurantReservationRequest,
  updateRestaurant,
} from "../../services/api";
import RestaurantClaimManager from "./RestaurantClaimManager";
import {
  buildRestaurantAnalyticsCards,
  buildRestaurantRecentActivity,
  buildRestaurantSponsoredSpotlight,
} from "./restaurantAnalyticsState";
import {
  buildRestaurantPayload,
  createEmptyRestaurantDraft,
  filterRestaurantRows,
} from "./restaurantManagerState";
import {
  getReservationAutopilotBadge,
  getReservationStatusLabel,
  shapeRestaurantReservationOperations,
} from "./restaurantReservationAdminState";

const summaryCardTones = [
  "bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-800 text-white",
  "bg-gradient-to-br from-amber-300 via-orange-200 to-yellow-100 text-zinc-950",
  "bg-gradient-to-br from-emerald-500 via-emerald-400 to-lime-300 text-zinc-950",
  "bg-gradient-to-br from-sky-500 via-cyan-400 to-cyan-200 text-zinc-950",
];

const RestaurantManager = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [draft, setDraft] = useState(createEmptyRestaurantDraft);
  const [editingId, setEditingId] = useState("");
  const [filters, setFilters] = useState({ search: "", status: "" });
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [claims, setClaims] = useState([]);
  const [reservationOperations, setReservationOperations] = useState(null);
  const [reservationRestaurantName, setReservationRestaurantName] = useState("");
  const [reviewingClaimAction, setReviewingClaimAction] = useState("");

  const visibleRestaurants = useMemo(
    () => filterRestaurantRows(restaurants, filters),
    [restaurants, filters]
  );
  const analyticsCards = useMemo(
    () => buildRestaurantAnalyticsCards(analytics || {}),
    [analytics]
  );
  const sponsoredSpotlight = useMemo(
    () =>
      analytics?.sponsoredPerformance ||
      buildRestaurantSponsoredSpotlight(analytics?.restaurants || []),
    [analytics]
  );
  const recentActivity = useMemo(
    () => buildRestaurantRecentActivity(analytics || {}),
    [analytics]
  );

  const loadRestaurants = async () => {
    setLoading(true);
    try {
      const [response, analyticsResponse, claimsResponse] = await Promise.all([
        fetchRestaurants(),
        fetchRestaurantAnalytics().catch(() => ({ data: null })),
        fetchRestaurantClaimRequests().catch(() => ({ data: [] })),
      ]);
      setRestaurants(Array.isArray(response.data) ? response.data : []);
      setAnalytics(analyticsResponse.data || null);
      setClaims(
        Array.isArray(claimsResponse.data?.claims)
          ? claimsResponse.data.claims
          : Array.isArray(claimsResponse.data)
            ? claimsResponse.data
            : []
      );
    } catch (error) {
      setMessage(error?.response?.data?.message || "Unable to load restaurants.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRestaurants();
  }, []);

  const updateDraft = (key, value) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const startEdit = (restaurant) => {
    setEditingId(restaurant._id);
    setDraft({
      ...createEmptyRestaurantDraft(),
      ...restaurant,
      cuisineTypesText: (restaurant.cuisineTypes || []).join(", "),
      mealTypesText: (restaurant.mealTypes || []).join(", "),
      dietaryFitsText: (restaurant.dietaryFits || []).join(", "),
      ambianceTagsText: (restaurant.ambianceTags || []).join(", "),
      photosText: (restaurant.photos || []).join("\n"),
      latitude: restaurant.geo?.latitude ?? "",
      longitude: restaurant.geo?.longitude ?? "",
    });
    loadReservationOperations(restaurant._id, restaurant.name);
  };

  const resetForm = () => {
    setEditingId("");
    setDraft(createEmptyRestaurantDraft());
  };

  const saveRestaurant = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      const payload = buildRestaurantPayload(draft);
      if (editingId) {
        await updateRestaurant(editingId, payload);
      } else {
        await createRestaurant(payload);
      }
      resetForm();
      await loadRestaurants();
      setMessage("Restaurant saved.");
    } catch (error) {
      setMessage(error?.response?.data?.message || "Unable to save restaurant.");
    } finally {
      setSaving(false);
    }
  };

  const removeRestaurant = async (restaurantId) => {
    if (!window.confirm("Delete this restaurant listing?")) return;
    try {
      await deleteRestaurant(restaurantId);
      await loadRestaurants();
      if (editingId === restaurantId) resetForm();
    } catch (error) {
      setMessage(error?.response?.data?.message || "Unable to delete restaurant.");
    }
  };

  const reviewClaim = async (claimId, payload) => {
    const action = payload?.action || "approve";

    setReviewingClaimAction(`${claimId}:${action}`);
    setMessage("");

    try {
      await reviewRestaurantClaimRequest(claimId, payload);
      await loadRestaurants();
      setMessage(
        action === "reject"
          ? "Restaurant claim rejected."
          : action === "needs-more-proof"
            ? "Restaurant claim marked for more proof."
            : "Restaurant claim approved and restaurant partner access created."
      );
    } catch (error) {
      setMessage(error?.response?.data?.message || "Unable to review restaurant claim.");
    } finally {
      setReviewingClaimAction("");
    }
  };

  const loadReservationOperations = async (restaurantId, restaurantName = "") => {
    if (!restaurantId) return;
    try {
      const response = await fetchRestaurantReservationOperations(restaurantId);
      setReservationOperations(shapeRestaurantReservationOperations(response.data || {}));
      setReservationRestaurantName(restaurantName);
    } catch (error) {
      setMessage(error?.response?.data?.message || "Unable to load reservation operations.");
    }
  };

  const updateReservationStatus = async (requestId, status) => {
    await updateRestaurantReservationRequest(requestId, { status });
    if (editingId) {
      await loadReservationOperations(editingId, reservationRestaurantName);
    }
  };

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <p className="text-[11px] font-black uppercase tracking-[0.24em] text-zinc-500">
          Hospitality Marketplace
        </p>
        <h2 className="mt-2 flex items-center gap-3 text-2xl font-black tracking-tight text-zinc-950">
          <FaUtensils className="text-primary" /> Restaurants
        </h2>
        <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-zinc-600">
          Manage canonical dining entities for public discovery, itinerary requests, and
          operator-led guest planning.
        </p>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <p className="text-[11px] font-black uppercase tracking-[0.24em] text-zinc-500">
          Restaurant Lead Conversion
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-4">
          {analyticsCards.map((card, index) => (
            <div
              key={card.label}
              className={`rounded-[1.75rem] px-5 py-5 shadow-sm ${
                summaryCardTones[index] || summaryCardTones.at(-1)
              }`}
            >
              <p className="text-[11px] font-black uppercase tracking-[0.22em] opacity-75">
                {card.label}
              </p>
              <p className="mt-3 text-3xl font-black tracking-tight">{card.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-black text-zinc-950">Sponsored spotlight</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">
                Top sponsored performers
              </p>
              {(sponsoredSpotlight.top || []).length ? (
                (sponsoredSpotlight.top || []).map((row) => (
                  <div key={row.restaurantId} className="mt-3 rounded-2xl bg-zinc-50 p-4">
                    <p className="text-sm font-black text-zinc-950">{row.restaurantName}</p>
                    <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
                      {row.destination || "Destination pending"}
                    </p>
                    <p className="mt-2 text-sm font-semibold text-zinc-700">
                      Demand {row.demandScore} · {row.directInquiryCount} direct /{" "}
                      {row.itineraryInquiryCount} itinerary
                    </p>
                  </div>
                ))
              ) : (
                <p className="mt-3 text-sm font-semibold text-zinc-500">
                  No sponsored restaurants yet.
                </p>
              )}
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">
                Needs attention
              </p>
              {(sponsoredSpotlight.watch || []).length ? (
                (sponsoredSpotlight.watch || []).map((row) => (
                  <div key={row.restaurantId} className="mt-3 rounded-2xl bg-amber-50 p-4">
                    <p className="text-sm font-black text-zinc-950">{row.restaurantName}</p>
                    <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
                      {row.destination || "Destination pending"}
                    </p>
                    <p className="mt-2 text-sm font-semibold text-zinc-700">
                      Demand {row.demandScore} · {row.inquiryCount} total leads
                    </p>
                  </div>
                ))
              ) : (
                <p className="mt-3 text-sm font-semibold text-zinc-500">
                  Nothing to watch yet.
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">
            Recent activity
          </p>
          <div className="mt-4 space-y-3">
            {recentActivity.length ? (
              recentActivity.map((item) => (
                <div
                  key={`${item.restaurantId}:${item.occurredAt}`}
                  className="rounded-2xl bg-zinc-50 p-4"
                >
                  <p className="text-sm font-black text-zinc-950">{item.restaurantName}</p>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
                    {item.activityLabel}
                  </p>
                  <p className="mt-2 text-sm font-medium text-zinc-600">
                    {item.occurredAt
                      ? new Date(item.occurredAt).toLocaleString()
                      : "Recent activity pending"}
                  </p>
                </div>
              ))
            ) : (
              <p className="rounded-2xl bg-zinc-50 p-6 text-sm font-semibold text-zinc-500">
                No recent restaurant activity yet.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
        <form
          onSubmit={saveRestaurant}
          className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black text-zinc-950">
              {editingId ? "Edit Restaurant" : "New Restaurant"}
            </h3>
            <button
              type="button"
              onClick={resetForm}
              className="rounded-xl border px-3 py-2 text-xs font-black uppercase"
            >
              <FaPlus className="inline" /> New
            </button>
          </div>
          {[
            ["name", "Restaurant name"],
            ["slug", "Slug"],
            ["destination", "Destination"],
            ["region", "Region"],
            ["cuisineTypesText", "Cuisine types, comma separated"],
            ["mealTypesText", "Meal types, comma separated"],
            ["dietaryFitsText", "Dietary fits, comma separated"],
            ["ambianceTagsText", "Ambiance tags, comma separated"],
            ["openingHoursSummary", "Opening hours summary"],
            ["reservationStyleSummary", "Reservation style summary"],
          ].map(([key, label]) => (
            <label key={key} className="block">
              <span className="mb-1 block text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">
                {label}
              </span>
              <input
                value={draft[key] || ""}
                onChange={(event) => updateDraft(key, event.target.value)}
                className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm font-medium outline-none focus:border-primary"
              />
            </label>
          ))}
          {[
            ["summary", "Summary", 3],
            ["description", "Description", 4],
            ["trustSummary", "Trust summary", 3],
          ].map(([key, label, rows]) => (
            <label key={key} className="block">
              <span className="mb-1 block text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">
                {label}
              </span>
              <textarea
                value={draft[key] || ""}
                onChange={(event) => updateDraft(key, event.target.value)}
                rows={rows}
                className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm font-medium outline-none focus:border-primary"
              />
            </label>
          ))}
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ["averageRating", "Average rating"],
              ["reviewCount", "Review count"],
              ["latitude", "Latitude"],
              ["longitude", "Longitude"],
            ].map(([key, label]) => (
              <label key={key} className="block">
                <span className="mb-1 block text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">
                  {label}
                </span>
                <input
                  value={draft[key] ?? ""}
                  onChange={(event) => updateDraft(key, event.target.value)}
                  className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm font-medium outline-none focus:border-primary"
                />
              </label>
            ))}
          </div>
          <label className="block">
            <span className="mb-1 block text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">
              Photo URLs
            </span>
            <textarea
              value={draft.photosText || ""}
              onChange={(event) => updateDraft("photosText", event.target.value)}
              rows={3}
              className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm font-medium outline-none focus:border-primary"
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ["published", "Published"],
              ["marketplaceVisible", "Marketplace visible"],
              ["sponsoredPlacement", "Sponsored placement"],
            ].map(([key, label]) => (
              <label
                key={key}
                className="flex items-center gap-3 rounded-xl border border-zinc-200 px-3 py-3 text-sm font-bold text-zinc-700"
              >
                <input
                  type="checkbox"
                  checked={draft[key] === true}
                  onChange={(event) => updateDraft(key, event.target.checked)}
                />
                {label}
              </label>
            ))}
          </div>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-950 px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-white disabled:bg-zinc-300"
          >
            <FaSave /> {saving ? "Saving..." : editingId ? "Update Restaurant" : "Create Restaurant"}
          </button>
          {message ? <p className="text-sm font-semibold text-zinc-600">{message}</p> : null}
        </form>

        <div className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px]">
            <input
              value={filters.search}
              onChange={(event) =>
                setFilters((current) => ({ ...current, search: event.target.value }))
              }
              placeholder="Search restaurants"
              className="rounded-xl border border-zinc-200 px-3 py-3 text-sm font-medium outline-none focus:border-primary"
            />
            <select
              value={filters.status}
              onChange={(event) =>
                setFilters((current) => ({ ...current, status: event.target.value }))
              }
              className="rounded-xl border border-zinc-200 px-3 py-3 text-sm font-bold outline-none focus:border-primary"
            >
              <option value="">All statuses</option>
              <option value="public">Public</option>
              <option value="draft">Draft</option>
              <option value="sponsored">Sponsored</option>
            </select>
          </div>

          {loading ? (
            <div className="rounded-2xl bg-zinc-50 p-10 text-center text-sm font-bold text-zinc-500">
              Loading restaurants...
            </div>
          ) : (
            <div className="space-y-3">
              {visibleRestaurants.map((restaurant) => {
                const row = analytics?.restaurants?.find(
                  (item) => item.restaurantId === restaurant._id
                );

                return (
                  <div key={restaurant._id} className="rounded-2xl border border-zinc-200 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="text-lg font-black tracking-tight text-zinc-950">
                          {restaurant.name}
                        </p>
                        <p className="mt-1 text-sm font-medium text-zinc-500">
                          {restaurant.destination || "Destination pending"}{" "}
                          {restaurant.region ? `· ${restaurant.region}` : ""}
                        </p>
                        <p className="mt-2 text-sm font-medium text-zinc-600">
                          {(restaurant.cuisineTypes || []).slice(0, 3).join(", ") ||
                            "Cuisine details pending"}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => startEdit(restaurant)}
                          className="rounded-xl border px-3 py-2 text-xs font-black uppercase"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => removeRestaurant(restaurant._id)}
                          className="rounded-xl border border-red-200 px-3 py-2 text-xs font-black uppercase text-red-600"
                        >
                          <FaTrash className="inline" /> Delete
                        </button>
                      </div>
                    </div>
                    {row ? (
                      <div className="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                        <div className="grid gap-3 text-sm font-semibold text-zinc-600 md:grid-cols-5">
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-500">
                              Leads
                            </p>
                            <p className="mt-1 text-zinc-950">{row.inquiryCount}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-500">
                              Direct
                            </p>
                            <p className="mt-1 text-zinc-950">{row.directInquiryCount}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-500">
                              Itinerary
                            </p>
                            <p className="mt-1 text-zinc-950">{row.itineraryInquiryCount}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-500">
                              Accepted Quotes
                            </p>
                            <p className="mt-1 text-zinc-950">{row.acceptedQuoteCount}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-500">
                              Demand / Recent
                            </p>
                            <p className="mt-1 text-zinc-950">{row.demandScore}</p>
                            <p className="mt-1 text-xs text-zinc-500">
                              {row.lastInquiryAt
                                ? new Date(row.lastInquiryAt).toLocaleString()
                                : "No activity yet"}
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              })}
              {!visibleRestaurants.length ? (
                <div className="rounded-2xl bg-zinc-50 p-10 text-center text-sm font-bold text-zinc-500">
                  No restaurants match this filter yet.
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>

      <RestaurantClaimManager
        claims={claims}
        reviewingClaimAction={reviewingClaimAction}
        onReview={reviewClaim}
      />

      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">
              Reservation operations
            </p>
            <h3 className="mt-2 text-lg font-black text-zinc-950">
              {reservationRestaurantName || "Select a restaurant to inspect reservations"}
            </h3>
          </div>
          {reservationOperations ? (
            <div className="grid grid-cols-4 gap-2 text-center text-xs font-black uppercase tracking-[0.12em] text-zinc-600">
              <span className="rounded-xl bg-zinc-50 px-3 py-2">
                {reservationOperations.summary.pending} pending
              </span>
              <span className="rounded-xl bg-emerald-50 px-3 py-2">
                {reservationOperations.summary.confirmed} confirmed
              </span>
              <span className="rounded-xl bg-amber-50 px-3 py-2">
                {reservationOperations.summary.needsClarification} clarify
              </span>
              <span className="rounded-xl bg-zinc-50 px-3 py-2">
                {reservationOperations.summary.total} total
              </span>
            </div>
          ) : null}
        </div>

        {reservationOperations ? (
          <div className="mt-5 grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
            <div className="rounded-2xl bg-zinc-50 p-4 text-sm font-semibold text-zinc-600">
              <p>{reservationOperations.serviceWindows.length} service windows</p>
              <p className="mt-2">{reservationOperations.tableTypes.length} table types</p>
              <p className="mt-2">
                {reservationOperations.availabilityEntries.length} availability entries
              </p>
            </div>
            <div className="space-y-3">
              {reservationOperations.reservationRequests.slice(0, 6).map((request) => (
                <div key={request.id} className="rounded-2xl border border-zinc-200 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-black text-zinc-950">
                        {request.travelerName} · {request.guestCount} guests
                      </p>
                      <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
                        {request.date} at {request.preferredTime} ·{" "}
                        {getReservationStatusLabel(request.status)}
                      </p>
                      <p className="mt-2 text-xs font-bold text-[#234232]">
                        {getReservationAutopilotBadge(request.autopilot)}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {["confirmed", "declined", "needs-clarification"].map((status) => (
                        <button
                          key={status}
                          type="button"
                          onClick={() => updateReservationStatus(request.id, status)}
                          className="rounded-xl border px-3 py-2 text-[10px] font-black uppercase tracking-[0.12em]"
                        >
                          {status.replace("-", " ")}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
              {!reservationOperations.reservationRequests.length ? (
                <p className="rounded-2xl bg-zinc-50 p-6 text-sm font-semibold text-zinc-500">
                  No reservation requests yet.
                </p>
              ) : null}
            </div>
          </div>
        ) : (
          <p className="mt-4 rounded-2xl bg-zinc-50 p-6 text-sm font-semibold text-zinc-500">
            Open a restaurant from the list above to see reservation operations.
          </p>
        )}
      </section>
    </section>
  );
};

export default RestaurantManager;
