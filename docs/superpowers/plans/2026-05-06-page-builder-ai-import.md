# Page Builder AI Import Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add layout-admin tools that generate improved page/section variants from existing builder data and import pasted HTML/CSS as editable page-builder sections.

**Architecture:** Keep the existing `PageConfig.sections[]` contract as the source of truth. Backend utilities convert AI variant requests and pasted source code into safe section objects, while the frontend exposes those utilities inside the existing page-builder studio.

**Tech Stack:** Express, Mongoose page configs, React/Vite admin UI, section registry rendering, Node test runner.

---

### Task 1: Backend Contracts

**Files:**
- Create: `backend/utils/pageBuilderAiVariants.js`
- Create: `backend/utils/pageBuilderSourceImport.js`
- Modify: `backend/controllers/pageConfigController.js`
- Modify: `backend/routes/pageConfigRoutes.js`
- Test: `backend/tests/pageBuilderAiVariants.test.js`
- Test: `backend/tests/pageBuilderSourceImport.test.js`

- [ ] Write failing tests for variant payload generation and HTML/CSS import conversion.
- [ ] Implement deterministic fallback AI variants that preserve supported section types and produce improved `contentConfig`/`styleConfig`.
- [ ] Implement source import conversion that sanitizes unsafe markup, scopes CSS, extracts editable text/image/link fields, and returns a `customHtml` section.
- [ ] Add authenticated routes for `POST /api/page-config/:pageType/ai-variants` and `POST /api/page-config/import-source`.

### Task 2: Renderer Integration

**Files:**
- Create: `src/sections/custom/CustomHtmlSection.jsx`
- Modify: `src/sections/registry/sectionRegistry.jsx`
- Test through frontend build and route imports.

- [ ] Register `customHtml` with editor fields for title, body text, image URL, CTA label, CTA href, HTML template, scoped CSS, and imported notes.
- [ ] Render imported sections with scoped CSS and variable substitution from editable `contentConfig`.

### Task 3: Admin Builder UI

**Files:**
- Modify: `src/services/api.js`
- Modify: `src/components/Admin/PageBuilderManager.jsx`

- [ ] Add API helpers for AI variants and source import.
- [ ] Add two layout-only tools: `AI Variants` and `Import Code`.
- [ ] Let admins preview/apply AI variants to the selected section or full page.
- [ ] Let admins paste HTML/CSS and insert the converted `customHtml` section.

### Task 4: Verification

**Commands:**
- `node --test backend/tests/pageBuilderAiVariants.test.js backend/tests/pageBuilderSourceImport.test.js`
- `node -e "import('./backend/routes/pageConfigRoutes.js').then(() => console.log('page-config-routes-ok')).catch((error) => { console.error(error); process.exit(1); })"`
- `npx eslint backend/utils/pageBuilderAiVariants.js backend/utils/pageBuilderSourceImport.js backend/controllers/pageConfigController.js backend/routes/pageConfigRoutes.js backend/tests/pageBuilderAiVariants.test.js backend/tests/pageBuilderSourceImport.test.js src/sections/custom/CustomHtmlSection.jsx src/sections/registry/sectionRegistry.jsx src/services/api.js src/components/Admin/PageBuilderManager.jsx`
- `npm run build`

