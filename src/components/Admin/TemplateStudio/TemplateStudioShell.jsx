import React from "react";

import CanvasPane from "./CanvasPane.jsx";
import ImportLab from "./ImportLab.jsx";
import InspectorPane from "./InspectorPane.jsx";
import LibraryPane from "./LibraryPane.jsx";
import PreviewPane from "./PreviewPane.jsx";
import {
  buildApprovedImportPayload,
  createImportReviewState,
  toggleImportReviewSection,
} from "./importReviewUtils.js";
import VersionManagerPane from "./VersionManagerPane.jsx";
import {
  createStudioCanvasState,
  createStudioSectionNode,
  studioCanvasReducer,
} from "./studioReducers.js";
import {
  createStudioHistoryState,
  pushStudioHistory,
  redoStudioHistory,
  undoStudioHistory,
} from "./studioHistory.js";
import {
  createSnapshotEntry,
  deleteSnapshot,
  findSnapshot,
  prependSnapshot,
  renameSnapshot,
} from "./snapshotUtils.js";
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
  cmsSources,
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
  const [comparisonSnapshotId, setComparisonSnapshotId] = React.useState("");
  const [isPreviewOpen, setIsPreviewOpen] = React.useState(false);

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
    setComparisonSnapshotId("");
    setIsPreviewOpen(false);
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
    () =>
      [...importedLibrarySections, ...librarySections].map((section) =>
        createStudioSectionNode(section)
      ),
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

  const handleSectionAction = React.useCallback(
    (actionId, section, index) => {
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
    },
    [canvasState.sections, dispatchCanvas, onSaveReusableSection]
  );

  const handleSaveSnapshot = React.useCallback(() => {
    const snapshot = createSnapshotEntry({
      pageName: pageDraft.pageName,
      sectionLabel: selectedCanvasSection?.label || "Canvas",
      sections: canvasState.sections,
      viewport,
    });

    setPageDraft((current) => ({
      ...current,
      snapshots: prependSnapshot(current.snapshots || [], snapshot),
    }));
    setSelectedSnapshotId(snapshot.id);
    setComparisonSnapshotId("");
  }, [canvasState.sections, pageDraft.pageName, selectedCanvasSection?.label, viewport]);

  const handleSnapshotChange = React.useCallback(
    (snapshotId) => {
      if (!snapshotId) {
        setSelectedSnapshotId("");
        setComparisonSnapshotId("");
        return;
      }

      const snapshot = findSnapshot(pageDraft.snapshots || [], snapshotId);

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
    },
    [dispatchCanvas, pageDraft.snapshots]
  );

  const handleRenameSnapshot = React.useCallback((snapshotId, nextName) => {
    setPageDraft((current) => ({
      ...current,
      snapshots: renameSnapshot(current.snapshots || [], snapshotId, nextName),
    }));
  }, []);

  const handleDeleteSnapshot = React.useCallback((snapshotId) => {
    setPageDraft((current) => ({
      ...current,
      snapshots: deleteSnapshot(current.snapshots || [], snapshotId),
    }));
    setSelectedSnapshotId((current) => (current === snapshotId ? "" : current));
    setComparisonSnapshotId((current) => (current === snapshotId ? "" : current));
  }, []);

  const handleTopBarAction = async (actionId) => {
    onTopBarAction?.(actionId);

    if (actionId === "import") {
      setSidebarGroup("imports");
      return;
    }

    if (actionId === "open-versions") {
      setSidebarGroup("versions");
      return;
    }

    if (actionId === "preview") {
      setIsPreviewOpen(true);
      return;
    }

    if (actionId === "add-section") {
      handleInsertSection({
        position: "below",
        targetSectionId:
          canvasState.selectedSectionId ||
          canvasState.sections[canvasState.sections.length - 1]?.id ||
          null,
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
      handleSaveSnapshot();
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
      review: resolvedResult ? createImportReviewState(resolvedResult) : null,
    }));
  };

  const handleToggleReviewSection = React.useCallback((sectionId) => {
    setImportState((current) => ({
      ...current,
      review: toggleImportReviewSection(current.review || {}, sectionId),
    }));
  }, []);

  const handleCommitImport = React.useCallback(() => {
    const approved = buildApprovedImportPayload(importState.result, importState.review);

    if (!approved.sectionDrafts?.length) {
      return;
    }

    setImportedLibrarySections((current) => [...approved.sectionDrafts, ...current]);
    setSidebarGroup("templates");
    dispatchCanvas({
      type: "insert-sections",
      targetSectionId: canvasState.sections[canvasState.sections.length - 1]?.id || null,
      position: "below",
      sections: approved.sectionDrafts.map((section, index) => ({
        ...section,
        id: `${section.id}-${Date.now()}-${index}`,
      })),
    });
    setImportState((current) => ({
      ...current,
      result: approved,
    }));
  }, [canvasState.sections, dispatchCanvas, importState.result, importState.review]);

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
      className="flex min-h-[calc(100vh-8rem)] w-full max-w-none flex-col overflow-hidden rounded-[2rem] border border-slate-900/60 bg-[#05070b] shadow-[0_32px_90px_rgba(2,6,23,0.55)]"
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
        <div className="border-b border-white/10 bg-emerald-400/10 px-6 py-3 text-sm font-medium text-emerald-200">
          {message}
        </div>
      ) : null}
      <div className="flex min-h-0 flex-1">
        {isPreviewOpen ? (
          <PreviewPane
            page={{ ...pageDraft, sections: canvasState.sections }}
            viewport={viewport}
            cmsSources={cmsSources}
            onClose={() => setIsPreviewOpen(false)}
            onPublish={async () => {
              await onSaveStudioPage?.({
                ...pageDraft,
                status: "published",
                sections: canvasState.sections,
              });
            }}
          />
        ) : (
          <>
            <StudioSidebar activeGroup={sidebarGroup} onSelectGroup={setSidebarGroup} />
            {sidebarGroup === "imports" ? (
              <ImportLab
                importState={importState}
                onChange={handleImportChange}
                onImport={handleImport}
                onToggleReviewSection={handleToggleReviewSection}
                onCommitImport={handleCommitImport}
                importing={importing}
              />
            ) : sidebarGroup === "versions" ? (
              <VersionManagerPane
                pageName={pageDraft.pageName}
              snapshots={pageDraft.snapshots || []}
              selectedSnapshotId={selectedSnapshotId}
              comparisonSnapshotId={comparisonSnapshotId}
              onCreateSnapshot={handleSaveSnapshot}
              onRestoreSnapshot={handleSnapshotChange}
              onRenameSnapshot={handleRenameSnapshot}
              onDeleteSnapshot={handleDeleteSnapshot}
              onSelectComparisonSnapshot={setComparisonSnapshotId}
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
              themeTokens={pageDraft.themeTokens || {}}
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
              pageThemeTokens={pageDraft.themeTokens || {}}
              bindingSuggestions={
                bindingSuggestionsBySection[selectedCanvasSection.id] ||
                selectedCanvasSection.bindings ||
                []
              }
              onRequestBindingSuggestions={handleRequestBindings}
              onSelectTab={setInspectorTab}
              onUpdatePageTheme={(themeTokens) =>
                setPageDraft((current) => ({
                  ...current,
                  themeTokens,
                }))
              }
              onUpdateSection={(sectionId, patch) =>
                dispatchCanvas({ type: "update-section", sectionId, patch })
              }
            />
          </>
        )}
      </div>
    </section>
  );
}
