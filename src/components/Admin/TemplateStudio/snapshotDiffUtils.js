function stringifyComparable(section = {}) {
  return JSON.stringify({
    label: section.label || "",
    type: section.type || "",
    content: section.content || {},
    styles: section.styles || {},
    responsive: section.responsive || {},
    bindings: section.bindings || [],
  });
}

export function compareSnapshots({ leftSnapshot, rightSnapshot } = {}) {
  const leftSections = leftSnapshot?.sections || [];
  const rightSections = rightSnapshot?.sections || [];

  const leftMap = new Map(leftSections.map((section) => [section.id, section]));
  const rightMap = new Map(rightSections.map((section) => [section.id, section]));
  const sectionIds = [...new Set([...leftMap.keys(), ...rightMap.keys()])];

  const rows = sectionIds.map((sectionId) => {
    const leftSection = leftMap.get(sectionId) || null;
    const rightSection = rightMap.get(sectionId) || null;

    let changeType = "unchanged";
    if (!leftSection && rightSection) {
      changeType = "added";
    } else if (leftSection && !rightSection) {
      changeType = "removed";
    } else if (stringifyComparable(leftSection) !== stringifyComparable(rightSection)) {
      changeType = "changed";
    }

    return {
      sectionId,
      label: rightSection?.label || leftSection?.label || sectionId,
      changeType,
      leftSection,
      rightSection,
    };
  });

  return {
    leftSnapshot,
    rightSnapshot,
    rows,
    summary: {
      added: rows.filter((row) => row.changeType === "added").length,
      removed: rows.filter((row) => row.changeType === "removed").length,
      changed: rows.filter((row) => row.changeType === "changed").length,
      unchanged: rows.filter((row) => row.changeType === "unchanged").length,
    },
  };
}
