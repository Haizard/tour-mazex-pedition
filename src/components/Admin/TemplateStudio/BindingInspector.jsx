import React from "react";

const BINDING_TYPES = [
  "static",
  "dynamic-single",
  "dynamic-collection",
  "mixed",
];

export default function BindingInspector({
  section,
  suggestions = [],
  onRequestSuggestions,
}) {
  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">CMS Bindings</p>
          <p className="mt-1 text-sm text-slate-600">
            Map imported or manual content blocks to tours, blogs, testimonials, destinations, or inquiry data.
          </p>
        </div>
        <button
          type="button"
          className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
          onClick={() => onRequestSuggestions?.(section)}
        >
          Refresh Suggestions
        </button>
      </div>

      <div className="space-y-3">
        {(suggestions || []).length ? (
          suggestions.map((suggestion) => (
            <div key={`${suggestion.sourceKey}-${suggestion.fieldPath}`} className="rounded-xl bg-white px-3 py-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{suggestion.sourceKey}</p>
                  <p className="mt-1 text-xs text-slate-500">{suggestion.rationale}</p>
                </div>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                  {Math.round((suggestion.confidence || 0) * 100)}%
                </span>
              </div>
              <div className="mt-3 grid gap-2 md:grid-cols-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Binding Type
                  <select
                    value={suggestion.bindingType}
                    readOnly
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700"
                  >
                    {BINDING_TYPES.map((bindingType) => (
                      <option key={bindingType} value={bindingType}>
                        {bindingType}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Field Path
                  <input
                    type="text"
                    value={suggestion.fieldPath || ""}
                    readOnly
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700"
                  />
                </label>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white px-3 py-4 text-sm text-slate-500">
            No binding suggestions yet. Ask the studio to analyze this section when you need CMS mapping guidance.
          </div>
        )}
      </div>
    </div>
  );
}
