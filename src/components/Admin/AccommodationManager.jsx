import { useEffect, useMemo, useState } from "react";

import Badge from "../UI/Badge";
import Button from "../UI/Button";
import Card from "../UI/Card";
import {
  fetchAccommodationDashboard,
  createAccommodationReservation,
  deleteAccommodationReservation,
  fetchAccommodationReservations,
  fetchBookings,
  updateAccommodationReservation,
} from "../../services/api";

const initialForm = {
  bookingId: "",
  hotelName: "",
  supplierName: "",
  supplierContact: "",
  destination: "",
  reservationCode: "",
  roomPlan: "",
  checkInDate: "",
  checkOutDate: "",
  guestCount: 1,
  status: "pending",
  notes: "",
};

const statusTone = {
  pending: "bg-amber-50 text-amber-700",
  confirmed: "bg-emerald-50 text-emerald-700",
  cancelled: "bg-rose-50 text-rose-700",
};

const AccommodationManager = () => {
  const [reservations, setReservations] = useState([]);
  const [coordinationBoard, setCoordinationBoard] = useState([]);
  const [stayTimeline, setStayTimeline] = useState([]);
  const [needsAttention, setNeedsAttention] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [stats, setStats] = useState({ total: 0, confirmed: 0, pending: 0, conflicts: 0 });
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const selectedBooking = useMemo(
    () => bookings.find((booking) => booking._id === form.bookingId),
    [bookings, form.bookingId]
  );

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [reservationResponse, dashboardResponse, bookingsResponse] = await Promise.all([
        fetchAccommodationReservations({ source: "postgres" }),
        fetchAccommodationDashboard({ source: "postgres" }),
        fetchBookings(),
      ]);

      setReservations(Array.isArray(reservationResponse.data) ? reservationResponse.data : []);
      setCoordinationBoard(Array.isArray(dashboardResponse.data?.board) ? dashboardResponse.data.board : []);
      setStayTimeline(Array.isArray(dashboardResponse.data?.stayTimeline) ? dashboardResponse.data.stayTimeline : []);
      setNeedsAttention(Array.isArray(dashboardResponse.data?.needsAttention) ? dashboardResponse.data.needsAttention : []);
      setStats(dashboardResponse.data?.stats || { total: 0, confirmed: 0, pending: 0, conflicts: 0 });
      setBookings(Array.isArray(bookingsResponse.data) ? bookingsResponse.data : []);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Unable to load accommodation coordination right now."
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
      bookingGuestName: selectedBooking?.name || "",
      assignedTourTitle: selectedBooking?.packageTour || "",
      guestCount: Number(form.guestCount) || 1,
      checkInDate: form.checkInDate || null,
      checkOutDate: form.checkOutDate || null,
    };

    try {
      if (editingId) {
        await updateAccommodationReservation(editingId, payload);
      } else {
        await createAccommodationReservation(payload);
      }

      resetForm();
      await loadData();
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Unable to save this accommodation reservation."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (reservation) => {
    setEditingId(reservation._id);
    setForm({
      bookingId: reservation.bookingId || "",
      hotelName: reservation.hotelName || "",
      supplierName: reservation.supplierName || "",
      supplierContact: reservation.supplierContact || "",
      destination: reservation.destination || "",
      reservationCode: reservation.reservationCode || "",
      roomPlan: reservation.roomPlan || "",
      checkInDate: reservation.checkInDate
        ? new Date(reservation.checkInDate).toISOString().slice(0, 10)
        : "",
      checkOutDate: reservation.checkOutDate
        ? new Date(reservation.checkOutDate).toISOString().slice(0, 10)
        : "",
      guestCount: reservation.guestCount || 1,
      status: reservation.status || "pending",
      notes: reservation.notes || "",
    });
  };

  const handleDelete = async (reservationId) => {
    setSaving(true);
    setError("");
    try {
      await deleteAccommodationReservation(reservationId);
      if (editingId === reservationId) {
        resetForm();
      }
      await loadData();
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Unable to delete this accommodation reservation."
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
            Accommodation Coordination
          </h2>
          <p className="mt-2 max-w-3xl text-sm font-medium text-slate-500">
            Manage hotel reservations, supplier contacts, room plans, and guest stays for each booking.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Badge variant="accent">{stats.total} Reservations</Badge>
          <Badge variant="secondary">{stats.confirmed} Confirmed</Badge>
          <Badge variant="secondary">{stats.pending} Pending</Badge>
          <Badge variant="secondary">{stats.conflicts} Conflicts</Badge>
          <Badge variant="secondary">{needsAttention.length} Need Action</Badge>
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
            {editingId ? "Edit Reservation" : "Add Reservation"}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <select
              value={form.bookingId}
              onChange={(event) => setForm((current) => ({ ...current, bookingId: event.target.value }))}
              className="w-full rounded-2xl border-none bg-slate-50 px-4 py-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-primary"
            >
              <option value="">No booking linked</option>
              {bookings.map((booking) => (
                <option key={booking._id} value={booking._id}>
                  {booking.name} - {booking.packageTour || "Custom"}
                </option>
              ))}
            </select>
            <div className="grid gap-4 md:grid-cols-2">
              <input
                type="text"
                value={form.hotelName}
                onChange={(event) => setForm((current) => ({ ...current, hotelName: event.target.value }))}
                placeholder="Hotel or lodge name"
                className="w-full rounded-2xl border-none bg-slate-50 px-4 py-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-primary"
              />
              <input
                type="text"
                value={form.destination}
                onChange={(event) => setForm((current) => ({ ...current, destination: event.target.value }))}
                placeholder="Destination"
                className="w-full rounded-2xl border-none bg-slate-50 px-4 py-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <input
                type="text"
                value={form.supplierName}
                onChange={(event) => setForm((current) => ({ ...current, supplierName: event.target.value }))}
                placeholder="Supplier name"
                className="w-full rounded-2xl border-none bg-slate-50 px-4 py-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-primary"
              />
              <input
                type="text"
                value={form.supplierContact}
                onChange={(event) => setForm((current) => ({ ...current, supplierContact: event.target.value }))}
                placeholder="Supplier contact"
                className="w-full rounded-2xl border-none bg-slate-50 px-4 py-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <input
                type="text"
                value={form.roomPlan}
                onChange={(event) => setForm((current) => ({ ...current, roomPlan: event.target.value }))}
                placeholder="Room plan"
                className="w-full rounded-2xl border-none bg-slate-50 px-4 py-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-primary"
              />
              <input
                type="text"
                value={form.reservationCode}
                onChange={(event) => setForm((current) => ({ ...current, reservationCode: event.target.value }))}
                placeholder="Reservation code"
                className="w-full rounded-2xl border-none bg-slate-50 px-4 py-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <input
                type="date"
                value={form.checkInDate}
                onChange={(event) => setForm((current) => ({ ...current, checkInDate: event.target.value }))}
                className="w-full rounded-2xl border-none bg-slate-50 px-4 py-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-primary"
              />
              <input
                type="date"
                value={form.checkOutDate}
                onChange={(event) => setForm((current) => ({ ...current, checkOutDate: event.target.value }))}
                className="w-full rounded-2xl border-none bg-slate-50 px-4 py-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-primary"
              />
              <input
                type="number"
                min="1"
                value={form.guestCount}
                onChange={(event) => setForm((current) => ({ ...current, guestCount: event.target.value }))}
                placeholder="Guest count"
                className="w-full rounded-2xl border-none bg-slate-50 px-4 py-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-primary"
              />
            </div>
            <select
              value={form.status}
              onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}
              className="w-full rounded-2xl border-none bg-slate-50 px-4 py-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-primary"
            >
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <textarea
              rows={4}
              value={form.notes}
              onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
              placeholder="Supplier notes, rooming list updates, guest requests..."
              className="w-full rounded-2xl border-none bg-slate-50 px-4 py-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-primary"
            />

            <div className="flex gap-3">
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : editingId ? "Update Reservation" : "Create Reservation"}
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
            Reservation Board
          </h3>

          <div className="space-y-4">
            {loading && (
              <p className="text-sm font-medium text-slate-500">
                Loading accommodation reservations...
              </p>
            )}

            {!loading && reservations.length === 0 && (
              <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-sm font-medium text-slate-500">
                No accommodation reservations added yet.
              </div>
            )}

            {!loading &&
              reservations.map((reservation) => (
                <div
                  key={reservation._id}
                  className="rounded-[28px] border border-slate-200 bg-white px-5 py-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-xs font-black uppercase tracking-wide text-slate-900">
                          {reservation.hotelName}
                        </p>
                        <span
                          className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${
                            statusTone[reservation.status] || statusTone.pending
                          }`}
                        >
                          {reservation.status}
                        </span>
                        {reservation.destination && (
                          <Badge variant="secondary">{reservation.destination}</Badge>
                        )}
                        {reservation.conflictCount > 0 && (
                          <Badge variant="secondary">{reservation.conflictCount} Conflict{reservation.conflictCount > 1 ? "s" : ""}</Badge>
                        )}
                      </div>
                      <p className="text-sm font-medium leading-6 text-slate-600">
                        {reservation.coordinationSummary?.summary ||
                          "No accommodation summary available."}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {reservation.bookingGuestName && (
                          <Badge variant="secondary">{reservation.bookingGuestName}</Badge>
                        )}
                        {reservation.assignedTourTitle && (
                          <Badge variant="secondary">{reservation.assignedTourTitle}</Badge>
                        )}
                        {reservation.roomPlan && (
                          <Badge variant="secondary">{reservation.roomPlan}</Badge>
                        )}
                        {reservation.reservationCode && (
                          <Badge variant="secondary">Ref {reservation.reservationCode}</Badge>
                        )}
                      </div>
                      {reservation.conflictCount > 0 && (
                        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
                          {reservation.conflicts.map((conflict) => conflict.summary).join(". ")}
                        </div>
                      )}
                      {reservation.supplierMessageDraft && (
                        <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600">
                          {reservation.supplierMessageDraft}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={() => handleEdit(reservation)}
                        className="rounded-2xl border border-slate-200 px-4 py-2 text-[11px] font-black uppercase tracking-widest text-slate-700"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(reservation._id)}
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
          Lodging Board
        </h3>

        <div className="space-y-4">
          {coordinationBoard.length === 0 && (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-sm font-medium text-slate-500">
              No confirmed safari departures need lodging coordination yet.
            </div>
          )}

          {coordinationBoard.map((item) => (
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
                  <Badge variant={item.needsAccommodation ? "secondary" : "accent"}>
                    {item.needsAccommodation ? "Needs Lodging" : `${item.reservations.length} Stay Plan${item.reservations.length > 1 ? "s" : ""}`}
                  </Badge>
                  {item.hasConflict && <Badge variant="secondary">Conflict</Badge>}
                </div>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Confirmed Stays
                  </p>
                  <p className="mt-2 text-sm font-medium text-slate-700">
                    {item.confirmedReservations.length > 0
                      ? item.confirmedReservations.map((reservation) => reservation.hotelName).join(", ")
                      : "No confirmed stays yet."}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Pending Follow-Up
                  </p>
                  <p className="mt-2 text-sm font-medium text-slate-700">
                    {item.pendingReservations.length > 0
                      ? item.pendingReservations.map((reservation) => reservation.hotelName).join(", ")
                      : "No pending supplier follow-ups."}
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
            Stay Timeline
          </h3>
          <div className="space-y-4">
            {stayTimeline.length === 0 && (
              <p className="text-sm font-medium text-slate-500">No stay timeline entries yet.</p>
            )}
            {stayTimeline.map((day) => (
              <div key={day.date} className="rounded-[28px] border border-slate-200 bg-slate-50 px-5 py-5">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{day.date}</p>
                <div className="mt-3 space-y-2">
                  {day.stays.map((stay) => (
                    <div key={`${day.date}-${stay.reservationId}`} className="rounded-2xl bg-white px-4 py-3 text-sm font-medium text-slate-700">
                      <span className="font-black text-slate-900">{stay.bookingGuestName || "Guest"}</span> · {stay.hotelName}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="border-none p-8 shadow-xl">
          <h3 className="mb-6 text-xl font-black uppercase tracking-tight text-slate-900">
            Supplier Attention
          </h3>
          <div className="space-y-4">
            {needsAttention.length === 0 && (
              <p className="text-sm font-medium text-slate-500">No supplier action items right now.</p>
            )}
            {needsAttention.map((reservation) => (
              <div key={reservation._id} className="rounded-[28px] border border-amber-200 bg-amber-50 px-5 py-5">
                <p className="text-sm font-black uppercase tracking-wide text-slate-900">{reservation.hotelName}</p>
                <p className="mt-2 text-sm font-medium text-slate-700">{reservation.coordinationSummary?.summary}</p>
                <p className="mt-2 text-xs font-bold uppercase tracking-widest text-slate-500">
                  Supplier Draft
                </p>
                <p className="mt-2 text-sm font-medium text-slate-700">{reservation.supplierMessageDraft}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AccommodationManager;
