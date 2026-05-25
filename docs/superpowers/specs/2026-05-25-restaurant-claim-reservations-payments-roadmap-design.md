# Restaurant Claim, Reservations, And Payments Roadmap Design

**Date:** 2026-05-25  
**Status:** Approved for planning  
**Scope:** Restaurant continuation roadmap with implementation order:
1. Self-claim and partner onboarding
2. Reservations and table availability
3. Payments and event dining checkout

---

## Goal

Extend the existing AI-native restaurant marketplace into a real B2B2C operations and commerce surface by introducing restaurant ownership onboarding first, then reservation operations, then dining-specific payments.

This roadmap intentionally follows the same pattern used successfully for Hotels:
- ownership and partner access first
- operational truth second
- commerce third

---

## Architecture Direction

The restaurant system should continue to reuse the existing marketplace foundation already implemented:
- canonical `Restaurant` entity in MongoDB as the live write model
- PostgreSQL restaurant records as normalized business-truth and reporting inputs
- existing inquiry, attribution, analytics, trust, and AI layers

Each new subsystem should be layered on top of that canonical entity rather than introducing parallel records that fragment ownership or reservation state.

---

## Phase 1: Restaurant Self-Claim And Partner Onboarding

### Product Flow

The first restaurant continuation phase should focus on safe ownership capture:

1. `Find your restaurant`
- a restaurant owner or manager searches for an existing restaurant listing by name, destination, or region

2. `Request claim`
- the claimant submits their identity, role, phone/WhatsApp, work email, proof note, and optional proof links

3. `Platform review`
- platform or tenant admin reviews whether the claimant appears legitimately connected to the restaurant and whether the listing is already linked to partner/admin access

4. `Approve claim`
- if approved, the platform creates restaurant-partner admin access tied to the canonical restaurant entity

5. `Fallback new listing request`
- if the restaurant does not exist, the claimant can request a new listing, but it must be reviewed before becoming a canonical public restaurant

### Core Rule

The system should always prefer:
- `claim existing listing first`
- `create new listing only as fallback`

This preserves trust data, sponsored history, attribution continuity, and canonical entity quality.

---

## Phase 1 Data Model

### Canonical Entity

`Restaurant`
- remains the canonical public dining marketplace entity
- is not mutated into a pending-claim object

### Approved Access

`RestaurantPartnerAdmin`
- represents approved restaurant-partner access
- is created only after claim approval

### New Review Object

`RestaurantClaimRequest`
- stores claim intake and moderation history

Recommended fields:
- `tenantId`
- `restaurantId`
- `restaurantNameSnapshot`
- `destinationSnapshot`
- `regionSnapshot`
- claimant name
- claimant email
- claimant phone
- claimant role
- proof note
- proof links
- claim type
  - `existing-listing`
  - `new-listing-request`
- status
  - `pending`
  - `approved`
  - `rejected`
  - `needs-more-proof`
- reviewer metadata
- linked partner admin id after approval
- optional proposed restaurant payload for fallback creation

### Ownership Boundary

- `RestaurantClaimRequest` = intake and moderation
- `RestaurantPartnerAdmin` = approved access
- `Restaurant` = canonical listing

This separation avoids overloading the partner-access model and preserves an auditable review queue.

---

## Phase 1 Verification And Approval

### Verification Style

The first version should use `human-reviewed verification with structured signals`, not hard automation.

### Suggested Signals

- business email domain
- restaurant website
- social links
- role/title
- explanation note
- existing partner link on the restaurant
- existing active restaurant partner admins

### Approval Outcomes

1. `Approve`
- create `RestaurantPartnerAdmin`
- attach claimant to the restaurant
- mark claim request approved

2. `Reject`
- preserve full history
- optionally store reviewer note

3. `Needs more proof`
- keep request open
- request stronger evidence

### Anti-Abuse Rules

- one restaurant should not silently accumulate unknown admins
- claims against already-managed restaurants should be reviewed more cautiously
- fallback new-listing requests should never auto-publish

---

## Phase 1 UI Surfaces

### Public Claim Page

Create a public restaurant claim page where staff can:
- search for their restaurant
- select an existing listing to claim
- or fall back to a new-listing request

The full claim form should only appear after listing selection or an explicit “not found” path.

### Admin Review Queue

Add a restaurant-claims moderation surface where platform or tenant admins can:
- review pending claims
- inspect proof
- approve, reject, or request more proof
- see whether the restaurant already has partner admins
- see whether the restaurant is already linked to a partner account

### Partner Outcome

After approval:
- claimant should receive real restaurant-partner access
- claimant should land in the restaurant partner dashboard/onboarding flow

---

## Phase 2: Restaurant Reservations And Table Availability

This is the second implementation cycle, after claim and onboarding are stable.

### Goal

Move restaurants from lead-only dining intent into structured reservation operations.

### Capabilities

- table or service-type structures
- service windows
- dated availability or service capacity
- operational status such as:
  - open
  - limited
  - fully booked
  - on-request
  - closed
- party-size-aware reservation intent
- restaurant-side availability management

### Boundary

This phase should provide operational reservation truth, but not yet full dining payments or event checkout.

---

## Phase 3: Restaurant Payments And Event Dining Checkout

This is the third implementation cycle, after reservations are working.

### Goal

Add real dining commerce to reservation-capable restaurants, especially for paid holds, group dining, and event dining.

### Capabilities

- reservation-linked deposit flows
- group dining payment requests
- event dining checkout
- dining-linked revenue tracking
- alignment with the existing payment transaction and revenue-core systems

### Boundary

This phase should not force every restaurant into full payment commerce. It should support optional commerce where the dining flow actually benefits from deposits or prepayment.

---

## Database Ownership

Follow the same multi-database pattern already established elsewhere in the platform.

### MongoDB

Owns:
- canonical `Restaurant`
- future `RestaurantClaimRequest`
- restaurant-partner access state
- reservation operational state during restaurant-side management

### PostgreSQL

Owns:
- normalized restaurant records
- attribution and revenue reporting inputs
- future reservation and payment business-truth rollups where applicable

### pgvector

Owns:
- restaurant semantic retrieval context for AI concierge and future restaurant matching

### Redis

Owns:
- short-lived orchestration state
- automation timing
- retries and transient coordination state

---

## Roadmap Order

The restaurant roadmap should proceed in this order:

1. `Restaurant self-claim + partner onboarding`
2. `Restaurant reservations + table availability`
3. `Restaurant payments + event dining checkout`

This order is recommended because:
- ownership must be trustworthy before restaurant-side operational editing expands
- reservations need operational truth before commerce can rely on them
- payments should sit on top of confirmed reservation structures, not precede them

---

## Success Criteria

### Phase 1

- restaurant staff can claim an existing listing
- new listing request is fallback only
- admins can review safely
- approved claims create real restaurant-partner access
- canonical restaurant quality stays intact

### Phase 2

- restaurants can manage table/service availability with clear operational states
- reservation intent becomes structured and manageable

### Phase 3

- restaurants can collect deposits or dining payments where applicable
- dining revenue events feed the existing payment and revenue stack cleanly

