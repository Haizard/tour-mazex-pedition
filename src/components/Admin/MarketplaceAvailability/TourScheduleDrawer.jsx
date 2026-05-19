import React, { useState } from "react";

import { buildDrawerDraft } from "./availabilityManagerState";

const emptyDraft = buildDrawerDraft({});

const TourScheduleDrawer = ({
  isOpen,
  schedule,
  onClose,
  onAddEntry,
  onUpdateEntry,
  onDeleteEntry,
}) => {
  const [draft, setDraft] = useState(emptyDraft);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-y-0 right-0 z-[70] w-full max-w-2xl border-l border-zinc-200 bg-white shadow-2xl">
      <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-5">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-zinc-500">Tour Schedule</p>
          <h3 className="mt-2 text-2xl font-black tracking-tight text-zinc-950">
            {schedule?.tour?.title || "Availability"}
          </h3>
        </div>
        <button type="button" onClick={onClose} className="rounded-full border border-zinc-300 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-zinc-700">
          Close
        </button>
      </div>

      <div className="h-[calc(100%-88px)] overflow-y-auto px-6 py-6">
        <div className="rounded-3xl border border-zinc-200 bg-zinc-50 p-5">
          <p className="text-sm font-black text-zinc-950">Add departure</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <input type="date" value={draft.date} onChange={(e) => setDraft((c) => ({ ...c, date: e.target.value }))} className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-900" />
            <select value={draft.status} onChange={(e) => setDraft((c) => ({ ...c, status: e.target.value }))} className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-900">
              <option value="available">Available</option>
              <option value="limited">Limited</option>
              <option value="unavailable">Unavailable</option>
              <option value="on-request">On Request</option>
            </select>
            <input type="number" value={draft.remainingSpots} onChange={(e) => setDraft((c) => ({ ...c, remainingSpots: e.target.value }))} placeholder="Remaining spots" className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-900" />
            <label className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-800">
              <input type="checkbox" checked={draft.published} onChange={(e) => setDraft((c) => ({ ...c, published: e.target.checked }))} />
              Published
            </label>
            <input value={draft.note} onChange={(e) => setDraft((c) => ({ ...c, note: e.target.value }))} placeholder="Operator note" className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-900 md:col-span-2" />
          </div>
          <button
            type="button"
            onClick={() => {
              onAddEntry?.(draft);
              setDraft(emptyDraft);
            }}
            className="mt-4 rounded-full bg-zinc-950 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-white"
          >
            Add departure
          </button>
        </div>

        <div className="mt-6 space-y-3">
          {(schedule?.entries || []).map((entry) => {
            const entryDraft = buildDrawerDraft(entry);
            return (
              <div key={entry.date} className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
                <div className="grid gap-3 md:grid-cols-2">
                  <input
                    type="date"
                    defaultValue={entryDraft.date}
                    onBlur={(e) => onUpdateEntry?.(entryDraft.date, { date: e.target.value })}
                    className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-semibold text-zinc-900"
                  />
                  <select
                    defaultValue={entryDraft.status}
                    onChange={(e) => onUpdateEntry?.(entryDraft.date, { status: e.target.value })}
                    className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-semibold text-zinc-900"
                  >
                    <option value="available">Available</option>
                    <option value="limited">Limited</option>
                    <option value="unavailable">Unavailable</option>
                    <option value="on-request">On Request</option>
                  </select>
                  <input
                    type="number"
                    defaultValue={entryDraft.remainingSpots}
                    onBlur={(e) => onUpdateEntry?.(entryDraft.date, { remainingSpots: e.target.value })}
                    className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-semibold text-zinc-900"
                  />
                  <label className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-semibold text-zinc-800">
                    <input
                      type="checkbox"
                      defaultChecked={entryDraft.published}
                      onChange={(e) => onUpdateEntry?.(entryDraft.date, { published: e.target.checked })}
                    />
                    Published
                  </label>
                  <input
                    defaultValue={entryDraft.note}
                    onBlur={(e) => onUpdateEntry?.(entryDraft.date, { note: e.target.value })}
                    placeholder="Operator note"
                    className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-semibold text-zinc-900 md:col-span-2"
                  />
                </div>
                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={() => onDeleteEntry?.(entryDraft.date)}
                    className="rounded-full border border-rose-300 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-rose-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TourScheduleDrawer;
