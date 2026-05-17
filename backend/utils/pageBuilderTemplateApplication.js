import {
  buildPersonalizedTemplatePage,
  getTemplateById,
  isTemplateUsable,
  resolveTemplateCatalogForTenant,
} from "../../src/pageBuilder/templateMarketplace.js";

const normalizeSections = (sections = []) =>
  [...sections]
    .filter((section) => section?.type)
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .map((section, index) => ({
      ...section,
      order: index + 1,
    }));

export const resolveTemplateForTenant = ({ templateId, tenant = {} } = {}) => {
  const template =
    resolveTemplateCatalogForTenant(tenant).find((candidate) => candidate.id === templateId) ||
    getTemplateById(templateId);

  if (!template) {
    throw new Error("Template not found.");
  }

  if (!isTemplateUsable(template)) {
    throw new Error(`${template.name} is not purchased for this tenant.`);
  }

  return template;
};

export const buildTemplatePageConfigPayload = ({ templateId, tenant = {} } = {}) => {
  const template = resolveTemplateForTenant({ templateId, tenant });
  const page = buildPersonalizedTemplatePage(template, {
    clientName: tenant.name || "this operator",
    accentSeed: `${tenant.slug || tenant.name || ""}-${template.id}`,
  });

  return {
    tenantId: tenant._id,
    pageType: page.pageType,
    slug: page.slug,
    title: page.title,
    status: "draft",
    seo: page.seo,
    templateSource: page.templateSource,
    sections: normalizeSections(page.sections),
  };
};
