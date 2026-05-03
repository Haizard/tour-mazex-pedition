# Tourism Infrastructure Master Roadmap Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the current tourism SaaS into a scalable tourism infrastructure platform by finishing revenue-critical features first, then hardening operations, then introducing the target multi-database architecture in controlled phases.

**Architecture:** The roadmap intentionally avoids a risky full rewrite. We keep the current React + Express + MongoDB product live, harden the existing revenue and operations modules already present in the repo, then progressively introduce PostgreSQL for business truth, Redis for asynchronous execution, pgvector for retrieval, and S3 for files. Every milestone is designed to produce a shippable improvement while reducing long-term architectural risk.

**Tech Stack:** React 18, Vite, Node.js, Express, Mongoose/MongoDB current state, target PostgreSQL, Redis, pgvector, S3-compatible object storage

---

## File Structure

**Reference:**

- `MASTER_IMPLEMENTATION_BLUEPRINT.md`
- `FEATURE_PROGRESS_TRACKER.md`

**Create:**

- `docs/superpowers/plans/2026-04-28-tourism-infrastructure-master-roadmap.md`
- `docs/superpowers/plans/2026-04-28-phase-1-revenue-core.md`
- `docs/superpowers/plans/2026-04-28-phase-2-operations-core.md`
- `docs/superpowers/plans/2026-04-28-phase-3-business-truth-migration.md`
- `docs/superpowers/plans/2026-04-28-phase-4-distribution-and-network.md`

**Modify Later During Execution:**

- `backend/models/*`
- `backend/routes/*`
- `backend/controllers/*`
- `backend/utils/*`
- `backend/server.js`
- `src/components/Admin/*`
- `src/services/*`
- future infrastructure directories for PostgreSQL, Redis, vector search, and object storage integration

---

## Scope Check

This program is too large for one implementation pass. It contains four independent but connected workstreams:

1. Revenue-core completion
2. Operations-core completion
3. Business-truth migration to PostgreSQL and supporting infrastructure
4. Distribution, partner network, and intelligence expansion

This master roadmap exists to sequence those workstreams correctly. Each workstream should get its own execution plan before code work begins.

---

## Milestone Map

### Milestone 1: Revenue Core Lock

**Objective:** Make the system commercially reliable from inquiry through payment.

**Primary outcomes:**

- complete payment automation
- harden quote to booking transitions
- complete unified inbox around revenue conversion
- upgrade chatbot into a stronger sales assistant
- establish attribution tracking foundations

**Features inside this milestone:**

- payment provider live completion
- webhook reliability and retry logic
- refund and reconciliation workflows
- operator inbox workflow completion
- lead-source attribution fields and reporting
- sales-handoff states between AI and humans

**Definition of done:**

- a lead can move from inquiry to quote to booking to payment without manual data gaps
- operators can track payment and response status from admin surfaces
- inbox activity is attributable to channel and linked to conversion outcomes

### Milestone 2: Operations Core Lock

**Objective:** Turn the product into reliable day-to-day operating software.

**Primary outcomes:**

- real scheduling for guides and drivers
- accommodation and airport coordination hardening
- real conflict detection across resources
- outbound operational notifications
- early traveler trip coordination timeline

**Definition of done:**

- operators can assign staff and logistics resources without silent collisions
- dispatch and lodging conflicts are visible before execution
- trip execution details can be surfaced and communicated reliably

### Milestone 3: Business Truth Migration

**Objective:** Move money, bookings, and operations truth out of Mongo-only ownership and into the target database model.

**Primary outcomes:**

- PostgreSQL introduced as business system of record
- Redis introduced for async retries, locks, queues, and scheduling
- pgvector introduced for retrieval and semantic memory
- S3 introduced for binary and generated-document ownership

**Definition of done:**

- bookings, quotes, payments, and scheduling truth are no longer Mongo-only
- async flows do not rely on ad hoc in-request execution
- AI retrieval and file ownership have dedicated infrastructure

### Milestone 4: Distribution Expansion

**Objective:** Allow businesses to use the platform even without adopting the full website SaaS.

**Primary outcomes:**

- embeddable widgets
- hosted social-commerce flows
- API access layer
- white-label capability

**Definition of done:**

- at least one non-full-site consumption model is production-ready

### Milestone 5: Network and Intelligence Layer

**Objective:** Move from tenant-isolated SaaS into ecosystem infrastructure.

**Primary outcomes:**

- partner collaboration workflows
- affiliate and OTA connector architecture
- attribution and pricing intelligence
- fraud and trust layers
- personalization and demand forecasting

**Definition of done:**

- the platform begins creating value across operators, partners, and channels, not just inside isolated tenants

---

## Execution Order

### Task 1: Lock the roadmap and decomposition

**Files:**

- Reference: `MASTER_IMPLEMENTATION_BLUEPRINT.md`
- Create: `docs/superpowers/plans/2026-04-28-tourism-infrastructure-master-roadmap.md`

- [x] **Step 1: Confirm the project state and target architecture sources**

Run:

```bash
type MASTER_IMPLEMENTATION_BLUEPRINT.md
type FEATURE_PROGRESS_TRACKER.md
```

Expected: both documents exist and describe current status plus target architecture

- [x] **Step 2: Decompose the program into execution milestones**

Milestones must be:

- Revenue Core Lock
- Operations Core Lock
- Business Truth Migration
- Distribution Expansion
- Network and Intelligence Layer

- [x] **Step 3: Define milestone ordering**

Ordering rule:

1. Revenue before operations scale
2. Operations before infrastructure-company expansion
3. Business-truth migration before broad distribution
4. Distribution before full network intelligence

---

### Task 2: Create the first executable workstream plan

**Files:**

- Create: `docs/superpowers/plans/2026-04-28-phase-1-revenue-core.md`
- Reference: `backend/models/PaymentTransaction.js`
- Reference: `backend/routes/paymentRoutes.js`
- Reference: `backend/utils/paymentAutomation.js`
- Reference: `backend/routes/unifiedInboxRoutes.js`
- Reference: `backend/tests/paymentAutomation.test.js`
- Reference: `backend/tests/unifiedInbox.test.js`
- Reference: `backend/tests/chatSalesAssistant.test.js`

- [ ] **Step 1: Write the Phase 1 plan document**

The Phase 1 plan must cover:

- payment completion
- quote-booking-payment truth checks
- unified inbox completion for revenue workflows
- chatbot sales-assistant hardening
- attribution tracking foundation

- [ ] **Step 2: Make Payment Automation the first implementation slice**

Reason:

- it is revenue-critical
- it already exists partially
- it anchors later booking truth migration

- [ ] **Step 3: Ensure the plan is build-facing, not aspirational**

The phase plan must identify:

- backend files to audit first
- current tests to extend
- missing routes, services, and UI states
- data fields that will later migrate to PostgreSQL

---

### Task 3: Create the operations-core plan

**Files:**

- Create: `docs/superpowers/plans/2026-04-28-phase-2-operations-core.md`
- Reference: `backend/models/GuideDriver.js`
- Reference: `backend/models/AccommodationReservation.js`
- Reference: `backend/models/AirportPickup.js`
- Reference: `backend/tests/guideDriverPlanning.test.js`
- Reference: `backend/tests/accommodationCoordination.test.js`
- Reference: `backend/tests/airportPickupCoordination.test.js`
- Reference: `src/components/Admin/GuideDriverManager.jsx`
- Reference: `src/components/Admin/AccommodationManager.jsx`
- Reference: `src/components/Admin/AirportPickupManager.jsx`

- [ ] **Step 1: Write the Phase 2 plan document**

The Phase 2 plan must cover:

- calendar-based scheduling
- conflict prevention
- dispatch notifications
- trip timeline integration
- historical planning visibility

- [ ] **Step 2: Keep operations truth migration-aware**

The plan must mark which entities will remain content/config and which should become PostgreSQL-owned later.

---

### Task 4: Create the business-truth migration plan

**Files:**

- Create: `docs/superpowers/plans/2026-04-28-phase-3-business-truth-migration.md`
- Reference: `backend/utils/database.js`
- Reference: `backend/models/Booking.js`
- Reference: `backend/models/QuoteProposal.js`
- Reference: `backend/models/PaymentTransaction.js`
- Reference: `backend/models/GuideDriver.js`
- Reference: `backend/models/AccommodationReservation.js`
- Reference: `backend/models/AirportPickup.js`

- [ ] **Step 1: Write the migration plan document**

The migration plan must define:

- current Mongo-owned business entities
- future PostgreSQL-owned entities
- read-model exceptions
- cutover order
- compatibility and rollback strategy

- [ ] **Step 2: Sequence migration in safe waves**

Safe order:

1. bookings and payments
2. quotes and travelers
3. scheduling and operations
4. partner contracts and attribution

- [ ] **Step 3: Define infrastructure add-ons in the same plan**

Include:

- Redis responsibilities
- pgvector responsibilities
- S3 responsibilities
- service-boundary expectations

---

### Task 5: Create the distribution and network expansion plan

**Files:**

- Create: `docs/superpowers/plans/2026-04-28-phase-4-distribution-and-network.md`
- Reference: `src/components/Chat/ChatBot.jsx`
- Reference: `src/components/PlanMyTrip/PlanMyTripWizard.jsx`
- Reference: `backend/routes/partnerPortalRoutes.js`
- Reference: `backend/routes/socialPostRoutes.js`

- [ ] **Step 1: Write the distribution and network plan document**

The plan must cover:

- widget strategy
- hosted booking surfaces
- API product boundaries
- white-label capabilities
- partner collaboration
- affiliate and OTA foundations

- [ ] **Step 2: Keep this milestone blocked behind earlier milestones**

The plan must explicitly say that distribution cannot become a primary build target until:

- revenue core is stable
- business truth boundaries are credible

---

## Immediate Build Recommendation

### Start with this subproject

The first implementation plan to execute should be:

`docs/superpowers/plans/2026-04-28-phase-1-revenue-core.md`

### Why this should be first

- it upgrades the most revenue-critical weak points already in the repo
- it builds on existing code instead of introducing a premature rewrite
- it gives the PostgreSQL migration a safer future target
- it improves conversion, collection, and operator workflow immediately

### First concrete feature order inside Phase 1

1. Payment automation completion
2. Quote-booking-payment state hardening
3. Unified inbox completion for revenue channels
4. Chat sales-assistant upgrade
5. Attribution tracking foundation

---

## Delivery Rules

### Rule 1

Do not begin PostgreSQL migration before Phase 1 and Phase 2 expose the exact truth model gaps.

### Rule 2

Do not build widgets, APIs, or marketplace layers on top of weak payment and booking truth.

### Rule 3

Do not treat MongoDB as the permanent owner of money, booking, scheduling, or partner-commercial truth.

### Rule 4

Every phase must finish with:

- updated tests
- updated admin visibility
- a clear definition of source of truth
- migration awareness for future phases

---

## Verification Checklist

- [ ] Master roadmap plan file exists in `docs/superpowers/plans/`
- [ ] Phase 1 revenue-core plan is written next
- [ ] Phase 2 operations-core plan is written next
- [ ] Phase 3 business-truth migration plan is written next
- [ ] Phase 4 distribution-and-network plan is written next
- [ ] Roadmap sequencing still starts with revenue-core completion

---

## Handoff

This roadmap is the sequencing document, not the execution document.

Execution should begin by writing and then implementing:

`docs/superpowers/plans/2026-04-28-phase-1-revenue-core.md`

After that, implementation can proceed milestone by milestone without losing architectural direction.
