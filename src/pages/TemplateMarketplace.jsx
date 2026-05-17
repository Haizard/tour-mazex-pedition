import React from "react";
import { resolveTemplateCatalogForTenant, isTemplateUsable } from "../pageBuilder/templateMarketplace";
import { useTenant } from "../context/TenantContext";
import { requestTenantTemplate } from "../services/api";

const TemplateMarketplace = () => {
  const { tenant, refreshTenant } = useTenant();
  const [requestingTemplate, setRequestingTemplate] = React.useState("");
  const [message, setMessage] = React.useState("");
  const templates = React.useMemo(
    () => resolveTemplateCatalogForTenant(tenant || {}),
    [tenant]
  );

  const handleRequestTemplate = async (templateId) => {
    setRequestingTemplate(templateId);
    setMessage("");

    try {
      const response = await requestTenantTemplate(templateId);
      await refreshTenant();
      setMessage(response.data?.message || "Template request sent to the platform team.");
    } catch (error) {
      setMessage(error?.response?.data?.message || "Unable to request this template.");
    } finally {
      setRequestingTemplate("");
    }
  };

  return (
    <main className="min-h-screen bg-[#f6f7f9] pt-24 text-slate-950">
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-primary">
            Tourism UI Templates
          </p>
          <h1 className="mt-4 text-4xl font-black tracking-tight md:text-6xl">
            Ready-to-use website templates for tour operators
          </h1>
          <p className="mt-5 text-base font-semibold leading-8 text-slate-600">
            Browse page-builder-ready layouts for safari, trekking, beach, and campaign websites. Purchased templates can be applied by the platform team with client-specific copy and styling tweaks.
          </p>
        </div>

        {message && (
          <div className="mt-8 rounded-lg border border-slate-200 bg-white px-5 py-4 text-sm font-bold text-slate-600">
            {message}
          </div>
        )}

        <div className="mt-10 grid grid-cols-1 gap-5 lg:grid-cols-3">
          {templates.map((template) => {
            const usable = isTemplateUsable(template);

            return (
              <article
                key={template.id}
                className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                      {template.category}
                    </p>
                    <h2 className="mt-3 text-2xl font-black tracking-tight">
                      {template.name}
                    </h2>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${
                      usable ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-800"
                    }`}
                  >
                    {template.priceLabel}
                  </span>
                </div>

                <p className="mt-4 min-h-[84px] text-sm font-semibold leading-7 text-slate-600">
                  {template.preview}
                </p>

                <div className="mt-5 border-t border-slate-100 pt-5">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                    Best For
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(template.bestFor || []).map((item) => (
                      <span
                        key={item}
                        className="rounded-full border border-slate-200 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-slate-500"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3 text-xs font-black text-slate-500">
                  <div className="rounded-lg bg-slate-50 p-3">
                    Page Type
                    <p className="mt-1 text-sm text-slate-950">{template.pageType}</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-3">
                    Builder Blocks
                    <p className="mt-1 text-sm text-slate-950">{template.sections.length}</p>
                  </div>
                </div>
                {!usable && (
                  <button
                    type="button"
                    onClick={() => handleRequestTemplate(template.id)}
                    disabled={template.purchaseStatus === "requested" || requestingTemplate === template.id}
                    className="mt-5 w-full rounded-lg bg-slate-950 px-4 py-3 text-xs font-black uppercase tracking-widest text-white disabled:bg-slate-200 disabled:text-slate-500"
                  >
                    {requestingTemplate === template.id
                      ? "Requesting..."
                      : template.purchaseStatus === "requested"
                        ? "Request Sent"
                        : "Request This Template"}
                  </button>
                )}
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
};

export default TemplateMarketplace;
