import React from "react";

import { STUDIO_SIDEBAR_GROUPS } from "./studioTypes.js";

export default function StudioSidebar({
  groups = STUDIO_SIDEBAR_GROUPS,
  activeGroup = "pages",
  onSelectGroup,
}) {
  return (
    <aside
      className="flex h-full min-h-0 w-full max-w-[18rem] flex-col border-r border-slate-200 bg-slate-950 text-slate-100"
      data-testid="template-studio-sidebar"
    >
      <div className="border-b border-white/10 px-5 py-5">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
          Studio Library
        </p>
        <p className="mt-2 text-sm text-slate-300">
          Browse pages, reusable sections, imports, assets, and CMS-linked content sources.
        </p>
      </div>
      <div className="flex-1 overflow-auto px-3 py-4">
        {groups.map((group) => {
          const isActive = group.id === activeGroup;
          return (
            <button
              key={group.id}
              type="button"
              onClick={() => onSelectGroup?.(group.id)}
              className={`mb-4 w-full rounded-2xl border px-3 py-3 text-left ${
                isActive
                  ? "border-emerald-400/50 bg-emerald-400/10"
                  : "border-white/10 bg-white/5"
              }`}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-white">{group.label}</h2>
                {isActive ? (
                  <span className="rounded-full bg-emerald-300/20 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-200">
                    Active
                  </span>
                ) : null}
              </div>
              <ul className="mt-3 space-y-2 text-sm text-slate-300">
                {group.items.map((item) => (
                  <li key={item} className="rounded-xl bg-black/20 px-3 py-2">
                    {item}
                  </li>
                ))}
              </ul>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
