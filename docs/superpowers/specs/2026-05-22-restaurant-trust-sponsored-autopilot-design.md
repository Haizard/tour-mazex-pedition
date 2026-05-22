# Restaurant Trust, Sponsored Analytics, And Operator Autopilot Design

## Goal

Deepen the new `Restaurants` marketplace feature so it feels like a serious AI-native hospitality layer instead of only a listing foundation. This phase should make restaurant discovery and detail pages more trustworthy for travelers, make sponsored placement measurable for operators and the platform, and add operator autopilot assistance for restaurant-origin leads.

## Product Intent

The restaurant feature already has:
- a canonical `Restaurant` entity
- public discovery and detail routes
- direct inquiry and itinerary-add-on conversion
- an AI concierge baseline
- tenant-admin restaurant CRUD

This phase should turn that foundation into a more persuasive and monetizable marketplace surface by improving three connected layers:
- public trust and proof
- sponsored analytics and visibility reporting
- operator autopilot guidance for restaurant leads

The goal is not to build a reservation engine. The goal is to make restaurant discovery more convincing, restaurant sponsorship more measurable, and restaurant lead handling more automatic.

## Scope

### In Scope

- richer public trust modules on `RestaurantDiscovery` and `RestaurantDetail`
- operator credibility and dining reassurance presentation
- restaurant-specific analytics for sponsored and organic listing performance
- direct vs itinerary inquiry split in restaurant analytics
- restaurant demand scoring and recent activity summaries
- operator autopilot metadata for restaurant leads
- restaurant-specific reply draft suggestions and next-best-action hints
- restaurant-specific inbox context and admin visibility

### Out Of Scope

- full traveler review submission or moderation overhaul
- reservation booking engine
- live table availability
- payments for restaurant bookings
- restaurant self-claim workflow
- deep partner billing flows
- autonomous reservation confirmation by AI

## Public Trust Layer

Restaurant trust must answer three traveler questions quickly:
- Is this place real and credible?
- Does it fit my dining need?
- Can I trust the operator flow around it?

### Discovery Trust

Restaurant discovery cards should remain compact but become more confidence-rich.

Each card should emphasize:
- average rating and review count when available
- cuisine and dietary fit chips
- dining context chips such as family, romantic, local cuisine, beach dining, or quick stop
- an operator credibility chip or short credibility label
- transparent sponsored labeling when a listing is promoted

The design intent is that discovery answers:
- why should I open this restaurant?

### Detail Trust

Restaurant detail pages should present a stronger trust staircase.

#### 1. Restaurant Proof

This module should show:
- rating
- review count
- trust summary
- cuisine / meal / dietary confidence
- AI fit explanation grounded in stored fields only

#### 2. Operator Credibility

This module should explain:
- which operator handles the lead
- that dining requests are routed through a real operator workflow
- that itinerary inclusion is supported
- any existing verification or partner signal already available in platform data

#### 3. Dining Reassurance

Near the CTA, the page should clarify:
- whether the place best fits lunch, dinner, group dining, special occasion, or route stopover
- what the operator will confirm manually
- what the AI is only suggesting based on known data
- that reservations, menu details, and pricing still need confirmation when not explicitly stored

## Sponsored Analytics Layer

Sponsored restaurant placement must become measurable rather than decorative.

### Metrics To Show

At minimum, the platform should track and expose:
- public listing impressions
- detail opens
- direct restaurant inquiries
- itinerary-add-on inquiries
- total restaurant leads
- direct vs itinerary split
- last activity timestamp
- simple demand score

### Restaurant Manager Analytics

Inside the tenant admin restaurant workspace, add:

#### Summary Strip
- total public restaurants
- total sponsored restaurants
- total restaurant leads
- direct inquiry count
- itinerary inquiry count

#### Per-Restaurant Performance View
For each restaurant, show:
- sponsored flag
- inquiry count
- direct inquiry count
- itinerary inquiry count
- accepted quote count later where connected
- last activity
- demand score

#### Sponsored Spotlight
Provide a simple spotlight view for:
- top-performing sponsored restaurants
- underperforming sponsored restaurants

This does not need to be a separate page in this phase. It can live inside the existing `RestaurantManager` workspace.

### Data Model Approach

This phase should reuse existing inquiry and attribution data rather than inventing a separate restaurant event warehouse. Analytics should derive from:
- `CustomInquiry`
- existing quote linkage where available
- restaurant entity metadata
- any existing marketplace demand patterns already used elsewhere in the platform

## Operator Autopilot Layer

The restaurant feature should now start behaving like an AI-assisted revenue surface.

### Core Autopilot Behaviors

When a restaurant lead arrives, AI should help classify and guide follow-up.

It should determine whether a lead is:
- a direct dining inquiry
- an itinerary dining request
- a group or event dining request
- a dietary-sensitive dining request
- a lower-confidence inquiry that needs human clarification

### Autopilot Outputs

#### 1. Lead Classification
The system should assign restaurant-specific lead context such as:
- direct dining
- itinerary dining
- group dinner
- dietary clarification needed
- operator review advised

#### 2. Reply Draft Suggestion
The system should generate response guidance suitable for:
- direct restaurant follow-up
- itinerary-oriented restaurant inclusion
- group or event clarifications
- dietary clarifications

This can initially be metadata and short copy suggestions rather than a fully authored outbound message.

#### 3. Next Best Action
The autopilot should suggest actions such as:
- confirm timing
- confirm dietary needs
- propose itinerary inclusion
- escalate to quote workflow
- request human review

#### 4. Conversion Hinting
The system should expose restaurant lead urgency and fit hints such as:
- hot / warm / cold
- likely fit
- recommended follow-up timing

## AI Trust Rules

The AI layer should help with:
- classifying
- drafting
- prioritizing
- explaining fit

The AI layer must not fabricate:
- reservation confirmation
- table availability
- menu guarantees
- pricing promises
- restaurant commitments not present in data

This trust boundary is essential to preserve credibility.

## Implementation Shape

### Backend Additions

Add or extend utilities for:
- restaurant analytics rollups
- restaurant trust summary shaping
- restaurant operator-autopilot metadata

Expected areas:
- `backend/utils/restaurantAnalytics.js`
- `backend/utils/restaurantMarketplace.js`
- `backend/utils/restaurantLeadAutopilot.js` or equivalent restaurant-specific helper
- restaurant route extensions where needed
- optional use of `chatSalesAssistant` or lead automation helpers where restaurant logic naturally belongs

### Frontend Additions

Extend:
- `src/pages/RestaurantDiscovery.jsx`
- `src/pages/RestaurantDetail.jsx`
- `src/components/Admin/RestaurantManager.jsx`
- restaurant trust helpers
- restaurant inquiry/inbox related components where restaurant lead context should be visible

### Integration Points

The phase should integrate with:
- restaurant discovery/detail
- restaurant admin manager
- inquiry creation and follow-up systems
- existing commercial analytics patterns
- existing AI lead automation patterns

## Rollout Order

### Phase 1: Trust And Proof
- richer trust labels on discovery cards
- stronger trust modules on detail pages
- operator credibility block
- dining reassurance block
- clear sponsored transparency

### Phase 2: Sponsored Analytics
- restaurant analytics utility
- summary strip in `RestaurantManager`
- per-restaurant performance metrics
- direct vs itinerary split
- simple demand scoring

### Phase 3: Operator Autopilot
- restaurant lead classification
- reply draft suggestions
- next-best-action hints
- urgency and conversion metadata
- visibility in restaurant and lead/admin surfaces

## Success Criteria

This phase is successful when:
- restaurant pages feel more trustworthy and persuasive to travelers
- sponsored placement becomes measurable and easier to justify
- restaurant operators/admins receive useful AI guidance for follow-up
- restaurant lead handling becomes more structured and less manual
- the restaurant feature starts behaving like a monetizable AI-native hospitality product, not only a content listing layer
