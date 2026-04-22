import { useEffect, useMemo, useState } from "react";
import { FaCheckCircle, FaCopy, FaWhatsapp } from "react-icons/fa";

import Badge from "../UI/Badge";
import Button from "../UI/Button";
import Card from "../UI/Card";
import { fetchInquiries, updateInquiryStatus } from "../../services/api";

const STATUS_FILTERS = ["all", "Pending", "Contacted", "Booked", "Cancelled"];
const SOURCE_FILTERS = ["all", "website", "plan-my-trip", "whatsapp-button", "chatbot"];

const LeadInboxManager = () => {
  const [inquiries, setInquiries] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedSource, setSelectedSource] = useState("all");
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState("");
  const [copiedId, setCopiedId] = useState("");
  const [error, setError] = useState("");

  const loadInquiries = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetchInquiries();
      setInquiries(Array.isArray(response.data) ? response.data : []);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Unable to load lead inbox data right now."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInquiries();
  }, []);

  const filteredInquiries = useMemo(
    () =>
      inquiries.filter((inquiry) => {
        const matchesStatus =
          selectedStatus === "all" || inquiry.status === selectedStatus;
        const matchesSource =
          selectedSource === "all" ||
          (inquiry.sourceChannel || "website") === selectedSource;

        return matchesStatus && matchesSource;
      }),
    [inquiries, selectedSource, selectedStatus]
  );

  const stats = useMemo(
    () => ({
      total: inquiries.length,
      newLeads: inquiries.filter(
        (inquiry) => (inquiry.leadStage || "new") === "new"
      ).length,
      whatsapp: inquiries.filter(
        (inquiry) => inquiry.contactPreference === "whatsapp"
      ).length,
    }),
    [inquiries]
  );

  const handleStatusChange = async (inquiryId, status) => {
    setSavingId(inquiryId);
    setError("");

    try {
      await updateInquiryStatus(inquiryId, status);
      await loadInquiries();
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Unable to update lead status."
      );
    } finally {
      setSavingId("");
    }
  };

  const handleCopy = async (inquiry) => {
    const copyText =
      inquiry.followUpMessage ||
      inquiry.automationSummary ||
      inquiry.message ||
      "";

    try {
      await navigator.clipboard.writeText(copyText);
      setCopiedId(inquiry._id);
      window.setTimeout(() => {
        setCopiedId("");
      }, 1800);
    } catch (_error) {
      setError("Copy failed. Your browser blocked clipboard access.");
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-4">
        <div>
          <p className="text-primary text-[10px] font-black uppercase tracking-[0.3em] mb-2">
            Lead Inbox
          </p>
          <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tighter">
            Qualified Conversations
          </h2>
          <p className="text-sm text-slate-500 font-medium mt-2 max-w-3xl">
            Review website, trip-planner, and WhatsApp-origin leads in one place,
            then reuse the generated follow-up without rewriting each reply.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Badge variant="primary">{stats.total} Leads</Badge>
          <Badge variant="secondary">{stats.newLeads} New</Badge>
          <Badge variant="accent">{stats.whatsapp} WhatsApp</Badge>
        </div>
      </div>

      {error && (
        <div className="rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
          {error}
        </div>
      )}

      <Card className="p-8 border-none shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-2">
              Filters
            </p>
            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
              Lead Queue
            </h3>
          </div>

          <Button type="button" variant="outline" onClick={loadInquiries}>
            Refresh Inbox
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="flex flex-wrap gap-2">
            {STATUS_FILTERS.map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setSelectedStatus(status)}
                className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border transition ${
                  selectedStatus === status
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-white text-slate-500 border-slate-200 hover:border-slate-400"
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2 md:justify-end">
            {SOURCE_FILTERS.map((source) => (
              <button
                key={source}
                type="button"
                onClick={() => setSelectedSource(source)}
                className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border transition ${
                  selectedSource === source
                    ? "bg-primary text-white border-primary"
                    : "bg-white text-slate-500 border-slate-200 hover:border-slate-400"
                }`}
              >
                {source}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-5">
          {loading && (
            <p className="text-sm font-medium text-slate-500">
              Loading lead inbox...
            </p>
          )}

          {!loading && filteredInquiries.length === 0 && (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-sm font-medium text-slate-500">
              No leads match the current filters.
            </div>
          )}

          {!loading &&
            filteredInquiries.map((inquiry) => (
              <div
                key={inquiry._id}
                className="rounded-[28px] border border-slate-200 bg-white p-5"
              >
                <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-4">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-black uppercase tracking-wide text-slate-900">
                        {inquiry.name}
                      </p>
                      <Badge variant="primary">{inquiry.status}</Badge>
                      <Badge variant="secondary">
                        {inquiry.sourceChannel || "website"}
                      </Badge>
                      <Badge variant="accent">
                        {inquiry.contactPreference || "whatsapp"}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm font-medium text-slate-600">
                      <p>
                        <span className="font-black text-slate-900">Trip:</span>{" "}
                        {(inquiry.destinations || []).join(", ")}
                      </p>
                      <p>
                        <span className="font-black text-slate-900">When:</span>{" "}
                        {inquiry.travelWhen}
                      </p>
                      <p>
                        <span className="font-black text-slate-900">Budget:</span>{" "}
                        {inquiry.budget || "Not shared"}
                      </p>
                    </div>

                    <p className="text-sm text-slate-600 leading-6">
                      {inquiry.message}
                    </p>

                    <div className="rounded-[24px] bg-slate-50 px-4 py-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-2">
                        Suggested Reply
                      </p>
                      <p className="text-sm font-medium leading-6 text-slate-700">
                        {inquiry.followUpMessage || inquiry.automationSummary}
                      </p>
                    </div>
                  </div>

                  <div className="xl:w-[240px] flex flex-col gap-3">
                    <button
                      type="button"
                      onClick={() => handleCopy(inquiry)}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-[11px] font-black uppercase tracking-widest text-slate-600"
                    >
                      <FaCopy />
                      {copiedId === inquiry._id ? "Copied" : "Copy Reply"}
                    </button>

                    {inquiry.contactPreference === "whatsapp" && inquiry.followUpMessage && (
                      <a
                        href={`https://wa.me/${(inquiry.phone || "").replace(/[^\d]/g, "")}?text=${encodeURIComponent(inquiry.followUpMessage)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#25D366] px-4 py-3 text-[11px] font-black uppercase tracking-widest text-white"
                      >
                        <FaWhatsapp />
                        Open WhatsApp
                      </a>
                    )}

                    <button
                      type="button"
                      onClick={() => handleStatusChange(inquiry._id, "Contacted")}
                      disabled={savingId === inquiry._id}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-[11px] font-black uppercase tracking-widest text-white"
                    >
                      <FaCheckCircle />
                      {savingId === inquiry._id ? "Saving..." : "Mark Contacted"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </Card>
    </div>
  );
};

export default LeadInboxManager;
