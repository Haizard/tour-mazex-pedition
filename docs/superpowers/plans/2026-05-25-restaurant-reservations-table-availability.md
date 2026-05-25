# Restaurant Reservations And Table Availability Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a restaurant reservation operations layer with service windows, table types, dated availability, public reservation requests, partner controls, admin visibility, and AI-assisted request guidance.

**Architecture:** MongoDB owns the live restaurant reservation write models. Backend utilities normalize reservation operations and keep route handlers small. Public restaurant detail pages submit reservation requests, approved restaurant partners manage operations, and tenant admins get visibility through the restaurant workspace.

**Tech Stack:** Node.js ES modules, Express, Mongoose, React, existing API service helpers, Node test runner, Vite build.

---

## File Structure

- Create `backend/models/RestaurantServiceWindow.js` for repeatable dining services such as lunch, dinner, private dining, and event dining.
- Create `backend/models/RestaurantTableType.js` for capacity buckets such as two-seater, family table, private dining, and event block.
- Create `backend/models/RestaurantAvailabilityEntry.js` for dated availability linked to service windows and optional table types.
- Create `backend/models/RestaurantReservationRequest.js` for traveler dining reservation requests.
- Create `backend/utils/restaurantReservations.js` for normalization, summaries, status transitions, public option shaping, and AI/autopilot metadata.
- Modify `backend/routes/restaurantRoutes.js` to add public and tenant-admin reservation operations.
- Modify `backend/routes/restaurantPartnerAuthRoutes.js` or create `backend/routes/restaurantPartnerPortalRoutes.js` if the existing auth route is too narrow for authenticated partner operations.
- Modify `backend/server.js` if a new restaurant partner portal route file is created.
- Create `backend/tests/restaurantReservations.test.js` for utility behavior.
- Extend `backend/tests/restaurantRoutes.test.js` for public and admin reservation APIs.
- Extend `backend/tests/restaurantPartnerRoutes.test.js` for partner authorization and operations APIs.
- Create `src/components/Marketplace/RestaurantReservationWidget.jsx` for the public request form on restaurant detail pages.
- Create `src/components/Marketplace/restaurantReservationState.js` for public reservation form state.
- Create `src/components/Marketplace/restaurantReservationState.test.js`.
- Modify `src/pages/RestaurantDetail.jsx` to fetch reservation options and render the reservation request widget.
- Modify `src/pages/RestaurantPartnerDashboard.jsx` to add reservation operations controls.
- Create `src/components/RestaurantPartner/restaurantPartnerReservationState.js` for partner service, table, availability, and request state.
- Create `src/components/RestaurantPartner/restaurantPartnerReservationState.test.js`.
- Modify `src/components/Admin/RestaurantManager.jsx` to show reservation visibility.
- Create `src/components/Admin/restaurantReservationAdminState.js` for admin reservation summaries.
- Create `src/components/Admin/restaurantReservationAdminState.test.js`.
- Modify `src/services/api.js` to add public, admin, and partner restaurant reservation API helpers.

---

## Task 1: Backend Reservation Models And Utilities

**Files:**
- Create: `backend/models/RestaurantServiceWindow.js`
- Create: `backend/models/RestaurantTableType.js`
- Create: `backend/models/RestaurantAvailabilityEntry.js`
- Create: `backend/models/RestaurantReservationRequest.js`
- Create: `backend/utils/restaurantReservations.js`
- Test: `backend/tests/restaurantReservations.test.js`

- [ ] **Step 1: Write failing utility tests**

Create `backend/tests/restaurantReservations.test.js` with tests for:

```js
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  normalizeServiceWindowPayload,
  normalizeTableTypePayload,
  normalizeAvailabilityPayload,
  normalizeReservationRequestPayload,
  summarizeRestaurantAvailability,
  buildReservationAutopilot,
} from '../utils/restaurantReservations.js';

test('normalizes restaurant service windows with safe defaults', () => {
  const result = normalizeServiceWindowPayload({
    label: 'Dinner',
    serviceType: 'dinner',
    defaultStartTime: '18:00',
    defaultEndTime: '22:00',
  });

  assert.equal(result.label, 'Dinner');
  assert.equal(result.serviceType, 'dinner');
  assert.equal(result.capacityMode, 'table_type');
  assert.equal(result.status, 'active');
});

test('normalizes table types and clamps invalid capacity values', () => {
  const result = normalizeTableTypePayload({
    label: 'Family table',
    minGuests: 0,
    maxGuests: 6,
    quantity: 2,
  });

  assert.equal(result.minGuests, 1);
  assert.equal(result.maxGuests, 6);
  assert.equal(result.quantity, 2);
  assert.equal(result.status, 'active');
});

test('normalizes availability entries with date and status rules', () => {
  const result = normalizeAvailabilityPayload({
    date: '2026-06-10',
    status: 'limited',
    availableUnits: 1,
    availableSeats: 4,
  });

  assert.equal(result.status, 'limited');
  assert.equal(result.availableUnits, 1);
  assert.equal(result.availableSeats, 4);
});

test('normalizes reservation requests with pending status and direct source', () => {
  const result = normalizeReservationRequestPayload({
    travelerName: 'Asha Traveler',
    travelerEmail: 'asha@example.com',
    date: '2026-06-10',
    preferredTime: '19:30',
    guestCount: 4,
  });

  assert.equal(result.travelerName, 'Asha Traveler');
  assert.equal(result.source, 'direct');
  assert.equal(result.status, 'pending');
});

test('summarizes availability for public reservation options', () => {
  const summary = summarizeRestaurantAvailability([
    { status: 'open', availableUnits: 3, availableSeats: 12 },
    { status: 'limited', availableUnits: 1, availableSeats: 4 },
  ]);

  assert.equal(summary.status, 'open');
  assert.equal(summary.totalAvailableUnits, 4);
  assert.equal(summary.totalAvailableSeats, 16);
});

test('builds reservation autopilot metadata for group and dietary requests', () => {
  const result = buildReservationAutopilot({
    guestCount: 12,
    dietaryNotes: 'Vegetarian options needed',
    occasion: 'family dinner',
  });

  assert.equal(result.classification, 'group-dining');
  assert.equal(result.requiresHumanReview, true);
  assert.match(result.nextBestAction, /confirm/i);
});
```

- [ ] **Step 2: Run the failing tests**

Run: `node --test backend/tests/restaurantReservations.test.js`

Expected: fail because `backend/utils/restaurantReservations.js` does not exist.

- [ ] **Step 3: Add Mongoose models**

Create the four model files with scoped tenant and restaurant references, enum validation, timestamps, and indexes by `tenantId`, `restaurantId`, and operational dates where applicable.

- [ ] **Step 4: Add reservation utility implementation**

Implement `restaurantReservations.js` exports used by the tests:

- `normalizeServiceWindowPayload`
- `normalizeTableTypePayload`
- `normalizeAvailabilityPayload`
- `normalizeReservationRequestPayload`
- `summarizeRestaurantAvailability`
- `buildReservationAutopilot`

Keep utility functions pure and independent of Express.

- [ ] **Step 5: Run utility tests**

Run: `node --test backend/tests/restaurantReservations.test.js`

Expected: pass.

---

## Task 2: Public And Admin Restaurant Reservation APIs

**Files:**
- Modify: `backend/routes/restaurantRoutes.js`
- Test: `backend/tests/restaurantRoutes.test.js`

- [ ] **Step 1: Add failing route tests**

Extend `backend/tests/restaurantRoutes.test.js` to cover:

- `GET /api/restaurants/:id/reservations/options` returns service windows, table types, and availability summary.
- `POST /api/restaurants/:id/reservations/requests` creates a pending request with autopilot metadata.
- tenant admin can list reservation requests for a restaurant.
- tenant admin can update request status to `confirmed`, `declined`, `needs-clarification`, or `cancelled`.

- [ ] **Step 2: Run route tests**

Run: `node --test backend/tests/restaurantRoutes.test.js`

Expected: fail because reservation routes are not present.

- [ ] **Step 3: Implement public APIs**

In `backend/routes/restaurantRoutes.js`, add routes for:

- `GET /:id/reservations/options`
- `POST /:id/reservations/requests`

The public options route should only expose active service windows, active table types, and public availability summary. The request route should normalize the payload, attach restaurant and tenant context, set status to `pending`, and attach `buildReservationAutopilot` metadata.

- [ ] **Step 4: Implement tenant admin APIs**

Add authenticated tenant-admin routes for:

- `GET /admin/:id/reservations`
- `PUT /admin/reservations/:requestId`
- admin create/update routes for service windows, table types, and availability entries if current restaurant admin patterns make them appropriate in this route file.

- [ ] **Step 5: Run route tests**

Run: `node --test backend/tests/restaurantRoutes.test.js backend/tests/restaurantReservations.test.js`

Expected: pass.

---

## Task 3: Restaurant Partner Operations APIs

**Files:**
- Modify: `backend/routes/restaurantPartnerAuthRoutes.js`
- Optional Create: `backend/routes/restaurantPartnerPortalRoutes.js`
- Optional Modify: `backend/server.js`
- Test: `backend/tests/restaurantPartnerRoutes.test.js`

- [ ] **Step 1: Write failing partner route tests**

Extend `backend/tests/restaurantPartnerRoutes.test.js` to cover:

- partner can list only restaurants attached to their account.
- partner can create and update service windows for attached restaurants.
- partner can create and update table types for attached restaurants.
- partner can create and update dated availability for attached restaurants.
- partner can list reservation requests for attached restaurants.
- partner can update reservation request status and partner notes for attached restaurants.
- partner cannot access another restaurant.

- [ ] **Step 2: Run partner route tests**

Run: `node --test backend/tests/restaurantPartnerRoutes.test.js`

Expected: fail because partner reservation operations do not exist.

- [ ] **Step 3: Add partner operations routes**

Add authenticated partner routes for:

- `GET /restaurant-partner/restaurants`
- `GET /restaurant-partner/restaurants/:restaurantId/reservations`
- `POST /restaurant-partner/restaurants/:restaurantId/service-windows`
- `PUT /restaurant-partner/service-windows/:id`
- `POST /restaurant-partner/restaurants/:restaurantId/table-types`
- `PUT /restaurant-partner/table-types/:id`
- `POST /restaurant-partner/restaurants/:restaurantId/availability`
- `PUT /restaurant-partner/availability/:id`
- `PUT /restaurant-partner/reservation-requests/:id`

If adding these to `restaurantPartnerAuthRoutes.js` makes it too broad, create `restaurantPartnerPortalRoutes.js` and mount it in `backend/server.js`.

- [ ] **Step 4: Enforce ownership**

Use the restaurant partner auth middleware and `RestaurantPartnerAdmin` restaurant attachment data to ensure every operation belongs to the authenticated partner.

- [ ] **Step 5: Run partner route tests**

Run: `node --test backend/tests/restaurantPartnerRoutes.test.js backend/tests/restaurantPartnerAuth.test.js`

Expected: pass.

---

## Task 4: Public Reservation Request UI

**Files:**
- Create: `src/components/Marketplace/restaurantReservationState.js`
- Create: `src/components/Marketplace/restaurantReservationState.test.js`
- Create: `src/components/Marketplace/RestaurantReservationWidget.jsx`
- Modify: `src/pages/RestaurantDetail.jsx`
- Modify: `src/services/api.js`

- [ ] **Step 1: Write failing UI state tests**

Create `src/components/Marketplace/restaurantReservationState.test.js` with tests for:

- normalizing public options into select-friendly service/table choices.
- validating required traveler name, email, date, preferred time, and guest count.
- building a reservation request payload with source `direct`.
- preserving itinerary context when provided.

- [ ] **Step 2: Run UI state tests**

Run: `node --test src/components/Marketplace/restaurantReservationState.test.js`

Expected: fail because the state helper does not exist.

- [ ] **Step 3: Implement public state helper**

Create `restaurantReservationState.js` with exports:

- `normalizeReservationOptions`
- `validateReservationRequestForm`
- `buildRestaurantReservationPayload`
- `getReservationAvailabilityTone`

- [ ] **Step 4: Add API helpers**

In `src/services/api.js`, add:

- `fetchRestaurantReservationOptions(restaurantId)`
- `submitRestaurantReservationRequest(restaurantId, payload)`

- [ ] **Step 5: Add reservation widget**

Create `RestaurantReservationWidget.jsx` with fields for:

- service window
- date
- preferred time
- guest count
- seating/table preference
- traveler name
- traveler email
- traveler phone
- dietary notes
- occasion
- public notes

Use existing restaurant page styling patterns and clear submit/success/error states.

- [ ] **Step 6: Wire restaurant detail page**

In `RestaurantDetail.jsx`, fetch reservation options and render the widget near the conversion area without replacing the existing inquiry and itinerary actions.

- [ ] **Step 7: Run frontend state tests**

Run: `node --test src/components/Marketplace/restaurantReservationState.test.js`

Expected: pass.

---

## Task 5: Restaurant Partner Dashboard Reservation Controls

**Files:**
- Create: `src/components/RestaurantPartner/restaurantPartnerReservationState.js`
- Create: `src/components/RestaurantPartner/restaurantPartnerReservationState.test.js`
- Modify: `src/pages/RestaurantPartnerDashboard.jsx`
- Modify: `src/services/api.js`

- [ ] **Step 1: Write failing partner state tests**

Create `restaurantPartnerReservationState.test.js` for:

- grouping service windows, table types, availability entries, and requests by restaurant.
- building service window payloads.
- building table type payloads.
- building availability payloads.
- building reservation status update payloads.

- [ ] **Step 2: Run partner state tests**

Run: `node --test src/components/RestaurantPartner/restaurantPartnerReservationState.test.js`

Expected: fail because the helper does not exist.

- [ ] **Step 3: Implement partner state helper**

Create `restaurantPartnerReservationState.js` with exports:

- `groupReservationOperationsByRestaurant`
- `buildServiceWindowPayload`
- `buildTableTypePayload`
- `buildAvailabilityPayload`
- `buildReservationStatusPayload`
- `formatReservationRequestSummary`

- [ ] **Step 4: Add partner API helpers**

In `src/services/api.js`, add helpers for partner service windows, table types, availability entries, reservation request listing, and reservation request status updates.

- [ ] **Step 5: Extend partner dashboard**

In `RestaurantPartnerDashboard.jsx`, add an operations section with compact forms/tables for:

- service windows
- table types
- dated availability
- incoming reservation requests

Keep the dashboard operational and dense, matching the current admin/partner style.

- [ ] **Step 6: Run partner frontend tests**

Run: `node --test src/components/RestaurantPartner/restaurantPartnerReservationState.test.js src/pages/restaurantPartnerRoutes.test.js`

Expected: pass.

---

## Task 6: Tenant Admin Reservation Visibility

**Files:**
- Create: `src/components/Admin/restaurantReservationAdminState.js`
- Create: `src/components/Admin/restaurantReservationAdminState.test.js`
- Modify: `src/components/Admin/RestaurantManager.jsx`
- Modify: `src/services/api.js`

- [ ] **Step 1: Write failing admin state tests**

Create tests for:

- summarizing pending, confirmed, declined, needs-clarification, and cancelled requests.
- surfacing high-value or human-review autopilot flags.
- shaping restaurant reservation operations for the manager UI.

- [ ] **Step 2: Run admin state tests**

Run: `node --test src/components/Admin/restaurantReservationAdminState.test.js`

Expected: fail because the helper does not exist.

- [ ] **Step 3: Implement admin state helper**

Create `restaurantReservationAdminState.js` with exports:

- `summarizeRestaurantReservationRequests`
- `shapeRestaurantReservationOperations`
- `getReservationStatusLabel`
- `getReservationAutopilotBadge`

- [ ] **Step 4: Add admin API helpers**

In `src/services/api.js`, add helpers for tenant-admin restaurant reservation operations and status updates.

- [ ] **Step 5: Extend restaurant manager**

In `RestaurantManager.jsx`, add reservation visibility:

- summary strip
- recent requests
- status update controls
- service/table/availability visibility for the selected restaurant

- [ ] **Step 6: Run admin frontend tests**

Run: `node --test src/components/Admin/restaurantReservationAdminState.test.js src/components/Admin/restaurantManagerState.test.js`

Expected: pass.

---

## Task 7: Full Verification And Commit

**Files:**
- All files touched in Tasks 1-6.

- [ ] **Step 1: Run focused backend tests**

Run:

```bash
node --test backend/tests/restaurantReservations.test.js backend/tests/restaurantRoutes.test.js backend/tests/restaurantPartnerRoutes.test.js backend/tests/restaurantPartnerAuth.test.js
```

Expected: all pass.

- [ ] **Step 2: Run focused frontend tests**

Run:

```bash
node --test src/components/Marketplace/restaurantReservationState.test.js src/components/RestaurantPartner/restaurantPartnerReservationState.test.js src/components/Admin/restaurantReservationAdminState.test.js src/pages/restaurantPartnerRoutes.test.js
```

Expected: all pass.

- [ ] **Step 3: Run build**

Run: `npm run build`

Expected: Vite build, SSR build, and prerender complete successfully.

- [ ] **Step 4: Inspect git status**

Run: `git status --short`

Expected: only restaurant reservation feature files plus pre-existing unrelated local image/deleted-file status.

- [ ] **Step 5: Commit feature**

Run:

```bash
git add backend/models/RestaurantServiceWindow.js backend/models/RestaurantTableType.js backend/models/RestaurantAvailabilityEntry.js backend/models/RestaurantReservationRequest.js backend/utils/restaurantReservations.js backend/routes/restaurantRoutes.js backend/tests/restaurantReservations.test.js backend/tests/restaurantRoutes.test.js backend/tests/restaurantPartnerRoutes.test.js src/components/Marketplace/restaurantReservationState.js src/components/Marketplace/restaurantReservationState.test.js src/components/Marketplace/RestaurantReservationWidget.jsx src/pages/RestaurantDetail.jsx src/components/RestaurantPartner/restaurantPartnerReservationState.js src/components/RestaurantPartner/restaurantPartnerReservationState.test.js src/pages/RestaurantPartnerDashboard.jsx src/components/Admin/restaurantReservationAdminState.js src/components/Admin/restaurantReservationAdminState.test.js src/components/Admin/RestaurantManager.jsx src/services/api.js
git commit -m "feat: add restaurant reservations availability"
```

If a new `backend/routes/restaurantPartnerPortalRoutes.js` file or `backend/server.js` mount is added, include those files in the commit.

- [ ] **Step 6: Push**

Run: `git push origin main`

Expected: push succeeds.
