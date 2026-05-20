const normalizeText = (value = "") => String(value || "").trim().toLowerCase();

export const buildTenantAssignmentSummary = ({
  tenant = null,
  assignments = [],
  templates = [],
} = {}) => {
  const templateLookup = Object.fromEntries((templates || []).map((template) => [template.id, template]));
  const tenantId = tenant?._id || tenant?.id;
  const tenantAssignments = (assignments || [])
    .filter((assignment) => (assignment.tenantId || assignment.tenant?._id) === tenantId)
    .sort(
      (left, right) =>
        new Date(right.assignedAt || right.createdAt || 0).getTime() -
        new Date(left.assignedAt || left.createdAt || 0).getTime()
    );

  const activeAssignment =
    tenantAssignments.find((assignment) => assignment.active !== false) || null;

  return {
    tenantId,
    tenantName: tenant?.name || "",
    activeAssignment,
    activeTemplate:
      templateLookup[activeAssignment?.masterTemplateId] || null,
    historyCount: tenantAssignments.length,
  };
};

export const buildTemplateAssignmentRows = ({
  tenants = [],
  assignments = [],
  templates = [],
} = {}) =>
  (tenants || []).map((tenant) => {
    const summary = buildTenantAssignmentSummary({ tenant, assignments, templates });

    return {
      tenantId: tenant._id,
      tenantName: tenant.name || "",
      tenantSlug: tenant.slug || "",
      activeTemplateId: summary.activeAssignment?.masterTemplateId || "",
      activeTemplateName: summary.activeTemplate?.name || "No active template",
      activeTemplateStatus: summary.activeTemplate?.status || "",
      activeAssignmentStatus: summary.activeAssignment?.assignmentStatus || "unassigned",
      assignedAt: summary.activeAssignment?.assignedAt || "",
      historyCount: summary.historyCount,
    };
  });

export const filterTemplateAssignmentRows = (rows = [], filters = {}) => {
  const query = normalizeText(filters.search);
  const status = normalizeText(filters.status);

  return (rows || []).filter((row) => {
    const matchesQuery =
      !query ||
      normalizeText(row.tenantName).includes(query) ||
      normalizeText(row.tenantSlug).includes(query) ||
      normalizeText(row.activeTemplateName).includes(query);

    const matchesStatus =
      !status ||
      status === "all" ||
      normalizeText(row.activeAssignmentStatus) === status;

    return matchesQuery && matchesStatus;
  });
};
