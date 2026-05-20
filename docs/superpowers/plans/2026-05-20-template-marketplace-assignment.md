# Template Marketplace Assignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish the `Template Marketplace` ownership model so platform admins can assign one active master template to a tenant, tenants can personalize only through `Template Studio`, and the public tenant site renders the assigned master plus tenant personalization without mutating platform-owned templates.

**Architecture:** Layer a new tenant assignment record and assignment-aware personalization flow on top of the existing `PageBuilderTemplate`, built-in template catalog, `PageBuilderManager`, and `Template Studio`. Keep master templates platform-owned. Store tenant edits in a separate personalization layer tied to the active assignment instead of forking the master template. Resolve public tenant rendering through `assignment -> master template -> tenant personalization -> tenant CMS data`.

**Tech Stack:** Express, Mongoose, existing tenant/platform admin routes, React + Vite admin UI, existing `PageBuilderTemplate` and `Template Studio` foundations, Node test runner

---

## File Structure

### New backend files

- Create: `backend/models/TenantTemplateAssignment.js`
  - one-active-template-per-tenant assignment record
  - assignment history metadata
- Create: `backend/utils/templateAssignmentResolution.js`
  - resolve active assignment
  - combine master template + personalization metadata
- Create: `backend/tests/templateAssignmentResolution.test.js`
  - active assignment logic
  - historical assignment behavior

### Existing backend files to modify

- Modify: `backend/models/Tenant.js`
  - lightweight references or summary fields if needed for quick assignment status
- Modify: `backend/models/PageConfig.js`
  - persist template-assignment-aware personalization metadata
- Modify: `backend/models/PageBuilderTemplate.js`
  - add flags for assignment visibility and locked/editable structure rules
- Modify: `backend/controllers/pageConfigController.js`
  - load and save assignment-aware studio pages
- Modify: `backend/routes/pageConfigRoutes.js`
  - expose tenant-facing studio reads/writes with assignment context
- Modify: `backend/routes/platformAdminRoutes.js`
  - add platform-admin assignment APIs
- Modify: `backend/tests/pageConfigTemplateSource.test.js`
  - extend source metadata expectations to include assignment-aware source information

### New frontend files

- Create: `src/components/Admin/TemplateAssignments/TemplateAssignmentManager.jsx`
  - platform-admin assignment UI
- Create: `src/components/Admin/TemplateAssignments/templateAssignmentState.js`
  - pure helpers for assignment table/filter/state shaping
- Create: `src/components/Admin/TemplateAssignments/templateAssignmentState.test.js`
  - state/helper tests

### Existing frontend files to modify

- Modify: `src/services/api.js`
  - assignment CRUD helpers
  - active-assignment fetch helpers
- Modify: `src/pageBuilder/templateMarketplace.js`
  - active assignment resolution helpers
  - read-only assigned-template status shaping
- Modify: `src/pages/TemplateMarketplace.jsx`
  - assignment status display for platform-owned templates
- Modify: `src/pages/PlatformAdminDashboard.jsx`
  - mount assignment manager in the existing template studio/template area
- Modify: `src/components/Admin/PageBuilderManager.jsx`
  - load active assigned template
  - pass assignment-aware mode into `Template Studio`
- Modify: `src/components/Admin/TemplateStudio/TemplateStudioShell.jsx`
  - assigned-template banner
  - locked/editable mode handling
- Modify: `src/components/Admin/TemplateStudio/studioTypes.js`
  - assignment-aware page and section metadata helpers
- Modify: `src/components/Admin/TemplateStudio/studioReducers.js`
  - guard locked-section mutations where required

### Existing files to reference

- `src/pageBuilder/templateMarketplace.test.js`
- `backend/tests/templateStudioPagePersistence.test.js`
- `src/components/Admin/TemplateStudio/studioReducers.test.js`
- `src/components/Admin/TemplateStudio/TemplateStudioShell.test.jsx`

---

## Implementation Strategy

Ship this in three tasks:

1. create backend assignment truth and active-assignment resolution
2. add platform-admin assignment management UI
3. make `Template Studio` and tenant-facing rendering assignment-aware

This keeps ownership truth stable before UI personalization behavior depends on it.

---

### Task 1: Add tenant template assignment truth and resolution

**Files:**
- Create: `backend/models/TenantTemplateAssignment.js`
- Create: `backend/utils/templateAssignmentResolution.js`
- Create: `backend/tests/templateAssignmentResolution.test.js`
- Modify: `backend/models/PageBuilderTemplate.js`
- Modify: `backend/models/PageConfig.js`

- [ ] **Step 1: Write failing backend tests first**

Cover:
- one active assignment per tenant
- historical assignments remain stored when a new template becomes active
- active assignment resolves the correct master template id
- tenant personalization metadata stays separate from master-template identity

Example coverage shape:

```js
import test from "node:test";
import assert from "node:assert/strict";

import {
  resolveActiveTemplateAssignment,
  buildAssignmentAwareTemplateSource,
} from "../utils/templateAssignmentResolution.js";

test("resolveActiveTemplateAssignment returns the active assignment only", () => {
  const result = resolveActiveTemplateAssignment([
    { tenantId: "t1", masterTemplateId: "alpha", active: false },
    { tenantId: "t1", masterTemplateId: "bravo", active: true },
  ]);

  assert.equal(result.masterTemplateId, "bravo");
});
```

- [ ] **Step 2: Run the test and confirm the expected initial failure**

Run:

`node --test backend/tests/templateAssignmentResolution.test.js`

Expected:
- module-not-found or missing export failure before implementation exists

- [ ] **Step 3: Implement `TenantTemplateAssignment`**

The model should include:
- `tenantId`
- `masterTemplateId`
- `active`
- `assignmentStatus`
- `assignedAt`
- `assignedBy`
- `endedAt`
- `note`

Rules:
- keep historical records
- enforce only one active assignment per tenant through route/controller logic

- [ ] **Step 4: Add assignment resolution helpers**

In `templateAssignmentResolution.js`, implement helpers like:
- `resolveActiveTemplateAssignment(assignments)`
- `buildAssignmentAwareTemplateSource({ assignment, masterTemplate, personalization })`
- `isSectionLocked(section)`
- `isSectionPersonalizationAllowed(section)`

- [ ] **Step 5: Extend existing models just enough**

Update `PageBuilderTemplate.js` to support:
- assignment visibility flags
- editable/locked section metadata defaults if not already present

Update `PageConfig.js` to support:
- active assignment metadata
- personalization-source metadata

- [ ] **Step 6: Run backend tests**

Run:

`node --test backend/tests/templateAssignmentResolution.test.js backend/tests/pageConfigTemplateSource.test.js`

Expected:
- PASS

---

### Task 2: Add platform-admin assignment APIs and management UI

**Files:**
- Modify: `backend/routes/platformAdminRoutes.js`
- Modify: `src/services/api.js`
- Create: `src/components/Admin/TemplateAssignments/TemplateAssignmentManager.jsx`
- Create: `src/components/Admin/TemplateAssignments/templateAssignmentState.js`
- Create: `src/components/Admin/TemplateAssignments/templateAssignmentState.test.js`
- Modify: `src/pages/PlatformAdminDashboard.jsx`
- Modify: `src/pages/TemplateMarketplace.jsx`

- [ ] **Step 1: Write failing frontend state tests**

Cover:
- grouping templates by assignment state
- shaping the active tenant-assignment summary
- filtering tenants/templates in the assignment manager

Run:

`node --test src/components/Admin/TemplateAssignments/templateAssignmentState.test.js`

Expected:
- FAIL because the helper module does not exist yet

- [ ] **Step 2: Add platform-admin assignment API endpoints**

Add routes for:
- list tenant template assignments
- assign template to tenant
- switch active assignment
- read one tenant’s active assignment

Keep the control model platform-admin-only.

- [ ] **Step 3: Implement assignment manager UI**

`TemplateAssignmentManager.jsx` should let platform admin:
- browse templates
- browse tenants
- see current active assignment
- assign/switch template
- view assignment history at a lightweight level

This should live beside the existing platform template management flow, not replace it.

- [ ] **Step 4: Surface assignment state in template marketplace/admin views**

On platform-facing template marketplace/admin surfaces, show:
- assigned to X tenants
- currently active on Y tenants
- available / published / draft state

On tenant/public template views, do not expose platform-only controls.

- [ ] **Step 5: Run state tests and build**

Run:

`node --test src/components/Admin/TemplateAssignments/templateAssignmentState.test.js`

Then:

`npm run build`

Expected:
- PASS

---

### Task 3: Make Template Studio and tenant rendering assignment-aware

**Files:**
- Modify: `backend/controllers/pageConfigController.js`
- Modify: `backend/routes/pageConfigRoutes.js`
- Modify: `src/components/Admin/PageBuilderManager.jsx`
- Modify: `src/components/Admin/TemplateStudio/TemplateStudioShell.jsx`
- Modify: `src/components/Admin/TemplateStudio/studioTypes.js`
- Modify: `src/components/Admin/TemplateStudio/studioReducers.js`
- Modify: `src/pageBuilder/templateMarketplace.js`
- Modify: `src/pageBuilder/templateMarketplace.test.js`
- Modify: `src/components/Admin/TemplateStudio/TemplateStudioShell.test.jsx`
- Modify: `src/components/Admin/TemplateStudio/studioReducers.test.js`
- Modify: `backend/tests/templateStudioPagePersistence.test.js`

- [ ] **Step 1: Add failing tests for assignment-aware studio behavior**

Cover:
- assigned-template banner rendering
- locked sections cannot be deleted or structurally mutated
- editable sections still allow content/style/binding changes
- personalization metadata resolves separately from master template source

Run:

`node --test src/pageBuilder/templateMarketplace.test.js src/components/Admin/TemplateStudio/studioReducers.test.js backend/tests/templateStudioPagePersistence.test.js`

Expected:
- FAIL because assignment-aware behavior is not implemented yet

- [ ] **Step 2: Load active assignment into tenant builder/studio**

Update `PageBuilderManager.jsx` so tenant studio flow:
- fetches active assigned template
- loads the master baseline
- overlays tenant personalization
- passes assignment mode into `TemplateStudioShell`

- [ ] **Step 3: Add assignment-aware studio UX**

In `TemplateStudioShell.jsx`, show:
- assigned-template banner
- platform-owned / personalization-only messaging
- locked vs editable status affordances

In `studioReducers.js`, enforce:
- no destructive structural edits on locked sections
- content/style/binding edits allowed when the section permits them

- [ ] **Step 4: Make page/template helpers assignment-aware**

Update `templateMarketplace.js` helpers so they can:
- resolve tenant active template
- distinguish master template vs personalization layer
- keep tenant-facing template status clearly read-only

- [ ] **Step 5: Persist personalization separately from master identity**

Update page-config persistence so a saved studio page records:
- active assignment id
- master template id
- personalization overrides
- source metadata for rollback/reference

Do not let tenant save operations mutate the underlying master template payload.

- [ ] **Step 6: Run verification**

Run:

`node --test src/pageBuilder/templateMarketplace.test.js src/components/Admin/TemplateStudio/studioReducers.test.js src/components/Admin/TemplateStudio/TemplateStudioShell.test.jsx backend/tests/templateStudioPagePersistence.test.js`

Then:

`npm run build`

Expected:
- PASS

---

## UX Acceptance Checklist

- [ ] Platform admin can assign one active template to a tenant
- [ ] Platform admin can switch templates without deleting historical assignment context
- [ ] Tenant sees which template is assigned
- [ ] Tenant can personalize only inside approved `Template Studio` boundaries
- [ ] Locked structure cannot be casually broken
- [ ] Public tenant rendering reflects assigned master + tenant personalization

---

## Verification

### Required automated verification

- `node --test backend/tests/templateAssignmentResolution.test.js backend/tests/pageConfigTemplateSource.test.js`
- `node --test src/components/Admin/TemplateAssignments/templateAssignmentState.test.js`
- `node --test src/pageBuilder/templateMarketplace.test.js src/components/Admin/TemplateStudio/studioReducers.test.js src/components/Admin/TemplateStudio/TemplateStudioShell.test.jsx backend/tests/templateStudioPagePersistence.test.js`
- `npm run build`

### Required manual verification

- platform admin opens template management and assigns a template to a tenant
- tenant opens `Template Studio` and sees assignment-aware editing mode
- locked sections are visibly constrained
- editable theme/content/bindings still work
- public tenant site reflects the assigned template baseline

---

## Notes For Implementation

- keep this phase platform-admin-owned; do not reintroduce tenant purchase logic
- favor safe reassignment over smart auto-remapping
- preserve the existing template marketplace and `Template Studio` investment
- keep the master template cleanly separated from tenant personalization records
