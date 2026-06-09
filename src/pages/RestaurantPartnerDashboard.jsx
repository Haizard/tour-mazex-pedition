import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaCalendarCheck, FaClipboardCheck, FaDoorOpen, FaStore, FaUtensils } from "react-icons/fa";
import {
  createRestaurantPartnerAvailability,
  createRestaurantPartnerMenuItem,
  createRestaurantPartnerMenuSection,
  createRestaurantPartnerPaymentRequest,
  createRestaurantPartnerServiceWindow,
  createRestaurantPartnerTableType,
  deleteRestaurantPartnerMenuItem,
  deleteRestaurantPartnerMenuSection,
  fetchRestaurantPartnerMenu,
  fetchRestaurantPartnerReservationOperations,
  fetchRestaurantPartnerRestaurants,
  fetchRestaurantPartnerSession,
  updateRestaurantPartnerCheckoutSettings,
  updateRestaurantPartnerMenuItem,
  updateRestaurantPartnerMenuSection,
  updateRestaurantPartnerReservationRequest,
} from "../services/api";
import {
  buildCustomDiningPaymentPayload,
  buildDepositPaymentPayload,
  buildRestaurantCheckoutSettingsPayload,
  getRestaurantPaymentStatusLabel,
} from "../components/RestaurantPartner/restaurantPartnerCheckoutState";
import {
  buildAvailabilityPayload,
  buildReservationStatusPayload,
  buildServiceWindowPayload,
  buildTableTypePayload,
  formatReservationRequestSummary,
} from "../components/RestaurantPartner/restaurantPartnerReservationState";

const normalizePartnerSession = (payload = {}) => {
  const partnerAdmin = payload?.partnerAdmin || payload?.user || payload || {};
  const tenant = payload?.tenant || null;

  return {
    partnerAdmin,
    tenant,
  };
};

const getAssignedRestaurants = (session = {}) =>
  Array.isArray(session?.partnerAdmin?.restaurantIds)
    ? session.partnerAdmin.restaurantIds.map((restaurantId) => ({
        id: String(restaurantId),
        name: `Restaurant ${String(restaurantId).slice(0, 8)}`,
        summary: "Full restaurant partner tools will appear here in the next rollout.",
      }))
    : [];

const RestaurantPartnerDashboard = () => {
  const [session, setSession] = useState(null);
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState("");
  const [operations, setOperations] = useState(null);
  const [serviceDraft, setServiceDraft] = useState({ label: "", serviceType: "dinner", defaultStartTime: "18:00", defaultEndTime: "22:00" });
  const [tableDraft, setTableDraft] = useState({ label: "", minGuests: 2, maxGuests: 4, quantity: 1 });
  const [availabilityDraft, setAvailabilityDraft] = useState({ date: "", status: "open", availableUnits: 1, availableSeats: 4 });
  const [paymentDraftByRequest, setPaymentDraftByRequest] = useState({});
  const [menu, setMenu] = useState({ sections: [], items: [] });
  const [menuSectionDraft, setMenuSectionDraft] = useState({ title: "", description: "" });
  const [menuItemDraft, setMenuItemDraft] = useState({
    name: "",
    description: "",
    price: "",
    currency: "USD",
    groupFriendly: false,
    preorderEnabled: false,
    featured: false,
  });
  const [editingSectionId, setEditingSectionId] = useState(null);
  const [editingSectionTitle, setEditingSectionTitle] = useState("");
  const [editingItemId, setEditingItemId] = useState(null);
  const [editingItemDraft, setEditingItemDraft] = useState(null);
  const [checkoutSettings, setCheckoutSettings] = useState({
    enabled: false,
    depositMode: "none",
    depositAmount: "",
    depositPercentage: "",
    currency: "USD",
    paymentInstructions: "",
    autoDeposit: false,
  });
  const [savingCheckout, setSavingCheckout] = useState(false);
  const [checkoutMessage, setCheckoutMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const navigate = useNavigate();

  const loadReservationOperations = async (restaurantId) => {
    if (!restaurantId) return;
    const operationsResponse = await fetchRestaurantPartnerReservationOperations(restaurantId);
    setOperations(operationsResponse.data || null);
  };

  const loadMenu = async (restaurantId) => {
    if (!restaurantId) return;
    const menuResponse = await fetchRestaurantPartnerMenu(restaurantId).catch(
      () => ({ data: null })
    );
    setMenu(menuResponse?.data || { sections: [], items: [] });
  };

  useEffect(() => {
    let active = true;

    const loadDashboard = async () => {
      setLoading(true);
      setError("");

      try {
        const [sessionResponse, restaurantsResponse] = await Promise.all([
          fetchRestaurantPartnerSession(),
          fetchRestaurantPartnerRestaurants().catch(() => ({ data: null })),
        ]);

        if (!active) {
          return;
        }

        const normalizedSession = normalizePartnerSession(sessionResponse.data || {});
        const assignedRestaurants = Array.isArray(restaurantsResponse.data?.restaurants)
          ? restaurantsResponse.data.restaurants
          : getAssignedRestaurants(normalizedSession);
        const firstRestaurantId = assignedRestaurants[0]?._id || assignedRestaurants[0]?.id || "";
        setSession(normalizedSession);
        setRestaurants(assignedRestaurants);
        setSelectedRestaurantId(String(firstRestaurantId || ""));

        if (firstRestaurantId) {
          await loadReservationOperations(firstRestaurantId);
          await loadMenu(firstRestaurantId);
        }
      } catch (loadError) {
        if (!active) {
          return;
        }

        setError(
          loadError.response?.data?.message ||
            "Unable to load the restaurant partner workspace."
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadDashboard();

    return () => {
      active = false;
    };
  }, []);

  const sessionLabel = useMemo(
    () =>
      session?.partnerAdmin?.displayName ||
      session?.partnerAdmin?.name ||
      session?.partnerAdmin?.username ||
      session?.partnerAdmin?.email ||
      "Restaurant partner",
    [session]
  );

  const signOut = () => {
    window.localStorage.removeItem("restaurantPartnerAuthToken");
    navigate("/restaurant-partner/login", { replace: true });
  };

  const selectedRestaurant = useMemo(
    () =>
      restaurants.find(
        (restaurant) => String(restaurant._id || restaurant.id) === String(selectedRestaurantId)
      ) || restaurants[0],
    [restaurants, selectedRestaurantId]
  );

  // Sync checkout settings from the selected restaurant
  useEffect(() => {
    const checkout = selectedRestaurant?.restaurantCheckout || {};
    setCheckoutSettings({
      enabled: checkout.enabled === true,
      depositMode: checkout.depositMode || "none",
      depositAmount: checkout.depositAmount ?? "",
      depositPercentage: checkout.depositPercentage ?? "",
      currency: checkout.currency || "USD",
      paymentInstructions: checkout.paymentInstructions || "",
      autoDeposit: checkout.autoDeposit === true,
    });
    setCheckoutMessage("");
  }, [selectedRestaurant]);

  const saveCheckoutSettings = async () => {
    if (!selectedRestaurantId) return;
    setSavingCheckout(true);
    setCheckoutMessage("");
    try {
      const payload = buildRestaurantCheckoutSettingsPayload(checkoutSettings);
      const response = await updateRestaurantPartnerCheckoutSettings(selectedRestaurantId, payload);
      const saved = response.data?.restaurantCheckout || {};
      setCheckoutSettings({
        enabled: saved.enabled === true,
        depositMode: saved.depositMode || "none",
        depositAmount: saved.depositAmount ?? "",
        depositPercentage: saved.depositPercentage ?? "",
        currency: saved.currency || "USD",
        paymentInstructions: saved.paymentInstructions || "",
        autoDeposit: saved.autoDeposit === true,
      });
      setCheckoutMessage("Checkout settings saved.");
    } catch (saveError) {
      setCheckoutMessage(
        saveError.response?.data?.message || "Unable to save checkout settings."
      );
    } finally {
      setSavingCheckout(false);
    }
  };

  const submitServiceWindow = async (event) => {
    event.preventDefault();
    if (!selectedRestaurantId) return;
    setActionMessage("");
    await createRestaurantPartnerServiceWindow(
      selectedRestaurantId,
      buildServiceWindowPayload(serviceDraft)
    );
    setServiceDraft({ label: "", serviceType: "dinner", defaultStartTime: "18:00", defaultEndTime: "22:00" });
    await loadReservationOperations(selectedRestaurantId);
    setActionMessage("Service window saved.");
  };

  const submitTableType = async (event) => {
    event.preventDefault();
    if (!selectedRestaurantId) return;
    setActionMessage("");
    await createRestaurantPartnerTableType(selectedRestaurantId, buildTableTypePayload(tableDraft));
    setTableDraft({ label: "", minGuests: 2, maxGuests: 4, quantity: 1 });
    await loadReservationOperations(selectedRestaurantId);
    setActionMessage("Table type saved.");
  };

  const submitAvailability = async (event) => {
    event.preventDefault();
    if (!selectedRestaurantId) return;
    setActionMessage("");
    await createRestaurantPartnerAvailability(
      selectedRestaurantId,
      buildAvailabilityPayload(availabilityDraft)
    );
    setAvailabilityDraft({ date: "", status: "open", availableUnits: 1, availableSeats: 4 });
    await loadReservationOperations(selectedRestaurantId);
    setActionMessage("Availability saved.");
  };

  const updateRequestStatus = async (requestId, status) => {
    await updateRestaurantPartnerReservationRequest(
      requestId,
      buildReservationStatusPayload({ status })
    );
    await loadReservationOperations(selectedRestaurantId);
  };

  const requestDepositPayment = async (requestId) => {
    await createRestaurantPartnerPaymentRequest(requestId, buildDepositPaymentPayload());
    await loadReservationOperations(selectedRestaurantId);
  };

  const requestCustomPayment = async (requestId) => {
    const draft = paymentDraftByRequest[requestId] || {};
    await createRestaurantPartnerPaymentRequest(
      requestId,
      buildCustomDiningPaymentPayload(draft)
    );
    setPaymentDraftByRequest((current) => ({ ...current, [requestId]: {} }));
    await loadReservationOperations(selectedRestaurantId);
  };

  return (
    <main className="min-h-screen bg-[#f6f1e8] px-6 py-10 text-slate-950">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-4 border-b border-[#dccfb7] pb-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-[#8b7451]">
              Restaurant Partner Portal
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight">
              Assigned restaurant profiles
            </h1>
            <p className="mt-2 text-sm font-semibold text-slate-600">
              This first phase confirms your session and assigned listing context.
              Reservations, payments, and service tools come next.
            </p>
          </div>
          <button
            type="button"
            onClick={signOut}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-slate-700"
          >
            <FaDoorOpen />
            Sign out
          </button>
        </div>

        {loading ? (
          <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-[28px] border border-[#dccfb7] bg-white p-6 shadow-sm">
              <div className="h-3 w-44 animate-pulse rounded-full bg-slate-200" />
              <div className="mt-5 h-10 w-2/3 animate-pulse rounded-2xl bg-slate-100" />
              <div className="mt-5 h-32 w-full animate-pulse rounded-3xl bg-slate-100" />
            </div>
            <div className="rounded-[28px] border border-[#dccfb7] bg-white p-6 shadow-sm">
              <div className="h-3 w-36 animate-pulse rounded-full bg-slate-200" />
              <div className="mt-5 h-40 w-full animate-pulse rounded-3xl bg-slate-100" />
            </div>
          </div>
        ) : (
          <>
            {error ? (
              <div className="mt-8 rounded-[28px] border border-red-200 bg-red-50 p-5 text-sm font-semibold text-red-700">
                {error}
              </div>
            ) : null}

            <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <section className="rounded-[28px] border border-[#dccfb7] bg-white p-6 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#8b7451]">
                  Session confirmed
                </p>
                <h2 className="mt-3 flex items-center gap-3 text-2xl font-black tracking-tight text-slate-950">
                  <FaUtensils className="text-[#234232]" />
                  {sessionLabel}
                </h2>
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl bg-[#f6f1e8] p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                      Username
                    </p>
                    <p className="mt-2 text-sm font-bold text-slate-800">
                      {session?.partnerAdmin?.username || "Assigned after approval"}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-[#f6f1e8] p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                      Contact
                    </p>
                    <p className="mt-2 text-sm font-bold text-slate-800">
                      {session?.tenant?.name || "Available from your approved tenant profile"}
                    </p>
                  </div>
                </div>
              </section>

              <section className="rounded-[28px] border border-[#dccfb7] bg-white p-6 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#8b7451]">
                  Next in rollout
                </p>
                <div className="mt-4 space-y-3">
                  {[
                    "Reservation workflow controls",
                    "Menu and service updates for review",
                    "Payments and dining operations reporting",
                  ].map((item) => (
                    <div
                      key={item}
                      className="flex items-start gap-3 rounded-2xl bg-[#f6f1e8] p-4"
                    >
                      <FaClipboardCheck className="mt-1 text-[#234232]" />
                      <p className="text-sm font-semibold text-slate-700">{item}</p>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <section className="mt-8 rounded-[28px] border border-[#dccfb7] bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#8b7451]">
                    Reservation operations
                  </p>
                  <h2 className="mt-2 flex items-center gap-3 text-2xl font-black tracking-tight text-slate-950">
                    <FaCalendarCheck className="text-[#234232]" />
                    {selectedRestaurant?.name || "Restaurant reservations"}
                  </h2>
                </div>
                {restaurants.length > 1 ? (
                  <select
                    value={selectedRestaurantId}
                    onChange={async (event) => {
                      const restaurantId = event.target.value;
                      setSelectedRestaurantId(restaurantId);
                      await loadReservationOperations(restaurantId);
                      await loadMenu(restaurantId);
                    }}
                    className="rounded-2xl border border-[#dccfb7] bg-white px-4 py-3 text-sm font-bold"
                  >
                    {restaurants.map((restaurant) => (
                      <option key={restaurant._id || restaurant.id} value={restaurant._id || restaurant.id}>
                        {restaurant.name}
                      </option>
                    ))}
                  </select>
                ) : null}
              </div>

              {actionMessage ? (
                <p className="mt-4 rounded-2xl bg-[#eef6f0] px-4 py-3 text-sm font-bold text-[#234232]">
                  {actionMessage}
                </p>
              ) : null}

              <div className="mt-6 grid gap-4 lg:grid-cols-3">
                <form onSubmit={submitServiceWindow} className="rounded-3xl bg-[#fcfaf6] p-4">
                  <h3 className="text-sm font-black uppercase tracking-[0.16em] text-slate-700">
                    Service window
                  </h3>
                  <input
                    value={serviceDraft.label}
                    onChange={(event) => setServiceDraft((current) => ({ ...current, label: event.target.value }))}
                    placeholder="Dinner"
                    className="mt-3 w-full rounded-2xl border border-[#dccfb7] px-3 py-3 text-sm font-bold"
                  />
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <input
                      type="time"
                      value={serviceDraft.defaultStartTime}
                      onChange={(event) => setServiceDraft((current) => ({ ...current, defaultStartTime: event.target.value }))}
                      className="rounded-2xl border border-[#dccfb7] px-3 py-3 text-sm font-bold"
                    />
                    <input
                      type="time"
                      value={serviceDraft.defaultEndTime}
                      onChange={(event) => setServiceDraft((current) => ({ ...current, defaultEndTime: event.target.value }))}
                      className="rounded-2xl border border-[#dccfb7] px-3 py-3 text-sm font-bold"
                    />
                  </div>
                  <button className="mt-3 w-full rounded-2xl bg-[#234232] px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-white">
                    Add service
                  </button>
                </form>

                <form onSubmit={submitTableType} className="rounded-3xl bg-[#fcfaf6] p-4">
                  <h3 className="text-sm font-black uppercase tracking-[0.16em] text-slate-700">
                    Table type
                  </h3>
                  <input
                    value={tableDraft.label}
                    onChange={(event) => setTableDraft((current) => ({ ...current, label: event.target.value }))}
                    placeholder="Family table"
                    className="mt-3 w-full rounded-2xl border border-[#dccfb7] px-3 py-3 text-sm font-bold"
                  />
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {["minGuests", "maxGuests", "quantity"].map((field) => (
                      <input
                        key={field}
                        type="number"
                        min="1"
                        value={tableDraft[field]}
                        onChange={(event) => setTableDraft((current) => ({ ...current, [field]: event.target.value }))}
                        className="rounded-2xl border border-[#dccfb7] px-3 py-3 text-sm font-bold"
                      />
                    ))}
                  </div>
                  <button className="mt-3 w-full rounded-2xl bg-[#234232] px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-white">
                    Add table
                  </button>
                </form>

                <form onSubmit={submitAvailability} className="rounded-3xl bg-[#fcfaf6] p-4">
                  <h3 className="text-sm font-black uppercase tracking-[0.16em] text-slate-700">
                    Availability
                  </h3>
                  <input
                    type="date"
                    value={availabilityDraft.date}
                    onChange={(event) => setAvailabilityDraft((current) => ({ ...current, date: event.target.value }))}
                    className="mt-3 w-full rounded-2xl border border-[#dccfb7] px-3 py-3 text-sm font-bold"
                  />
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <select
                      value={availabilityDraft.status}
                      onChange={(event) => setAvailabilityDraft((current) => ({ ...current, status: event.target.value }))}
                      className="rounded-2xl border border-[#dccfb7] px-3 py-3 text-sm font-bold"
                    >
                      <option value="open">Open</option>
                      <option value="limited">Limited</option>
                      <option value="on_request">On request</option>
                      <option value="closed">Closed</option>
                    </select>
                    <input
                      type="number"
                      min="0"
                      value={availabilityDraft.availableUnits}
                      onChange={(event) => setAvailabilityDraft((current) => ({ ...current, availableUnits: event.target.value }))}
                      className="rounded-2xl border border-[#dccfb7] px-3 py-3 text-sm font-bold"
                    />
                    <input
                      type="number"
                      min="0"
                      value={availabilityDraft.availableSeats}
                      onChange={(event) => setAvailabilityDraft((current) => ({ ...current, availableSeats: event.target.value }))}
                      className="rounded-2xl border border-[#dccfb7] px-3 py-3 text-sm font-bold"
                    />
                  </div>
                  <button className="mt-3 w-full rounded-2xl bg-[#234232] px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-white">
                    Add availability
                  </button>
                </form>
              </div>

              <div className="mt-6 grid gap-4 lg:grid-cols-2">
                <div className="rounded-3xl bg-[#fcfaf6] p-4">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                    Current setup
                  </p>
                  <p className="mt-3 text-sm font-semibold text-slate-700">
                    {(operations?.serviceWindows || []).length} services ·{" "}
                    {(operations?.tableTypes || []).length} table types ·{" "}
                    {(operations?.availabilityEntries || []).length} availability entries
                  </p>
                </div>
                <div className="rounded-3xl bg-[#fcfaf6] p-4">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                    Incoming requests
                  </p>
                  <div className="mt-3 space-y-3">
                    {(operations?.reservationRequests || []).slice(0, 5).map((request) => (
                      <div key={request.id} className="rounded-2xl bg-white p-3">
                        <p className="text-sm font-black text-slate-900">
                          {formatReservationRequestSummary(request)}
                        </p>
                        <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                          {request.status}
                        </p>
                        <p className="mt-1 text-xs font-black uppercase tracking-[0.14em] text-[#234232]">
                          {getRestaurantPaymentStatusLabel(request.paymentStatus)}
                          {request.paymentAmount ? ` · ${request.paymentCurrency || "USD"} ${Number(request.paymentAmount).toFixed(2)}` : ""}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {["confirmed", "declined", "needs-clarification"].map((status) => (
                            <button
                              key={status}
                              type="button"
                              onClick={() => updateRequestStatus(request.id, status)}
                              className="rounded-xl border border-[#dccfb7] px-3 py-2 text-[10px] font-black uppercase tracking-[0.12em]"
                            >
                              {status.replace("-", " ")}
                            </button>
                          ))}
                        </div>
                        <div className="mt-3 grid gap-2 md:grid-cols-[1fr_auto_auto]">
                          <input
                            type="number"
                            min="0"
                            placeholder="Custom amount"
                            value={paymentDraftByRequest[request.id]?.amount || ""}
                            onChange={(event) =>
                              setPaymentDraftByRequest((current) => ({
                                ...current,
                                [request.id]: {
                                  ...(current[request.id] || {}),
                                  amount: event.target.value,
                                  currency: current[request.id]?.currency || "USD",
                                  paymentReason: current[request.id]?.paymentReason || "event_dining",
                                },
                              }))
                            }
                            className="rounded-xl border border-[#dccfb7] px-3 py-2 text-xs font-bold"
                          />
                          <button
                            type="button"
                            onClick={() => requestDepositPayment(request.id)}
                            className="rounded-xl bg-[#234232] px-3 py-2 text-[10px] font-black uppercase tracking-[0.12em] text-white"
                          >
                            Deposit
                          </button>
                          <button
                            type="button"
                            onClick={() => requestCustomPayment(request.id)}
                            className="rounded-xl border border-[#dccfb7] px-3 py-2 text-[10px] font-black uppercase tracking-[0.12em]"
                          >
                            Custom pay
                          </button>
                        </div>
                      </div>
                    ))}
                    {!(operations?.reservationRequests || []).length ? (
                      <p className="text-sm font-semibold text-slate-500">
                        No reservation requests yet.
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>
            </section>

            <section className="mt-8 rounded-[28px] border border-[#dccfb7] bg-white p-6 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#8b7451]">
                Menu workspace
              </p>
              <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
                Group dining menu
              </h3>
              <p className="mt-2 text-sm font-medium text-slate-600">
                Add menu sections and pre-order friendly items for traveler confidence and group dining
                deposits.
              </p>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <input
                  placeholder="Section title (e.g. Starters, Mains, Group Platters)"
                  value={menuSectionDraft.title}
                  onChange={(event) =>
                    setMenuSectionDraft((current) => ({ ...current, title: event.target.value }))
                  }
                  className="rounded-2xl border border-[#dccfb7] bg-white px-3 py-3 text-sm font-bold"
                />
                <button
                  type="button"
                  onClick={async () => {
                    const restaurantId = selectedRestaurantId;
                    if (!restaurantId || !menuSectionDraft.title) return;
                    await createRestaurantPartnerMenuSection(restaurantId, menuSectionDraft);
                    await loadMenu(restaurantId);
                    setMenuSectionDraft({ title: "", description: "" });
                  }}
                  className="rounded-2xl bg-[#234232] px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-white"
                >
                  Add section
                </button>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <input
                  placeholder="Menu item name"
                  value={menuItemDraft.name}
                  onChange={(event) =>
                    setMenuItemDraft((current) => ({ ...current, name: event.target.value }))
                  }
                  className="rounded-2xl border border-[#dccfb7] bg-white px-3 py-3 text-sm font-bold"
                />
                <input
                  placeholder="Price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={menuItemDraft.price}
                  onChange={(event) =>
                    setMenuItemDraft((current) => ({ ...current, price: event.target.value }))
                  }
                  className="rounded-2xl border border-[#dccfb7] bg-white px-3 py-3 text-sm font-bold"
                />
              </div>
              <div className="mt-3 flex flex-wrap gap-3">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={menuItemDraft.groupFriendly}
                    onChange={(event) =>
                      setMenuItemDraft((current) => ({
                        ...current,
                        groupFriendly: event.target.checked,
                      }))
                    }
                  />
                  Group-friendly
                </label>
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={menuItemDraft.preorderEnabled}
                    onChange={(event) =>
                      setMenuItemDraft((current) => ({
                        ...current,
                        preorderEnabled: event.target.checked,
                      }))
                    }
                  />
                  Pre-order enabled
                </label>
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={menuItemDraft.featured}
                    onChange={(event) =>
                      setMenuItemDraft((current) => ({
                        ...current,
                        featured: event.target.checked,
                      }))
                    }
                  />
                  Featured
                </label>
              </div>
              <button
                type="button"
                onClick={async () => {
                  const restaurantId = selectedRestaurantId;
                  if (!restaurantId || !menuItemDraft.name) return;
                  await createRestaurantPartnerMenuItem(restaurantId, menuItemDraft);
                  await loadMenu(restaurantId);
                  setMenuItemDraft({
                    name: "",
                    description: "",
                    price: "",
                    currency: "USD",
                    groupFriendly: false,
                    preorderEnabled: false,
                    featured: false,
                  });
                }}
                className="mt-3 rounded-2xl border border-[#234232] px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-[#234232]"
              >
                Add menu item
              </button>
              <p className="mt-4 text-sm font-bold text-slate-600">
                {menu?.items?.length || 0} menu items stored for this restaurant
                {menu?.sections?.length > 0
                  ? ` · ${menu.sections.length} sections`
                  : ""}
              </p>

              {menu?.sections?.length > 0 || menu?.items?.length > 0 ? (
                <div className="mt-5 space-y-3">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                    Manage menu
                  </p>
                  {menu.sections.map((section) => (
                    <div key={section._id || section.id} className="flex items-center gap-3 rounded-2xl bg-[#fcfaf6] p-3">
                      {editingSectionId === (section._id || section.id) ? (
                        <>
                          <input
                            value={editingSectionTitle}
                            onChange={(event) => setEditingSectionTitle(event.target.value)}
                            className="flex-1 rounded-xl border border-[#dccfb7] px-3 py-2 text-sm font-bold"
                          />
                          <button
                            type="button"
                            onClick={async () => {
                              await updateRestaurantPartnerMenuSection(section._id || section.id, {
                                title: editingSectionTitle,
                              });
                              await loadMenu(selectedRestaurantId);
                              setEditingSectionId(null);
                              setEditingSectionTitle("");
                            }}
                            className="rounded-xl bg-[#234232] px-3 py-2 text-[10px] font-black uppercase tracking-[0.12em] text-white"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingSectionId(null);
                              setEditingSectionTitle("");
                            }}
                            className="rounded-xl border border-[#dccfb7] px-3 py-2 text-[10px] font-black uppercase tracking-[0.12em]"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <p className="flex-1 text-sm font-bold text-slate-800">
                            {section.title}
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingSectionId(section._id || section.id);
                              setEditingSectionTitle(section.title);
                            }}
                            className="rounded-xl border border-[#dccfb7] px-3 py-2 text-[10px] font-black uppercase tracking-[0.12em]"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              await deleteRestaurantPartnerMenuSection(section._id || section.id);
                              await loadMenu(selectedRestaurantId);
                            }}
                            className="rounded-xl border border-red-200 px-3 py-2 text-[10px] font-black uppercase tracking-[0.12em] text-red-600"
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  ))}
                  {menu.items.map((item) => (
                    <div key={item._id || item.id} className="flex flex-wrap items-center gap-2 rounded-2xl bg-[#fcfaf6] p-3">
                      {editingItemId === (item._id || item.id) && editingItemDraft ? (
                        <>
                          <input
                            value={editingItemDraft.name}
                            onChange={(event) =>
                              setEditingItemDraft((current) => ({ ...current, name: event.target.value }))
                            }
                            className="min-w-0 flex-1 rounded-xl border border-[#dccfb7] px-3 py-2 text-sm font-bold"
                          />
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={editingItemDraft.price}
                            onChange={(event) =>
                              setEditingItemDraft((current) => ({ ...current, price: event.target.value }))
                            }
                            className="w-20 rounded-xl border border-[#dccfb7] px-3 py-2 text-sm font-bold"
                          />
                          <label className="flex items-center gap-1 text-[10px] font-bold">
                            <input
                              type="checkbox"
                              checked={editingItemDraft.groupFriendly}
                              onChange={(event) =>
                                setEditingItemDraft((current) => ({
                                  ...current,
                                  groupFriendly: event.target.checked,
                                }))
                              }
                            />
                            Group
                          </label>
                          <label className="flex items-center gap-1 text-[10px] font-bold">
                            <input
                              type="checkbox"
                              checked={editingItemDraft.preorderEnabled}
                              onChange={(event) =>
                                setEditingItemDraft((current) => ({
                                  ...current,
                                  preorderEnabled: event.target.checked,
                                }))
                              }
                            />
                            Pre
                          </label>
                          <button
                            type="button"
                            onClick={async () => {
                              await updateRestaurantPartnerMenuItem(item._id || item.id, editingItemDraft);
                              await loadMenu(selectedRestaurantId);
                              setEditingItemId(null);
                              setEditingItemDraft(null);
                            }}
                            className="rounded-xl bg-[#234232] px-3 py-2 text-[10px] font-black uppercase tracking-[0.12em] text-white"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingItemId(null);
                              setEditingItemDraft(null);
                            }}
                            className="rounded-xl border border-[#dccfb7] px-3 py-2 text-[10px] font-black uppercase tracking-[0.12em]"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <p className="min-w-0 flex-1 text-sm font-bold text-slate-800">
                            {item.name}
                            {item.price > 0 ? ` — ${item.currency || "USD"} ${Number(item.price).toFixed(2)}` : ""}
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {item.groupFriendly ? (
                              <span className="rounded-full bg-[#eef6f0] px-2 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-[#234232]">
                                Group
                              </span>
                            ) : null}
                            {item.preorderEnabled ? (
                              <span className="rounded-full bg-[#fffaf1] px-2 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-[#8b7451]">
                                Pre
                              </span>
                            ) : null}
                            {item.featured ? (
                              <span className="rounded-full bg-[#fef3c7] px-2 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-[#92400e]">
                                Featured
                              </span>
                            ) : null}
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingItemId(item._id || item.id);
                              setEditingItemDraft({
                                name: item.name,
                                price: String(item.price || ""),
                                currency: item.currency || "USD",
                                groupFriendly: item.groupFriendly,
                                preorderEnabled: item.preorderEnabled,
                                featured: item.featured,
                              });
                            }}
                            className="rounded-xl border border-[#dccfb7] px-3 py-2 text-[10px] font-black uppercase tracking-[0.12em]"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              await deleteRestaurantPartnerMenuItem(item._id || item.id);
                              await loadMenu(selectedRestaurantId);
                            }}
                            className="rounded-xl border border-red-200 px-3 py-2 text-[10px] font-black uppercase tracking-[0.12em] text-red-600"
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              ) : null}
            </section>

            {/* Checkout settings */}
            <section className="mt-8 rounded-[28px] border border-[#dccfb7] bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#8b7451]">
                    Deposit & checkout
                  </p>
                  <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
                    {selectedRestaurant?.name || "Restaurant"}
                  </h2>
                </div>
              </div>

              {checkoutMessage ? (
                <div
                  className={`mt-4 rounded-2xl px-4 py-3 text-sm font-bold ${
                    checkoutMessage.includes("saved")
                      ? "bg-[#eef6f0] text-[#234232]"
                      : "bg-red-50 text-red-700"
                  }`}
                >
                  {checkoutMessage}
                </div>
              ) : null}

              <div className="mt-5 grid gap-5 md:grid-cols-2">
                {/* Enabled toggle */}
                <label className="flex cursor-pointer items-center gap-3 rounded-2xl bg-[#fcfaf6] p-4">
                  <input
                    type="checkbox"
                    checked={checkoutSettings.enabled}
                    onChange={(event) =>
                      setCheckoutSettings((current) => ({
                        ...current,
                        enabled: event.target.checked,
                      }))
                    }
                    className="h-5 w-5 rounded border-[#dccfb7] text-[#234232]"
                  />
                  <div>
                    <p className="text-sm font-black uppercase tracking-[0.12em] text-slate-800">
                      Checkout enabled
                    </p>
                    <p className="mt-0.5 text-xs font-medium text-slate-500">
                      Allow travelers to pay deposits and request reservations
                    </p>
                  </div>
                </label>

                {/* Auto-deposit toggle */}
                <label
                  className={`flex cursor-pointer items-center gap-3 rounded-2xl bg-[#fcfaf6] p-4 transition ${
                    !checkoutSettings.enabled ? "opacity-40" : ""
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checkoutSettings.autoDeposit}
                    onChange={(event) =>
                      setCheckoutSettings((current) => ({
                        ...current,
                        autoDeposit: event.target.checked,
                      }))
                    }
                    disabled={!checkoutSettings.enabled}
                    className="h-5 w-5 rounded border-[#dccfb7] text-[#234232]"
                  />
                  <div>
                    <p className="text-sm font-black uppercase tracking-[0.12em] text-slate-800">
                      Auto-deposit on confirm
                    </p>
                    <p className="mt-0.5 text-xs font-medium text-slate-500">
                      Automatically request a deposit payment when confirming a reservation
                    </p>
                  </div>
                </label>
              </div>

              <div className="mt-4 grid gap-5 md:grid-cols-3">
                {/* Deposit mode */}
                <div className="rounded-2xl bg-[#fcfaf6] p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
                    Deposit mode
                  </p>
                  <select
                    value={checkoutSettings.depositMode}
                    onChange={(event) =>
                      setCheckoutSettings((current) => ({
                        ...current,
                        depositMode: event.target.value,
                      }))
                    }
                    disabled={!checkoutSettings.enabled}
                    className={`mt-2 w-full rounded-xl border border-[#dccfb7] bg-white px-3 py-2.5 text-sm font-bold ${
                      !checkoutSettings.enabled ? "opacity-40" : ""
                    }`}
                  >
                    <option value="none">None</option>
                    <option value="fixed">Fixed amount</option>
                    <option value="percentage">Percentage</option>
                    <option value="custom-only">Manual only</option>
                  </select>
                </div>

                {/* Deposit amount (fixed) */}
                <div className="rounded-2xl bg-[#fcfaf6] p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
                    {checkoutSettings.depositMode === "percentage"
                      ? "Deposit %"
                      : "Deposit amount"}
                  </p>
                  {checkoutSettings.depositMode === "percentage" ? (
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={checkoutSettings.depositPercentage}
                      onChange={(event) =>
                        setCheckoutSettings((current) => ({
                          ...current,
                          depositPercentage: event.target.value,
                        }))
                      }
                      disabled={!checkoutSettings.enabled}
                      placeholder="20"
                      className={`mt-2 w-full rounded-xl border border-[#dccfb7] bg-white px-3 py-2.5 text-sm font-bold ${
                        !checkoutSettings.enabled ? "opacity-40" : ""
                      }`}
                    />
                  ) : (
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={checkoutSettings.depositAmount}
                      onChange={(event) =>
                        setCheckoutSettings((current) => ({
                          ...current,
                          depositAmount: event.target.value,
                        }))
                      }
                      disabled={!checkoutSettings.enabled}
                      placeholder="25.00"
                      className={`mt-2 w-full rounded-xl border border-[#dccfb7] bg-white px-3 py-2.5 text-sm font-bold ${
                        !checkoutSettings.enabled ? "opacity-40" : ""
                      }`}
                    />
                  )}
                </div>

                {/* Currency */}
                <div className="rounded-2xl bg-[#fcfaf6] p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
                    Currency
                  </p>
                  <input
                    value={checkoutSettings.currency}
                    onChange={(event) =>
                      setCheckoutSettings((current) => ({
                        ...current,
                        currency: event.target.value.toUpperCase(),
                      }))
                    }
                    disabled={!checkoutSettings.enabled}
                    placeholder="USD"
                    maxLength={3}
                    className={`mt-2 w-full rounded-xl border border-[#dccfb7] bg-white px-3 py-2.5 text-sm font-bold uppercase ${
                      !checkoutSettings.enabled ? "opacity-40" : ""
                    }`}
                  />
                </div>
              </div>

              {/* Payment instructions */}
              <div className="mt-4">
                <div className="rounded-2xl bg-[#fcfaf6] p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
                    Payment instructions
                  </p>
                  <textarea
                    value={checkoutSettings.paymentInstructions}
                    onChange={(event) =>
                      setCheckoutSettings((current) => ({
                        ...current,
                        paymentInstructions: event.target.value,
                      }))
                    }
                    disabled={!checkoutSettings.enabled}
                    placeholder="Deposit confirms the table request. Balance is paid at the restaurant."
                    rows={3}
                    className={`mt-2 w-full rounded-xl border border-[#dccfb7] bg-white px-3 py-2.5 text-sm font-bold ${
                      !checkoutSettings.enabled ? "opacity-40" : ""
                    }`}
                  />
                </div>
              </div>

              <div className="mt-5 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={saveCheckoutSettings}
                  disabled={savingCheckout}
                  className="rounded-2xl bg-[#234232] px-6 py-3 text-xs font-black uppercase tracking-[0.16em] text-white disabled:opacity-60"
                >
                  {savingCheckout ? "Saving..." : "Save checkout settings"}
                </button>
              </div>
            </section>

            <section className="mt-8 rounded-[28px] border border-[#dccfb7] bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#8b7451]">
                    Assigned listings
                  </p>
                  <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
                    Restaurant context
                  </h2>
                </div>
                <p className="text-sm font-semibold text-slate-500">
                  {restaurants.length} assigned restaurant
                  {restaurants.length === 1 ? "" : "s"}
                </p>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {restaurants.map((restaurant) => (
                  <div
                    key={restaurant._id || restaurant.id || restaurant.slug || restaurant.name}
                    className="rounded-3xl border border-[#e8ddca] bg-[#fcfaf6] p-5"
                  >
                    <p className="text-lg font-black tracking-tight text-slate-950">
                      {restaurant.name}
                    </p>
                    <p className="mt-1 text-xs font-black uppercase tracking-[0.18em] text-[#8b7451]">
                      {restaurant.destination || "Destination pending"}
                    </p>
                    <p className="mt-3 text-sm font-medium leading-6 text-slate-600">
                      {restaurant.summary ||
                        "This assigned listing is ready for future restaurant partner tools."}
                    </p>
                  </div>
                ))}
              </div>

              {!restaurants.length ? (
                <div className="mt-5 rounded-3xl border border-dashed border-[#dccfb7] bg-[#fcfaf6] p-6 text-sm font-semibold text-slate-600">
                  No assigned restaurants are available in this session yet. Once
                  approved claims are linked, they will appear here.
                </div>
              ) : null}

              <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#eef6f0] px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-[#234232]">
                <FaStore />
                Restaurant partner dashboard phase one is active
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
};

export default RestaurantPartnerDashboard;
