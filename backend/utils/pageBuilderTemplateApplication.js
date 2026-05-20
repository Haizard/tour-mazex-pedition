import {
  buildPersonalizedTemplatePage,
  getTemplateById,
  isTemplateUsable,
  resolveTemplateCatalogForTenant,
} from "../../src/pageBuilder/templateMarketplace.js";
import PageBuilderTemplate from "../models/PageBuilderTemplate.js";
import { serializePlatformTemplate } from "./platformTemplateRegistry.js";
import { buildAssignmentAwareTemplateSource } from "./templateAssignmentResolution.js";

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

export const buildAssignedTemplatePageConfigPayload = async ({
  assignment,
  tenant = {},
  customTemplates = null,
  pageType = "home",
  status = "published",
} = {}) => {
  if (!assignment?.masterTemplateId) {
    return null;
  }

  const template = await resolveTemplateForTenant({
    templateId: assignment.masterTemplateId,
    tenant: {
      ...tenant,
      activeTemplateAssignment: {
        masterTemplateId: assignment.masterTemplateId,
      },
    },
    customTemplates,
  });

  if (template.pageType !== pageType) {
    return null;
  }

  const page = buildPersonalizedTemplatePage(template, {
    clientName: tenant.name || "this operator",
    accentSeed: `${tenant.slug || tenant.name || ""}-${template.id}`,
  });

  const assignmentMeta = {
    structureLocked: true,
    contentEditable: template.assignmentRules?.allowTenantContentEdits !== false,
    styleEditable: template.assignmentRules?.allowTenantThemeOverrides !== false,
    bindingEditable: template.assignmentRules?.allowTenantBindingEdits !== false,
    reusableSectionInsertionAllowed:
      template.assignmentRules?.allowReusableSectionInsertion !== false,
  };

  return {
    tenantId: tenant._id,
    pageType: page.pageType,
    slug: page.slug,
    title: page.title,
    status,
    seo: page.seo,
    templateSource: buildAssignmentAwareTemplateSource({
      assignment,
      masterTemplate: template,
      personalization: {
        personalizedFor: tenant.name || "",
        personalizationNote:
          "Tenant edits are stored as Template Studio personalization on top of the platform master template.",
      },
    }),
    templateStudio: {
      sourceType: "assigned-master-template",
      sourceMeta: {
        assignmentId: assignment._id?.toString?.() || assignment.id || "",
        masterTemplateId: assignment.masterTemplateId,
        personalizationLayerId: `${assignment.masterTemplateId}:${page.pageType}`,
      },
    },
    sections: normalizeSections(page.sections).map((section) => ({
      ...section,
      studioMeta: {
        ...(section.studioMeta || {}),
        sourceType: "assigned-master-template",
        sourceMeta: {
          ...(section.studioMeta?.sourceMeta || {}),
          assignmentMeta,
        },
      },
    })),
  };
};
