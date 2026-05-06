import React from "react";
import SEO from "../components/UI/SEO";
import PageRenderer from "../pageBuilder/PageRenderer";
import { legacyHomePage } from "../pageBuilder/defaultPages";
import { fetchPageConfig } from "../services/api";
import { useTenant } from "../context/TenantContext";
import PlatformHome from "./PlatformHome";

const Home = () => {
  const { tenant, loading, isPlatform } = useTenant();
  const [pageConfig, setPageConfig] = React.useState(null);

  React.useEffect(() => {
    if (isPlatform) {
      setPageConfig(null);
      return undefined;
    }

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
  }, [isPlatform]);

  if (isPlatform) {
    return (
      <div>
        <SEO
          title="MAZ Expeditions Marketplace"
          description="Discover safari tours, trekking adventures, and curated travel experiences from operators across the MAZ platform."
          keywords={["safari marketplace", "tanzania tours", "multi-tenant travel platform", "african safaris"]}
        />
        <PlatformHome />
      </div>
    );
  }

  const shouldUseLegacyFallback = !loading && (!tenant || tenant.slug === "maz-expeditions");
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
