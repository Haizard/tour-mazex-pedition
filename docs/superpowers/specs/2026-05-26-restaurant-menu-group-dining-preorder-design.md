# Restaurant Menu And Group Dining Pre-order Design

Date: 2026-05-26

## Goal

Add a restaurant-owned menu and group dining pre-order layer that strengthens restaurant trust, improves traveler conversion, and creates new B2B2C revenue paths through deposits, private dining, group meals, and itinerary dining add-ons.

This feature should make restaurant pages feel more complete without turning the platform into a delivery app. The focus is travel dining, group hospitality, operator-led itinerary meals, and AI-assisted menu confidence.

## Product Direction

The approved direction is `Restaurant Menu + Group Dining / Pre-order V1`.

V1 should connect four existing restaurant strengths:

- canonical restaurant entity
- reservation requests and table availability
- dining checkout/payment requests
- AI concierge and hospitality intelligence

The menu layer becomes structured restaurant data that can power public trust, AI recommendations, group meal planning, and higher-value payment requests.

## In Scope

### Restaurant Menu Management

Restaurant admins or partner admins can manage structured menu data:

- menu sections
- menu items
- item descriptions
- item prices and currency
- dietary tags
- allergen tags
- photo references
- availability status
- group-dining suitability
- featured item flag

The menu belongs to a canonical `Restaurant`, not a generic tenant navigation menu.

### Public Menu Preview

Restaurant detail pages should show a curated menu preview:

- featured dishes
- group-friendly dishes
- dietary-friendly dishes
- price visibility when known
- clear note that final availability and pricing are confirmed by the restaurant/operator

This should increase traveler confidence before they submit an inquiry or reservation request.

### Reservation And Group Dining Intent

Reservation requests can carry menu interest:

- selected item ids
- group meal notes
- dietary needs
- event/private dining notes
- pre-order interest flag

V1 should not require travelers to complete a full cart. It should capture dining intent that operators can confirm.

### Pre-order Payment Requests

Operators or restaurant partners can turn a reservation request into a pre-order/payment request:

- deposit for group dining
- private dining prepayment
- fixed meal package
- custom event dining amount

This should reuse the existing restaurant checkout/payment request architecture where possible.

### AI Menu Intelligence

AI features must use structured menu data to help travelers and operators.

Traveler AI can:

- summarize the restaurant menu
- suggest dishes for dietary needs
- explain group dining fit
- recommend menu items for arrival, lunch, dinner, farewell, romance, family, or private dining context

Operator AI can:

- summarize menu interests from reservation requests
- suggest group meal packages
- flag dietary or allergen-sensitive requests
- draft confirmation guidance
- recommend whether a deposit/payment request is appropriate

## Out Of Scope

V1 should not build:

- food delivery
- delivery driver workflows
- live POS sync
- live kitchen order tickets
- instant menu item stock confirmation
- Uber Eats-style cart checkout
- automatic restaurant confirmation by AI
- external menu ingestion from third-party providers

These can come later if the platform needs them, but they are not the best next step for a tourism B2B2C marketplace.

## Database Ownership

This feature follows the platform's multi-database pattern.

### MongoDB

MongoDB remains the live write model for:

- restaurant menu sections
- restaurant menu items
- active reservation menu interest
- partner/admin menu management
- payment request context

### PostgreSQL

PostgreSQL remains the reporting and business-truth direction for:

- future menu item performance
- pre-order revenue
- group dining conversion
- dietary demand reporting
- sponsored/menu feature performance

V1 should shape metadata so later sync/reporting can consume it, but should not block live feature delivery on a new Postgres table.

### pgvector

pgvector remains a future semantic retrieval layer for:

- menu matching
- dietary fit
- cuisine and dish similarity
- AI recommendation grounding

V1 can use deterministic structured tags first.

## Data Model

V1 should introduce restaurant-specific menu models rather than reusing the existing site navigation `MenuItem`.

### `RestaurantMenuSection`

Represents a menu grouping:

- `tenantId`
- `restaurantId`
- `title`
- `description`
- `displayOrder`
- `status`

Example sections:

- Starters
- Mains
- Group Platters
- Vegetarian
- Private Dining Packages

### `RestaurantMenuItem`

Represents a real dining item or package:

- `tenantId`
- `restaurantId`
- `sectionId`
- `name`
- `description`
- `price`
- `currency`
- `dietaryTags`
- `allergenTags`
- `photo`
- `available`
- `featured`
- `groupFriendly`
- `preorderEnabled`
- `minGuests`
- `maxGuests`
- `status`

### Reservation Linkage

`RestaurantReservationRequest` should be able to store:

- selected menu item ids
- selected item snapshots
- menu interest notes
- group meal notes
- preorder interest

Snapshots matter because menus can change after the request.

## User Experience

### Public Restaurant Detail

Add a menu preview section below the trust/AI/reservation context.

The section should answer:

- what food can I expect?
- does this work for my dietary needs?
- is this good for a group or special occasion?
- can I request this as part of my itinerary?

Public copy should remain trust-safe:

- `Menu availability and final pricing are confirmed by the restaurant/operator.`

### Reservation Widget

Add lightweight menu interest capture:

- optional selected items
- group meal notes
- pre-order interest checkbox

This should not make simple reservations harder.

### Partner Dashboard

Restaurant partners need a simple menu workspace:

- manage sections
- manage items
- mark featured/group-friendly/pre-order enabled
- see recent reservation requests with menu interest
- create a payment request from pre-order/group dining context

### Admin Restaurant Manager

Tenant admins should have visibility into:

- menu completeness
- featured items
- group-dining enabled items
- restaurants with no menu yet
- menu-driven reservation interest

## Revenue Model

This feature supports revenue through:

- group dining deposits
- private dining payments
- itinerary meal add-ons
- sponsored menu highlights later
- premium restaurant tools
- commission or referral reporting later

Revenue attribution should preserve:

- restaurant id
- reservation request id
- selected menu item ids
- payment id when created
- source surface
- pre-order or group dining reason

## AI Trust Rules

AI may:

- summarize known menu data
- recommend dishes from stored menu fields
- flag dietary/allergen needs
- suggest package language
- suggest deposit/payment request context

AI must not fabricate:

- dish availability
- exact preparation details not stored
- allergen guarantees
- live kitchen capacity
- confirmed price changes
- reservation confirmation

When uncertain, AI should say the restaurant/operator will confirm.

## Implementation Shape

### Backend

Add focused models and helpers:

- `RestaurantMenuSection`
- `RestaurantMenuItem`
- menu normalization utilities
- menu preview shaping
- reservation menu-interest normalization
- AI menu summary helper

Add endpoints to existing restaurant route families:

- public restaurant menu preview
- tenant/admin menu management
- partner menu management
- reservation request menu interest

Reuse existing restaurant checkout payment request behavior for pre-order/group dining payments.

### Frontend

Add focused state helpers and components:

- menu preview state
- menu selection state for reservation widget
- partner menu workspace state
- public menu preview component
- partner/admin management UI

Mount initial public preview on `RestaurantDetail`.

## Error Handling

If a restaurant has no menu:

- public page should show a soft empty state or hide the menu section
- reservation widget should still work
- AI should not invent dish recommendations

If menu data is malformed:

- ignore invalid items
- keep reservation flow available
- do not fail the page

If selected menu items are unavailable by review time:

- preserve the traveler request
- show operator-facing confirmation needed

## Testing Strategy

### Backend Tests

Cover:

- section and item normalization
- public preview shaping
- dietary/allergen tag handling
- reservation menu-interest payloads
- pre-order metadata shaping
- AI trust boundary language

### Frontend Tests

Cover:

- menu card shaping
- item selection state
- reservation payload with selected menu items
- empty menu behavior
- disclaimer rendering state

### Build Verification

Run:

- focused backend tests
- focused frontend state tests
- `npm run build`

## Success Criteria

The feature is successful when:

- restaurants can store structured menu sections and items
- public restaurant pages can show a trust-safe menu preview
- reservation requests can carry group dining and menu interest
- operators can use that interest to create payment/deposit requests
- AI can summarize and suggest from stored menu data without fabricating facts
- tests cover menu shaping, reservation payloads, and trust boundaries

