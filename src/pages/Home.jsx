import React from "react";
import SEO from "../components/UI/SEO";
import PageRenderer from "../pageBuilder/PageRenderer";
import { legacyHomePage } from "../pageBuilder/defaultPages";
import { fetchPageConfig } from "../services/api";

const Home = () => {
  const [pageConfig, setPageConfig] = React.useState(null);
  const [hasHydrated, setHasHydrated] = React.useState(false);

  React.useEffect(() => {
    setHasHydrated(true);
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

  // Use fallback values during the first hydration pass to match the server/static HTML
  const seo = (hasHydrated && pageConfig?.seo) || legacyHomePage.seo;
  const sections = (hasHydrated && pageConfig?.sections?.length)
    ? pageConfig.sections
    : legacyHomePage.sections;

  return (
    <div>
      <SEO
        title={seo.title || legacyHomePage.seo.title}
        description={seo.description || legacyHomePage.seo.description}
        keywords={seo.keywords?.length ? seo.keywords : legacyHomePage.seo.keywords}
      />
      <PageRenderer sections={sections} />
    </div>
  );
};

export default Home;
