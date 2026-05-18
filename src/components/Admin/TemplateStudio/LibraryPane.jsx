import React from "react";

import { createStudioSectionNode } from "./studioReducers.js";

function LibraryCard({ section, isActive, onSelect }) {
  return (
    <button
      type="button"
      className={`w-full rounded-2xl border px-4 py-4 text-left transition ${
        isActive
          ? "border-sky-300 bg-sky-50 shadow-sm"
          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
      }`}
      onClick={() => onSelect?.(section)}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            {section.type}
          </p>
          <h3 className="mt-2 text-sm font-semibold text-slate-900">{section.label}</h3>
        </div>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">
          {section.sourceType}
        </span>
      </div>
      <p className="mt-2 text-sm text-slate-600">{section.summary}</p>
    </button>
  );
}

export default function LibraryPane({
  sections = [],
  selectedSectionId,
  onSelectSection,
}) {
  const librarySections = sections.map((section) => createStudioSectionNode(section));

  return (
    <aside
      className="flex h-full min-h-0 w-full max-w-[20rem] flex-col border-r border-slate-200 bg-white"
      data-testid="template-studio-library"
    >
      <div className="border-b border-slate-200 px-5 py-5">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
          Section Library
        </p>
        <h2 className="mt-2 text-lg font-semibold text-slate-900">Reusable building blocks</h2>
        <p className="mt-1 text-sm text-slate-500">
          Pick an imported, AI, or reusable section and place it anywhere on the canvas.
        </p>
      </div>
      <div className="flex-1 overflow-auto px-4 py-4">
        <div className="space-y-3">
          {librarySections.map((section) => (
            <LibraryCard
              key={section.id}
              section={section}
              isActive={selectedSectionId === section.id}
              onSelect={onSelectSection}
            />
          ))}
          {!librarySections.length ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500">
              Reusable sections, imported fragments, and AI blocks will appear here.
            </div>
          ) : null}
        </div>
      </div>
    </aside>
  );
}
