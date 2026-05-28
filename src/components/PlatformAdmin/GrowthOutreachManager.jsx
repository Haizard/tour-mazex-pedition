import { useEffect, useMemo, useState } from "react";
import {
  createPlatformOutreachCampaign,
  createPlatformOutreachProspect,
  createPlatformOutreachSocialPost,
  fetchPlatformOutreachCampaigns,
  fetchPlatformOutreachMessages,
  fetchPlatformOutreachProspects,
  fetchPlatformOutreachReadiness,
  fetchPlatformOutreachSocialPosts,
  generatePlatformOutreachMessage,
  launchPlatformOutreachCampaign,
  updatePlatformOutreachProspect,
} from "../../services/api";
import {
  buildDefaultOutreachCampaignForm,
  buildDefaultOutreachProspectForm,
  buildDefaultSocialPostForm,
  formatOutreachDate,
  summarizeOutreachReadiness,
} from "./growthOutreachState";

const panelClass = "rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm";
const inputClass = "w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-950 outline-none focus:border-zinc-950";
const labelClass = "mb-2 block text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500";
const channels = ["email", "whatsapp", "facebook", "instagram"];

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
  const [socialPosts, setSocialPosts] = useState([]);
  const [prospectForm, setProspectForm] = useState(buildDefaultOutreachProspectForm());
  const [campaignForm, setCampaignForm] = useState(buildDefaultOutreachCampaignForm());
  const [socialPostForm, setSocialPostForm] = useState(buildDefaultSocialPostForm());
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

  const loadOutreachWorkspace = async () => {
    setLoading(true);
    setError("");
    try {
      const [
        readinessResponse,
        prospectsResponse,
        campaignsResponse,
        messagesResponse,
        socialPostsResponse,
      ] = await Promise.all([
        fetchPlatformOutreachReadiness(),
        fetchPlatformOutreachProspects(),
        fetchPlatformOutreachCampaigns(),
        fetchPlatformOutreachMessages(),
        fetchPlatformOutreachSocialPosts(),
      ]);

      const nextProspects = Array.isArray(prospectsResponse.data) ? prospectsResponse.data : [];
      const nextCampaigns = Array.isArray(campaignsResponse.data) ? campaignsResponse.data : [];
      setReadiness(readinessResponse.data?.readiness || null);
      setProspects(nextProspects);
      setCampaigns(nextCampaigns);
      setMessages(Array.isArray(messagesResponse.data) ? messagesResponse.data : []);
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
          <p className="mt-4 text-xs font-bold text-zinc-500">{messages.length} outreach drafts and {socialPosts.length} social posts</p>
        </div>
      </section>

      {readinessSummary.missing.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm font-bold text-amber-800">
          Missing provider setup: {readinessSummary.missing.join(", ")}
        </div>
      )}

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
              </div>
            )) : <EmptyState title="No generated drafts" body="Generate one draft after creating a campaign and prospect." />}
          </div>
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
              </div>
            )) : <EmptyState title="No social posts yet" body="Create a platform social draft to prepare launch content." />}
          </div>
        </div>
      </section>
    </div>
  );
};

export default GrowthOutreachManager;
