import React from "react";
import { renderRegisteredSection } from "../sections/registry/sectionRegistry";

const normalizeSections = (sections = []) =>
  [...sections]
    .filter((section) => section?.enabled !== false && section?.type)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

const toPixelValue = (value) => {
  if (value == null || value === "") {
    return undefined;
  }

  return typeof value === "number" ? `${value}px` : value;
};

const spacingPresetMap = {
  compact: { paddingTop: "32px", paddingBottom: "32px" },
  comfortable: { paddingTop: "64px", paddingBottom: "64px" },
  spacious: { paddingTop: "96px", paddingBottom: "96px" },
};

const containerWidthMap = {
  narrow: "768px",
  standard: "1200px",
  wide: "1440px",
  full: "100%",
};

const radiusMap = {
  none: "0px",
  md: "16px",
  xl: "24px",
  "3xl": "32px",
};

const shadowMap = {
  none: "none",
  sm: "0 10px 25px rgba(15, 23, 42, 0.08)",
  md: "0 20px 45px rgba(15, 23, 42, 0.12)",
  lg: "0 28px 60px rgba(15, 23, 42, 0.16)",
};

const buildSectionWrapperStyle = (section) => {
  const styleConfig = section?.styleConfig || {};
  const spacingPreset = spacingPresetMap[styleConfig.spacingPreset] || {};

  return {
    backgroundColor: styleConfig.backgroundColor || undefined,
    color: styleConfig.textColor || undefined,
    paddingTop:
      toPixelValue(styleConfig.paddingTop) || spacingPreset.paddingTop,
    paddingBottom:
      toPixelValue(styleConfig.paddingBottom) || spacingPreset.paddingBottom,
    textAlign: styleConfig.textAlign || undefined,
  };
};

const buildSectionInnerStyle = (section) => {
  const styleConfig = section?.styleConfig || {};
  const containerWidth = containerWidthMap[styleConfig.containerWidth];

  return {
    maxWidth:
      styleConfig.containerWidth && styleConfig.containerWidth !== "full"
        ? containerWidth
        : undefined,
    width: styleConfig.containerWidth === "full" ? "100%" : undefined,
    marginLeft:
      styleConfig.containerWidth && styleConfig.containerWidth !== "full"
        ? "auto"
        : undefined,
    marginRight:
      styleConfig.containerWidth && styleConfig.containerWidth !== "full"
        ? "auto"
        : undefined,
    borderRadius: radiusMap[styleConfig.borderRadius] || undefined,
    boxShadow: shadowMap[styleConfig.shadowLevel] || undefined,
    overflow:
      styleConfig.borderRadius || styleConfig.shadowLevel ? "hidden" : undefined,
  };
};

const PageRenderer = ({ sections = [] }) => {
  const normalizedSections = React.useMemo(
    () => normalizeSections(sections),
    [sections]
  );

  return (
    <>
      {normalizedSections.map((section) => {
        const rendered = renderRegisteredSection(section);
        if (!rendered) {
          return null;
        }

        const wrapperStyle = buildSectionWrapperStyle(section);
        const innerStyle = buildSectionInnerStyle(section);

        return (
          <div
            key={section._id || `${section.type}-${section.order || 0}`}
            style={wrapperStyle}
          >
            <div style={innerStyle}>{rendered}</div>
          </div>
        );
      })}
    </>
  );
};

export default PageRenderer;
