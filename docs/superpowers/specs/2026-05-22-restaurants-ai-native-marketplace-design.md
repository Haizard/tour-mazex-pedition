# Restaurants AI-Native Marketplace Design

Date: 2026-05-22

## Goal

Introduce a canonical `Restaurant` marketplace feature that follows the same `entity-first`, `AI-native`, and `multi-database` architecture already established for Hotels, while staying appropriately lighter than a full reservation platform in V1.

The first release should make Restaurants:
- publicly discoverable
- itinerary-aware
- AI-assisted
- lead and sponsorship monetizable
- structurally ready for future reservations and partner expansion

This feature is for a B2B2C tourism platform, so it must serve:
- travelers seeking dining options and itinerary add-ons
- operators building and monetizing itineraries
- restaurant partners participating in a managed hospitality marketplace

## Product Scope

### In Scope For V1

- Public restaurant discovery page
- Public restaurant detail page
- Canonical `Restaurant` entity and admin management
- Cuisine, meal type, dietary fit, ambiance, hours, and location-flow fields
- Two traveler conversion paths:
  - `Send Inquiry`
  - `Add To Itinerary`
- AI restaurant concierge for traveler fit and comparison guidance
- Operator-side AI lead classification and response drafting hooks
- Sponsored placement and attribution hooks
- Restaurant trust and proof structure
- Mongo live write model + Postgres normalized business-truth sync
- pgvector-backed retrieval for restaurant recommendation grounding

### Out Of Scope For V1

- Live table inventory
- Table-slot reservation engine
- Food ordering / delivery
- Deep menu ingestion from providers
- Restaurant self-claim workflow
- Payment checkout for dining reservations

The first restaurant product is a public, AI-guided, lead-driven marketplace entity, not a full OpenTable clone.

## Primary Traveler Conversion Model

Each restaurant page supports both:

1. `Send Inquiry`
- ask directly about the restaurant
- dietary accommodation
- private events
- group suitability
- hours and location fit

2. `Add To Itinerary`
- include the restaurant in a broader travel plan
- arrival meal, farewell dinner, lunch stop, beach dining, city-night dining

This mirrors the successful Hotels conversion choice and aligns better with operator-led trip planning than strict reservation-first commerce.

## Recommended Approach

### Chosen Approach

`Entity-first AI-native dining marketplace`

### Why

- Reuses the Hotel architecture cleanly
- Preserves canonical data quality
- Supports early monetization through leads and sponsored placement
- Keeps the platform B2B2C-native rather than forcing consumer-only reservation logic too early
- Leaves a safe path to future reservation inventory without rewriting the model

### Rejected Alternatives

#### 1. Simple dining directory
Faster, but too shallow and easy to copy. It would not create the AI or operator moat the platform is aiming for.

#### 2. Reservation-first restaurant product
Too heavy for the current platform stage. Restaurant operational groundwork is much thinner than Hotels, so starting with live reservations would add cost and risk without enough architectural leverage.

## Database Ownership

Restaurants follow the same platform storage model used elsewhere:

### MongoDB
Primary live write model for:
- restaurant entity CRUD
- active AI session context
- operator workflow attachments

### PostgreSQL
Normalized business-truth layer for:
- `restaurant_records`
- attribution and inquiry reporting
- future ranking inputs
- future operational and revenue analytics

### pgvector
Semantic retrieval layer for:
- cuisine matching
- dietary preference alignment
- ambiance and timing fit
- AI grounding and comparison

### Redis
Short-lived orchestration state for:
- AI follow-up timing
- workflow state
- retry or background coordination

This keeps the multi-database design consistent with Hotels and the rest of the platform.

## Restaurant Entity Architecture

The `Restaurant` entity represents the place itself, not a booking instance.

### Core Restaurant Fields

- tenant ownership
- partner account relationship
- name
- slug
- summary
- description
- destination
- region
- geo coordinates
- cuisine types
- meal types
- dietary fit tags
- ambiance tags
- opening hours summary
- reservation style summary
- photo/media references
- average rating
- review count
- trust summary
- publish status
- marketplace visibility
- sponsored placement flag
- source metadata

### Main Relationships

#### Restaurant
Canonical public dining entity.

#### PartnerAccount -> Restaurant
Represents the supplier/business relationship.
One partner may later manage multiple restaurants.

#### CustomInquiry / Quote / Booking
Carries direct dining intent or itinerary dining intent into the existing lead and revenue systems.

#### TourPackage -> Restaurant
Optional and light in V1.
Used later for recommended dining pairings and destination-based itinerary compatibility.

#### Review / Trust Layer -> Restaurant
Traveler proof attaches to the restaurant entity, not to generic leads.

## AI-Native Restaurant Layer

Restaurants must feel AI-native, not like a static listing with a chatbot.

### 1. Traveler AI Concierge

Helps travelers answer:
- which restaurant fits my trip mood
- what fits a family, romantic dinner, local-food experience, or quick stop
- what matches dietary needs
- what works for lunch vs dinner vs arrival-day timing
- what fits near the current itinerary flow

This should feel like a dining concierge, not a generic support bot.

### 2. Operator AI Autopilot

Helps operators:
- classify direct restaurant inquiry vs itinerary-dining intent
- draft replies
- suggest dining pairings for itineraries
- recommend the best restaurant based on traveler profile
- suggest follow-up timing
- score conversion potential

### 3. Platform Learning Layer

Learns:
- which cuisines convert for which traveler segments
- which restaurant + tour pairings perform best
- which trust signals improve clicks and inquiries
- which restaurant partners respond well
- which dining recommendations improve quote acceptance later

### 4. Memory Layer

Remembers:
- dietary preferences
- vibe preferences
- budget tone
- destination and timing context
- hotel and tour context that influences dining fit

### V1 AI Boundary

Include in V1:
- AI concierge
- operator reply drafting hooks
- intent classification hooks
- itinerary dining suggestions
- memory-backed preference carryover
- AI explanation copy

Do not include yet:
- autonomous reservation handling
- table optimization
- deep menu parsing
- dynamic dining pricing

## Revenue And Conversion

Restaurants V1 should align with the Hotels revenue strategy.

### V1 Revenue

- `Lead generation`
  - direct dining inquiries
  - itinerary dining requests

- `Sponsored placement`
  - featured destination restaurants
  - promoted cuisine and dining experiences

### Later Revenue

- premium partner subscriptions
- referral commission on dining reservations or add-ons
- operator-restaurant partnership monetization
- itinerary upsell packages

### Why This Revenue Model

It lets Restaurants create marketplace value without requiring live reservations, table inventory, or food ordering in the first release.

## Public UX

### Restaurant Discovery

Discovery should be a fast fit-and-trust surface.

Each card should expose:
- restaurant name
- destination
- cuisine and ambiance cues
- dietary-fit cues
- trust summary
- sponsored visibility when applicable
- quick scan “why this fits” AI copy later

### Restaurant Detail

Detail should deepen confidence and intent.

Sections should include:
- hero image and restaurant identity
- cuisine and vibe summary
- location and hours context
- dietary fit and use-case framing
- trust and review proof
- AI concierge block
- conversion block
  - direct inquiry
  - add to itinerary

## Admin And Operator UX

### Tenant Admin

Must be able to:
- create and edit restaurants
- manage publish state
- manage marketplace visibility
- manage sponsored placement
- review performance later

### Operator Use

Operators should receive restaurant leads inside the same broad lead/revenue pipeline used by Hotels and Tours, with restaurant-specific intent metadata.

## Implementation Shape

### Backend

Add:
- `backend/models/Restaurant.js`
- `backend/utils/postgresRestaurantRecords.js`
- `backend/utils/postgresFirstRestaurantService.js`
- `backend/utils/restaurantMarketplace.js`
- `backend/utils/restaurantAiConcierge.js`
- restaurant routes for:
  - public discovery/detail
  - public AI concierge
  - public inquiry / itinerary-intent helpers
  - tenant admin CRUD
  - later analytics and sponsorship reads

### Frontend

Add:
- `src/pages/RestaurantDiscovery.jsx`
- `src/pages/RestaurantDetail.jsx`
- restaurant AI concierge component
- restaurant trust helper component(s)
- direct inquiry form
- itinerary handoff integration
- admin management surface in the existing admin patterns

### Reuse From Hotels

- entity-first marketplace structure
- public discovery/detail flow
- inquiry attribution patterns
- partner relationship patterns
- AI concierge response shape
- pgvector grounding pattern
- trust and review structure

## Rollout Order

### Phase 1: Entity Foundation
- create canonical `Restaurant` model
- Postgres sync layer
- admin CRUD

### Phase 2: Public Marketplace
- public discovery
- public detail
- trust scaffolding

### Phase 3: AI And Conversion
- AI concierge
- direct inquiry
- add-to-itinerary intent
- attribution and revenue hooks

## Success Criteria

Restaurants V1 is successful when:
- the platform has a real canonical restaurant marketplace entity
- travelers can discover and evaluate restaurants publicly
- restaurant pages support both direct dining inquiry and itinerary inclusion
- AI meaningfully improves traveler and operator experience
- the feature monetizes through leads and sponsored placement
- the architecture cleanly reuses the Hotels pattern without reservation-engine bloat
