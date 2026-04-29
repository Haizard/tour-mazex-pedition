import { useEffect, useMemo, useState } from "react";
import { FaCheckCircle, FaCopy, FaWhatsapp } from "react-icons/fa";

import Badge from "../UI/Badge";
import Button from "../UI/Button";
import Card from "../UI/Card";
import {
  fetchInquiries,
  fetchInquiryFollowUp,
  fetchInquiryQuotes,
  generateInquiryQuote,
  sendInquiryQuote,
  sendInquiryWhatsAppViaApi,
  startFollowUpSequence,
  updateFollowUpStatus,
  updateInquiryStatus,
} from "../../services/api";
import { generateQuotePdf } from "../../utils/quotePdfGenerator";

const STATUS_FILTERS = ["all", "Pending", "Contacted", "Booked", "Cancelled"];
const SOURCE_FILTERS = ["all", "website", "plan-my-trip", "whatsapp-button", "chatbot"];

const LeadInboxManager = () => {
  const [inquiries, setInquiries] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedSource, setSelectedSource] = useState("all");
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState("");
  const [copiedId, setCopiedId] = useState("");
  const [sendingWhatsAppId, setSendingWhatsAppId] = useState("");
  const [inquiryQuotes, setInquiryQuotes] = useState({}); // { inquiryId: [quotes] }
  const [inquiryFollowUps, setInquiryFollowUps] = useState({}); // { inquiryId: sequence }
  const [generatingQuoteId, setGeneratingQuoteId] = useState("");
  const [startingFollowUpId, setStartingFollowUpId] = useState("");
  const [error, setError] = useState("");

  const loadInquiries = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetchInquiries({ source: "postgres" });
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

  const handleSendWhatsApp = async (inquiry) => {
    setSendingWhatsAppId(inquiry._id);
    setError("");

    try {
      await sendInquiryWhatsAppViaApi(inquiry._id, {
        message: inquiry.followUpMessage,
      });
      await loadInquiries();
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Unable to send the WhatsApp Business message."
      );
    } finally {
      setSendingWhatsAppId("");
    }
  };

  const loadQuotesForInquiry = async (inquiryId) => {
    try {
      const response = await fetchInquiryQuotes(inquiryId);
      setInquiryQuotes((current) => ({
        ...current,
        [inquiryId]: response.data,
      }));
    } catch (_error) {
      // Silently fail quote loading or show a small indicator
    }
  };

  const handleGenerateQuote = async (inquiryId) => {
    setGeneratingQuoteId(inquiryId);
    setError("");
    try {
      await generateInquiryQuote(inquiryId);
      await loadQuotesForInquiry(inquiryId);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Failed to generate a quote for this lead.");
    } finally {
      setGeneratingQuoteId("");
    }
  };

  const handleSendQuote = async (inquiryId, quoteId) => {
    try {
      await sendInquiryQuote(inquiryId, quoteId);
      await loadQuotesForInquiry(inquiryId);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Failed to mark the quote as sent.");
    }
  };

  const loadFollowUpForInquiry = async (inquiryId) => {
    try {
      const response = await fetchInquiryFollowUp(inquiryId, { source: "postgres" });
      setInquiryFollowUps((current) => ({
        ...current,
        [inquiryId]: response.data,
      }));
    } catch (_error) {
      // Silently fail
    }
  };

  const handleStartFollowUp = async (inquiryId) => {
    setStartingFollowUpId(inquiryId);
    setError("");
    try {
      await startFollowUpSequence(inquiryId);
      await loadFollowUpForInquiry(inquiryId);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Failed to start follow-up sequence.");
    } finally {
      setStartingFollowUpId("");
    }
  };

  const handleUpdateFollowUpStatus = async (inquiryId, sequenceId, status) => {
    try {
      await updateFollowUpStatus(sequenceId, status);
      await loadFollowUpForInquiry(inquiryId);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Failed to update follow-up status.");
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

                    {/* Quotes Section */}
                    <div className="mt-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900">
                          Custom Proposals
                        </h4>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleGenerateQuote(inquiry._id)}
                          disabled={generatingQuoteId === inquiry._id}
                        >
                          {generatingQuoteId === inquiry._id ? "Generating..." : "Generate New Quote"}
                        </Button>
                      </div>

                      <div className="grid gap-3">
                        {inquiryQuotes[inquiry._id]?.length > 0 ? (
                          inquiryQuotes[inquiry._id].map((quote) => (
                            <div key={quote._id} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-slate-50/50 px-4 py-3">
                              <div>
                                <p className="text-[11px] font-bold text-slate-900">{quote.title}</p>
                                <div className="mt-1 flex gap-2">
                                  <span className={`text-[9px] font-black uppercase tracking-widest ${quote.status === "sent" ? "text-primary" : quote.status === "accepted" ? "text-emerald-600" : "text-slate-400"}`}>
                                    {quote.status}
                                  </span>
                                  <span className="text-[9px] font-bold text-slate-400">
                                    {quote.currency} {quote.totalPrice.toLocaleString()}
                                  </span>
                                </div>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  onClick={() => window.open(`/quote/${quote.publicToken}`, "_blank")}
                                  className="text-[10px] font-black uppercase tracking-widest text-slate-600 hover:text-primary transition"
                                >
                                  Preview
                                </button>
                                <button
                                  type="button"
                                  onClick={() => generateQuotePdf(quote)}
                                  className="text-[10px] font-black uppercase tracking-widest text-slate-600 hover:text-primary transition"
                                >
                                  PDF
                                </button>
                                {quote.status === "draft" && (
                                  <button
                                    type="button"
                                    onClick={() => handleSendQuote(inquiry._id, quote._id)}
                                    className="text-[10px] font-black uppercase tracking-widest text-primary transition"
                                  >
                                    Mark Sent
                                  </button>
                                )}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="flex items-center justify-center rounded-2xl border border-dashed border-slate-200 py-4">
                            <button
                              type="button"
                              onClick={() => loadQuotesForInquiry(inquiry._id)}
                              className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600"
                            >
                              Load existing quotes
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Follow-Up Sequence Section */}
                    <div className="mt-8 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900">
                          Automated Follow-Up
                        </h4>
                        {!inquiryFollowUps[inquiry._id] && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleStartFollowUp(inquiry._id)}
                            disabled={startingFollowUpId === inquiry._id}
                          >
                            {startingFollowUpId === inquiry._id ? "Starting..." : "Start Sequence"}
                          </Button>
                        )}
                      </div>

                      {inquiryFollowUps[inquiry._id] ? (
                        <div className="rounded-[24px] border border-slate-100 bg-white p-5 shadow-sm">
                          <div className="mb-4 flex items-center justify-between">
                            <Badge variant={inquiryFollowUps[inquiry._id].status === "active" ? "accent" : "secondary"}>
                              {inquiryFollowUps[inquiry._id].status}
                            </Badge>
                            <div className="flex gap-2">
                              {inquiryFollowUps[inquiry._id].status === "active" ? (
                                <button
                                  type="button"
                                  onClick={() => handleUpdateFollowUpStatus(inquiry._id, inquiryFollowUps[inquiry._id]._id, "paused")}
                                  className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600"
                                >
                                  Pause
                                </button>
                              ) : inquiryFollowUps[inquiry._id].status === "paused" ? (
                                <button
                                  type="button"
                                  onClick={() => handleUpdateFollowUpStatus(inquiry._id, inquiryFollowUps[inquiry._id]._id, "active")}
                                  className="text-[10px] font-black uppercase tracking-widest text-primary hover:text-primary-dark"
                                >
                                  Resume
                                </button>
                              ) : null}
                              {["active", "paused"].includes(inquiryFollowUps[inquiry._id].status) && (
                                <button
                                  type="button"
                                  onClick={() => handleUpdateFollowUpStatus(inquiry._id, inquiryFollowUps[inquiry._id]._id, "cancelled")}
                                  className="text-[10px] font-black uppercase tracking-widest text-rose-400 hover:text-rose-600"
                                >
                                  Cancel
                                </button>
                              )}
                            </div>
                          </div>

                          <div className="space-y-4">
                            {inquiryFollowUps[inquiry._id].touchpoints.map((tp, idx) => (
                              <div key={idx} className="flex gap-4">
                                <div className="mt-1 flex flex-col items-center gap-1">
                                  <div className={`h-2 w-2 rounded-full ${tp.status === "sent" ? "bg-emerald-500" : "bg-slate-200"}`}></div>
                                  {idx < inquiryFollowUps[inquiry._id].touchpoints.length - 1 && <div className="h-full w-[1px] bg-slate-100"></div>}
                                </div>
                                <div className="pb-4">
                                  <div className="flex items-center gap-2">
                                    <p className="text-[10px] font-black uppercase tracking-wide text-slate-900">
                                      {new Date(tp.scheduledAt).toLocaleDateString()}
                                    </p>
                                    <span className={`text-[8px] font-black uppercase tracking-[0.15em] ${tp.status === "sent" ? "text-emerald-600" : "text-slate-400"}`}>
                                      {tp.status}
                                    </span>
                                  </div>
                                  <p className="mt-1 text-[11px] font-medium leading-relaxed text-slate-500 line-clamp-1 italic">
                                    &quot;{tp.content}&quot;
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center rounded-2xl border border-dashed border-slate-200 py-4">
                          <button
                            type="button"
                            onClick={() => loadFollowUpForInquiry(inquiry._id)}
                            className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600"
                          >
                            Check for active sequence
                          </button>
                        </div>
                      )}
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
                      <button
                        type="button"
                        onClick={() => handleSendWhatsApp(inquiry)}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#25D366] px-4 py-3 text-[11px] font-black uppercase tracking-widest text-white"
                      >
                        <FaWhatsapp />
                        {sendingWhatsAppId === inquiry._id
                          ? "Sending..."
                          : "Send Via API"}
                      </button>
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
