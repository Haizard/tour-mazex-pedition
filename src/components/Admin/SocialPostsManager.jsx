import { useCallback, useEffect, useMemo, useState } from "react";
import { FaCalendarAlt, FaFacebookF, FaInstagram, FaMagic, FaTrashAlt } from "react-icons/fa";

import Badge from "../UI/Badge";
import Button from "../UI/Button";
import Card from "../UI/Card";
import {
  createSocialPost,
  deleteSocialPost,
  fetchSocialAutomationDashboard,
  fetchSocialAccounts,
  fetchSocialPosts,
  fetchTours,
  generateSocialPost,
  publishSocialPostLive,
  runScheduledSocialAutomation,
  updateSocialPost,
} from "../../services/api";

const STATUS_OPTIONS = ["all", "draft", "ready", "scheduled", "published", "failed"];
const PLATFORM_OPTIONS = [
  { value: "instagram", label: "Instagram", icon: <FaInstagram /> },
  { value: "facebook", label: "Facebook", icon: <FaFacebookF /> },
];

const createEmptyEditor = () => ({
  _id: "",
  tourPackageId: "",
  title: "",
  caption: "",
  hashtagsText: "",
  callToAction: "",
  imageUrls: [],
  platforms: ["instagram", "facebook"],
  status: "draft",
  scheduledFor: "",
  generationMeta: {},
});

const formatDateTimeLocalValue = (value) => {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const pad = (part) => `${part}`.padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const normalizeEditorFromPost = (post) => ({
  _id: post._id,
  tourPackageId: post.tourPackageId,
  title: post.title || "",
  caption: post.caption || "",
  hashtagsText: Array.isArray(post.hashtags) ? post.hashtags.join(", ") : "",
  callToAction: post.callToAction || "",
  imageUrls: Array.isArray(post.imageUrls) ? post.imageUrls : [],
  platforms: Array.isArray(post.platforms) && post.platforms.length > 0 ? post.platforms : ["instagram"],
  status: post.status || "draft",
  scheduledFor: formatDateTimeLocalValue(post.scheduledFor),
  generationMeta: post.generationMeta || {},
});

const SocialPostsManager = () => {
  const [tours, setTours] = useState([]);
  const [posts, setPosts] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [automationSummary, setAutomationSummary] = useState({
    stats: { totalPosts: 0, scheduledPosts: 0, dueNow: 0, publishedPosts: 0, activeAccounts: 0 },
    duePosts: [],
  });
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedTourId, setSelectedTourId] = useState("");
  const [editor, setEditor] = useState(createEmptyEditor());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [runningAutomation, setRunningAutomation] = useState(false);
  const [error, setError] = useState("");

  const loadData = useCallback(async (statusFilter = "all") => {
    setLoading(true);
    setError("");

    try {
      const [tourResponse, postResponse, accountResponse] = await Promise.all([
        fetchTours(),
        fetchSocialPosts(statusFilter !== "all" ? { status: statusFilter } : {}),
        fetchSocialAccounts(),
      ]);
      const automationResponse = await fetchSocialAutomationDashboard();

      setTours(Array.isArray(tourResponse.data) ? tourResponse.data : []);
      setPosts(Array.isArray(postResponse.data) ? postResponse.data : []);
      setAccounts(Array.isArray(accountResponse.data) ? accountResponse.data : []);
      setAutomationSummary(
        automationResponse.data || {
          stats: { totalPosts: 0, scheduledPosts: 0, dueNow: 0, publishedPosts: 0, activeAccounts: 0 },
          duePosts: [],
        }
      );
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to load social publishing data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const run = async () => {
      await loadData(selectedStatus);
    };

    run();
  }, [loadData, selectedStatus]);

  const selectedTour = useMemo(
    () => tours.find((tour) => tour._id === selectedTourId) || null,
    [tours, selectedTourId]
  );

  const stats = useMemo(
    () => ({
      total: posts.length,
      scheduled: posts.filter((post) => post.status === "scheduled").length,
      drafts: posts.filter((post) => post.status === "draft").length,
      liveAccounts: accounts.filter((account) => account.status === "active").length,
      dueNow: automationSummary.stats?.dueNow || 0,
    }),
    [accounts, automationSummary.stats, posts]
  );

  const filteredPosts = useMemo(
    () => (selectedStatus === "all" ? posts : posts.filter((post) => post.status === selectedStatus)),
    [posts, selectedStatus]
  );

  const handleEditorFieldChange = (field, value) => {
    setEditor((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handlePlatformToggle = (platform) => {
    setEditor((current) => {
      const exists = current.platforms.includes(platform);
      const nextPlatforms = exists
        ? current.platforms.filter((item) => item !== platform)
        : [...current.platforms, platform];

      return {
        ...current,
        platforms: nextPlatforms,
      };
    });
  };

  const handleImageToggle = (imageUrl) => {
    setEditor((current) => {
      const exists = current.imageUrls.includes(imageUrl);
      return {
        ...current,
        imageUrls: exists
          ? current.imageUrls.filter((item) => item !== imageUrl)
          : [...current.imageUrls, imageUrl],
      };
    });
  };

  const startFreshDraft = () => {
    setSelectedTourId("");
    setEditor(createEmptyEditor());
    setError("");
  };

  const handleGenerate = async () => {
    if (!selectedTourId) {
      setError("Choose a tour package before generating a post.");
      return;
    }

    setGenerating(true);
    setError("");

    try {
      const response = await generateSocialPost({ tourPackageId: selectedTourId });
      const payload = response.data;

      setEditor({
        _id: "",
        tourPackageId: payload.tourPackageId,
        title: payload.title || "",
        caption: payload.caption || "",
        hashtagsText: Array.isArray(payload.hashtags) ? payload.hashtags.join(", ") : "",
        callToAction: payload.callToAction || "",
        imageUrls: Array.isArray(payload.imageCandidates) ? payload.imageCandidates : [],
        platforms: ["instagram", "facebook"],
        status: "draft",
        scheduledFor: "",
        generationMeta: payload.generationMeta || {},
      });
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to generate a social post draft.");
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async (nextStatus) => {
    if (!editor.tourPackageId) {
      setError("Generate or select a post source before saving.");
      return;
    }

    setSaving(true);
    setError("");

    const payload = {
      tourPackageId: editor.tourPackageId,
      title: editor.title,
      caption: editor.caption,
      hashtags: editor.hashtagsText,
      callToAction: editor.callToAction,
      imageUrls: editor.imageUrls,
      platforms: editor.platforms,
      status: nextStatus,
      scheduledFor: nextStatus === "scheduled" ? editor.scheduledFor : null,
      generationMeta: editor.generationMeta,
    };

    try {
      if (editor._id) {
        await updateSocialPost(editor._id, payload);
      } else {
        await createSocialPost(payload);
      }

      await loadData(selectedStatus);
      startFreshDraft();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to save the social post.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (postId) => {
    setSaving(true);
    setError("");

    try {
      await deleteSocialPost(postId);
      if (editor._id === postId) {
        startFreshDraft();
      }
      await loadData(selectedStatus);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to delete the social post.");
    } finally {
      setSaving(false);
    }
  };

  const handlePublishNow = async (postId) => {
    setSaving(true);
    setError("");

    try {
      await publishSocialPostLive(postId);
      await loadData(selectedStatus);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Unable to publish this post live."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleRunAutomation = async () => {
    setRunningAutomation(true);
    setError("");

    try {
      await runScheduledSocialAutomation();
      await loadData(selectedStatus);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Unable to run the scheduled social automation queue."
      );
    } finally {
      setRunningAutomation(false);
    }
  };

  const availableImages = useMemo(() => {
    if (!selectedTour) {
      return editor.imageUrls;
    }

    return [selectedTour.image, ...(selectedTour.galleryImages || [])].filter(Boolean);
  }, [editor.imageUrls, selectedTour]);

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-4">
        <div>
          <p className="text-primary text-[10px] font-black uppercase tracking-[0.3em] mb-2">
            Social Publishing
          </p>
          <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tighter">
            Tour Promotion Queue
          </h2>
          <p className="text-sm text-slate-500 font-medium mt-2 max-w-3xl">
            Turn a tour package into Facebook and Instagram drafts, refine the copy,
            and queue scheduled content without leaving the tenant admin.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Badge variant="primary">{stats.total} Posts</Badge>
          <Badge variant="secondary">{stats.scheduled} Scheduled</Badge>
          <Badge variant="secondary">{stats.dueNow} Due Now</Badge>
          <Badge variant="accent">{stats.drafts} Drafts</Badge>
          <Badge variant="luxury">{stats.liveAccounts} Live Accounts</Badge>
        </div>
      </div>

      {error && (
        <div className="rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[0.9fr_1.1fr] gap-8">
        <Card className="p-8 border-none shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-2">
                Queue
              </p>
              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
                Saved Posts
              </h3>
            </div>

            <Button type="button" variant="outline" onClick={startFreshDraft}>
              Create Post
            </Button>
          </div>

          <div className="flex flex-wrap gap-2 mb-6">
            {STATUS_OPTIONS.map((status) => (
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

          <div className="space-y-4 max-h-[700px] overflow-y-auto pr-1">
            {loading && <p className="text-sm font-medium text-slate-500">Loading social posts...</p>}

            {!loading && filteredPosts.length === 0 && (
              <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-sm font-medium text-slate-500">
                No social posts yet for this filter. Start by generating one from a tour package.
              </div>
            )}

            {!loading &&
              filteredPosts.map((post) => (
                <button
                  key={post._id}
                  type="button"
                  onClick={() => {
                    setSelectedTourId(post.tourPackageId || "");
                    setEditor(normalizeEditorFromPost(post));
                    setError("");
                  }}
                  className={`w-full text-left rounded-[28px] border px-5 py-5 transition ${
                    editor._id === post._id
                      ? "border-primary bg-primary/5"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-black text-slate-900 uppercase tracking-wide">
                        {post.title}
                      </p>
                      <p className="text-xs text-slate-500 font-medium mt-2 line-clamp-2">
                        {post.caption}
                      </p>
                    </div>
                    <Badge variant={post.status === "scheduled" ? "secondary" : "primary"}>
                      {post.status}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between gap-3 mt-4">
                    <div className="flex flex-wrap gap-2">
                      {(post.platforms || []).map((platform) => (
                        <span
                          key={`${post._id}-${platform}`}
                          className="px-3 py-1 rounded-full bg-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-600"
                        >
                          {platform}
                        </span>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        handlePublishNow(post._id);
                      }}
                      className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wide text-emerald-600 hover:text-emerald-700"
                    >
                      Publish Now
                    </button>

                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleDelete(post._id);
                      }}
                      className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wide text-red-500 hover:text-red-600"
                    >
                      <FaTrashAlt />
                      Delete
                    </button>
                  </div>
                </button>
              ))}
          </div>
        </Card>

        <Card className="p-8 border-none shadow-xl">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-2">
                Editor
              </p>
              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
                Build a Social Post
              </h3>
            </div>

            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={handleGenerate} disabled={generating}>
                <span className="inline-flex items-center gap-2">
                  <FaMagic />
                  {generating ? "Generating..." : "Generate Draft"}
                </span>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">
                Tour Package
              </label>
              <select
                value={selectedTourId}
                onChange={(event) => {
                  setSelectedTourId(event.target.value);
                  handleEditorFieldChange("tourPackageId", event.target.value);
                }}
                className="w-full rounded-2xl bg-slate-50 px-4 py-4 text-sm font-bold text-slate-900 border-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Choose a tour package</option>
                {tours.map((tour) => (
                  <option key={tour._id} value={tour._id}>
                    {tour.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">
                Internal Title
              </label>
              <input
                type="text"
                value={editor.title}
                onChange={(event) => handleEditorFieldChange("title", event.target.value)}
                className="w-full rounded-2xl bg-slate-50 px-4 py-4 text-sm font-bold text-slate-900 border-none focus:ring-2 focus:ring-primary"
                placeholder="Serengeti Migration Social Post"
              />
            </div>
          </div>

          <div className="space-y-2 mb-6">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">
              Caption
            </label>
            <textarea
              rows={6}
              value={editor.caption}
              onChange={(event) => handleEditorFieldChange("caption", event.target.value)}
              className="w-full rounded-[28px] bg-slate-50 px-5 py-5 text-sm font-medium text-slate-800 border-none focus:ring-2 focus:ring-primary"
              placeholder="Generate a draft or write your own caption."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">
                Hashtags
              </label>
              <textarea
                rows={4}
                value={editor.hashtagsText}
                onChange={(event) => handleEditorFieldChange("hashtagsText", event.target.value)}
                className="w-full rounded-[28px] bg-slate-50 px-5 py-5 text-sm font-medium text-slate-800 border-none focus:ring-2 focus:ring-primary"
                placeholder="#serengeti, #tanzaniasafari"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">
                Call To Action
              </label>
              <textarea
                rows={4}
                value={editor.callToAction}
                onChange={(event) => handleEditorFieldChange("callToAction", event.target.value)}
                className="w-full rounded-[28px] bg-slate-50 px-5 py-5 text-sm font-medium text-slate-800 border-none focus:ring-2 focus:ring-primary"
                placeholder="Send us your travel dates to get a custom quote."
              />
            </div>
          </div>

          <div className="mb-6">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1 block mb-3">
              Platforms
            </label>
            <div className="flex flex-wrap gap-3">
              {PLATFORM_OPTIONS.map((platform) => {
                const selected = editor.platforms.includes(platform.value);
                return (
                  <button
                    key={platform.value}
                    type="button"
                    onClick={() => handlePlatformToggle(platform.value)}
                    className={`inline-flex items-center gap-2 px-5 py-3 rounded-full border text-xs font-black uppercase tracking-widest transition ${
                      selected
                        ? "bg-slate-900 text-white border-slate-900"
                        : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
                    }`}
                  >
                    {platform.icon}
                    {platform.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mb-6">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1 block mb-3">
              Select Images
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {availableImages.length === 0 && (
                <div className="col-span-full rounded-3xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm font-bold text-amber-700">
                  This tour has no image candidates yet. Add an image before scheduling.
                </div>
              )}

              {availableImages.map((imageUrl) => {
                const selected = editor.imageUrls.includes(imageUrl);
                return (
                  <button
                    key={imageUrl}
                    type="button"
                    onClick={() => handleImageToggle(imageUrl)}
                    className={`relative overflow-hidden rounded-[24px] border-2 transition ${
                      selected ? "border-primary" : "border-transparent"
                    }`}
                  >
                    <img src={imageUrl} alt="Tour social asset" className="h-32 w-full object-cover" />
                    <span className={`absolute inset-x-0 bottom-0 px-3 py-2 text-[10px] font-black uppercase tracking-widest ${
                      selected ? "bg-primary text-white" : "bg-black/60 text-white"
                    }`}>
                      {selected ? "Selected" : "Use Image"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2 mb-8">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">
              Schedule Date
            </label>
            <div className="relative">
              <FaCalendarAlt className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="datetime-local"
                value={editor.scheduledFor}
                onChange={(event) => handleEditorFieldChange("scheduledFor", event.target.value)}
                className="w-full rounded-2xl bg-slate-50 pl-12 pr-4 py-4 text-sm font-bold text-slate-900 border-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Button type="button" onClick={() => handleSave("draft")} disabled={saving}>
              {saving ? "Saving..." : editor._id ? "Update Draft" : "Save Draft"}
            </Button>
            <Button type="button" variant="secondary" onClick={() => handleSave("scheduled")} disabled={saving}>
              {saving ? "Scheduling..." : "Schedule Post"}
            </Button>
          </div>
        </Card>
      </div>

      <Card className="p-8 border-none shadow-xl">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-2">
              Automation Queue
            </p>
            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
              Scheduled Publishing
            </h3>
            <p className="mt-2 text-sm font-medium text-slate-500">
              Run due scheduled posts for this tenant and confirm the queue is processing correctly.
            </p>
          </div>
          <Button type="button" onClick={handleRunAutomation} disabled={runningAutomation || stats.dueNow === 0}>
            {runningAutomation ? "Running..." : "Run Queue Now"}
          </Button>
        </div>

        <div className="mt-6 space-y-3">
          {(automationSummary.duePosts || []).length === 0 && (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-sm font-medium text-slate-500">
              No scheduled posts are due right now.
            </div>
          )}

          {(automationSummary.duePosts || []).map((post) => (
            <div key={post._id} className="rounded-2xl border border-slate-200 bg-white px-5 py-4">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-black uppercase tracking-wide text-slate-900">
                    {post.title}
                  </p>
                  <p className="text-sm font-medium text-slate-500">
                    Due {post.scheduledFor ? new Date(post.scheduledFor).toLocaleString() : "now"}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(post.platforms || []).map((platform) => (
                    <Badge key={`${post._id}-${platform}`} variant="secondary">
                      {platform}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default SocialPostsManager;
