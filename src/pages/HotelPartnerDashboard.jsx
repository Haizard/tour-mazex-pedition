import { useCallback, useEffect, useMemo, useState } from "react";
import {
  fetchHotelPartnerHotelChannels,
  fetchHotelPartnerAccommodationRequests,
  fetchHotelPartnerHotelInventory,
  fetchHotelPartnerHotels,
  syncHotelPartnerHotelChannel,
  updateHotelPartnerAccommodationRequest,
  updateHotelPartnerHotel,
  updateHotelPartnerHotelChannels,
  updateHotelPartnerHotelInventory,
} from "../services/api";
import {
  buildPartnerAccommodationResponsePayload,
  buildPartnerChannelPayload,
  buildPartnerInventoryPayload,
  buildPartnerHotelUpdatePayload,
  createEmptyPartnerChannelDraft,
  createEmptyPartnerHotelDraft,
  createEmptyPartnerInventoryDraft,
  createEmptyPartnerRequestDraft,
  filterPartnerAccommodationRequests,
  filterPartnerInventoryEntries,
  filterPartnerHotels,
} from "../components/HotelPartner/hotelPartnerDashboardState";

const toDraft = (hotel = {}) => ({
  ...createEmptyPartnerHotelDraft(),
  name: hotel.name || "",
  summary: hotel.summary || "",
  description: hotel.description || "",
  destination: hotel.destination || "",
  region: hotel.region || "",
  amenities: Array.isArray(hotel.amenities) ? hotel.amenities.join(", ") : "",
  roomStyleSummary: hotel.roomStyleSummary || "",
  photos: Array.isArray(hotel.photos) ? hotel.photos.join("\n") : "",
  trustSummary: hotel.trustSummary || "",
});

const HotelPartnerDashboard = () => {
  const [hotels, setHotels] = useState([]);
  const [activeHotelId, setActiveHotelId] = useState("");
  const [draft, setDraft] = useState(createEmptyPartnerHotelDraft());
  const [requests, setRequests] = useState([]);
  const [inventoryDraft, setInventoryDraft] = useState(createEmptyPartnerInventoryDraft());
  const [channelDraft, setChannelDraft] = useState(createEmptyPartnerChannelDraft());
  const [inventoryFilters, setInventoryFilters] = useState({ search: "", status: "" });
  const [requestDrafts, setRequestDrafts] = useState({});
  const [requestFilters, setRequestFilters] = useState({ search: "", status: "" });
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const filteredHotels = useMemo(() => filterPartnerHotels(hotels, search), [hotels, search]);
  const filteredRequests = useMemo(
    () => filterPartnerAccommodationRequests(requests, requestFilters),
    [requests, requestFilters]
  );
  const filteredInventoryEntries = useMemo(
    () =>
      (inventoryDraft.availabilityCalendar || [])
        .map((entry, index) => ({ entry, index }))
        .filter(({ entry }) => filterPartnerInventoryEntries([entry], inventoryFilters).length > 0),
    [inventoryDraft.availabilityCalendar, inventoryFilters]
  );
  const activeHotel = hotels.find((hotel) => String(hotel._id) === String(activeHotelId));

  const loadHotels = useCallback(async () => {
    const response = await fetchHotelPartnerHotels();
    const nextHotels = response.data.hotels || [];
    setHotels(nextHotels);
    const firstHotel = nextHotels[0] || null;
    if (firstHotel && !activeHotelId) {
      setActiveHotelId(firstHotel._id);
      setDraft(toDraft(firstHotel));
    }
  }, [activeHotelId]);

  const loadRequests = useCallback(async () => {
    const response = await fetchHotelPartnerAccommodationRequests();
    const nextRequests = response.data.requests || [];
    setRequests(nextRequests);
    setRequestDrafts((current) =>
      nextRequests.reduce((drafts, request) => {
        drafts[request._id] = current[request._id] || {
          ...createEmptyPartnerRequestDraft(),
          status: request.status === "cancelled" ? "cancelled" : "confirmed",
          reservationCode: request.reservationCode || "",
          notes: request.notes || "",
        };
        return drafts;
      }, {})
    );
  }, []);

  const loadInventory = useCallback(
    async (hotelId) => {
      if (!hotelId) {
        setInventoryDraft(createEmptyPartnerInventoryDraft());
        return;
      }

      const response = await fetchHotelPartnerHotelInventory(hotelId);
      setInventoryDraft({
        ...createEmptyPartnerInventoryDraft(),
        roomInventory: response.data?.roomInventory || [],
        availabilityCalendar: response.data?.availabilityCalendar || [],
        inventorySettings: {
          ...createEmptyPartnerInventoryDraft().inventorySettings,
          ...(response.data?.inventorySettings || {}),
        },
      });
    },
    []
  );

  const loadChannels = useCallback(
    async (hotelId) => {
      if (!hotelId) {
        setChannelDraft(createEmptyPartnerChannelDraft());
        return;
      }

      const response = await fetchHotelPartnerHotelChannels(hotelId);
      setChannelDraft({
        ...createEmptyPartnerChannelDraft(),
        checkoutSettings: {
          ...createEmptyPartnerChannelDraft().checkoutSettings,
          ...(response.data?.checkoutSettings || {}),
        },
        channelConnections: response.data?.channelConnections || [],
      });
    },
    []
  );

  useEffect(() => {
    Promise.all([loadHotels(), loadRequests()]).catch((error) => {
      setStatus(error.response?.data?.message || "Could not load assigned hotels.");
    });
  }, [loadHotels, loadRequests]);

  const selectHotel = (hotel) => {
    setActiveHotelId(hotel._id);
    setDraft(toDraft(hotel));
    setStatus("");
    loadInventory(hotel._id).catch((error) => {
      setStatus(error.response?.data?.message || "Could not load hotel inventory.");
    });
    loadChannels(hotel._id).catch((error) => {
      setStatus(error.response?.data?.message || "Could not load hotel channel settings.");
    });
  };

  useEffect(() => {
    if (activeHotelId) {
      loadInventory(activeHotelId).catch((error) => {
        setStatus(error.response?.data?.message || "Could not load hotel inventory.");
      });
      loadChannels(activeHotelId).catch((error) => {
        setStatus(error.response?.data?.message || "Could not load hotel channel settings.");
      });
    }
  }, [activeHotelId, loadChannels, loadInventory]);

  const saveHotel = async (event) => {
    event.preventDefault();
    if (!activeHotelId) {
      return;
    }

    setStatus("Saving...");
    await updateHotelPartnerHotel(activeHotelId, buildPartnerHotelUpdatePayload(draft));
    await loadHotels();
    setStatus("Profile saved for operator review.");
  };

  const saveInventory = async (event) => {
    event.preventDefault();
    if (!activeHotelId) {
      return;
    }

    setStatus("Saving inventory...");
    await updateHotelPartnerHotelInventory(activeHotelId, buildPartnerInventoryPayload(inventoryDraft));
    await loadInventory(activeHotelId);
    setStatus("Inventory saved.");
  };

  const saveChannels = async (event) => {
    event.preventDefault();
    if (!activeHotelId) {
      return;
    }

    setStatus("Saving channel settings...");
    await updateHotelPartnerHotelChannels(activeHotelId, buildPartnerChannelPayload(channelDraft));
    await loadChannels(activeHotelId);
    setStatus("Channel settings saved.");
  };

  const triggerChannelSync = async (provider) => {
    if (!activeHotelId || !provider) {
      return;
    }

    setStatus(`Running ${provider} sync...`);
    await syncHotelPartnerHotelChannel(activeHotelId, { provider, direction: "pull" });
    await loadChannels(activeHotelId);
    setStatus(`${provider} sync completed.`);
  };

  const updateRequestDraft = (requestId, key, value) => {
    setRequestDrafts((current) => ({
      ...current,
      [requestId]: {
        ...(current[requestId] || createEmptyPartnerRequestDraft()),
        [key]: value,
      },
    }));
  };

  const respondToRequest = async (event, requestId) => {
    event.preventDefault();
    setStatus("Sending response...");
    await updateHotelPartnerAccommodationRequest(
      requestId,
      buildPartnerAccommodationResponsePayload(requestDrafts[requestId])
    );
    await loadRequests();
    setStatus("Accommodation response shared with the operator.");
  };

  const updateRoomEntry = (index, key, value) => {
    setInventoryDraft((current) => {
      const nextRoomInventory = [...current.roomInventory];
      nextRoomInventory[index] = {
        ...(nextRoomInventory[index] || {}),
        [key]: value,
      };

      return {
        ...current,
        roomInventory: nextRoomInventory,
      };
    });
  };

  const updateAvailabilityEntry = (index, key, value) => {
    setInventoryDraft((current) => {
      const nextEntries = [...current.availabilityCalendar];
      nextEntries[index] = {
        ...(nextEntries[index] || {}),
        [key]: value,
      };

      return {
        ...current,
        availabilityCalendar: nextEntries,
      };
    });
  };

  return (
    <main className="min-h-screen bg-[#f6f7f9] px-6 py-10 text-slate-950">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-primary">
              Hotel Partner Portal
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight">Assigned hotel profiles</h1>
          </div>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search assigned hotels"
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold md:max-w-xs"
          />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[320px_1fr]">
          <aside className="space-y-3">
            {filteredHotels.map((hotel) => (
              <button
                key={hotel._id}
                type="button"
                onClick={() => selectHotel(hotel)}
                className={`w-full rounded-xl border p-4 text-left ${
                  String(activeHotelId) === String(hotel._id)
                    ? "border-primary bg-primary/10"
                    : "border-slate-200 bg-white"
                }`}
              >
                <p className="font-black">{hotel.name}</p>
                <p className="mt-1 text-xs font-bold uppercase tracking-wider text-slate-500">
                  {hotel.destination || "Destination pending"}
                </p>
              </button>
            ))}
          </aside>

          <form onSubmit={saveHotel} className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="mb-5">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                Profile controls
              </p>
              <h2 className="mt-2 text-2xl font-black">{activeHotel?.name || "Select a hotel"}</h2>
              <p className="mt-2 text-sm font-semibold text-slate-500">
                Visibility, publishing, and sponsored placement stay with the tourism tenant admin.
              </p>
            </div>

            {["name", "summary", "description", "destination", "region", "roomStyleSummary", "trustSummary"].map((field) => (
              <label key={field} className="mb-4 block">
                <span className="text-xs font-black uppercase tracking-widest text-slate-500">
                  {field}
                </span>
                <textarea
                  value={draft[field] || ""}
                  onChange={(event) => setDraft({ ...draft, [field]: event.target.value })}
                  className="mt-2 min-h-[48px] w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold"
                />
              </label>
            ))}

            <label className="mb-4 block">
              <span className="text-xs font-black uppercase tracking-widest text-slate-500">
                Amenities
              </span>
              <input
                value={draft.amenities}
                onChange={(event) => setDraft({ ...draft, amenities: event.target.value })}
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold"
              />
            </label>

            <label className="mb-4 block">
              <span className="text-xs font-black uppercase tracking-widest text-slate-500">
                Photo URLs
              </span>
              <textarea
                value={draft.photos}
                onChange={(event) => setDraft({ ...draft, photos: event.target.value })}
                className="mt-2 min-h-[90px] w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold"
              />
            </label>

            <div className="flex items-center justify-between gap-4">
              <p className="text-sm font-bold text-slate-500">{status}</p>
              <button
                type="submit"
                disabled={!activeHotelId}
                className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-black uppercase tracking-widest text-white disabled:opacity-50"
              >
                Save profile
              </button>
            </div>
          </form>
        </div>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                Accommodation requests
              </p>
              <h2 className="mt-2 text-2xl font-black">Operator requests for your hotels</h2>
              <p className="mt-2 text-sm font-semibold text-slate-500">
                Confirm, decline, or leave notes for reservations linked to your assigned hotels.
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <input
                value={requestFilters.search}
                onChange={(event) =>
                  setRequestFilters((current) => ({ ...current, search: event.target.value }))
                }
                placeholder="Search requests"
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold"
              />
              <select
                value={requestFilters.status}
                onChange={(event) =>
                  setRequestFilters((current) => ({ ...current, status: event.target.value }))
                }
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold"
              >
                <option value="">All statuses</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="mt-6 grid gap-4">
            {filteredRequests.map((request) => {
              const requestDraft = requestDrafts[request._id] || createEmptyPartnerRequestDraft();

              return (
                <form
                  key={request._id}
                  onSubmit={(event) => respondToRequest(event, request._id)}
                  className="rounded-xl border border-slate-200 p-4"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-lg font-black">{request.bookingGuestName || "Guest pending"}</p>
                      <p className="mt-1 text-sm font-semibold text-slate-500">
                        {request.hotelName || "Hotel"} · {request.roomPlan || "Room plan pending"}
                      </p>
                      <p className="mt-1 text-xs font-bold uppercase tracking-wider text-slate-400">
                        {request.checkInDate ? new Date(request.checkInDate).toLocaleDateString() : "Check-in pending"}
                        {" - "}
                        {request.checkOutDate ? new Date(request.checkOutDate).toLocaleDateString() : "Check-out pending"}
                      </p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black uppercase tracking-wider text-slate-600">
                      {request.status || "pending"}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-[180px_1fr]">
                    <select
                      value={requestDraft.status}
                      onChange={(event) => updateRequestDraft(request._id, "status", event.target.value)}
                      className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold"
                    >
                      <option value="confirmed">Confirm</option>
                      <option value="pending">Keep pending</option>
                      <option value="cancelled">Decline</option>
                    </select>
                    <input
                      value={requestDraft.reservationCode}
                      onChange={(event) => updateRequestDraft(request._id, "reservationCode", event.target.value)}
                      placeholder="Reservation code"
                      className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold"
                    />
                  </div>
                  <textarea
                    value={requestDraft.notes}
                    onChange={(event) => updateRequestDraft(request._id, "notes", event.target.value)}
                    placeholder="Response notes for the operator"
                    className="mt-3 min-h-[80px] w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold"
                  />
                  <button
                    type="submit"
                    className="mt-3 rounded-xl bg-slate-950 px-4 py-2 text-xs font-black uppercase tracking-widest text-white"
                  >
                    Send response
                  </button>
                </form>
              );
            })}
            {!filteredRequests.length ? (
              <p className="rounded-xl border border-dashed border-slate-200 py-10 text-center text-sm font-bold text-slate-500">
                No accommodation requests match this view.
              </p>
            ) : null}
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
              OTA checkout and channels
            </p>
            <h2 className="mt-2 text-2xl font-black">Pricing checkout and channel connections</h2>
            <p className="mt-2 text-sm font-semibold text-slate-500">
              Control deposit checkout behavior and keep channel sync settings visible beside inventory.
            </p>
          </div>

          <form onSubmit={saveChannels} className="mt-6 space-y-6">
            <div className="grid gap-3 md:grid-cols-3">
              {["currency", "taxPercent", "serviceFeePercent", "cleaningFee", "depositPercent", "checkInTime", "checkOutTime"].map((field) => (
                <input
                  key={field}
                  value={channelDraft.checkoutSettings[field] ?? ""}
                  onChange={(event) =>
                    setChannelDraft((current) => ({
                      ...current,
                      checkoutSettings: {
                        ...current.checkoutSettings,
                        [field]: event.target.value,
                      },
                    }))
                  }
                  placeholder={field}
                  className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold"
                />
              ))}
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <label className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold">
                <input
                  type="checkbox"
                  checked={channelDraft.checkoutSettings.allowPayNow === true}
                  onChange={(event) =>
                    setChannelDraft((current) => ({
                      ...current,
                      checkoutSettings: {
                        ...current.checkoutSettings,
                        allowPayNow: event.target.checked,
                      },
                    }))
                  }
                />
                Allow public pay-now checkout
              </label>
              <label className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold">
                <input
                  type="checkbox"
                  checked={channelDraft.checkoutSettings.instantBookable === true}
                  onChange={(event) =>
                    setChannelDraft((current) => ({
                      ...current,
                      checkoutSettings: {
                        ...current.checkoutSettings,
                        instantBookable: event.target.checked,
                      },
                    }))
                  }
                />
                Mark hotel as instant-bookable
              </label>
            </div>

            <textarea
              value={channelDraft.checkoutSettings.cancellationPolicy || ""}
              onChange={(event) =>
                setChannelDraft((current) => ({
                  ...current,
                  checkoutSettings: {
                    ...current.checkoutSettings,
                    cancellationPolicy: event.target.value,
                  },
                }))
              }
              placeholder="Cancellation policy"
              className="min-h-[96px] w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold"
            />

            <div className="rounded-xl border border-slate-200 p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-lg font-black">Channel connections</h3>
                <button
                  type="button"
                  onClick={() =>
                    setChannelDraft((current) => ({
                      ...current,
                      channelConnections: [
                        ...current.channelConnections,
                        {
                          provider: "manual",
                          status: "draft",
                          externalHotelId: "",
                          syncMode: "pull",
                          syncInventory: true,
                          syncRates: true,
                          syncRestrictions: false,
                          credentialSummary: "",
                          note: "",
                          lastSyncAt: null,
                          lastSyncStatus: "idle",
                          lastSyncMessage: "",
                          lastSyncDirection: "",
                          lastSyncSnapshot: {},
                        },
                      ],
                    }))
                  }
                  className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-black uppercase tracking-widest"
                >
                  Add connection
                </button>
              </div>

              <div className="space-y-4">
                {(channelDraft.channelConnections || []).map((connection, index) => (
                  <div key={`${connection.provider}-${index}`} className="rounded-xl border border-slate-200 p-4">
                    <div className="grid gap-3 md:grid-cols-4">
                      <select
                        value={connection.provider || "manual"}
                        onChange={(event) =>
                          setChannelDraft((current) => {
                            const nextConnections = [...current.channelConnections];
                            nextConnections[index] = {
                              ...nextConnections[index],
                              provider: event.target.value,
                            };
                            return { ...current, channelConnections: nextConnections };
                          })
                        }
                        className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold"
                      >
                        <option value="manual">Manual</option>
                        <option value="siteminder">SiteMinder</option>
                        <option value="cloudbeds">Cloudbeds</option>
                        <option value="little-hotelier">Little Hotelier</option>
                        <option value="booking-com">Booking.com</option>
                      </select>
                      <input
                        value={connection.externalHotelId || ""}
                        onChange={(event) =>
                          setChannelDraft((current) => {
                            const nextConnections = [...current.channelConnections];
                            nextConnections[index] = {
                              ...nextConnections[index],
                              externalHotelId: event.target.value,
                            };
                            return { ...current, channelConnections: nextConnections };
                          })
                        }
                        placeholder="External hotel id"
                        className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold"
                      />
                      <select
                        value={connection.syncMode || "pull"}
                        onChange={(event) =>
                          setChannelDraft((current) => {
                            const nextConnections = [...current.channelConnections];
                            nextConnections[index] = {
                              ...nextConnections[index],
                              syncMode: event.target.value,
                            };
                            return { ...current, channelConnections: nextConnections };
                          })
                        }
                        className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold"
                      >
                        <option value="pull">Pull</option>
                        <option value="push">Push</option>
                        <option value="bidirectional">Bidirectional</option>
                      </select>
                      <select
                        value={connection.status || "draft"}
                        onChange={(event) =>
                          setChannelDraft((current) => {
                            const nextConnections = [...current.channelConnections];
                            nextConnections[index] = {
                              ...nextConnections[index],
                              status: event.target.value,
                            };
                            return { ...current, channelConnections: nextConnections };
                          })
                        }
                        className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold"
                      >
                        <option value="draft">Draft</option>
                        <option value="connected">Connected</option>
                        <option value="paused">Paused</option>
                        <option value="error">Error</option>
                      </select>
                    </div>

                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                      <input
                        value={connection.credentialSummary || ""}
                        onChange={(event) =>
                          setChannelDraft((current) => {
                            const nextConnections = [...current.channelConnections];
                            nextConnections[index] = {
                              ...nextConnections[index],
                              credentialSummary: event.target.value,
                            };
                            return { ...current, channelConnections: nextConnections };
                          })
                        }
                        placeholder="Credential summary"
                        className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold"
                      />
                      <input
                        value={connection.note || ""}
                        onChange={(event) =>
                          setChannelDraft((current) => {
                            const nextConnections = [...current.channelConnections];
                            nextConnections[index] = {
                              ...nextConnections[index],
                              note: event.target.value,
                            };
                            return { ...current, channelConnections: nextConnections };
                          })
                        }
                        placeholder="Connection note"
                        className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold"
                      />
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs font-bold text-slate-500">
                      <span>Last sync: {connection.lastSyncAt ? new Date(connection.lastSyncAt).toLocaleString() : "Never"}</span>
                      <span>Status: {connection.lastSyncStatus || "idle"}</span>
                      {connection.lastSyncMessage ? <span>{connection.lastSyncMessage}</span> : null}
                    </div>
                    <button
                      type="button"
                      onClick={() => triggerChannelSync(connection.provider)}
                      className="mt-3 rounded-xl border border-slate-200 px-3 py-2 text-xs font-black uppercase tracking-widest"
                    >
                      Run sync
                    </button>
                  </div>
                ))}
                {!channelDraft.channelConnections?.length ? (
                  <p className="text-sm font-semibold text-slate-500">No channel connections yet.</p>
                ) : null}
              </div>
            </div>

            <button
              type="submit"
              disabled={!activeHotelId}
              className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-black uppercase tracking-widest text-white disabled:opacity-50"
            >
              Save checkout and channels
            </button>
          </form>
        </section>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                Live inventory
              </p>
              <h2 className="mt-2 text-2xl font-black">Room types and availability calendar</h2>
              <p className="mt-2 text-sm font-semibold text-slate-500">
                Manage room categories and dated availability without implying instant confirmation.
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <input
                value={inventoryFilters.search}
                onChange={(event) =>
                  setInventoryFilters((current) => ({ ...current, search: event.target.value }))
                }
                placeholder="Search room entries"
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold"
              />
              <select
                value={inventoryFilters.status}
                onChange={(event) =>
                  setInventoryFilters((current) => ({ ...current, status: event.target.value }))
                }
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold"
              >
                <option value="">All statuses</option>
                <option value="open">Open</option>
                <option value="limited">Limited</option>
                <option value="sold-out">Sold out</option>
                <option value="on-request">On request</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </div>

          <form onSubmit={saveInventory} className="mt-6 space-y-6">
            <div className="grid gap-3 md:grid-cols-2">
              <label className="block">
                <span className="text-xs font-black uppercase tracking-widest text-slate-500">
                  Default currency
                </span>
                <input
                  value={inventoryDraft.inventorySettings.defaultCurrency}
                  onChange={(event) =>
                    setInventoryDraft((current) => ({
                      ...current,
                      inventorySettings: {
                        ...current.inventorySettings,
                        defaultCurrency: event.target.value,
                      },
                    }))
                  }
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold"
                />
              </label>
              <label className="block">
                <span className="text-xs font-black uppercase tracking-widest text-slate-500">
                  Default status
                </span>
                <select
                  value={inventoryDraft.inventorySettings.defaultStatus}
                  onChange={(event) =>
                    setInventoryDraft((current) => ({
                      ...current,
                      inventorySettings: {
                        ...current.inventorySettings,
                        defaultStatus: event.target.value,
                      },
                    }))
                  }
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold"
                >
                  <option value="open">Open</option>
                  <option value="limited">Limited</option>
                  <option value="sold-out">Sold out</option>
                  <option value="on-request">On request</option>
                  <option value="closed">Closed</option>
                </select>
              </label>
            </div>

            <div className="rounded-xl border border-slate-200 p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-lg font-black">Room types</h3>
                <button
                  type="button"
                  onClick={() =>
                    setInventoryDraft((current) => ({
                      ...current,
                      roomInventory: [
                        ...current.roomInventory,
                        {
                          roomTypeCode: "",
                          label: "",
                          capacity: 2,
                          totalUnits: 0,
                          baseNightlyRate: "",
                          currency: current.inventorySettings.defaultCurrency || "USD",
                          boardBasis: "",
                          active: true,
                        },
                      ],
                    }))
                  }
                  className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-black uppercase tracking-widest"
                >
                  Add room type
                </button>
              </div>
              <div className="space-y-3">
                {inventoryDraft.roomInventory.map((entry, index) => (
                  <div key={`${entry.roomTypeCode || "room"}-${index}`} className="grid gap-3 md:grid-cols-6">
                    {["roomTypeCode", "label", "capacity", "totalUnits", "baseNightlyRate", "currency"].map((field) => (
                      <input
                        key={field}
                        value={entry[field] ?? ""}
                        onChange={(event) => updateRoomEntry(index, field, event.target.value)}
                        placeholder={field}
                        className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold"
                      />
                    ))}
                  </div>
                ))}
                {!inventoryDraft.roomInventory.length ? (
                  <p className="text-sm font-semibold text-slate-500">No room types yet.</p>
                ) : null}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-lg font-black">Availability calendar</h3>
                <button
                  type="button"
                  onClick={() =>
                    setInventoryDraft((current) => ({
                      ...current,
                      availabilityCalendar: [
                        ...current.availabilityCalendar,
                        {
                          date: "",
                          roomTypeCode: current.roomInventory[0]?.roomTypeCode || "",
                          status: current.inventorySettings.defaultStatus || "open",
                          availableUnits: 0,
                          nightlyRate: "",
                          currency: current.inventorySettings.defaultCurrency || "USD",
                          minStay: 1,
                          note: "",
                        },
                      ],
                    }))
                  }
                  className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-black uppercase tracking-widest"
                >
                  Add date row
                </button>
              </div>
              <div className="space-y-3">
                {filteredInventoryEntries.map(({ entry, index }) => (
                  <div key={`${entry.date || "date"}-${index}`} className="grid gap-3 md:grid-cols-7">
                    <input
                      type="date"
                      value={entry.date ? String(entry.date).slice(0, 10) : ""}
                      onChange={(event) => updateAvailabilityEntry(index, "date", event.target.value)}
                      className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold"
                    />
                    <input
                      value={entry.roomTypeCode || ""}
                      onChange={(event) => updateAvailabilityEntry(index, "roomTypeCode", event.target.value)}
                      placeholder="room type"
                      className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold"
                    />
                    <select
                      value={entry.status || "open"}
                      onChange={(event) => updateAvailabilityEntry(index, "status", event.target.value)}
                      className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold"
                    >
                      <option value="open">Open</option>
                      <option value="limited">Limited</option>
                      <option value="sold-out">Sold out</option>
                      <option value="on-request">On request</option>
                      <option value="closed">Closed</option>
                    </select>
                    <input
                      value={entry.availableUnits ?? ""}
                      onChange={(event) => updateAvailabilityEntry(index, "availableUnits", event.target.value)}
                      placeholder="units"
                      className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold"
                    />
                    <input
                      value={entry.nightlyRate ?? ""}
                      onChange={(event) => updateAvailabilityEntry(index, "nightlyRate", event.target.value)}
                      placeholder="rate"
                      className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold"
                    />
                    <input
                      value={entry.minStay ?? ""}
                      onChange={(event) => updateAvailabilityEntry(index, "minStay", event.target.value)}
                      placeholder="min stay"
                      className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold"
                    />
                    <input
                      value={entry.note || ""}
                      onChange={(event) => updateAvailabilityEntry(index, "note", event.target.value)}
                      placeholder="note"
                      className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold"
                    />
                  </div>
                ))}
                {!filteredInventoryEntries.length ? (
                  <p className="text-sm font-semibold text-slate-500">No availability rows yet.</p>
                ) : null}
              </div>
            </div>

            <button
              type="submit"
              disabled={!activeHotelId}
              className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-black uppercase tracking-widest text-white disabled:opacity-50"
            >
              Save inventory
            </button>
          </form>
        </section>
      </div>
    </main>
  );
};

export default HotelPartnerDashboard;
