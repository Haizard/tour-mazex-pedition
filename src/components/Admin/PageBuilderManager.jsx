import React from "react";
import {
  FaArrowDown,
  FaArrowUp,
  FaEye,
  FaEyeSlash,
  FaGripVertical,
  FaPlus,
  FaSave,
  FaTrash,
  FaUpload,
} from "react-icons/fa";
import Button from "../UI/Button";
import {
  fetchPageConfig,
  fetchPlatformTenantPageConfig,
  getMediaUrl,
  updatePageConfig,
  updatePlatformTenantPageConfig,
  uploadMedia,
} from "../../services/api";
import { legacyHomePage } from "../../pageBuilder/defaultPages";
import { sectionRegistry } from "../../sections/registry/sectionRegistry";
import { useAdminAuth } from "../../context/AdminAuthContext";

const getSectionLabel = (type) =>
  sectionRegistry.metadata?.[type]?.label || type;

const getSectionVariants = (type) =>
  sectionRegistry.metadata?.[type]?.supportedVariants || ["default"];

const getSectionPresets = (type) =>
  sectionRegistry.metadata?.[type]?.presets ||
  getSectionVariants(type).map((variant) => ({
    value: variant,
    label: variant,
  }));

const getDefaultSectionTemplate = (type, variant) => {
  // 1. Try to find an exact match for type AND variant in legacy setup
  let fromLegacy = legacyHomePage.sections.find(
    (section) => section.type === type && section.variant === variant
  );

  // 2. Fallback to just matching the type
  if (!fromLegacy) {
    fromLegacy = legacyHomePage.sections.find((section) => section.type === type);
  }

  if (fromLegacy) {
    return {
      ...fromLegacy,
      // If we matched the type but not the variant, ensure the requested variant is set
      variant: variant || fromLegacy.variant || "default",
      dataConfig: { ...(fromLegacy.dataConfig || {}) },
      contentConfig: { ...(fromLegacy.contentConfig || {}) },
      styleConfig: { ...(fromLegacy.styleConfig || {}) },
    };
  }

  return {
    type,
    variant: variant || getSectionVariants(type)[0] || "default",
    enabled: true,
    dataConfig: {},
    contentConfig: {},
    styleConfig: {},
  };
};

const normalizeSections = (sections = []) =>
  [...sections]
    .filter((section) => section?.type)
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .map((section, index) => ({
      ...section,
      order: index + 1,
    }));

const reorderSections = (sections = []) =>
  sections
    .filter((section) => section?.type)
    .map((section, index) => ({
      ...section,
      order: index + 1,
    }));

const INPUT_CLASS =
  "w-full bg-slate-50 p-4 rounded-2xl border-none focus:ring-2 focus:ring-primary font-bold text-slate-900";
const TEXTAREA_CLASS =
  "w-full bg-slate-50 p-4 rounded-2xl border-none focus:ring-2 focus:ring-primary font-medium text-slate-700";
const EDITOR_PANEL_CLASS =
  "rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm";
const PAGE_TYPES = [
  { value: "home", label: "Home", slug: "/" },
  { value: "tours", label: "Tours Listing", slug: "/packages" },
  { value: "tour-detail", label: "Tour Detail", slug: "/packages/:slug" },
  { value: "blogs", label: "Blog Listing", slug: "/blogs" },
  { value: "blog-detail", label: "Blog Detail", slug: "/blogs/:slug" },
  { value: "tailor-made", label: "Tailor Made", slug: "/tailor-made" },
  { value: "contact", label: "Contact", slug: "/contact" },
  { value: "landing", label: "Custom Landing", slug: "/landing" },
];

const getPageTypeMeta = (pageType) =>
  PAGE_TYPES.find((page) => page.value === pageType) || PAGE_TYPES[0];

const getValueAtPath = (source, path) =>
  String(path || "")
    .split(".")
    .filter(Boolean)
    .reduce((current, part) => (current == null ? undefined : current[part]), source);

const setValueAtPath = (source, path, value) => {
  const keys = String(path || "").split(".").filter(Boolean);

  if (!keys.length) {
    return value;
  }

  const next = Array.isArray(source) ? [...source] : { ...(source || {}) };
  let cursor = next;

  keys.forEach((key, index) => {
    if (index === keys.length - 1) {
      cursor[key] = value;
      return;
    }

    const currentValue = cursor[key];
    cursor[key] = Array.isArray(currentValue)
      ? [...currentValue]
      : { ...(currentValue || {}) };
    cursor = cursor[key];
  });

  return next;
};

const parseFieldValue = (rawValue, field) => {
  if (field.type === "number") {
    if (rawValue === "") {
      return field.fallbackValue ?? 0;
    }

    return Number(rawValue);
  }

  if (field.type === "stringList") {
    return String(rawValue)
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return rawValue;
};

const getFieldClassName = (field) =>
  `${field.type === "textarea" || field.type === "stringList" ? TEXTAREA_CLASS : INPUT_CLASS} ${
    field.colSpan === 2 ? "md:col-span-2" : ""
  }`.trim();

const MediaUploadField = ({ field, value, onChange, inputIdPrefix }) => {
  const { admin } = useAdminAuth();
  const [uploading, setUploading] = React.useState(false);
  const fileInputRef = React.useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      alert("File is too large! Maximum allowed is 15MB for MongoDB storage.");
      return;
    }

    setUploading(true);
    try {
      // Use tenantId from admin or default to maz-expeditions ID if not found
      // (In production, the admin object will have this populated)
      const tenantId = admin?.tenantId || "65de1234567890abcdef1234"; 
      
      const response = await uploadMedia(file, tenantId);
      const mediaUrl = response.data.url;
      onChange(mediaUrl);
      alert("Successfully uploaded!");
    } catch (error) {
      console.error("Upload failed:", error);
      alert(`Upload failed: ${error.response?.data?.message || error.message}`);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className={`space-y-2 ${field.colSpan === 2 ? "md:col-span-2" : ""}`}>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            id={`${inputIdPrefix}-${field.path}`}
            type="text"
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder || "Enter URL or upload a file"}
            className={INPUT_CLASS}
          />
        </div>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="video/mp4,image/*"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className={`px-4 rounded-2xl flex items-center justify-center transition shadow-sm ${
            uploading 
              ? "bg-slate-100 text-slate-400 cursor-not-allowed" 
              : "bg-primary text-white hover:bg-primary/90"
          }`}
          title="Upload file to MongoDB"
        >
          {uploading ? (
            <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
          ) : (
            <FaUpload className="text-lg" />
          )}
        </button>
      </div>
      {value && (
        <div className="mt-2 rounded-2xl overflow-hidden border border-slate-100 bg-slate-50 h-24 flex items-center justify-center relative group">
          {typeof value === "string" && (value.endsWith(".mp4") || value.includes("/video")) ? (
            <video 
              src={getMediaUrl(value)} 
              className="w-full h-full object-cover" 
              muted 
              loop 
              autoPlay 
            />
          ) : (
            <img 
              src={getMediaUrl(value)} 
              alt="Media preview" 
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.parentElement.innerHTML = '<span class="text-[10px] text-slate-400 font-bold uppercase">Invalid Media URL</span>';
              }}
            />
          )}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <span className="text-[10px] text-white font-bold uppercase tracking-widest">Media Preview</span>
          </div>
        </div>
      )}
      <p className="text-[9px] font-medium text-slate-400 pl-1">
        Max size: 15MB. Best for background videos and images.
      </p>
    </div>
  );
};

const SimpleEditorField = ({ field, value, onChange, inputIdPrefix }) => {
  if (field.type === "select") {
    return (
      <select
        id={`${inputIdPrefix}-${field.path}`}
        value={value ?? field.fallbackValue ?? ""}
        onChange={(e) => onChange(parseFieldValue(e.target.value, field))}
        className={getFieldClassName(field)}
      >
        {(field.options || []).map((option) => (
          <option key={`${field.path}-${option.value || "empty"}`} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  }

  const commonProps = {
    placeholder: field.placeholder,
    className: getFieldClassName(field),
  };

  if (field.type === "media") {
    return (
      <MediaUploadField
        field={field}
        value={value}
        onChange={onChange}
        inputIdPrefix={inputIdPrefix}
      />
    );
  }

  if (field.type === "textarea" || field.type === "stringList") {
    return (
      <textarea
        rows={field.rows || 3}
        value={field.type === "stringList" ? (Array.isArray(value) ? value.join("\n") : "") : value || ""}
        onChange={(e) => onChange(parseFieldValue(e.target.value, field))}
        {...commonProps}
      />
    );
  }

  return (
    <input
      id={`${inputIdPrefix}-${field.path}`}
      type={field.type === "number" ? "number" : "text"}
      min={field.min}
      max={field.max}
      value={value ?? field.fallbackValue ?? ""}
      onChange={(e) => onChange(parseFieldValue(e.target.value, field))}
      {...commonProps}
    />
  );
};

const ObjectListEditorField = ({ field, items, onChange, inputIdPrefix }) => (
  <div className="md:col-span-2 mt-2 rounded-3xl border border-slate-100 bg-slate-50/60 p-4">
    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">
      {field.itemLabel || "Items"}
    </p>
    <div className="space-y-4">
      {items.slice(0, field.limit || items.length).map((item, itemIndex) => (
        <div
          key={`${field.path}-${itemIndex}`}
          className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-2xl bg-white p-4 shadow-sm"
        >
          {field.fields.map((nestedField) => (
            <SimpleEditorField
              key={`${field.path}-${itemIndex}-${nestedField.path}`}
              field={{
                ...nestedField,
                placeholder: `${field.itemLabel || "Item"} ${itemIndex + 1} ${nestedField.placeholder || nestedField.path}`,
              }}
              value={getValueAtPath(item, nestedField.path)}
              inputIdPrefix={`${inputIdPrefix}-${field.path}-${itemIndex}`}
              onChange={(nextValue) => {
                const nextItems = items.map((currentItem, currentIndex) =>
                  currentIndex === itemIndex
                    ? setValueAtPath(currentItem || {}, nestedField.path, nextValue)
                    : currentItem
                );
                onChange(nextItems);
              }}
            />
          ))}
        </div>
      ))}
    </div>
  </div>
);

const SectionContentFields = ({ section, onChange }) => {
  const schema =
    sectionRegistry.getEditorSchema?.(section.type, section.variant) || [];

  if (!schema.length) {
    return (
      <div className="mt-5 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-xs font-bold uppercase tracking-widest text-slate-400">
        No editable content fields yet for this section.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
      {schema.map((field) => {
        const source = section[field.group] || {};
        const value = getValueAtPath(source, field.path);
        const fieldKey = `${section.type}-${field.group}-${field.path}`;

        if (field.type === "objectList") {
          return (
            <ObjectListEditorField
              key={fieldKey}
              field={field}
              items={Array.isArray(value) ? value : []}
              inputIdPrefix={section.type}
              onChange={(nextValue) => onChange(field.group, field.path, nextValue)}
            />
          );
        }

        return (
          <SimpleEditorField
            key={fieldKey}
            field={field}
            value={value}
            inputIdPrefix={section.type}
            onChange={(nextValue) => onChange(field.group, field.path, nextValue)}
          />
        );
      })}
    </div>
  );
};

const SectionStyleFields = ({ section, onChange }) => {
  const schema =
    sectionRegistry.getStyleSchema?.(section.type, section.variant) || [];

  if (!schema.length) {
    return (
      <div className="mt-5 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-xs font-bold uppercase tracking-widest text-slate-400">
        No style controls configured for this section.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
      {schema.map((field) => {
        const source = section[field.group] || {};
        const value = getValueAtPath(source, field.path);
        const fieldKey = `${section.type}-${field.group}-${field.path}`;

        return (
          <SimpleEditorField
            key={fieldKey}
            field={field}
            value={value}
            inputIdPrefix={`${section.type}-style`}
            onChange={(nextValue) => onChange(field.group, field.path, nextValue)}
          />
        );
      })}
    </div>
  );
};

const PageBuilderManager = ({
  mode = "layout",
  tenantId = "",
  tenantName = "",
} = {}) => {
  const canManageLayout = mode === "layout";
  const [pageConfig, setPageConfig] = React.useState({
    pageType: "home",
    slug: "/",
    title: "Home",
    status: "published",
    seo: canManageLayout ? legacyHomePage.seo : {},
    sections: canManageLayout ? legacyHomePage.sections : [],
  });
  const [activePageType, setActivePageType] = React.useState("home");
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [message, setMessage] = React.useState("");
  const [newSectionType, setNewSectionType] = React.useState(
    Object.keys(sectionRegistry.metadata || {})[0] || "hero"
  );
  const [newSectionVariant, setNewSectionVariant] = React.useState(
    getSectionPresets(Object.keys(sectionRegistry.metadata || {})[0] || "hero")[0]?.value ||
      "default"
  );
  const [activeTool, setActiveTool] = React.useState("settings");
  const [selectedSectionIndex, setSelectedSectionIndex] = React.useState(0);

  React.useEffect(() => {
    let active = true;

    const loadConfig = async () => {
      setLoading(true);
      try {
        const response = tenantId
          ? await fetchPlatformTenantPageConfig(tenantId, activePageType)
          : await fetchPageConfig(activePageType);
        if (!active) {
          return;
        }

        const pageMeta = getPageTypeMeta(activePageType);
        const data = response.data || {};
        setPageConfig({
          pageType: data.pageType || activePageType,
          slug: data.slug || pageMeta.slug,
          title: data.title || pageMeta.label,
          status: data.status || "published",
          seo: data.seo || (canManageLayout ? legacyHomePage.seo : {}),
          sections: normalizeSections(
            data.sections?.length
              ? data.sections
              : canManageLayout && !tenantId && activePageType === "home"
                ? legacyHomePage.sections
                : []
          ),
        });
      } catch (error) {
        console.error("Failed to load page config:", error);
        if (active) {
          setPageConfig((current) => ({
            ...current,
            pageType: activePageType,
            slug: getPageTypeMeta(activePageType).slug,
            title: getPageTypeMeta(activePageType).label,
            sections: canManageLayout && !tenantId && activePageType === "home"
              ? normalizeSections(legacyHomePage.sections)
              : [],
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
  }, [activePageType, canManageLayout, tenantId]);

  const updateSection = (index, updater) => {
    setPageConfig((current) => {
      const nextSections = [...current.sections];
      const previous = nextSections[index];
      nextSections[index] =
        typeof updater === "function" ? updater(previous) : updater;

      return {
        ...current,
        sections: reorderSections(nextSections),
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
    setSelectedSectionIndex((current) => {
      if (current === index) return index + direction;
      if (current === index + direction) return index;
      return current;
    });
  };

  const addSection = () => {
    if (!newSectionType) {
      return;
    }

    const meta = sectionRegistry.metadata?.[newSectionType];
    const alreadyExists = pageConfig.sections.some(
      (section) => section.type === newSectionType
    );

    if (meta?.allowMultiple === false && alreadyExists) {
      setMessage(`${getSectionLabel(newSectionType)} is a singleton section and is already on the page.`);
      return;
    }

    setPageConfig((current) => {
      const nextSections = reorderSections([
        ...current.sections,
        {
          ...getDefaultSectionTemplate(newSectionType, newSectionVariant),
          order: current.sections.length + 1,
        },
      ]);
      setSelectedSectionIndex(nextSections.length - 1);
      setActiveTool("section");
      return {
        ...current,
        sections: nextSections,
      };
    });
    setMessage(`Added ${getSectionLabel(newSectionType)} section with ${newSectionVariant} preset.`);
  };

  const removeSection = (index) => {
    setPageConfig((current) => ({
      ...current,
      sections: normalizeSections(
        current.sections.filter((_, currentIndex) => currentIndex !== index)
      ),
    }));
    setSelectedSectionIndex((current) => Math.max(0, Math.min(current, pageConfig.sections.length - 2)));
    setMessage("Section removed from homepage.");
  };

  const applySectionPreset = (index) => {
    updateSection(index, (current) => {
      const preset = getDefaultSectionTemplate(current.type, current.variant);

      // Force a clean reset of all fields to the default template
      return {
        ...current,
        // Reset everything except the system-level fields like _id and type
        variant: preset.variant || current.variant,
        enabled: preset.enabled ?? current.enabled ?? true,
        order: current.order, // Preserve order
        dataConfig: { ...(preset.dataConfig || {}) },
        contentConfig: { ...(preset.contentConfig || {}) },
        styleConfig: { ...(preset.styleConfig || {}) },
      };
    });
    setMessage(`Defaults reapplied for ${getSectionLabel(pageConfig.sections[index].type)}.`);
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage("");

    try {
      const payload = {
        ...pageConfig,
        pageType: activePageType,
        sections: normalizeSections(pageConfig.sections),
      };

      const response = tenantId
        ? await updatePlatformTenantPageConfig(tenantId, activePageType, payload)
        : await updatePageConfig(activePageType, payload);
      setPageConfig((current) => ({
        ...current,
        ...response.data,
        sections: normalizeSections(response.data?.sections || current.sections),
      }));
      setMessage(canManageLayout ? "Homepage layout saved." : "Homepage content saved.");
    } catch (error) {
      console.error("Failed to save page config:", error);
      setMessage(error?.response?.data?.message || "Failed to save page config.");
    } finally {
      setSaving(false);
    }
  };

  const handleSectionFieldChange = (index, group, path, value) => {
    updateSection(index, (current) => ({
      ...current,
      [group]: setValueAtPath(current[group], path, value),
    }));
  };

  React.useEffect(() => {
    setSelectedSectionIndex((current) => {
      if (!pageConfig.sections.length) return 0;
      return Math.max(0, Math.min(current, pageConfig.sections.length - 1));
    });
  }, [pageConfig.sections.length]);

  if (loading) {
    return (
      <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-100 border-t-slate-950" />
          <div>
            <p className="text-sm font-black text-slate-900">Opening page studio...</p>
            <p className="mt-1 text-xs font-semibold text-slate-500">Loading only the active editor to keep the builder fast.</p>
          </div>
        </div>
      </div>
    );
  }

  const selectedSection = pageConfig.sections[selectedSectionIndex] || null;

  const renderPageSettings = () => (
    <div className={EDITOR_PANEL_CLASS}>
      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Page Settings</p>
      <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Homepage Metadata</h3>
      <p className="mt-2 text-sm font-medium text-slate-500">
        Control title, slug, and SEO defaults for this tenant homepage.
      </p>
      <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
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
            className={INPUT_CLASS}
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
            className={INPUT_CLASS}
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">
            SEO Description
          </label>
          <textarea
            rows={4}
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
            className={TEXTAREA_CLASS}
          />
        </div>
      </div>
    </div>
  );

  const renderAddSectionTool = () => (
    <div className={EDITOR_PANEL_CLASS}>
      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Section Library</p>
      <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Add A Homepage Block</h3>
      <p className="mt-2 text-sm font-medium text-slate-500">
        Choose a section type and preset, then add it to this tenant homepage.
      </p>
      {canManageLayout ? (
        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1fr_auto]">
          <select
            value={newSectionType}
            onChange={(e) => {
              const nextType = e.target.value;
              setNewSectionType(nextType);
              setNewSectionVariant(getSectionPresets(nextType)[0]?.value || "default");
            }}
            className={INPUT_CLASS}
          >
            {Object.entries(sectionRegistry.metadata || {}).map(([type, meta]) => {
              const exists = pageConfig.sections.some((section) => section.type === type);
              const disabled = meta.allowMultiple === false && exists;

              return (
                <option key={type} value={type} disabled={disabled}>
                  {disabled ? `${meta.label} (Already Added)` : meta.label}
                </option>
              );
            })}
          </select>
          <select
            value={newSectionVariant}
            onChange={(e) => setNewSectionVariant(e.target.value)}
            className={INPUT_CLASS}
          >
            {getSectionPresets(newSectionType).map((preset) => (
              <option key={`${newSectionType}-${preset.value}`} value={preset.value}>
                {preset.label}
              </option>
            ))}
          </select>
          <Button
            type="button"
            onClick={addSection}
            className="rounded-2xl px-6 py-4 inline-flex items-center justify-center gap-3"
          >
            <FaPlus />
            Add Section
          </Button>
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm font-bold text-slate-500">
          Section layout is managed by the platform administrator. Tenant admins can edit prepared content only.
        </div>
      )}
    </div>
  );

  const renderSectionEditor = () => {
    if (!selectedSection) {
      return (
        <div className={EDITOR_PANEL_CLASS}>
          <p className="text-sm font-bold text-slate-500">
            {canManageLayout
              ? "No homepage sections yet. Add the first section from the section library."
              : "No homepage sections have been prepared yet. The platform administrator will add the layout first."}
          </p>
        </div>
      );
    }

    return (
      <div className={EDITOR_PANEL_CLASS}>
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-primary">
              Section {selectedSectionIndex + 1} of {pageConfig.sections.length}
            </p>
            <h3 className="mt-2 text-2xl font-black uppercase tracking-tight text-slate-950">
              {getSectionLabel(selectedSection.type)}
            </h3>
            <p className="mt-2 text-sm font-medium text-slate-500">
              Registry key: <span className="font-bold">{selectedSection.type}</span>
            </p>
          </div>

          {canManageLayout && (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5 xl:min-w-[620px]">
              <select
                value={selectedSection.variant || "default"}
                onChange={(e) =>
                  updateSection(selectedSectionIndex, (current) => ({
                    ...current,
                    variant: e.target.value,
                  }))
                }
                className="col-span-2 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-black text-slate-900 outline-none focus:ring-2 focus:ring-primary sm:col-span-1"
              >
                {getSectionVariants(selectedSection.type).map((variant) => (
                  <option key={variant} value={variant}>
                    {variant}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() =>
                  updateSection(selectedSectionIndex, (current) => ({
                    ...current,
                    enabled: current.enabled === false,
                  }))
                }
                className={`rounded-2xl px-3 py-3 text-xs font-black uppercase tracking-widest ${
                  selectedSection.enabled === false
                    ? "bg-slate-100 text-slate-500"
                    : "bg-emerald-50 text-emerald-700"
                }`}
              >
                <span className="inline-flex items-center gap-2">
                  {selectedSection.enabled === false ? <FaEyeSlash /> : <FaEye />}
                  {selectedSection.enabled === false ? "Hidden" : "Visible"}
                </span>
              </button>
              <button
                type="button"
                onClick={() => moveSection(selectedSectionIndex, -1)}
                disabled={selectedSectionIndex === 0}
                className="rounded-2xl bg-slate-100 px-3 py-3 text-xs font-black uppercase tracking-widest text-slate-700 disabled:opacity-40"
              >
                <span className="inline-flex items-center gap-2"><FaArrowUp /> Up</span>
              </button>
              <button
                type="button"
                onClick={() => moveSection(selectedSectionIndex, 1)}
                disabled={selectedSectionIndex === pageConfig.sections.length - 1}
                className="rounded-2xl bg-slate-100 px-3 py-3 text-xs font-black uppercase tracking-widest text-slate-700 disabled:opacity-40"
              >
                <span className="inline-flex items-center gap-2"><FaArrowDown /> Down</span>
              </button>
              <button
                type="button"
                onClick={() => removeSection(selectedSectionIndex)}
                className="rounded-2xl bg-rose-50 px-3 py-3 text-xs font-black uppercase tracking-widest text-rose-700"
              >
                <span className="inline-flex items-center gap-2"><FaTrash /> Delete</span>
              </button>
            </div>
          )}
        </div>

        {canManageLayout && (
          <div className="mt-5">
            <button
              type="button"
              onClick={() => applySectionPreset(selectedSectionIndex)}
              className="rounded-2xl bg-amber-50 px-4 py-3 text-xs font-black uppercase tracking-widest text-amber-800 transition hover:bg-amber-100"
            >
              Apply Defaults
            </button>
          </div>
        )}

        <div className="mt-7 border-t border-slate-100 pt-6">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
            Content Controls
          </p>
          <SectionContentFields
            section={selectedSection}
            onChange={(group, key, value) =>
              handleSectionFieldChange(selectedSectionIndex, group, key, value)
            }
          />
        </div>

        {canManageLayout && (
          <div className="mt-7 border-t border-slate-100 pt-6">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
              Style Controls
            </p>
            <SectionStyleFields
              section={selectedSection}
              onChange={(group, key, value) =>
                handleSectionFieldChange(selectedSectionIndex, group, key, value)
              }
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="animate-fade-in rounded-[32px] border border-slate-200 bg-slate-100/70 p-3 shadow-sm">
      <div className="rounded-[28px] border border-slate-200 bg-white px-5 py-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">Page Studio</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950 md:text-3xl">
              {getPageTypeMeta(activePageType).label} Builder
            </h2>
            <p className="mt-2 max-w-3xl text-sm font-medium text-slate-500">
              {canManageLayout
                ? `Design section structure, visibility, variants, and SEO${tenantName ? ` for ${tenantName}` : ""}.`
                : "Edit only the text and images inside homepage sections prepared by the platform administrator."}
            </p>
          </div>
          <Button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-2xl px-6 py-3 shadow-lg shadow-primary/20 inline-flex items-center justify-center gap-3"
          >
            <FaSave />
            {saving ? "Saving..." : canManageLayout ? "Save Layout" : "Save Content"}
          </Button>
        </div>
      </div>

      {message && (
        <div className="mx-1 mt-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-bold text-slate-600 shadow-sm">
          {message}
        </div>
      )}

      <div className="mt-3 grid grid-cols-1 gap-3 xl:grid-cols-[290px_minmax(0,1fr)]">
        <aside className="rounded-[28px] border border-slate-200 bg-[#0b0b0f] p-3 text-white xl:sticky xl:top-4 xl:max-h-[calc(100vh-2rem)] xl:overflow-y-auto">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">Page Type</p>
            <select
              value={activePageType}
              onChange={(event) => {
                setActivePageType(event.target.value);
                setActiveTool("settings");
                setSelectedSectionIndex(0);
              }}
              className="mt-3 w-full rounded-xl border border-white/10 bg-white px-4 py-3 text-sm font-black text-slate-950 outline-none"
            >
              {PAGE_TYPES.map((page) => (
                <option key={page.value} value={page.value}>
                  {page.label}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">Tools</p>
            <div className="mt-4 grid grid-cols-1 gap-2">
              {[
                ["settings", "Page Settings"],
                ["add", "Add Section"],
              ].map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActiveTool(id)}
                  className={`rounded-xl px-4 py-3 text-left text-sm font-black transition ${
                    activeTool === id
                      ? "bg-white text-slate-950"
                      : "text-slate-400 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">Sections</p>
              <span className="rounded-full bg-white/10 px-2 py-1 text-[10px] font-black text-slate-300">
                {pageConfig.sections.length}
              </span>
            </div>
            <div className="space-y-2">
              {pageConfig.sections.map((section, index) => (
                <button
                  key={section._id || `${section.type}-${index}`}
                  type="button"
                  onClick={() => {
                    setSelectedSectionIndex(index);
                    setActiveTool("section");
                  }}
                  className={`group w-full rounded-xl border px-3 py-3 text-left transition ${
                    activeTool === "section" && selectedSectionIndex === index
                      ? "border-white bg-white text-slate-950"
                      : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="mt-1 text-xs opacity-50"><FaGripVertical /></span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-black">{index + 1}. {getSectionLabel(section.type)}</p>
                      <p className="mt-1 truncate text-[10px] font-black uppercase tracking-widest opacity-55">
                        {section.variant || "default"} / {section.enabled === false ? "hidden" : "visible"}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
              {!pageConfig.sections.length && (
                <p className="rounded-xl border border-dashed border-white/10 px-4 py-5 text-sm font-semibold text-slate-500">
                  No sections yet.
                </p>
              )}
            </div>
          </div>
        </aside>

        <main className="min-w-0">
          {activeTool === "settings" && renderPageSettings()}
          {activeTool === "add" && renderAddSectionTool()}
          {activeTool === "section" && renderSectionEditor()}
        </main>
      </div>
    </div>
  );
};

export default PageBuilderManager;
