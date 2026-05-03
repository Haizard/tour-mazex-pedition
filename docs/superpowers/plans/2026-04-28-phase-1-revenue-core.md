# Phase 1 Revenue Core Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish the revenue-critical parts of the product so a traveler can move reliably from inquiry to quote to booking to payment while operators track and convert those conversations from the unified inbox.

**Architecture:** This phase stays inside the current Express + React + MongoDB architecture, but shapes data and flows so they can later migrate into PostgreSQL cleanly. Payment flows are hardened first, then booking-state consistency, then inbox conversion workflows, then sales-assistant behavior, then attribution fields and reporting hooks.

**Tech Stack:** React 18, Vite, Node.js, Express, MongoDB/Mongoose, existing admin UI, existing Node test runner

---

## File Structure

**Reference:**

- `MASTER_IMPLEMENTATION_BLUEPRINT.md`
- `docs/superpowers/plans/2026-04-28-tourism-infrastructure-master-roadmap.md`

**Likely Modify:**

- `backend/models/PaymentTransaction.js`
- `backend/models/Booking.js`
- `backend/models/QuoteProposal.js`
- `backend/models/ChatConversation.js`
- `backend/models/ContactMessage.js`
- `backend/models/CustomInquiry.js`
- `backend/models/EmailThread.js`
- `backend/routes/paymentRoutes.js`
- `backend/routes/unifiedInboxRoutes.js`
- `backend/routes/chatRoutes.js`
- `backend/utils/paymentAutomation.js`
- `backend/utils/unifiedInbox.js`
- `backend/utils/chatSalesAssistant.js`
- `backend/tests/paymentAutomation.test.js`
- `backend/tests/unifiedInbox.test.js`
- `backend/tests/chatSalesAssistant.test.js`
- `src/components/Admin/PaymentAutomationManager.jsx`
- `src/components/Admin/UnifiedInboxManager.jsx`
- `src/services/api.js`

**Likely Create:**

- `backend/utils/paymentWebhookState.js`
- `backend/tests/paymentWebhookState.test.js`

---

## Success Criteria

- payment transactions support stronger state transitions, operator visibility, and retry-safe webhook handling
- booking and quote records expose a consistent payment-related lifecycle
- unified inbox covers revenue-driving channels and action states cleanly
- chatbot sales assistant asks qualification questions and offers clearer conversion next steps
- the system captures enough attribution data to measure channel-to-booking performance later

---

## Task 1: Audit the current revenue core contracts

**Files:**

- Reference: `backend/models/PaymentTransaction.js`
- Reference: `backend/models/Booking.js`
- Reference: `backend/models/QuoteProposal.js`
- Reference: `backend/routes/paymentRoutes.js`
- Reference: `backend/routes/unifiedInboxRoutes.js`
- Reference: `backend/utils/paymentAutomation.js`
- Reference: `backend/utils/unifiedInbox.js`
- Reference: `backend/utils/chatSalesAssistant.js`

- [ ] **Step 1: Read the current payment model and route contracts**

Run:

```bash
type backend\models\PaymentTransaction.js
type backend\routes\paymentRoutes.js
type backend\utils\paymentAutomation.js
```

Expected: current payment flow supports creation, status updates, summary generation, and public checkout URLs

- [ ] **Step 2: Read the inbox and sales-assistant contracts**

Run:

```bash
type backend\utils\unifiedInbox.js
type backend\utils\chatSalesAssistant.js
type backend\tests\unifiedInbox.test.js
type backend\tests\chatSalesAssistant.test.js
```

Expected: current system already merges inbox channels and produces basic sales suggestions

- [ ] **Step 3: Record the exact contract gaps before editing**

Write down:

- missing payment statuses or timestamps
- missing booking and quote lifecycle links
- missing inbox channels or operator states
- missing attribution fields
- missing sales-assistant qualification data

---

## Task 2: Harden payment automation and webhook-safe state handling

**Files:**

- Modify: `backend/models/PaymentTransaction.js`
- Modify: `backend/routes/paymentRoutes.js`
- Modify: `backend/utils/paymentAutomation.js`
- Create: `backend/utils/paymentWebhookState.js`
- Create: `backend/tests/paymentWebhookState.test.js`
- Modify: `backend/tests/paymentAutomation.test.js`

- [ ] **Step 1: Extend the payment model contract mentally before coding**

Required additions:

- idempotency-friendly webhook fields
- provider reference fields
- clearer lifecycle timestamps
- reconciliation notes
- optional failure reasons

- [ ] **Step 2: Write failing test expectations for payment automation**

Add tests for:

```js
// summarizePaymentTransaction should describe refunded or partially completed states clearly
// webhook state helper should ignore duplicate provider events
// checkout URL builder should remain tenant-safe
```

- [ ] **Step 3: Implement webhook-safe state helper**

Create `backend/utils/paymentWebhookState.js` with helpers such as:

```js
export const shouldIgnoreWebhookEvent = ({ currentStatus, incomingStatus, externalEventId, processedEventIds })
export const buildPaymentStatusPatch = ({ current, incomingStatus, occurredAt, externalEventId, failureReason })
```

- [ ] **Step 4: Extend payment route handling**

Add route-side logic for:

- safe status transitions
- duplicate-event protection
- operator-visible failure reasons
- future compatibility with Stripe and Pesapal webhook inputs

- [ ] **Step 5: Re-run payment tests**

Run:

```bash
node --test backend/tests/paymentAutomation.test.js backend/tests/paymentWebhookState.test.js
```

Expected: all tests pass

---

## Task 3: Align quote, booking, and payment lifecycle state

**Files:**

- Modify: `backend/models/Booking.js`
- Modify: `backend/models/QuoteProposal.js`
- Modify: `backend/routes/paymentRoutes.js`
- Modify: `src/components/Admin/PaymentAutomationManager.jsx`
- Modify: `src/services/api.js`

- [ ] **Step 1: Audit current quote and booking payment references**

Run:

```bash
type backend\models\Booking.js
type backend\models\QuoteProposal.js
```

Expected: identify whether payment status is duplicated, missing, or weakly linked

- [ ] **Step 2: Define the minimal lifecycle contract**

The phase should standardize:

- quote status
- booking status
- payment status
- payment-required flag
- last payment activity timestamp

- [ ] **Step 3: Update admin payment views**

`src/components/Admin/PaymentAutomationManager.jsx` should show:

- linked booking name
- current lifecycle status
- payment failure or cancellation reasons
- most recent status time

- [ ] **Step 4: Verify front-end integration**

Run:

```bash
npm run lint
```

Expected: no lint errors introduced by payment manager or API changes

---

## Task 4: Complete unified inbox for revenue conversion workflows

**Files:**

- Modify: `backend/utils/unifiedInbox.js`
- Modify: `backend/routes/unifiedInboxRoutes.js`
- Modify: `backend/tests/unifiedInbox.test.js`
- Modify: `src/components/Admin/UnifiedInboxManager.jsx`
- Modify: `src/services/api.js`

- [ ] **Step 1: Expand the inbox contract mentally before coding**

The inbox should support:

- revenue-facing channel metadata
- action states for reply, follow-up, and escalation
- attribution-ready fields
- clearer channel typing for website chat, contact messages, email, and WhatsApp

- [ ] **Step 2: Add failing test expectations**

Add tests for:

```js
// items should expose action eligibility for reply/follow-up/escalation
// items should preserve source channel for attribution reporting
// inbox ordering should remain stable after new metadata is added
```

- [ ] **Step 3: Extend normalized inbox items**

Update the utility so each item can expose:

- `channel`
- `sourceType`
- `lastActivityAt`
- `conversionStage`
- `assignedTo`
- `leadSource`
- `canReply`
- `canEscalate`

- [ ] **Step 4: Update the admin inbox UI**

`src/components/Admin/UnifiedInboxManager.jsx` should surface:

- clearer next action buttons
- revenue-stage badge or label
- lead-source visibility
- easier transition from inbox item to source record

- [ ] **Step 5: Re-run inbox tests**

Run:

```bash
node --test backend/tests/unifiedInbox.test.js
```

Expected: tests pass and new contract is covered

---

## Task 5: Upgrade the AI sales assistant for qualification and booking conversion

**Files:**

- Modify: `backend/utils/chatSalesAssistant.js`
- Modify: `backend/tests/chatSalesAssistant.test.js`
- Modify: `backend/routes/chatRoutes.js`
- Modify: `src/components/Chat/ChatBot.jsx`

- [ ] **Step 1: Add failing test expectations**

Add tests for:

```js
// payload should include a stronger qualification question when a tour match exists
// payload should include a follow-up intent such as quote, planner, or booking
// fallback should still guide the user toward a conversion path
```

- [ ] **Step 2: Extend sales-assistant payload shape**

Target additions:

- `intent`
- `recommendedNextStep`
- `qualificationQuestion`
- `quickActions`
- optional `matchedTourId`

- [ ] **Step 3: Make the chatbot surface the richer payload**

The UI should show:

- a recommended next step
- qualification question
- direct CTA into package or planner flow

- [ ] **Step 4: Re-run sales assistant tests**

Run:

```bash
node --test backend/tests/chatSalesAssistant.test.js
```

Expected: tests pass and payload behavior is more conversion-oriented

---

## Task 6: Lay the attribution foundation for later ROI reporting

**Files:**

- Modify: `backend/models/CustomInquiry.js`
- Modify: `backend/models/Booking.js`
- Modify: `backend/utils/unifiedInbox.js`
- Modify: `src/components/Admin/UnifiedInboxManager.jsx`

- [ ] **Step 1: Define the minimum attribution fields**

Add or standardize:

- lead source
- campaign or referrer label
- first touch timestamp
- conversion timestamp placeholder

- [ ] **Step 2: Add attribution visibility to operator workflows**

At minimum, inbox items or booking-linked views should display:

- source channel
- acquisition context if known

- [ ] **Step 3: Keep attribution fields PostgreSQL-ready**

Field names should be durable enough to migrate later without semantic changes.

---

## Task 7: Verify the revenue core tranche

**Files:**

- Verify: `backend/tests/paymentAutomation.test.js`
- Verify: `backend/tests/paymentWebhookState.test.js`
- Verify: `backend/tests/unifiedInbox.test.js`
- Verify: `backend/tests/chatSalesAssistant.test.js`

- [ ] **Step 1: Run targeted backend tests**

Run:

```bash
node --test backend/tests/paymentAutomation.test.js backend/tests/paymentWebhookState.test.js backend/tests/unifiedInbox.test.js backend/tests/chatSalesAssistant.test.js
```

Expected: all targeted tests pass

- [ ] **Step 2: Run frontend lint verification**

Run:

```bash
npm run lint
```

Expected: pass without new warnings or errors

- [ ] **Step 3: Record follow-on migration notes**

Document after implementation:

- which payment fields belong in future PostgreSQL tables
- which inbox fields belong in future conversation and attribution tables
- which chatbot payload fields require future analytics tracking

---

## Immediate Execution Order

Implement this phase in the following order:

1. Payment automation hardening
2. Quote-booking-payment lifecycle alignment
3. Unified inbox revenue workflow completion
4. Sales-assistant upgrade
5. Attribution foundation
6. Verification and migration notes

---

## Handoff

This is the first execution plan that should be implemented from the master roadmap.

Once Phase 1 is complete, move next to:

`docs/superpowers/plans/2026-04-28-phase-2-operations-core.md`
