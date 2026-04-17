import React from "react";
import { renderRegisteredSection } from "../sections/registry/sectionRegistry";

const normalizeSections = (sections = []) =>
  [...sections]
    .filter((section) => section?.enabled !== false && section?.type)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

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

        return (
          <React.Fragment
            key={section._id || `${section.type}-${section.order || 0}`}
          >
            {rendered}
          </React.Fragment>
        );
      })}
    </>
  );
};

export default PageRenderer;
