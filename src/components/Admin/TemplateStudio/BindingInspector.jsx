import React from "react";

import {
  createEmptyStudioBinding,
  normalizeStudioBindings,
  STUDIO_BINDING_TYPES,
} from "./bindingUtils.js";

export default function BindingInspector({
  section,
  bindings = [],
  suggestions = [],
  onRequestSuggestions,
  onChangeBindings,
}) {
  const normalizedBindings = normalizeStudioBindings(bindings);

  const updateBinding = (index, patch) => {
    const nextBindings = normalizedBindings.map((binding, bindingIndex) =>
      bindingIndex === index ? { ...binding, ...patch } : binding
    );
    onChangeBindings?.(nextBindings);
  };

  const removeBinding = (index) => {
    onChangeBindings?.(normalizedBindings.filter((_, bindingIndex) => bindingIndex !== index));
  };

  const appendBinding = (binding = createEmptyStudioBinding()) => {
    onChangeBindings?.([...normalizedBindings, binding]);
  };

  const applySuggestion = (suggestion) => {
    const alreadyExists = normalizedBindings.some(
      (binding) =>
        binding.sourceKey === suggestion.sourceKey &&
        binding.fieldPath === suggestion.fieldPath &&
        binding.bindingType === suggestion.bindingType
    );

    if (!alreadyExists) {
      appendBinding({
        ...createEmptyStudioBinding(),
        ...suggestion,
      });
    }
  };

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

      <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Active Bindings</p>
            <p className="mt-1 text-sm text-slate-600">
              Fine-tune the CMS mapping for this section and save it with the page.
            </p>
          </div>
          <button
            type="button"
            className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
            onClick={() => appendBinding()}
          >
            Add Binding
          </button>
        </div>

        {normalizedBindings.length ? (
          <div className="space-y-3">
            {normalizedBindings.map((binding, index) => (
              <div key={`${binding.sourceKey}-${binding.fieldPath}-${index}`} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Source Key
                    <input
                      type="text"
                      value={binding.sourceKey}
                      onChange={(event) => updateBinding(index, { sourceKey: event.target.value })}
                      className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700"
                      placeholder="tourPackages"
                    />
                  </label>
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Binding Type
                    <select
                      value={binding.bindingType}
                      onChange={(event) => updateBinding(index, { bindingType: event.target.value })}
                      className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700"
                    >
                      {STUDIO_BINDING_TYPES.map((bindingType) => (
                        <option key={bindingType} value={bindingType}>
                          {bindingType}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 md:col-span-2">
                    Field Path
                    <input
                      type="text"
                      value={binding.fieldPath}
                      onChange={(event) => updateBinding(index, { fieldPath: event.target.value })}
                      className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700"
                      placeholder="items"
                    />
                  </label>
                </div>
                <div className="mt-3 flex justify-end">
                  <button
                    type="button"
                    className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                    onClick={() => removeBinding(index)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-4 text-sm text-slate-500">
            No bindings configured yet. Add one manually or apply a suggestion below.
          </div>
        )}
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
              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
                  onClick={() => applySuggestion(suggestion)}
                >
                  Apply Suggestion
                </button>
              </div>
              <div className="mt-3 grid gap-2 md:grid-cols-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Binding Type
                  <select
                    value={suggestion.bindingType}
                    readOnly
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700"
                  >
                    {STUDIO_BINDING_TYPES.map((bindingType) => (
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
