import React from "react";
import SEO from "../components/UI/SEO";
import PageRenderer from "../pageBuilder/PageRenderer";
import { legacyHomePage } from "../pageBuilder/defaultPages";
import { fetchPageConfig } from "../services/api";
import { useTenant } from "../context/TenantContext";

const Home = () => {
  const { tenant } = useTenant();
  const [pageConfig, setPageConfig] = React.useState(null);

  React.useEffect(() => {
    let active = true;

    const loadPageConfig = async () => {
      try {
        const response = await fetchPageConfig("home");
        if (active) {
          setPageConfig(response.data || null);
        }
      } catch (error) {
        console.error("Failed to load home page config:", error);
      }
    };

    loadPageConfig();

    return () => {
      active = false;
    };
  }, []);

  const shouldUseLegacyFallback = !tenant || tenant.slug === "maz-expeditions";
  const seo = pageConfig?.seo || (shouldUseLegacyFallback ? legacyHomePage.seo : {});
  const sections = pageConfig?.sections?.length
    ? pageConfig.sections
    : shouldUseLegacyFallback
      ? legacyHomePage.sections
      : [];

  return (
    <div>
      <SEO
        title={seo.title || tenant?.name || legacyHomePage.seo.title}
        description={
          seo.description ||
          (shouldUseLegacyFallback ? legacyHomePage.seo.description : "")
        }
        keywords={
          seo.keywords?.length
            ? seo.keywords
            : shouldUseLegacyFallback
              ? legacyHomePage.seo.keywords
              : []
        }
      />
      <PageRenderer sections={sections} />
    </div>
  );
};

export default Home;
