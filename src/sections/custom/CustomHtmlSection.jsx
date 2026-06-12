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

/** Tailwind-like container width presets applied as inline styles. */
const CONTAINER_WIDTH_MAP = {
  narrow: "max-w-3xl",
  standard: "max-w-6xl",
  wide: "max-w-7xl",
  full: "max-w-full",
};

/** Spacing preset multipliers applied as padding-top / padding-bottom. */
const SPACING_PRESET_MAP = {
  compact: { py: "1.5rem" },
  comfortable: { py: "4rem" },
  spacious: { py: "7rem" },
};

const CustomHtmlSection = ({
  htmlTemplate = "",
  customCss = "",
  scopeClass = "",
  containerWidth = "",
  spacingPreset = "",
  paddingTop,
  paddingBottom,
  backgroundColor = "",
  textColor = "",
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
    [htmlTemplate, scopedContent],
  );

  // Build the section wrapper class list from builder style controls
  const sectionClasses = React.useMemo(() => {
    const classes = [scopeClass || undefined, CONTAINER_WIDTH_MAP[containerWidth]].filter(Boolean);
    return classes.join(" ");
  }, [scopeClass, containerWidth]);

  // Build inline styles for fine-grained control that CSS scoping can't override
  const sectionStyles = React.useMemo(() => {
    const spacing = SPACING_PRESET_MAP[spacingPreset] || {};
    return {
      paddingTop: paddingTop !== undefined ? `${paddingTop}px` : spacing.py,
      paddingBottom: paddingBottom !== undefined ? `${paddingBottom}px` : spacing.py,
      backgroundColor: backgroundColor || undefined,
      color: textColor || undefined,
    };
  }, [spacingPreset, paddingTop, paddingBottom, backgroundColor, textColor]);

  return (
    <section
      className={sectionClasses || undefined}
      style={sectionStyles}
      suppressHydrationWarning
    >
      {customCss ? <style suppressHydrationWarning>{customCss}</style> : null}
      <div dangerouslySetInnerHTML={{ __html: renderedHtml }} suppressHydrationWarning />
    </section>
  );
};

export default CustomHtmlSection;
