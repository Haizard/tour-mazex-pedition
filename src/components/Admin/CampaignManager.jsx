import { useEffect, useState } from "react";

import Badge from "../UI/Badge";
import Button from "../UI/Button";
import Card from "../UI/Card";
import {
  createCampaign,
  deleteCampaign,
  fetchEmailAudienceContacts,
  fetchCampaigns,
  generateCampaignDraft,
} from "../../services/api";

const initialForm = {
  title: "",
  campaignType: "seasonal",
  month: "",
};

const CampaignManager = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [draft, setDraft] = useState(null);
  const [audienceCount, setAudienceCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadCampaigns = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetchCampaigns();
      setCampaigns(Array.isArray(response.data) ? response.data : []);
      const audienceResponse = await fetchEmailAudienceContacts();
      setAudienceCount(Array.isArray(audienceResponse.data) ? audienceResponse.data.length : 0);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to load campaigns.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCampaigns();
  }, []);

  const handleGenerateDraft = async () => {
    setSaving(true);
    setError("");
    try {
      const response = await generateCampaignDraft(form);
      setDraft(response.data);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to generate campaign draft.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCampaign = async () => {
    if (!draft) {
      setError("Generate a campaign draft before saving.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      await createCampaign(draft);
      setDraft(null);
      setForm(initialForm);
      await loadCampaigns();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to save campaign.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (campaignId) => {
    setSaving(true);
    setError("");
    try {
      await deleteCampaign(campaignId);
      await loadCampaigns();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to delete campaign.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-4">
        <div>
          <p className="text-primary text-[10px] font-black uppercase tracking-[0.3em] mb-2">
            Campaign Engine
          </p>
          <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tighter">
            Seasonal And Migration Campaigns
          </h2>
          <p className="text-sm text-slate-500 font-medium mt-2 max-w-3xl">
            Draft seasonal, migration, and holiday campaigns with multi-channel structure
            ready for your social, email, and WhatsApp workflow.
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant="primary">{campaigns.length} Campaigns</Badge>
          <Badge variant="secondary">{audienceCount} Audience Contacts</Badge>
        </div>
      </div>

      {error && (
        <div className="rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[0.95fr_1.05fr] gap-8">
        <Card className="p-8 border-none shadow-xl">
          <h3 className="text-xl font-black uppercase tracking-tight text-slate-900 mb-6">
            New Campaign
          </h3>

          <div className="space-y-4">
            <div className="rounded-3xl border border-sky-200 bg-sky-50 px-5 py-4 text-sm font-medium leading-6 text-sky-800">
              Email campaigns work best when the tenant first fills the email audience bucket in
              the `Email Integrations` tab. That bucket is where campaign contacts, repeat outreach,
              and future automations can draw their audience.
            </div>
            <input
              type="text"
              value={form.title}
              onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
              placeholder="Campaign title"
              className="w-full rounded-2xl bg-slate-50 px-4 py-4 text-sm font-bold text-slate-900 border-none focus:ring-2 focus:ring-primary"
            />
            <select
              value={form.campaignType}
              onChange={(event) => setForm((current) => ({ ...current, campaignType: event.target.value }))}
              className="w-full rounded-2xl bg-slate-50 px-4 py-4 text-sm font-bold text-slate-900 border-none focus:ring-2 focus:ring-primary"
            >
              <option value="seasonal">Seasonal</option>
              <option value="migration">Migration</option>
              <option value="holiday">Holiday</option>
              <option value="custom">Custom</option>
            </select>
            <input
              type="text"
              value={form.month}
              onChange={(event) => setForm((current) => ({ ...current, month: event.target.value }))}
              placeholder="Campaign month or date window"
              className="w-full rounded-2xl bg-slate-50 px-4 py-4 text-sm font-bold text-slate-900 border-none focus:ring-2 focus:ring-primary"
            />
            <div className="flex gap-3">
              <Button type="button" onClick={handleGenerateDraft} disabled={saving}>
                {saving ? "Generating..." : "Generate Draft"}
              </Button>
              {draft && (
                <Button type="button" variant="secondary" onClick={handleSaveCampaign} disabled={saving}>
                  Save Campaign
                </Button>
              )}
            </div>
          </div>

          {draft && (
            <div className="mt-8 rounded-[28px] bg-slate-50 p-6">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-2">
                Draft Preview
              </p>
              <h4 className="text-lg font-black uppercase tracking-tight text-slate-900">
                {draft.title}
              </h4>
              <p className="mt-3 text-sm font-medium leading-6 text-slate-700">
                {draft.summary}
              </p>
              <div className="flex flex-wrap gap-2 mt-4">
                {draft.channels.map((channel) => (
                  <Badge key={channel} variant="secondary">
                    {channel}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </Card>

        <Card className="p-8 border-none shadow-xl">
          <h3 className="text-xl font-black uppercase tracking-tight text-slate-900 mb-6">
            Saved Campaigns
          </h3>

          <div className="space-y-4">
            {loading && (
              <p className="text-sm font-medium text-slate-500">Loading campaigns...</p>
            )}

            {!loading && campaigns.length === 0 && (
              <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-sm font-medium text-slate-500">
                No campaigns saved yet.
              </div>
            )}

            {!loading &&
              campaigns.map((campaign) => (
                <div key={campaign._id} className="rounded-[28px] border border-slate-200 bg-white px-5 py-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-black uppercase tracking-wide text-slate-900">
                        {campaign.title}
                      </p>
                      <p className="mt-2 text-sm font-medium leading-6 text-slate-600">
                        {campaign.summary}
                      </p>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {campaign.channels.map((channel) => (
                          <Badge key={`${campaign._id}-${channel}`} variant="primary">
                            {channel}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDelete(campaign._id)}
                      className="rounded-2xl border border-red-200 px-4 py-2 text-[11px] font-black uppercase tracking-widest text-red-600"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default CampaignManager;
