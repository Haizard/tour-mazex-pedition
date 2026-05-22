# Hotel Claim And Self-Registration Design

## Goal

Add a safe, marketplace-aligned `Hotel Claim + Self-Registration` flow that lets hotel owners and managers join the platform without breaking the canonical hotel entity model.

The feature must:

- prefer claiming an existing hotel listing before creating a new one
- protect the platform from duplicate hotel records
- keep hotel ownership and claim history auditable
- fit the current `Hotel -> HotelPartnerAdmin -> Hotel Partner Portal` structure
- prepare the platform for later hotel inventory, pricing, and OTA-style commerce work

## Chosen Product Direction

The selected approach is:

- `Claim an existing hotel listing first`

This means:

1. hotel staff search for an existing hotel
2. if found, they request claim access
3. if not found, they can submit a `new hotel listing request`
4. platform review determines whether access or listing creation is approved

This is better than open self-creation because it:

- preserves one canonical hotel record
- reduces duplicates
- keeps trust, reviews, and analytics on a single entity
- aligns with the entity-first hotel architecture already chosen

## Product Flow

### 1. Find Your Hotel

Public users who believe they represent a hotel can:

- search by hotel name
- search by destination
- search by region

If the platform finds a likely match, the user can select that hotel and continue into a claim flow.

### 2. Request Claim

For an existing hotel listing, the claimant submits:

- claimant name
- work email
- phone or WhatsApp
- claimant role
- proof note
- optional proof links

The request is stored as a moderation object, not approved access.

### 3. Platform Review

Platform or tenant admins review the request and decide whether to:

- approve
- reject
- request more proof

### 4. Approve Claim

If approved:

- create a `HotelPartnerAdmin`
- attach that admin to the canonical hotel
- preserve the claim audit trail
- send the claimant into the hotel partner access flow

### 5. Fallback New Listing Request

If no hotel exists:

- user can submit a `new hotel listing request`
- this creates a review object, not an immediately public hotel
- if approved, the platform creates:
  - canonical `Hotel`
  - then `HotelPartnerAdmin`

## Core Data Model

The design uses 3 separate layers.

### 1. `Hotel`

This remains the canonical public marketplace entity.

It is not replaced or overloaded by the claim process.

### 2. `HotelPartnerAdmin`

This remains the approved access record.

It should only exist after approval.

### 3. `HotelClaimRequest`

This is the new moderation and intake record.

It should include:

- `tenantId`
- `hotelId`
- `hotelNameSnapshot`
- `destinationSnapshot`
- `claimantName`
- `claimantEmail`
- `claimantPhone`
- `claimantRole`
- `proofNote`
- `proofLinks`
- `claimType`
  - `existing-listing`
  - `new-listing-request`
- `status`
  - `pending`
  - `approved`
  - `rejected`
  - `needs-more-proof`
- `reviewedBy`
- `reviewedAt`
- `reviewNote`
- `linkedPartnerAdminId`
- `proposedHotelPayload`

### Important Ownership Rule

- `HotelClaimRequest` = request/review object
- `HotelPartnerAdmin` = approved access object
- `Hotel` = canonical hotel listing

That separation keeps the marketplace clean and auditable.

## Verification And Approval Logic

### V1 Verification Model

The first version should be:

- `human-reviewed with structured signals`

It should not be fully automatic.

### Verification Signals

Admins should review signals such as:

- business email domain
- property website link
- social profile link
- role or title
- explanation note
- whether the hotel already has partner linkage
- whether the hotel already has active hotel admins

### Approval Outcomes

#### Approve

- create `HotelPartnerAdmin`
- link it to the hotel
- mark claim approved

#### Reject

- keep the claim record
- optionally include rejection reason

#### Needs More Proof

- keep the claim open
- allow the admin to request stronger proof

### Anti-Abuse Rules

- one hotel should not silently accumulate many unknown active admins
- if a hotel already has active hotel admins, review should be more cautious
- if a hotel is already linked to partner records, surface that clearly
- fallback new hotel requests must not auto-publish to the marketplace

## UI Structure

The feature needs 3 surfaces.

### 1. Public `Hotel Claim` Page

A public page where hotel staff can:

- search their hotel
- claim an existing listing
- request a new listing if no match exists

Main areas:

- search input
- matching hotel cards
- claim request form
- fallback new-listing request form

The full form should appear only after:

- hotel selection
- or explicit `not found` continuation

### 2. Admin `Hotel Claims Queue`

An admin moderation surface where reviewers can:

- see pending claims
- inspect proof
- inspect existing hotel linkage
- see whether a hotel already has partner admins
- approve
- reject
- request more proof

### 3. Hotel Partner Outcome

After approval:

- claimant receives hotel partner access
- the existing hotel partner portal remains the post-approval working surface

## Technical Fit In Current Repo

### Backend Additions

- `backend/models/HotelClaimRequest.js`
- public claim search and intake routes
- admin moderation routes
- helper utilities for claim normalization and approval

### Existing Backend Pieces To Reuse

- [Hotel.js](C:/Users/SFG%20DESIGN/Desktop/tour-mazex-pedition/backend/models/Hotel.js)
- [HotelPartnerAdmin.js](C:/Users/SFG%20DESIGN/Desktop/tour-mazex-pedition/backend/models/HotelPartnerAdmin.js)
- [hotelRoutes.js](C:/Users/SFG%20DESIGN/Desktop/tour-mazex-pedition/backend/routes/hotelRoutes.js)
- [hotelPartnerAuthRoutes.js](C:/Users/SFG%20DESIGN/Desktop/tour-mazex-pedition/backend/routes/hotelPartnerAuthRoutes.js)
- [hotelPartnerPortalRoutes.js](C:/Users/SFG%20DESIGN/Desktop/tour-mazex-pedition/backend/routes/hotelPartnerPortalRoutes.js)
- [hotelPartnerAccess.js](C:/Users/SFG%20DESIGN/Desktop/tour-mazex-pedition/backend/utils/hotelPartnerAccess.js)

### Frontend Additions

- `src/pages/HotelClaimPage.jsx`
- `src/components/Admin/HotelClaimManager.jsx`
- claim helper and state files

### Existing Frontend Pieces To Reuse

- public hotel discovery page patterns
- admin dashboard/sidebar tab structure
- existing hotel partner login/dashboard flow

## Database Ownership

This feature should follow the same platform rule already used for Hotels:

- `MongoDB`
  - live write model for claim requests and partner access records
- `PostgreSQL`
  - normalized business-truth reporting layer later if needed

For the first claim phase:

- `HotelClaimRequest` can begin as Mongo-first
- if reporting or moderation volume grows, mirror into Postgres later

The important rule is to avoid inventing a different storage pattern for claims than the rest of the hospitality feature family.

## Implementation Scope

### Included In First Implementation

- search existing hotel listings
- submit claim request
- submit fallback new-listing request
- admin claims queue
- approve / reject / needs-more-proof flow
- create `HotelPartnerAdmin` on approval
- attach approved partner access to hotel
- preserve claim history

### Explicitly Out Of Scope For This Phase

- automatic approval
- hotel self-service publishing
- self-serve hotel billing
- advanced verification workflows
- email-token onboarding and passwordless flows
- live hotel inventory
- checkout
- OTA sync

## Rollout Order

### Phase 1: Claim Foundation

- `HotelClaimRequest` model
- public hotel search + claim flow
- fallback new-listing request
- admin claims queue

### Phase 2: Approval Workflow

- approve / reject / needs-more-proof
- create `HotelPartnerAdmin`
- link approved partner to hotel
- preserve review metadata

### Phase 3: UX Polish

- duplicate-claim warnings
- better public status messages
- stronger existing-admin awareness
- cleaner review notes and proof visibility

## Success Criteria

This phase is successful when:

- hotel staff can request claim of an existing listing
- new hotel creation is fallback only
- admins can review and approve safely
- approved requests create hotel partner access
- canonical hotel data remains clean
- claim history is auditable

## Relationship To Later Hotel Commerce Work

This phase should happen before:

- live room inventory / availability calendar
- OTA-style pricing and checkout
- channel manager integrations

That order is intentional because merchant identity and ownership should be solved before operational hotel commerce becomes deeper.
