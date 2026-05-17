import React from "react";
import { Eye, Layers3, Search, SlidersHorizontal, Sparkles } from "lucide-react";
import { resolveTemplateCatalogForTenant, isTemplateUsable } from "../pageBuilder/templateMarketplace";
import { getShowcaseFilters, resolveShowcaseTemplates } from "../pageBuilder/templateShowcase";
import { useTenant } from "../context/TenantContext";
import { requestTenantTemplate } from "../services/api";

const SORT_OPTIONS = ["Recent", "Popular"];

const statusStyles = {
  purchased: "border-emerald-200 bg-emerald-50 text-emerald-700",
  included: "border-safari-gold/40 bg-[#fff8e6] text-[#8b5e34]",
  requested: "border-blue-200 bg-blue-50 text-blue-700",
  available: "border-slate-200 bg-white text-slate-600",
};

const getTemplateActionLabel = (template, requestingTemplate) => {
  if (requestingTemplate === template.id) return "Requesting...";
  if (template.purchaseStatus === "requested") return "Request Sent";
  if (isTemplateUsable(template)) return "Ready In Builder";
  return "Request Template";
};

const TemplateMarketplace = () => {
  const { tenant, refreshTenant } = useTenant();
  const [requestingTemplate, setRequestingTemplate] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [query, setQuery] = React.useState("");
  const [activeFilter, setActiveFilter] = React.useState("All");
  const [sort, setSort] = React.useState("Recent");
  const templates = React.useMemo(
    () => resolveTemplateCatalogForTenant(tenant || {}),
    [tenant]
  );
  const filters = React.useMemo(() => getShowcaseFilters(templates), [templates]);
  const visibleTemplates = React.useMemo(
    () => resolveShowcaseTemplates(templates, { query, filter: activeFilter, sort }),
    [activeFilter, query, sort, templates]
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
    <main className="min-h-screen bg-[#f4efe4] pt-24 text-[#2f2418]">
      <section className="border-b border-[#d8c7b4] bg-[#f8f4ec]">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#8b5e34]">
                Tourism UI Templates
              </p>
              <h1 className="mt-4 text-4xl font-black tracking-tight text-[#2f2418] md:text-6xl">
                Showcase-ready travel websites for the page builder
              </h1>
              <p className="mt-5 max-w-2xl text-base font-semibold leading-8 text-[#6f6255]">
                Browse polished safari, trekking, beach, and campaign templates. Purchased layouts are ready for the builder and can be personalized so every client site feels distinct.
              </p>
            </div>
            <div className="grid w-full max-w-sm grid-cols-2 overflow-hidden rounded-lg border border-[#d8c7b4] bg-white shadow-sm">
              <div className="border-r border-[#d8c7b4] p-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#8b5e34]">Templates</p>
                <p className="mt-1 text-3xl font-black">{templates.length}</p>
              </div>
              <div className="p-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#8b5e34]">Builder Ready</p>
                <p className="mt-1 text-3xl font-black">{templates.filter(isTemplateUsable).length}</p>
              </div>
            </div>
          </div>

          <div className="sticky top-24 z-20 rounded-lg border border-[#d8c7b4] bg-white/95 p-3 shadow-lg backdrop-blur">
            <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
              <label className="flex min-h-12 items-center gap-3 rounded-lg border border-[#d8c7b4] bg-[#fbfaf7] px-4 text-[#6f6255]">
                <Search size={18} />
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search safari, trekking, beach, campaign..."
                  className="w-full bg-transparent text-sm font-bold text-[#2f2418] outline-none placeholder:text-[#9b8b7a]"
                />
              </label>
              <div className="flex flex-wrap gap-2">
                {SORT_OPTIONS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setSort(option)}
                    className={`inline-flex min-h-10 items-center gap-2 rounded-lg border px-4 text-xs font-black uppercase tracking-widest transition ${
                      sort === option
                        ? "border-[#4c6b42] bg-[#4c6b42] text-white"
                        : "border-[#d8c7b4] bg-white text-[#6f6255] hover:border-[#8b5e34]"
                    }`}
                  >
                    <SlidersHorizontal size={14} />
                    {option}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {filters.map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setActiveFilter(filter)}
                  className={`shrink-0 rounded-lg border px-4 py-2 text-xs font-black uppercase tracking-widest transition ${
                    activeFilter === filter
                      ? "border-[#e0b85c] bg-[#e0b85c] text-[#264232]"
                      : "border-[#d8c7b4] bg-white text-[#6f6255] hover:border-[#8b5e34]"
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {message && (
          <div className="mb-8 rounded-lg border border-[#d8c7b4] bg-white px-5 py-4 text-sm font-bold text-[#6f6255] shadow-sm">
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {visibleTemplates.map((template) => {
            const usable = isTemplateUsable(template);

            return (
              <article
                key={template.id}
                className="group overflow-hidden rounded-lg border border-[#d8c7b4] bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-[#8b5e34] hover:shadow-xl"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-[#2f2418]">
                  <img
                    src={template.previewImage}
                    alt={`${template.name} preview`}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
                  <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1 rounded-lg bg-white/95 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[#264232]">
                      <Sparkles size={12} />
                      {template.category}
                    </span>
                    <span
                      className={`rounded-lg border px-3 py-1 text-[10px] font-black uppercase tracking-widest ${statusStyles[template.purchaseStatus] || statusStyles.available}`}
                    >
                      {template.priceLabel}
                    </span>
                  </div>
                  <div className="absolute inset-x-4 bottom-4 rounded-lg border border-white/15 bg-black/40 p-4 text-white backdrop-blur-sm">
                    <p className="line-clamp-2 text-2xl font-black tracking-tight">
                      {template.name}
                    </p>
                    <div className="mt-3 flex items-center gap-4 text-[11px] font-bold uppercase tracking-widest text-white/75">
                      <span className="inline-flex items-center gap-1">
                        <Layers3 size={13} />
                        {template.sections.length} Blocks
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Eye size={13} />
                        {template.pageType}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-4">
                  <p className="min-h-[52px] text-sm font-semibold leading-7 text-[#6f6255]">
                    {template.preview}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {(template.bestFor || []).map((item) => (
                      <span
                        key={item}
                        className="rounded-lg border border-[#d8c7b4] bg-[#fbfaf7] px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[#6f6255]"
                      >
                        {item}
                      </span>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => !usable && handleRequestTemplate(template.id)}
                    disabled={usable || template.purchaseStatus === "requested" || requestingTemplate === template.id}
                    className={`mt-5 w-full rounded-lg px-4 py-3 text-xs font-black uppercase tracking-widest transition ${
                      usable
                        ? "cursor-default bg-[#4c6b42] text-white"
                        : "bg-[#2f2418] text-white hover:bg-[#4c6b42] disabled:bg-[#d8c7b4] disabled:text-[#6f6255]"
                    }`}
                  >
                    {getTemplateActionLabel(template, requestingTemplate)}
                  </button>
                </div>
              </article>
            );
          })}
        </div>

        {visibleTemplates.length === 0 && (
          <div className="rounded-lg border border-[#d8c7b4] bg-white px-6 py-14 text-center shadow-sm">
            <p className="text-xl font-black">No templates match that search.</p>
            <p className="mt-2 text-sm font-semibold text-[#6f6255]">
              Try a broader keyword or switch back to All templates.
            </p>
          </div>
        )}
      </section>
    </main>
  );
};

export default TemplateMarketplace;
