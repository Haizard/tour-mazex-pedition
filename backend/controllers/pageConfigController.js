import PageConfig from "../models/PageConfig.js";
import { buildTenantFilter, withTenantId } from "../utils/tenantContext.js";
import { HOME_PAGE_DEFAULT } from "../utils/pageBuilderDefaults.js";

const normalizeSections = (sections = []) =>
  [...sections]
    .filter((section) => section && section.type)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

export const getPageConfig = async (req, res) => {
  try {
    const pageType = req.params.pageType || "home";
    let page = await PageConfig.findOne(buildTenantFilter(req, { pageType })).lean();

    if (!page && pageType === "home") {
      page = {
        ...HOME_PAGE_DEFAULT,
        tenantId: req.tenantId,
      };
    }

    if (!page) {
      return res.status(404).json({ message: "Page config not found." });
    }

    page.sections = normalizeSections(page.sections);
    res.status(200).json(page);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const upsertPageConfig = async (req, res) => {
  try {
    const pageType = req.params.pageType || req.body.pageType || "home";
    const payload = {
      pageType,
      slug: req.body.slug || (pageType === "home" ? "/" : `/${pageType}`),
      title: req.body.title || "",
      status: req.body.status || "published",
      seo: req.body.seo || {},
      sections: normalizeSections(req.body.sections || []),
    };

    const page = await PageConfig.findOneAndUpdate(
      buildTenantFilter(req, { pageType }),
      withTenantId(req, payload),
      {
        upsert: true,
        new: true,
        runValidators: true,
      }
    );

    res.status(200).json(page);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
