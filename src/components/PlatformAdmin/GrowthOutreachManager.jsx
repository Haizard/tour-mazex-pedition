import { useEffect, useMemo, useState } from "react";
import {
  approvePlatformOutreachAgentReply,
  attributePlatformOutreachThreadConversion,
  createPlatformOutreachCampaign,
  createPlatformOutreachProspect,
  createPlatformOutreachSocialPost,
  fetchPlatformOutreachAnalytics,
  fetchPlatformOutreachCampaigns,
  fetchPlatformOutreachMessages,
  fetchPlatformOutreachProspects,
  fetchPlatformOutreachReadiness,
  fetchPlatformOutreachSocialPosts,
  fetchPlatformOutreachThreads,
  generatePlatformOutreachMessage,
  createPlatformOutreachAgentReply,
  launchPlatformOutreachCampaign,
  pausePlatformOutreachCampaign,
  publishPlatformOutreachSocialPostNow,
  sendPlatformOutreachMessageNow,
  updatePlatformOutreachSettings,
  updatePlatformOutreachProspect,
} from "../../services/api";
import {
  buildDefaultOutreachCampaignForm,
  buildDefaultOutreachProspectForm,
  buildDefaultOutreachSettingsForm,
  buildDefaultSocialPostForm,
  buildDefaultThreadConversionForm,
  buildProviderCredentialWizardSteps,
  formatOutreachDate,
  summarizeOutreachReadiness,
} from "./growthOutreachState";

const panelClass = "rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm";
const inputClass = "w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-950 outline-none focus:border-zinc-950";
const labelClass = "mb-2 block text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500";
const channels = ["email", "whatsapp", "facebook", "instagram"];
const credentialRequirements = [
  {
    label: "AI generation",
    env: "GEMINI_API_KEY / GOOGLE_API_KEY / PLATFORM_OUTREACH_AI_API_KEY",
    note: "Required before the AI agent can generate reviewed outreach copy.",
  },
  {
    label: "Email provider",
    env: "PLATFORM_EMAIL_API_KEY or PLATFORM_SMTP_HOST",
    note: "Required before approved email drafts can leave the queue.",
  },
  {
    label: "WhatsApp provider",
    env: "PLATFORM_WHATSAPP_ACCESS_TOKEN",
    note: "Required for Meta WhatsApp template dispatch.",
  },
  {
    label: "Social publishing",
    env: "PLATFORM_META_ACCESS_TOKEN",
    note: "Required for Facebook and Instagram publishing.",
  },
];

const EmptyState = ({ title, body }) => (
  <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-6 py-8 text-center">
    <p className="font-black text-zinc-950">{title}</p>
    <p className="mt-2 text-sm font-medium text-zinc-500">{body}</p>
  </div>
);

const StatusPill = ({ tone = "zinc", children }) => {
  const tones = {
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    red: "border-red-200 bg-red-50 text-red-700",
    zinc: "border-zinc-200 bg-zinc-50 text-zinc-600",
  };

  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest ${tones[tone] || tones.zinc}`}>
      {children}
    </span>
  );
};

const GrowthOutreachManager = () => {
  const [readiness, setReadiness] = useState(null);
  const [prospects, setProspects] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [messages, setMessages] = useState([]);
  const [threads, setThreads] = useState([]);
  const [socialPosts, setSocialPosts] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [prospectForm, setProspectForm] = useState(buildDefaultOutreachProspectForm());
  const [campaignForm, setCampaignForm] = useState(buildDefaultOutreachCampaignForm());
  const [socialPostForm, setSocialPostForm] = useState(buildDefaultSocialPostForm());
  const [settingsForm, setSettingsForm] = useState(buildDefaultOutreachSettingsForm());
  const [conversionForms, setConversionForms] = useState({});
  const [selectedProspectId, setSelectedProspectId] = useState("");
  const [selectedCampaignId, setSelectedCampaignId] = useState("");
  const [selectedMessageChannel, setSelectedMessageChannel] = useState("email");
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const readinessSummary = useMemo(
    () => summarizeOutreachReadiness(readiness || {}),
    [readiness]
  );

  const selectedCampaign = useMemo(
    () => campaigns.find((campaign) => campaign._id === selectedCampaignId) || null,
    [campaigns, selectedCampaignId]
  );

  const selectedProspect = useMemo(
    () => prospects.find((prospect) => prospect._id === selectedProspectId) || null,
    [prospects, selectedProspectId]
  );

  const credentialWizardSteps = useMemo(
    () =>
      buildProviderCredentialWizardSteps({
        baseUrl: typeof window !== "undefined" ? window.location.origin : "https://mazexpeditions.vercel.app",
        readiness: readiness || {},
      }),
    [readiness]
  );

  const loadOutreachWorkspace = async () => {
    setLoading(true);
    setError("");
    try {
      const [
        readinessResponse,
        prospectsResponse,
        campaignsResponse,
        messagesResponse,
        analyticsResponse,
        threadsResponse,
        socialPostsResponse,
      ] = await Promise.all([
        fetchPlatformOutreachReadiness(),
        fetchPlatformOutreachProspects(),
        fetchPlatformOutreachCampaigns(),
        fetchPlatformOutreachMessages(),
        fetchPlatformOutreachAnalytics(),
        fetchPlatformOutreachThreads(),
        fetchPlatformOutreachSocialPosts(),
      ]);

      const nextProspects = Array.isArray(prospectsResponse.data) ? prospectsResponse.data : [];
      const nextCampaigns = Array.isArray(campaignsResponse.data) ? campaignsResponse.data : [];
      setReadiness(readinessResponse.data?.readiness || null);
      setSettingsForm(buildDefaultOutreachSettingsForm(readinessResponse.data?.settings || {}));
      setProspects(nextProspects);
      setCampaigns(nextCampaigns);
      setMessages(Array.isArray(messagesResponse.data) ? messagesResponse.data : []);
      setAnalytics(analyticsResponse.data || null);
      setThreads(Array.isArray(threadsResponse.data) ? threadsResponse.data : []);
      setSocialPosts(Array.isArray(socialPostsResponse.data) ? socialPostsResponse.data : []);
      setSelectedProspectId((current) => current || nextProspects[0]?._id || "");
      setSelectedCampaignId((current) => current || nextCampaigns[0]?._id || "");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to load platform outreach workspace.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOutreachWorkspace();
  }, []);

  const updateProspectForm = (field, value) => {
    setProspectForm((current) => ({ ...current, [field]: value }));
  };

  const updateCampaignForm = (field, value) => {
    setCampaignForm((current) => ({ ...current, [field]: value }));
  };

  const updateSocialPostForm = (field, value) => {
    setSocialPostForm((current) => ({ ...current, [field]: value }));
  };

  const updateSettingsForm = (field, value) => {
    setSettingsForm((current) => ({ ...current, [field]: value }));
  };

  const updateConversionForm = (threadId, field, value, currentConversion = {}) => {
    setConversionForms((current) => ({
      ...current,
      [threadId]: {
        ...buildDefaultThreadConversionForm(currentConversion),
        ...(current[threadId] || {}),
        [field]: value,
      },
    }));
  };

  const toggleCampaignChannel = (channel) => {
    setCampaignForm((current) => {
      const exists = current.channels.includes(channel);
      const nextChannels = exists
        ? current.channels.filter((item) => item !== channel)
        : [...current.channels, channel];
      return { ...current, channels: nextChannels.length ? nextChannels : ["email"] };
    });
  };

  const toggleSocialPlatform = (platform) => {
    setSocialPostForm((current) => {
      const exists = current.platforms.includes(platform);
      const nextPlatforms = exists
        ? current.platforms.filter((item) => item !== platform)
        : [...current.platforms, platform];
      return { ...current, platforms: nextPlatforms.length ? nextPlatforms : ["facebook"] };
    });
  };

  const handleCreateProspect = async (event) => {
    event.preventDefault();
    setWorking("prospect");
    setError("");
    setNotice("");
    try {
      const response = await createPlatformOutreachProspect({
        companyName: prospectForm.companyName,
        contactName: prospectForm.contactName,
        email: prospectForm.email,
        whatsappNumber: prospectForm.phone,
        website: prospectForm.website,
        country: prospectForm.region,
        sourceUrl: prospectForm.sourceUrl,
        tags: [prospectForm.region, prospectForm.niche].filter(Boolean),
        metadata: {
          niche: prospectForm.niche,
          notes: prospectForm.notes,
        },
      });
      setNotice(`Prospect ${response.data?.companyName || prospectForm.companyName} saved.`);
      setProspectForm(buildDefaultOutreachProspectForm());
      await loadOutreachWorkspace();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to save prospect.");
    } finally {
      setWorking("");
    }
  };

  const handleCreateCampaign = async (event) => {
    event.preventDefault();
    setWorking("campaign");
    setError("");
    setNotice("");
    try {
      const response = await createPlatformOutreachCampaign({
        title: campaignForm.title,
        objective: `Win demos from ${campaignForm.audience}`,
        audienceFilters: { audience: campaignForm.audience },
        channels: campaignForm.channels,
        tone: campaignForm.tone,
        offer: campaignForm.offer,
        status: "draft",
      });
      setNotice(`Campaign ${response.data?.title || campaignForm.title} created.`);
      setCampaignForm(buildDefaultOutreachCampaignForm());
      await loadOutreachWorkspace();
      setSelectedCampaignId(response.data?._id || "");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to create campaign.");
    } finally {
      setWorking("");
    }
  };

  const handleGenerateMessage = async () => {
    if (!selectedCampaignId || !selectedProspectId) {
      setError("Choose a campaign and prospect before generating an outreach draft.");
      return;
    }
    setWorking("generate");
    setError("");
    setNotice("");
    try {
      await generatePlatformOutreachMessage(selectedCampaignId, {
        prospectId: selectedProspectId,
        channel: selectedMessageChannel,
      });
      setNotice("AI outreach draft generated for review.");
      await loadOutreachWorkspace();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to generate outreach draft.");
    } finally {
      setWorking("");
    }
  };

  const handleLaunchCampaign = async () => {
    if (!selectedCampaignId) {
      setError("Choose a campaign before launch.");
      return;
    }
    setWorking("launch");
    setError("");
    setNotice("");
    try {
      await launchPlatformOutreachCampaign(selectedCampaignId);
      setNotice("Campaign activated after provider readiness checks.");
      await loadOutreachWorkspace();
    } catch (requestError) {
      const readinessMessage = requestError.response?.data?.readiness?.missing?.join(", ");
      setError(readinessMessage || requestError.response?.data?.message || "Campaign launch blocked by readiness gates.");
    } finally {
      setWorking("");
    }
  };

  const handlePauseCampaign = async () => {
    if (!selectedCampaignId) {
      setError("Choose a campaign before pausing.");
      return;
    }
    setWorking("pause");
    setError("");
    setNotice("");
    try {
      await pausePlatformOutreachCampaign(selectedCampaignId, {
        reason: "Paused from Growth Outreach workspace.",
      });
      setNotice("Campaign paused.");
      await loadOutreachWorkspace();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to pause campaign.");
    } finally {
      setWorking("");
    }
  };

  const handleCreateSocialPost = async (event) => {
    event.preventDefault();
    setWorking("social");
    setError("");
    setNotice("");
    try {
      await createPlatformOutreachSocialPost({
        title: socialPostForm.title,
        caption: socialPostForm.body,
        platforms: socialPostForm.platforms,
        status: socialPostForm.status,
        scheduledFor: socialPostForm.scheduledFor || null,
      });
      setNotice("Social post draft saved.");
      setSocialPostForm(buildDefaultSocialPostForm());
      await loadOutreachWorkspace();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to save social post.");
    } finally {
      setWorking("");
    }
  };

  const handleSaveSettings = async (event) => {
    event.preventDefault();
    setWorking("settings");
    setError("");
    setNotice("");
    try {
      const response = await updatePlatformOutreachSettings({
        email: {
          senderName: settingsForm.senderName,
          senderEmail: settingsForm.senderEmail,
          postalAddress: settingsForm.postalAddress,
          unsubscribeBaseUrl: settingsForm.unsubscribeBaseUrl,
          webhookSecret: settingsForm.emailWebhookSecret,
        },
        whatsapp: {
          businessAccountId: settingsForm.whatsappBusinessAccountId,
          phoneNumberId: settingsForm.whatsappPhoneNumberId,
          defaultMarketingTemplateName: settingsForm.whatsappTemplateName,
          webhookVerifyToken: settingsForm.whatsappWebhookVerifyToken,
        },
        social: {
          facebookPageId: settingsForm.facebookPageId,
          instagramBusinessAccountId: settingsForm.instagramBusinessAccountId,
        },
        rateLimits: {
          maxEmailPerHour: Number(settingsForm.maxEmailPerHour || 50),
          maxWhatsAppPerHour: Number(settingsForm.maxWhatsAppPerHour || 20),
          maxSocialPostsPerDay: Number(settingsForm.maxSocialPostsPerDay || 10),
        },
        escalationRules: [
          {
            label: "Sales and risk escalation",
            keywords: settingsForm.escalationKeywords
              .split(/[,\n]/)
              .map((keyword) => keyword.trim())
              .filter(Boolean),
            enabled: true,
            minConfidence: Number(settingsForm.lowConfidenceThreshold || 0.65),
          },
        ],
      });
      setReadiness(response.data?.readiness || null);
      setSettingsForm(buildDefaultOutreachSettingsForm(response.data?.settings || {}));
      setNotice("Outreach settings saved and readiness recalculated.");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to save outreach settings.");
    } finally {
      setWorking("");
    }
  };

  const markProspectQualified = async (prospectId) => {
    setWorking(`prospect-${prospectId}`);
    setError("");
    setNotice("");
    try {
      await updatePlatformOutreachProspect(prospectId, { status: "qualified" });
      setNotice("Prospect marked qualified.");
      await loadOutreachWorkspace();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to update prospect.");
    } finally {
      setWorking("");
    }
  };

  const handleQueueMessageNow = async (messageId) => {
    setWorking(`message-${messageId}`);
    setError("");
    setNotice("");
    try {
      await sendPlatformOutreachMessageNow(messageId);
      setNotice("Message queued for provider dispatch.");
      await loadOutreachWorkspace();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to queue message.");
    } finally {
      setWorking("");
    }
  };

  const handlePublishSocialPostNow = async (postId) => {
    setWorking(`social-${postId}`);
    setError("");
    setNotice("");
    try {
      await publishPlatformOutreachSocialPostNow(postId);
      setNotice("Social post queued for publishing.");
      await loadOutreachWorkspace();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to queue social post.");
    } finally {
      setWorking("");
    }
  };

  const handleDraftAgentReply = async (threadId) => {
    setWorking(`thread-${threadId}`);
    setError("");
    setNotice("");
    try {
      await createPlatformOutreachAgentReply(threadId);
      setNotice("Agent reply decision created for review.");
      await loadOutreachWorkspace();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to create agent reply decision.");
    } finally {
      setWorking("");
    }
  };

  const handleApproveAgentReply = async (threadId) => {
    setWorking(`approve-thread-${threadId}`);
    setError("");
    setNotice("");
    try {
      await approvePlatformOutreachAgentReply(threadId);
      setNotice("Approved agent reply queued for provider dispatch.");
      await loadOutreachWorkspace();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to approve and queue agent reply.");
    } finally {
      setWorking("");
    }
  };

  const handleAttributeConversion = async (threadId, existingConversion = {}) => {
    const form = conversionForms[threadId] || buildDefaultThreadConversionForm(existingConversion);
    setWorking(`conversion-${threadId}`);
    setError("");
    setNotice("");
    try {
      await attributePlatformOutreachThreadConversion(threadId, {
        ...form,
        source: "platform-admin",
      });
      setNotice("Outreach conversion attribution saved.");
      await loadOutreachWorkspace();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to save conversion attribution.");
    } finally {
      setWorking("");
    }
  };

  if (loading) {
    return (
      <div className={panelClass}>
        <p className="text-sm font-bold text-zinc-500">Loading growth outreach workspace...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">{error}</div>}
      {notice && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-bold text-emerald-700">{notice}</div>}

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-4">
        <div className="rounded-3xl border border-zinc-900 bg-zinc-950 p-6 text-white shadow-sm xl:col-span-2">
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-500">AI Growth Desk</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight">Platform outreach control tower</h2>
          <p className="mt-3 text-sm font-medium leading-6 text-zinc-300">
            Import tourism prospects, generate review-first AI outreach, and keep live sending gated by provider readiness.
          </p>
        </div>
        <div className={panelClass}>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">Provider Readiness</p>
          <p className="mt-3 text-4xl font-black text-zinc-950">{readinessSummary.readyCount}</p>
          <p className="mt-1 text-sm font-semibold text-zinc-500">ready channels</p>
          <StatusPill tone={readinessSummary.blockedCount ? "amber" : "emerald"}>
            {readinessSummary.blockedCount ? `${readinessSummary.blockedCount} blocked` : "ready"}
          </StatusPill>
        </div>
        <div className={panelClass}>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">Pipeline</p>
          <p className="mt-3 text-4xl font-black text-zinc-950">{prospects.length}</p>
          <p className="mt-1 text-sm font-semibold text-zinc-500">prospects captured</p>
          <p className="mt-4 text-xs font-bold text-zinc-500">{messages.length} outreach drafts, {threads.length} threads, and {socialPosts.length} social posts</p>
        </div>
      </section>

      {readinessSummary.missing.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm font-bold text-amber-800">
          Missing provider setup: {readinessSummary.missing.join(", ")}
        </div>
      )}

      <section className={panelClass}>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500">Analytics Dashboard</p>
            <h3 className="mt-2 text-2xl font-black text-zinc-950">Growth engine health</h3>
            <p className="mt-2 text-sm font-medium text-zinc-500">Track prospect quality, approved dispatches, replies, failures, and social publishing from one cockpit.</p>
          </div>
          <StatusPill tone={(analytics?.summary?.failedMessageCount || analytics?.summary?.socialFailedCount) ? "amber" : "emerald"}>
            {(analytics?.summary?.failedMessageCount || 0) + (analytics?.summary?.socialFailedCount || 0)} failures
          </StatusPill>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-6">
          {[
            ["Prospects", analytics?.summary?.prospectCount ?? prospects.length],
            ["Qualified", analytics?.summary?.qualifiedProspectCount ?? 0],
            ["Sent", analytics?.summary?.sentMessageCount ?? 0],
            ["Queued", analytics?.summary?.queuedMessageCount ?? 0],
            ["Threads", analytics?.summary?.activeThreadCount ?? threads.length],
            ["Social Live", analytics?.summary?.socialPublishedCount ?? 0],
            ["Revenue", `${analytics?.summary?.attributedRevenue ?? 0} USD`],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{label}</p>
              <p className="mt-2 text-3xl font-black text-zinc-950">{value}</p>
            </div>
          ))}
        </div>
        {analytics?.recentFailures?.length > 0 && (
          <div className="mt-5 rounded-2xl border border-red-100 bg-red-50 p-4">
            <p className="text-xs font-black uppercase tracking-widest text-red-500">Recent provider failures</p>
            <div className="mt-3 space-y-2">
              {analytics.recentFailures.map((failure) => (
                <p key={failure._id} className="text-sm font-semibold text-red-700">
                  {failure.channel}: {failure.providerError || failure.subject || "Provider failure"}
                </p>
              ))}
            </div>
          </div>
        )}
      </section>

      <form onSubmit={handleSaveSettings} className={panelClass}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500">Settings</p>
            <h3 className="mt-2 text-2xl font-black text-zinc-950">Compliance and provider readiness</h3>
            <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-zinc-500">
              Store platform sender identity, WhatsApp template metadata, social account IDs, and conservative rate limits.
              Raw API credentials stay in environment variables and are never entered here.
            </p>
          </div>
          <button type="submit" disabled={working === "settings"} className="rounded-xl bg-zinc-950 px-5 py-3 text-xs font-black uppercase tracking-widest text-white disabled:opacity-50">
            {working === "settings" ? "Saving..." : "Save Settings"}
          </button>
        </div>
        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-zinc-200 p-4">
            <p className="mb-4 text-xs font-black uppercase tracking-widest text-zinc-400">Email Identity</p>
            <div className="space-y-3">
              <label>
                <span className={labelClass}>Sender name</span>
                <input className={inputClass} value={settingsForm.senderName} onChange={(event) => updateSettingsForm("senderName", event.target.value)} />
              </label>
              <label>
                <span className={labelClass}>Sender email</span>
                <input className={inputClass} type="email" value={settingsForm.senderEmail} onChange={(event) => updateSettingsForm("senderEmail", event.target.value)} />
              </label>
              <label>
                <span className={labelClass}>Postal address</span>
                <textarea className={`${inputClass} min-h-20`} value={settingsForm.postalAddress} onChange={(event) => updateSettingsForm("postalAddress", event.target.value)} />
              </label>
              <label>
                <span className={labelClass}>Unsubscribe base URL</span>
                <input className={inputClass} value={settingsForm.unsubscribeBaseUrl} onChange={(event) => updateSettingsForm("unsubscribeBaseUrl", event.target.value)} />
              </label>
              <label>
                <span className={labelClass}>Email webhook token</span>
                <input className={inputClass} value={settingsForm.emailWebhookSecret} onChange={(event) => updateSettingsForm("emailWebhookSecret", event.target.value)} placeholder="Used by provider reply webhooks" />
              </label>
            </div>
          </div>
          <div className="rounded-2xl border border-zinc-200 p-4">
            <p className="mb-4 text-xs font-black uppercase tracking-widest text-zinc-400">WhatsApp And Social</p>
            <div className="space-y-3">
              <label>
                <span className={labelClass}>WhatsApp Business Account ID</span>
                <input className={inputClass} value={settingsForm.whatsappBusinessAccountId} onChange={(event) => updateSettingsForm("whatsappBusinessAccountId", event.target.value)} />
              </label>
              <label>
                <span className={labelClass}>WhatsApp phone number ID</span>
                <input className={inputClass} value={settingsForm.whatsappPhoneNumberId} onChange={(event) => updateSettingsForm("whatsappPhoneNumberId", event.target.value)} />
              </label>
              <label>
                <span className={labelClass}>Approved template</span>
                <input className={inputClass} value={settingsForm.whatsappTemplateName} onChange={(event) => updateSettingsForm("whatsappTemplateName", event.target.value)} />
              </label>
              <label>
                <span className={labelClass}>Webhook verify token</span>
                <input className={inputClass} value={settingsForm.whatsappWebhookVerifyToken} onChange={(event) => updateSettingsForm("whatsappWebhookVerifyToken", event.target.value)} />
              </label>
              <label>
                <span className={labelClass}>Facebook Page ID</span>
                <input className={inputClass} value={settingsForm.facebookPageId} onChange={(event) => updateSettingsForm("facebookPageId", event.target.value)} />
              </label>
              <label>
                <span className={labelClass}>Instagram Business Account ID</span>
                <input className={inputClass} value={settingsForm.instagramBusinessAccountId} onChange={(event) => updateSettingsForm("instagramBusinessAccountId", event.target.value)} />
              </label>
            </div>
          </div>
          <div className="rounded-2xl border border-zinc-200 p-4">
            <p className="mb-4 text-xs font-black uppercase tracking-widest text-zinc-400">Rate Limits</p>
            <div className="space-y-3">
              <label>
                <span className={labelClass}>Max email per hour</span>
                <input className={inputClass} type="number" min="1" value={settingsForm.maxEmailPerHour} onChange={(event) => updateSettingsForm("maxEmailPerHour", event.target.value)} />
              </label>
              <label>
                <span className={labelClass}>Max WhatsApp per hour</span>
                <input className={inputClass} type="number" min="1" value={settingsForm.maxWhatsAppPerHour} onChange={(event) => updateSettingsForm("maxWhatsAppPerHour", event.target.value)} />
              </label>
              <label>
                <span className={labelClass}>Max social posts per day</span>
                <input className={inputClass} type="number" min="1" value={settingsForm.maxSocialPostsPerDay} onChange={(event) => updateSettingsForm("maxSocialPostsPerDay", event.target.value)} />
              </label>
              <div className="rounded-2xl bg-zinc-50 p-4 text-sm font-semibold leading-6 text-zinc-500">
                Environment variables still control actual provider credentials: email/SMTP, Meta access token, and WhatsApp access token.
              </div>
              <label>
                <span className={labelClass}>Escalation keywords</span>
                <textarea className={`${inputClass} min-h-20`} value={settingsForm.escalationKeywords} onChange={(event) => updateSettingsForm("escalationKeywords", event.target.value)} />
              </label>
              <label>
                <span className={labelClass}>Low confidence threshold</span>
                <input className={inputClass} type="number" min="0" max="1" step="0.05" value={settingsForm.lowConfidenceThreshold} onChange={(event) => updateSettingsForm("lowConfidenceThreshold", event.target.value)} />
              </label>
            </div>
          </div>
        </div>
        <div className="mt-5 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
          <p className="text-xs font-black uppercase tracking-widest text-zinc-400">Provider Connection Wizard</p>
          <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-4">
            {credentialWizardSteps.map((item) => (
              <div key={item.label} className="rounded-2xl bg-white p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-black text-zinc-950">{item.label}</p>
                  <StatusPill tone={item.ready ? "emerald" : "amber"}>{item.ready ? "ready" : "setup"}</StatusPill>
                </div>
                <p className="mt-2 text-xs font-black uppercase tracking-widest text-zinc-400">{item.env}</p>
                <p className="mt-2 text-sm font-medium leading-6 text-zinc-500">{item.note}</p>
                {item.webhookUrl && (
                  <p className="mt-3 break-all rounded-xl bg-zinc-50 p-3 text-xs font-bold text-zinc-600">{item.webhookUrl}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </form>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <form onSubmit={handleCreateProspect} className={panelClass}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500">Prospects</p>
              <h3 className="mt-2 text-2xl font-black text-zinc-950">Add public-source operator</h3>
            </div>
            <StatusPill>human review</StatusPill>
          </div>
          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
            <label>
              <span className={labelClass}>Company</span>
              <input className={inputClass} value={prospectForm.companyName} onChange={(event) => updateProspectForm("companyName", event.target.value)} required />
            </label>
            <label>
              <span className={labelClass}>Contact name</span>
              <input className={inputClass} value={prospectForm.contactName} onChange={(event) => updateProspectForm("contactName", event.target.value)} />
            </label>
            <label>
              <span className={labelClass}>Email</span>
              <input className={inputClass} type="email" value={prospectForm.email} onChange={(event) => updateProspectForm("email", event.target.value)} />
            </label>
            <label>
              <span className={labelClass}>WhatsApp / phone</span>
              <input className={inputClass} value={prospectForm.phone} onChange={(event) => updateProspectForm("phone", event.target.value)} />
            </label>
            <label>
              <span className={labelClass}>Website</span>
              <input className={inputClass} value={prospectForm.website} onChange={(event) => updateProspectForm("website", event.target.value)} />
            </label>
            <label>
              <span className={labelClass}>Public source URL</span>
              <input className={inputClass} value={prospectForm.sourceUrl} onChange={(event) => updateProspectForm("sourceUrl", event.target.value)} required />
            </label>
            <label>
              <span className={labelClass}>Region</span>
              <input className={inputClass} value={prospectForm.region} onChange={(event) => updateProspectForm("region", event.target.value)} />
            </label>
            <label>
              <span className={labelClass}>Niche</span>
              <input className={inputClass} value={prospectForm.niche} onChange={(event) => updateProspectForm("niche", event.target.value)} placeholder="Safari, Kilimanjaro, Zanzibar..." />
            </label>
          </div>
          <label className="mt-4 block">
            <span className={labelClass}>AI context notes</span>
            <textarea className={`${inputClass} min-h-24`} value={prospectForm.notes} onChange={(event) => updateProspectForm("notes", event.target.value)} />
          </label>
          <button type="submit" disabled={working === "prospect"} className="mt-5 rounded-xl bg-zinc-950 px-5 py-3 text-xs font-black uppercase tracking-widest text-white disabled:opacity-50">
            {working === "prospect" ? "Saving..." : "Save Prospect"}
          </button>
        </form>

        <form onSubmit={handleCreateCampaign} className={panelClass}>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500">Campaigns</p>
          <h3 className="mt-2 text-2xl font-black text-zinc-950">Create AI outreach campaign</h3>
          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
            <label>
              <span className={labelClass}>Campaign title</span>
              <input className={inputClass} value={campaignForm.title} onChange={(event) => updateCampaignForm("title", event.target.value)} required />
            </label>
            <label>
              <span className={labelClass}>Audience</span>
              <input className={inputClass} value={campaignForm.audience} onChange={(event) => updateCampaignForm("audience", event.target.value)} />
            </label>
          </div>
          <label className="mt-4 block">
            <span className={labelClass}>Offer</span>
            <textarea className={`${inputClass} min-h-24`} value={campaignForm.offer} onChange={(event) => updateCampaignForm("offer", event.target.value)} />
          </label>
          <label className="mt-4 block">
            <span className={labelClass}>Tone</span>
            <input className={inputClass} value={campaignForm.tone} onChange={(event) => updateCampaignForm("tone", event.target.value)} />
          </label>
          <div className="mt-4">
            <span className={labelClass}>Channels</span>
            <div className="flex flex-wrap gap-2">
              {channels.map((channel) => (
                <button
                  key={channel}
                  type="button"
                  onClick={() => toggleCampaignChannel(channel)}
                  className={`rounded-full border px-4 py-2 text-xs font-black uppercase tracking-widest ${
                    campaignForm.channels.includes(channel)
                      ? "border-zinc-950 bg-zinc-950 text-white"
                      : "border-zinc-200 bg-white text-zinc-500"
                  }`}
                >
                  {channel}
                </button>
              ))}
            </div>
          </div>
          <button type="submit" disabled={working === "campaign"} className="mt-5 rounded-xl bg-zinc-950 px-5 py-3 text-xs font-black uppercase tracking-widest text-white disabled:opacity-50">
            {working === "campaign" ? "Creating..." : "Create Campaign"}
          </button>
        </form>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className={`${panelClass} xl:col-span-2`}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500">Draft Generator</p>
              <h3 className="mt-2 text-2xl font-black text-zinc-950">Generate one reviewed outreach draft</h3>
              <p className="mt-2 text-sm font-medium text-zinc-500">No live send happens here. This creates a draft for human review.</p>
            </div>
            <button type="button" onClick={handleGenerateMessage} disabled={working === "generate"} className="rounded-xl bg-zinc-950 px-5 py-3 text-xs font-black uppercase tracking-widest text-white disabled:opacity-50">
              {working === "generate" ? "Generating..." : "Generate Draft"}
            </button>
          </div>
          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
            <label>
              <span className={labelClass}>Campaign</span>
              <select className={inputClass} value={selectedCampaignId} onChange={(event) => setSelectedCampaignId(event.target.value)}>
                <option value="">Select campaign</option>
                {campaigns.map((campaign) => (
                  <option key={campaign._id} value={campaign._id}>{campaign.title}</option>
                ))}
              </select>
            </label>
            <label>
              <span className={labelClass}>Prospect</span>
              <select className={inputClass} value={selectedProspectId} onChange={(event) => setSelectedProspectId(event.target.value)}>
                <option value="">Select prospect</option>
                {prospects.map((prospect) => (
                  <option key={prospect._id} value={prospect._id}>{prospect.companyName}</option>
                ))}
              </select>
            </label>
            <label>
              <span className={labelClass}>Channel</span>
              <select className={inputClass} value={selectedMessageChannel} onChange={(event) => setSelectedMessageChannel(event.target.value)}>
                <option value="email">Email</option>
                <option value="whatsapp">WhatsApp</option>
              </select>
            </label>
          </div>
          <div className="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm font-semibold text-zinc-600">
            Current target: {selectedCampaign?.title || "No campaign"} for {selectedProspect?.companyName || "no prospect selected"}.
          </div>
        </div>

        <div className={panelClass}>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500">Launch Gate</p>
          <h3 className="mt-2 text-2xl font-black text-zinc-950">Activate campaign</h3>
          <p className="mt-2 text-sm font-medium text-zinc-500">The backend checks email, WhatsApp, and social provider readiness before activation.</p>
          <button type="button" onClick={handleLaunchCampaign} disabled={working === "launch" || !selectedCampaignId} className="mt-5 w-full rounded-xl bg-zinc-950 px-5 py-3 text-xs font-black uppercase tracking-widest text-white disabled:opacity-50">
            {working === "launch" ? "Checking..." : "Run Readiness And Launch"}
          </button>
          <button type="button" onClick={handlePauseCampaign} disabled={working === "pause" || !selectedCampaignId} className="mt-3 w-full rounded-xl border border-zinc-300 px-5 py-3 text-xs font-black uppercase tracking-widest text-zinc-700 transition hover:border-zinc-950 hover:text-zinc-950 disabled:opacity-50">
            {working === "pause" ? "Pausing..." : "Pause Campaign"}
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className={panelClass}>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500">Prospect Queue</p>
              <h3 className="mt-2 text-2xl font-black text-zinc-950">Operator pipeline</h3>
            </div>
            <StatusPill>{prospects.length} total</StatusPill>
          </div>
          <div className="mt-5 space-y-3">
            {prospects.length ? prospects.slice(0, 8).map((prospect) => (
              <div key={prospect._id} className="rounded-2xl border border-zinc-200 p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="font-black text-zinc-950">{prospect.companyName}</p>
                    <p className="mt-1 text-xs font-semibold text-zinc-500">{prospect.email || prospect.whatsappNumber || prospect.website || "No contact shown"}</p>
                  </div>
                  <StatusPill tone={prospect.status === "qualified" ? "emerald" : "zinc"}>{prospect.status || "new"}</StatusPill>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(prospect.tags || []).slice(0, 3).map((tag) => <StatusPill key={tag}>{tag}</StatusPill>)}
                  <button type="button" onClick={() => markProspectQualified(prospect._id)} disabled={working === `prospect-${prospect._id}`} className="rounded-full border border-zinc-200 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:border-zinc-950 hover:text-zinc-950 disabled:opacity-50">
                    Mark Qualified
                  </button>
                </div>
              </div>
            )) : <EmptyState title="No prospects yet" body="Add a public-source operator to begin outreach planning." />}
          </div>
        </div>

        <div className={panelClass}>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500">AI Drafts</p>
          <h3 className="mt-2 text-2xl font-black text-zinc-950">Review queue</h3>
          <div className="mt-5 space-y-3">
            {messages.length ? messages.slice(0, 6).map((message) => (
              <div key={message._id} className="rounded-2xl border border-zinc-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest text-zinc-400">{message.channel} / {message.status}</p>
                    <p className="mt-2 font-black text-zinc-950">{message.subject || "WhatsApp draft"}</p>
                  </div>
                  <StatusPill tone={message.status === "draft" ? "amber" : "emerald"}>{message.status}</StatusPill>
                </div>
                <p className="mt-3 line-clamp-3 text-sm font-medium leading-6 text-zinc-600">{message.body}</p>
                <button
                  type="button"
                  onClick={() => handleQueueMessageNow(message._id)}
                  disabled={working === `message-${message._id}` || !["draft", "failed"].includes(message.status)}
                  className="mt-4 rounded-full border border-zinc-200 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-zinc-500 transition hover:border-zinc-950 hover:text-zinc-950 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {working === `message-${message._id}` ? "Queueing..." : "Queue Send"}
                </button>
              </div>
            )) : <EmptyState title="No generated drafts" body="Generate one draft after creating a campaign and prospect." />}
          </div>
        </div>
      </section>

      <section className={panelClass}>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500">Inbound Threads</p>
            <h3 className="mt-2 text-2xl font-black text-zinc-950">Reply and escalation queue</h3>
            <p className="mt-2 text-sm font-medium text-zinc-500">Review provider-ingested replies, detect opt-outs, and draft safe platform-sales responses.</p>
          </div>
          <StatusPill tone={threads.some((thread) => thread.status === "needs_review") ? "amber" : "zinc"}>
            {threads.filter((thread) => thread.status === "needs_review").length} escalations
          </StatusPill>
        </div>
        <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-2">
          {threads.length ? threads.slice(0, 6).map((thread) => {
            const lastMessage = [...(thread.messages || [])].reverse()[0] || {};
            const decision = thread.agentState?.lastDecision || null;
            const conversionForm = conversionForms[thread._id] || buildDefaultThreadConversionForm(thread.conversionAttribution);
            return (
              <div key={thread._id} className="rounded-2xl border border-zinc-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest text-zinc-400">{thread.channel} / {thread.participantAddress}</p>
                    <p className="mt-2 font-black text-zinc-950">{lastMessage.subject || "Inbound reply"}</p>
                  </div>
                  <StatusPill tone={thread.status === "needs_review" ? "amber" : thread.status === "opted_out" ? "red" : "zinc"}>
                    {thread.status}
                  </StatusPill>
                </div>
                <p className="mt-3 line-clamp-3 text-sm font-medium leading-6 text-zinc-600">{lastMessage.body || "No message body captured."}</p>
                {decision && (
                  <div className="mt-4 rounded-2xl bg-zinc-50 p-4 text-sm font-semibold leading-6 text-zinc-600">
                    <p className="font-black text-zinc-950">Agent decision: {decision.action}</p>
                    <p className="mt-1">{decision.requiresEscalation ? decision.reason : decision.replyBody}</p>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => handleDraftAgentReply(thread._id)}
                  disabled={working === `thread-${thread._id}` || thread.status === "opted_out"}
                  className="mt-4 rounded-full border border-zinc-200 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-zinc-500 transition hover:border-zinc-950 hover:text-zinc-950 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {working === `thread-${thread._id}` ? "Thinking..." : "Draft Agent Reply"}
                </button>
                <button
                  type="button"
                  onClick={() => handleApproveAgentReply(thread._id)}
                  disabled={working === `approve-thread-${thread._id}` || thread.status === "opted_out" || !decision || decision.action !== "draft_auto_reply"}
                  className="ml-2 mt-4 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-emerald-700 transition hover:border-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {working === `approve-thread-${thread._id}` ? "Queueing..." : "Approve And Queue"}
                </button>
                <div className="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                  <p className="text-xs font-black uppercase tracking-widest text-zinc-400">Conversion Attribution</p>
                  {thread.conversionAttribution?.stage && (
                    <p className="mt-2 text-sm font-bold text-emerald-700">
                      Current: {thread.conversionAttribution.stage} / {thread.conversionAttribution.revenueAmount || 0} {thread.conversionAttribution.currency || "USD"}
                    </p>
                  )}
                  <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
                    <select
                      className={inputClass}
                      value={conversionForm.stage}
                      onChange={(event) => updateConversionForm(thread._id, "stage", event.target.value, thread.conversionAttribution)}
                    >
                      <option value="demo_booked">Demo booked</option>
                      <option value="trial_started">Trial started</option>
                      <option value="subscription_won">Subscription won</option>
                      <option value="lost">Lost</option>
                    </select>
                    <input
                      className={inputClass}
                      type="number"
                      min="0"
                      placeholder="Revenue"
                      value={conversionForm.revenueAmount}
                      onChange={(event) => updateConversionForm(thread._id, "revenueAmount", event.target.value, thread.conversionAttribution)}
                    />
                    <input
                      className={inputClass}
                      value={conversionForm.currency}
                      onChange={(event) => updateConversionForm(thread._id, "currency", event.target.value, thread.conversionAttribution)}
                    />
                  </div>
                  <textarea
                    className={`${inputClass} mt-3 min-h-16`}
                    placeholder="Attribution notes"
                    value={conversionForm.notes}
                    onChange={(event) => updateConversionForm(thread._id, "notes", event.target.value, thread.conversionAttribution)}
                  />
                  <button
                    type="button"
                    onClick={() => handleAttributeConversion(thread._id, thread.conversionAttribution)}
                    disabled={working === `conversion-${thread._id}`}
                    className="mt-3 rounded-full border border-zinc-300 bg-white px-3 py-2 text-[10px] font-black uppercase tracking-widest text-zinc-600 transition hover:border-zinc-950 hover:text-zinc-950 disabled:opacity-40"
                  >
                    {working === `conversion-${thread._id}` ? "Saving..." : "Save Conversion"}
                  </button>
                </div>
              </div>
            );
          }) : <EmptyState title="No inbound threads yet" body="Provider webhooks or manual reply ingestion will populate this queue." />}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <form onSubmit={handleCreateSocialPost} className={panelClass}>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500">Social Growth</p>
          <h3 className="mt-2 text-2xl font-black text-zinc-950">Create platform social draft</h3>
          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
            <label>
              <span className={labelClass}>Title</span>
              <input className={inputClass} value={socialPostForm.title} onChange={(event) => updateSocialPostForm("title", event.target.value)} required />
            </label>
            <label>
              <span className={labelClass}>Schedule</span>
              <input className={inputClass} type="datetime-local" value={socialPostForm.scheduledFor} onChange={(event) => updateSocialPostForm("scheduledFor", event.target.value)} />
            </label>
          </div>
          <label className="mt-4 block">
            <span className={labelClass}>Caption</span>
            <textarea className={`${inputClass} min-h-28`} value={socialPostForm.body} onChange={(event) => updateSocialPostForm("body", event.target.value)} required />
          </label>
          <div className="mt-4">
            <span className={labelClass}>Platforms</span>
            <div className="flex flex-wrap gap-2">
              {["facebook", "instagram"].map((platform) => (
                <button key={platform} type="button" onClick={() => toggleSocialPlatform(platform)} className={`rounded-full border px-4 py-2 text-xs font-black uppercase tracking-widest ${socialPostForm.platforms.includes(platform) ? "border-zinc-950 bg-zinc-950 text-white" : "border-zinc-200 bg-white text-zinc-500"}`}>
                  {platform}
                </button>
              ))}
            </div>
          </div>
          <button type="submit" disabled={working === "social"} className="mt-5 rounded-xl bg-zinc-950 px-5 py-3 text-xs font-black uppercase tracking-widest text-white disabled:opacity-50">
            {working === "social" ? "Saving..." : "Save Social Draft"}
          </button>
        </form>

        <div className={panelClass}>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500">Social Calendar</p>
          <h3 className="mt-2 text-2xl font-black text-zinc-950">Upcoming platform posts</h3>
          <div className="mt-5 space-y-3">
            {socialPosts.length ? socialPosts.slice(0, 6).map((post) => (
              <div key={post._id} className="rounded-2xl border border-zinc-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-black text-zinc-950">{post.title}</p>
                    <p className="mt-1 text-xs font-semibold text-zinc-500">{formatOutreachDate(post.scheduledFor)}</p>
                  </div>
                  <StatusPill tone={post.status === "published" ? "emerald" : "zinc"}>{post.status}</StatusPill>
                </div>
                <p className="mt-3 line-clamp-2 text-sm font-medium leading-6 text-zinc-600">{post.caption}</p>
                <button
                  type="button"
                  onClick={() => handlePublishSocialPostNow(post._id)}
                  disabled={working === `social-${post._id}` || !["draft", "failed"].includes(post.status)}
                  className="mt-4 rounded-full border border-zinc-200 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-zinc-500 transition hover:border-zinc-950 hover:text-zinc-950 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {working === `social-${post._id}` ? "Queueing..." : "Publish Now"}
                </button>
              </div>
            )) : <EmptyState title="No social posts yet" body="Create a platform social draft to prepare launch content." />}
          </div>
        </div>
      </section>
    </div>
  );
};

export default GrowthOutreachManager;
