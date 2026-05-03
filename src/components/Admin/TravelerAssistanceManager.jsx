import { useEffect, useState } from "react";

import Badge from "../UI/Badge";
import Button from "../UI/Button";
import Card from "../UI/Card";
import {
  createLanguageAssistantProfile,
  createTravelDocumentationGuide,
  deleteLanguageAssistantProfile,
  deleteTravelDocumentationGuide,
  fetchLanguageAssistantProfiles,
  fetchTravelDocumentationGuides,
  updateLanguageAssistantProfile,
  updateTravelDocumentationGuide,
} from "../../services/api";

const initialLanguageForm = {
  language: "",
  localeCode: "",
  tone: "",
  useCases: "",
  glossary: "",
  status: "draft",
  notes: "",
};

const initialGuideForm = {
  market: "",
  topic: "Visa",
  requirementSummary: "",
  sourceLabel: "",
  lastReviewedAt: "",
  status: "draft",
  notes: "",
};

const statusTone = {
  draft: "bg-amber-50 text-amber-700",
  active: "bg-emerald-50 text-emerald-700",
  paused: "bg-slate-100 text-slate-600",
  archived: "bg-slate-100 text-slate-600",
};

const TravelerAssistanceManager = () => {
  const [activeWorkspace, setActiveWorkspace] = useState("languages");
  const [languageProfiles, setLanguageProfiles] = useState([]);
  const [travelGuides, setTravelGuides] = useState([]);
  const [languageForm, setLanguageForm] = useState(initialLanguageForm);
  const [guideForm, setGuideForm] = useState(initialGuideForm);
  const [editingLanguageId, setEditingLanguageId] = useState(null);
  const [editingGuideId, setEditingGuideId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [languageResponse, guideResponse] = await Promise.all([
        fetchLanguageAssistantProfiles({ source: "postgres" }),
        fetchTravelDocumentationGuides({ source: "postgres" }),
      ]);

      setLanguageProfiles(Array.isArray(languageResponse.data) ? languageResponse.data : []);
      setTravelGuides(Array.isArray(guideResponse.data) ? guideResponse.data : []);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to load traveler assistance right now.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const resetLanguageForm = () => {
    setLanguageForm(initialLanguageForm);
    setEditingLanguageId(null);
  };

  const resetGuideForm = () => {
    setGuideForm(initialGuideForm);
    setEditingGuideId(null);
  };

  const handleLanguageSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");

    const payload = {
      ...languageForm,
      useCases: languageForm.useCases.split(",").map((item) => item.trim()).filter(Boolean),
      glossary: languageForm.glossary.split(",").map((item) => item.trim()).filter(Boolean),
    };

    try {
      if (editingLanguageId) {
        await updateLanguageAssistantProfile(editingLanguageId, payload);
      } else {
        await createLanguageAssistantProfile(payload);
      }

      resetLanguageForm();
      await loadData();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to save this language assistant profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleGuideSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      if (editingGuideId) {
        await updateTravelDocumentationGuide(editingGuideId, {
          ...guideForm,
          lastReviewedAt: guideForm.lastReviewedAt || null,
        });
      } else {
        await createTravelDocumentationGuide({
          ...guideForm,
          lastReviewedAt: guideForm.lastReviewedAt || null,
        });
      }

      resetGuideForm();
      await loadData();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to save this travel documentation guide.");
    } finally {
      setSaving(false);
    }
  };

  const languageCount = languageProfiles.length;
  const guideCount = travelGuides.length;

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="mb-2 text-[10px] font-black uppercase tracking-[0.3em] text-primary">
            Guest Assist
          </p>
          <h2 className="text-3xl font-black uppercase tracking-tighter text-gray-900">
            Traveler Assistance
          </h2>
          <p className="mt-2 max-w-3xl text-sm font-medium text-slate-500">
            Configure multilingual guest communication packs and travel-document guidance in one support workspace.
          </p>
        </div>
        <div className="flex gap-3">
          <Badge variant="accent">{languageCount} Languages</Badge>
          <Badge variant="secondary">{guideCount} Guides</Badge>
        </div>
      </div>

      {error && (
        <div className="rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 rounded-3xl border border-zinc-200 bg-white p-2 shadow-sm md:grid-cols-2">
        {[
          ["languages", "Language Packs", "Manage multilingual response setups and glossary packs"],
          ["travel-docs", "Travel Docs", "Manage visa, vaccine, insurance, and requirement guides"],
        ].map(([id, label, description]) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveWorkspace(id)}
            className={`rounded-2xl px-5 py-4 text-left transition ${
              activeWorkspace === id ? "bg-zinc-950 text-white shadow-sm" : "text-zinc-500 hover:bg-zinc-50"
            }`}
          >
            <span className="block text-sm font-black">{label}</span>
            <span className={`mt-1 block text-xs font-semibold ${activeWorkspace === id ? "text-zinc-300" : "text-zinc-500"}`}>
              {description}
            </span>
          </button>
        ))}
      </div>

      {activeWorkspace === "languages" && (
        <div className="grid grid-cols-1 gap-8 xl:grid-cols-[0.95fr_1.05fr]">
          <Card className="border-none p-8 shadow-xl">
            <h3 className="mb-6 text-xl font-black uppercase tracking-tight text-slate-900">
              {editingLanguageId ? "Edit Language Pack" : "Create Language Pack"}
            </h3>
            <form onSubmit={handleLanguageSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <input type="text" value={languageForm.language} onChange={(event) => setLanguageForm((current) => ({ ...current, language: event.target.value }))} placeholder="Language" className="w-full rounded-2xl border-none bg-slate-50 px-4 py-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-primary" />
                <input type="text" value={languageForm.localeCode} onChange={(event) => setLanguageForm((current) => ({ ...current, localeCode: event.target.value }))} placeholder="Locale code" className="w-full rounded-2xl border-none bg-slate-50 px-4 py-4 text-sm font-bold uppercase text-slate-900 focus:ring-2 focus:ring-primary" />
              </div>
              <input type="text" value={languageForm.tone} onChange={(event) => setLanguageForm((current) => ({ ...current, tone: event.target.value }))} placeholder="Tone" className="w-full rounded-2xl border-none bg-slate-50 px-4 py-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-primary" />
              <input type="text" value={languageForm.useCases} onChange={(event) => setLanguageForm((current) => ({ ...current, useCases: event.target.value }))} placeholder="Use cases (comma separated)" className="w-full rounded-2xl border-none bg-slate-50 px-4 py-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-primary" />
              <input type="text" value={languageForm.glossary} onChange={(event) => setLanguageForm((current) => ({ ...current, glossary: event.target.value }))} placeholder="Glossary terms (comma separated)" className="w-full rounded-2xl border-none bg-slate-50 px-4 py-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-primary" />
              <select value={languageForm.status} onChange={(event) => setLanguageForm((current) => ({ ...current, status: event.target.value }))} className="w-full rounded-2xl border-none bg-slate-50 px-4 py-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-primary">
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
              </select>
              <textarea rows={4} value={languageForm.notes} onChange={(event) => setLanguageForm((current) => ({ ...current, notes: event.target.value }))} placeholder="Language-pack notes..." className="w-full rounded-2xl border-none bg-slate-50 px-4 py-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-primary" />
              <div className="flex gap-3">
                <Button type="submit" disabled={saving}>{saving ? "Saving..." : editingLanguageId ? "Update Pack" : "Create Pack"}</Button>
                {editingLanguageId && <Button type="button" variant="secondary" onClick={resetLanguageForm} disabled={saving}>Cancel Edit</Button>}
              </div>
            </form>
          </Card>
          <Card className="border-none p-8 shadow-xl">
            <h3 className="mb-6 text-xl font-black uppercase tracking-tight text-slate-900">Language Packs</h3>
            <div className="space-y-4">
              {loading && <p className="text-sm font-medium text-slate-500">Loading language packs...</p>}
              {!loading && languageProfiles.length === 0 && <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-sm font-medium text-slate-500">No language packs created yet.</div>}
              {!loading && languageProfiles.map((profile) => (
                <div key={profile._id} className="rounded-[28px] border border-slate-200 bg-white px-5 py-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-xs font-black uppercase tracking-wide text-slate-900">{profile.language}</p>
                        <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${statusTone[profile.status] || statusTone.draft}`}>{profile.status}</span>
                        {profile.localeCode && <Badge variant="secondary">{profile.localeCode}</Badge>}
                      </div>
                      <p className="text-sm font-medium leading-6 text-slate-600">{profile.profileSummary?.summary || "No profile summary available."}</p>
                      <div className="flex flex-wrap gap-2">
                        {(profile.useCases || []).map((item) => <Badge key={`${profile._id}-${item}`} variant="secondary">{item}</Badge>)}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <button type="button" onClick={() => { setEditingLanguageId(profile._id); setLanguageForm({ language: profile.language || "", localeCode: profile.localeCode || "", tone: profile.tone || "", useCases: (profile.useCases || []).join(", "), glossary: (profile.glossary || []).join(", "), status: profile.status || "draft", notes: profile.notes || "" }); }} className="rounded-2xl border border-slate-200 px-4 py-2 text-[11px] font-black uppercase tracking-widest text-slate-700">Edit</button>
                      <button type="button" onClick={async () => { setSaving(true); setError(""); try { await deleteLanguageAssistantProfile(profile._id); if (editingLanguageId === profile._id) resetLanguageForm(); await loadData(); } catch (requestError) { setError(requestError.response?.data?.message || "Unable to delete this language pack."); } finally { setSaving(false); } }} className="rounded-2xl border border-red-200 px-4 py-2 text-[11px] font-black uppercase tracking-widest text-red-600">Delete</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {activeWorkspace === "travel-docs" && (
        <div className="grid grid-cols-1 gap-8 xl:grid-cols-[0.95fr_1.05fr]">
          <Card className="border-none p-8 shadow-xl">
            <h3 className="mb-6 text-xl font-black uppercase tracking-tight text-slate-900">
              {editingGuideId ? "Edit Guidance" : "Create Guidance"}
            </h3>
            <form onSubmit={handleGuideSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <input type="text" value={guideForm.market} onChange={(event) => setGuideForm((current) => ({ ...current, market: event.target.value }))} placeholder="Traveler market" className="w-full rounded-2xl border-none bg-slate-50 px-4 py-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-primary" />
                <input type="text" value={guideForm.topic} onChange={(event) => setGuideForm((current) => ({ ...current, topic: event.target.value }))} placeholder="Topic" className="w-full rounded-2xl border-none bg-slate-50 px-4 py-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-primary" />
              </div>
              <input type="text" value={guideForm.sourceLabel} onChange={(event) => setGuideForm((current) => ({ ...current, sourceLabel: event.target.value }))} placeholder="Source label" className="w-full rounded-2xl border-none bg-slate-50 px-4 py-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-primary" />
              <input type="date" value={guideForm.lastReviewedAt} onChange={(event) => setGuideForm((current) => ({ ...current, lastReviewedAt: event.target.value }))} className="w-full rounded-2xl border-none bg-slate-50 px-4 py-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-primary" />
              <select value={guideForm.status} onChange={(event) => setGuideForm((current) => ({ ...current, status: event.target.value }))} className="w-full rounded-2xl border-none bg-slate-50 px-4 py-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-primary">
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="archived">Archived</option>
              </select>
              <textarea rows={4} value={guideForm.requirementSummary} onChange={(event) => setGuideForm((current) => ({ ...current, requirementSummary: event.target.value }))} placeholder="Requirement summary..." className="w-full rounded-2xl border-none bg-slate-50 px-4 py-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-primary" />
              <textarea rows={3} value={guideForm.notes} onChange={(event) => setGuideForm((current) => ({ ...current, notes: event.target.value }))} placeholder="Guidance notes..." className="w-full rounded-2xl border-none bg-slate-50 px-4 py-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-primary" />
              <div className="flex gap-3">
                <Button type="submit" disabled={saving}>{saving ? "Saving..." : editingGuideId ? "Update Guide" : "Create Guide"}</Button>
                {editingGuideId && <Button type="button" variant="secondary" onClick={resetGuideForm} disabled={saving}>Cancel Edit</Button>}
              </div>
            </form>
          </Card>
          <Card className="border-none p-8 shadow-xl">
            <h3 className="mb-6 text-xl font-black uppercase tracking-tight text-slate-900">Travel Guidance Library</h3>
            <div className="space-y-4">
              {loading && <p className="text-sm font-medium text-slate-500">Loading travel guides...</p>}
              {!loading && travelGuides.length === 0 && <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-sm font-medium text-slate-500">No travel guides created yet.</div>}
              {!loading && travelGuides.map((guide) => (
                <div key={guide._id} className="rounded-[28px] border border-slate-200 bg-white px-5 py-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-xs font-black uppercase tracking-wide text-slate-900">{guide.market}</p>
                        <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${statusTone[guide.status] || statusTone.draft}`}>{guide.status}</span>
                        <Badge variant="secondary">{guide.topic}</Badge>
                      </div>
                      <p className="text-sm font-medium leading-6 text-slate-600">{guide.guideSummary?.summary || "No guide summary available."}</p>
                      <div className="flex flex-wrap gap-2">
                        {guide.sourceLabel && <Badge variant="secondary">{guide.sourceLabel}</Badge>}
                        {guide.lastReviewedAt && <Badge variant="secondary">Reviewed {new Date(guide.lastReviewedAt).toLocaleDateString()}</Badge>}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <button type="button" onClick={() => { setEditingGuideId(guide._id); setGuideForm({ market: guide.market || "", topic: guide.topic || "Visa", requirementSummary: guide.requirementSummary || "", sourceLabel: guide.sourceLabel || "", lastReviewedAt: guide.lastReviewedAt ? new Date(guide.lastReviewedAt).toISOString().slice(0, 10) : "", status: guide.status || "draft", notes: guide.notes || "" }); }} className="rounded-2xl border border-slate-200 px-4 py-2 text-[11px] font-black uppercase tracking-widest text-slate-700">Edit</button>
                      <button type="button" onClick={async () => { setSaving(true); setError(""); try { await deleteTravelDocumentationGuide(guide._id); if (editingGuideId === guide._id) resetGuideForm(); await loadData(); } catch (requestError) { setError(requestError.response?.data?.message || "Unable to delete this travel guide."); } finally { setSaving(false); } }} className="rounded-2xl border border-red-200 px-4 py-2 text-[11px] font-black uppercase tracking-widest text-red-600">Delete</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default TravelerAssistanceManager;
