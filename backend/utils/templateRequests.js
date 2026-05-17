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
