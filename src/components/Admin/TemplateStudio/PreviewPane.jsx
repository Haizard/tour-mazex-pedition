import React from "react";

import { buildPreviewPageModel } from "./previewUtils.js";

function PreviewSection({ section }) {
  const title = section.content?.title || section.label;
  const body = section.content?.body || section.content?.description || section.summary || "";

  return (
    <section
      className="rounded-[2rem] border border-slate-200 px-8 py-8 shadow-sm"
      style={section.presentation.containerStyle}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span
          className="rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em]"
          style={section.presentation.badgeStyle}
        >
          {section.type || "section"}
        </span>
        {section.sourceType ? (
          <span
            className="rounded-full border px-3 py-1 text-[11px] font-semibold"
            style={section.presentation.badgeStyle}
          >
            {section.sourceType}
          </span>
        ) : null}
      </div>
      <h2 className="mt-5 font-semibold" style={section.presentation.headlineStyle}>
        {title}
      </h2>
      {body ? (
        <p className="mt-3 max-w-3xl leading-7" style={section.presentation.bodyStyle}>
          {body}
        </p>
      ) : null}
    </section>
  );
}

export default function PreviewPane({
  page,
  viewport = "desktop",
  onClose,
  onPublish,
}) {
  const preview = buildPreviewPageModel({ page, viewport });

  return (
    <section
      className="flex min-h-0 flex-1 flex-col bg-slate-950/95 text-white"
      data-testid="template-studio-preview"
    >
      <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
            Publish Preview
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">{preview.pageName}</h2>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-medium text-slate-300">
            <span className="rounded-full bg-white/10 px-3 py-1">{preview.slug}</span>
            <span className="rounded-full bg-white/10 px-3 py-1">{preview.status}</span>
            <span className="rounded-full bg-white/10 px-3 py-1">{preview.viewport}</span>
            <span className="rounded-full bg-white/10 px-3 py-1">
              {preview.sections.length} sections
            </span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            className="rounded-xl border border-white/20 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
            onClick={onClose}
          >
            Back to Studio
          </button>
          <button
            type="button"
            className="rounded-xl border border-emerald-300 bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
            onClick={onPublish}
          >
            Publish This Page
          </button>
        </div>
      </div>
      <div
        className="flex-1 overflow-auto px-6 py-6"
        style={{ backgroundColor: preview.theme.canvasBackground }}
      >
        <div
          className="mx-auto flex flex-col gap-6"
          style={{ maxWidth: preview.theme.contentWidth }}
        >
          {preview.sections.length ? (
            preview.sections.map((section) => (
              <PreviewSection key={section.id} section={section} />
            ))
          ) : (
            <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white px-8 py-14 text-center text-slate-500">
              No sections in this page yet. Add or import sections before previewing the publish layout.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
