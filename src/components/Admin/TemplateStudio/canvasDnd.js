export function createDropTargets(sections = []) {
  const normalizedSections = Array.isArray(sections) ? sections : [];

  return [
    ...normalizedSections.map((section, index) => ({
      id: `drop-before-${section.id}`,
      targetSectionId: section.id,
      position: "above",
      toIndex: index,
    })),
    {
      id: "drop-end",
      targetSectionId: normalizedSections[normalizedSections.length - 1]?.id || null,
      position: "below",
      toIndex: normalizedSections.length,
    },
  ];
}

export function resolveReorderDropIndex({
  sections = [],
  draggedSectionId,
  rawTargetIndex,
} = {}) {
  const currentIndex = sections.findIndex((section) => section.id === draggedSectionId);

  if (currentIndex === -1 || rawTargetIndex == null) {
    return null;
  }

  if (rawTargetIndex === currentIndex || rawTargetIndex === currentIndex + 1) {
    return null;
  }

  if (rawTargetIndex > currentIndex) {
    return rawTargetIndex - 1;
  }

  return rawTargetIndex;
}
