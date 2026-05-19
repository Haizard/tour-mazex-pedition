import React from "react";

import BindingInspector from "./BindingInspector.jsx";
import { findStylePreset, STYLE_PRESETS } from "./stylePresets.js";
import { INSPECTOR_TABS, createStudioSectionDraft } from "./studioTypes.js";

const RESPONSIVE_BREAKPOINTS = [
  { id: "mobile", label: "Mobile" },
  { id: "tablet", label: "Tablet" },
  { id: "desktop", label: "Desktop" },
];

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
  const responsive = section.responsive || {};

  const handlePatch = (patch) => onUpdateSection?.(section.id, patch);
  const handleResponsivePatch = (device, key, value) =>
    handlePatch({
      responsive: {
        ...responsive,
        [device]: {
          ...(responsive[device] || {}),
          [key]: value,
        },
      },
    });
  const handleApplyPreset = (presetId) => {
    const preset = findStylePreset(presetId);
    if (!preset) {
      return;
    }
    handlePatch({ styles: preset.styles });
  };

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
            bindings={section.bindings || []}
            suggestions={bindingSuggestions}
            onRequestSuggestions={onRequestBindingSuggestions}
            onChangeBindings={(bindings) => handlePatch({ bindings })}
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
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Quick Presets
              </p>
              <div className="mt-3 grid gap-3">
                {STYLE_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleApplyPreset(preset.id)}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left transition hover:border-slate-300 hover:bg-slate-50"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-semibold text-slate-900">{preset.label}</span>
                      <span
                        className="h-4 w-4 rounded-full border border-white shadow-sm"
                        style={{ backgroundColor: preset.styles.accentColor }}
                      />
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{preset.description}</p>
                  </button>
                ))}
              </div>
            </div>
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
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Background Color</span>
              <input
                type="text"
                value={styles.backgroundColor || ""}
                onChange={(event) => handlePatch({ styles: { backgroundColor: event.target.value } })}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                placeholder="#f8fafc"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Text Color</span>
              <input
                type="text"
                value={styles.textColor || ""}
                onChange={(event) => handlePatch({ styles: { textColor: event.target.value } })}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                placeholder="#0f172a"
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Padding Y</span>
                <input
                  type="text"
                  value={styles.paddingY || ""}
                  onChange={(event) => handlePatch({ styles: { paddingY: event.target.value } })}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                  placeholder="72px"
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Gap</span>
                <input
                  type="text"
                  value={styles.gap || ""}
                  onChange={(event) => handlePatch({ styles: { gap: event.target.value } })}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                  placeholder="24px"
                />
              </label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Radius</span>
                <input
                  type="text"
                  value={styles.radius || ""}
                  onChange={(event) => handlePatch({ styles: { radius: event.target.value } })}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                  placeholder="32px"
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Max Width</span>
                <input
                  type="text"
                  value={styles.maxWidth || ""}
                  onChange={(event) => handlePatch({ styles: { maxWidth: event.target.value } })}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                  placeholder="1200px"
                />
              </label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Headline Size</span>
                <input
                  type="text"
                  value={styles.headlineSize || ""}
                  onChange={(event) => handlePatch({ styles: { headlineSize: event.target.value } })}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                  placeholder="2.2rem"
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Body Size</span>
                <input
                  type="text"
                  value={styles.bodySize || ""}
                  onChange={(event) => handlePatch({ styles: { bodySize: event.target.value } })}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                  placeholder="1rem"
                />
              </label>
            </div>
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Font Family</span>
              <input
                type="text"
                value={styles.fontFamily || ""}
                onChange={(event) => handlePatch({ styles: { fontFamily: event.target.value } })}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                placeholder="Georgia, serif"
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
            <p className="text-sm text-slate-600">
              Tune how this section compresses across breakpoints without losing the imported or reusable layout.
            </p>
            {RESPONSIVE_BREAKPOINTS.map((device) => {
              const deviceSettings = responsive[device.id] || {};
              return (
                <div key={device.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-sm font-semibold text-slate-900">{device.label}</h3>
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      {device.id}
                    </span>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <label className="block">
                      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Columns</span>
                      <input
                        type="text"
                        value={deviceSettings.columns || ""}
                        onChange={(event) => handleResponsivePatch(device.id, "columns", event.target.value)}
                        className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                        placeholder={device.id === "mobile" ? "1" : device.id === "tablet" ? "2" : "3"}
                      />
                    </label>
                    <label className="block">
                      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Padding Y</span>
                      <input
                        type="text"
                        value={deviceSettings.paddingY || ""}
                        onChange={(event) => handleResponsivePatch(device.id, "paddingY", event.target.value)}
                        className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                        placeholder={device.id === "mobile" ? "32px" : device.id === "tablet" ? "48px" : "72px"}
                      />
                    </label>
                    <label className="block">
                      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Gap</span>
                      <input
                        type="text"
                        value={deviceSettings.gap || ""}
                        onChange={(event) => handleResponsivePatch(device.id, "gap", event.target.value)}
                        className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                        placeholder="20px"
                      />
                    </label>
                    <label className="block">
                      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Align</span>
                      <select
                        value={deviceSettings.align || ""}
                        onChange={(event) => handleResponsivePatch(device.id, "align", event.target.value)}
                        className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                      >
                        <option value="">Inherit</option>
                        <option value="start">Start</option>
                        <option value="center">Center</option>
                        <option value="end">End</option>
                      </select>
                    </label>
                  </div>
                </div>
              );
            })}
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
