export const normalizeTemplateList = (templates = []) =>
  [...new Set((templates || []).map((template) => template.toString().trim()).filter(Boolean))];

export const buildRequestedTemplateList = (currentTemplates = [], templateId = "") =>
  normalizeTemplateList([...currentTemplates, templateId]);

export const getTemplateRequestStatus = ({ templateId = "", tenant = {} } = {}) => {
  if ((tenant.purchasedTemplates || []).includes(templateId)) {
    return "purchased";
  }

  if ((tenant.requestedTemplates || []).includes(templateId)) {
    return "requested";
  }

  return "available";
};

export const summarizeTemplateRequests = (tenants = []) =>
  tenants.flatMap((tenant = {}) => {
    const purchasedTemplates = new Set(tenant.purchasedTemplates || []);

    return normalizeTemplateList(tenant.requestedTemplates || [])
      .filter((templateId) => !purchasedTemplates.has(templateId))
      .map((templateId) => ({
        tenantId: tenant._id?.toString?.() || tenant.id?.toString?.() || "",
        tenantName: tenant.name || "",
        tenantSlug: tenant.slug || "",
        templateId,
      }));
  });
