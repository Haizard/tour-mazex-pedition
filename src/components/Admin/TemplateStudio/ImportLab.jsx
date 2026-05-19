import React from "react";

const SOURCE_TYPES = [
  { value: "html-css-page", label: "HTML / CSS Page" },
  { value: "html-snippet", label: "Section Snippet" },
  { value: "reference-image", label: "Reference Image" },
  { value: "template-package", label: "Template Package" },
];

export default function ImportLab({
  importState,
  onChange,
  onImport,
  onToggleReviewSection,
  onCommitImport,
  importing = false,
}) {
  const state = importState || {
    name: "Imported Template",
    sourceType: "html-css-page",
    sourceCode: "",
    referenceImageUrl: "",
    result: null,
  };

  const detectedSections = state.result?.sectionDrafts || [];
  const selectedSectionIds = state.review?.selectedSectionIds || [];
  const selectedCount = state.review?.selectedCount || 0;
  const hasReviewableSections = detectedSections.length > 0;

  return (
    <section
      className="flex h-full min-h-0 w-full shrink-0 md:basis-[22rem] xl:basis-[24rem] 2xl:basis-[28rem] flex-col border-r border-slate-200 bg-white"
      data-testid="template-studio-import-lab"
    >
      <div className="border-b border-slate-200 px-5 py-5">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
          Import Lab
        </p>
        <h2 className="mt-2 text-lg font-semibold text-slate-900">Import and analyze template sources</h2>
        <p className="mt-1 text-sm text-slate-500">
          Bring in HTML, snippets, or reference-based structure and convert it into editable studio sections.
        </p>
      </div>

      <div className="flex-1 overflow-auto px-5 py-5">
        <div className="space-y-4">
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Import Name</span>
            <input
              type="text"
              value={state.name}
              onChange={(event) => onChange?.("name", event.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-400"
            />
          </label>

          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Source Type</span>
            <select
              value={state.sourceType}
              onChange={(event) => onChange?.("sourceType", event.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-400"
            >
              {SOURCE_TYPES.map((sourceType) => (
                <option key={sourceType.value} value={sourceType.value}>
                  {sourceType.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Source Code / Snippet</span>
            <textarea
              rows={10}
              value={state.sourceCode}
              onChange={(event) => onChange?.("sourceCode", event.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-mono text-xs text-slate-900 outline-none focus:border-slate-400"
              placeholder="<section>...</section><style>...</style>"
            />
          </label>

          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Reference Image URL</span>
            <input
              type="text"
              value={state.referenceImageUrl}
              onChange={(event) => onChange?.("referenceImageUrl", event.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-400"
              placeholder="https://example.com/reference.jpg"
            />
          </label>

          <button
            type="button"
            onClick={() => onImport?.(state)}
            disabled={importing}
            className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {importing ? "Analyzing import..." : "Analyze Import"}
          </button>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Detected Sections</p>
            <div className="mt-3 space-y-2">
              {hasReviewableSections ? (
                detectedSections.map((section) => (
                  <div key={section.id} className="rounded-xl bg-white px-3 py-3 text-sm text-slate-700">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <span className="font-semibold text-slate-900">{section.label}</span>
                          <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-600">
                            {section.type}
                          </span>
                        </div>
                        <p className="mt-2 text-xs text-slate-500">
                          {section.summary || "Ready for canvas insertion and CMS binding."}
                        </p>
                      </div>
                      <label className="flex shrink-0 items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                        <input
                          type="checkbox"
                          checked={selectedSectionIds.includes(section.id)}
                          onChange={() => onToggleReviewSection?.(section.id)}
                        />
                        Keep
                      </label>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-slate-300 bg-white px-3 py-4 text-sm text-slate-500">
                  Imported sections will appear here after analysis.
                </div>
              )}
            </div>

            {hasReviewableSections ? (
              <div className="mt-4 rounded-xl border border-slate-200 bg-white px-4 py-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Import Review
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      {selectedCount} of {detectedSections.length} sections selected for import.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onCommitImport?.()}
                    disabled={!selectedCount}
                    className="rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Import Selected
                  </button>
                </div>
              </div>
            ) : null}

            {state.result?.warnings?.length ? (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-800">
                {state.result.warnings.join(" ")}
              </div>
            ) : null}

            {state.result?.unsupportedFragments?.length ? (
              <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-3 text-sm text-rose-800">
                {state.result.unsupportedFragments.join(" ")}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
