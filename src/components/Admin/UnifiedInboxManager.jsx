import { useEffect, useMemo, useState } from "react";
import { FaCopy, FaEnvelopeOpenText, FaInbox, FaWhatsapp } from "react-icons/fa";

import Badge from "../UI/Badge";
import Button from "../UI/Button";
import Card from "../UI/Card";
import {
  fetchUnifiedInboxItems,
  fetchWhatsAppTemplates,
  sendInquiryWhatsAppViaApi,
  updateInquiryStatus,
} from "../../services/api";

const CHANNEL_FILTERS = ["all", "whatsapp", "email", "lead"];

const statusTone = {
  Pending: "bg-amber-50 text-amber-700",
  Contacted: "bg-emerald-50 text-emerald-700",
  open: "bg-emerald-50 text-emerald-700",
  pending: "bg-amber-50 text-amber-700",
  closed: "bg-slate-100 text-slate-600",
  archived: "bg-slate-100 text-slate-600",
};

const UnifiedInboxManager = () => {
  const [items, setItems] = useState([]);
  const [counts, setCounts] = useState({ total: 0, whatsapp: 0, email: 0, open: 0 });
  const [selectedChannel, setSelectedChannel] = useState("all");
  const [loading, setLoading] = useState(true);
  const [sendingWhatsAppId, setSendingWhatsAppId] = useState("");
  const [savingId, setSavingId] = useState("");
  const [copiedId, setCopiedId] = useState("");
  const [templates, setTemplates] = useState([]);
  const [showTemplatePicker, setShowTemplatePicker] = useState(""); // itemId
  const [aiSuggestions, setAiSuggestions] = useState({}); // { itemId: string }
  const [error, setError] = useState("");

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetchUnifiedInboxItems();
      setItems(Array.isArray(response.data?.items) ? response.data.items : []);
      setCounts(response.data?.counts || { total: 0, whatsapp: 0, email: 0, open: 0 });
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to load the unified inbox right now.");
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = async () => {
    try {
      const response = await fetchWhatsAppTemplates();
      setTemplates(response.data || []);
    } catch (_err) {
      // Silently fail
    }
  };

  useEffect(() => {
    loadData();
    loadTemplates();
  }, []);

  const handleAiSuggest = (item) => {
    // Simulated AI suggestion based on inquiry context
    const firstName = item.linkedInquiry?.firstName || item.contactName?.split(" ")[0] || "Traveler";
    const suggestion = `Hi ${firstName}, I'm just checking in to see if you have any updates on your safari plans. I'd love to help you finalize the details!`;
    setAiSuggestions(curr => ({ ...curr, [item.id]: suggestion }));
  };

  const filteredItems = useMemo(
    () =>
      items.filter((item) => selectedChannel === "all" || item.channel === selectedChannel),
    [items, selectedChannel]
  );

  const handleCopy = async (item) => {
    const copyText =
      item.linkedInquiry?.followUpMessage ||
      item.linkedInquiry?.automationSummary ||
      item.preview ||
      "";

    try {
      await navigator.clipboard.writeText(copyText);
      setCopiedId(item.id);
      window.setTimeout(() => setCopiedId(""), 1800);
    } catch (_error) {
      setError("Copy failed. Your browser blocked clipboard access.");
    }
  };

  const handleSendWhatsApp = async (item) => {
    if (!item.linkedInquiry?._id) {
      return;
    }

    setSendingWhatsAppId(item.id);
    setError("");
    try {
      await sendInquiryWhatsAppViaApi(item.linkedInquiry._id, {
        message:
          item.linkedInquiry.followUpMessage ||
          item.linkedInquiry.automationSummary ||
          item.preview,
      });
      await loadData();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to send the WhatsApp automation.");
    } finally {
      setSendingWhatsAppId("");
    }
  };

  const handleMarkContacted = async (item) => {
    if (!item.linkedInquiry?._id) {
      return;
    }

    setSavingId(item.id);
    setError("");
    try {
      await updateInquiryStatus(item.linkedInquiry._id, "Contacted");
      await loadData();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to update the inquiry status.");
    } finally {
      setSavingId("");
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="mb-2 text-[10px] font-black uppercase tracking-[0.3em] text-primary">
            Unified Inbox
          </p>
          <h2 className="text-3xl font-black uppercase tracking-tighter text-gray-900">
            One Queue For Email And WhatsApp
          </h2>
          <p className="mt-2 max-w-3xl text-sm font-medium text-slate-500">
            Work email threads and WhatsApp lead conversations in one operator inbox, with follow-up copy and send actions ready from the same screen.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Badge variant="primary">{counts.total} Items</Badge>
          <Badge variant="secondary">{counts.email} Email</Badge>
          <Badge variant="accent">{counts.whatsapp} WhatsApp</Badge>
        </div>
      </div>

      {error && (
        <div className="rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
          {error}
        </div>
      )}

      <Card className="border-none p-8 shadow-xl">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="mb-2 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
              Channels
            </p>
            <h3 className="text-2xl font-black uppercase tracking-tight text-slate-900">
              Conversation Feed
            </h3>
          </div>
          <Button type="button" variant="outline" onClick={loadData}>
            Refresh Inbox
          </Button>
        </div>

        <div className="mb-8 flex flex-wrap gap-2">
          {CHANNEL_FILTERS.map((channel) => (
            <button
              key={channel}
              type="button"
              onClick={() => setSelectedChannel(channel)}
              className={`rounded-full border px-4 py-2 text-[10px] font-black uppercase tracking-widest transition ${
                selectedChannel === channel
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-200 bg-white text-slate-500 hover:border-slate-400"
              }`}
            >
              {channel}
            </button>
          ))}
        </div>

        <div className="space-y-5">
          {loading && <p className="text-sm font-medium text-slate-500">Loading unified inbox...</p>}

          {!loading && filteredItems.length === 0 && (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-sm font-medium text-slate-500">
              No inbox items match the current filter.
            </div>
          )}

          {!loading &&
            filteredItems.map((item) => (
              <div key={item.id} className="rounded-[28px] border border-slate-200 bg-white p-5">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-black uppercase tracking-wide text-slate-900">
                        {item.contactName || item.title}
                      </p>
                      <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${statusTone[item.status] || "bg-slate-100 text-slate-600"}`}>
                        {item.status}
                      </span>
                      <Badge variant="secondary">{item.channel}</Badge>
                    </div>

                    <div className="grid gap-3 text-sm font-medium text-slate-600 md:grid-cols-2">
                      <p>
                        <span className="font-black text-slate-900">Title:</span> {item.title}
                      </p>
                      <p>
                        <span className="font-black text-slate-900">Contact:</span> {item.contactAddress || "Not provided"}
                      </p>
                    </div>

                    <p className="text-sm leading-6 text-slate-600">{item.preview || "No preview available yet."}</p>

                    {item.whatsappAutomation?.lastMessagePreview && (
                      <div className="rounded-[24px] bg-slate-50 px-4 py-4">
                        <p className="mb-2 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
                          Last WhatsApp Automation
                        </p>
                        <p className="text-sm font-medium leading-6 text-slate-700">
                          {item.whatsappAutomation.lastMessagePreview}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-3 xl:w-[240px]">
                    <button
                      type="button"
                      onClick={() => handleCopy(item)}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-[11px] font-black uppercase tracking-widest text-slate-600"
                    >
                      <FaCopy />
                      {copiedId === item.id ? "Copied" : "Copy Reply"}
                    </button>

                    {item.channel === "email" && (
                      <div className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-[11px] font-black uppercase tracking-widest text-white">
                        <FaEnvelopeOpenText />
                        Email Thread
                      </div>
                    )}

                    {item.linkedInquiry?._id && (
                      <button
                        type="button"
                        onClick={() => handleMarkContacted(item)}
                        disabled={savingId === item.id}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-[11px] font-black uppercase tracking-widest text-white"
                      >
                        <FaInbox />
                        {savingId === item.id ? "Saving..." : "Mark Contacted"}
                      </button>
                    )}

                    {item.channel === "whatsapp" && item.linkedInquiry?._id && (
                      <div className="flex flex-col gap-2">
                        <button
                          type="button"
                          onClick={() => handleSendWhatsApp(item)}
                          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#25D366] px-4 py-3 text-[11px] font-black uppercase tracking-widest text-white"
                        >
                          <FaWhatsapp />
                          {sendingWhatsAppId === item.id ? "Sending..." : "Send WhatsApp"}
                        </button>
                        
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setShowTemplatePicker(showTemplatePicker === item.id ? "" : item.id)}
                            className="flex-1 rounded-xl border border-slate-200 py-2 text-[9px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50"
                          >
                            Templates
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAiSuggest(item)}
                            className="flex-1 rounded-xl border border-primary/20 bg-primary/5 py-2 text-[9px] font-black uppercase tracking-widest text-primary hover:bg-primary/10"
                          >
                            AI Suggest
                          </button>
                        </div>
                      </div>
                    )}

                    {showTemplatePicker === item.id && (
                      <div className="mt-2 rounded-2xl border border-slate-100 bg-slate-50 p-3 space-y-2">
                        <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Select Template</p>
                        {templates.length > 0 ? (
                          templates.map(t => (
                            <button
                              key={t._id}
                              onClick={() => {
                                // Logic to populate message with template
                                setShowTemplatePicker("");
                              }}
                              className="w-full text-left p-2 rounded-lg hover:bg-white text-[10px] font-bold text-slate-700 transition"
                            >
                              {t.name}
                            </button>
                          ))
                        ) : (
                          <p className="text-[9px] font-medium text-slate-500 italic">No templates approved yet.</p>
                        )}
                      </div>
                    )}

                    {aiSuggestions[item.id] && (
                      <div className="mt-2 rounded-2xl border border-primary/10 bg-primary/5 p-4 animate-in fade-in slide-in-from-top-1">
                        <p className="mb-2 text-[8px] font-black uppercase tracking-widest text-primary">AI Suggested Reply</p>
                        <p className="text-[11px] font-medium leading-relaxed text-slate-700 italic">"{aiSuggestions[item.id]}"</p>
                        <button
                          onClick={() => {
                            // Logic to use this suggestion
                            setAiSuggestions(curr => {
                              const next = { ...curr };
                              delete next[item.id];
                              return next;
                            });
                          }}
                          className="mt-2 text-[9px] font-black uppercase tracking-widest text-primary"
                        >
                          Use Suggestion
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
        </div>
      </Card>
    </div>
  );
};

export default UnifiedInboxManager;
