import { useEffect, useMemo, useState } from "react";
import {
  FaBolt,
  FaCopy,
  FaEnvelopeOpenText,
  FaExclamationTriangle,
  FaGlobeAfrica,
  FaInbox,
  FaRobot,
  FaWhatsapp,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

import Badge from "../UI/Badge";
import Button from "../UI/Button";
import Card from "../UI/Card";
import {
  fetchUnifiedInboxItems,
  fetchWhatsAppTemplates,
  recordUnifiedInboxAgentAction,
  sendInquiryWhatsAppViaApi,
  updateChatConversationStatus,
  updateContactMessageStatus,
  updateEmailThread,
  updateInquiryLeadStage,
  updateInquiryStatus,
} from "../../services/api";

const CHANNEL_FILTERS = ["all", "whatsapp", "email", "website", "lead"];

const statusTone = {
  Pending: "bg-amber-50 text-amber-700",
  Contacted: "bg-emerald-50 text-emerald-700",
  New: "bg-amber-50 text-amber-700",
  Read: "bg-sky-50 text-sky-700",
  Replied: "bg-emerald-50 text-emerald-700",
  open: "bg-emerald-50 text-emerald-700",
  pending: "bg-amber-50 text-amber-700",
  closed: "bg-slate-100 text-slate-600",
  archived: "bg-slate-100 text-slate-600",
  new: "bg-amber-50 text-amber-700",
  replied: "bg-sky-50 text-sky-700",
};

const priorityTone = {
  urgent: "border-red-200 bg-red-50 text-red-700",
  review: "border-amber-200 bg-amber-50 text-amber-700",
  normal: "border-sky-200 bg-sky-50 text-sky-700",
  low: "border-slate-200 bg-slate-50 text-slate-600",
};

const temperatureTone = {
  hot: "bg-red-100 text-red-700",
  warm: "bg-amber-100 text-amber-700",
  cold: "bg-slate-100 text-slate-600",
};

const actionTone = {
  reply: "border-emerald-200 bg-emerald-50 text-emerald-700",
  "follow-up": "border-sky-200 bg-sky-50 text-sky-700",
  review: "border-amber-200 bg-amber-50 text-amber-700",
  score: "border-slate-200 bg-slate-50 text-slate-600",
  tag: "border-stone-200 bg-stone-50 text-stone-700",
};

const revenuePriorityTone = {
  high: "border-red-200 bg-red-50 text-red-700",
  medium: "border-amber-200 bg-amber-50 text-amber-700",
  normal: "border-slate-200 bg-slate-50 text-slate-600",
};

const formatAgentLabel = (value = "") =>
  value
    .replace(/-/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const UnifiedInboxManager = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [counts, setCounts] = useState({
    total: 0,
    whatsapp: 0,
    email: 0,
    website: 0,
    lead: 0,
    open: 0,
    followUp: 0,
    humanReview: 0,
  });
  const [selectedChannel, setSelectedChannel] = useState("all");
  const [loading, setLoading] = useState(true);
  const [sendingWhatsAppId, setSendingWhatsAppId] = useState("");
  const [savingId, setSavingId] = useState("");
  const [loggingActionId, setLoggingActionId] = useState("");
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
      setCounts(
        response.data?.counts || {
          total: 0,
          whatsapp: 0,
          email: 0,
          website: 0,
          lead: 0,
          open: 0,
          followUp: 0,
          humanReview: 0,
        }
      );
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
    const firstName = item.linkedInquiry?.firstName || item.contactName?.split(" ")[0] || "Traveler";
    const decision = item.agentDecision;
    let suggestion = `Hi ${firstName}, I'm just checking in to see if you have any updates on your safari plans. I'd love to help you finalize the details!`;

    if (decision?.requiresHumanReview) {
      suggestion = `Review ${firstName}'s conversation before replying. The AI detected a guardrail risk, so confirm pricing, policy, or safety details with a human operator first.`;
    } else if (decision?.primaryAgent === "messaging-sales-agent") {
      suggestion = `Hi ${firstName}, thanks for your interest. I can help match the best tour package for your dates, group size, and budget. Would you like me to share the strongest options now?`;
    } else if (decision?.primaryAgent === "email-nurture-agent") {
      suggestion = `Hi ${firstName}, I wanted to follow up with a few helpful travel ideas based on your inquiry. If your plans are still active, I can send a short itinerary and next steps.`;
    }

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
      await Promise.all([
        updateInquiryStatus(item.linkedInquiry._id, "Contacted"),
        updateInquiryLeadStage(item.linkedInquiry._id, "follow-up"),
      ]);
      await loadData();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to update the inquiry status.");
    } finally {
      setSavingId("");
    }
  };

  const handleUpdateContactMessage = async (item, status) => {
    if (!item.linkedContactMessage?._id) {
      return;
    }

    setSavingId(item.id);
    setError("");
    try {
      await updateContactMessageStatus(item.linkedContactMessage._id, status);
      await loadData();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to update the website message status.");
    } finally {
      setSavingId("");
    }
  };

  const handleUpdateChatConversation = async (item, status) => {
    if (!item.linkedChatConversation?._id) {
      return;
    }

    setSavingId(item.id);
    setError("");
    try {
      await updateChatConversationStatus(item.linkedChatConversation._id, status);
      await loadData();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to update the live chat status.");
    } finally {
      setSavingId("");
    }
  };

  const handleReplyByEmail = async (item) => {
    const targetEmail =
      item.linkedContactMessage?.email ||
      item.linkedChatConversation?.visitorEmail ||
      item.contactAddress;

    if (!targetEmail || !targetEmail.includes("@")) {
      setError("No email address is available for this conversation yet.");
      return;
    }

    setSavingId(item.id);
    setError("");

    try {
      if (item.sourceType === "email-thread") {
        await updateEmailThread(item.sourceId, {
          replyInitiated: true,
          replyChannel: "email",
          replySource: "unified-inbox",
          status: "pending",
          aiDraftStatus: "sent",
        });
      } else if (item.linkedContactMessage?._id) {
        await updateContactMessageStatus(item.linkedContactMessage._id, "Replied");
      } else if (item.linkedChatConversation?._id) {
        await updateChatConversationStatus(item.linkedChatConversation._id, "replied");
      }

      window.location.href = `mailto:${targetEmail}`;
      await loadData();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to sync the reply state.");
    } finally {
      setSavingId("");
    }
  };

  const handleOpenSourceRecord = (item) => {
    if (item.linkedInquiry?._id) {
      navigate(`/admin?tab=inquiries&recordType=inquiry&recordId=${item.linkedInquiry._id}`);
      return;
    }

    if (item.linkedContactMessage?._id) {
      navigate(`/admin?tab=contact-messages&recordType=contact&recordId=${item.linkedContactMessage._id}`);
      return;
    }

    if (item.sourceType === "email-thread") {
      navigate(`/admin?tab=email-foundation&recordType=email-thread&recordId=${item.sourceId}`);
    }
  };

  const handleRecordAgentAction = async (item, action, actionIndex) => {
    if (!item.agentDecision) {
      return;
    }

    const actionId = `${item.id}-${action.type}-${actionIndex}`;
    setLoggingActionId(actionId);
    setError("");

    try {
      await recordUnifiedInboxAgentAction({
        item,
        decision: item.agentDecision,
        action,
        actionIndex,
        status: "completed",
        operatorNote: "Operator completed this recommended action from Unified Inbox.",
      });
      await loadData();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to log the agent action.");
    } finally {
      setLoggingActionId("");
    }
  };

  const handleManualRevenueAction = async (item, type) => {
    if (!item.agentDecision) {
      return;
    }

    const action = {
      type,
      label: type === "escalate" ? "Escalate for review" : "Queue follow-up",
      rationale:
        type === "escalate"
          ? "Operator flagged this conversation for human review."
          : "Operator scheduled the next follow-up step from the inbox.",
    };

    await handleRecordAgentAction(item, action, 0);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="mb-2 text-[10px] font-black uppercase tracking-[0.3em] text-primary">
            Unified Inbox
          </p>
          <h2 className="text-3xl font-black uppercase tracking-tighter text-gray-900">
            One Queue For Email, WhatsApp, And Website Leads
          </h2>
          <p className="mt-2 max-w-3xl text-sm font-medium text-slate-500">
            Work email threads, WhatsApp lead conversations, and website contact messages in one operator inbox, with follow-up copy and send actions ready from the same screen.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Badge variant="primary">{counts.total} Items</Badge>
          <Badge variant="secondary">{counts.email} Email</Badge>
          <Badge variant="accent">{counts.whatsapp} WhatsApp</Badge>
          <Badge variant="secondary">{counts.website} Website</Badge>
          <Badge variant="secondary">{counts.lead} Lead</Badge>
          <Badge variant="secondary">{counts.followUp} Follow-up</Badge>
          <Badge variant="secondary">{counts.humanReview} Human Review</Badge>
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
            filteredItems.map((item) => {
              const agentDecision = item.agentDecision || null;
              const recommendedActions = Array.isArray(agentDecision?.recommendedActions)
                ? agentDecision.recommendedActions
                : [];

              return (
              <div key={item.id} className="rounded-[28px] border border-slate-200 bg-white p-5">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="space-y-3 xl:flex-1">
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
                      <p>
                        <span className="font-black text-slate-900">Lead Source:</span> {item.leadSource || "unknown"}
                      </p>
                      <p>
                        <span className="font-black text-slate-900">Stage:</span> {item.conversionStage || "new"}
                      </p>
                      <p>
                        <span className="font-black text-slate-900">Channel Type:</span> {item.channelLabel || item.channel}
                      </p>
                      <p>
                        <span className="font-black text-slate-900">Campaign:</span> {item.campaignLabel || "Not tagged"}
                      </p>
                    </div>

                    <p className="text-sm leading-6 text-slate-600">{item.preview || "No preview available yet."}</p>

                    <div className="flex flex-wrap gap-2">
                      <span className={`rounded-full border px-3 py-1 text-[9px] font-black uppercase tracking-widest ${revenuePriorityTone[item.revenuePriority] || revenuePriorityTone.normal}`}>
                        {item.revenuePriority || "normal"} priority
                      </span>
                      {item.canFollowUp && (
                        <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-sky-700">
                          Follow-up ready
                        </span>
                      )}
                      {item.requiresHumanReview && (
                        <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-amber-700">
                          Human review
                        </span>
                      )}
                    </div>

                    {agentDecision && (
                      <div className="rounded-[26px] border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-amber-50/60 px-4 py-4 shadow-sm">
                        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <span className="grid h-9 w-9 place-items-center rounded-2xl bg-slate-900 text-white">
                              <FaRobot />
                            </span>
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
                                Agent Brain
                              </p>
                              <p className="text-sm font-black uppercase tracking-tight text-slate-900">
                                {formatAgentLabel(agentDecision.primaryAgent || "central-router")}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <span className={`rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-widest ${temperatureTone[agentDecision.leadTemperature] || temperatureTone.cold}`}>
                              {agentDecision.leadTemperature || "cold"} lead
                            </span>
                            <span className={`rounded-full border px-3 py-1 text-[9px] font-black uppercase tracking-widest ${priorityTone[agentDecision.priority] || priorityTone.normal}`}>
                              {agentDecision.priority || "normal"}
                            </span>
                          </div>
                        </div>

                        <div className="grid gap-3 text-xs font-bold text-slate-600 md:grid-cols-3">
                          <p>
                            <span className="block text-[9px] font-black uppercase tracking-widest text-slate-400">Next Action</span>
                            {formatAgentLabel(agentDecision.nextAction || "review")}
                          </p>
                          <p>
                            <span className="block text-[9px] font-black uppercase tracking-widest text-slate-400">Lead Score</span>
                            {agentDecision.leadScore ?? 0}/100
                          </p>
                          <p>
                            <span className="block text-[9px] font-black uppercase tracking-widest text-slate-400">Auto Reply</span>
                            {agentDecision.autoReplyAllowed ? "Allowed" : "Human check"}
                          </p>
                        </div>

                        {agentDecision.requiresHumanReview && (
                          <div className="mt-4 flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-bold leading-5 text-amber-800">
                            <FaExclamationTriangle className="mt-0.5 shrink-0" />
                            Human review required before AI sends or confirms sensitive details.
                          </div>
                        )}

                        {agentDecision.leadScoreReasons?.length > 0 && (
                          <div className="mt-4 flex flex-wrap gap-2">
                            {agentDecision.leadScoreReasons.slice(0, 3).map((reason) => (
                              <span
                                key={`${item.id}-reason-${reason}`}
                                className="rounded-full bg-white px-3 py-1 text-[10px] font-bold text-slate-500 ring-1 ring-slate-200"
                              >
                                {formatAgentLabel(reason)}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {item.channel === "website" && (
                      <div className="rounded-[24px] bg-slate-50 px-4 py-4">
                        <p className="mb-2 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
                          Website Lead
                        </p>
                        <p className="text-sm font-medium leading-6 text-slate-700">
                          {item.sourceType === "chat-conversation"
                            ? "Live website chat captured from the public AI assistant."
                            : "Submitted from the public contact flow and waiting for operator follow-up."}
                        </p>
                      </div>
                    )}

                    {item.linkedChatConversation?.transcript?.length > 0 && (
                      <div className="rounded-[24px] bg-white border border-slate-100 px-4 py-4">
                        <p className="mb-2 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
                          Recent Chat Transcript
                        </p>
                        <div className="space-y-2">
                          {item.linkedChatConversation.transcript.slice(-3).map((entry, index) => (
                            <p key={`${item.id}-transcript-${index}`} className="text-sm leading-6 text-slate-600">
                              <span className="font-black text-slate-900">
                                {entry.role === "user" ? "Visitor:" : "Assistant:"}
                              </span>{" "}
                              {entry.content}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}

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

                  <div className="flex flex-col gap-3 xl:w-[260px]">
                    {recommendedActions.length > 0 && (
                      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                        <div className="mb-3 flex items-center gap-2">
                          <FaBolt className="text-amber-500" />
                          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">
                            Recommended Actions
                          </p>
                        </div>
                        <div className="space-y-2">
                          {recommendedActions.slice(0, 3).map((action, index) => (
                            <div
                              key={`${item.id}-agent-action-${action.type}-${index}`}
                              className={`rounded-2xl border px-3 py-3 ${actionTone[action.type] || actionTone.tag}`}
                            >
                              <p className="text-[10px] font-black uppercase tracking-widest">
                                {action.label || formatAgentLabel(action.type)}
                              </p>
                              <p className="mt-1 text-[11px] font-semibold leading-5 opacity-80">
                                {action.description || "Use the central agent recommendation to guide the next operator move."}
                              </p>
                              <button
                                type="button"
                                onClick={() => handleRecordAgentAction(item, action, index)}
                                disabled={loggingActionId === `${item.id}-${action.type}-${index}`}
                                className="mt-3 w-full rounded-xl bg-white/80 px-3 py-2 text-[9px] font-black uppercase tracking-widest text-slate-700 ring-1 ring-inset ring-current/10 transition hover:bg-white disabled:opacity-60"
                              >
                                {loggingActionId === `${item.id}-${action.type}-${index}` ? "Logging..." : "Log Complete"}
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

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

                    {item.channel === "website" && (
                      <div className="inline-flex items-center justify-center gap-2 rounded-2xl bg-sky-600 px-4 py-3 text-[11px] font-black uppercase tracking-widest text-white">
                        <FaGlobeAfrica />
                        Website Lead
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

                    {(item.linkedInquiry?._id || item.linkedContactMessage?._id || item.sourceType === "email-thread") && (
                      <button
                        type="button"
                        onClick={() => handleOpenSourceRecord(item)}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 text-[11px] font-black uppercase tracking-widest text-primary"
                      >
                        <FaInbox />
                        Open Source Record
                      </button>
                    )}

                    {item.canFollowUp && (
                      <button
                        type="button"
                        onClick={() => handleManualRevenueAction(item, "follow-up")}
                        disabled={loggingActionId === `${item.id}-follow-up-0`}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-[11px] font-black uppercase tracking-widest text-sky-700 disabled:opacity-50"
                      >
                        <FaBolt />
                        {loggingActionId === `${item.id}-follow-up-0` ? "Saving..." : "Log Follow-Up"}
                      </button>
                    )}

                    {item.canEscalate && (
                      <button
                        type="button"
                        onClick={() => handleManualRevenueAction(item, "escalate")}
                        disabled={loggingActionId === `${item.id}-escalate-0`}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-[11px] font-black uppercase tracking-widest text-amber-700 disabled:opacity-50"
                      >
                        <FaExclamationTriangle />
                        {loggingActionId === `${item.id}-escalate-0` ? "Saving..." : "Flag Review"}
                      </button>
                    )}

                    {(item.sourceType === "email-thread" || item.linkedContactMessage?._id || item.linkedChatConversation?.visitorEmail) && (
                      <button
                        type="button"
                        onClick={() => handleReplyByEmail(item)}
                        disabled={savingId === item.id || item.canReply === false}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-[11px] font-black uppercase tracking-widest text-slate-700 disabled:opacity-50"
                      >
                        <FaEnvelopeOpenText />
                        {savingId === item.id ? "Syncing..." : "Reply By Email"}
                      </button>
                    )}

                    {item.linkedContactMessage?._id && (
                      <div className="flex flex-col gap-2">
                        <button
                          type="button"
                          onClick={() => handleUpdateContactMessage(item, "Read")}
                          disabled={savingId === item.id || item.status === "Read" || item.status === "Replied"}
                          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-[11px] font-black uppercase tracking-widest text-white disabled:opacity-50"
                        >
                          <FaInbox />
                          {savingId === item.id ? "Saving..." : "Mark Read"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateContactMessage(item, "Replied")}
                          disabled={savingId === item.id || item.status === "Replied"}
                          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-[11px] font-black uppercase tracking-widest text-slate-700 disabled:opacity-50"
                        >
                          <FaCopy />
                          Mark Replied
                        </button>
                      </div>
                    )}

                    {item.linkedChatConversation?._id && (
                      <div className="flex flex-col gap-2">
                        <button
                          type="button"
                          onClick={() => handleUpdateChatConversation(item, "replied")}
                          disabled={savingId === item.id || item.status === "replied" || item.status === "closed"}
                          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-[11px] font-black uppercase tracking-widest text-white disabled:opacity-50"
                        >
                          <FaInbox />
                          {savingId === item.id ? "Saving..." : "Mark Replied"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateChatConversation(item, "closed")}
                          disabled={savingId === item.id || item.status === "closed"}
                          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-[11px] font-black uppercase tracking-widest text-slate-700 disabled:opacity-50"
                        >
                          <FaCopy />
                          Close Chat
                        </button>
                      </div>
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
                        <p className="text-[11px] font-medium leading-relaxed text-slate-700 italic">&quot;{aiSuggestions[item.id]}&quot;</p>
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
              );
            })}
        </div>
      </Card>
    </div>
  );
};

export default UnifiedInboxManager;
