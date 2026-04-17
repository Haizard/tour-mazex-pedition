import React, { useState, useEffect } from "react";
import { FaCog } from "react-icons/fa";
import Card from "../UI/Card";
import Button from "../UI/Button";
import Badge from "../UI/Badge";
import { fetchSiteSettings, fetchTenantSiteConfig, updateSiteSettings, updateTenantSiteConfig } from "../../services/api";
import { useTenant } from "../../context/TenantContext";

const SiteSettings = () => {
  const { refreshTenant } = useTenant();
  const [loading, setLoading] = useState(false);
  const [configLoading, setConfigLoading] = useState(false);
  const [settingsFormData, setSettingsFormData] = useState({
    facebook: "",
    twitter: "",
    instagram: "",
    whatsapp: "",
    youtube: "",
    reddit: "",
    logoUrl: "",
  });
  const [siteConfigFormData, setSiteConfigFormData] = useState({
    navigationConfig: {
      ctaLabel: "PLAN MY TRIP",
      ctaHref: "/plan-my-trip",
      aboutLabel: "About Us",
      aboutHref: "/about",
    },
    footerConfig: {
      brandName: "MAZ Expeditions",
      brandDescription:
        "Tanzania-based safari experts, creating personalized African journeys with local expertise and trusted guides.",
      primaryCtaLabel: "Plan My Trip",
      primaryCtaHref: "/plan-my-trip",
      secondaryCtaLabel: "Articles",
      secondaryCtaHref: "/blogs",
      copyrightLabel: "Copyright ©2025 MAZ Expeditions | All rights reserved",
    },
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
    loadTenantSiteConfig();
  }, []);

  const loadTenantSiteConfig = async () => {
    try {
      const res = await fetchTenantSiteConfig();
      if (res.data) {
        setSiteConfigFormData({
          navigationConfig: {
            ctaLabel: res.data.navigationConfig?.ctaLabel || "PLAN MY TRIP",
            ctaHref: res.data.navigationConfig?.ctaHref || "/plan-my-trip",
            aboutLabel: res.data.navigationConfig?.aboutLabel || "About Us",
            aboutHref: res.data.navigationConfig?.aboutHref || "/about",
          },
          footerConfig: {
            brandName: res.data.footerConfig?.brandName || "MAZ Expeditions",
            brandDescription:
              res.data.footerConfig?.brandDescription ||
              "Tanzania-based safari experts, creating personalized African journeys with local expertise and trusted guides.",
            primaryCtaLabel: res.data.footerConfig?.primaryCtaLabel || "Plan My Trip",
            primaryCtaHref: res.data.footerConfig?.primaryCtaHref || "/plan-my-trip",
            secondaryCtaLabel: res.data.footerConfig?.secondaryCtaLabel || "Articles",
            secondaryCtaHref: res.data.footerConfig?.secondaryCtaHref || "/blogs",
            copyrightLabel:
              res.data.footerConfig?.copyrightLabel ||
              "Copyright ©2025 MAZ Expeditions | All rights reserved",
          },
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateSiteSettings(settingsFormData);
      await refreshTenant?.();
      alert("Settings updated successfully!");
      loadSiteSettings();
    } catch (err) {
      console.error(err);
      alert("Failed to update settings.");
    } finally {
      setLoading(false);
    }
  };

  const handleSiteConfigSubmit = async (e) => {
    e.preventDefault();
    setConfigLoading(true);
    try {
      await updateTenantSiteConfig(siteConfigFormData);
      await refreshTenant?.();
      alert("Navigation and footer updated successfully!");
      loadTenantSiteConfig();
    } catch (err) {
      console.error(err);
      alert("Failed to update navigation/footer config.");
    } finally {
      setConfigLoading(false);
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

      <Card className="p-8 border-none shadow-2xl bg-white mt-8">
        <h3 className="text-xl font-bold mb-8 italic flex items-center gap-3">
          <FaCog className="text-primary" />
          Navigation & Footer Config
        </h3>

        <form onSubmit={handleSiteConfigSubmit} className="space-y-8">
          <div>
            <h4 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-4">
              Navigation
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Primary CTA Label</label>
                <input
                  type="text"
                  value={siteConfigFormData.navigationConfig.ctaLabel}
                  onChange={(e) =>
                    setSiteConfigFormData((current) => ({
                      ...current,
                      navigationConfig: {
                        ...current.navigationConfig,
                        ctaLabel: e.target.value,
                      },
                    }))
                  }
                  className="w-full bg-slate-50 p-4 rounded-2xl border-none focus:ring-2 focus:ring-primary font-bold"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Primary CTA Link</label>
                <input
                  type="text"
                  value={siteConfigFormData.navigationConfig.ctaHref}
                  onChange={(e) =>
                    setSiteConfigFormData((current) => ({
                      ...current,
                      navigationConfig: {
                        ...current.navigationConfig,
                        ctaHref: e.target.value,
                      },
                    }))
                  }
                  className="w-full bg-slate-50 p-4 rounded-2xl border-none focus:ring-2 focus:ring-primary font-bold"
                  placeholder="/plan-my-trip"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">About Label</label>
                <input
                  type="text"
                  value={siteConfigFormData.navigationConfig.aboutLabel}
                  onChange={(e) =>
                    setSiteConfigFormData((current) => ({
                      ...current,
                      navigationConfig: {
                        ...current.navigationConfig,
                        aboutLabel: e.target.value,
                      },
                    }))
                  }
                  className="w-full bg-slate-50 p-4 rounded-2xl border-none focus:ring-2 focus:ring-primary font-bold"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">About Link</label>
                <input
                  type="text"
                  value={siteConfigFormData.navigationConfig.aboutHref}
                  onChange={(e) =>
                    setSiteConfigFormData((current) => ({
                      ...current,
                      navigationConfig: {
                        ...current.navigationConfig,
                        aboutHref: e.target.value,
                      },
                    }))
                  }
                  className="w-full bg-slate-50 p-4 rounded-2xl border-none focus:ring-2 focus:ring-primary font-bold"
                />
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-4">
              Footer
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Brand Name</label>
                <input
                  type="text"
                  value={siteConfigFormData.footerConfig.brandName}
                  onChange={(e) =>
                    setSiteConfigFormData((current) => ({
                      ...current,
                      footerConfig: {
                        ...current.footerConfig,
                        brandName: e.target.value,
                      },
                    }))
                  }
                  className="w-full bg-slate-50 p-4 rounded-2xl border-none focus:ring-2 focus:ring-primary font-bold"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Brand Description</label>
                <textarea
                  rows={3}
                  value={siteConfigFormData.footerConfig.brandDescription}
                  onChange={(e) =>
                    setSiteConfigFormData((current) => ({
                      ...current,
                      footerConfig: {
                        ...current.footerConfig,
                        brandDescription: e.target.value,
                      },
                    }))
                  }
                  className="w-full bg-slate-50 p-4 rounded-2xl border-none focus:ring-2 focus:ring-primary font-medium"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Footer Primary CTA Label</label>
                <input
                  type="text"
                  value={siteConfigFormData.footerConfig.primaryCtaLabel}
                  onChange={(e) =>
                    setSiteConfigFormData((current) => ({
                      ...current,
                      footerConfig: {
                        ...current.footerConfig,
                        primaryCtaLabel: e.target.value,
                      },
                    }))
                  }
                  className="w-full bg-slate-50 p-4 rounded-2xl border-none focus:ring-2 focus:ring-primary font-bold"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Footer Primary CTA Link</label>
                <input
                  type="text"
                  value={siteConfigFormData.footerConfig.primaryCtaHref}
                  onChange={(e) =>
                    setSiteConfigFormData((current) => ({
                      ...current,
                      footerConfig: {
                        ...current.footerConfig,
                        primaryCtaHref: e.target.value,
                      },
                    }))
                  }
                  className="w-full bg-slate-50 p-4 rounded-2xl border-none focus:ring-2 focus:ring-primary font-bold"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Footer Secondary CTA Label</label>
                <input
                  type="text"
                  value={siteConfigFormData.footerConfig.secondaryCtaLabel}
                  onChange={(e) =>
                    setSiteConfigFormData((current) => ({
                      ...current,
                      footerConfig: {
                        ...current.footerConfig,
                        secondaryCtaLabel: e.target.value,
                      },
                    }))
                  }
                  className="w-full bg-slate-50 p-4 rounded-2xl border-none focus:ring-2 focus:ring-primary font-bold"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Footer Secondary CTA Link</label>
                <input
                  type="text"
                  value={siteConfigFormData.footerConfig.secondaryCtaHref}
                  onChange={(e) =>
                    setSiteConfigFormData((current) => ({
                      ...current,
                      footerConfig: {
                        ...current.footerConfig,
                        secondaryCtaHref: e.target.value,
                      },
                    }))
                  }
                  className="w-full bg-slate-50 p-4 rounded-2xl border-none focus:ring-2 focus:ring-primary font-bold"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Copyright Label</label>
                <input
                  type="text"
                  value={siteConfigFormData.footerConfig.copyrightLabel}
                  onChange={(e) =>
                    setSiteConfigFormData((current) => ({
                      ...current,
                      footerConfig: {
                        ...current.footerConfig,
                        copyrightLabel: e.target.value,
                      },
                    }))
                  }
                  className="w-full bg-slate-50 p-4 rounded-2xl border-none focus:ring-2 focus:ring-primary font-bold"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={configLoading} className="px-12 py-4 rounded-2xl shadow-lg">
              {configLoading ? "Saving..." : "Save Navigation & Footer"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default SiteSettings;
