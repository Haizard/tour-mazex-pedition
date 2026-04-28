# Phase 2 Operations Core Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the guide/driver, accommodation, and airport pickup modules into a more operationally complete logistics layer with calendar visibility, conflict-aware dashboards, outbound dispatch drafts, and trip execution timeline summaries.

**Architecture:** This phase builds on the existing Express + React + MongoDB operations modules instead of introducing new infrastructure. We keep MongoDB as the current operational store, expand the utility layer with richer scheduling and timeline helpers, expose those through existing dashboard routes, and surface them in admin managers so operators can act on conflicts and upcoming trips.

**Tech Stack:** React 18, Vite, Node.js, Express, MongoDB/Mongoose, existing admin UI, existing Node test runner

---

## File Structure

**Reference:**

- `MASTER_IMPLEMENTATION_BLUEPRINT.md`
- `docs/superpowers/plans/2026-04-28-tourism-infrastructure-master-roadmap.md`

**Likely Modify:**

- `backend/models/GuideDriver.js`
- `backend/models/AccommodationReservation.js`
- `backend/models/AirportPickup.js`
- `backend/routes/guideDriverRoutes.js`
- `backend/routes/accommodationRoutes.js`
- `backend/routes/airportPickupRoutes.js`
- `backend/utils/guideDriverPlanning.js`
- `backend/utils/accommodationCoordination.js`
- `backend/utils/airportPickupCoordination.js`
- `backend/tests/guideDriverPlanning.test.js`
- `backend/tests/accommodationCoordination.test.js`
- `backend/tests/airportPickupCoordination.test.js`
- `src/components/Admin/GuideDriverManager.jsx`
- `src/components/Admin/AccommodationManager.jsx`
- `src/components/Admin/AirportPickupManager.jsx`

---

## Task 1: Add calendar and timeline utility coverage

**Files:**

- Modify: `backend/utils/guideDriverPlanning.js`
- Modify: `backend/utils/accommodationCoordination.js`
- Modify: `backend/utils/airportPickupCoordination.js`
- Modify: `backend/tests/guideDriverPlanning.test.js`
- Modify: `backend/tests/accommodationCoordination.test.js`
- Modify: `backend/tests/airportPickupCoordination.test.js`

- [ ] **Step 1: Write failing tests for calendar and timeline outputs**

Add tests for:

- guide and driver assignment calendar rows
- accommodation stay timeline rows
- airport arrival timeline rows

- [ ] **Step 2: Run tests to verify the new expectations fail**

Run:

```bash
node --test backend/tests/guideDriverPlanning.test.js backend/tests/accommodationCoordination.test.js backend/tests/airportPickupCoordination.test.js
```

Expected: new tests fail because the new helper outputs do not exist yet

- [ ] **Step 3: Implement minimal utility helpers**

Add helpers such as:

- `buildGuideDriverCalendarView`
- `buildAccommodationStayTimeline`
- `buildAirportArrivalTimeline`

- [ ] **Step 4: Re-run the tests**

Run:

```bash
node --test backend/tests/guideDriverPlanning.test.js backend/tests/accommodationCoordination.test.js backend/tests/airportPickupCoordination.test.js
```

Expected: utility tests pass

---

## Task 2: Add outbound coordination drafts and notification-ready metadata

**Files:**

- Modify: `backend/models/GuideDriver.js`
- Modify: `backend/models/AccommodationReservation.js`
- Modify: `backend/models/AirportPickup.js`
- Modify: `backend/routes/guideDriverRoutes.js`
- Modify: `backend/routes/accommodationRoutes.js`
- Modify: `backend/routes/airportPickupRoutes.js`

- [ ] **Step 1: Add lightweight notification metadata fields**

Add fields like:

- `lastDispatchSharedAt`
- `lastSupplierMessageSharedAt`
- `lastDriverBriefSharedAt`

- [ ] **Step 2: Expose draft-friendly route responses**

Route responses should include:

- assignment summary
- dispatch note or supplier message draft
- notification-ready flags

- [ ] **Step 3: Verify route modules still load**

Run:

```bash
node -e "import('./backend/routes/guideDriverRoutes.js').then(() => console.log('guide-driver-routes-ok'))"
node -e "import('./backend/routes/accommodationRoutes.js').then(() => console.log('accommodation-routes-ok'))"
node -e "import('./backend/routes/airportPickupRoutes.js').then(() => console.log('airport-pickup-routes-ok'))"
```

Expected: each route prints its ok marker

---

## Task 3: Expand dashboard payloads with conflict and timeline views

**Files:**

- Modify: `backend/routes/guideDriverRoutes.js`
- Modify: `backend/routes/accommodationRoutes.js`
- Modify: `backend/routes/airportPickupRoutes.js`

- [ ] **Step 1: Extend dashboard endpoints**

Dashboard payloads should include:

- calendar or timeline views
- conflict counters
- records that need action today
- draft-ready dispatch communication content

- [ ] **Step 2: Keep outputs current-architecture friendly**

Do not add background infrastructure in this phase. All outputs should be derivable from current Mongo-backed documents and utility functions.

---

## Task 4: Surface the new operations depth in admin managers

**Files:**

- Modify: `src/components/Admin/GuideDriverManager.jsx`
- Modify: `src/components/Admin/AccommodationManager.jsx`
- Modify: `src/components/Admin/AirportPickupManager.jsx`

- [ ] **Step 1: Add calendar or timeline visibility**

Each manager should display:

- upcoming assignments or stays
- conflicts needing action
- quick visibility into upcoming operations

- [ ] **Step 2: Add outbound draft visibility**

Each manager should surface:

- guide or driver dispatch note
- accommodation supplier message draft
- airport pickup dispatch brief

- [ ] **Step 3: Keep UI edits targeted**

Do not redesign the whole dashboard. Show the new operational value inside existing card and board structures.

---

## Task 5: Verify the operations tranche

**Files:**

- Verify: `backend/tests/guideDriverPlanning.test.js`
- Verify: `backend/tests/accommodationCoordination.test.js`
- Verify: `backend/tests/airportPickupCoordination.test.js`

- [ ] **Step 1: Run targeted backend tests**

Run:

```bash
node --test backend/tests/guideDriverPlanning.test.js backend/tests/accommodationCoordination.test.js backend/tests/airportPickupCoordination.test.js
```

Expected: all tests pass

- [ ] **Step 2: Run targeted lint on changed files**

Run:

```bash
npx eslint backend/models/GuideDriver.js backend/models/AccommodationReservation.js backend/models/AirportPickup.js backend/routes/guideDriverRoutes.js backend/routes/accommodationRoutes.js backend/routes/airportPickupRoutes.js backend/utils/guideDriverPlanning.js backend/utils/accommodationCoordination.js backend/utils/airportPickupCoordination.js backend/tests/guideDriverPlanning.test.js backend/tests/accommodationCoordination.test.js backend/tests/airportPickupCoordination.test.js src/components/Admin/GuideDriverManager.jsx src/components/Admin/AccommodationManager.jsx src/components/Admin/AirportPickupManager.jsx
```

Expected: targeted files pass lint

---

## Immediate Execution Order

1. Utility-level calendar and timeline tests
2. Utility implementation
3. Notification metadata and route enrichment
4. Dashboard payload expansion
5. Admin UI visibility
6. Verification

---

## Handoff

This is the Phase 2 execution plan. Once it is implemented and verified, the next phase is:

`docs/superpowers/plans/2026-04-28-phase-3-business-truth-migration.md`
