import React from "react";
import { compareSnapshots } from "./snapshotDiffUtils.js";

export default function VersionManagerPane({
  pageName = "Untitled Page",
  snapshots = [],
  selectedSnapshotId = "",
  comparisonSnapshotId = "",
  onCreateSnapshot,
  onRestoreSnapshot,
  onRenameSnapshot,
  onDeleteSnapshot,
  onSelectComparisonSnapshot,
}) {
  const selectedSnapshot = snapshots.find((snapshot) => snapshot.id === selectedSnapshotId) || null;
  const comparisonSnapshot =
    snapshots.find((snapshot) => snapshot.id === comparisonSnapshotId) || null;
  const diff =
    selectedSnapshot && comparisonSnapshot
      ? compareSnapshots({
          leftSnapshot: comparisonSnapshot,
          rightSnapshot: selectedSnapshot,
        })
      : null;

  return (
    <aside
      className="flex h-full min-h-0 w-full shrink-0 md:basis-[21rem] xl:basis-[23rem] 2xl:basis-[27rem] flex-col border-r border-slate-200 bg-white"
      data-testid="template-studio-versions"
    >
      <div className="border-b border-slate-200 px-5 py-5">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
          Version Manager
        </p>
        <h2 className="mt-2 text-lg font-semibold text-slate-900">{pageName} Drafts</h2>
        <p className="mt-1 text-sm text-slate-500">
          Save milestone snapshots, restore earlier canvas states, and keep your imported or AI-assisted page evolution organized.
        </p>
        <button
          type="button"
          className="mt-4 rounded-xl border border-slate-900 bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
          onClick={onCreateSnapshot}
        >
          Save New Snapshot
        </button>
      </div>
      <div className="flex-1 overflow-auto px-4 py-4">
        <div className="mb-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Compare Snapshots
          </p>
          <div className="mt-3 grid gap-3">
            <label className="block">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Base Snapshot
              </span>
              <select
                value={comparisonSnapshotId}
                onChange={(event) => onSelectComparisonSnapshot?.(event.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
              >
                <option value="">Choose a base version</option>
                {snapshots
                  .filter((snapshot) => snapshot.id !== selectedSnapshotId)
                  .map((snapshot) => (
                    <option key={snapshot.id} value={snapshot.id}>
                      {snapshot.name}
                    </option>
                  ))}
              </select>
            </label>
            {diff ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex flex-wrap gap-2 text-[11px] font-semibold text-slate-600">
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700">
                    + {diff.summary.added} added
                  </span>
                  <span className="rounded-full bg-rose-50 px-2.5 py-1 text-rose-700">
                    - {diff.summary.removed} removed
                  </span>
                  <span className="rounded-full bg-amber-50 px-2.5 py-1 text-amber-700">
                    ~ {diff.summary.changed} changed
                  </span>
                </div>
                <div className="mt-3 space-y-2">
                  {diff.rows
                    .filter((row) => row.changeType !== "unchanged")
                    .map((row) => (
                      <div
                        key={row.sectionId}
                        className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-xs text-slate-600"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="font-semibold text-slate-900">{row.label}</span>
                          <span
                            className={`rounded-full px-2 py-1 font-semibold uppercase tracking-wide ${
                              row.changeType === "added"
                                ? "bg-emerald-100 text-emerald-700"
                                : row.changeType === "removed"
                                  ? "bg-rose-100 text-rose-700"
                                  : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {row.changeType}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-4 text-xs text-slate-500">
                Pick a base snapshot to see what changed compared with the active one.
              </div>
            )}
          </div>
        </div>
        {snapshots.length ? (
          <div className="space-y-3">
            {snapshots.map((snapshot) => {
              const isSelected = snapshot.id === selectedSnapshotId;

              return (
                <div
                  key={snapshot.id}
                  className={`rounded-2xl border p-4 transition ${
                    isSelected
                      ? "border-emerald-300 bg-emerald-50"
                      : "border-slate-200 bg-slate-50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <input
                        type="text"
                        value={snapshot.name || ""}
                        onChange={(event) => onRenameSnapshot?.(snapshot.id, event.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900"
                      />
                      <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-medium text-slate-500">
                        <span className="rounded-full bg-white px-2.5 py-1">
                          {snapshot.sections?.length || 0} sections
                        </span>
                        <span className="rounded-full bg-white px-2.5 py-1">
                          {snapshot.viewport || "desktop"}
                        </span>
                        <span className="rounded-full bg-white px-2.5 py-1">
                          {snapshot.createdAt ? new Date(snapshot.createdAt).toLocaleString() : "Draft"}
                        </span>
                      </div>
                    </div>
                    {isSelected ? (
                      <span className="rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                        Live
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                      onClick={() => onRestoreSnapshot?.(snapshot.id)}
                    >
                      Restore
                    </button>
                    <button
                      type="button"
                      className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                      onClick={() => onDeleteSnapshot?.(snapshot.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500">
            No saved snapshots yet. Save a draft milestone before trying a bigger layout or style change.
          </div>
        )}
      </div>
    </aside>
  );
}
