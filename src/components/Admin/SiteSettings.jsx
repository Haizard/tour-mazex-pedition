import React, { useState, useEffect } from "react";
import { FaCog, FaImage, FaPalette } from "react-icons/fa";
import Card from "../UI/Card";
import Button from "../UI/Button";
import Badge from "../UI/Badge";
import { fetchSiteSettings, fetchTenantSiteConfig, updateSiteSettings, updateTenantSiteConfig, fetchTenantTheme, updateTenantTheme, uploadMedia } from "../../services/api";
import { useTenant } from "../../context/TenantContext";
import MediaUploadField from "../UI/MediaUploadField";
import { useAdminAuth } from "../../context/AdminAuthContext";


const SiteSettings = () => {
  const { refreshTenant } = useTenant();
  const [loading, setLoading] = useState(false);
  const [configLoading, setConfigLoading] = useState(false);
  const [themeLoading, setThemeLoading] = useState(false);
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

  const [themeFormData, setThemeFormData] = useState({
    primaryColor: "#0d9488",
    secondaryColor: "#eab308",
    accentColor: "#f97316",
    backgroundColor: "#ffffff",
    surfaceColor: "#f8fafc",
    textColor: "#1e293b",
    headingColor: "#0f172a",
    headingFont: "'Playfair Display', serif",
    bodyFont: "'Montserrat', sans-serif",
    borderRadius: "1rem",
    cardRadius: "1.5rem",
    buttonRadius: "9999px",
    shadowStyle: "0 10px 30px rgba(15, 23, 42, 0.12)",
    spacingScale: "1",
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
    loadTenantTheme();
  }, []);

  const loadTenantTheme = async () => {
    try {
      const res = await fetchTenantTheme();
      if (res.data?.theme) {
        setThemeFormData({
          ...themeFormData,
          ...res.data.theme
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

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

  const handleThemeSubmit = async (e) => {
    e.preventDefault();
    setThemeLoading(true);
    try {
      await updateTenantTheme(themeFormData);
      await refreshTenant?.();
      alert("Theme updated successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to update theme.");
    } finally {
      setThemeLoading(false);
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
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 mb-8">
            <h4 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
              <FaImage className="text-primary" />
              Branding & Logo
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
              <div className="md:col-span-2 space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Logo (URL or Upload)</label>
                  <MediaUploadField
                    value={settingsFormData.logoUrl}
                    onChange={(val) => setSettingsFormData({...settingsFormData, logoUrl: val})}
                    placeholder="https://your-domain.com/logo.png"
                    id="site-logo"
                  />
                  <p className="text-[9px] text-slate-400 italic pl-1">
                    Pro tip: Use a high-quality PNG or JPEG. Our system will automatically blend it with the theme.
                  </p>
                </div>

              </div>
              <div className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl shadow-sm border border-slate-100 min-h-[120px]">
                <p className="text-[8px] font-black uppercase text-slate-300 tracking-[0.2em] mb-3">Live Preview</p>
                {settingsFormData.logoUrl ? (
                  <img 
                    src={settingsFormData.logoUrl} 
                    alt="Logo Preview" 
                    className="h-16 w-auto object-contain mix-blend-multiply"
                    onError={(e) => e.target.style.display = 'none'}
                  />
                ) : (
                  <div className="flex flex-col items-center text-slate-200">
                    <FaImage size={24} />
                    <span className="text-[9px] mt-2 font-bold italic">No Logo Set</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <h3 className="text-xl font-bold mb-4 italic flex items-center gap-3 pt-4">
            <FaCog className="text-primary" />
            Social Media & Links
          </h3>

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

      {false && (
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
      )}

      <Card className="p-8 border-none shadow-2xl bg-white mt-8 mb-20">
        <h3 className="text-xl font-bold mb-8 italic flex items-center gap-3">
          <FaPalette className="text-primary" />
          Theme & Visual Identity
        </h3>

        <form onSubmit={handleThemeSubmit} className="space-y-10">
          <div>
            <h4 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-6">
              Primary Colors
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Primary Color</label>
                <div className="flex gap-3">
                  <input
                    type="color"
                    value={themeFormData.primaryColor}
                    onChange={(e) => setThemeFormData({...themeFormData, primaryColor: e.target.value})}
                    className="h-14 w-20 rounded-xl border-none cursor-pointer"
                  />
                  <input
                    type="text"
                    value={themeFormData.primaryColor}
                    onChange={(e) => setThemeFormData({...themeFormData, primaryColor: e.target.value})}
                    className="flex-1 bg-slate-50 p-4 rounded-2xl border-none font-mono text-sm"
                  />
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Secondary Color</label>
                <div className="flex gap-3">
                  <input
                    type="color"
                    value={themeFormData.secondaryColor}
                    onChange={(e) => setThemeFormData({...themeFormData, secondaryColor: e.target.value})}
                    className="h-14 w-20 rounded-xl border-none cursor-pointer"
                  />
                  <input
                    type="text"
                    value={themeFormData.secondaryColor}
                    onChange={(e) => setThemeFormData({...themeFormData, secondaryColor: e.target.value})}
                    className="flex-1 bg-slate-50 p-4 rounded-2xl border-none font-mono text-sm"
                  />
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Accent Color</label>
                <div className="flex gap-3">
                  <input
                    type="color"
                    value={themeFormData.accentColor}
                    onChange={(e) => setThemeFormData({...themeFormData, accentColor: e.target.value})}
                    className="h-14 w-20 rounded-xl border-none cursor-pointer"
                  />
                  <input
                    type="text"
                    value={themeFormData.accentColor}
                    onChange={(e) => setThemeFormData({...themeFormData, accentColor: e.target.value})}
                    className="flex-1 bg-slate-50 p-4 rounded-2xl border-none font-mono text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-6">
              Surface & Text
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Background Color</label>
                <div className="flex gap-3">
                  <input
                    type="color"
                    value={themeFormData.backgroundColor}
                    onChange={(e) => setThemeFormData({...themeFormData, backgroundColor: e.target.value})}
                    className="h-14 w-14 rounded-xl border-none cursor-pointer"
                  />
                  <input
                    type="text"
                    value={themeFormData.backgroundColor}
                    onChange={(e) => setThemeFormData({...themeFormData, backgroundColor: e.target.value})}
                    className="flex-1 bg-slate-50 p-4 rounded-2xl border-none font-mono text-sm"
                  />
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Heading Color</label>
                <div className="flex gap-3">
                  <input
                    type="color"
                    value={themeFormData.headingColor}
                    onChange={(e) => setThemeFormData({...themeFormData, headingColor: e.target.value})}
                    className="h-14 w-14 rounded-xl border-none cursor-pointer"
                  />
                  <input
                    type="text"
                    value={themeFormData.headingColor}
                    onChange={(e) => setThemeFormData({...themeFormData, headingColor: e.target.value})}
                    className="flex-1 bg-slate-50 p-4 rounded-2xl border-none font-mono text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-6">
              Typography & Spacing
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Heading Font</label>
                <input
                  type="text"
                  value={themeFormData.headingFont}
                  onChange={(e) => setThemeFormData({...themeFormData, headingFont: e.target.value})}
                  className="w-full bg-slate-50 p-4 rounded-2xl border-none focus:ring-2 focus:ring-primary font-medium"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Body Font</label>
                <input
                  type="text"
                  value={themeFormData.bodyFont}
                  onChange={(e) => setThemeFormData({...themeFormData, bodyFont: e.target.value})}
                  className="w-full bg-slate-50 p-4 rounded-2xl border-none focus:ring-2 focus:ring-primary font-medium"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Border Radius (Base)</label>
                <select
                  value={themeFormData.borderRadius}
                  onChange={(e) => setThemeFormData({...themeFormData, borderRadius: e.target.value})}
                  className="w-full bg-slate-50 p-4 rounded-2xl border-none focus:ring-2 focus:ring-primary font-medium"
                >
                  <option value="0rem">None</option>
                  <option value="0.5rem">Medium (0.5rem)</option>
                  <option value="1rem">Large (1rem)</option>
                  <option value="1.5rem">Extra Large (1.5rem)</option>
                  <option value="2rem">Huge (2rem)</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Spacing Scale</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.5"
                  max="2"
                  value={themeFormData.spacingScale}
                  onChange={(e) => setThemeFormData({...themeFormData, spacingScale: e.target.value})}
                  className="w-full bg-slate-50 p-4 rounded-2xl border-none focus:ring-2 focus:ring-primary font-medium"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={themeLoading} className="px-12 py-4 rounded-2xl shadow-lg">
              {themeLoading ? "Saving..." : "Save Theme Preferences"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default SiteSettings;
