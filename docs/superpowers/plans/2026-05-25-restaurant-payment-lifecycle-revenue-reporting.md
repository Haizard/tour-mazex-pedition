# Restaurant Payment Lifecycle And Revenue Reporting Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sync restaurant reservation payment state from payment lifecycle changes and report restaurant dining revenue.

**Architecture:** Payment webhook processing already updates `PaymentTransaction` and calls linked-record sync hooks. This plan extends that hook to restaurant reservations and expands restaurant analytics to read restaurant-linked payment transactions.

**Tech Stack:** Node.js ES modules, Express, Mongoose, React state helpers, Node test runner, Vite build.

---

## Task 1: Restaurant Payment Lifecycle Sync

**Files:**
- Create `backend/utils/restaurantPaymentLifecycle.js`
- Modify `backend/utils/paymentWebhookProcessor.js`
- Test `backend/tests/restaurantPaymentLifecycle.test.js`
- Extend `backend/tests/paymentWebhookQueue.test.js` or add focused processor import coverage

- [ ] Write failing tests for status mapping and sync patch.
- [ ] Implement lifecycle utility.
- [ ] Wire `processQueuedPaymentWebhooksNow` to call restaurant sync after payment save.
- [ ] Run focused backend lifecycle tests.

## Task 2: Restaurant Revenue Analytics

**Files:**
- Modify `backend/utils/restaurantAnalytics.js`
- Modify `backend/routes/restaurantRoutes.js`
- Test `backend/tests/restaurantAnalytics.test.js`

- [ ] Write failing tests for restaurant payment totals and reason splits.
- [ ] Extend analytics snapshot to accept `payments`.
- [ ] Fetch restaurant-linked payments in restaurant analytics route.
- [ ] Run focused analytics tests.

## Task 3: Frontend Revenue Visibility

**Files:**
- Modify `src/components/Admin/restaurantAnalyticsState.js`
- Modify `src/components/Admin/restaurantAnalyticsState.test.js`
- Modify `src/components/Admin/RestaurantManager.jsx`
- Modify `src/components/RestaurantPartner/restaurantPartnerCheckoutState.js`
- Modify `src/components/RestaurantPartner/restaurantPartnerCheckoutState.test.js`

- [ ] Add state tests for revenue cards and partner payment summary labels.
- [ ] Add revenue cards to restaurant manager.
- [ ] Keep partner summary helpers consistent with reservation payment states.
- [ ] Run focused frontend tests.

## Task 4: Verification And Commit

- [ ] Run backend focused tests:

```bash
node --test backend/tests/restaurantPaymentLifecycle.test.js backend/tests/restaurantAnalytics.test.js backend/tests/paymentWebhookQueue.test.js backend/tests/restaurantRoutes.test.js
```

- [ ] Run frontend focused tests:

```bash
node --test src/components/Admin/restaurantAnalyticsState.test.js src/components/RestaurantPartner/restaurantPartnerCheckoutState.test.js
```

- [ ] Run `npm run build`.
- [ ] Commit and push only restaurant lifecycle/reporting files.
