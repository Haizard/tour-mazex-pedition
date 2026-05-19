import React from "react";

import { STUDIO_TOPBAR_ACTIONS } from "./studioTypes.js";

const toneClasses = {
  default: "border border-white/10 bg-white/5 text-slate-100 hover:bg-white/10",
  subtle: "border border-transparent bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white",
  accent: "border border-emerald-400/40 bg-emerald-400/12 text-emerald-200 hover:bg-emerald-400/20",
  strong: "border border-fuchsia-300/40 bg-gradient-to-r from-fuchsia-400 via-violet-400 to-indigo-400 text-slate-950 hover:opacity-95",
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
      className="flex flex-col gap-4 border-b border-white/10 bg-[#08090d] px-6 py-4 text-white shadow-[0_18px_40px_rgba(2,6,23,0.45)]"
      data-testid="template-studio-topbar"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-black uppercase tracking-[0.32em] text-slate-500">
            Template Studio
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-black tracking-tight text-white">{pageName}</h1>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-slate-300">
              {pageType}
            </span>
            <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-emerald-200">
              {status}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-2">
          {STUDIO_TOPBAR_ACTIONS.map((action) => (
            <button
              key={action.id}
              type="button"
              className={`rounded-xl px-4 py-2 text-sm font-bold transition ${toneClasses[action.tone]}`}
              onClick={() => onAction?.(action.id)}
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3 text-sm text-slate-400">
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-300">
          Import And Bind
        </span>
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-300">
          Canvas Composition
        </span>
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-300">
          CMS Connections
        </span>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-slate-300">
            <span className="uppercase tracking-[0.18em] text-slate-500">Snapshots</span>
            <span className="rounded-full bg-white/10 px-2 py-1 text-[11px] font-semibold text-white">
              {snapshots.length}
            </span>
            <button
              type="button"
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold text-white transition hover:bg-white/10"
              onClick={() => onAction?.("save-snapshot")}
            >
              Save Snapshot
            </button>
            <select
              value={selectedSnapshotId}
              onChange={(event) => onSnapshotChange?.(event.target.value)}
              className="rounded-full border border-white/10 bg-[#0f1117] px-3 py-1 text-[11px] font-semibold text-white"
            >
              <option value="">Current Draft</option>
              {snapshots.map((snapshot) => (
                <option key={snapshot.id} value={snapshot.id}>
                  {snapshot.name}
                </option>
              ))}
            </select>
            {latestSnapshot ? (
              <span className="hidden text-[11px] text-slate-500 lg:inline">
                Latest: {latestSnapshot.name}
              </span>
            ) : null}
            <button
              type="button"
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold text-white transition hover:bg-white/10"
              onClick={() => onAction?.("open-versions")}
            >
              Manage
            </button>
          </div>
          <div className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 p-1">
            {["desktop", "tablet", "mobile"].map((mode) => (
              <button
                key={mode}
                type="button"
                className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide transition ${
                  viewport === mode
                    ? "bg-white text-slate-950 shadow-sm"
                    : "text-slate-400 hover:text-white"
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
            className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={onUndo}
          >
            Undo
          </button>
          <button
            type="button"
            disabled={!canRedo}
            className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={onRedo}
          >
            Redo
          </button>
        </div>
      </div>
    </header>
  );
}
