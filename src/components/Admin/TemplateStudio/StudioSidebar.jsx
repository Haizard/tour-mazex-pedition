import React from "react";

import { STUDIO_SIDEBAR_GROUPS } from "./studioTypes.js";

export default function StudioSidebar({
  groups = STUDIO_SIDEBAR_GROUPS,
  activeGroup = "pages",
  onSelectGroup,
}) {
  return (
    <aside
      className="flex h-full min-h-0 w-full shrink-0 md:basis-[16rem] md:max-w-[16rem] xl:basis-[17rem] xl:max-w-[17rem] 2xl:basis-[18rem] 2xl:max-w-[18rem] flex-col overflow-hidden border-r border-white/10 bg-[#08090d] text-slate-100"
      data-testid="template-studio-sidebar"
    >
      <div className="border-b border-white/10 px-5 py-5">
        <p className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-500">
          Studio Navigation
        </p>
        <p className="mt-3 text-sm leading-6 text-slate-400">
          Move between page structure, reusable blocks, imports, and version history without leaving the builder.
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
              className={`mb-4 w-full rounded-[1.35rem] border px-3 py-3 text-left transition ${
                isActive
                  ? "border-cyan-400/40 bg-gradient-to-br from-cyan-400/12 via-sky-400/10 to-emerald-400/8 shadow-[0_14px_40px_rgba(14,165,233,0.12)]"
                  : "border-white/10 bg-white/[0.03] hover:bg-white/[0.05]"
              }`}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-white">{group.label}</h2>
                {isActive ? (
                  <span className="rounded-full bg-cyan-300/20 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-cyan-100">
                    Active
                  </span>
                ) : null}
              </div>
              <ul className="mt-3 space-y-2 text-sm text-slate-300">
                {group.items.map((item) => (
                  <li key={item} className="rounded-xl border border-white/5 bg-black/20 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
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
