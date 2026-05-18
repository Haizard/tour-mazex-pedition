# Template Studio Import And Bind Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild Template Studio into an advanced import-and-bind workspace that can ingest templates from code or reference assets, convert them into editable section-based pages, bind them to platform CMS data, and let platform admins compose pages with Elementor-style drag/insert controls.

**Architecture:** Keep `PageConfig.sections[]` as the short-term rendering source of truth so current tenant/public rendering keeps working, but layer a new Template Studio domain on top of it: a studio page canvas, reusable section library, import job pipeline, and CMS binding metadata. The new admin UI will split the current `PageBuilderManager` into a dedicated studio shell with a canvas, library, import lab, and inspector so imported, AI-created, and manual sections all become the same internal node type.

**Tech Stack:** Express, Mongoose, existing `PageConfig`/`PageBuilderTemplate` models, React/Vite admin UI, current section registry, Node test runner, existing template marketplace/template application helpers.

---

## File Structure

**Existing files to extend**
- `backend/models/PageConfig.js`
  - Persist new page-canvas metadata, section source metadata, bindings, and theme tokens while preserving existing public rendering compatibility.
- `backend/models/PageBuilderTemplate.js`
  - Evolve platform templates from flat page payloads into reusable studio-ready templates; add the standard `mongoose.models` guard.
- `backend/controllers/pageConfigController.js`
  - Keep current page-config endpoints working while delegating import/binding/template-studio orchestration to smaller utilities.
- `backend/routes/pageConfigRoutes.js`
  - Add tenant-admin studio routes that remain compatible with current page-level editing.
- `backend/routes/platformAdminRoutes.js`
  - Add platform-admin template-studio publishing/import routes for global template library workflows.
- `src/components/Admin/PageBuilderManager.jsx`
  - Replace the current form-heavy builder shell with a compatibility wrapper that launches the new Template Studio experience.
- `src/services/api.js`
  - Add client helpers for import jobs, reusable sections, bindings, and studio page persistence.
- `src/pageBuilder/templateMarketplace.js`
  - Expand the catalog helpers so imported/studio-authored templates use the same registry flow as current built-in and platform templates.

**New backend files**
- `backend/models/TemplateStudioImportJob.js`
  - Track import source, parsing progress, detected sections/assets, binding suggestions, and preview snapshots.
- `backend/models/ReusableSectionTemplate.js`
  - Store reusable section-library entries that can be inserted into any canvas page.
- `backend/utils/templateStudioSectionModel.js`
  - Normalize imported, AI, manual, and reusable sections into one internal section-node shape.
- `backend/utils/templateStudioImportPipeline.js`
  - Intake HTML/CSS/snippets/reference metadata and convert them into studio-ready section/page payloads.
- `backend/utils/templateStudioBindingSuggestions.js`
  - Detect likely CMS bindings for tours, blogs, testimonials, destinations, contact, inquiry, and static content.
- `backend/utils/templateStudioPagePersistence.js`
  - Convert studio page payloads to/from `PageConfig`.
- `backend/utils/templateStudioTemplatePublishing.js`
  - Save a studio page as a platform template, reusable section pack, or tenant-ready page variant.

**New frontend files**
- `src/components/Admin/TemplateStudio/TemplateStudioShell.jsx`
  - Studio top bar and primary layout.
- `src/components/Admin/TemplateStudio/StudioSidebar.jsx`
  - Left rail for pages, templates, imports, sections, and assets.
- `src/components/Admin/TemplateStudio/CanvasPane.jsx`
  - Visual page canvas with section boundaries, insert lines, drag handles, and selection state.
- `src/components/Admin/TemplateStudio/CanvasSectionCard.jsx`
  - Shared renderer for section thumbnails and in-canvas controls.
- `src/components/Admin/TemplateStudio/LibraryPane.jsx`
  - Reusable sections, imported sections, and page templates browser.
- `src/components/Admin/TemplateStudio/InspectorPane.jsx`
  - Right-side tabs for content, style, binding, advanced, and responsive settings.
- `src/components/Admin/TemplateStudio/ImportLab.jsx`
  - Source intake and import-analysis workflow.
- `src/components/Admin/TemplateStudio/BindingInspector.jsx`
  - Explicit CMS binding editor for static/dynamic/mixed section content.
- `src/components/Admin/TemplateStudio/StudioTopBar.jsx`
  - Import, AI create, preview, undo/redo, save, publish, and assign actions.
- `src/components/Admin/TemplateStudio/studioTypes.js`
  - Shared frontend shape helpers for pages, sections, bindings, and import jobs.
- `src/components/Admin/TemplateStudio/studioReducers.js`
  - Local reducer/state transitions for canvas operations.

**New tests**
- `backend/tests/templateStudioSectionModel.test.js`
- `backend/tests/templateStudioImportPipeline.test.js`
- `backend/tests/templateStudioBindingSuggestions.test.js`
- `backend/tests/templateStudioPagePersistence.test.js`
- `backend/tests/templateStudioTemplatePublishing.test.js`
- `src/components/Admin/TemplateStudio/studioReducers.test.js`
- `src/components/Admin/TemplateStudio/TemplateStudioShell.test.jsx`

---

### Task 1: Define The Shared Studio Data Model

**Files:**
- Create: `backend/models/TemplateStudioImportJob.js`
- Create: `backend/models/ReusableSectionTemplate.js`
- Create: `backend/utils/templateStudioSectionModel.js`
- Modify: `backend/models/PageConfig.js`
- Modify: `backend/models/PageBuilderTemplate.js`
- Test: `backend/tests/templateStudioSectionModel.test.js`

- [ ] **Step 1: Write the failing model/shape tests**

Cover these cases:
- a studio section node always has `id`, `type`, `sourceType`, `content`, `styles`, `bindings`, `responsive`, `visibility`, and `order`
- imported, AI, manual, and reusable sections normalize to the same shape
- `PageConfig` accepts `templateStudio` metadata without breaking existing pages
- `PageBuilderTemplate` can persist a richer section payload and does not throw `OverwriteModelError`

Run:
```powershell
node --test backend/tests/templateStudioSectionModel.test.js
```
Expected: FAIL because the new models/utilities do not exist yet.

- [ ] **Step 2: Implement the shared studio section model**

Add a normalizer in `backend/utils/templateStudioSectionModel.js` that produces a single section-node contract like:

```js
{
  id: "section_hero_1",
  type: "hero",
  label: "Hero",
  sourceType: "imported",
  sourceMeta: { importJobId: "job_123", originalSelector: ".hero" },
  order: 1,
  enabled: true,
  content: {},
  styles: {},
  bindings: [],
  responsive: {},
  visibility: {},
  customCss: "",
}
```

- [ ] **Step 3: Extend persistence models**

Update:
- `backend/models/PageConfig.js`
  - add `templateStudio` metadata for page source/origin/theme tokens/layout shell
  - allow richer per-section metadata while preserving current render fields
- `backend/models/PageBuilderTemplate.js`
  - use `mongoose.models.PageBuilderTemplate || ...`
  - add fields for `templateSource`, `themeTokens`, and richer section payloads
- create:
  - `TemplateStudioImportJob`
  - `ReusableSectionTemplate`

- [ ] **Step 4: Run the model tests**

Run:
```powershell
node --test backend/tests/templateStudioSectionModel.test.js
```
Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add backend/models/PageConfig.js backend/models/PageBuilderTemplate.js backend/models/TemplateStudioImportJob.js backend/models/ReusableSectionTemplate.js backend/utils/templateStudioSectionModel.js backend/tests/templateStudioSectionModel.test.js
git commit -m "feat: define template studio data model"
```

### Task 2: Build The Import-And-Bind Backend Pipeline

**Files:**
- Create: `backend/utils/templateStudioImportPipeline.js`
- Create: `backend/utils/templateStudioBindingSuggestions.js`
- Modify: `backend/controllers/pageConfigController.js`
- Modify: `backend/routes/pageConfigRoutes.js`
- Modify: `backend/routes/platformAdminRoutes.js`
- Test: `backend/tests/templateStudioImportPipeline.test.js`
- Test: `backend/tests/templateStudioBindingSuggestions.test.js`

- [ ] **Step 1: Write the failing import and binding-suggestion tests**

Cover these cases:
- HTML/CSS page import becomes an ordered list of studio sections
- single section snippet import produces one reusable section candidate
- import results keep assets, text blocks, buttons, and notes
- a detected tours/blogs/testimonials block receives binding suggestions
- unsupported script-heavy markup is flagged instead of silently trusted

Run:
```powershell
node --test backend/tests/templateStudioImportPipeline.test.js backend/tests/templateStudioBindingSuggestions.test.js
```
Expected: FAIL because the pipeline does not exist.

- [ ] **Step 2: Implement source normalization and section detection**

In `backend/utils/templateStudioImportPipeline.js`, support these source types first:
- `html-css-page`
- `html-snippet`
- `reference-image`
- `template-package`

The output should include:

```js
{
  importJob,
  pageDraft,
  sectionDrafts,
  assets,
  warnings,
  unsupportedFragments,
}
```

Detection rules should classify likely:
- hero
- text/media
- cards/grid
- testimonials
- faq
- cta
- form
- gallery
- footer
- custom-html

- [ ] **Step 3: Implement CMS binding suggestions**

In `backend/utils/templateStudioBindingSuggestions.js`, emit explicit suggestions such as:
- `tourPackages`
- `blogs`
- `testimonials`
- `taxonomies.destinations`
- `siteSettings.contact`
- `inquiryForm`

Each suggestion should include:
- field path
- binding type: `static | dynamic-single | dynamic-collection | mixed`
- confidence
- rationale

- [ ] **Step 4: Expose new studio endpoints**

Add routes for:
- `POST /api/page-config/studio/import`
- `POST /api/page-config/studio/binding-suggestions`
- `POST /api/platform-admin/templates/import`

Keep current `import-source` and AI-variant routes working; they should either delegate into the new pipeline or continue as compatibility routes.

- [ ] **Step 5: Run the backend import tests**

Run:
```powershell
node --test backend/tests/templateStudioImportPipeline.test.js backend/tests/templateStudioBindingSuggestions.test.js
```
Expected: PASS.

- [ ] **Step 6: Commit**

```powershell
git add backend/utils/templateStudioImportPipeline.js backend/utils/templateStudioBindingSuggestions.js backend/controllers/pageConfigController.js backend/routes/pageConfigRoutes.js backend/routes/platformAdminRoutes.js backend/tests/templateStudioImportPipeline.test.js backend/tests/templateStudioBindingSuggestions.test.js
git commit -m "feat: add template studio import pipeline"
```

### Task 3: Add Studio Page Persistence And Template Publishing

**Files:**
- Create: `backend/utils/templateStudioPagePersistence.js`
- Create: `backend/utils/templateStudioTemplatePublishing.js`
- Modify: `backend/controllers/pageConfigController.js`
- Modify: `src/pageBuilder/templateMarketplace.js`
- Test: `backend/tests/templateStudioPagePersistence.test.js`
- Test: `backend/tests/templateStudioTemplatePublishing.test.js`

- [ ] **Step 1: Write the failing persistence/publishing tests**

Cover these cases:
- a studio page draft converts cleanly into `PageConfig`
- a stored `PageConfig` expands back into a studio page canvas
- saving an imported page as a template preserves reusable sections and theme tokens
- platform templates still merge correctly into the marketplace registry

Run:
```powershell
node --test backend/tests/templateStudioPagePersistence.test.js backend/tests/templateStudioTemplatePublishing.test.js
```
Expected: FAIL because the conversion/publishing utilities do not exist.

- [ ] **Step 2: Implement page-to-canvas conversion**

In `backend/utils/templateStudioPagePersistence.js`:
- convert current `PageConfig.sections[]` into studio nodes
- preserve legacy render fields used by public pages
- add `templateStudio.layout`, `templateStudio.themeTokens`, and `templateStudio.sourceSummary`

- [ ] **Step 3: Implement template publishing helpers**

In `backend/utils/templateStudioTemplatePublishing.js`, support:
- save full page as platform template
- save selected section as reusable library entry
- clone page as tenant variant

Keep generated payloads compatible with:
- `buildTemplatePageConfigPayload`
- `resolveTemplateCatalogForTenant`
- current template marketplace cards

- [ ] **Step 4: Run the persistence tests**

Run:
```powershell
node --test backend/tests/templateStudioPagePersistence.test.js backend/tests/templateStudioTemplatePublishing.test.js
```
Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add backend/utils/templateStudioPagePersistence.js backend/utils/templateStudioTemplatePublishing.js backend/controllers/pageConfigController.js src/pageBuilder/templateMarketplace.js backend/tests/templateStudioPagePersistence.test.js backend/tests/templateStudioTemplatePublishing.test.js
git commit -m "feat: add template studio persistence and publishing"
```

### Task 4: Replace The Current Builder Shell With A Real Studio Layout

**Files:**
- Create: `src/components/Admin/TemplateStudio/TemplateStudioShell.jsx`
- Create: `src/components/Admin/TemplateStudio/StudioTopBar.jsx`
- Create: `src/components/Admin/TemplateStudio/StudioSidebar.jsx`
- Create: `src/components/Admin/TemplateStudio/InspectorPane.jsx`
- Create: `src/components/Admin/TemplateStudio/studioTypes.js`
- Modify: `src/components/Admin/PageBuilderManager.jsx`
- Modify: `src/services/api.js`
- Test: `src/components/Admin/TemplateStudio/TemplateStudioShell.test.jsx`

- [ ] **Step 1: Write the failing studio shell test**

Cover these cases:
- the new shell renders a left library rail, center canvas, and right inspector
- the top bar includes `Import`, `AI Create`, `Add Section`, `Preview`, `Save`, and `Publish`
- the current `PageBuilderManager` mounts the new shell instead of the old monolithic layout for supported page types

Run:
```powershell
node --test src/components/Admin/TemplateStudio/TemplateStudioShell.test.jsx
```
Expected: FAIL because the new shell components do not exist.

- [ ] **Step 2: Implement the studio shell**

Build this structure:
- left sidebar: pages, templates, imports, sections, assets, CMS sources, history
- main area: canvas
- right rail: inspector tabs
- top bar: import/create/preview/save/publish controls

Design rule:
- no long stacked admin forms in the main flow
- selection-based editing through the inspector

- [ ] **Step 3: Convert PageBuilderManager into a compatibility launcher**

`PageBuilderManager.jsx` should:
- keep existing data loading and permissions where useful
- launch `TemplateStudioShell`
- preserve old builder behaviors only as fallbacks during migration

- [ ] **Step 4: Add API helpers**

In `src/services/api.js`, add helpers for:
- fetch studio page
- save studio page
- import studio source
- fetch reusable sections
- save reusable section
- request binding suggestions
- publish studio template

- [ ] **Step 5: Run the shell test**

Run:
```powershell
node --test src/components/Admin/TemplateStudio/TemplateStudioShell.test.jsx
```
Expected: PASS.

- [ ] **Step 6: Commit**

```powershell
git add src/components/Admin/PageBuilderManager.jsx src/components/Admin/TemplateStudio/TemplateStudioShell.jsx src/components/Admin/TemplateStudio/StudioTopBar.jsx src/components/Admin/TemplateStudio/StudioSidebar.jsx src/components/Admin/TemplateStudio/InspectorPane.jsx src/components/Admin/TemplateStudio/studioTypes.js src/services/api.js src/components/Admin/TemplateStudio/TemplateStudioShell.test.jsx
git commit -m "feat: add template studio shell"
```

### Task 5: Build Elementor-Style Canvas Editing And Section Library

**Files:**
- Create: `src/components/Admin/TemplateStudio/CanvasPane.jsx`
- Create: `src/components/Admin/TemplateStudio/CanvasSectionCard.jsx`
- Create: `src/components/Admin/TemplateStudio/LibraryPane.jsx`
- Create: `src/components/Admin/TemplateStudio/studioReducers.js`
- Test: `src/components/Admin/TemplateStudio/studioReducers.test.js`

- [ ] **Step 1: Write the failing reducer tests**

Cover these cases:
- insert a section above/below another section
- move a section up/down
- drag reorder updates section order
- replace an imported section with a reusable section
- duplicate and delete preserve clean ordering

Run:
```powershell
node --test src/components/Admin/TemplateStudio/studioReducers.test.js
```
Expected: FAIL because the reducer does not exist.

- [ ] **Step 2: Implement the canvas state reducer**

Add actions:
- `selectSection`
- `insertSectionAbove`
- `insertSectionBelow`
- `replaceSection`
- `moveSection`
- `reorderSections`
- `duplicateSection`
- `deleteSection`
- `toggleVisibility`
- `saveAsReusable`

- [ ] **Step 3: Implement the visual canvas**

`CanvasPane.jsx` should render:
- section boundaries
- insert lines between sections
- drag handles
- hover controls
- selected-section highlight
- empty-state affordance for blank pages

`LibraryPane.jsx` should render:
- reusable sections
- imported section candidates
- built-in templates
- AI section presets

- [ ] **Step 4: Run reducer tests**

Run:
```powershell
node --test src/components/Admin/TemplateStudio/studioReducers.test.js
```
Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add src/components/Admin/TemplateStudio/CanvasPane.jsx src/components/Admin/TemplateStudio/CanvasSectionCard.jsx src/components/Admin/TemplateStudio/LibraryPane.jsx src/components/Admin/TemplateStudio/studioReducers.js src/components/Admin/TemplateStudio/studioReducers.test.js
git commit -m "feat: add template studio canvas editing"
```

### Task 6: Implement Import Lab And CMS Binding Inspector

**Files:**
- Create: `src/components/Admin/TemplateStudio/ImportLab.jsx`
- Create: `src/components/Admin/TemplateStudio/BindingInspector.jsx`
- Modify: `src/components/Admin/TemplateStudio/InspectorPane.jsx`
- Modify: `src/components/Admin/TemplateStudio/TemplateStudioShell.jsx`
- Modify: `src/services/api.js`
- Test: `src/components/Admin/TemplateStudio/TemplateStudioShell.test.jsx`

- [ ] **Step 1: Extend the failing studio shell test**

Add coverage for:
- opening Import Lab from the top bar
- pasting HTML/CSS or a snippet into the source intake view
- showing detected sections and warnings
- selecting a section and seeing binding controls in the inspector

Run:
```powershell
node --test src/components/Admin/TemplateStudio/TemplateStudioShell.test.jsx
```
Expected: FAIL until the import/binding UI is added.

- [ ] **Step 2: Implement Import Lab**

The import flow should be:
- source type selector
- source input area
- analysis state
- detected sections/assets preview
- warnings/unsupported fragments
- import into current page or save as draft page

First source types:
- HTML/CSS page
- section snippet
- reference image metadata
- template package payload

- [ ] **Step 3: Implement the binding inspector**

For a selected section, allow:
- choose binding mode: `static`, `dynamic-single`, `dynamic-collection`, `mixed`
- map field paths
- preview CMS source
- confirm unresolved fields
- keep some fields static while others are dynamic

The inspector must support common platform data:
- tours
- blogs
- testimonials
- destinations
- site settings
- inquiry/contact

- [ ] **Step 4: Run the studio shell tests again**

Run:
```powershell
node --test src/components/Admin/TemplateStudio/TemplateStudioShell.test.jsx
```
Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add src/components/Admin/TemplateStudio/ImportLab.jsx src/components/Admin/TemplateStudio/BindingInspector.jsx src/components/Admin/TemplateStudio/InspectorPane.jsx src/components/Admin/TemplateStudio/TemplateStudioShell.jsx src/services/api.js src/components/Admin/TemplateStudio/TemplateStudioShell.test.jsx
git commit -m "feat: add template studio import lab and bindings"
```

### Task 7: Add Advanced Visual Polish, Responsive Preview, And Backward-Safe Rollout

**Files:**
- Modify: `src/components/Admin/TemplateStudio/TemplateStudioShell.jsx`
- Modify: `src/components/Admin/TemplateStudio/CanvasPane.jsx`
- Modify: `src/components/Admin/TemplateStudio/InspectorPane.jsx`
- Modify: `src/components/Admin/PageBuilderManager.jsx`
- Modify: `README.md`

- [ ] **Step 1: Add premium studio polish**

Make the UI feel closer to Stitch/Elementor by adding:
- neutral workspace background
- white page canvas with depth
- sticky right inspector
- compact toolbars
- stronger section-selection state
- responsive mode switcher
- undo/redo affordances
- clearer empty states and inline hints

- [ ] **Step 2: Add rollout guardrails**

Keep rollout safe by:
- launching the new Template Studio only inside platform/tenant admin builder flows
- preserving old `PageConfig` public rendering
- leaving old import/template routes in place until the studio is fully verified

- [ ] **Step 3: Update docs**

In `README.md`, document:
- what Template Studio now supports
- supported import types
- that imported, AI, and manual sections now share one section system
- how to verify studio behavior

- [ ] **Step 4: Commit**

```powershell
git add src/components/Admin/TemplateStudio/TemplateStudioShell.jsx src/components/Admin/TemplateStudio/CanvasPane.jsx src/components/Admin/TemplateStudio/InspectorPane.jsx src/components/Admin/PageBuilderManager.jsx README.md
git commit -m "feat: polish template studio workflow"
```

### Task 8: Full Verification

**Commands:**
- `node --test backend/tests/templateStudioSectionModel.test.js backend/tests/templateStudioImportPipeline.test.js backend/tests/templateStudioBindingSuggestions.test.js backend/tests/templateStudioPagePersistence.test.js backend/tests/templateStudioTemplatePublishing.test.js`
- `node --test src/components/Admin/TemplateStudio/studioReducers.test.js src/components/Admin/TemplateStudio/TemplateStudioShell.test.jsx`
- `node --test backend/tests/pageBuilderTemplateApplication.test.js backend/tests/platformTemplateRegistry.test.js backend/tests/pageBuilderAiVariants.test.js backend/tests/pageBuilderSourceImport.test.js`
- `npm run build`

- [ ] **Step 1: Run backend studio tests**

Run:
```powershell
node --test backend/tests/templateStudioSectionModel.test.js backend/tests/templateStudioImportPipeline.test.js backend/tests/templateStudioBindingSuggestions.test.js backend/tests/templateStudioPagePersistence.test.js backend/tests/templateStudioTemplatePublishing.test.js
```
Expected: PASS.

- [ ] **Step 2: Run frontend studio tests**

Run:
```powershell
node --test src/components/Admin/TemplateStudio/studioReducers.test.js src/components/Admin/TemplateStudio/TemplateStudioShell.test.jsx
```
Expected: PASS.

- [ ] **Step 3: Run compatibility regression tests**

Run:
```powershell
node --test backend/tests/pageBuilderTemplateApplication.test.js backend/tests/platformTemplateRegistry.test.js backend/tests/pageBuilderAiVariants.test.js backend/tests/pageBuilderSourceImport.test.js
```
Expected: PASS, proving the new studio did not break current template application/import behavior.

- [ ] **Step 4: Run production build**

Run:
```powershell
npm run build
```
Expected: PASS.

- [ ] **Step 5: Final commit**

```powershell
git add .
git commit -m "feat: deliver template studio import and bind workflow"
```

---

## Self-Review

**Spec coverage**
- Import template/page/section sources: covered in Tasks 2 and 6.
- Detect sections, pages, assets, and styles: covered in Task 2.
- Bind imported content to CMS sources: covered in Tasks 2 and 6.
- Preview inside platform builder: covered in Tasks 4, 5, and 6.
- Adjust CSS and styling per customer: covered in Tasks 1, 4, 6, and 7.
- Mix imported, AI, and manual sections on one page with insert/reorder freedom: covered in Tasks 1, 5, and 6.
- Make the UI feel more advanced like Stitch/Elementor: covered in Tasks 4, 5, and 7.

**Placeholder scan**
- No `TODO`, `TBD`, or “similar to previous task” placeholders were left.
- All tasks identify exact files and concrete commands.

**Type consistency**
- Shared page concept: `PageConfig` with `templateStudio` metadata.
- Shared section concept: studio section node with `sourceType`, `content`, `styles`, and `bindings`.
- Library concept: `ReusableSectionTemplate`.
- Import pipeline concept: `TemplateStudioImportJob`.

These names are used consistently across all tasks.

## Execution Handoff

**Plan complete and saved to `docs/superpowers/plans/2026-05-18-template-studio-import-and-bind.md`. Two execution options:**

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
