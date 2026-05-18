import React from "react";

export default function CanvasSectionCard({ section, isSelected = false, onAction }) {
  const buttonClassName =
    "rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-200";

  const cardTone = section.isHidden
    ? "border-amber-200 bg-amber-50/70"
    : isSelected
      ? "border-emerald-300 bg-emerald-50/70 shadow-sm"
      : "border-slate-200 bg-white";

  return (
    <section
      className={`rounded-[1.5rem] border px-5 py-5 transition ${cardTone}`}
      data-testid={`template-studio-section-${section.id}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              {section.type}
            </p>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">
              {section.sourceType}
            </span>
            {section.isHidden ? (
              <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-medium text-amber-700">
                Hidden
              </span>
            ) : null}
          </div>
          <h3 className="mt-2 text-lg font-semibold text-slate-900">{section.label}</h3>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            {section.description ?? section.summary}
          </p>
        </div>

        <div className="flex flex-wrap justify-end gap-2">
          <button type="button" className={buttonClassName} onClick={() => onAction?.("move-up", section)}>
            Move up
          </button>
          <button type="button" className={buttonClassName} onClick={() => onAction?.("move-down", section)}>
            Move down
          </button>
          <button type="button" className={buttonClassName} onClick={() => onAction?.("duplicate", section)}>
            Duplicate
          </button>
          <button type="button" className={buttonClassName} onClick={() => onAction?.("save-reusable", section)}>
            Save reusable
          </button>
          <button type="button" className={buttonClassName} onClick={() => onAction?.("toggle-visibility", section)}>
            {section.isHidden ? "Show" : "Hide"}
          </button>
          <button
            type="button"
            className="rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
            onClick={() => onAction?.("delete", section)}
          >
            Delete
          </button>
        </div>
      </div>
    </section>
  );
}
