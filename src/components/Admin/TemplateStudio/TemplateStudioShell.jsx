import React from "react";

import CanvasPane from "./CanvasPane.jsx";
import ImportLab from "./ImportLab.jsx";
import InspectorPane from "./InspectorPane.jsx";
import LibraryPane from "./LibraryPane.jsx";
import { createStudioCanvasState, createStudioSectionNode, studioCanvasReducer } from "./studioReducers.js";
import StudioSidebar from "./StudioSidebar.jsx";
import StudioTopBar from "./StudioTopBar.jsx";
import {
  DEFAULT_LIBRARY_SECTIONS,
  createStudioPageDraft,
  createStudioSectionDraft,
} from "./studioTypes.js";

const defaultImportState = {
  name: "Imported Template",
  sourceType: "html-css-page",
  sourceCode: "",
  referenceImageUrl: "",
  result: null,
};

export default function TemplateStudioShell({
  studioPage,
  pageName,
  pageType,
  status,
  sections = [],
  selectedSection,
  librarySections = DEFAULT_LIBRARY_SECTIONS,
  selectedInspectorTab = "content",
  activeSidebarGroup = "pages",
  importing = false,
  saving = false,
  message = "",
  onSaveStudioPage,
  onImportStudioSource,
  onRequestBindingSuggestions,
  onTopBarAction,
}) {
  const page = React.useMemo(
    () =>
      createStudioPageDraft(
        studioPage || {
          pageName,
          pageType,
          status,
          sections,
        }
      ),
    [pageName, pageType, sections, status, studioPage]
  );

  const [canvasState, dispatch] = React.useReducer(
    studioCanvasReducer,
    createStudioCanvasState({
      sections: page.sections,
      selectedSectionId: selectedSection?.id || page.sections?.[0]?.id || null,
    })
  );
  const [selectedLibrarySection, setSelectedLibrarySection] = React.useState(null);
  const [sidebarGroup, setSidebarGroup] = React.useState(activeSidebarGroup);
  const [inspectorTab, setInspectorTab] = React.useState(selectedInspectorTab);
  const [importState, setImportState] = React.useState(defaultImportState);
  const [importedLibrarySections, setImportedLibrarySections] = React.useState([]);
  const [bindingSuggestionsBySection, setBindingSuggestionsBySection] = React.useState({});

  React.useEffect(() => {
    dispatch({
      type: "hydrate-canvas",
      sections: page.sections,
      selectedSectionId: selectedSection?.id || page.sections?.[0]?.id || null,
    });
  }, [page.sections, page.id, selectedSection?.id]);

  const mergedLibrarySections = React.useMemo(
    () => [...importedLibrarySections, ...librarySections].map((section) => createStudioSectionNode(section)),
    [importedLibrarySections, librarySections]
  );

  const selectedCanvasSection =
    canvasState.sections.find((section) => section.id === canvasState.selectedSectionId) ||
    createStudioSectionDraft(selectedSection);

  const handleInsertSection = React.useCallback(
    ({ position, targetSectionId }) => {
      const baseSection =
        selectedLibrarySection ||
        createStudioSectionNode({
          id: `section-${Date.now()}`,
          label: "New Section",
          type: "customHtml",
          sourceType: "manual",
          summary: "A blank section ready for content, styling, and CMS bindings.",
        });

      dispatch({
        type: "insert-section",
        targetSectionId,
        position,
        section: {
          ...baseSection,
          id: `${baseSection.id}-${Date.now()}`,
        },
      });
    },
    [selectedLibrarySection]
  );

  const handleSectionAction = React.useCallback((actionId, section, index) => {
    if (actionId === "move-up") {
      dispatch({ type: "move-section", sectionId: section.id, direction: "up" });
      return;
    }
    if (actionId === "move-down") {
      dispatch({ type: "move-section", sectionId: section.id, direction: "down" });
      return;
    }
    if (actionId === "duplicate") {
      dispatch({ type: "duplicate-section", sectionId: section.id });
      return;
    }
    if (actionId === "delete") {
      dispatch({ type: "delete-section", sectionId: section.id });
      return;
    }
    if (actionId === "toggle-visibility") {
      dispatch({ type: "toggle-section-visibility", sectionId: section.id });
      return;
    }
    dispatch({ type: "select-section", sectionId: section.id || canvasState.sections[index]?.id });
  }, [canvasState.sections]);

  const handleTopBarAction = async (actionId) => {
    onTopBarAction?.(actionId);

    if (actionId === "import") {
      setSidebarGroup("imports");
      return;
    }

    if (actionId === "add-section") {
      handleInsertSection({
        position: "below",
        targetSectionId: canvasState.selectedSectionId || canvasState.sections[canvasState.sections.length - 1]?.id || null,
      });
      return;
    }

    if (actionId === "save") {
      await onSaveStudioPage?.({
        ...page,
        sections: canvasState.sections,
      });
      return;
    }

    if (actionId === "publish") {
      await onSaveStudioPage?.({
        ...page,
        status: "published",
        sections: canvasState.sections,
      });
    }
  };

  const handleImportChange = (field, value) => {
    setImportState((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleImport = async (payload) => {
    const result = await onImportStudioSource?.(payload);
    const resolvedResult = result || null;

    setImportState((current) => ({
      ...current,
      result: resolvedResult,
    }));

    if (resolvedResult?.sectionDrafts?.length) {
      setImportedLibrarySections((current) => [...resolvedResult.sectionDrafts, ...current]);
      setSidebarGroup("templates");
      dispatch({
        type: "insert-section",
        targetSectionId: canvasState.sections[canvasState.sections.length - 1]?.id || null,
        position: "below",
        section: resolvedResult.sectionDrafts[0],
      });
    }
  };

  const handleRequestBindings = async (section) => {
    const response = await onRequestBindingSuggestions?.(section);
    const suggestions = response?.suggestions || section.bindings || [];
    setBindingSuggestionsBySection((current) => ({
      ...current,
      [section.id]: suggestions,
    }));
    setInspectorTab("binding");
  };

  return (
    <section
      className="flex min-h-[calc(100vh-8rem)] flex-col overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-100 shadow-[0_24px_60px_rgba(15,23,42,0.12)]"
      data-testid="template-studio-shell"
    >
      <StudioTopBar
        pageName={page.pageName}
        pageType={page.pageType}
        status={saving ? "Saving..." : page.status}
        onAction={handleTopBarAction}
      />
      {message ? (
        <div className="border-b border-slate-200 bg-emerald-50 px-6 py-3 text-sm font-medium text-emerald-800">
          {message}
        </div>
      ) : null}
      <div className="flex min-h-0 flex-1">
        <StudioSidebar activeGroup={sidebarGroup} onSelectGroup={setSidebarGroup} />
        {sidebarGroup === "imports" ? (
          <ImportLab
            importState={importState}
            onChange={handleImportChange}
            onImport={handleImport}
            importing={importing}
          />
        ) : (
          <LibraryPane
            sections={mergedLibrarySections}
            selectedSectionId={selectedLibrarySection?.id}
            onSelectSection={setSelectedLibrarySection}
          />
        )}
        <CanvasPane
          page={{ ...page, sections: canvasState.sections }}
          state={canvasState}
          selectedSectionId={canvasState.selectedSectionId}
          selectedLibrarySection={selectedLibrarySection}
          onSelectSection={(sectionId) => dispatch({ type: "select-section", sectionId })}
          onInsertSection={handleInsertSection}
          onSectionAction={handleSectionAction}
        />
        <InspectorPane
          selectedSection={selectedCanvasSection}
          selectedTab={inspectorTab}
          bindingSuggestions={bindingSuggestionsBySection[selectedCanvasSection.id] || selectedCanvasSection.bindings || []}
          onRequestBindingSuggestions={handleRequestBindings}
          onSelectTab={setInspectorTab}
        />
      </div>
    </section>
  );
}
