import React from "react";

const actionButtonClass =
  "rounded-full border border-zinc-300 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-zinc-700 transition hover:border-zinc-950 hover:text-zinc-950";

const AvailabilityBulkActionsBar = ({ selectionCount = 0, onAction }) => (
  <div className="flex flex-wrap items-center gap-3 rounded-3xl border border-zinc-200 bg-white px-5 py-4 shadow-sm">
    <div className="rounded-full bg-zinc-950 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-white">
      {selectionCount} selected
    </div>
    <button type="button" className={actionButtonClass} onClick={() => onAction?.("set-status", { status: "limited" })}>
      Mark Limited
    </button>
    <button type="button" className={actionButtonClass} onClick={() => onAction?.("set-status", { status: "unavailable" })}>
      Mark Sold Out
    </button>
    <button type="button" className={actionButtonClass} onClick={() => onAction?.("set-published", { published: true })}>
      Publish
    </button>
    <button type="button" className={actionButtonClass} onClick={() => onAction?.("set-published", { published: false })}>
      Pause
    </button>
    <button type="button" className={actionButtonClass} onClick={() => onAction?.("adjust-spots", { delta: 1 })}>
      Add 1 Seat
    </button>
  </div>
);

export default AvailabilityBulkActionsBar;
