import React from "react";
import { useLocation, useParams } from "react-router-dom";
import SEO from "../components/UI/SEO";
import NoPage from "./NoPage";
import PageRenderer from "../pageBuilder/PageRenderer";
import { resolvePageConfigBySlug } from "../services/api";

const normalizeTenantRelativePath = (pathname, tenantSlug = "") => {
  if (!pathname) return "/";

  const demoPrefix = tenantSlug ? `/demo/${tenantSlug}` : "";
  const relative = demoPrefix && pathname.startsWith(demoPrefix)
    ? pathname.slice(demoPrefix.length) || "/"
    : pathname;

  const normalized = `/${relative.replace(/^\/+/, "").replace(/\/+$/, "")}`;
  return normalized === "/" ? "/" : normalized;
};

const DynamicTenantPage = () => {
  const location = useLocation();
  const { tenantSlug = "" } = useParams();
  const [pageConfig, setPageConfig] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [notFound, setNotFound] = React.useState(false);

  React.useEffect(() => {
    let active = true;

    const loadPage = async () => {
      const slug = normalizeTenantRelativePath(location.pathname, tenantSlug);
      setLoading(true);
      setNotFound(false);

      try {
        const response = await resolvePageConfigBySlug(slug);
        if (!active) return;
        setPageConfig(response.data || null);
      } catch (error) {
        if (!active) return;
        if (error.response?.status === 404) {
          setNotFound(true);
          setPageConfig(null);
        } else {
          console.error("Failed to resolve tenant page:", error);
          setNotFound(true);
          setPageConfig(null);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadPage();

    return () => {
      active = false;
    };
  }, [location.pathname, tenantSlug]);

  if (loading) {
    return (
      <div className="min-h-[60vh] bg-white pt-32">
        <div className="container mx-auto max-w-4xl px-4">
          <div className="h-3 w-44 animate-pulse rounded-full bg-slate-200" />
          <div className="mt-5 h-14 w-full max-w-2xl animate-pulse rounded-2xl bg-slate-100" />
          <div className="mt-5 h-48 w-full animate-pulse rounded-3xl bg-slate-100" />
        </div>
      </div>
    );
  }

  if (notFound || !pageConfig?.sections?.length) {
    return <NoPage />;
  }

  return (
    <div>
      <SEO
        title={pageConfig?.seo?.title || pageConfig?.title || "Page"}
        description={pageConfig?.seo?.description || ""}
        keywords={pageConfig?.seo?.keywords || []}
        canonicalUrl={pageConfig?.slug || location.pathname}
      />
      <PageRenderer sections={pageConfig.sections} />
    </div>
  );
};

export default DynamicTenantPage;
