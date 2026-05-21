# Hotels And Restaurants B2B2C Revenue Notes

## Purpose

Capture the agreed product and revenue grounding for the upcoming `Hotels` and `Restaurants` feature family before implementation planning continues.

## Confirmed Product Direction

- We need **both** `Hotels` and `Restaurants`.
- We will **start with Hotels first**.
- The chosen implementation shape for Hotels is:
  - `Entity-first hybrid`
- This means:
  - create a canonical public `Hotel` entity first
  - connect it to existing accommodation operations
  - support public discovery and trust/conversion flows
  - avoid starting with heavy OTA-style inventory or full hotel-commerce complexity

## Confirmed Platform Architecture Rule

This feature must follow the same multi-database pattern already used elsewhere in the platform.

### Ownership Pattern

- `MongoDB`
  - active application write store for the live product layer
  - source used by current operational workflows
- `PostgreSQL`
  - normalized business-truth record layer
  - reporting, primary-read migration target, analytics, and future ranking/search support

### For Hotels V1

- `Hotel` entity:
  - MongoDB write model first
  - mirrored into PostgreSQL hotel business-truth records
- `AccommodationReservation`:
  - stays a separate operational record
  - references `hotelId`
- `PartnerAccount`:
  - remains the business relationship layer
  - can later map one partner to multiple hotels

### For Restaurants Later

Restaurants should follow the same pattern:

- MongoDB write model first
- PostgreSQL normalized business-truth records second
- public entity separated from reservation/order/lead intent records

## Confirmed Revenue Strategy

We want the Hotels and Restaurants system aligned with the platform's long-term `B2B2C` model from the beginning.

### Recommended V1 Revenue Model

Use **both together**:

1. `Lead generation`
2. `Sponsored placement`

### Why V1 Uses These First

- fits the current inquiry, quote, attribution, and revenue-core system
- does not require real-time inventory or complex booking engines
- works for both Hotels and Restaurants
- allows monetization before full transaction commerce is ready
- fits the marketplace and partner model already taking shape in the platform

## Long-Term Revenue Expansion Path

### Phase 1

- lead monetization
- sponsored placement

### Phase 2

- premium listing tools
- subscription upsells
- analytics and response tooling
- trust and verification upgrades

### Phase 3

- referral and commission revenue
- itinerary add-on monetization
- operator-hotel partnership revenue
- operator-restaurant partnership revenue

### Phase 4

- deeper ecosystem monetization
- supplier network access
- enterprise partnership layers
- network-level marketplace distribution

## B2B2C Alignment

This feature family should serve all three layers of the platform:

### B2B

- operators
- hotels
- restaurants
- suppliers
- agencies
- destination partners

### B2C

- travelers discovering listings
- comparing options
- building itinerary intent
- sending inquiries
- later completing reservations or bookings

### Platform

- trust layer
- lead routing
- attribution
- sponsored placement
- premium listing monetization
- future referral and commission revenue

## Important Product Boundary

`Hotel` and later `Restaurant` must be treated as canonical public marketplace entities.

They must **not** be modeled as:

- only accommodation reservations
- only supplier contacts
- only booking rows
- only inquiry targets

Instead:

- entity = public/trust/discovery object
- reservation/inquiry/quote = downstream operational or revenue records

## Current Open Product Question

The next design decision still open for `Hotels V1` is:

- should the first traveler conversion focus center on:
  - `Send Inquiry`
  - `Request Hotel In Itinerary`
  - or `Both together`

That should be resolved before the full feature spec is written.
