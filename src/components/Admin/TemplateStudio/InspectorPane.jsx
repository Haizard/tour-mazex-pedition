import React from "react";

import BindingInspector from "./BindingInspector.jsx";
import { INSPECTOR_TABS, createStudioSectionDraft } from "./studioTypes.js";

export default function InspectorPane({
  selectedTab = "content",
  selectedSection,
  bindingSuggestions = [],
  onRequestBindingSuggestions,
  onSelectTab,
  onUpdateSection,
}) {
  const section = createStudioSectionDraft(selectedSection);
  const content = section.content || {};
  const styles = section.styles || {};

  const handlePatch = (patch) => onUpdateSection?.(section.id, patch);

  return (
    <aside
      className="flex h-full min-h-0 w-full max-w-[21rem] flex-col border-l border-slate-200 bg-white"
      data-testid="template-studio-inspector"
    >
      <div className="border-b border-slate-200 px-5 py-5">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
          Inspector
        </p>
        <h2 className="mt-2 text-lg font-semibold text-slate-900">{section.label}</h2>
        <p className="mt-1 text-sm text-slate-500">
          Source: <span className="font-medium text-slate-700">{section.sourceType}</span>
        </p>
      </div>
      <div className="border-b border-slate-200 px-4 py-3">
        <div className="grid grid-cols-2 gap-2">
          {INSPECTOR_TABS.map((tab) => {
            const isActive = tab.id === selectedTab;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onSelectTab?.(tab.id)}
                className={`rounded-xl px-3 py-2 text-sm font-medium transition ${
                  isActive
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>
      <div className="flex-1 overflow-auto px-5 py-5">
        {selectedTab === "binding" ? (
          <BindingInspector
            section={section}
            suggestions={bindingSuggestions}
            onRequestSuggestions={onRequestBindingSuggestions}
          />
        ) : selectedTab === "content" ? (
          <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Section Label</span>
              <input
                type="text"
                value={section.label || ""}
                onChange={(event) => handlePatch({ label: event.target.value })}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Headline</span>
              <input
                type="text"
                value={content.title || ""}
                onChange={(event) => handlePatch({ content: { title: event.target.value } })}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Body / Summary</span>
              <textarea
                rows={6}
                value={content.body || content.description || section.summary || ""}
                onChange={(event) =>
                  handlePatch({
                    summary: event.target.value,
                    content: {
                      body: event.target.value,
                    },
                  })
                }
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
              />
            </label>
          </div>
        ) : selectedTab === "style" ? (
          <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Accent Color</span>
              <input
                type="text"
                value={styles.accentColor || ""}
                onChange={(event) => handlePatch({ styles: { accentColor: event.target.value } })}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                placeholder="#0f766e"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Custom CSS</span>
              <textarea
                rows={8}
                value={section.customCss || ""}
                onChange={(event) => handlePatch({ customCss: event.target.value })}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 font-mono text-xs text-slate-900"
                placeholder=".section { padding-block: 72px; }"
              />
            </label>
          </div>
        ) : selectedTab === "advanced" ? (
          <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            <div className="rounded-xl bg-white px-3 py-3">
              <span className="font-semibold text-slate-800">Source type:</span> {section.sourceType}
            </div>
            <div className="rounded-xl bg-white px-3 py-3">
              <span className="font-semibold text-slate-800">Section id:</span> {section.id}
            </div>
          </div>
        ) : selectedTab === "responsive" ? (
          <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            <p>
              Responsive overrides will expand here. This section already supports shared canvas ordering and saved reusable variants.
            </p>
          </div>
        ) : (
          <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Content Summary
              </p>
              <p className="mt-2 text-sm text-slate-700">{section.summary}</p>
            </div>
            <div className="grid gap-3 text-sm text-slate-600">
              <div className="rounded-xl bg-white px-3 py-3">
                <span className="font-semibold text-slate-800">Type:</span> {section.type}
              </div>
              <div className="rounded-xl bg-white px-3 py-3">
                <span className="font-semibold text-slate-800">Binding:</span> Open the Binding tab to connect this block to platform data
              </div>
              <div className="rounded-xl bg-white px-3 py-3">
                <span className="font-semibold text-slate-800">Styles:</span> Local overrides and theme tokens will appear here
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
