import { useMemo, useState } from "react";
import { FaCalendarCheck, FaClock, FaUsers } from "react-icons/fa";
import { submitRestaurantReservationRequest } from "../../services/api";
import {
  buildRestaurantReservationPayload,
  getReservationAvailabilityTone,
  normalizeReservationOptions,
  validateReservationRequestForm,
} from "./restaurantReservationState";

const initialForm = {
  serviceWindowId: "",
  tableTypeId: "",
  travelerName: "",
  travelerEmail: "",
  travelerPhone: "",
  date: "",
  preferredTime: "",
  guestCount: 2,
  seatingPreference: "",
  dietaryNotes: "",
  occasion: "",
  publicNotes: "",
};

const RestaurantReservationWidget = ({ restaurant, options, context }) => {
  const normalizedOptions = useMemo(() => normalizeReservationOptions(options || {}), [options]);
  const availabilityTone = getReservationAvailabilityTone(
    normalizedOptions.availabilitySummary?.status
  );
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState("");
  const [submitError, setSubmitError] = useState("");

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
  };

  const submitRequest = async (event) => {
    event.preventDefault();
    const validationErrors = validateReservationRequestForm(form);
    setErrors(validationErrors);
    setSubmitError("");
    setSuccess("");

    if (Object.keys(validationErrors).length) {
      return;
    }

    setSubmitting(true);
    try {
      await submitRestaurantReservationRequest(
        restaurant.id || restaurant._id,
        buildRestaurantReservationPayload(form, context)
      );
      setSuccess("Reservation request sent. The restaurant team will confirm availability.");
      setForm(initialForm);
    } catch (error) {
      setSubmitError(
        error.response?.data?.message || "Unable to send this reservation request right now."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="rounded-[28px] border border-[#d8c8ae] bg-[#fcfaf6] p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#8b7451]">
            Reservation Request
          </p>
          <h3 className="mt-2 text-xl font-black tracking-tight text-slate-950">
            Request a table
          </h3>
        </div>
        <span className="rounded-full bg-[#eef6f0] px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-[#234232]">
          {availabilityTone.label}
        </span>
      </div>

      <form className="mt-5 space-y-4" onSubmit={submitRequest}>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
            Service
            <select
              value={form.serviceWindowId}
              onChange={(event) => updateField("serviceWindowId", event.target.value)}
              className="mt-2 w-full rounded-2xl border border-[#d8c8ae] bg-white px-3 py-3 text-sm font-bold normal-case tracking-normal text-slate-800"
            >
              <option value="">Any service</option>
              {normalizedOptions.serviceWindows.map((service) => (
                <option key={service.value} value={service.value}>
                  {service.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
            Seating
            <select
              value={form.tableTypeId}
              onChange={(event) => updateField("tableTypeId", event.target.value)}
              className="mt-2 w-full rounded-2xl border border-[#d8c8ae] bg-white px-3 py-3 text-sm font-bold normal-case tracking-normal text-slate-800"
            >
              <option value="">Best available</option>
              {normalizedOptions.tableTypes.map((tableType) => (
                <option key={tableType.value} value={tableType.value}>
                  {tableType.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <label className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
            <FaCalendarCheck className="mr-2 inline text-[#234232]" />
            Date
            <input
              type="date"
              value={form.date}
              onChange={(event) => updateField("date", event.target.value)}
              className="mt-2 w-full rounded-2xl border border-[#d8c8ae] bg-white px-3 py-3 text-sm font-bold normal-case tracking-normal text-slate-800"
            />
            {errors.date ? <span className="mt-1 block text-[11px] text-red-600">{errors.date}</span> : null}
          </label>
          <label className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
            <FaClock className="mr-2 inline text-[#234232]" />
            Time
            <input
              type="time"
              value={form.preferredTime}
              onChange={(event) => updateField("preferredTime", event.target.value)}
              className="mt-2 w-full rounded-2xl border border-[#d8c8ae] bg-white px-3 py-3 text-sm font-bold normal-case tracking-normal text-slate-800"
            />
            {errors.preferredTime ? <span className="mt-1 block text-[11px] text-red-600">{errors.preferredTime}</span> : null}
          </label>
          <label className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
            <FaUsers className="mr-2 inline text-[#234232]" />
            Guests
            <input
              type="number"
              min="1"
              value={form.guestCount}
              onChange={(event) => updateField("guestCount", event.target.value)}
              className="mt-2 w-full rounded-2xl border border-[#d8c8ae] bg-white px-3 py-3 text-sm font-bold normal-case tracking-normal text-slate-800"
            />
            {errors.guestCount ? <span className="mt-1 block text-[11px] text-red-600">{errors.guestCount}</span> : null}
          </label>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <label className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
            Name
            <input
              value={form.travelerName}
              onChange={(event) => updateField("travelerName", event.target.value)}
              className="mt-2 w-full rounded-2xl border border-[#d8c8ae] bg-white px-3 py-3 text-sm font-bold normal-case tracking-normal text-slate-800"
            />
            {errors.travelerName ? <span className="mt-1 block text-[11px] text-red-600">{errors.travelerName}</span> : null}
          </label>
          <label className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
            Email
            <input
              type="email"
              value={form.travelerEmail}
              onChange={(event) => updateField("travelerEmail", event.target.value)}
              className="mt-2 w-full rounded-2xl border border-[#d8c8ae] bg-white px-3 py-3 text-sm font-bold normal-case tracking-normal text-slate-800"
            />
            {errors.travelerEmail ? <span className="mt-1 block text-[11px] text-red-600">{errors.travelerEmail}</span> : null}
          </label>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <input
            placeholder="Phone or WhatsApp"
            value={form.travelerPhone}
            onChange={(event) => updateField("travelerPhone", event.target.value)}
            className="rounded-2xl border border-[#d8c8ae] bg-white px-3 py-3 text-sm font-bold text-slate-800"
          />
          <input
            placeholder="Occasion or seating preference"
            value={form.occasion}
            onChange={(event) => updateField("occasion", event.target.value)}
            className="rounded-2xl border border-[#d8c8ae] bg-white px-3 py-3 text-sm font-bold text-slate-800"
          />
        </div>

        <textarea
          placeholder="Dietary notes, timing details, or special requests"
          value={form.dietaryNotes}
          onChange={(event) => updateField("dietaryNotes", event.target.value)}
          className="min-h-24 w-full rounded-2xl border border-[#d8c8ae] bg-white px-3 py-3 text-sm font-bold text-slate-800"
        />

        {submitError ? <p className="text-sm font-bold text-red-600">{submitError}</p> : null}
        {success ? <p className="text-sm font-bold text-[#234232]">{success}</p> : null}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-2xl bg-[#234232] px-5 py-4 text-xs font-black uppercase tracking-[0.18em] text-white disabled:opacity-60"
        >
          {submitting ? "Sending..." : "Send reservation request"}
        </button>
      </form>
    </section>
  );
};

export default RestaurantReservationWidget;
