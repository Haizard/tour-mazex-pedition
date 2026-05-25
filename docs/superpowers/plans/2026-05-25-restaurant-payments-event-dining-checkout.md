# Restaurant Payments And Event Dining Checkout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add deposit and custom event dining checkout for restaurant reservation requests using the existing `PaymentTransaction` system.

**Architecture:** Restaurant reservations remain the operational source of truth, while `PaymentTransaction` remains the financial source of truth. Checkout helpers calculate deterministic amounts, prevent duplicate active payment requests, and write restaurant reservation metadata onto payment transactions for revenue attribution.

**Tech Stack:** Node.js ES modules, Express, Mongoose, existing payment routes/models, React, Node test runner, Vite build.

---

## File Structure

- Modify `backend/models/Restaurant.js` to add `restaurantCheckout` settings.
- Modify `backend/models/RestaurantReservationRequest.js` to add payment state fields.
- Modify `backend/models/PaymentTransaction.js` to add restaurant reservation references and generic source metadata.
- Create `backend/utils/restaurantCheckout.js` for settings normalization, deposit calculation, custom payment validation, duplicate prevention, transaction payload shaping, and reservation payment updates.
- Modify `backend/routes/restaurantRoutes.js` to add tenant admin checkout settings and payment request endpoints.
- Modify `backend/routes/restaurantPartnerAuthRoutes.js` to add partner checkout settings visibility and payment request endpoints.
- Create `backend/tests/restaurantCheckout.test.js`.
- Extend `backend/tests/restaurantRoutes.test.js` and `backend/tests/restaurantPartnerRoutes.test.js`.
- Create `src/components/RestaurantPartner/restaurantPartnerCheckoutState.js` and test.
- Create `src/components/Admin/restaurantCheckoutAdminState.js` and test.
- Modify `src/pages/RestaurantPartnerDashboard.jsx` to add partner payment controls on reservation request cards.
- Modify `src/components/Admin/RestaurantManager.jsx` to show reservation payment state and admin payment actions.
- Modify `src/services/api.js` to add partner/admin restaurant checkout API helpers.

---

## Task 1: Checkout Models And Utility

**Files:**
- Modify: `backend/models/Restaurant.js`
- Modify: `backend/models/RestaurantReservationRequest.js`
- Modify: `backend/models/PaymentTransaction.js`
- Create: `backend/utils/restaurantCheckout.js`
- Test: `backend/tests/restaurantCheckout.test.js`

- [ ] **Step 1: Write failing checkout utility tests**

Create `backend/tests/restaurantCheckout.test.js` covering:

- checkout settings defaults
- fixed deposit calculation
- percentage deposit calculation
- custom amount validation
- duplicate active transaction detection
- payment transaction payload metadata
- reservation payment update payloads

- [ ] **Step 2: Run failing test**

Run: `node --test backend/tests/restaurantCheckout.test.js`

Expected: fail because `restaurantCheckout.js` does not exist.

- [ ] **Step 3: Extend models**

Add `restaurantCheckout` to `Restaurant`, payment fields to `RestaurantReservationRequest`, and restaurant reservation metadata fields to `PaymentTransaction`.

- [ ] **Step 4: Implement utility**

Create pure exports:

- `normalizeRestaurantCheckoutSettings`
- `calculateRestaurantDepositAmount`
- `validateCustomRestaurantPayment`
- `isActiveRestaurantPaymentTransaction`
- `buildRestaurantPaymentTransactionPayload`
- `buildReservationPaymentUpdate`

- [ ] **Step 5: Run utility test**

Run: `node --test backend/tests/restaurantCheckout.test.js`

Expected: pass.

---

## Task 2: Backend Admin And Partner Checkout APIs

**Files:**
- Modify: `backend/routes/restaurantRoutes.js`
- Modify: `backend/routes/restaurantPartnerAuthRoutes.js`
- Test: `backend/tests/restaurantRoutes.test.js`
- Test: `backend/tests/restaurantPartnerRoutes.test.js`

- [ ] **Step 1: Add failing route tests**

Extend route tests to assert:

- tenant admin route updates restaurant checkout settings
- tenant admin route creates restaurant reservation payment request
- partner route can create restaurant reservation payment request for assigned restaurant
- routes import `buildRestaurantPaymentTransactionPayload`
- routes update reservation payment state after transaction creation

- [ ] **Step 2: Run route tests**

Run: `node --test backend/tests/restaurantRoutes.test.js backend/tests/restaurantPartnerRoutes.test.js`

Expected: fail because routes do not exist.

- [ ] **Step 3: Implement tenant admin routes**

Add:

- `PATCH /api/restaurants/:id/checkout-settings`
- `POST /api/restaurants/reservation-requests/:id/payment-request`

- [ ] **Step 4: Implement partner routes**

Add:

- `PATCH /api/restaurant-partner-auth/restaurants/:restaurantId/checkout-settings`
- `POST /api/restaurant-partner-auth/reservation-requests/:id/payment-request`

- [ ] **Step 5: Run backend route tests**

Run: `node --test backend/tests/restaurantCheckout.test.js backend/tests/restaurantRoutes.test.js backend/tests/restaurantPartnerRoutes.test.js`

Expected: pass.

---

## Task 3: Partner And Admin Checkout State Helpers

**Files:**
- Create: `src/components/RestaurantPartner/restaurantPartnerCheckoutState.js`
- Create: `src/components/RestaurantPartner/restaurantPartnerCheckoutState.test.js`
- Create: `src/components/Admin/restaurantCheckoutAdminState.js`
- Create: `src/components/Admin/restaurantCheckoutAdminState.test.js`

- [ ] **Step 1: Write failing state tests**

Partner helper tests should cover:

- checkout settings payload shaping
- deposit payment request payload
- custom payment request payload
- payment status labels

Admin helper tests should cover:

- payment summary by status
- payment action availability
- amount display

- [ ] **Step 2: Run failing state tests**

Run: `node --test src/components/RestaurantPartner/restaurantPartnerCheckoutState.test.js src/components/Admin/restaurantCheckoutAdminState.test.js`

Expected: fail because helpers do not exist.

- [ ] **Step 3: Implement helpers**

Create small pure helper modules with deterministic amount and status display logic.

- [ ] **Step 4: Run state tests**

Run: `node --test src/components/RestaurantPartner/restaurantPartnerCheckoutState.test.js src/components/Admin/restaurantCheckoutAdminState.test.js`

Expected: pass.

---

## Task 4: Dashboard And API Wiring

**Files:**
- Modify: `src/services/api.js`
- Modify: `src/pages/RestaurantPartnerDashboard.jsx`
- Modify: `src/components/Admin/RestaurantManager.jsx`

- [ ] **Step 1: Add API helpers**

Add partner and admin helpers for checkout settings and payment request creation.

- [ ] **Step 2: Add partner dashboard controls**

On reservation request cards, show payment status and add buttons/forms to:

- request deposit payment
- request custom event/private/group payment

- [ ] **Step 3: Add admin visibility and controls**

In restaurant reservation visibility, show payment state, linked transaction, and payment request actions.

- [ ] **Step 4: Run focused frontend tests**

Run:

```bash
node --test src/components/RestaurantPartner/restaurantPartnerCheckoutState.test.js src/components/Admin/restaurantCheckoutAdminState.test.js src/components/RestaurantPartner/restaurantPartnerReservationState.test.js src/components/Admin/restaurantReservationAdminState.test.js
```

Expected: pass.

---

## Task 5: Full Verification And Commit

- [ ] **Step 1: Run focused backend tests**

Run:

```bash
node --test backend/tests/restaurantCheckout.test.js backend/tests/restaurantReservations.test.js backend/tests/restaurantRoutes.test.js backend/tests/restaurantPartnerRoutes.test.js
```

Expected: pass.

- [ ] **Step 2: Run focused frontend tests**

Run:

```bash
node --test src/components/RestaurantPartner/restaurantPartnerCheckoutState.test.js src/components/Admin/restaurantCheckoutAdminState.test.js src/components/Marketplace/restaurantReservationState.test.js src/components/RestaurantPartner/restaurantPartnerReservationState.test.js src/components/Admin/restaurantReservationAdminState.test.js
```

Expected: pass.

- [ ] **Step 3: Run production build**

Run: `npm run build`

Expected: Vite client build, SSR build, and prerender complete successfully.

- [ ] **Step 4: Commit and push**

Stage only restaurant checkout files and commit:

```bash
git commit -m "feat: add restaurant dining checkout"
git push origin main
```

Leave unrelated local screenshots and deleted image files untouched.
