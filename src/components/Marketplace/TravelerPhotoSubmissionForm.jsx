import { useState } from "react";

import { createMarketplacePhoto, uploadMedia } from "../../services/api";
import { getMarketplaceTravelerSessionKey } from "./travelerSession";

const defaultForm = {
  email: "",
  bookingId: "",
  inquiryId: "",
  caption: "",
  mediaUrl: "",
};

const TravelerPhotoSubmissionForm = ({ tenantId = "", tourId = "", onSubmitted }) => {
  const [formData, setFormData] = useState(defaultForm);
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);

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
      let mediaUrl = formData.mediaUrl.trim();
      if (file) {
        const uploadResponse = await uploadMedia(file, tenantId);
        mediaUrl = uploadResponse.data?.url || "";
      }

      if (!mediaUrl) {
        throw new Error("Please provide a photo file or a media URL.");
      }

      const response = await createMarketplacePhoto({
        tenantId,
        tourId,
        sessionKey: getMarketplaceTravelerSessionKey(),
        email: formData.email,
        bookingId: formData.bookingId,
        inquiryId: formData.inquiryId,
        mediaUrl,
        caption: formData.caption,
      });

      setFormData(defaultForm);
      setFile(null);
      const createdPhoto = response.data || null;
      setStatus(
        createdPhoto?.moderationStatus === "approved"
          ? "Thanks. Your traveler photo is now visible in the package gallery."
          : "Thanks. Your traveler photo was submitted and is now waiting for operator approval."
      );
      onSubmitted?.(createdPhoto);
    } catch (error) {
      setStatus(error?.response?.data?.message || error.message || "Unable to submit the photo right now.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="rounded-[36px] border border-[#d8c8ae] bg-[#fbf8f1] p-6 shadow-[0_20px_70px_rgba(35,66,50,0.08)] md:p-8">
      <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#8b7451]">
        Submit A Photo
      </p>
      <h2 className="mt-2 text-2xl font-black uppercase tracking-tight text-slate-900">
        Share a traveler moment
      </h2>
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
              Caption
            </span>
            <input
              name="caption"
              value={formData.caption}
              onChange={handleChange}
              placeholder="Sunrise over camp"
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
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
            Upload image
          </span>
          <input
            type="file"
            accept="image/*"
            onChange={(event) => setFile(event.target.files?.[0] || null)}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none file:mr-4 file:rounded-full file:border-0 file:bg-[#224433] file:px-4 file:py-2 file:text-xs file:font-black file:uppercase file:tracking-[0.18em] file:text-white"
          />
        </label>

        <label className="space-y-2">
          <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
            Or paste a media URL
          </span>
          <input
            name="mediaUrl"
            value={formData.mediaUrl}
            onChange={handleChange}
            placeholder="https://..."
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </label>

        <button
          type="submit"
          disabled={submitting}
          className="rounded-full bg-[#224433] px-6 py-3 text-xs font-black uppercase tracking-[0.22em] text-white transition hover:bg-[#173324] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Submitting..." : "Submit photo"}
        </button>
        {status ? <p className="text-sm font-medium text-slate-600">{status}</p> : null}
      </form>
    </section>
  );
};

export default TravelerPhotoSubmissionForm;
