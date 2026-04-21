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
import Card from "../UI/Card";
import Button from "../UI/Button";
import { fetchPageConfig, updatePageConfig, uploadMedia } from "../../services/api";
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

const INPUT_CLASS =
  "w-full bg-slate-50 p-4 rounded-2xl border-none focus:ring-2 focus:ring-primary font-bold text-slate-900";
const TEXTAREA_CLASS =
  "w-full bg-slate-50 p-4 rounded-2xl border-none focus:ring-2 focus:ring-primary font-medium text-slate-700";

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
  const [newSectionType, setNewSectionType] = React.useState(
    Object.keys(sectionRegistry.metadata || {})[0] || "hero"
  );
  const [newSectionVariant, setNewSectionVariant] = React.useState(
    getSectionPresets(Object.keys(sectionRegistry.metadata || {})[0] || "hero")[0]?.value ||
      "default"
  );

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

    setPageConfig((current) => ({
      ...current,
      sections: normalizeSections([
        ...current.sections,
        getDefaultSectionTemplate(newSectionType, newSectionVariant),
      ]),
    }));
    setMessage(`Added ${getSectionLabel(newSectionType)} section with ${newSectionVariant} preset.`);
  };

  const removeSection = (index) => {
    setPageConfig((current) => ({
      ...current,
      sections: normalizeSections(
        current.sections.filter((_, currentIndex) => currentIndex !== index)
      ),
    }));
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

  const handleSectionFieldChange = (index, group, path, value) => {
    updateSection(index, (current) => ({
      ...current,
      [group]: setValueAtPath(current[group], path, value),
    }));
  };

  if (loading) {
    return (
      <Card className="p-8 border-none shadow-xl">
        <p className="text-sm font-bold text-slate-500">Loading page builder...</p>
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
              className={TEXTAREA_CLASS}
            />
          </div>
        </div>
      </Card>

      <Card className="p-8 mb-8 border-none shadow-xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h3 className="text-xl font-bold italic">Add Section</h3>
            <p className="text-sm font-medium text-slate-500 mt-2">
              Insert a new homepage section from the registry. You can reorder it after adding.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-[minmax(220px,1fr)_minmax(220px,1fr)_auto] gap-4 w-full lg:w-auto lg:min-w-[680px]">
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
              className="px-6 py-4 rounded-2xl inline-flex items-center gap-3"
            >
              <FaPlus />
              Add Section
            </Button>
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

              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 lg:min-w-[860px]">
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
                    className={INPUT_CLASS}
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

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">
                    Preset
                  </label>
                  <button
                    type="button"
                    onClick={() => applySectionPreset(index)}
                    className="w-full rounded-2xl bg-amber-50 px-4 py-4 text-sm font-black uppercase tracking-widest text-amber-800 transition hover:bg-amber-100"
                  >
                    Apply Defaults
                  </button>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">
                    Remove
                  </label>
                  <button
                    type="button"
                    onClick={() => removeSection(index)}
                    className="w-full rounded-2xl px-4 py-4 text-sm font-black uppercase tracking-widest transition bg-rose-50 text-rose-700 hover:bg-rose-100"
                  >
                    <span className="inline-flex items-center gap-2">
                      <FaTrash />
                      Delete
                    </span>
                  </button>
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

            <div className="mt-6 border-t border-slate-100 pt-6">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">
                Style Controls
              </p>
              <SectionStyleFields
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
