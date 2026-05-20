const toComparableTime = (value) => {
  if (!value) {
    return 0;
  }

  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : 0;
};

const normalizeId = (value = "") => value?.toString?.() || "";

const resolveSectionAssignmentMeta = (section = {}) => ({
  ...(section.assignmentMeta || {}),
  ...(section.sourceMeta?.assignmentMeta || {}),
  ...(section.studioMeta?.assignmentMeta || {}),
});

export function resolveActiveTemplateAssignment({ tenantId = "", assignments = [] } = {}) {
  const normalizedTenantId = normalizeId(tenantId);
  const activeAssignments = (assignments || [])
    .filter((assignment) => {
      if (!assignment) {
        return false;
      }

      const matchesTenant =
        !normalizedTenantId || normalizeId(assignment.tenantId) === normalizedTenantId;

      return matchesTenant && assignment.active !== false;
    })
    .sort((left, right) => {
      const timeDelta =
        toComparableTime(right.assignedAt || right.createdAt) -
        toComparableTime(left.assignedAt || left.createdAt);

      if (timeDelta !== 0) {
        return timeDelta;
      }

      return normalizeId(right._id || right.id).localeCompare(normalizeId(left._id || left.id));
    });

  return activeAssignments[0] || null;
}

export function buildAssignmentAwareTemplateSource({
  assignment = {},
  masterTemplate = {},
  personalization = {},
} = {}) {
  return {
    templateId: masterTemplate.id || assignment.masterTemplateId || "",
    templateName: masterTemplate.name || personalization.templateName || "",
    assignmentId: normalizeId(assignment._id || assignment.id),
    masterTemplateId: assignment.masterTemplateId || masterTemplate.id || "",
    personalizationMode: "assignment",
    personalizedFor: personalization.personalizedFor || "",
    personalizationNote: personalization.personalizationNote || "",
    assignmentStatus: assignment.assignmentStatus || (assignment.active === false ? "archived" : "active"),
    assignedAt: assignment.assignedAt || null,
  };
}

export function isSectionLocked(section = {}) {
  const assignmentMeta = resolveSectionAssignmentMeta(section);
  return assignmentMeta.structureLocked === true;
}

export function isSectionPersonalizationAllowed(section = {}) {
  const assignmentMeta = resolveSectionAssignmentMeta(section);

  if (assignmentMeta.structureLocked !== true && Object.keys(assignmentMeta).length === 0) {
    return true;
  }

  return Boolean(
    assignmentMeta.contentEditable ||
      assignmentMeta.styleEditable ||
      assignmentMeta.bindingEditable ||
      assignmentMeta.structureEditable
  );
}
