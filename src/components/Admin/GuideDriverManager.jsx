import { useEffect, useMemo, useState } from "react";

import Badge from "../UI/Badge";
import Button from "../UI/Button";
import Card from "../UI/Card";
import {
  createGuideDriver,
  deleteGuideDriver,
  fetchBookings,
  fetchGuideDriverDashboard,
  updateGuideDriver,
} from "../../services/api";

const initialForm = {
  staffType: "guide",
  fullName: "",
  phone: "",
  email: "",
  homeBase: "",
  availabilityStatus: "available",
  languages: "",
  specialties: "",
  assignedBookingId: "",
  assignmentDate: "",
  assignmentStartDate: "",
  assignmentEndDate: "",
  assignmentNotes: "",
  licenseCategory: "",
};

const availabilityTone = {
  available: "bg-emerald-50 text-emerald-700",
  assigned: "bg-sky-50 text-sky-700",
  "off-duty": "bg-slate-100 text-slate-600",
};

const GuideDriverManager = () => {
  const [team, setTeam] = useState([]);
  const [dispatchBoard, setDispatchBoard] = useState([]);
  const [calendarView, setCalendarView] = useState([]);
  const [needsAttention, setNeedsAttention] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [stats, setStats] = useState({ total: 0, available: 0, assigned: 0, offDuty: 0 });
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [selectedStaffType, setSelectedStaffType] = useState("all");
  const [selectedAvailability, setSelectedAvailability] = useState("all");

  const assignedBooking = useMemo(
    () => bookings.find((booking) => booking._id === form.assignedBookingId),
    [bookings, form.assignedBookingId]
  );

  const filteredTeam = useMemo(
    () =>
      team.filter((member) => {
        const staffTypeMatch = selectedStaffType === "all" || member.staffType === selectedStaffType;
        const availabilityMatch =
          selectedAvailability === "all" || member.availabilityStatus === selectedAvailability;
        return staffTypeMatch && availabilityMatch;
      }),
    [selectedAvailability, selectedStaffType, team]
  );

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [dashboardResponse, bookingsResponse] = await Promise.all([
        fetchGuideDriverDashboard({ source: "postgres" }),
        fetchBookings(),
      ]);

      setTeam(Array.isArray(dashboardResponse.data?.team) ? dashboardResponse.data.team : []);
      setDispatchBoard(
        Array.isArray(dashboardResponse.data?.dispatchBoard) ? dashboardResponse.data.dispatchBoard : []
      );
      setCalendarView(Array.isArray(dashboardResponse.data?.calendarView) ? dashboardResponse.data.calendarView : []);
      setNeedsAttention(Array.isArray(dashboardResponse.data?.needsAttention) ? dashboardResponse.data.needsAttention : []);
      setStats(dashboardResponse.data?.stats || { total: 0, available: 0, assigned: 0, offDuty: 0 });
      setBookings(Array.isArray(bookingsResponse.data) ? bookingsResponse.data : []);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to load guide and driver operations.");
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
      languages: form.languages
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
      specialties: form.specialties
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
      assignedTourTitle: assignedBooking?.packageTour || "",
      assignedBookingId: form.assignedBookingId || null,
      assignmentDate: form.assignmentDate || null,
      assignmentStartDate: form.assignmentStartDate || form.assignmentDate || null,
      assignmentEndDate: form.assignmentEndDate || form.assignmentStartDate || form.assignmentDate || null,
    };

    try {
      if (editingId) {
        await updateGuideDriver(editingId, payload);
      } else {
        await createGuideDriver(payload);
      }

      resetForm();
      await loadData();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to save this team member.");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (member) => {
    setEditingId(member._id);
    setForm({
      staffType: member.staffType || "guide",
      fullName: member.fullName || "",
      phone: member.phone || "",
      email: member.email || "",
      homeBase: member.homeBase || "",
      availabilityStatus: member.availabilityStatus || "available",
      languages: Array.isArray(member.languages) ? member.languages.join(", ") : "",
      specialties: Array.isArray(member.specialties) ? member.specialties.join(", ") : "",
      assignedBookingId: member.assignedBookingId || "",
      assignmentDate: member.assignmentDate ? new Date(member.assignmentDate).toISOString().slice(0, 10) : "",
      assignmentStartDate: member.assignmentStartDate ? new Date(member.assignmentStartDate).toISOString().slice(0, 10) : "",
      assignmentEndDate: member.assignmentEndDate ? new Date(member.assignmentEndDate).toISOString().slice(0, 10) : "",
      assignmentNotes: member.assignmentNotes || "",
      licenseCategory: member.licenseCategory || "",
    });
  };

  const handleDelete = async (memberId) => {
    setSaving(true);
    setError("");
    try {
      await deleteGuideDriver(memberId);
      if (editingId === memberId) {
        resetForm();
      }
      await loadData();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to delete this team member.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-primary text-[10px] font-black uppercase tracking-[0.3em] mb-2">
            Operations Desk
          </p>
          <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tighter">
            Guide And Driver Management
          </h2>
          <p className="text-sm text-slate-500 font-medium mt-2 max-w-3xl">
            Track your safari field team, mark availability, and attach each guide or driver to a live booking before departure.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Badge variant="accent">{stats.total} Team Members</Badge>
          <Badge variant="secondary">{stats.available} Available</Badge>
          <Badge variant="secondary">{stats.assigned} Assigned</Badge>
          <Badge variant="secondary">{stats.offDuty} Off Duty</Badge>
          <Badge variant="secondary">{needsAttention.length} Need Dispatch</Badge>
        </div>
      </div>

      {error && (
        <div className="rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[0.95fr_1.05fr] gap-8">
        <Card className="p-8 border-none shadow-xl">
          <h3 className="text-xl font-black uppercase tracking-tight text-slate-900 mb-6">
            {editingId ? "Edit Team Member" : "Add Team Member"}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <select
                value={form.staffType}
                onChange={(event) => setForm((current) => ({ ...current, staffType: event.target.value }))}
                className="w-full rounded-2xl bg-slate-50 px-4 py-4 text-sm font-bold text-slate-900 border-none focus:ring-2 focus:ring-primary"
              >
                <option value="guide">Guide</option>
                <option value="driver">Driver</option>
              </select>
              <select
                value={form.availabilityStatus}
                onChange={(event) => setForm((current) => ({ ...current, availabilityStatus: event.target.value }))}
                className="w-full rounded-2xl bg-slate-50 px-4 py-4 text-sm font-bold text-slate-900 border-none focus:ring-2 focus:ring-primary"
              >
                <option value="available">Available</option>
                <option value="assigned">Assigned</option>
                <option value="off-duty">Off Duty</option>
              </select>
            </div>

            <input
              type="text"
              value={form.fullName}
              onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))}
              placeholder="Full name"
              className="w-full rounded-2xl bg-slate-50 px-4 py-4 text-sm font-bold text-slate-900 border-none focus:ring-2 focus:ring-primary"
            />
            <div className="grid gap-4 md:grid-cols-2">
              <input
                type="text"
                value={form.phone}
                onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                placeholder="Phone number"
                className="w-full rounded-2xl bg-slate-50 px-4 py-4 text-sm font-bold text-slate-900 border-none focus:ring-2 focus:ring-primary"
              />
              <input
                type="email"
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                placeholder="Email address"
                className="w-full rounded-2xl bg-slate-50 px-4 py-4 text-sm font-bold text-slate-900 border-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <input
                type="text"
                value={form.homeBase}
                onChange={(event) => setForm((current) => ({ ...current, homeBase: event.target.value }))}
                placeholder="Home base"
                className="w-full rounded-2xl bg-slate-50 px-4 py-4 text-sm font-bold text-slate-900 border-none focus:ring-2 focus:ring-primary"
              />
              <input
                type="text"
                value={form.licenseCategory}
                onChange={(event) => setForm((current) => ({ ...current, licenseCategory: event.target.value }))}
                placeholder="License category (for drivers)"
                className="w-full rounded-2xl bg-slate-50 px-4 py-4 text-sm font-bold text-slate-900 border-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <input
              type="text"
              value={form.languages}
              onChange={(event) => setForm((current) => ({ ...current, languages: event.target.value }))}
              placeholder="Languages (comma separated)"
              className="w-full rounded-2xl bg-slate-50 px-4 py-4 text-sm font-bold text-slate-900 border-none focus:ring-2 focus:ring-primary"
            />
            <input
              type="text"
              value={form.specialties}
              onChange={(event) => setForm((current) => ({ ...current, specialties: event.target.value }))}
              placeholder="Specialties (birding, photography, luxury guests...)"
              className="w-full rounded-2xl bg-slate-50 px-4 py-4 text-sm font-bold text-slate-900 border-none focus:ring-2 focus:ring-primary"
            />
            <div className="grid gap-4 md:grid-cols-2">
              <select
                value={form.assignedBookingId}
                onChange={(event) => {
                  const nextBookingId = event.target.value;
                  const booking = bookings.find((item) => item._id === nextBookingId);
                  const bookingDate = booking?.travelDate
                    ? new Date(booking.travelDate).toISOString().slice(0, 10)
                    : "";

                  setForm((current) => ({
                    ...current,
                    assignedBookingId: nextBookingId,
                    assignmentDate: bookingDate,
                    assignmentStartDate: bookingDate,
                    assignmentEndDate: bookingDate,
                  }));
                }}
                className="w-full rounded-2xl bg-slate-50 px-4 py-4 text-sm font-bold text-slate-900 border-none focus:ring-2 focus:ring-primary"
              >
                <option value="">No booking assigned</option>
                {bookings.map((booking) => (
                  <option key={booking._id} value={booking._id}>
                    {booking.name} - {booking.packageTour || "Custom"}
                  </option>
                ))}
              </select>
              <input
                type="date"
                value={form.assignmentDate}
                onChange={(event) => setForm((current) => ({ ...current, assignmentDate: event.target.value }))}
                className="w-full rounded-2xl bg-slate-50 px-4 py-4 text-sm font-bold text-slate-900 border-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <input
                type="date"
                value={form.assignmentStartDate}
                onChange={(event) => setForm((current) => ({ ...current, assignmentStartDate: event.target.value }))}
                className="w-full rounded-2xl bg-slate-50 px-4 py-4 text-sm font-bold text-slate-900 border-none focus:ring-2 focus:ring-primary"
              />
              <input
                type="date"
                value={form.assignmentEndDate}
                onChange={(event) => setForm((current) => ({ ...current, assignmentEndDate: event.target.value }))}
                className="w-full rounded-2xl bg-slate-50 px-4 py-4 text-sm font-bold text-slate-900 border-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <textarea
              rows={4}
              value={form.assignmentNotes}
              onChange={(event) => setForm((current) => ({ ...current, assignmentNotes: event.target.value }))}
              placeholder="Assignment notes, pickup details, guest preferences..."
              className="w-full rounded-2xl bg-slate-50 px-4 py-4 text-sm font-bold text-slate-900 border-none focus:ring-2 focus:ring-primary"
            />

            <div className="flex gap-3">
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : editingId ? "Update Member" : "Create Member"}
              </Button>
              {editingId && (
                <Button type="button" variant="secondary" onClick={resetForm} disabled={saving}>
                  Cancel Edit
                </Button>
              )}
            </div>
          </form>
        </Card>

        <Card className="p-8 border-none shadow-xl">
          <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <h3 className="text-xl font-black uppercase tracking-tight text-slate-900">
            Field Team Roster
            </h3>
            <div className="flex flex-wrap gap-2">
              {["all", "guide", "driver"].map((staffType) => (
                <button
                  key={staffType}
                  type="button"
                  onClick={() => setSelectedStaffType(staffType)}
                  className={`rounded-full border px-4 py-2 text-[10px] font-black uppercase tracking-widest ${
                    selectedStaffType === staffType
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 bg-white text-slate-500"
                  }`}
                >
                  {staffType}
                </button>
              ))}
              {["all", "available", "assigned", "off-duty"].map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setSelectedAvailability(status)}
                  className={`rounded-full border px-4 py-2 text-[10px] font-black uppercase tracking-widest ${
                    selectedAvailability === status
                      ? "border-primary bg-primary text-white"
                      : "border-slate-200 bg-white text-slate-500"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {loading && (
              <p className="text-sm font-medium text-slate-500">Loading guide and driver roster...</p>
            )}

            {!loading && filteredTeam.length === 0 && (
              <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-sm font-medium text-slate-500">
                No guides or drivers added yet.
              </div>
            )}

            {!loading &&
              filteredTeam.map((member) => (
                <div key={member._id} className="rounded-[28px] border border-slate-200 bg-white px-5 py-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-xs font-black uppercase tracking-wide text-slate-900">
                          {member.fullName}
                        </p>
                        <Badge variant="primary">{member.staffType}</Badge>
                        <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${availabilityTone[member.availabilityStatus] || availabilityTone.available}`}>
                          {member.availabilityStatus}
                        </span>
                      </div>
                      <p className="text-sm font-medium leading-6 text-slate-600">
                        {member.assignmentSummary?.summary || "No assignment summary available."}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {(member.languages || []).map((language) => (
                          <Badge key={`${member._id}-${language}`} variant="secondary">
                            {language}
                          </Badge>
                        ))}
                        {(member.specialties || []).map((specialty) => (
                          <Badge key={`${member._id}-${specialty}`} variant="secondary">
                            {specialty}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={() => handleEdit(member)}
                        className="rounded-2xl border border-slate-200 px-4 py-2 text-[11px] font-black uppercase tracking-widest text-slate-700"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(member._id)}
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

      <Card className="p-8 border-none shadow-xl">
        <h3 className="mb-6 text-xl font-black uppercase tracking-tight text-slate-900">
          Dispatch Board
        </h3>
        <div className="space-y-4">
          {dispatchBoard.length === 0 && (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-sm font-medium text-slate-500">
              No confirmed safari departures need dispatching yet.
            </div>
          )}

          {dispatchBoard.map((item) => (
            <div key={item.bookingId} className="rounded-[28px] border border-slate-200 bg-white px-5 py-5">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-black uppercase tracking-wide text-slate-900">
                    {item.travelerName}
                  </p>
                  <p className="text-sm font-medium text-slate-600">
                    {item.packageTour}
                  </p>
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                    {item.travelDate ? new Date(item.travelDate).toLocaleDateString() : "Date pending"}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant={item.needsGuide ? "secondary" : "accent"}>
                    {item.needsGuide ? "Needs Guide" : `${item.assignedGuides.length} Guide Assigned`}
                  </Badge>
                  <Badge variant={item.needsDriver ? "secondary" : "accent"}>
                    {item.needsDriver ? "Needs Driver" : `${item.assignedDrivers.length} Driver Assigned`}
                  </Badge>
                </div>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Guide Coverage</p>
                  <p className="mt-2 text-sm font-medium text-slate-700">
                    {item.assignedGuides.length > 0
                      ? item.assignedGuides.map((member) => member.fullName).join(", ")
                      : "No guide assigned yet."}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Driver Coverage</p>
                  <p className="mt-2 text-sm font-medium text-slate-700">
                    {item.assignedDrivers.length > 0
                      ? item.assignedDrivers.map((member) => member.fullName).join(", ")
                      : "No driver assigned yet."}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
        <Card className="p-8 border-none shadow-xl">
          <h3 className="mb-6 text-xl font-black uppercase tracking-tight text-slate-900">
            Assignment Calendar
          </h3>
          <div className="space-y-4">
            {calendarView.length === 0 && (
              <p className="text-sm font-medium text-slate-500">No assignment calendar entries yet.</p>
            )}
            {calendarView.map((day) => (
              <div key={day.date} className="rounded-[28px] border border-slate-200 bg-slate-50 px-5 py-5">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{day.date}</p>
                <div className="mt-3 space-y-2">
                  {day.assignments.map((assignment) => (
                    <div key={`${day.date}-${assignment.memberId}`} className="rounded-2xl bg-white px-4 py-3 text-sm font-medium text-slate-700">
                      <span className="font-black text-slate-900">{assignment.fullName}</span> · {assignment.staffType} · {assignment.assignedTourTitle || "Assignment"}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-8 border-none shadow-xl">
          <h3 className="mb-6 text-xl font-black uppercase tracking-tight text-slate-900">
            Dispatch Attention
          </h3>
          <div className="space-y-4">
            {needsAttention.length === 0 && (
              <p className="text-sm font-medium text-slate-500">No pending dispatch follow-up right now.</p>
            )}
            {needsAttention.map((member) => (
              <div key={member._id} className="rounded-[28px] border border-amber-200 bg-amber-50 px-5 py-5">
                <p className="text-sm font-black uppercase tracking-wide text-slate-900">{member.fullName}</p>
                <p className="mt-2 text-sm font-medium text-slate-700">
                  {member.assignmentSummary?.summary}
                </p>
                <p className="mt-2 text-xs font-bold uppercase tracking-widest text-slate-500">
                  Dispatch Draft
                </p>
                <p className="mt-2 text-sm font-medium text-slate-700">
                  Share assignment notes, guest preferences, meeting point, and timing with this {member.staffType}.
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default GuideDriverManager;
