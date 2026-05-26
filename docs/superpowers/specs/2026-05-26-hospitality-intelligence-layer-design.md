# Hospitality Intelligence Layer Design

Date: 2026-05-26

## Goal

Add a shared AI-native hospitality intelligence layer that connects Tours, Hotels, and Restaurants into one trip-assembly marketplace.

The feature should make the platform feel like an intelligent travel brain, not separate listing pages. It should help travelers complete better trips, help operators convert leads into higher-value packages, and give the platform a revenue attribution foundation for cross-sell, sponsored placement, lead fees, commissions, and package-margin reporting.

## Product Direction

The approved direction is `Hospitality Intelligence V1`.

This is not another standalone entity feature. It is a recommendation and packaging layer above the existing marketplace entities:

- `Tour` / itinerary products
- `Hotel`
- `Restaurant`
- `CustomInquiry`
- `Booking`
- existing trust, checkout, reservation, and partner signals

The system should recommend combinations such as:

- safari package plus arrival hotel
- hotel stay plus nearby dinner option
- tour day plus lunch stop
- honeymoon trip plus romantic dinner
- family safari plus family-safe restaurant
- private group tour plus event dining option

## Why This Comes Next

Hotels and Restaurants now have enough foundation for a shared intelligence layer:

- hotel discovery, claim, inventory, checkout, and analytics work exists
- restaurant discovery, trust, reservations, checkout, payment lifecycle, and analytics work exists
- marketplace discovery, saved trips, comparisons, regions, trust, and inquiries already exist
- revenue attribution needs to connect products instead of reporting each vertical in isolation

The next moat is not more listings. The moat is the AI layer that learns how to assemble a trip from trusted marketplace parts.

## V1 Scope

### In Scope

- AI trip completion recommendations across tours, hotels, and restaurants
- traveler-facing cross-sell modules on detail and discovery surfaces
- operator-facing package suggestions for inquiries and lead handling
- explanation metadata for why each recommendation fits
- revenue attribution metadata for each recommendation source
- trust-safe AI boundaries that avoid fabricated availability, pricing, or confirmations
- reusable backend recommendation utility with focused tests
- reusable frontend state helper for recommendation cards and fit explanations

### Out Of Scope

- fully autonomous booking confirmation
- external supplier negotiation
- dynamic supplier pricing optimization
- live external OTA/channel-manager sync beyond existing hotel and restaurant systems
- replacing existing hotel or restaurant checkout flows
- replacing existing inquiry, quote, or booking systems
- training a new model inside this implementation cycle

## User Experience

### Traveler Experience

Travelers should see helpful, contextual prompts instead of generic recommendations.

Examples:

- On a tour page: `Complete this safari with these hotels and dining moments`
- On a hotel page: `Trips and restaurants that fit this stay`
- On a restaurant page: `Best trips and hotels to pair with this dining experience`
- In discovery or planning surfaces: `AI-built hospitality set`

Each recommendation should explain the fit using stored data:

- destination or region match
- itinerary timing fit
- hotel style or room summary
- restaurant cuisine, meal type, dietary, or ambiance fit
- traveler profile hints when available
- trust or sponsored status when relevant

The UI must clearly label sponsored recommendations and avoid implying confirmed availability unless existing operational state supports that claim.

### Operator Experience

When a lead or inquiry arrives, the system should help operators increase package value.

The operator-facing suggestion should answer:

- which hotel can make this trip more complete
- which restaurant fits the traveler context
- whether this looks like arrival, lunch, farewell, group, event, or dietary-sensitive dining
- what add-on could be suggested in the reply
- why the suggestion is safe and grounded

This should start as metadata and helper copy, not autonomous outbound communication.

## AI Behavior

### AI Responsibilities

The intelligence layer may:

- classify trip context
- recommend entity pairings
- explain why a pairing fits
- prioritize add-ons
- suggest operator next-best actions
- generate short response guidance
- track recommendation source and confidence

### AI Trust Boundary

The intelligence layer must not fabricate:

- hotel room availability
- restaurant table availability
- confirmed prices
- payment status
- supplier commitments
- menu guarantees
- reservation confirmation

If the system only knows a place is a good fit, it should say it is a recommendation. If the platform has real checkout, reservation, or inventory status, the UI may show that separately through the existing source of truth.

## Data Ownership

The feature must follow the platform multi-database approach.

### MongoDB

MongoDB remains the live application write store for:

- active recommendation request context
- marketplace entity reads
- inquiry-linked recommendation metadata
- operator workflow metadata
- short-lived AI recommendation outputs when persisted

### PostgreSQL

PostgreSQL remains the normalized reporting and business-truth direction for:

- future recommendation event reporting
- revenue attribution rollups
- conversion analytics
- supplier and partner reporting

V1 should not require a new Postgres dependency to run the live feature if the current workspace does not already support it. It should shape attribution metadata so Postgres sync can consume it later.

### pgvector

pgvector remains the future semantic grounding layer for:

- itinerary fit retrieval
- cuisine and dietary fit
- hotel style matching
- traveler preference memory

V1 can use deterministic scoring and stored metadata first, then leave a clear seam for vector retrieval.

### Redis

Redis can remain optional for future short-lived orchestration:

- AI follow-up timing
- background recommendation refresh
- retry state

V1 does not need Redis unless an existing pattern already makes it useful.

## Recommendation Model

V1 should use a deterministic first-pass scoring model with AI-ready explanation fields.

Primary scoring signals:

- destination or region match
- marketplace visibility and publish status
- trust score, rating, or review count
- sponsored placement with transparent labeling
- meal timing and itinerary context for restaurants
- accommodation style and stay timing for hotels
- traveler preference hints from inquiry or session context
- existing payment/reservation/inventory signals when available

Recommended output shape:

- `recommendationId`
- `sourceType`
- `sourceId`
- `targetType`
- `targetId`
- `fitScore`
- `confidence`
- `reasons`
- `trustNotes`
- `sponsored`
- `attribution`
- `disclaimer`

## Revenue Attribution

Every recommendation that appears in a conversion path should carry attribution metadata.

At minimum:

- `recommendationSource`
- `sourceEntityType`
- `sourceEntityId`
- `recommendedEntityType`
- `recommendedEntityId`
- `surface`
- `sponsored`
- `sessionKey`
- `inquiryId` when known
- `bookingId` or `paymentId` when known later

This supports future reporting for:

- hotel upsells
- restaurant upsells
- tour-to-hotel conversion
- tour-to-restaurant conversion
- sponsored recommendation performance
- AI concierge contribution
- package-margin and commission reporting

## Architecture

### Backend

Add a focused hospitality intelligence utility rather than scattering pairing logic across route files.

Candidate utility:

- `backend/utils/hospitalityIntelligence.js`

Responsibilities:

- normalize source context
- score hotel, restaurant, and tour pairings
- generate grounded fit reasons
- attach attribution metadata
- enforce AI trust disclaimers

Candidate API route:

- reuse marketplace or discovery route patterns if a dedicated route is unnecessary
- otherwise add a small route under the existing marketplace/discovery API family

The route should be read-oriented first. Persisting recommendation events can come when a user saves, inquires, checks out, or explicitly adds a recommendation to an itinerary.

### Frontend

Add a reusable marketplace component and state helper.

Candidate files:

- `src/components/Marketplace/hospitalityIntelligenceState.js`
- `src/components/Marketplace/HospitalityPairingPanel.jsx`

Initial surfaces:

- tour detail or discovery detail surface
- hotel detail surface
- restaurant detail surface

The panel should support:

- mixed hotel, restaurant, and tour cards
- fit explanations
- sponsored labels
- trust disclaimers
- add-to-itinerary or inquiry CTAs using existing flows

### Admin And Operator Surfaces

V1 should expose operator recommendations where the current inquiry or admin flow already has context. If the exact UI location is too crowded, start with a backend/state helper and a compact admin module.

Useful outputs:

- recommended hotel add-on
- recommended restaurant add-on
- package completion note
- reply guidance
- next-best action

## Error Handling

If recommendation generation cannot find enough matching data:

- return an empty recommendation set with a helpful reason
- do not throw a 500 for missing optional hotel, restaurant, or tour data
- do not block the source page from rendering
- show a graceful empty state such as `No strong hospitality pairings yet`

If a referenced entity is unpublished or unavailable:

- exclude it from public traveler recommendations
- allow admin/operator-only diagnostics only when existing permissions support it

## Testing Strategy

### Backend Tests

Cover:

- destination and region matching
- trust/sponsored labeling
- restaurant meal timing fit
- hotel style/stay fit
- attribution metadata shaping
- no fabrication of availability or pricing
- graceful empty recommendation behavior

### Frontend Tests

Cover:

- recommendation card shaping
- fit reason rendering state
- sponsored labeling
- disclaimer rendering
- empty state behavior
- CTA payload shaping for inquiry or itinerary flows

### Build Verification

After implementation, run focused tests first, then the full build:

- focused backend node tests
- focused frontend node tests
- `npm run build`

## Success Criteria

The feature is successful when:

- travelers can see relevant hotel, restaurant, and tour pairings from at least one marketplace surface
- operators can receive package-completion suggestions from a lead or inquiry context
- recommendations explain fit without fabricating operational facts
- sponsored recommendations are transparent
- attribution metadata is attached to recommendation-driven conversion paths
- tests prove the scoring, explanation, attribution, and trust-boundary behavior

## Implementation Sequence

1. Build the pure recommendation utility and tests.
2. Add API access using existing marketplace/discovery route patterns.
3. Add frontend state shaping and tests.
4. Add the reusable traveler pairing panel.
5. Mount the panel on the safest first detail surface.
6. Add operator/admin suggestion output where inquiry context already exists.
7. Verify focused tests and full build.

