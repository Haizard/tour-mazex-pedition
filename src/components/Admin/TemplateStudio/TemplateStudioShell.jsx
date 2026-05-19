import React from "react";

import CanvasPane from "./CanvasPane.jsx";
import ImportLab from "./ImportLab.jsx";
import InspectorPane from "./InspectorPane.jsx";
import LibraryPane from "./LibraryPane.jsx";
import { createStudioCanvasState, createStudioSectionNode, studioCanvasReducer } from "./studioReducers.js";
import {
  createStudioHistoryState,
  pushStudioHistory,
  redoStudioHistory,
  undoStudioHistory,
} from "./studioHistory.js";
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
  onSaveReusableSection,
  onDeleteReusableSection,
  onImportStudioSource,
  onRequestBindingSuggestions,
  onTopBarAction,
}) {
  const initialPage = React.useMemo(
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
  const [pageDraft, setPageDraft] = React.useState(initialPage);

  const [historyState, setHistoryState] = React.useState(() =>
    createStudioHistoryState(
      createStudioCanvasState({
        sections: initialPage.sections,
        selectedSectionId: selectedSection?.id || initialPage.sections?.[0]?.id || null,
      })
    )
  );
  const [selectedLibrarySection, setSelectedLibrarySection] = React.useState(null);
  const [sidebarGroup, setSidebarGroup] = React.useState(activeSidebarGroup);
  const [inspectorTab, setInspectorTab] = React.useState(selectedInspectorTab);
  const [importState, setImportState] = React.useState(defaultImportState);
  const [importedLibrarySections, setImportedLibrarySections] = React.useState([]);
  const [bindingSuggestionsBySection, setBindingSuggestionsBySection] = React.useState({});
  const [viewport, setViewport] = React.useState("desktop");
  const [selectedSnapshotId, setSelectedSnapshotId] = React.useState("");

  const canvasState = historyState.present;

  const dispatchCanvas = React.useCallback((action, options = {}) => {
    setHistoryState((currentHistory) => {
      const nextPresent = studioCanvasReducer(currentHistory.present, action);
      const shouldTrack =
        options.trackHistory !== false &&
        !["select-section", "hydrate-canvas"].includes(action.type);

      if (!shouldTrack) {
        return {
          ...currentHistory,
          present: nextPresent,
        };
      }

      return pushStudioHistory(currentHistory, nextPresent);
    });
  }, []);

  React.useEffect(() => {
    setPageDraft(initialPage);
    setSelectedSnapshotId("");
  }, [initialPage]);

  React.useEffect(() => {
    setHistoryState(
      createStudioHistoryState(
        createStudioCanvasState({
          sections: initialPage.sections,
          selectedSectionId: selectedSection?.id || initialPage.sections?.[0]?.id || null,
        })
      )
    );
  }, [initialPage.sections, initialPage.id, selectedSection?.id]);

  const mergedLibrarySections = React.useMemo(
    () => [...importedLibrarySections, ...librarySections].map((section) => createStudioSectionNode(section)),
    [importedLibrarySections, librarySections]
  );

  const selectedCanvasSection =
    canvasState.sections.find((section) => section.id === canvasState.selectedSectionId) ||
    createStudioSectionDraft(selectedSection);

  const handleInsertSection = React.useCallback(
    ({ position, targetSectionId, section: explicitSection }) => {
      const baseSection =
        explicitSection ||
        selectedLibrarySection ||
        createStudioSectionNode({
          id: `section-${Date.now()}`,
          label: "New Section",
          type: "customHtml",
          sourceType: "manual",
          summary: "A blank section ready for content, styling, and CMS bindings.",
        });

      dispatchCanvas({
        type: "insert-section",
        targetSectionId,
        position,
        section: {
          ...baseSection,
          id: `${baseSection.id}-${Date.now()}`,
        },
      });
    },
    [dispatchCanvas, selectedLibrarySection]
  );

  const handleSectionAction = React.useCallback((actionId, section, index) => {
    if (actionId === "move-up") {
      dispatchCanvas({ type: "move-section", sectionId: section.id, direction: "up" });
      return;
    }
    if (actionId === "move-down") {
      dispatchCanvas({ type: "move-section", sectionId: section.id, direction: "down" });
      return;
    }
    if (actionId === "duplicate") {
      dispatchCanvas({ type: "duplicate-section", sectionId: section.id });
      return;
    }
    if (actionId === "save-reusable") {
      onSaveReusableSection?.(section);
      return;
    }
    if (actionId === "delete") {
      dispatchCanvas({ type: "delete-section", sectionId: section.id });
      return;
    }
    if (actionId === "toggle-visibility") {
      dispatchCanvas({ type: "toggle-section-visibility", sectionId: section.id });
      return;
    }
    dispatchCanvas(
      { type: "select-section", sectionId: section.id || canvasState.sections[index]?.id },
      { trackHistory: false }
    );
  }, [canvasState.sections, dispatchCanvas, onSaveReusableSection]);

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
        ...pageDraft,
        sections: canvasState.sections,
      });
      return;
    }

    if (actionId === "publish") {
      await onSaveStudioPage?.({
        ...pageDraft,
        status: "published",
        sections: canvasState.sections,
      });
      return;
    }

    if (actionId === "save-snapshot") {
      const timestamp = new Date().toISOString();
      const snapshotId = `snapshot-${Date.now()}`;
      const sectionLabel = selectedCanvasSection?.label || "Canvas";

      setPageDraft((current) => ({
        ...current,
        snapshots: [
          {
            id: snapshotId,
            name: `${current.pageName || "Untitled Page"} · ${sectionLabel} · ${new Date(timestamp).toLocaleString()}`,
            createdAt: timestamp,
            sections: canvasState.sections.map((section) => ({ ...section })),
            viewport,
          },
          ...(current.snapshots || []),
        ].slice(0, 20),
      }));
      setSelectedSnapshotId(snapshotId);
    }
  };

  const handleSnapshotChange = React.useCallback((snapshotId) => {
    if (!snapshotId) {
      setSelectedSnapshotId("");
      return;
    }

    const snapshot = (pageDraft.snapshots || []).find((entry) => entry.id === snapshotId);

    if (!snapshot) {
      return;
    }

    setSelectedSnapshotId(snapshotId);
    setViewport(snapshot.viewport || "desktop");
    dispatchCanvas(
      {
        type: "hydrate-canvas",
        sections: snapshot.sections || [],
        selectedSectionId: snapshot.sections?.[0]?.id || null,
      },
      { trackHistory: false }
    );
  }, [dispatchCanvas, pageDraft.snapshots]);

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
      dispatchCanvas({
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
        pageName={pageDraft.pageName}
        pageType={pageDraft.pageType}
        status={saving ? "Saving..." : pageDraft.status}
        onAction={handleTopBarAction}
        snapshots={pageDraft.snapshots || []}
        selectedSnapshotId={selectedSnapshotId}
        viewport={viewport}
        canUndo={historyState.past.length > 0}
        canRedo={historyState.future.length > 0}
        onUndo={() => setHistoryState((current) => undoStudioHistory(current))}
        onRedo={() => setHistoryState((current) => redoStudioHistory(current))}
        onViewportChange={setViewport}
        onSnapshotChange={handleSnapshotChange}
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
            selectedCanvasSection={selectedCanvasSection}
            onSelectSection={setSelectedLibrarySection}
            onInsertSection={(section, targetSectionId) => {
              setSelectedLibrarySection(section);
              handleInsertSection({ position: "below", targetSectionId, section });
            }}
            onReplaceSection={(section, targetSectionId) =>
              dispatchCanvas({
                type: "replace-section",
                sectionId: targetSectionId,
                section: {
                  ...section,
                  id: `${section.id}-${Date.now()}`,
                },
              })
            }
            onDeleteSection={onDeleteReusableSection}
          />
        )}
        <CanvasPane
          page={{ ...pageDraft, sections: canvasState.sections }}
          state={canvasState}
          viewport={viewport}
          selectedSectionId={canvasState.selectedSectionId}
          selectedLibrarySection={selectedLibrarySection}
          onSelectSection={(sectionId) =>
            dispatchCanvas({ type: "select-section", sectionId }, { trackHistory: false })
          }
          onInsertSection={handleInsertSection}
          onReorderSection={(sectionId, toIndex) =>
            dispatchCanvas({ type: "reorder-section", sectionId, toIndex })
          }
          onSectionAction={handleSectionAction}
        />
        <InspectorPane
          selectedSection={selectedCanvasSection}
          selectedTab={inspectorTab}
          bindingSuggestions={bindingSuggestionsBySection[selectedCanvasSection.id] || selectedCanvasSection.bindings || []}
          onRequestBindingSuggestions={handleRequestBindings}
          onSelectTab={setInspectorTab}
          onUpdateSection={(sectionId, patch) => dispatchCanvas({ type: "update-section", sectionId, patch })}
        />
      </div>
    </section>
  );
}
