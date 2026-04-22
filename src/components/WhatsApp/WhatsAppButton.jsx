import React from "react";
import { FaWhatsapp } from "react-icons/fa";
import { createWhatsAppLead } from "../../services/api";
import { useTenant } from "../../context/TenantContext";

const WhatsAppButton = () => {
  const { siteSettings, tenant } = useTenant();
  const [isOpen, setIsOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [form, setForm] = React.useState({
    name: "",
    phone: "",
    destination: "Tanzania Safari",
    travelWhen: "",
    budget: "",
    message: "",
  });

  const phoneNumber = siteSettings?.whatsapp || "+255710887798";

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
    setError("");
  };

  const handleQuickOpen = () => {
    setIsOpen((current) => !current);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.name.trim()) {
      setError("Please enter your name so we can prepare the WhatsApp handoff.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await createWhatsAppLead(form);
      const whatsappUrl = response.data?.automation?.whatsappUrl;

      if (whatsappUrl) {
        window.open(whatsappUrl, "_blank", "noopener,noreferrer");
      } else {
        const fallbackMessage = `Hello ${tenant?.name || "MAZ Expeditions"}, I would like help with ${form.destination}.`;
        window.open(
          `https://wa.me/${phoneNumber.replace(/[^\d]/g, "")}?text=${encodeURIComponent(fallbackMessage)}`,
          "_blank",
          "noopener,noreferrer"
        );
      }

      setForm({
        name: "",
        phone: "",
        destination: "Tanzania Safari",
        travelWhen: "",
        budget: "",
        message: "",
      });
      setIsOpen(false);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "We could not start the WhatsApp lead handoff right now."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 left-4 z-[1000] flex flex-col items-start gap-3">
      {isOpen && (
        <div className="w-[320px] rounded-[28px] border border-white/20 bg-white p-5 shadow-2xl">
          <div className="mb-4">
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-green-600">
              WhatsApp Lead
            </p>
            <h3 className="mt-1 text-lg font-black uppercase tracking-tight text-slate-900">
              Start With Context
            </h3>
            <p className="mt-2 text-xs font-medium leading-5 text-slate-500">
              Share the basics and we will prepare a WhatsApp handoff with your trip
              details already summarized.
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-bold text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Your name"
              className="w-full rounded-2xl bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 border-none focus:ring-2 focus:ring-green-500"
            />
            <input
              type="text"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="Phone number"
              className="w-full rounded-2xl bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 border-none focus:ring-2 focus:ring-green-500"
            />
            <input
              type="text"
              name="destination"
              value={form.destination}
              onChange={handleChange}
              placeholder="Destination"
              className="w-full rounded-2xl bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 border-none focus:ring-2 focus:ring-green-500"
            />
            <input
              type="text"
              name="travelWhen"
              value={form.travelWhen}
              onChange={handleChange}
              placeholder="Travel month or dates"
              className="w-full rounded-2xl bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 border-none focus:ring-2 focus:ring-green-500"
            />
            <input
              type="text"
              name="budget"
              value={form.budget}
              onChange={handleChange}
              placeholder="Budget range"
              className="w-full rounded-2xl bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 border-none focus:ring-2 focus:ring-green-500"
            />
            <textarea
              rows={3}
              name="message"
              value={form.message}
              onChange={handleChange}
              placeholder="Tell us what kind of safari you want"
              className="w-full rounded-[24px] bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 border-none focus:ring-2 focus:ring-green-500"
            />

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-[11px] font-black uppercase tracking-widest text-slate-500"
              >
                Close
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 rounded-2xl bg-[#25D366] px-4 py-3 text-[11px] font-black uppercase tracking-widest text-white"
              >
                {loading ? "Preparing..." : "Open WhatsApp"}
              </button>
            </div>
          </form>
        </div>
      )}

      <button
        onClick={handleQuickOpen}
        className="bg-[#25D366] text-white p-3 rounded-full shadow-xl hover:scale-110 transition-all duration-300 group flex items-center gap-2"
      >
        <FaWhatsapp size={24} />
        <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-500 font-black uppercase text-[10px] tracking-widest leading-none">
          WhatsApp
        </span>
      </button>
    </div>
  );
};

export default WhatsAppButton;
