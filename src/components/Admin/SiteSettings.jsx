import React, { useState, useEffect } from "react";
import { FaCog } from "react-icons/fa";
import Card from "../UI/Card";
import Button from "../UI/Button";
import Badge from "../UI/Badge";
import { fetchSiteSettings, updateSiteSettings } from "../../services/api";

const SiteSettings = () => {
  const [loading, setLoading] = useState(false);
  const [settingsFormData, setSettingsFormData] = useState({
    facebook: "",
    twitter: "",
    instagram: "",
    whatsapp: "",
    youtube: "",
    reddit: "",
    logoUrl: "",
  });

  const loadSiteSettings = async () => {
    try {
      const res = await fetchSiteSettings();
      if (res.data) {
        setSettingsFormData({
          facebook: res.data.facebook || "",
          twitter: res.data.twitter || "",
          instagram: res.data.instagram || "",
          whatsapp: res.data.whatsapp || "",
          youtube: res.data.youtube || "",
          reddit: res.data.reddit || "",
          logoUrl: res.data.logoUrl || "",
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadSiteSettings();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateSiteSettings(settingsFormData);
      alert("Settings updated successfully!");
      loadSiteSettings();
    } catch (err) {
      console.error(err);
      alert("Failed to update settings.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in max-w-4xl">
      <div className="flex justify-between items-center mb-10">
        <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tighter">
          Site Settings
        </h2>
        <Badge variant="primary">Global Config</Badge>
      </div>

      <Card className="p-8 border-none shadow-2xl bg-white">
        <h3 className="text-xl font-bold mb-8 italic flex items-center gap-3">
          <FaCog className="text-primary" />
          Social Media & Links
        </h3>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Facebook URL</label>
              <input
                type="text"
                value={settingsFormData.facebook}
                onChange={(e) => setSettingsFormData({...settingsFormData, facebook: e.target.value})}
                className="w-full bg-slate-50 p-4 rounded-2xl border-none focus:ring-2 focus:ring-primary font-bold"
                placeholder="https://facebook.com/..."
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Twitter URL</label>
              <input
                type="text"
                value={settingsFormData.twitter}
                onChange={(e) => setSettingsFormData({...settingsFormData, twitter: e.target.value})}
                className="w-full bg-slate-50 p-4 rounded-2xl border-none focus:ring-2 focus:ring-primary font-bold"
                placeholder="https://twitter.com/..."
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Instagram URL</label>
              <input
                type="text"
                value={settingsFormData.instagram}
                onChange={(e) => setSettingsFormData({...settingsFormData, instagram: e.target.value})}
                className="w-full bg-slate-50 p-4 rounded-2xl border-none focus:ring-2 focus:ring-primary font-bold"
                placeholder="https://instagram.com/..."
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">WhatsApp Number</label>
              <input
                type="text"
                value={settingsFormData.whatsapp}
                onChange={(e) => setSettingsFormData({...settingsFormData, whatsapp: e.target.value})}
                className="w-full bg-slate-50 p-4 rounded-2xl border-none focus:ring-2 focus:ring-primary font-bold"
                placeholder="e.g. +255762226648"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">YouTube URL</label>
              <input
                type="text"
                value={settingsFormData.youtube}
                onChange={(e) => setSettingsFormData({...settingsFormData, youtube: e.target.value})}
                className="w-full bg-slate-50 p-4 rounded-2xl border-none focus:ring-2 focus:ring-primary font-bold"
                placeholder="https://youtube.com/..."
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Reddit URL</label>
              <input
                type="text"
                value={settingsFormData.reddit}
                onChange={(e) => setSettingsFormData({...settingsFormData, reddit: e.target.value})}
                className="w-full bg-slate-50 p-4 rounded-2xl border-none focus:ring-2 focus:ring-primary font-bold"
                placeholder="https://reddit.com/user/..."
              />
            </div>
          </div>

          <div className="flex justify-end pt-6">
            <Button type="submit" disabled={loading} className="px-12 py-4 rounded-2xl shadow-lg">
              {loading ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default SiteSettings;
