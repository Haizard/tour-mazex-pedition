import { createStudioSectionDraft } from "./studioTypes.js";

function clampIndex(index, length) {
  if (length <= 0) {
    return 0;
  }

  return Math.min(Math.max(index, 0), length - 1);
}

function cloneSection(section, overrides = {}) {
  return {
    ...section,
    ...overrides,
  };
}

function getSectionIndex(sections, sectionId) {
  return sections.findIndex((section) => section.id === sectionId);
}

function createDuplicateId(sections, baseId) {
  let counter = 1;
  let candidate = `${baseId}-copy-${counter}`;

  while (sections.some((section) => section.id === candidate)) {
    counter += 1;
    candidate = `${baseId}-copy-${counter}`;
  }

  return candidate;
}

function ensureSelection(sections, selectedSectionId) {
  if (!sections.length) {
    return null;
  }

  if (selectedSectionId && sections.some((section) => section.id === selectedSectionId)) {
    return selectedSectionId;
  }

  return sections[0].id;
}

export function createStudioSectionNode(overrides = {}) {
  const draft = createStudioSectionDraft(overrides);

  return {
    ...draft,
    description: overrides.description ?? draft.summary,
    isHidden: overrides.isHidden ?? false,
    sourceType: overrides.sourceType ?? draft.sourceType,
    styleVariant: overrides.styleVariant ?? "default",
    bindings: overrides.bindings ?? [],
    actions: overrides.actions ?? [],
  };
}

export function createStudioCanvasState(overrides = {}) {
  const sections = (overrides.sections ?? []).map((section) => createStudioSectionNode(section));

  return {
    sections,
    selectedSectionId: ensureSelection(sections, overrides.selectedSectionId),
  };
}

function replaceSections(state, sections, selectedSectionId = state.selectedSectionId) {
  return {
    ...state,
    sections,
    selectedSectionId: ensureSelection(sections, selectedSectionId),
  };
}

function insertSection(state, action) {
  const section = createStudioSectionNode(action.section);
  const sections = [...state.sections];
  const targetIndex = getSectionIndex(sections, action.targetSectionId);

  if (targetIndex === -1) {
    sections.push(section);
    return replaceSections(state, sections, section.id);
  }

  const insertionIndex = action.position === "above" ? targetIndex : targetIndex + 1;
  sections.splice(insertionIndex, 0, section);

  return replaceSections(state, sections, section.id);
}

function moveSection(state, action) {
  const sections = [...state.sections];
  const index = getSectionIndex(sections, action.sectionId);

  if (index === -1) {
    return state;
  }

  const targetIndex = action.direction === "up" ? index - 1 : index + 1;

  if (targetIndex < 0 || targetIndex >= sections.length) {
    return state;
  }

  const [section] = sections.splice(index, 1);
  sections.splice(targetIndex, 0, section);

  return replaceSections(state, sections);
}

function reorderSection(state, action) {
  const sections = [...state.sections];
  const index = getSectionIndex(sections, action.sectionId);

  if (index === -1) {
    return state;
  }

  const [section] = sections.splice(index, 1);
  const targetIndex = clampIndex(action.toIndex, sections.length + 1);
  sections.splice(targetIndex, 0, section);

  return replaceSections(state, sections);
}

function duplicateSection(state, action) {
  const sections = [...state.sections];
  const index = getSectionIndex(sections, action.sectionId);

  if (index === -1) {
    return state;
  }

  const section = sections[index];
  const duplicateId = createDuplicateId(sections, section.id);
  const duplicate = cloneSection(section, {
    id: duplicateId,
    label: `${section.label} (Copy)`,
    status: "draft",
  });

  sections.splice(index + 1, 0, duplicate);

  return replaceSections(state, sections, duplicate.id);
}

function deleteSection(state, action) {
  const sections = [...state.sections];
  const index = getSectionIndex(sections, action.sectionId);

  if (index === -1) {
    return state;
  }

  sections.splice(index, 1);

  const fallback = sections[index]?.id ?? sections[index - 1]?.id ?? null;

  return replaceSections(state, sections, fallback);
}

function toggleSectionVisibility(state, action) {
  const sections = state.sections.map((section) =>
    section.id === action.sectionId
      ? cloneSection(section, { isHidden: !section.isHidden })
      : section,
  );

  return replaceSections(state, sections);
}

function updateSection(state, action) {
  const sections = state.sections.map((section) =>
    section.id === action.sectionId
      ? createStudioSectionNode({
          ...section,
          ...(action.patch || {}),
          content: {
            ...(section.content || {}),
            ...(action.patch?.content || {}),
          },
          styles: {
            ...(section.styles || {}),
            ...(action.patch?.styles || {}),
          },
          responsive: {
            ...(section.responsive || {}),
            ...(action.patch?.responsive || {}),
          },
          visibility: {
            ...(section.visibility || {}),
            ...(action.patch?.visibility || {}),
          },
          bindings: action.patch?.bindings || section.bindings || [],
        })
      : section
  );

  return replaceSections(state, sections);
}

function replaceSection(state, action) {
  const sections = state.sections.map((section) =>
    section.id === action.sectionId
      ? createStudioSectionNode({
          ...action.section,
          order: section.order,
          id: action.section?.id || section.id,
        })
      : section
  );

  return replaceSections(state, sections, action.section?.id || action.sectionId);
}

export function studioCanvasReducer(state, action) {
  switch (action.type) {
    case "hydrate-canvas":
      return createStudioCanvasState({
        sections: action.sections || [],
        selectedSectionId: action.selectedSectionId || null,
      });
    case "insert-section":
      return insertSection(state, action);
    case "move-section":
      return moveSection(state, action);
    case "reorder-section":
      return reorderSection(state, action);
    case "duplicate-section":
      return duplicateSection(state, action);
    case "delete-section":
      return deleteSection(state, action);
    case "toggle-section-visibility":
      return toggleSectionVisibility(state, action);
    case "update-section":
      return updateSection(state, action);
    case "replace-section":
      return replaceSection(state, action);
    case "select-section":
      return replaceSections(state, state.sections, action.sectionId);
    default:
      return state;
  }
}
