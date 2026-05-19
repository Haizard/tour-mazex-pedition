function getSectionDrafts(result = {}) {
  return Array.isArray(result.sectionDrafts) ? result.sectionDrafts : [];
}

export function createImportReviewState(result = {}) {
  const selectedSectionIds = getSectionDrafts(result)
    .map((section) => section?.id)
    .filter(Boolean);

  return {
    selectedSectionIds,
    totalCount: selectedSectionIds.length,
    selectedCount: selectedSectionIds.length,
  };
}

export function toggleImportReviewSection(review = {}, sectionId) {
  const currentSelection = new Set(review.selectedSectionIds || []);

  if (currentSelection.has(sectionId)) {
    currentSelection.delete(sectionId);
  } else {
    currentSelection.add(sectionId);
  }

  const selectedSectionIds = [...currentSelection];

  return {
    ...review,
    selectedSectionIds,
    totalCount: review.totalCount ?? selectedSectionIds.length,
    selectedCount: selectedSectionIds.length,
  };
}

export function buildApprovedImportPayload(result = {}, review = {}) {
  const selectedIds = new Set(review.selectedSectionIds || []);
  const sectionDrafts = getSectionDrafts(result).filter((section) => selectedIds.has(section.id));
  const pageDraftSections = (result.pageDraft?.sections || []).filter((section) =>
    selectedIds.has(section.id)
  );

  return {
    ...result,
    sectionDrafts,
    pageDraft: {
      ...(result.pageDraft || {}),
      sections: pageDraftSections,
    },
  };
}
