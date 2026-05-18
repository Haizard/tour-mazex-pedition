const DEFAULT_SOURCE_TYPE = "manual";

function cloneObject(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return { ...value };
}

function cloneArray(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((item) =>
    item && typeof item === "object" && !Array.isArray(item) ? { ...item } : item
  );
}

export function normalizeTemplateStudioSection(input = {}, index = 0) {
  const type = typeof input.type === "string" && input.type.trim() ? input.type.trim() : "custom";
  const sourceType =
    typeof input.sourceType === "string" && input.sourceType.trim()
      ? input.sourceType.trim()
      : DEFAULT_SOURCE_TYPE;

  return {
    id:
      typeof input.id === "string" && input.id.trim()
        ? input.id.trim()
        : `${type}-${sourceType}-${index}`,
    type,
    label:
      typeof input.label === "string" && input.label.trim() ? input.label.trim() : type,
    sourceType,
    sourceMeta: cloneObject(input.sourceMeta),
    order: Number.isFinite(input.order) ? input.order : index,
    enabled: input.enabled !== false,
    content: cloneObject(input.content),
    styles: cloneObject(input.styles),
    bindings: cloneArray(input.bindings),
    responsive: cloneObject(input.responsive),
    visibility: cloneObject(input.visibility),
    customCss: typeof input.customCss === "string" ? input.customCss : "",
  };
}

export function normalizeTemplateStudioSections(sections = []) {
  if (!Array.isArray(sections)) {
    return [];
  }

  return sections.map((section, index) => normalizeTemplateStudioSection(section, index));
}

