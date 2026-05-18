/* eslint-disable react/prop-types */
import React from "react";
import { useLocation } from "react-router-dom";
import { getMediaUrl } from "../../services/api";
import { buildTenantScopedPath } from "../../utils/tenantRoutes.js";

const escapeHtml = (value = "") =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const sanitizeHtml = (value = "") =>
  String(value || "")
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/\son[a-z]+\s*=\s*"[^"]*"/gi, "")
    .replace(/\son[a-z]+\s*=\s*'[^']*'/gi, "")
    .replace(/javascript:/gi, "");

const applyTemplateVariables = (template = "", content = {}) => {
  const imageUrl = content.imageUrl ? getMediaUrl(content.imageUrl) : "";
  const values = {
    eyebrow: content.eyebrow,
    title: content.title,
    body: content.body,
    imageUrl,
    imageAlt: content.imageAlt || content.title,
    ctaLabel: content.ctaLabel,
    ctaHref: content.ctaHref,
  };

  return Object.entries(values).reduce(
    (html, [key, value]) => html.replaceAll(`{{${key}}}`, escapeHtml(value || "")),
    template
  );
};

const CustomHtmlSection = ({
  htmlTemplate = "",
  customCss = "",
  scopeClass = "",
  ...content
}) => {
  const location = useLocation();
  const scopedContent = React.useMemo(
    () => ({
      ...content,
      ctaHref: buildTenantScopedPath(content.ctaHref || "", location.pathname),
    }),
    [content, location.pathname],
  );
  const renderedHtml = React.useMemo(
    () => sanitizeHtml(applyTemplateVariables(htmlTemplate, scopedContent)),
    [htmlTemplate, scopedContent]
  );

  return (
    <section className={scopeClass || undefined} suppressHydrationWarning>
      {customCss ? <style suppressHydrationWarning>{customCss}</style> : null}
      <div dangerouslySetInnerHTML={{ __html: renderedHtml }} suppressHydrationWarning />
    </section>
  );
};

export default CustomHtmlSection;
