import { useState } from "react";

import { createMarketplaceReview } from "../../services/api";
import { getMarketplaceTravelerSessionKey } from "./travelerSession";

const defaultForm = {
  email: "",
  bookingId: "",
  inquiryId: "",
  rating: "5",
  headline: "",
  reviewBody: "",
  travelMonth: "",
  travelerType: "",
  sentimentTags: "",
};

const ReviewSubmissionForm = ({ tenantId = "", tourId = "", onSubmitted }) => {
  const [formData, setFormData] = useState(defaultForm);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!tenantId || !tourId) {
      setStatus("This package is missing operator routing details.");
      return;
    }

    setSubmitting(true);
    setStatus("");

    try {
      const response = await createMarketplaceReview({
        tenantId,
        tourId,
        sessionKey: getMarketplaceTravelerSessionKey(),
        email: formData.email,
        bookingId: formData.bookingId,
        inquiryId: formData.inquiryId,
        rating: Number(formData.rating || 0),
        headline: formData.headline,
        reviewBody: formData.reviewBody,
        travelMonth: formData.travelMonth,
        travelerType: formData.travelerType,
        sentimentTags: formData.sentimentTags
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean)
          .slice(0, 5),
      });
      setFormData(defaultForm);
      const createdReview = response.data || null;
      setStatus(
        createdReview?.visibilityState === "public"
          ? "Thanks. Your review is now live on this package."
          : "Thanks. Your review was submitted and is now waiting for operator approval."
      );
      onSubmitted?.(createdReview);
    } catch (error) {
      setStatus(error?.response?.data?.message || "Unable to submit the review right now.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="rounded-[36px] border border-[#d8c8ae] bg-[#fbf8f1] p-6 shadow-[0_20px_70px_rgba(35,66,50,0.08)] md:p-8">
      <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#8b7451]">
        Share Your Review
      </p>
      <h2 className="mt-2 text-2xl font-black uppercase tracking-tight text-slate-900">
        Add verified trip feedback
      </h2>
      <p className="mt-3 text-sm font-medium leading-7 text-slate-600">
        Reviews need a real booking or inquiry reference so the marketplace can protect trust.
      </p>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
              Email
            </span>
            <input
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </label>
          <label className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
              Rating
            </span>
            <select
              name="rating"
              value={formData.rating}
              onChange={handleChange}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              {[5, 4, 3, 2, 1].map((value) => (
                <option key={value} value={value}>
                  {value} / 5
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
              Booking reference
            </span>
            <input
              name="bookingId"
              value={formData.bookingId}
              onChange={handleChange}
              placeholder="book_123"
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </label>
          <label className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
              Inquiry reference
            </span>
            <input
              name="inquiryId"
              value={formData.inquiryId}
              onChange={handleChange}
              placeholder="inq_123"
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </label>
        </div>

        <label className="space-y-2">
          <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
            Headline
          </span>
          <input
            name="headline"
            value={formData.headline}
            onChange={handleChange}
            required
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </label>

        <label className="space-y-2">
          <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
            Review
          </span>
          <textarea
            name="reviewBody"
            value={formData.reviewBody}
            onChange={handleChange}
            required
            rows={5}
            className="w-full rounded-[24px] border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </label>

        <div className="grid gap-4 md:grid-cols-3">
          <label className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
              Travel month
            </span>
            <input
              name="travelMonth"
              value={formData.travelMonth}
              onChange={handleChange}
              placeholder="July 2026"
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </label>
          <label className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
              Traveler type
            </span>
            <input
              name="travelerType"
              value={formData.travelerType}
              onChange={handleChange}
              placeholder="Couple, family, solo"
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </label>
          <label className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
              Sentiment tags
            </span>
            <input
              name="sentimentTags"
              value={formData.sentimentTags}
              onChange={handleChange}
              placeholder="guide, food, pacing"
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="rounded-full bg-[#224433] px-6 py-3 text-xs font-black uppercase tracking-[0.22em] text-white transition hover:bg-[#173324] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Submitting..." : "Submit review"}
        </button>
        {status ? <p className="text-sm font-medium text-slate-600">{status}</p> : null}
      </form>
    </section>
  );
};

export default ReviewSubmissionForm;
