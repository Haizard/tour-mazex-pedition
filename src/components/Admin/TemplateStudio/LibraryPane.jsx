import React from "react";

import { createStudioSectionNode } from "./studioReducers.js";

function LibraryCard({ section, isActive, onSelect, onDelete }) {
  const canDelete = Boolean(section.sourceMeta?.reusableTemplateId);

  return (
    <div
      className={`w-full rounded-[1.4rem] border px-4 py-4 transition ${
        isActive
          ? "border-cyan-300 bg-cyan-50 shadow-[0_12px_30px_rgba(14,165,233,0.12)]"
          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
      }`}
    >
      <button type="button" className="w-full text-left" onClick={() => onSelect?.(section)}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">
              {section.type}
            </p>
            <h3 className="mt-2 text-sm font-black text-slate-900">{section.label}</h3>
          </div>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-slate-600">
            {section.sourceType}
          </span>
        </div>
        <p className="mt-2 text-sm leading-6 text-slate-600">{section.summary}</p>
      </button>
      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          {section.scope ? (
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
              {section.scope}
            </span>
          ) : null}
          {(section.tags || []).slice(0, 2).map((tag) => (
            <span key={tag} className="rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-slate-500">
              {tag}
            </span>
          ))}
        </div>
        {canDelete ? (
          <button
            type="button"
            className="rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-[11px] font-semibold text-rose-700 transition hover:bg-rose-100"
            onClick={() => onDelete?.(section)}
          >
            Delete
          </button>
        ) : null}
      </div>
    </div>
  );
}

export default function LibraryPane({
  sections = [],
  selectedSectionId,
  selectedCanvasSection,
  onSelectSection,
  onInsertSection,
  onReplaceSection,
  onDeleteSection,
}) {
  const librarySections = sections.map((section) => createStudioSectionNode(section));

  return (
    <aside
      className="flex h-full min-h-0 w-full shrink-0 md:basis-[20rem] xl:basis-[22rem] 2xl:basis-[25rem] flex-col border-r border-white/10 bg-[#f8fafc]"
      data-testid="template-studio-library"
    >
      <div className="border-b border-slate-200 px-5 py-5">
        <p className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-500">
          Section Library
        </p>
        <h2 className="mt-2 text-lg font-black tracking-tight text-slate-900">Reusable building blocks</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Pick an imported, AI, or reusable section and place it anywhere on the canvas.
        </p>
        {selectedCanvasSection ? (
          <div className="mt-4 rounded-[1.35rem] border border-cyan-200 bg-cyan-50 px-4 py-3 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-700">
              Selected Canvas Section
            </p>
            <p className="mt-1 text-sm font-black text-cyan-950">{selectedCanvasSection.label}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={!selectedSectionId}
                className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                onClick={() => {
                  const section = librarySections.find((item) => item.id === selectedSectionId);
                  if (section) {
                    onInsertSection?.(section, selectedCanvasSection.id);
                  }
                }}
              >
                Insert Below
              </button>
              <button
                type="button"
                disabled={!selectedSectionId}
                className="rounded-xl border border-sky-200 bg-sky-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-50"
                onClick={() => {
                  const section = librarySections.find((item) => item.id === selectedSectionId);
                  if (section) {
                    onReplaceSection?.(section, selectedCanvasSection.id);
                  }
                }}
              >
                Replace Selected
              </button>
            </div>
          </div>
        ) : null}
      </div>
      <div className="flex-1 overflow-auto px-4 py-4">
        <div className="space-y-3">
          {librarySections.map((section) => (
            <LibraryCard
              key={section.id}
              section={section}
              isActive={selectedSectionId === section.id}
              onSelect={onSelectSection}
              onDelete={onDeleteSection}
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
