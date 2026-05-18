import React, { useMemo } from "react";

import { createDropTargets, resolveReorderDropIndex } from "./canvasDnd.js";
import { createStudioPageDraft } from "./studioTypes.js";
import CanvasSectionCard from "./CanvasSectionCard.jsx";
import { createStudioCanvasState } from "./studioReducers.js";

function InsertButton({ label, onClick }) {
  return (
    <button
      type="button"
      className="w-full rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-left text-sm font-medium text-slate-500 transition hover:border-slate-400 hover:bg-white"
      onClick={onClick}
    >
      + {label}
    </button>
  );
}

export default function CanvasPane({
  page,
  state,
  selectedSectionId,
  selectedLibrarySection,
  onSelectSection,
  onInsertSection,
  onReorderSection,
  onSectionAction,
}) {
  const pageDraft = createStudioPageDraft(page);
  const canvasState = useMemo(
    () => state ?? createStudioCanvasState({ sections: pageDraft.sections, selectedSectionId }),
    [pageDraft.sections, selectedSectionId, state],
  );

  const sections = canvasState.sections;
  const dropTargets = useMemo(() => createDropTargets(sections), [sections]);
  const [draggedSectionId, setDraggedSectionId] = React.useState(null);
  const [activeDropTargetId, setActiveDropTargetId] = React.useState(null);

  const clearDragState = React.useCallback(() => {
    setDraggedSectionId(null);
    setActiveDropTargetId(null);
  }, []);

  const handleDrop = (target) => {
    if (!draggedSectionId) {
      return;
    }

    const toIndex = resolveReorderDropIndex({
      sections,
      draggedSectionId,
      rawTargetIndex: target.toIndex,
    });

    if (toIndex != null) {
      onReorderSection?.(draggedSectionId, toIndex);
    }

    clearDragState();
  };

  const renderDropZone = (target, label = "Drop section here") => {
    const isActive = activeDropTargetId === target.id;

    return (
      <div
        key={target.id}
        onDragOver={(event) => {
          event.preventDefault();
          setActiveDropTargetId(target.id);
        }}
        onDragLeave={() => {
          if (activeDropTargetId === target.id) {
            setActiveDropTargetId(null);
          }
        }}
        onDrop={(event) => {
          event.preventDefault();
          handleDrop(target);
        }}
      >
        {draggedSectionId ? (
          <div
            className={`rounded-2xl border-2 border-dashed px-4 py-3 text-sm font-semibold transition ${
              isActive
                ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                : "border-slate-300 bg-slate-50 text-slate-400"
            }`}
          >
            {isActive ? "Release to reorder section" : label}
          </div>
        ) : (
          <InsertButton
            label="Insert section here"
            onClick={() =>
              onInsertSection?.({
                position: target.position,
                targetSectionId: target.targetSectionId,
              })
            }
          />
        )}
      </div>
    );
  };

  return (
    <main className="flex min-h-0 flex-1 flex-col bg-[#eef2f7]" data-testid="template-studio-canvas">
      <div className="flex-1 overflow-auto p-6">
        <div className="mx-auto flex min-h-[42rem] w-full max-w-5xl flex-col gap-4 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_30px_80px_rgba(15,23,42,0.12)]">
          <div className="flex items-center justify-between rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                Page Canvas
              </p>
              <h2 className="mt-1 text-xl font-semibold text-slate-900">{pageDraft.pageName}</h2>
            </div>
            <div className="flex items-center gap-3">
              {selectedLibrarySection ? (
                <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                  Ready to insert: {selectedLibrarySection.label}
                </span>
              ) : null}
              <div className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                {pageDraft.status}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {!sections.length ? (
              <InsertButton
                label="Insert first section"
                onClick={() => onInsertSection?.({ position: "below", targetSectionId: null })}
              />
            ) : null}

            {sections.map((section, index) => (
              <div key={section.id} className="space-y-3">
                {renderDropZone(dropTargets[index], "Drop section before this block")}
                <div
                  draggable
                  onDragStart={() => {
                    setDraggedSectionId(section.id);
                    onSelectSection?.(section.id);
                  }}
                  onDragEnd={clearDragState}
                  onClick={() => onSelectSection?.(section.id)}
                  onKeyDown={undefined}
                  role="presentation"
                >
                  <CanvasSectionCard
                    section={section}
                    isSelected={canvasState.selectedSectionId === section.id}
                    onAction={(actionId) => onSectionAction?.(actionId, section, index)}
                  />
                </div>
              </div>
            ))}

            {sections.length ? renderDropZone(dropTargets[dropTargets.length - 1], "Drop section at end") : null}
          </div>
        </div>
      </div>
    </main>
  );
}
