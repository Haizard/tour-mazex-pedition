# Marketplace Discovery Redesign Design

## Summary

This design upgrades the public marketplace discover experience to feel closer to a serious travel discovery product while staying clearly original and not copying TripAdvisor layout or branding. It also closes a tenant operations gap by exposing marketplace visibility controls both inside the tour form and through a bulk management view.

## Goals

- Make `/discover` feel more credible, useful, and trust-oriented for travelers.
- Let tenants explicitly control which tours appear on the public marketplace.
- Let tenants bulk-manage marketplace visibility across many tours.
- Preserve the platform's own visual identity rather than copying TripAdvisor.
- Keep the existing backend visibility model and improve its consistency.

## Non-Goals

- Rebuild the whole marketplace into a multi-step booking engine.
- Copy TripAdvisor's layout, copy, branding, or interaction patterns one-to-one.
- Change tenant-facing package detail pages outside the marketplace-specific surfaces unless needed for consistency.

## Current State

- Public marketplace list page lives in `src/pages/GlobalDiscovery.jsx`.
- Public marketplace detail page lives in `src/pages/DiscoveryTourDetail.jsx`.
- Marketplace API lives in `backend/routes/discoveryRoutes.js`.
- Tour model already supports:
  - `isMarketplaceVisible`
  - `isPubliclyDistributable`
- The tenant admin UI does not currently expose these flags in an obvious way.
- `/discover` currently queries only `isMarketplaceVisible: true`.

## Problems

### Discover UX

- The current discover page is a simple hero plus grid.
- Cards do not provide enough trust, comparison, or editorial scanning value.
- Filters are too shallow for a marketplace experience.
- Operator credibility and review context are underused.

### Tenant Control UX

- Tenants do not have a clear place to enable marketplace visibility.
- Visibility and distribution settings are not discoverable in the current admin experience.
- Operators with many tours have no efficient bulk-management workflow.

## Proposed Solution

## 1. Dual Visibility Control Model

Expose visibility controls in two places:

- Tour create/edit form:
  - `Show on Marketplace`
  - `Allow Distribution Partners`
- Tenant bulk management view:
  - searchable table of tours
  - quick toggle actions for both flags

### Control Definitions

- `Show on Marketplace`
  - Controls whether the tour appears on `/discover`.
  - Maps to `isMarketplaceVisible`.
- `Allow Distribution Partners`
  - Controls whether the tour is available for distribution/partner use cases.
  - Maps to `isPubliclyDistributable`.

### UX Guidance

- Add helper text directly under the toggles.
- Use explicit wording so tenants know marketplace visibility and partner distribution are different controls.
- Keep the same fields editable from both the tour form and the bulk manager.

## 2. Marketplace Discover Page Redesign

Redesign `/discover` into a stronger travel marketplace experience inspired by the usefulness of major travel discovery sites, but visually original to MAZ.

### Experience Direction

- Dense but readable browsing experience.
- Strong trust and credibility signals.
- Better comparison scanning.
- Distinct editorial grouping beyond a single undifferentiated grid.

### Page Structure

#### Search and Filter Header

- Destination or keyword search
- Location filter
- Category/trip type filter
- Duration filter
- Price range filter
- Operator filter
- Sort control

#### Results Summary Strip

Show marketplace context such as:

- number of experiences found
- verified operators count
- featured destinations or categories
- optional review-backed highlights when data exists

#### Editorial Content Blocks

Break the page into sections such as:

- Featured experiences
- Top-rated safaris
- Kilimanjaro routes
- Zanzibar escapes
- Budget-friendly picks

These blocks may be computed from existing tour metadata rather than requiring a new CMS in phase one.

#### Improved Tour Cards

Each card should surface:

- hero image
- title
- operator name
- location
- duration
- category or type
- starting price
- rating and review snapshot when available
- short description or standout line
- marketplace trust badge or verified cue when available

### Visual Language

- Do not copy TripAdvisor layout or branding.
- Keep MAZ branding, color system, and typography direction.
- Increase polish, clarity, and content density without turning the page into a clone.

## 3. Marketplace Detail Page Improvements

Improve `DiscoveryTourDetail` with stronger marketplace trust framing.

### Add or emphasize

- operator card
- review snapshot
- marketplace badges or verification indicators
- stronger inquiry CTA
- related experiences from the same operator or similar destinations

### Keep

- clear handoff into inquiry or booking flow
- embedded planning/inquiry functionality

## 4. Backend and Data Behavior

### Discovery Query Rules

Keep marketplace list visibility based on `isMarketplaceVisible`, but align behavior with distribution intent where useful.

Phase one rule:

- `/discover` requires `isMarketplaceVisible: true`
- distribution-specific workflows can additionally use `isPubliclyDistributable`

### Discovery API Enhancements

Extend `backend/routes/discoveryRoutes.js` to support:

- keyword search
- location
- category
- duration
- featured
- operator
- min/max price
- sort
- pagination

### Discover Payload Enrichment

Return enough data for richer cards without extra calls:

- operator name
- operator slug
- featured
- category
- duration
- tripAdvisor rating
- tripAdvisor review count
- marketplace badge-ready fields when available

## 5. Tenant Admin Surfaces

### Tour Form

In the tenant admin tour editor:

- add `Show on Marketplace`
- add `Allow Distribution Partners`
- persist both fields in normal create/update flows

### Bulk Marketplace Manager

Add a dedicated tenant admin management surface, likely under the existing distribution area, showing:

- title
- location
- price
- category
- marketplace visible status
- distributable status
- quick toggle actions
- search/filter support for large inventories

## 6. Error Handling and Empty States

### Public Marketplace

- clear empty state when no tours match filters
- loading skeletons for list and detail
- fallback handling when review fields are absent

### Tenant Admin

- clear success feedback when toggles update
- optimistic or near-optimistic updates for bulk actions
- validation that explains each flag's meaning

## 7. Testing

### Functional

- tenant can enable marketplace visibility from the tour form
- tenant can enable marketplace visibility from bulk manager
- tenant can enable distribution visibility from both surfaces
- hidden tours do not appear on `/discover`
- visible tours do appear on `/discover`
- filters, sorting, and pagination work correctly

### UX

- page remains usable on mobile and desktop
- cards scan well at multiple breakpoints
- empty/loading states are polished and informative

### Regression

- existing inquiry and detail flows still work
- operator-specific data remains intact
- marketplace detail page still resolves only visible tours

## 8. Implementation Notes

- Prefer reusing existing tour fields before inventing new schema.
- Keep marketplace-related logic focused in discovery routes and admin controls.
- Avoid scope creep into full review systems or complex ranking algorithms in phase one.
- If trust badges require richer semantics later, add them as a follow-up phase after the redesign ships.

## Recommended Rollout

### Phase 1

- Add tour form toggles
- Add bulk manager
- Extend discovery API filters and payload
- Redesign discover list page

### Phase 2

- Improve detail page trust modules
- Add featured grouping logic
- Add operator filter and richer ranking/sorting refinements

## Risks

- Marketplace discover page can become visually busy if too many filters or badges appear at once.
- Tenants may confuse marketplace visibility with partner distribution if copy is unclear.
- Review signals may look inconsistent if many tours lack TripAdvisor data.

## Mitigations

- Use progressive density: keep top-level scan simple and let filters deepen only when needed.
- Add short helper copy under both tenant toggles.
- Gracefully degrade review content so tours without ratings still look complete.

## Success Criteria

- Tenant can clearly find and use marketplace visibility controls.
- Marketplace tours feel more trustworthy and easier to compare.
- `/discover` looks like a serious travel marketplace without copying another brand.
- The redesign increases discoverability while keeping the inquiry flow intact.
