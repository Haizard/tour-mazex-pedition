# Phase 3 Business Truth Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Introduce the multi-database foundation without breaking the live Mongo-backed product by codifying ownership boundaries, adding shadow-migration metadata to business entities, hardening infrastructure visibility, and moving file handling onto an object-storage-ready boundary.

**Architecture:** This phase does not attempt a one-shot rewrite. MongoDB remains the active write store for the running product while PostgreSQL, Redis, pgvector, and S3-compatible storage are introduced as explicit target systems in code, readiness reporting, and migration metadata. The codebase should leave this phase with a trustworthy map of where truth is going, what is still legacy-owned, and which records are ready for shadow migration.

**Tech Stack:** React 18, Vite, Node.js, Express, MongoDB/Mongoose current runtime, target PostgreSQL, Redis, pgvector, S3-compatible object storage, Node test runner

---

## File Structure

**Reference:**

- `MASTER_IMPLEMENTATION_BLUEPRINT.md`
- `docs/superpowers/plans/2026-04-28-tourism-infrastructure-master-roadmap.md`
- `backend/utils/database.js`

**Create:**

- `docs/superpowers/plans/2026-04-28-phase-3-business-truth-migration.md`
- `backend/utils/businessTruthRegistry.js`
- `backend/utils/businessTruthSync.js`
- `backend/utils/infrastructureHealth.js`
- `backend/utils/objectStorage.js`
- `backend/routes/infrastructureRoutes.js`
- `backend/tests/businessTruthRegistry.test.js`
- `backend/tests/businessTruthSync.test.js`
- `backend/tests/infrastructureHealth.test.js`
- `backend/tests/objectStorage.test.js`
- `src/components/Admin/InfrastructureReadinessManager.jsx`

**Modify:**

- `backend/models/Booking.js`
- `backend/models/QuoteProposal.js`
- `backend/models/PaymentTransaction.js`
- `backend/models/GuideDriver.js`
- `backend/models/AccommodationReservation.js`
- `backend/models/AirportPickup.js`
- `backend/models/Media.js`
- `backend/routes/mediaRoutes.js`
- `backend/server.js`
- `src/components/Admin/AdminSidebar.jsx`
- `src/pages/AdminDashboard.jsx`
- `src/services/api.js`

---

## Task 1: Codify source-of-truth ownership

**Files:**

- Create: `backend/utils/businessTruthRegistry.js`
- Create: `backend/tests/businessTruthRegistry.test.js`

- [ ] **Step 1: Write failing tests for the ownership registry**

Add tests that prove:

- business-truth entities are listed in safe cutover order
- each entity declares current owner, target owner, and shadow-migration mode
- infrastructure services declare their intended responsibilities

- [ ] **Step 2: Run the new registry tests and watch them fail**

Run:

```bash
node --test backend/tests/businessTruthRegistry.test.js
```

Expected: failures because the registry helpers do not exist yet

- [ ] **Step 3: Implement the ownership registry**

The registry must define:

- current Mongo-owned business entities
- future PostgreSQL-owned entities
- Redis responsibilities
- pgvector responsibilities
- S3 responsibilities
- cutover sequencing metadata

---

## Task 2: Add shadow-migration metadata to business entities

**Files:**

- Create: `backend/utils/businessTruthSync.js`
- Create: `backend/tests/businessTruthSync.test.js`
- Modify: `backend/models/Booking.js`
- Modify: `backend/models/QuoteProposal.js`
- Modify: `backend/models/PaymentTransaction.js`
- Modify: `backend/models/GuideDriver.js`
- Modify: `backend/models/AccommodationReservation.js`
- Modify: `backend/models/AirportPickup.js`

- [ ] **Step 1: Write failing tests for shared migration metadata helpers**

Cover:

- default metadata creation
- pending sync marking
- completed sync marking
- store ownership labeling

- [ ] **Step 2: Add shared schema definitions and helper functions**

The metadata should support:

- current store owner
- target store owner
- migration status
- last shadow sync time
- external canonical id
- version or checkpoint information

- [ ] **Step 3: Attach the metadata consistently to business models**

This phase must touch:

- bookings
- quotes
- payments
- guide and driver assignments
- accommodation reservations
- airport pickups

---

## Task 3: Move media to an object-storage-ready boundary

**Files:**

- Create: `backend/utils/objectStorage.js`
- Create: `backend/tests/objectStorage.test.js`
- Modify: `backend/models/Media.js`
- Modify: `backend/routes/mediaRoutes.js`

- [ ] **Step 1: Write failing tests for media persistence strategy**

Cover:

- current Mongo-inline storage fallback
- target S3-compatible strategy reporting
- media response payload construction without exposing raw storage internals

- [ ] **Step 2: Introduce a storage abstraction**

The abstraction must:

- keep current uploads working with Mongo-backed binary storage
- expose provider metadata
- prepare the route layer for future S3-compatible ownership

- [ ] **Step 3: Thread the abstraction through the media route**

Uploads and reads should now route through the new object-storage helper rather than hard-coding inline Mongo storage assumptions.

---

## Task 4: Expose infrastructure health and migration readiness

**Files:**

- Create: `backend/utils/infrastructureHealth.js`
- Create: `backend/routes/infrastructureRoutes.js`
- Create: `backend/tests/infrastructureHealth.test.js`
- Modify: `backend/server.js`

- [ ] **Step 1: Write failing tests for infrastructure readiness reporting**

Cover:

- MongoDB health inclusion
- PostgreSQL readiness summary
- Redis readiness summary
- pgvector readiness summary
- S3 readiness summary

- [ ] **Step 2: Implement a readiness report helper**

The report should distinguish:

- configured vs not configured
- current owner vs target owner
- active vs planned mode
- shadow-write capable vs not yet enabled

- [ ] **Step 3: Add an admin route for infrastructure visibility**

Expose:

- business-truth registry
- infrastructure readiness
- migration-safe entity ordering

---

## Task 5: Surface the migration state in admin

**Files:**

- Create: `src/components/Admin/InfrastructureReadinessManager.jsx`
- Modify: `src/components/Admin/AdminSidebar.jsx`
- Modify: `src/pages/AdminDashboard.jsx`
- Modify: `src/services/api.js`

- [ ] **Step 1: Add API helpers for the new infrastructure endpoints**

- [ ] **Step 2: Build a focused admin surface**

The view should show:

- what still lives in Mongo
- what is moving to PostgreSQL
- readiness of Redis, pgvector, and S3-compatible storage
- which entities are next in cutover order

- [ ] **Step 3: Wire the manager into the existing admin dashboard**

Keep the UI targeted. Do not redesign the dashboard. Add a dedicated entry for data-platform readiness.

---

## Task 6: Verify the Phase 3 tranche

**Files:**

- Verify: `backend/tests/businessTruthRegistry.test.js`
- Verify: `backend/tests/businessTruthSync.test.js`
- Verify: `backend/tests/infrastructureHealth.test.js`
- Verify: `backend/tests/objectStorage.test.js`

- [ ] **Step 1: Run targeted backend tests**

Run:

```bash
node --test backend/tests/businessTruthRegistry.test.js backend/tests/businessTruthSync.test.js backend/tests/infrastructureHealth.test.js backend/tests/objectStorage.test.js
```

Expected: all new infrastructure tests pass

- [ ] **Step 2: Run route smoke checks**

Run:

```bash
node -e "import('./backend/routes/infrastructureRoutes.js').then(() => console.log('infrastructure-routes-ok')).catch((error) => { console.error(error); process.exit(1); })"
node -e "import('./backend/routes/mediaRoutes.js').then(() => console.log('media-routes-ok')).catch((error) => { console.error(error); process.exit(1); })"
```

Expected: both route modules load successfully

- [ ] **Step 3: Run targeted lint**

Run:

```bash
npx eslint backend/models/Booking.js backend/models/QuoteProposal.js backend/models/PaymentTransaction.js backend/models/GuideDriver.js backend/models/AccommodationReservation.js backend/models/AirportPickup.js backend/models/Media.js backend/routes/mediaRoutes.js backend/routes/infrastructureRoutes.js backend/utils/businessTruthRegistry.js backend/utils/businessTruthSync.js backend/utils/infrastructureHealth.js backend/utils/objectStorage.js backend/tests/businessTruthRegistry.test.js backend/tests/businessTruthSync.test.js backend/tests/infrastructureHealth.test.js backend/tests/objectStorage.test.js src/components/Admin/InfrastructureReadinessManager.jsx src/components/Admin/AdminSidebar.jsx src/pages/AdminDashboard.jsx src/services/api.js
```

Expected: targeted files pass lint

---

## Immediate Execution Order

1. Ownership registry tests and implementation
2. Shared migration metadata tests and implementation
3. Media storage abstraction
4. Infrastructure readiness route and server wiring
5. Admin visibility
6. Verification

---

## Handoff

This phase completes the migration foundation, not the full cutover. Once this tranche is verified, the next implementation slice should focus on real PostgreSQL shadow writes for bookings, quotes, and payments using the metadata and readiness boundaries established here.
