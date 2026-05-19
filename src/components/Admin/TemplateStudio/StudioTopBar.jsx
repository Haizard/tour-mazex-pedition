import React from "react";

import { STUDIO_TOPBAR_ACTIONS } from "./studioTypes.js";

const toneClasses = {
  default: "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50",
  subtle: "border border-transparent bg-slate-100 text-slate-700 hover:bg-slate-200",
  accent: "border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100",
  strong: "border border-slate-900 bg-slate-900 text-white hover:bg-slate-800",
};

export default function StudioTopBar({
  pageName = "Untitled Page",
  pageType = "custom",
  status = "Draft",
  viewport = "desktop",
  snapshots = [],
  selectedSnapshotId = "",
  canUndo = false,
  canRedo = false,
  onAction,
  onUndo,
  onRedo,
  onViewportChange,
  onSnapshotChange,
}) {
  const latestSnapshot = snapshots[0] || null;

  return (
    <header
      className="flex flex-col gap-4 border-b border-slate-200 bg-white/90 px-6 py-4 backdrop-blur"
      data-testid="template-studio-topbar"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
            Template Studio
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold text-slate-900">{pageName}</h1>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium uppercase tracking-wide text-slate-600">
              {pageType}
            </span>
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800">
              {status}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {STUDIO_TOPBAR_ACTIONS.map((action) => (
            <button
              key={action.id}
              type="button"
              className={`rounded-xl px-4 py-2 text-sm font-medium transition ${toneClasses[action.tone]}`}
              onClick={() => onAction?.(action.id)}
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
        <span className="rounded-full bg-slate-100 px-3 py-1">Import and Bind</span>
        <span className="rounded-full bg-slate-100 px-3 py-1">Canvas Composition</span>
        <span className="rounded-full bg-slate-100 px-3 py-1">CMS Connections</span>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600">
            <span className="uppercase tracking-wide text-slate-400">Snapshots</span>
            <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-700">
              {snapshots.length}
            </span>
            <button
              type="button"
              className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-100"
              onClick={() => onAction?.("save-snapshot")}
            >
              Save Snapshot
            </button>
            <select
              value={selectedSnapshotId}
              onChange={(event) => onSnapshotChange?.(event.target.value)}
              className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-700"
            >
              <option value="">Current Draft</option>
              {snapshots.map((snapshot) => (
                <option key={snapshot.id} value={snapshot.id}>
                  {snapshot.name}
                </option>
              ))}
            </select>
            {latestSnapshot ? (
              <span className="hidden text-[11px] text-slate-400 lg:inline">
                Latest: {latestSnapshot.name}
              </span>
            ) : null}
          </div>
          <div className="flex items-center gap-1 rounded-full bg-slate-100 p-1">
            {["desktop", "tablet", "mobile"].map((mode) => (
              <button
                key={mode}
                type="button"
                className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide transition ${
                  viewport === mode
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
                onClick={() => onViewportChange?.(mode)}
              >
                {mode}
              </button>
            ))}
          </div>
          <button
            type="button"
            disabled={!canUndo}
            className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={onUndo}
          >
            Undo
          </button>
          <button
            type="button"
            disabled={!canRedo}
            className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={onRedo}
          >
            Redo
          </button>
        </div>
      </div>
    </header>
  );
}
