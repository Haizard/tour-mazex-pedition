/* eslint-disable react/prop-types */
import { useMemo, useState } from "react";
import { FaPaperPlane } from "react-icons/fa";
import { createInquiry } from "../../services/api";
import {
  buildRestaurantDirectInquirySubmission,
  createRestaurantDirectInquiryInitialState,
} from "./restaurantInquiryUtils";

const RestaurantDirectInquiryForm = ({ restaurant = {} }) => {
  const [form, setForm] = useState(() =>
    createRestaurantDirectInquiryInitialState({ restaurant })
  );
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  const payload = useMemo(
    () => buildRestaurantDirectInquirySubmission({ restaurant, traveler: form }),
    [restaurant, form]
  );

  const updateField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
    setStatus("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setStatus("");

    try {
      await createInquiry(payload);
      setStatus("Restaurant inquiry sent. The operator can now respond with dining-specific guidance.");
      setForm(createRestaurantDirectInquiryInitialState({ restaurant }));
    } catch (error) {
      console.error("Restaurant direct inquiry failed:", error);
      setStatus("We could not send this restaurant inquiry right now. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-5">
      <div className="grid gap-3 sm:grid-cols-2">
        {[
          ["firstName", "First name", "text"],
          ["lastName", "Last name", "text"],
          ["email", "Email", "email"],
          ["phone", "Phone or WhatsApp", "text"],
        ].map(([key, label, type]) => (
          <label key={key} className="block">
            <span className="mb-1 block text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
              {label}
            </span>
            <input
              required
              type={type}
              value={form[key]}
              onChange={(event) => updateField(key, event.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-3 py-3 text-sm font-medium outline-none focus:border-primary"
            />
          </label>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <label className="block">
          <span className="mb-1 block text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
            Dining date or window
          </span>
          <input
            required
            value={form.travelWhen}
            onChange={(event) => updateField("travelWhen", event.target.value)}
            placeholder="July 2026"
            className="w-full rounded-2xl border border-slate-200 px-3 py-3 text-sm font-medium outline-none focus:border-primary"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
            Adults
          </span>
          <input
            min="1"
            type="number"
            value={form.adults}
            onChange={(event) => updateField("adults", event.target.value)}
            className="w-full rounded-2xl border border-slate-200 px-3 py-3 text-sm font-medium outline-none focus:border-primary"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
            Trip days
          </span>
          <input
            min="1"
            type="number"
            value={form.tripLengthDays}
            onChange={(event) => updateField("tripLengthDays", event.target.value)}
            className="w-full rounded-2xl border border-slate-200 px-3 py-3 text-sm font-medium outline-none focus:border-primary"
          />
        </label>
      </div>

      <label className="block">
        <span className="mb-1 block text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
          Preferred reply
        </span>
        <select
          value={form.contactPreference}
          onChange={(event) => updateField("contactPreference", event.target.value)}
          className="w-full rounded-2xl border border-slate-200 px-3 py-3 text-sm font-bold outline-none focus:border-primary"
        >
          <option value="whatsapp">WhatsApp</option>
          <option value="email">Email</option>
          <option value="phone">Phone call</option>
        </select>
      </label>

      <label className="block">
        <span className="mb-1 block text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
          Dining request
        </span>
        <textarea
          required
          rows={4}
          value={form.message}
          onChange={(event) => updateField("message", event.target.value)}
          className="w-full rounded-2xl border border-slate-200 px-3 py-3 text-sm font-medium leading-6 outline-none focus:border-primary"
        />
      </label>

      <button
        type="submit"
        disabled={loading}
        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#234232] px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-white disabled:bg-slate-300"
      >
        <FaPaperPlane /> {loading ? "Sending..." : "Send Restaurant Inquiry"}
      </button>

      {status ? <p className="text-sm font-semibold text-slate-600">{status}</p> : null}
    </form>
  );
};

export default RestaurantDirectInquiryForm;
