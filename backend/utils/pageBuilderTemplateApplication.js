import {
  buildPersonalizedTemplatePage,
  getTemplateById,
  isTemplateUsable,
  resolveTemplateCatalogForTenant,
} from "../../src/pageBuilder/templateMarketplace.js";
import PageBuilderTemplate from "../models/PageBuilderTemplate.js";
import { serializePlatformTemplate } from "./platformTemplateRegistry.js";

const normalizeSections = (sections = []) =>
  [...sections]
    .filter((section) => section?.type)
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .map((section, index) => ({
      ...section,
      order: index + 1,
    }));

const findPlatformTemplate = async (templateId) => {
  const template = await PageBuilderTemplate.findOne({ id: templateId, status: "published" }).lean();
  return template ? serializePlatformTemplate(template) : null;
};

export const resolveTemplateForTenant = async ({ templateId, tenant = {}, customTemplates = null } = {}) => {
  const platformTemplates = customTemplates || [];
  let template =
    resolveTemplateCatalogForTenant(tenant, platformTemplates).find((candidate) => candidate.id === templateId) ||
    getTemplateById(templateId);

  if (!template && !customTemplates) {
    const platformTemplate = await findPlatformTemplate(templateId);
    template = platformTemplate
      ? resolveTemplateCatalogForTenant(tenant, [platformTemplate]).find((candidate) => candidate.id === templateId)
      : null;
  }

  if (!template) {
    throw new Error("Template not found.");
  }

  if (!isTemplateUsable(template)) {
    throw new Error(`${template.name} is not purchased for this tenant.`);
  }

  return template;
};

export const buildTemplatePageConfigPayload = async ({ templateId, tenant = {}, customTemplates = null } = {}) => {
  const template = await resolveTemplateForTenant({ templateId, tenant, customTemplates });
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
