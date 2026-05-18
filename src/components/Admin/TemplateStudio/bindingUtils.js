export const STUDIO_BINDING_TYPES = [
  "static",
  "dynamic-single",
  "dynamic-collection",
  "mixed",
];

export function createEmptyStudioBinding() {
  return {
    sourceKey: "",
    bindingType: "static",
    fieldPath: "",
    confidence: 0,
    rationale: "",
  };
}

export function normalizeStudioBindings(bindings = []) {
  if (!Array.isArray(bindings)) {
    return [];
  }

  return bindings.map((binding) => ({
    ...createEmptyStudioBinding(),
    ...(binding || {}),
    sourceKey: String(binding?.sourceKey || ""),
    bindingType: STUDIO_BINDING_TYPES.includes(binding?.bindingType)
      ? binding.bindingType
      : "static",
    fieldPath: String(binding?.fieldPath || ""),
    confidence: Number(binding?.confidence || 0),
    rationale: String(binding?.rationale || ""),
  }));
}
