import React, { Suspense } from "react";
import SEO from "../components/UI/SEO";
import PageRenderer from "../pageBuilder/PageRenderer";
import { fetchPageConfig } from "../services/api";

const ConfiguredPage = ({ pageType, fallback: FallbackComponent = null }) => {
  const [pageConfig, setPageConfig] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let active = true;

    const loadPageConfig = async () => {
      setLoading(true);
      try {
        const response = await fetchPageConfig(pageType);
        if (active) {
          setPageConfig(response.data || null);
        }
      } catch (error) {
        console.error(`Failed to load ${pageType} page config:`, error);
        if (active) {
          setPageConfig(null);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadPageConfig();

    return () => {
      active = false;
    };
  }, [pageType]);

  const sections = pageConfig?.sections?.filter((section) => section.enabled !== false) || [];

  if (!loading && sections.length === 0 && FallbackComponent) {
    return (
      <Suspense fallback={renderPageLoadingState()}>
        <FallbackComponent />
      </Suspense>
    );
  }

  if (loading) {
    return renderPageLoadingState();
  }

  return (
    <div>
      <SEO
        title={pageConfig?.seo?.title || pageConfig?.title || pageType}
        description={pageConfig?.seo?.description || ""}
        keywords={pageConfig?.seo?.keywords || []}
        canonicalUrl={pageConfig?.slug || `/${pageType}`}
      />
      <PageRenderer sections={sections} />
    </div>
  );
};

const renderPageLoadingState = () => (
  <div className="min-h-[60vh] bg-white pt-32">
    <div className="container mx-auto max-w-4xl px-4">
      <div className="h-2 w-48 animate-pulse rounded-full bg-slate-200" />
      <div className="mt-5 h-12 w-full max-w-xl animate-pulse rounded-2xl bg-slate-100" />
      <div className="mt-4 h-32 w-full animate-pulse rounded-3xl bg-slate-100" />
    </div>
  </div>
);

export default ConfiguredPage;
