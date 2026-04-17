import React from "react";
import SEO from "../components/UI/SEO";
import PageRenderer from "../pageBuilder/PageRenderer";
import { legacyHomePage } from "../pageBuilder/defaultPages";
import { fetchPageConfig } from "../services/api";

const Home = () => {
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

  const seo = pageConfig?.seo || legacyHomePage.seo;
  const sections = pageConfig?.sections?.length
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
