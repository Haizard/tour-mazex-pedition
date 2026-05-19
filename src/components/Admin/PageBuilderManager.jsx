/* eslint-disable react/prop-types */
import React from "react";
import {
  FaArrowDown,
  FaArrowUp,
  FaEye,
  FaEyeSlash,
  FaGripVertical,
  FaCode,
  FaMagic,
  FaPlus,
  FaSave,
  FaTrash,
} from "react-icons/fa";
import Button from "../UI/Button";
import {
  fetchPageConfig,
  fetchPageConfigs,
  createPlatformTenantMenuItem,
  fetchPlatformTenantMenuItems,
  fetchPlatformTenantPageConfig,
  fetchPlatformTenantPageConfigs,
  fetchTemplateMarketplace,
  fetchTours,
  fetchBlogs,
  fetchSiteSettings,
  fetchTaxonomies,
  fetchPublicTestimonials,
  fetchPlatformTenantTemplateStudioReusableSections,
  fetchTemplateStudioReusableSections,
  applyPageBuilderTemplate,
  applyPlatformTenantPageBuilderTemplate,
  generatePlatformTenantPageBuilderVariants,
  generatePageBuilderVariants,
  getMediaUrl,
  createPlatformTenantTemplateStudioReusableSection,
  createTemplateStudioReusableSection,
  deletePlatformTenantTemplateStudioReusableSection,
  deleteTemplateStudioReusableSection,
  importPlatformTenantPageBuilderSource,
  importPlatformTenantTemplateStudioSource,
  importPageBuilderSource,
  importTemplateStudioSource,
  requestPlatformTenantTemplateStudioBindingSuggestions,
  requestTemplateStudioBindingSuggestions,
  updatePlatformTenantMenuItem,
  updatePageConfig,
  updatePlatformTenantPageConfig,
  updatePlatformTenantTemplateStudioPage,
  updateTemplateStudioPage,
  requestTenantTemplate,
} from "../../services/api";
import { legacyHomePage } from "../../pageBuilder/defaultPages";
import {
  buildPersonalizedTemplatePage,
  isTemplateUsable,
  resolveTemplateCatalogForTenant,
} from "../../pageBuilder/templateMarketplace";
import { sectionRegistry } from "../../sections/registry/sectionRegistry";
import MediaUploadField from "../UI/MediaUploadField";
import TemplateStudioShell from "./TemplateStudio/TemplateStudioShell.jsx";
import { pageConfigToStudioPage } from "./TemplateStudio/studioTypes.js";
import { validateTenantPageConfigLinks } from "../../utils/tenantLinkValidation.js";


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
  { value: "home", label: "Home", slug: "/", status: "published" },
  { value: "tours", label: "Tours Listing", slug: "/tours", status: "published" },
  { value: "tour-detail", label: "Tour Detail", slug: "/packages/:slug", status: "published" },
  { value: "blogs", label: "Blog Listing", slug: "/blogs", status: "published" },
  { value: "blog-detail", label: "Blog Detail", slug: "/blogs/:slug", status: "published" },
  { value: "tailor-made", label: "Tailor Made", slug: "/tailor-made", status: "published" },
  { value: "contact", label: "Contact", slug: "/contact", status: "published" },
  { value: "landing", label: "Custom Landing", slug: "/landing", status: "published" },
];

const getPageTypeMeta = (pageType) =>
  PAGE_TYPES.find((page) => page.value === pageType) || PAGE_TYPES[0];

const defaultSectionsByPageType = {
  home: legacyHomePage.sections,
  "tour-detail": [{ type: "tourDetail", variant: "default", enabled: true, order: 1, dataConfig: {}, contentConfig: {}, styleConfig: {} }],
  "blog-detail": [{ type: "blogDetail", variant: "default", enabled: true, order: 1, dataConfig: {}, contentConfig: {}, styleConfig: {} }],
};

const slugifyPageIdentifier = (value = "") =>
  value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const normalizePageSlug = (value = "/") => {
  const normalized = `/${String(value || "/")
    .trim()
    .replace(/^\/+/, "")
    .replace(/\/+$/, "")}`;

  return normalized === "/" ? "/" : normalized;
};

const isCustomPageType = (pageType = "") => pageType.startsWith("custom-");

const canAppearInNavbar = (slug = "") =>
  typeof slug === "string" && slug.startsWith("/") && !slug.includes(":");

const getPageBadgeClasses = (status = "draft") => {
  if (status === "published") {
    return "bg-emerald-50 text-emerald-700 border border-emerald-200";
  }

  if (status === "draft") {
    return "bg-amber-50 text-amber-800 border border-amber-200";
  }

  return "bg-slate-100 text-slate-600 border border-slate-200";
};

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

const MediaUploadFieldWrapper = ({ field, value, onChange, inputIdPrefix }) => {
  return (
    <div className={`space-y-2 ${field.colSpan === 2 ? "md:col-span-2" : ""}`}>
      <MediaUploadField
        id={`${inputIdPrefix}-${field.path}`}
        value={value}
        onChange={onChange}
        placeholder={field.placeholder}
      />
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
        Max size: 4MB. Best for background videos and images.
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
      <MediaUploadFieldWrapper
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
  purchasedTemplates = [],
  requestedTemplates = [],
  onTemplateRequested = null,
} = {}) => {
  const canManageLayout = mode === "layout";
  const canApplyTemplates = canManageLayout || mode === "content";
  const [pageConfig, setPageConfig] = React.useState({
    pageType: "home",
    slug: "/",
    title: "Home",
    status: "published",
    seo: canManageLayout ? legacyHomePage.seo : {},
    sections: canManageLayout ? legacyHomePage.sections : [],
  });
  const [activePageType, setActivePageType] = React.useState("home");
  const [availablePages, setAvailablePages] = React.useState(PAGE_TYPES);
  const [tenantMenuItems, setTenantMenuItems] = React.useState([]);
  const [newPageLabel, setNewPageLabel] = React.useState("");
  const [newPageSlug, setNewPageSlug] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [message, setMessage] = React.useState("");
  const [aiPrompt, setAiPrompt] = React.useState(
    "Make this feel more refined, premium, classic, and visually polished while preserving the original content meaning."
  );
  const [aiScope, setAiScope] = React.useState("section");
  const [aiVariants, setAiVariants] = React.useState([]);
  const [generatingVariants, setGeneratingVariants] = React.useState(false);
  const [importName, setImportName] = React.useState("Imported Section");
  const [importSource, setImportSource] = React.useState("");
  const [importingSource, setImportingSource] = React.useState(false);
  const [applyingTemplate, setApplyingTemplate] = React.useState("");
  const [requestingTemplate, setRequestingTemplate] = React.useState("");
  const [useTemplateStudio, setUseTemplateStudio] = React.useState(canManageLayout);
  const [studioReusableSections, setStudioReusableSections] = React.useState([]);
  const [loadingStudioReusableSections, setLoadingStudioReusableSections] = React.useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = React.useState("safari-signature-home");
  const [marketplaceTemplates, setMarketplaceTemplates] = React.useState([]);
  const [studioPreviewSources, setStudioPreviewSources] = React.useState({});
  const [newSectionType, setNewSectionType] = React.useState(
    Object.keys(sectionRegistry.metadata || {})[0] || "hero"
  );
  const [newSectionVariant, setNewSectionVariant] = React.useState(
    getSectionPresets(Object.keys(sectionRegistry.metadata || {})[0] || "hero")[0]?.value ||
      "default"
  );
  const [activeTool, setActiveTool] = React.useState("settings");
  const [selectedSectionIndex, setSelectedSectionIndex] = React.useState(0);
  const activePageMeta =
    availablePages.find((page) => page.value === activePageType) || getPageTypeMeta(activePageType);
  const pageSlug = React.useMemo(
    () => normalizePageSlug(pageConfig.slug || activePageMeta.slug || "/"),
    [activePageMeta.slug, pageConfig.slug]
  );
  const canEditPageSlug = canManageLayout && isCustomPageType(activePageType);
  const canPublishPageToNavbar = canManageLayout && tenantId && canAppearInNavbar(pageSlug);
  const templateCatalog = React.useMemo(
    () => resolveTemplateCatalogForTenant({ purchasedTemplates, requestedTemplates }, marketplaceTemplates),
    [marketplaceTemplates, purchasedTemplates, requestedTemplates]
  );
  const selectedTemplate = React.useMemo(
    () => templateCatalog.find((template) => template.id === selectedTemplateId) || templateCatalog[0],
    [selectedTemplateId, templateCatalog]
  );
  const linkedNavbarItem = React.useMemo(
    () =>
      tenantMenuItems.find(
        (item) => normalizePageSlug(item.link || "/") === pageSlug
      ) || null,
    [pageSlug, tenantMenuItems]
  );
  const studioPage = React.useMemo(
    () => pageConfigToStudioPage(pageConfig, activePageType),
    [activePageType, pageConfig]
  );
  const studioLibrarySections = React.useMemo(
    () =>
      [
        ...studioReusableSections,
        ...Object.entries(sectionRegistry.metadata || {}).map(([type, metadata]) => ({
        id: `library-${type}`,
        type,
        label: metadata.label || type,
        sourceType: "reusable",
        summary:
          metadata.description ||
          `Reusable ${metadata.label || type} section that can be inserted anywhere on the page canvas.`,
        })),
      ],
    [studioReusableSections]
  );

  React.useEffect(() => {
    if (!canManageLayout || !useTemplateStudio) {
      return undefined;
    }

    let active = true;

    const loadStudioReusableSections = async () => {
      setLoadingStudioReusableSections(true);

      try {
        const response = tenantId
          ? await fetchPlatformTenantTemplateStudioReusableSections(tenantId)
          : await fetchTemplateStudioReusableSections();
        if (active) {
          setStudioReusableSections(response.data?.sections || []);
        }
      } catch (error) {
        console.error("Failed to load Template Studio reusable sections:", error);
        if (active) {
          setMessage((current) =>
            current || error?.response?.data?.message || "Failed to load reusable studio sections."
          );
        }
      } finally {
        if (active) {
          setLoadingStudioReusableSections(false);
        }
      }
    };

    loadStudioReusableSections();

    return () => {
      active = false;
    };
  }, [canManageLayout, tenantId, useTemplateStudio]);

  React.useEffect(() => {
    if (!canManageLayout || !useTemplateStudio || tenantId) {
      return undefined;
    }

    let active = true;

    const loadStudioPreviewSources = async () => {
      try {
        const [toursResponse, blogsResponse, siteSettingsResponse, destinationsResponse, testimonialsResponse] =
          await Promise.all([
            fetchTours(),
            fetchBlogs(),
            fetchSiteSettings(),
            fetchTaxonomies("destination"),
            fetchPublicTestimonials(),
          ]);

        if (!active) {
          return;
        }

        setStudioPreviewSources({
          tourPackages: toursResponse?.data || [],
          blogs: blogsResponse?.data || [],
          siteSettings: siteSettingsResponse?.data || {},
          taxonomies: {
            destinations: destinationsResponse?.data || [],
          },
          testimonials: testimonialsResponse?.data || [],
        });
      } catch (error) {
        console.error("Failed to load Template Studio preview sources:", error);
        if (active) {
          setStudioPreviewSources({});
        }
      }
    };

    loadStudioPreviewSources();

    return () => {
      active = false;
    };
  }, [canManageLayout, tenantId, useTemplateStudio]);

  React.useEffect(() => {
    let active = true;

    const loadTemplates = async () => {
      try {
        const response = await fetchTemplateMarketplace();
        if (active && Array.isArray(response.data?.templates)) {
          setMarketplaceTemplates(response.data.templates);
        }
      } catch (_error) {
        if (active) {
          setMarketplaceTemplates([]);
        }
      }
    };

    loadTemplates();

    return () => {
      active = false;
    };
  }, []);

  React.useEffect(() => {
    let active = true;

    const loadAvailablePages = async () => {
      try {
        const response = tenantId
          ? await fetchPlatformTenantPageConfigs(tenantId)
          : await fetchPageConfigs();
        if (!active) return;

        const dynamicPages = (Array.isArray(response.data) ? response.data : []).map((page) => ({
          value: page.pageType,
          label: page.title || page.pageType,
          slug: page.slug || `/${page.pageType}`,
          status: page.status || "draft",
        }));

        const mergedPages = [...PAGE_TYPES];
        dynamicPages.forEach((page) => {
          const existingIndex = mergedPages.findIndex((item) => item.value === page.value);
          if (existingIndex >= 0) {
            mergedPages[existingIndex] = {
              ...mergedPages[existingIndex],
              ...page,
            };
          } else {
            mergedPages.push(page);
          }
        });
        setAvailablePages(mergedPages);
      } catch (error) {
        console.error("Failed to load available pages:", error);
        if (active) {
          setAvailablePages(PAGE_TYPES);
        }
      }
    };

    loadAvailablePages();

    return () => {
      active = false;
    };
  }, [tenantId]);

  React.useEffect(() => {
    let active = true;

    const loadTenantMenu = async () => {
      if (!tenantId || !canManageLayout) {
        if (active) {
          setTenantMenuItems([]);
        }
        return;
      }

      try {
        const response = await fetchPlatformTenantMenuItems(tenantId);
        if (active) {
          setTenantMenuItems(Array.isArray(response.data) ? response.data : []);
        }
      } catch (error) {
        console.error("Failed to load tenant menu items:", error);
        if (active) {
          setTenantMenuItems([]);
        }
      }
    };

    loadTenantMenu();

    return () => {
      active = false;
    };
  }, [canManageLayout, tenantId]);

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

        const pageMeta =
          availablePages.find((page) => page.value === activePageType) ||
          getPageTypeMeta(activePageType);
        const data = response.data || {};
        setPageConfig({
          pageType: data.pageType || activePageType,
          slug: data.slug || pageMeta.slug,
          title: data.title || pageMeta.label,
          status: data.status || pageMeta.status || "published",
          seo: data.seo || (canManageLayout ? legacyHomePage.seo : {}),
          sections: normalizeSections(
            data.sections?.length
              ? data.sections
              : defaultSectionsByPageType[activePageType] || []
          ),
        });
      } catch (error) {
        console.error("Failed to load page config:", error);
        if (active) {
          setPageConfig((current) => ({
            ...current,
            pageType: activePageType,
            slug: activePageMeta.slug,
            title: activePageMeta.label,
            sections: normalizeSections(defaultSectionsByPageType[activePageType] || []),
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
  }, [activePageMeta.label, activePageMeta.slug, activePageType, availablePages, canManageLayout, tenantId]);

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
    setMessage(`Section removed from ${activePageMeta.label}.`);
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
      const resolvedSlug = canEditPageSlug
        ? normalizePageSlug(pageConfig.slug || activePageMeta.slug || "/")
        : normalizePageSlug(activePageMeta.slug || pageConfig.slug || "/");
      const payload = {
        ...pageConfig,
        pageType: activePageType,
        slug: resolvedSlug,
        sections: normalizeSections(pageConfig.sections),
      };

      const validationErrors = validateTenantPageConfigLinks(payload, sectionRegistry);
      if (validationErrors.length > 0) {
        setMessage(validationErrors.join(" "));
        return;
      }

      const response = tenantId
        ? await updatePlatformTenantPageConfig(tenantId, activePageType, payload)
        : await updatePageConfig(activePageType, payload);
      setPageConfig((current) => ({
        ...current,
        ...response.data,
        sections: normalizeSections(response.data?.sections || current.sections),
      }));
      setAvailablePages((current) =>
        current.map((page) =>
          page.value === activePageType
            ? {
                ...page,
                label: response.data?.title || payload.title || page.label,
                slug: response.data?.slug || resolvedSlug,
                status: response.data?.status || payload.status || page.status,
              }
            : page
        )
      );
      setMessage(
        canManageLayout
          ? `${activePageMeta.label} layout saved.`
          : `${activePageMeta.label} content saved.`
      );

      if (tenantId && canManageLayout) {
        const menuResponse = await fetchPlatformTenantMenuItems(tenantId);
        setTenantMenuItems(Array.isArray(menuResponse.data) ? menuResponse.data : []);
      }
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

  const handleGenerateAiVariants = async () => {
    if (!canManageLayout) return;
    const targetSection = pageConfig.sections[selectedSectionIndex] || null;
    if (aiScope === "section" && !targetSection) {
      setMessage("Select a section before generating a section variant.");
      return;
    }

    setGeneratingVariants(true);
    setMessage("");

    try {
      const payload = {
        scope: aiScope,
        prompt: aiPrompt,
        pageConfig,
        sectionIndex: selectedSectionIndex,
        targetSection,
      };
      const response = tenantId
        ? await generatePlatformTenantPageBuilderVariants(tenantId, activePageType, payload)
        : await generatePageBuilderVariants(activePageType, payload);
      setAiVariants(Array.isArray(response.data?.variants) ? response.data.variants : []);
      setMessage(
        response.data?.source === "ai"
          ? "AI variants are ready to preview."
          : "Classic design variants are ready. AI credentials were not available, so the builder used its fallback designer."
      );
    } catch (error) {
      console.error("Failed to generate page builder variants:", error);
      setMessage(error?.response?.data?.message || "Failed to generate page builder variants.");
    } finally {
      setGeneratingVariants(false);
    }
  };

  const applyAiVariant = (variant) => {
    const sections = normalizeSections(variant.sections || []);
    if (!sections.length) return;

    setPageConfig((current) => {
      if (aiScope === "page") {
        return {
          ...current,
          sections,
        };
      }

      const nextSections = [...current.sections];
      nextSections[selectedSectionIndex] = {
        ...(nextSections[selectedSectionIndex] || {}),
        ...sections[0],
        order: selectedSectionIndex + 1,
      };
      return {
        ...current,
        sections: reorderSections(nextSections),
      };
    });
    setActiveTool("section");
    setMessage(`${variant.name || "Variant"} applied locally. Save the layout when ready.`);
  };

  const applyTemplateToDraft = async (template) => {
    if (!canApplyTemplates) return;

    try {
      setApplyingTemplate(template.id);
      setMessage("");
      const response = tenantId
        ? await applyPlatformTenantPageBuilderTemplate(tenantId, template.id)
        : await applyPageBuilderTemplate(template.id);
      const appliedPage = response.data?.page || null;
      const personalizedPage =
        appliedPage ||
        buildPersonalizedTemplatePage(template, {
          clientName: tenantName || pageConfig.title || "this operator",
          accentSeed: `${tenantName || ""}-${template.id}`,
        });

      setActivePageType(personalizedPage.pageType);
      setPageConfig((current) => ({
        ...current,
        ...personalizedPage,
        slug: personalizedPage.slug,
        status: "draft",
        sections: normalizeSections(personalizedPage.sections),
      }));
      setSelectedSectionIndex(0);
      setActiveTool("section");
      setMessage(response.data?.message || `${template.name} applied as a personalized draft.`);
    } catch (error) {
      setMessage(error?.response?.data?.message || error.message || "Template could not be applied.");
    } finally {
      setApplyingTemplate("");
    }
  };

  const requestTemplateAccess = async (template) => {
    if (canManageLayout) {
      setMessage("Grant this template from the platform subscription Templates panel before applying it.");
      return;
    }

    setRequestingTemplate(template.id);
    setMessage("");

    try {
      const response = await requestTenantTemplate(template.id);
      await onTemplateRequested?.();
      setMessage(response.data?.message || "Template request sent to the platform team.");
    } catch (error) {
      setMessage(error?.response?.data?.message || "Unable to request this template.");
    } finally {
      setRequestingTemplate("");
    }
  };

  const handleImportSource = async () => {
    if (!canManageLayout) return;
    if (!importSource.trim()) {
      setMessage("Paste HTML/CSS source code before importing.");
      return;
    }

    setImportingSource(true);
    setMessage("");

    try {
      const payload = {
        name: importName || "Imported Section",
        sourceCode: importSource,
      };
      const response = tenantId
        ? await importPlatformTenantPageBuilderSource(tenantId, payload)
        : await importPageBuilderSource(payload);
      const importedSection = response.data?.section;
      if (!importedSection?.type) {
        throw new Error("The importer did not return a section.");
      }

      setPageConfig((current) => {
        const nextSections = reorderSections([
          ...current.sections,
          {
            ...importedSection,
            order: current.sections.length + 1,
          },
        ]);
        setSelectedSectionIndex(nextSections.length - 1);
        return {
          ...current,
          sections: nextSections,
        };
      });
      setActiveTool("section");
      setImportSource("");
      setMessage("Imported section added locally. Review the editable fields, then save the layout.");
    } catch (error) {
      console.error("Failed to import pasted source:", error);
      setMessage(error?.response?.data?.message || error.message || "Failed to import pasted source.");
    } finally {
      setImportingSource(false);
    }
  };

  const handleSaveStudioPage = async (nextStudioPage) => {
    if (!canManageLayout) return;
    setSaving(true);
    setMessage("");

    try {
      const response = tenantId
        ? await updatePlatformTenantTemplateStudioPage(tenantId, activePageType, nextStudioPage)
        : await updateTemplateStudioPage(activePageType, nextStudioPage);
      const savedPage = response.data?.page || response.data || {};

      setPageConfig((current) => ({
        ...current,
        ...savedPage,
        sections: normalizeSections(savedPage.sections || current.sections),
      }));
      setMessage(`${activePageMeta.label} saved in Template Studio.`);
    } catch (error) {
      console.error("Failed to save Template Studio page:", error);
      setMessage(error?.response?.data?.message || "Failed to save Template Studio page.");
    } finally {
      setSaving(false);
    }
  };

  const handleImportStudioSource = async (payload) => {
    if (!canManageLayout) return null;
    setImportingSource(true);
    setMessage("");

    try {
      const response = tenantId
        ? await importPlatformTenantTemplateStudioSource(tenantId, payload)
        : await importTemplateStudioSource(payload);
      setMessage("Import analyzed and added to the studio workspace.");
      return response.data;
    } catch (error) {
      console.error("Failed to analyze template import:", error);
      setMessage(error?.response?.data?.message || "Failed to analyze template import.");
      return null;
    } finally {
      setImportingSource(false);
    }
  };

  const handleSaveReusableStudioSection = async (section) => {
    if (!canManageLayout || !section?.type) return;

    setSaving(true);
    setMessage("");

    try {
      const payload = {
        section,
        name: section.label || getSectionLabel(section.type),
        category: activePageMeta.label,
        scope: tenantId ? "tenant" : "platform",
      };
      const response = tenantId
        ? await createPlatformTenantTemplateStudioReusableSection(tenantId, payload)
        : await createTemplateStudioReusableSection(payload);
      const savedSection = response.data?.section;

      if (savedSection) {
        setStudioReusableSections((current) => [savedSection, ...current]);
      }

      setMessage(`${section.label || getSectionLabel(section.type)} saved to the reusable studio library.`);
    } catch (error) {
      console.error("Failed to save reusable studio section:", error);
      setMessage(error?.response?.data?.message || "Failed to save reusable studio section.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteReusableStudioSection = async (section) => {
    const reusableTemplateId = section?.sourceMeta?.reusableTemplateId;
    if (!canManageLayout || !reusableTemplateId) return;

    setSaving(true);
    setMessage("");

    try {
      if (tenantId) {
        await deletePlatformTenantTemplateStudioReusableSection(tenantId, reusableTemplateId);
      } else {
        await deleteTemplateStudioReusableSection(reusableTemplateId);
      }

      setStudioReusableSections((current) =>
        current.filter((item) => item.sourceMeta?.reusableTemplateId !== reusableTemplateId)
      );
      setMessage(`${section.label || "Reusable section"} removed from the studio library.`);
    } catch (error) {
      console.error("Failed to delete reusable studio section:", error);
      setMessage(error?.response?.data?.message || "Failed to delete reusable studio section.");
    } finally {
      setSaving(false);
    }
  };

  const handleRequestStudioBindings = async (section) => {
    if (!canManageLayout) return { suggestions: [] };

    try {
      const response = tenantId
        ? await requestPlatformTenantTemplateStudioBindingSuggestions(tenantId, { section })
        : await requestTemplateStudioBindingSuggestions({ section });
      return response.data;
    } catch (error) {
      console.error("Failed to load binding suggestions:", error);
      setMessage(error?.response?.data?.message || "Failed to load binding suggestions.");
      return { suggestions: section?.bindings || [] };
    }
  };

  const handleTemplateStudioTopBarAction = (actionId) => {
    if (actionId === "ai-create") {
      setMessage(
        "AI section creation will plug into the new studio flow next. For now, use Add Section and Import to compose the page."
      );
    }

    if (actionId === "preview") {
      setMessage("Save the studio page to preview it through the live tenant renderer.");
    }
  };

  const handleAddCurrentPageToNavbar = async () => {
    if (!tenantId || !canManageLayout || !canPublishPageToNavbar) return;
    setSaving(true);
    setMessage("");

    try {
      if (pageConfig.status !== "published") {
        setMessage("Publish this page before linking it in the navbar.");
        return;
      }

      const payload = {
        label: pageConfig.title || activePageMeta.label,
        link: pageSlug,
        itemType: "link",
        sortOrder: linkedNavbarItem?.sortOrder || 99,
        children: linkedNavbarItem?.children || [],
      };

      if (linkedNavbarItem?._id) {
        await updatePlatformTenantMenuItem(tenantId, linkedNavbarItem._id, {
          ...linkedNavbarItem,
          ...payload,
        });
        setMessage(`${pageConfig.title || activePageMeta.label} navbar link synced.`);
      } else {
        await createPlatformTenantMenuItem(tenantId, payload);
        setMessage(`${pageConfig.title || activePageMeta.label} added to the tenant navbar.`);
      }

      const menuResponse = await fetchPlatformTenantMenuItems(tenantId);
      setTenantMenuItems(Array.isArray(menuResponse.data) ? menuResponse.data : []);
    } catch (error) {
      console.error("Failed to add page to navbar:", error);
      setMessage(error?.response?.data?.message || "Failed to add this page to the navbar.");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateCustomPage = () => {
    const label = newPageLabel.trim();
    const slug = newPageSlug.trim();
    const identifier = slugifyPageIdentifier(label);

    if (!label || !slug || !identifier) {
      setMessage("Custom page label and slug are required.");
      return;
    }

    const normalizedSlug = slug.startsWith("/") ? slug : `/${slug}`;
    const pageType = `custom-${identifier}`;

    if (availablePages.some((page) => page.value === pageType || page.slug === normalizedSlug)) {
      setMessage("A page with this identifier or slug already exists.");
      return;
    }

    const pageMeta = { value: pageType, label, slug: normalizedSlug, status: "draft" };
    setAvailablePages((current) => [...current, pageMeta]);
    setActivePageType(pageType);
    setPageConfig({
      pageType,
      slug: normalizedSlug,
      title: label,
      status: "draft",
      seo: {},
      sections: [],
    });
    setActiveTool("settings");
    setSelectedSectionIndex(0);
    setNewPageLabel("");
    setNewPageSlug("");
    setMessage(`Custom page ${label} is ready as a draft. Add sections, save it, then publish.`);
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
      <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-950">{activePageMeta.label} Metadata</h3>
      <p className="mt-2 text-sm font-medium text-slate-500">
        Control route, publish status, and SEO defaults for this tenant page.
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
            value={canEditPageSlug ? (pageConfig.slug || "/") : pageSlug}
            onChange={(e) =>
              setPageConfig((current) => ({ ...current, slug: e.target.value }))
            }
            className={INPUT_CLASS}
            disabled={!canEditPageSlug}
          />
          {!canEditPageSlug && (
            <p className="text-xs font-semibold text-slate-500">
              System pages keep a fixed route so the tenant engine stays predictable.
            </p>
          )}
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">
            Publish Status
          </label>
          <select
            value={pageConfig.status || "draft"}
            onChange={(e) =>
              setPageConfig((current) => ({ ...current, status: e.target.value }))
            }
            className={INPUT_CLASS}
            disabled={!canManageLayout}
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
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
      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Route</p>
          <p className="mt-2 text-sm font-black text-slate-950">{pageSlug}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Visibility</p>
          <span className={`mt-2 inline-flex rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-widest ${getPageBadgeClasses(pageConfig.status)}`}>
            {pageConfig.status || "draft"}
          </span>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Navbar</p>
          <p className="mt-2 text-sm font-black text-slate-950">
            {linkedNavbarItem ? "Linked" : "Not linked"}
          </p>
        </div>
      </div>
      {tenantId && canManageLayout && (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-black text-slate-900">Navbar publishing</p>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            {canPublishPageToNavbar
              ? "Publish this page, then sync a menu link so visitors can discover it from the public navbar."
              : "Route-pattern pages are kept out of the main navbar on purpose."}
          </p>
          <button
            type="button"
            onClick={handleAddCurrentPageToNavbar}
            disabled={saving || !canPublishPageToNavbar || pageConfig.status !== "published"}
            className="mt-4 rounded-xl bg-slate-950 px-5 py-3 text-xs font-black uppercase tracking-widest text-white disabled:opacity-50"
          >
            {linkedNavbarItem ? "Sync Navbar Link" : "Add This Page To Navbar"}
          </button>
        </div>
      )}
    </div>
  );

  const renderAddSectionTool = () => (
    <div className={EDITOR_PANEL_CLASS}>
      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Section Library</p>
      <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Add A Page Block</h3>
      <p className="mt-2 text-sm font-medium text-slate-500">
        Choose a section type and preset, then add it to this tenant page.
      </p>
      {canApplyTemplates ? (
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

  const renderAiVariantTool = () => (
    <div className={EDITOR_PANEL_CLASS}>
      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">AI Variants</p>
      <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Generate A Better Version</h3>
      <p className="mt-2 text-sm font-medium text-slate-500">
        Create polished classic variants from the current page-builder content, then apply one to the local draft.
      </p>
      {canApplyTemplates ? (
        <div className="mt-6 space-y-5">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[220px_1fr_auto]">
            <select
              value={aiScope}
              onChange={(e) => setAiScope(e.target.value)}
              className={INPUT_CLASS}
            >
              <option value="section">Selected Section</option>
              <option value="page">Whole Page</option>
            </select>
            <textarea
              rows={3}
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              className={TEXTAREA_CLASS}
            />
            <Button
              type="button"
              onClick={handleGenerateAiVariants}
              disabled={generatingVariants}
              className="rounded-2xl px-6 py-4 inline-flex items-center justify-center gap-3"
            >
              <FaMagic />
              {generatingVariants ? "Generating..." : "Generate"}
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            {aiVariants.map((variant, index) => (
              <div key={`${variant.name}-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-primary">
                  Variant {index + 1}
                </p>
                <h4 className="mt-2 text-lg font-black text-slate-950">{variant.name}</h4>
                <p className="mt-2 min-h-[48px] text-sm font-semibold text-slate-500">
                  {variant.summary}
                </p>
                <div className="mt-4 rounded-xl bg-white p-3 text-xs font-bold text-slate-500">
                  {variant.sections?.length || 0} section{variant.sections?.length === 1 ? "" : "s"}
                </div>
                <button
                  type="button"
                  onClick={() => applyAiVariant(variant)}
                  className="mt-4 w-full rounded-xl bg-slate-950 px-4 py-3 text-xs font-black uppercase tracking-widest text-white"
                >
                  Apply Variant
                </button>
              </div>
            ))}
            {!aiVariants.length && (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm font-bold text-slate-500 xl:col-span-3">
                Generate variants to preview classic design upgrades for this page.
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm font-bold text-slate-500">
          AI layout variants are managed by the platform administrator.
        </div>
      )}
    </div>
  );

  const renderTemplateTool = () => (
    <div className={EDITOR_PANEL_CLASS}>
      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Template Marketplace</p>
      <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Tourism Website UI Templates</h3>
      <p className="mt-2 text-sm font-medium text-slate-500">
        Browse ready-to-use tourism layouts already mapped to the page builder. Purchased and included templates can be applied as personalized drafts so client sites start strong without looking identical.
      </p>

      {canManageLayout ? (
        <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-3">
          {templateCatalog.map((template) => {
            const usable = isTemplateUsable(template);
            const selected = selectedTemplate?.id === template.id;

            return (
              <article
                key={template.id}
                className={`rounded-2xl border bg-slate-50 p-5 transition ${
                  selected ? "border-slate-950 shadow-sm" : "border-slate-200"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-primary">
                      {template.category}
                    </p>
                    <h4 className="mt-2 text-lg font-black text-slate-950">{template.name}</h4>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${
                      usable
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-amber-50 text-amber-800"
                    }`}
                  >
                    {template.priceLabel}
                  </span>
                </div>
                <p className="mt-3 min-h-[60px] text-sm font-semibold text-slate-500">
                  {template.preview}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {(template.bestFor || []).map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-widest text-slate-500"
                    >
                      {item}
                    </span>
                  ))}
                </div>
                <div className="mt-5 grid grid-cols-2 gap-2 text-xs font-black text-slate-500">
                  <div className="rounded-xl bg-white p-3">
                    Page: <span className="text-slate-950">{template.pageType}</span>
                  </div>
                  <div className="rounded-xl bg-white p-3">
                    Blocks: <span className="text-slate-950">{template.sections.length}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTemplateId(template.id);
                    if (usable) {
                      void applyTemplateToDraft(template);
                    } else {
                      void requestTemplateAccess(template);
                    }
                  }}
                  disabled={
                    applyingTemplate === template.id ||
                    requestingTemplate === template.id ||
                    template.purchaseStatus === "requested"
                  }
                  className={`mt-5 w-full rounded-xl px-4 py-3 text-xs font-black uppercase tracking-widest ${
                    usable
                      ? "bg-slate-950 text-white"
                      : "bg-slate-200 text-slate-500"
                  }`}
                >
                  {applyingTemplate === template.id
                    ? "Applying..."
                    : requestingTemplate === template.id
                      ? "Requesting..."
                    : usable
                      ? "Use With Client Tweaks"
                      : template.purchaseStatus === "requested"
                        ? "Request Sent"
                        : canManageLayout
                          ? "Grant In Subscription"
                          : "Request This Template"}
                </button>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm font-bold text-slate-500">
          Template application is available after a tenant is selected.
        </div>
      )}
    </div>
  );

  const renderImportSourceTool = () => (
    <div className={EDITOR_PANEL_CLASS}>
      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Import Code</p>
      <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Convert HTML/CSS To A Section</h3>
      <p className="mt-2 text-sm font-medium text-slate-500">
        Paste a section or page fragment and convert it into an editable page-builder block.
      </p>
      {canManageLayout ? (
        <div className="mt-6 space-y-4">
          <input
            type="text"
            value={importName}
            onChange={(e) => setImportName(e.target.value)}
            className={INPUT_CLASS}
            placeholder="Import name"
          />
          <textarea
            rows={14}
            value={importSource}
            onChange={(e) => setImportSource(e.target.value)}
            className={`${TEXTAREA_CLASS} font-mono text-xs`}
            placeholder="<section>...</section><style>...</style>"
          />
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs font-semibold text-slate-500">
            The importer removes scripts and event handlers, scopes CSS to the imported section, and extracts text, image, and CTA fields for CMS editing.
          </div>
          <Button
            type="button"
            onClick={handleImportSource}
            disabled={importingSource}
            className="rounded-2xl px-6 py-4 inline-flex items-center justify-center gap-3"
          >
            <FaCode />
            {importingSource ? "Importing..." : "Import Section"}
          </Button>
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm font-bold text-slate-500">
          Source-code imports are managed by the platform administrator.
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
              ? `No sections yet on ${activePageMeta.label}. Add the first section from the section library.`
              : "No sections have been prepared yet. The platform administrator will add the layout first."}
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

  if (canManageLayout && useTemplateStudio) {
    return (
      <div className="w-full max-w-none space-y-4">
        <div className="flex items-center justify-between gap-3 rounded-[1.8rem] border border-slate-900/60 bg-[#08090d] px-5 py-4 text-white shadow-[0_24px_60px_rgba(2,6,23,0.45)]">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Template Studio</p>
            <h2 className="mt-2 text-xl font-black tracking-tight text-white">
              Advanced import, bind, and canvas editing workspace
            </h2>
            <p className="mt-2 text-sm font-medium text-slate-400">
              Build pages with imported templates, reusable sections, and CMS-connected blocks in a cleaner studio flow.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setUseTemplateStudio(false)}
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/10"
          >
            Open Classic Builder
          </button>
        </div>

        <TemplateStudioShell
          studioPage={studioPage}
          selectedSection={studioPage.sections[selectedSectionIndex] || null}
          librarySections={studioLibrarySections}
          cmsSources={studioPreviewSources}
          importing={importingSource}
          saving={saving || loadingStudioReusableSections}
          message={
            message ||
            (loadingStudioReusableSections ? "Refreshing reusable studio library..." : "")
          }
          onSaveStudioPage={handleSaveStudioPage}
          onSaveReusableSection={handleSaveReusableStudioSection}
          onDeleteReusableSection={handleDeleteReusableStudioSection}
          onImportStudioSource={handleImportStudioSource}
          onRequestBindingSuggestions={handleRequestStudioBindings}
          onTopBarAction={handleTemplateStudioTopBarAction}
        />
      </div>
    );
  }

  return (
    <div className="animate-fade-in w-full max-w-none rounded-[32px] border border-slate-900/60 bg-[#05070b] p-3 shadow-[0_28px_70px_rgba(2,6,23,0.5)]">
      <div className="rounded-[28px] border border-white/10 bg-[#08090d] px-5 py-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Page Studio</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-white md:text-3xl">
              {activePageMeta.label} Builder
            </h2>
            <p className="mt-2 max-w-3xl text-sm font-medium text-slate-400">
              {canManageLayout
                ? `Design section structure, visibility, variants, and SEO${tenantName ? ` for ${tenantName}` : ""}.`
                : "Edit only the text and images inside sections prepared by the platform administrator."}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {canManageLayout ? (
              <button
                type="button"
                onClick={() => setUseTemplateStudio(true)}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/10"
              >
                Switch To Template Studio
              </button>
            ) : null}
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
      </div>

      {message && (
        <div className="mx-1 mt-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-bold text-slate-600 shadow-sm">
          {message}
        </div>
      )}

      <div className="mt-3 grid grid-cols-1 gap-3 xl:grid-cols-[320px_minmax(0,1fr)] 2xl:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="rounded-[28px] border border-slate-200 bg-[#0b0b0f] p-3 text-white xl:sticky xl:top-4 xl:max-h-[calc(100vh-2rem)] xl:overflow-y-auto">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">Page Explorer</p>
              <span className="rounded-full bg-white/10 px-2 py-1 text-[10px] font-black text-slate-300">
                {availablePages.length}
              </span>
            </div>
            <div className="mt-4 space-y-2">
              {availablePages.map((page) => (
                <button
                  key={page.value}
                  type="button"
                  onClick={() => {
                    setActivePageType(page.value);
                    setActiveTool("settings");
                    setSelectedSectionIndex(0);
                  }}
                  className={`w-full rounded-xl border px-3 py-3 text-left transition ${
                    activePageType === page.value
                      ? "border-white bg-white text-slate-950"
                      : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black">{page.label}</p>
                      <p className="mt-1 truncate text-[10px] font-black uppercase tracking-widest opacity-55">
                        {page.slug}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2 py-1 text-[9px] font-black uppercase tracking-widest ${
                        activePageType === page.value
                          ? getPageBadgeClasses(page.status)
                          : page.status === "published"
                            ? "bg-emerald-500/15 text-emerald-200"
                            : "bg-amber-500/15 text-amber-200"
                      }`}
                    >
                      {page.status || "draft"}
                    </span>
                  </div>
                </button>
              ))}
            </div>
            {canManageLayout && (
              <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">New Custom Page</p>
                <input
                  type="text"
                  value={newPageLabel}
                  onChange={(event) => setNewPageLabel(event.target.value)}
                  placeholder="Page title"
                  className="mt-3 w-full rounded-xl border border-white/10 bg-white px-4 py-3 text-sm font-bold text-slate-950 outline-none"
                />
                <input
                  type="text"
                  value={newPageSlug}
                  onChange={(event) => setNewPageSlug(event.target.value)}
                  placeholder="/your-page-slug"
                  className="mt-3 w-full rounded-xl border border-white/10 bg-white px-4 py-3 text-sm font-bold text-slate-950 outline-none"
                />
                <button
                  type="button"
                  onClick={handleCreateCustomPage}
                  className="mt-3 w-full rounded-xl bg-white px-4 py-3 text-xs font-black uppercase tracking-widest text-slate-950"
                >
                  Create Custom Page
                </button>
              </div>
            )}
          </div>

          <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">Tools</p>
            <div className="mt-4 grid grid-cols-1 gap-2">
              {[
                ["settings", "Page Settings"],
                ["templates", "Templates"],
                ["add", "Add Section"],
                ["ai", "AI Variants"],
                ["import", "Import Code"],
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
          {activeTool === "templates" && renderTemplateTool()}
          {activeTool === "add" && renderAddSectionTool()}
          {activeTool === "ai" && renderAiVariantTool()}
          {activeTool === "import" && renderImportSourceTool()}
          {activeTool === "section" && renderSectionEditor()}
        </main>
      </div>
    </div>
  );
};

export default PageBuilderManager;
