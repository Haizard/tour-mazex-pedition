const PLATFORM_HOST_PATTERN =
  /^(?:https?:\/\/)?(?:www\.)?(?:mazexpeditions\.vercel\.app|mazexpeditions\.com|tourism-website-inky\.vercel\.app)(?:\/|$)/i;

const EXTERNAL_LINK_PATTERN = /^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i;
const LINK_FIELD_PATTERN = /(?:^|\.)(?:href|link|url)$/i;
const LINK_PLACEHOLDER_PATTERN = /\blink\b|\burl\b/i;

export const normalizeTenantLinkInput = (value = "") => value.toString().trim();

export const isExternalTenantLink = (value = "") =>
  EXTERNAL_LINK_PATTERN.test(normalizeTenantLinkInput(value));

export const validateTenantManagedLink = (value = "", label = "Link") => {
  const normalizedValue = normalizeTenantLinkInput(value);

  if (!normalizedValue) {
    return `${label} is required.`;
  }

  if (PLATFORM_HOST_PATTERN.test(normalizedValue)) {
    return `${label} should use an internal path like /blogs instead of a full platform URL.`;
  }

  if (normalizedValue.startsWith("/demo/")) {
    return `${label} should not include /demo/... paths. Use a tenant-relative path like /blogs instead.`;
  }

  if (!isExternalTenantLink(normalizedValue) && !normalizedValue.startsWith("/")) {
    return `${label} should start with / for internal pages, or use a full external URL.`;
  }

  return "";
};

export const validateTenantManagedLinks = (entries = []) =>
  entries
    .map(({ label, value }) => validateTenantManagedLink(value, label))
    .filter(Boolean);

export const isTenantManagedLinkField = (field = {}) =>
  field?.type === "text" &&
  (
    LINK_FIELD_PATTERN.test(field.path || "") ||
    LINK_PLACEHOLDER_PATTERN.test(field.placeholder || "") ||
    LINK_PLACEHOLDER_PATTERN.test(field.label || "")
  );

const getValueAtPath = (source, path = "") =>
  String(path)
    .split(".")
    .filter(Boolean)
    .reduce((current, part) => (current == null ? undefined : current[part]), source);

const collectLinkEntriesFromField = ({
  field,
  section,
  sectionLabel,
}) => {
  if (!field) {
    return [];
  }

  if (field.type === "objectList") {
    const items = getValueAtPath(section?.[field.group], field.path);
    if (!Array.isArray(items) || !Array.isArray(field.fields)) {
      return [];
    }

    return items.flatMap((item, itemIndex) =>
      field.fields.flatMap((nestedField) => {
        if (!isTenantManagedLinkField(nestedField)) {
          return [];
        }

        return [{
          label: `${sectionLabel} ${field.itemLabel || "item"} ${itemIndex + 1} ${nestedField.placeholder || nestedField.label || nestedField.path}`,
          value: getValueAtPath(item, nestedField.path),
        }];
      }),
    );
  }

  if (!isTenantManagedLinkField(field)) {
    return [];
  }

  return [{
    label: `${sectionLabel} ${field.placeholder || field.label || field.path}`,
    value: getValueAtPath(section?.[field.group], field.path),
  }];
};

export const collectTenantPageConfigLinkEntries = (
  pageConfig = {},
  sectionRegistry = {},
) =>
  (pageConfig.sections || []).flatMap((section, index) => {
    const sectionLabel = `Section ${index + 1} (${section?.type || "unknown"})`;
    const editorSchema = sectionRegistry.getEditorSchema?.(section?.type, section?.variant) || [];
    const styleSchema = sectionRegistry.getStyleSchema?.(section?.type, section?.variant) || [];

    return [...editorSchema, ...styleSchema].flatMap((field) =>
      collectLinkEntriesFromField({ field, section, sectionLabel }),
    );
  });

export const validateTenantPageConfigLinks = (pageConfig = {}, sectionRegistry = {}) =>
  validateTenantManagedLinks(
    collectTenantPageConfigLinkEntries(pageConfig, sectionRegistry),
  );
