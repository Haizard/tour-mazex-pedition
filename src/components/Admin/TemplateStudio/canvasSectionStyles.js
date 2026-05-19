import { DEFAULT_STUDIO_THEME_TOKENS } from "./studioTypes.js";

function pickFirstValue(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null && value !== "") {
      return value;
    }
  }

  return "";
}

export function resolveSectionStyleTokens(
  section = {},
  viewport = "desktop",
  themeTokens = DEFAULT_STUDIO_THEME_TOKENS
) {
  const styles = section.styles || {};
  const responsive = section.responsive || {};
  const viewportOverrides = responsive[viewport] || {};

  return {
    accentColor: styles.accentColor || themeTokens.accentColor || "#0f766e",
    backgroundColor: styles.backgroundColor || themeTokens.sectionBackground || "#ffffff",
    textColor: styles.textColor || themeTokens.textColor || "#0f172a",
    paddingY: pickFirstValue(viewportOverrides.paddingY, styles.paddingY, themeTokens.paddingY, "40px"),
    gap: pickFirstValue(viewportOverrides.gap, styles.gap, themeTokens.gap, "16px"),
    radius: styles.radius || themeTokens.radius || "24px",
    maxWidth: styles.maxWidth || "100%",
    columns: pickFirstValue(viewportOverrides.columns, "1"),
    align: pickFirstValue(viewportOverrides.align, "start"),
    fontFamily: styles.fontFamily || themeTokens.fontFamily || "inherit",
    headlineSize: styles.headlineSize || themeTokens.headlineSize || "1.5rem",
    bodySize: styles.bodySize || themeTokens.bodySize || "0.95rem",
  };
}

export function buildCanvasSectionStyle(
  section = {},
  viewport = "desktop",
  isSelected = false,
  themeTokens = DEFAULT_STUDIO_THEME_TOKENS
) {
  const tokens = resolveSectionStyleTokens(section, viewport, themeTokens);

  return {
    containerStyle: {
      backgroundColor: tokens.backgroundColor,
      color: tokens.textColor,
      paddingBlock: tokens.paddingY,
      gap: tokens.gap,
      borderRadius: tokens.radius,
      maxWidth: tokens.maxWidth,
      fontFamily: tokens.fontFamily,
      boxShadow: isSelected ? "0 0 0 2px rgba(16, 185, 129, 0.22)" : "none",
      justifyItems:
        tokens.align === "center" ? "center" : tokens.align === "end" ? "end" : "start",
    },
    eyebrowStyle: {
      color: tokens.accentColor,
    },
    headlineStyle: {
      color: tokens.textColor,
      fontSize: tokens.headlineSize,
    },
    bodyStyle: {
      color: tokens.textColor,
      fontSize: tokens.bodySize,
      opacity: 0.82,
    },
    badgeStyle: {
      borderColor: `${tokens.accentColor}33`,
      color: tokens.accentColor,
      backgroundColor: `${tokens.accentColor}12`,
    },
    actionsStyle: {
      borderTop: `1px solid ${tokens.accentColor}20`,
    },
    tokens,
  };
}
