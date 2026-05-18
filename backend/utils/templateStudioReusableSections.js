import { buildReusableSectionTemplatePayload } from "./templateStudioTemplatePublishing.js";

const normalizeTags = (value = []) => {
  const list = Array.isArray(value) ? value : String(value || "").split(",");
  return [...new Set(list.map((item) => String(item || "").trim()).filter(Boolean))];
};

const buildBindingRecords = (supportedBindings = []) =>
  supportedBindings.map((sourceKey) => ({
    sourceKey,
    bindingType: "dynamic-collection",
    fieldPath: "",
    confidence: 1,
    rationale: "Saved as a reusable section with this supported CMS source.",
  }));

export const normalizeReusableSectionTemplatePayload = ({
  tenantId = null,
  scope = tenantId ? "tenant" : "platform",
  section = {},
  name = "",
  category = "Reusable Section",
  previewImage = "",
  tags = [],
} = {}) => {
  const payload = buildReusableSectionTemplatePayload({
    section,
    name,
    category,
    previewImage,
  });

  return {
    tenantId: scope === "tenant" ? tenantId : null,
    name: payload.name,
    category: payload.category,
    previewImage: payload.previewImage,
    sectionType: payload.section.type || "customHtml",
    sourceType: payload.sourceType || "manual",
    defaultContent: { ...(payload.section.content || payload.section.contentConfig || {}) },
    defaultStyles: {
      ...(payload.section.styles || payload.section.styleConfig || {}),
      customCss:
        payload.section.customCss ||
        payload.section.styles?.customCss ||
        payload.section.styleConfig?.customCss ||
        "",
    },
    supportedBindings: [...(payload.supportedBindings || [])],
    sourceMeta: {
      label: payload.section.label || "",
      sourceType: payload.section.sourceType || "manual",
      sourceMeta: { ...(payload.section.sourceMeta || {}) },
      bindings: [...(payload.section.bindings || [])],
      responsive: { ...(payload.section.responsive || {}) },
      visibility: { ...(payload.section.visibility || {}) },
      order: payload.section.order || 1,
      variant: payload.section.variant || "default",
    },
    tags: normalizeTags(tags),
  };
};

export const serializeReusableSectionTemplate = (template = {}) => ({
  id: template._id?.toString?.() || template.id || "",
  label: template.name || "Reusable Section",
  name: template.name || "Reusable Section",
  category: template.category || "Reusable Section",
  previewImage: template.previewImage || "",
  type: template.sectionType || "customHtml",
  sourceType: template.sourceType || "reusable",
  summary:
    template.defaultContent?.description ||
    template.defaultContent?.body ||
    "Reusable section ready for Template Studio insertion.",
  content: { ...(template.defaultContent || {}) },
  styles: { ...(template.defaultStyles || {}) },
  bindings:
    template.sourceMeta?.bindings?.length
      ? [...template.sourceMeta.bindings]
      : buildBindingRecords(template.supportedBindings || []),
  sourceMeta: {
    ...(template.sourceMeta || {}),
    reusableTemplateId: template._id?.toString?.() || template.id || "",
  },
  customCss: template.defaultStyles?.customCss || "",
  scope: template.tenantId ? "tenant" : "platform",
  tags: [...(template.tags || [])],
});
