import { useEffect, useMemo, useState } from "react";

import Badge from "../UI/Badge";
import Button from "../UI/Button";
import Card from "../UI/Card";
import {
  createAirportPickup,
  deleteAirportPickup,
  fetchAirportPickupDashboard,
  fetchBookings,
  fetchGuideDrivers,
  updateAirportPickup,
} from "../../services/api";

const initialForm = {
  bookingId: "",
  driverId: "",
  airportCode: "JRO",
  flightNumber: "",
  pickupDateTime: "",
  destinationLabel: "",
  vehicleLabel: "",
  guestCount: 1,
  status: "pending",
  notes: "",
};

const statusTone = {
  pending: "bg-amber-50 text-amber-700",
  scheduled: "bg-sky-50 text-sky-700",
  completed: "bg-emerald-50 text-emerald-700",
  cancelled: "bg-rose-50 text-rose-700",
};

const AirportPickupManager = () => {
  const [pickups, setPickups] = useState([]);
  const [dispatchBoard, setDispatchBoard] = useState([]);
  const [arrivalTimeline, setArrivalTimeline] = useState([]);
  const [needsAttention, setNeedsAttention] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [stats, setStats] = useState({ total: 0, scheduled: 0, pending: 0, conflicts: 0 });
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const selectedBooking = useMemo(
    () => bookings.find((booking) => booking._id === form.bookingId),
    [bookings, form.bookingId]
  );

  const selectedDriver = useMemo(
    () => drivers.find((driver) => driver._id === form.driverId),
    [drivers, form.driverId]
  );

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [dashboardResponse, bookingsResponse, driverResponse] = await Promise.all([
        fetchAirportPickupDashboard({ source: "postgres" }),
        fetchBookings({ source: "postgres" }),
        fetchGuideDrivers({ source: "postgres" }),
      ]);

      setPickups(Array.isArray(dashboardResponse.data?.pickups) ? dashboardResponse.data.pickups : []);
      setDispatchBoard(Array.isArray(dashboardResponse.data?.board) ? dashboardResponse.data.board : []);
      setArrivalTimeline(Array.isArray(dashboardResponse.data?.arrivalTimeline) ? dashboardResponse.data.arrivalTimeline : []);
      setNeedsAttention(Array.isArray(dashboardResponse.data?.needsAttention) ? dashboardResponse.data.needsAttention : []);
      setStats(dashboardResponse.data?.stats || { total: 0, scheduled: 0, pending: 0, conflicts: 0 });
      setBookings(Array.isArray(bookingsResponse.data) ? bookingsResponse.data : []);
      setDrivers(
        Array.isArray(driverResponse.data)
          ? driverResponse.data.filter((member) => member.staffType === "driver")
          : []
      );
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Unable to load airport pickup coordination right now."
      );
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
      bookingId: form.bookingId || null,
      driverId: form.driverId || null,
      guestName: selectedBooking?.name || "",
      assignedTourTitle: selectedBooking?.packageTour || "",
      driverName: selectedDriver?.fullName || "",
      guestCount: Number(form.guestCount) || 1,
      pickupDateTime: form.pickupDateTime || null,
    };

    try {
      if (editingId) {
        await updateAirportPickup(editingId, payload);
      } else {
        await createAirportPickup(payload);
      }

      resetForm();
      await loadData();
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Unable to save this airport pickup."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (pickup) => {
    setEditingId(pickup._id);
    setForm({
      bookingId: pickup.bookingId || "",
      driverId: pickup.driverId || "",
      airportCode: pickup.airportCode || "JRO",
      flightNumber: pickup.flightNumber || "",
      pickupDateTime: pickup.pickupDateTime
        ? new Date(pickup.pickupDateTime).toISOString().slice(0, 16)
        : "",
      destinationLabel: pickup.destinationLabel || "",
      vehicleLabel: pickup.vehicleLabel || "",
      guestCount: pickup.guestCount || 1,
      status: pickup.status || "pending",
      notes: pickup.notes || "",
    });
  };

  const handleDelete = async (pickupId) => {
    setSaving(true);
    setError("");
    try {
      await deleteAirportPickup(pickupId);
      if (editingId === pickupId) {
        resetForm();
      }
      await loadData();
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Unable to delete this airport pickup."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="mb-2 text-[10px] font-black uppercase tracking-[0.3em] text-primary">
            Operations Desk
          </p>
          <h2 className="text-3xl font-black uppercase tracking-tighter text-gray-900">
            Airport Pickup Coordination
          </h2>
          <p className="mt-2 max-w-3xl text-sm font-medium text-slate-500">
            Schedule airport transfers, assign drivers, track flights, and keep arrivals aligned with each booking.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Badge variant="accent">{stats.total} Transfers</Badge>
          <Badge variant="secondary">{stats.scheduled} Scheduled</Badge>
          <Badge variant="secondary">{stats.pending} Pending</Badge>
          <Badge variant="secondary">{stats.conflicts} Conflicts</Badge>
          <Badge variant="secondary">{needsAttention.length} Need Briefing</Badge>
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
            {editingId ? "Edit Pickup" : "Create Pickup"}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <select
                value={form.bookingId}
                onChange={(event) => {
                  const nextBookingId = event.target.value;
                  const booking = bookings.find((item) => item._id === nextBookingId);
                  const pickupDateTime = booking?.travelDate
                    ? new Date(booking.travelDate).toISOString().slice(0, 16)
                    : "";

                  setForm((current) => ({
                    ...current,
                    bookingId: nextBookingId,
                    guestCount: booking?.pax || 1,
                    pickupDateTime,
                  }));
                }}
                className="w-full rounded-2xl border-none bg-slate-50 px-4 py-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-primary"
              >
                <option value="">No booking linked</option>
                {bookings.map((booking) => (
                  <option key={booking._id} value={booking._id}>
                    {booking.name} - {booking.packageTour || "Custom"}
                  </option>
                ))}
              </select>
              <select
                value={form.driverId}
                onChange={(event) => setForm((current) => ({ ...current, driverId: event.target.value }))}
                className="w-full rounded-2xl border-none bg-slate-50 px-4 py-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-primary"
              >
                <option value="">No driver assigned yet</option>
                {drivers.map((driver) => (
                  <option key={driver._id} value={driver._id}>
                    {driver.fullName}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <input
                type="text"
                value={form.airportCode}
                onChange={(event) => setForm((current) => ({ ...current, airportCode: event.target.value.toUpperCase() }))}
                placeholder="Airport code"
                className="w-full rounded-2xl border-none bg-slate-50 px-4 py-4 text-sm font-bold uppercase text-slate-900 focus:ring-2 focus:ring-primary"
              />
              <input
                type="text"
                value={form.flightNumber}
                onChange={(event) => setForm((current) => ({ ...current, flightNumber: event.target.value.toUpperCase() }))}
                placeholder="Flight number"
                className="w-full rounded-2xl border-none bg-slate-50 px-4 py-4 text-sm font-bold uppercase text-slate-900 focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <input
                type="datetime-local"
                value={form.pickupDateTime}
                onChange={(event) => setForm((current) => ({ ...current, pickupDateTime: event.target.value }))}
                className="w-full rounded-2xl border-none bg-slate-50 px-4 py-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-primary"
              />
              <input
                type="text"
                value={form.destinationLabel}
                onChange={(event) => setForm((current) => ({ ...current, destinationLabel: event.target.value }))}
                placeholder="Drop-off destination"
                className="w-full rounded-2xl border-none bg-slate-50 px-4 py-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-primary"
              />
              <input
                type="text"
                value={form.vehicleLabel}
                onChange={(event) => setForm((current) => ({ ...current, vehicleLabel: event.target.value }))}
                placeholder="Vehicle label"
                className="w-full rounded-2xl border-none bg-slate-50 px-4 py-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <input
                type="number"
                min="1"
                value={form.guestCount}
                onChange={(event) => setForm((current) => ({ ...current, guestCount: event.target.value }))}
                placeholder="Guest count"
                className="w-full rounded-2xl border-none bg-slate-50 px-4 py-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-primary"
              />
              <select
                value={form.status}
                onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}
                className="w-full rounded-2xl border-none bg-slate-50 px-4 py-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-primary"
              >
                <option value="pending">Pending</option>
                <option value="scheduled">Scheduled</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <textarea
              rows={4}
              value={form.notes}
              onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
              placeholder="Arrival notes, placard details, dispatch instructions..."
              className="w-full rounded-2xl border-none bg-slate-50 px-4 py-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-primary"
            />

            <div className="flex gap-3">
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : editingId ? "Update Pickup" : "Create Pickup"}
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
            Transfer Board
          </h3>

          <div className="space-y-4">
            {loading && (
              <p className="text-sm font-medium text-slate-500">Loading airport transfers...</p>
            )}

            {!loading && pickups.length === 0 && (
              <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-sm font-medium text-slate-500">
                No airport pickups added yet.
              </div>
            )}

            {!loading &&
              pickups.map((pickup) => (
                <div
                  key={pickup._id}
                  className="rounded-[28px] border border-slate-200 bg-white px-5 py-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-xs font-black uppercase tracking-wide text-slate-900">
                          {pickup.guestName || "Transfer"}
                        </p>
                        <span
                          className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${
                            statusTone[pickup.status] || statusTone.pending
                          }`}
                        >
                          {pickup.status}
                        </span>
                        <Badge variant="secondary">{pickup.airportCode}</Badge>
                        {pickup.conflictCount > 0 && (
                          <Badge variant="secondary">{pickup.conflictCount} Conflict{pickup.conflictCount > 1 ? "s" : ""}</Badge>
                        )}
                      </div>
                      <p className="text-sm font-medium leading-6 text-slate-600">
                        {pickup.coordinationSummary?.summary || "No airport pickup summary available."}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {pickup.assignedTourTitle && (
                          <Badge variant="secondary">{pickup.assignedTourTitle}</Badge>
                        )}
                        {pickup.flightNumber && (
                          <Badge variant="secondary">{pickup.flightNumber}</Badge>
                        )}
                        {pickup.destinationLabel && (
                          <Badge variant="secondary">{pickup.destinationLabel}</Badge>
                        )}
                        {pickup.vehicleLabel && (
                          <Badge variant="secondary">{pickup.vehicleLabel}</Badge>
                        )}
                      </div>
                      {pickup.conflictCount > 0 && (
                        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
                          {pickup.conflicts.map((conflict) => conflict.summary).join(". ")}
                        </div>
                      )}
                      {pickup.dispatchBrief && (
                        <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600">
                          {pickup.dispatchBrief}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={() => handleEdit(pickup)}
                        className="rounded-2xl border border-slate-200 px-4 py-2 text-[11px] font-black uppercase tracking-widest text-slate-700"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(pickup._id)}
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

      <Card className="border-none p-8 shadow-xl">
        <h3 className="mb-6 text-xl font-black uppercase tracking-tight text-slate-900">
          Arrival Dispatch Board
        </h3>

        <div className="space-y-4">
          {dispatchBoard.length === 0 && (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-sm font-medium text-slate-500">
              No active safari arrivals need transfer planning yet.
            </div>
          )}

          {dispatchBoard.map((item) => (
            <div
              key={item.bookingId}
              className="rounded-[28px] border border-slate-200 bg-white px-5 py-5"
            >
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-black uppercase tracking-wide text-slate-900">
                    {item.travelerName}
                  </p>
                  <p className="text-sm font-medium text-slate-600">{item.packageTour}</p>
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                    {item.travelDate ? new Date(item.travelDate).toLocaleDateString() : "Date pending"}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant={item.needsPickup ? "secondary" : "accent"}>
                    {item.needsPickup ? "Needs Transfer" : `${item.pickups.length} Transfer Plan${item.pickups.length > 1 ? "s" : ""}`}
                  </Badge>
                  {item.unassignedCount > 0 && (
                    <Badge variant="secondary">{item.unassignedCount} Unassigned</Badge>
                  )}
                  {item.hasConflict && <Badge variant="secondary">Conflict</Badge>}
                </div>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Assigned Drivers
                  </p>
                  <p className="mt-2 text-sm font-medium text-slate-700">
                    {item.assignedDrivers.length > 0
                      ? item.assignedDrivers.join(", ")
                      : "No driver assigned yet."}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Transfer Status
                  </p>
                  <p className="mt-2 text-sm font-medium text-slate-700">
                    {item.pickups.length > 0
                      ? item.pickups.map((pickup) => `${pickup.airportCode} ${pickup.status}`).join(", ")
                      : "No pickup workflow created yet."}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
        <Card className="border-none p-8 shadow-xl">
          <h3 className="mb-6 text-xl font-black uppercase tracking-tight text-slate-900">
            Arrival Timeline
          </h3>
          <div className="space-y-4">
            {arrivalTimeline.length === 0 && (
              <p className="text-sm font-medium text-slate-500">No arrival timeline entries yet.</p>
            )}
            {arrivalTimeline.map((pickup) => (
              <div key={pickup.pickupId} className="rounded-[28px] border border-slate-200 bg-slate-50 px-5 py-5">
                <p className="text-sm font-black uppercase tracking-wide text-slate-900">
                  {pickup.guestName} · {pickup.airportCode}
                </p>
                <p className="mt-2 text-sm font-medium text-slate-700">
                  {pickup.pickupDateTime ? new Date(pickup.pickupDateTime).toLocaleString() : "Pickup time pending"}
                </p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="border-none p-8 shadow-xl">
          <h3 className="mb-6 text-xl font-black uppercase tracking-tight text-slate-900">
            Dispatch Attention
          </h3>
          <div className="space-y-4">
            {needsAttention.length === 0 && (
              <p className="text-sm font-medium text-slate-500">No dispatch follow-up items right now.</p>
            )}
            {needsAttention.map((pickup) => (
              <div key={pickup._id} className="rounded-[28px] border border-amber-200 bg-amber-50 px-5 py-5">
                <p className="text-sm font-black uppercase tracking-wide text-slate-900">{pickup.guestName || "Guest Pickup"}</p>
                <p className="mt-2 text-sm font-medium text-slate-700">{pickup.coordinationSummary?.summary}</p>
                <p className="mt-2 text-xs font-bold uppercase tracking-widest text-slate-500">
                  Driver Brief
                </p>
                <p className="mt-2 text-sm font-medium text-slate-700">{pickup.dispatchBrief}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AirportPickupManager;
