# Marketplace Engagement Design

Date: 2026-05-08

## Goal

Extend the platform marketplace from a package discovery surface into a trusted traveler engagement layer with:

- traveler-written reviews collected inside the platform
- richer review breakdowns and sentiment summaries
- saved trips and favorites
- stronger comparison tools
- map-first discovery
- traveler photos and community Q&A
- live availability calendars on marketplace packages

The rollout order is fixed:

1. Trust + community
2. Shopping + discovery
3. Booking confidence

## Product Decisions

### Review eligibility

Only travelers with a real booking or inquiry tied to the operator or package may submit reviews or structured feedback. This gives the marketplace a defensible trust model and reduces fake or low-signal submissions.

### Identity model

The marketplace uses a hybrid traveler identity model:

- guest and session-based interactions for fast entry
- email and token-based continuity for persistence
- verified booking or inquiry tokens for trusted submissions
- future upgrade path to full traveler accounts without losing prior activity

This supports early marketplace engagement without blocking everything behind a full traveler auth build.

### Map-first discovery scope

The first map experience focuses on destinations and route regions, not individual package pins. This keeps the map readable, matches how travelers think early in discovery, and avoids clutter when many packages overlap in the same destination.

## Architecture

The marketplace needs a shared engagement foundation instead of isolated one-off widgets. The recommended approach is a marketplace foundation first strategy.

This introduces a marketplace engagement layer composed of:

- traveler identity
- review and photo moderation
- package Q&A
- saved and comparison state
- availability state
- cached discovery summaries

Public marketplace pages remain read-optimized. Discovery and detail pages read aggregated summaries, while writes go through dedicated marketplace APIs.

## Rollout Plan

### Phase 1: Trust + community

This phase strengthens package detail pages with verified social proof and operator-traveler interaction.

Features:

- traveler-written reviews from verified booking or inquiry tokens
- public review cards with rating, headline, body, traveler context, and package linkage
- review summary blocks with:
  - average rating
  - rating distribution
  - sentiment themes
  - verified booking indicators
- traveler photo submissions attached to reviews or package media
- public package Q&A
- operator or admin answers
- moderation controls for tenants and platform admins

Behavior:

- verified booking reviews are the primary trusted review type
- inquiry-linked feedback is stored separately and should not affect the headline score by default
- photo submissions support moderation before public display
- Q&A can be moderated per tenant setting

### Phase 2: Shopping + discovery

This phase helps travelers shortlist, compare, and navigate packages more effectively.

Features:

- saved trips and favorites
- compare sets and comparison views
- region-first map discovery
- synchronized map and list filtering
- identity-aware saved state persistence

Comparison fields:

- price
- duration
- location
- travel style
- review summary
- inclusions snapshot
- operator
- route shape and destinations visited
- inquiry CTA

Map behavior:

- show route regions and destination clusters first
- selecting a region filters the list below
- active regions remain highlighted across interactions
- package pins are deferred to a later zoomed-in enhancement

### Phase 3: Booking confidence

This phase reduces pre-inquiry uncertainty and improves operator-side readiness.

Features:

- live availability calendar on marketplace package pages
- date states for available, limited, unavailable, and on-request
- inquiry form prefilled from selected dates
- operator-side availability management
- optional future availability summaries on discovery cards

Behavior:

- availability starts as operator-managed inventory state, not instant booking
- where certainty is incomplete, the UI should display on-request rather than overpromise
- selected dates should improve inquiry quality and routing

## Data Model

### New core models

#### TravelerIdentity

Tracks lightweight marketplace identity before full accounts exist.

Fields:

- session key
- email
- verification state
- linked inquiry ids
- linked booking ids
- future account id

#### MarketplaceReview

Stores public and moderated traveler reviews.

Fields:

- tenant id
- tour id
- traveler identity id
- booking id or inquiry id
- verification type
- rating
- headline
- review body
- sentiment summary fields
- moderation status
- visibility state
- travel month
- traveler type

#### TravelerPhotoSubmission

Stores traveler-contributed media for moderation and public display.

Fields:

- tenant id
- tour id
- traveler identity id
- review id optional
- media id
- caption
- moderation status

#### MarketplaceQuestion

Stores traveler questions at the package level.

Fields:

- tenant id
- tour id
- traveler identity id
- question body
- status
- answer count

#### MarketplaceAnswer

Stores operator or admin responses to traveler questions.

Fields:

- question id
- tenant id
- author type
- author reference
- answer body
- pinned flag
- accepted flag

#### SavedTripList

Stores a traveler identity’s saved package set.

Fields:

- traveler identity id
- saved tour ids
- notes optional

#### TripComparisonSet

Stores the current comparison selection for a traveler or session.

Fields:

- traveler identity id or session key
- selected tour ids

#### TourAvailabilityCalendar

Stores package-level date availability state.

Fields:

- tenant id
- tour id
- date
- state
- capacity note
- last updated source

### Aggregated read fields

Marketplace pages should not compute everything live on every request. Discovery and detail responses should expose aggregated read fields such as:

- average rating
- review count
- rating distribution
- top sentiment tags
- public photo count
- question count
- next available dates snapshot

These can be cached or precomputed separately from raw write records.

## API Design

Keep public marketplace writes and reads separate from tenant admin CRUD.

### Discovery extensions

- `GET /api/discovery/tours`
  - add rating summary, photo count, question count, availability snapshot
- `GET /api/discovery/tours/:id`
  - add review summary, public reviews, public photos, Q&A preview, availability preview

### Marketplace write and read APIs

- `POST /api/marketplace/reviews`
- `GET /api/marketplace/tours/:id/reviews`
- `POST /api/marketplace/photos`
- `GET /api/marketplace/tours/:id/photos`
- `POST /api/marketplace/questions`
- `POST /api/marketplace/questions/:id/answers`
- `GET /api/marketplace/tours/:id/questions`
- `POST /api/marketplace/saved-trips`
- `GET /api/marketplace/saved-trips`
- `POST /api/marketplace/comparisons`
- `GET /api/marketplace/comparisons`
- `GET /api/marketplace/map/regions`
- `GET /api/marketplace/tours/:id/availability`
- `POST /api/admin/tours/:id/availability`

## Moderation and trust rules

These features need strong defaults.

Recommended defaults:

- verified booking reviews can be submitted immediately but may still require moderation before public display
- inquiry-linked feedback is stored and labeled separately
- inquiry-linked feedback is excluded from the headline rating score by default
- traveler photos require moderation before public display
- traveler questions can be auto-published or moderated based on tenant settings
- only operator or admin roles may answer public package questions
- platform admin can override visibility when fraud or abuse is suspected

### Tenant settings

Add per-tenant controls for:

- `autoPublishVerifiedReviews`
- `autoPublishTravelerQuestions`
- `requirePhotoModeration`
- `includeInquiryFeedbackInRatings`
- `allowCommunityQnA`

## Error handling

Marketplace pages should degrade gracefully instead of failing hard when one subsystem has missing data.

Rules:

- if reviews fail, package detail still renders with a fallback state
- if saved trips fail, local session save still works
- if compare data is partial, show a partial comparison rather than blocking the view
- if map data fails, fall back to list-first discovery
- if availability is missing, show on-request instead of fake certainty
- if identity verification fails, browsing remains available while protected writes are blocked

## Testing strategy

### Model tests

- review verification rules
- moderation transitions
- sentiment aggregation
- availability status normalization

### API tests

- verified review creation
- public review filtering
- traveler photo submission and moderation
- Q&A creation and operator answers
- saved trip persistence
- comparison set updates
- region map data reads
- availability reads and writes

### UI tests

- review, photo, and Q&A sections on package detail
- save and compare flows
- map-to-results filtering
- availability date selection flowing into inquiry

### Regression tests

- existing booking flow stays intact
- existing inquiry flow stays intact
- discovery listing performance remains acceptable
- tenant attribution from marketplace package pages remains correct

## Rollout safety

Ship by feature flag so each block can be released independently.

Recommended flags:

- `marketplace_reviews`
- `marketplace_saved_trips`
- `marketplace_compare`
- `marketplace_map_discovery`
- `marketplace_availability`

## Recommended implementation order

The approved order is:

1. Trust + community
2. Shopping + discovery
3. Booking confidence

Within that order, implementation should begin with the shared marketplace engagement foundation before UI-heavy enhancements. The foundation must include traveler identity, moderation support, and discovery summary read models so later phases do not require data-model rewrites.
