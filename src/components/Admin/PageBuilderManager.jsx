import React from "react";
import { FaArrowDown, FaArrowUp, FaEye, FaEyeSlash, FaGripVertical, FaSave } from "react-icons/fa";
import Card from "../UI/Card";
import Button from "../UI/Button";
import { fetchPageConfig, updatePageConfig } from "../../services/api";
import { legacyHomePage } from "../../pageBuilder/defaultPages";
import { sectionRegistry } from "../../sections/registry/sectionRegistry";

const getSectionLabel = (type) =>
  sectionRegistry.metadata?.[type]?.label || type;

const getSectionVariants = (type) =>
  sectionRegistry.metadata?.[type]?.supportedVariants || ["default"];

const normalizeSections = (sections = []) =>
  [...sections]
    .filter((section) => section?.type)
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .map((section, index) => ({
      ...section,
      order: index + 1,
    }));

const SectionContentFields = ({ section, onChange }) => {
  const content = section.contentConfig || {};
  const data = section.dataConfig || {};

  if (section.type === "hero") {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
        <input
          type="text"
          value={content.eyebrow || ""}
          onChange={(e) => onChange("contentConfig", "eyebrow", e.target.value)}
          placeholder="Eyebrow text"
          className="w-full bg-slate-50 p-4 rounded-2xl border-none focus:ring-2 focus:ring-primary font-bold text-slate-900"
        />
        <input
          type="text"
          value={content.headlineScript || ""}
          onChange={(e) => onChange("contentConfig", "headlineScript", e.target.value)}
          placeholder="Script headline"
          className="w-full bg-slate-50 p-4 rounded-2xl border-none focus:ring-2 focus:ring-primary font-bold text-slate-900"
        />
        <input
          type="text"
          value={content.primaryCtaLabel || ""}
          onChange={(e) => onChange("contentConfig", "primaryCtaLabel", e.target.value)}
          placeholder="Primary CTA label"
          className="w-full bg-slate-50 p-4 rounded-2xl border-none focus:ring-2 focus:ring-primary font-bold text-slate-900"
        />
        <input
          type="text"
          value={content.primaryCtaHref || ""}
          onChange={(e) => onChange("contentConfig", "primaryCtaHref", e.target.value)}
          placeholder="Primary CTA link"
          className="w-full bg-slate-50 p-4 rounded-2xl border-none focus:ring-2 focus:ring-primary font-bold text-slate-900"
        />
        <input
          type="text"
          value={content.secondaryCtaLabel || ""}
          onChange={(e) => onChange("contentConfig", "secondaryCtaLabel", e.target.value)}
          placeholder="Secondary CTA label"
          className="w-full bg-slate-50 p-4 rounded-2xl border-none focus:ring-2 focus:ring-primary font-bold text-slate-900"
        />
        <input
          type="text"
          value={content.secondaryCtaHref || ""}
          onChange={(e) => onChange("contentConfig", "secondaryCtaHref", e.target.value)}
          placeholder="Secondary CTA link"
          className="w-full bg-slate-50 p-4 rounded-2xl border-none focus:ring-2 focus:ring-primary font-bold text-slate-900"
        />
      </div>
    );
  }

  if (section.type === "featuredPackages") {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
        <input
          type="text"
          value={content.prefixLabel || ""}
          onChange={(e) => onChange("contentConfig", "prefixLabel", e.target.value)}
          placeholder="Prefix label"
          className="w-full bg-slate-50 p-4 rounded-2xl border-none focus:ring-2 focus:ring-primary font-bold text-slate-900"
        />
        <input
          type="text"
          value={content.scriptLabel || ""}
          onChange={(e) => onChange("contentConfig", "scriptLabel", e.target.value)}
          placeholder="Script label"
          className="w-full bg-slate-50 p-4 rounded-2xl border-none focus:ring-2 focus:ring-primary font-bold text-slate-900"
        />
        <input
          type="text"
          value={content.suffixLabel || ""}
          onChange={(e) => onChange("contentConfig", "suffixLabel", e.target.value)}
          placeholder="Suffix label"
          className="w-full bg-slate-50 p-4 rounded-2xl border-none focus:ring-2 focus:ring-primary font-bold text-slate-900"
        />
        <input
          type="number"
          min="1"
          max="12"
          value={data.limit ?? 6}
          onChange={(e) => onChange("dataConfig", "limit", Number(e.target.value || 6))}
          placeholder="Number of cards"
          className="w-full bg-slate-50 p-4 rounded-2xl border-none focus:ring-2 focus:ring-primary font-bold text-slate-900"
        />
      </div>
    );
  }

  if (section.type === "cta") {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
        <input
          type="text"
          value={content.heading || ""}
          onChange={(e) => onChange("contentConfig", "heading", e.target.value)}
          placeholder="Heading"
          className="w-full bg-slate-50 p-4 rounded-2xl border-none focus:ring-2 focus:ring-primary font-bold text-slate-900"
        />
        <input
          type="text"
          value={content.subheading || ""}
          onChange={(e) => onChange("contentConfig", "subheading", e.target.value)}
          placeholder="Subheading"
          className="w-full bg-slate-50 p-4 rounded-2xl border-none focus:ring-2 focus:ring-primary font-bold text-slate-900"
        />
        <textarea
          rows={3}
          value={content.description || ""}
          onChange={(e) => onChange("contentConfig", "description", e.target.value)}
          placeholder="Description"
          className="w-full md:col-span-2 bg-slate-50 p-4 rounded-2xl border-none focus:ring-2 focus:ring-primary font-medium text-slate-700"
        />
        <input
          type="text"
          value={content.primaryLabel || ""}
          onChange={(e) => onChange("contentConfig", "primaryLabel", e.target.value)}
          placeholder="Primary button label"
          className="w-full bg-slate-50 p-4 rounded-2xl border-none focus:ring-2 focus:ring-primary font-bold text-slate-900"
        />
        <input
          type="text"
          value={content.primaryHref || ""}
          onChange={(e) => onChange("contentConfig", "primaryHref", e.target.value)}
          placeholder="Primary button link"
          className="w-full bg-slate-50 p-4 rounded-2xl border-none focus:ring-2 focus:ring-primary font-bold text-slate-900"
        />
        <input
          type="text"
          value={content.secondaryLabel || ""}
          onChange={(e) => onChange("contentConfig", "secondaryLabel", e.target.value)}
          placeholder="Secondary button label"
          className="w-full bg-slate-50 p-4 rounded-2xl border-none focus:ring-2 focus:ring-primary font-bold text-slate-900"
        />
        <input
          type="text"
          value={content.secondaryHref || ""}
          onChange={(e) => onChange("contentConfig", "secondaryHref", e.target.value)}
          placeholder="Secondary button link"
          className="w-full bg-slate-50 p-4 rounded-2xl border-none focus:ring-2 focus:ring-primary font-bold text-slate-900"
        />
        <input
          type="text"
          value={content.backgroundImage || ""}
          onChange={(e) => onChange("contentConfig", "backgroundImage", e.target.value)}
          placeholder="Background image URL"
          className="w-full md:col-span-2 bg-slate-50 p-4 rounded-2xl border-none focus:ring-2 focus:ring-primary font-bold text-slate-900"
        />
      </div>
    );
  }

  return (
    <div className="mt-5 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-xs font-bold uppercase tracking-widest text-slate-400">
      No editable content fields yet for this section.
    </div>
  );
};

const PageBuilderManager = () => {
  const [pageConfig, setPageConfig] = React.useState({
    pageType: "home",
    slug: "/",
    title: "Home",
    status: "published",
    seo: legacyHomePage.seo,
    sections: legacyHomePage.sections,
  });
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [message, setMessage] = React.useState("");

  React.useEffect(() => {
    let active = true;

    const loadConfig = async () => {
      try {
        const response = await fetchPageConfig("home");
        if (!active) {
          return;
        }

        const data = response.data || {};
        setPageConfig({
          pageType: data.pageType || "home",
          slug: data.slug || "/",
          title: data.title || "Home",
          status: data.status || "published",
          seo: data.seo || legacyHomePage.seo,
          sections: normalizeSections(
            data.sections?.length ? data.sections : legacyHomePage.sections
          ),
        });
      } catch (error) {
        console.error("Failed to load page config:", error);
        if (active) {
          setPageConfig((current) => ({
            ...current,
            sections: normalizeSections(legacyHomePage.sections),
          }));
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadConfig();

    return () => {
      active = false;
    };
  }, []);

  const updateSection = (index, updater) => {
    setPageConfig((current) => {
      const nextSections = [...current.sections];
      const previous = nextSections[index];
      nextSections[index] =
        typeof updater === "function" ? updater(previous) : updater;

      return {
        ...current,
        sections: normalizeSections(nextSections),
      };
    });
  };

  const moveSection = (index, direction) => {
    setPageConfig((current) => {
      const nextSections = [...current.sections];
      const targetIndex = index + direction;

      if (targetIndex < 0 || targetIndex >= nextSections.length) {
        return current;
      }

      const [moved] = nextSections.splice(index, 1);
      nextSections.splice(targetIndex, 0, moved);

      return {
        ...current,
        sections: normalizeSections(nextSections),
      };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage("");

    try {
      const payload = {
        ...pageConfig,
        sections: normalizeSections(pageConfig.sections),
      };

      const response = await updatePageConfig("home", payload);
      setPageConfig((current) => ({
        ...current,
        ...response.data,
        sections: normalizeSections(response.data?.sections || current.sections),
      }));
      setMessage("Homepage page config saved.");
    } catch (error) {
      console.error("Failed to save page config:", error);
      setMessage(error?.response?.data?.message || "Failed to save page config.");
    } finally {
      setSaving(false);
    }
  };

  const handleSectionFieldChange = (index, group, key, value) => {
    updateSection(index, (current) => ({
      ...current,
      [group]: {
        ...(current[group] || {}),
        [key]: value,
      },
    }));
  };

  if (loading) {
    return (
      <Card className="p-8 border-none shadow-xl">
        <p className="text-sm font-bold text-slate-500">Loading page builder…</p>
      </Card>
    );
  }

  return (
    <div className="animate-fade-in max-w-6xl">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-10">
        <div>
          <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tighter">
            Homepage Page Builder
          </h2>
          <p className="text-slate-500 font-medium mt-2">
            Manage section order, visibility, variants, and homepage SEO from tenant page config.
          </p>
        </div>
        <Button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="px-8 py-3 rounded-2xl shadow-lg shadow-primary/20 inline-flex items-center gap-3"
        >
          <FaSave />
          {saving ? "Saving..." : "Save Homepage"}
        </Button>
      </div>

      {message && (
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-bold text-slate-600 shadow-sm">
          {message}
        </div>
      )}

      <Card className="p-8 mb-8 border-none shadow-xl">
        <h3 className="text-xl font-bold mb-6 italic">Page Metadata</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">
              Page Title
            </label>
            <input
              type="text"
              value={pageConfig.title || ""}
              onChange={(e) =>
                setPageConfig((current) => ({ ...current, title: e.target.value }))
              }
              className="w-full bg-slate-50 p-4 rounded-2xl border-none focus:ring-2 focus:ring-primary font-bold text-slate-900"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">
              Slug
            </label>
            <input
              type="text"
              value={pageConfig.slug || "/"}
              onChange={(e) =>
                setPageConfig((current) => ({ ...current, slug: e.target.value }))
              }
              className="w-full bg-slate-50 p-4 rounded-2xl border-none focus:ring-2 focus:ring-primary font-bold text-slate-900"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">
              SEO Description
            </label>
            <textarea
              rows={3}
              value={pageConfig.seo?.description || ""}
              onChange={(e) =>
                setPageConfig((current) => ({
                  ...current,
                  seo: {
                    ...(current.seo || {}),
                    description: e.target.value,
                  },
                }))
              }
              className="w-full bg-slate-50 p-4 rounded-2xl border-none focus:ring-2 focus:ring-primary font-medium text-slate-700"
            />
          </div>
        </div>
      </Card>

      <div className="space-y-4">
        {pageConfig.sections.map((section, index) => (
          <Card
            key={section._id || `${section.type}-${index}`}
            className="p-6 border-none shadow-lg bg-white"
          >
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-4">
                <div className="mt-1 text-slate-300">
                  <FaGripVertical />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-2">
                    Section {index + 1}
                  </p>
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                    {getSectionLabel(section.type)}
                  </h3>
                  <p className="text-sm font-medium text-slate-500 mt-2">
                    Registry key: <span className="font-bold">{section.type}</span>
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:min-w-[540px]">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">
                    Variant
                  </label>
                  <select
                    value={section.variant || "default"}
                    onChange={(e) =>
                      updateSection(index, (current) => ({
                        ...current,
                        variant: e.target.value,
                      }))
                    }
                    className="w-full bg-slate-50 p-4 rounded-2xl border-none focus:ring-2 focus:ring-primary font-bold text-slate-900"
                  >
                    {getSectionVariants(section.type).map((variant) => (
                      <option key={variant} value={variant}>
                        {variant}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">
                    Visibility
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      updateSection(index, (current) => ({
                        ...current,
                        enabled: current.enabled === false,
                      }))
                    }
                    className={`w-full rounded-2xl px-4 py-4 text-sm font-black uppercase tracking-widest transition ${
                      section.enabled === false
                        ? "bg-slate-100 text-slate-500"
                        : "bg-emerald-50 text-emerald-700"
                    }`}
                  >
                    <span className="inline-flex items-center gap-2">
                      {section.enabled === false ? <FaEyeSlash /> : <FaEye />}
                      {section.enabled === false ? "Hidden" : "Visible"}
                    </span>
                  </button>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">
                    Order
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => moveSection(index, -1)}
                      disabled={index === 0}
                      className="flex-1 rounded-2xl bg-slate-100 px-4 py-4 text-slate-700 disabled:opacity-40"
                    >
                      <span className="inline-flex items-center gap-2 font-black uppercase text-xs tracking-widest">
                        <FaArrowUp />
                        Up
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => moveSection(index, 1)}
                      disabled={index === pageConfig.sections.length - 1}
                      className="flex-1 rounded-2xl bg-slate-100 px-4 py-4 text-slate-700 disabled:opacity-40"
                    >
                      <span className="inline-flex items-center gap-2 font-black uppercase text-xs tracking-widest">
                        <FaArrowDown />
                        Down
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 border-t border-slate-100 pt-6">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">
                Content Controls
              </p>
              <SectionContentFields
                section={section}
                onChange={(group, key, value) =>
                  handleSectionFieldChange(index, group, key, value)
                }
              />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default PageBuilderManager;
