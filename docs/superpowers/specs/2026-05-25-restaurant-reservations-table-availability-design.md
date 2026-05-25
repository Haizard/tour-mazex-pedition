# Restaurant Reservations And Table Availability Design

## Goal

Build the next restaurant subsystem after partner onboarding: a hybrid reservation operations layer where restaurants manage service windows, table types, dated availability, and reservation requests.

This phase gives travelers a real dining reservation request path and gives approved restaurant partners an operational dashboard before the later payment and event dining checkout phase.

## Product Direction

The reservation model is a balanced hybrid:

- Service windows define when dining can happen, such as breakfast, lunch, dinner, brunch, private dining, or event dining.
- Table types define seating capacity buckets, such as two-seater, four-seater, family table, group table, private dining, or event block.
- Availability entries connect date, service window, optional table type, availability state, available units, available seats, and notes.
- Reservation requests link traveler intent to the restaurant, service context, table preference, date, time, guest count, and source.

This is intentionally a request-and-confirmation system, not instant guaranteed booking. Partners confirm, decline, or request clarification.

## Scope

Implement now:

- Restaurant service windows.
- Restaurant table types.
- Dated restaurant availability entries.
- Public reservation request submission from restaurant detail pages.
- Direct dining and itinerary-linked reservation sources.
- Restaurant partner reservation management.
- Tenant admin reservation visibility.
- AI-assisted reservation classification, reply guidance, and follow-up hints.

Keep out of this phase:

- Payment checkout.
- Deposits.
- Event dining payment flows.
- Exact floor-map seating.
- Automated table optimization.
- Point-of-sale integrations.
- Third-party reservation sync.

## Database Ownership

MongoDB owns the live operational write models:

- `RestaurantServiceWindow`
- `RestaurantTableType`
- `RestaurantAvailabilityEntry`
- `RestaurantReservationRequest`

PostgreSQL should receive normalized business-truth records or rollups later for reporting, attribution, and revenue analysis. The V1 implementation can keep live reservation operations in Mongo while exposing clean utility boundaries for future Postgres sync.

Redis can be used later for temporary holds, follow-up timing, and automation state. This phase should not require Redis to function.

pgvector remains useful for restaurant AI context and dining fit recommendations, but it is not central to reservation availability.

## Data Model

### RestaurantServiceWindow

Purpose: define a repeatable dining service context for a restaurant.

Fields:

- `tenantId`
- `restaurantId`
- `label`
- `serviceType`
- `defaultStartTime`
- `defaultEndTime`
- `capacityMode`
- `status`
- `notes`
- timestamps

Allowed service types:

- `breakfast`
- `lunch`
- `dinner`
- `brunch`
- `private-dining`
- `event-dining`
- `custom`

Allowed statuses:

- `active`
- `paused`
- `archived`

### RestaurantTableType

Purpose: define a seating capacity bucket without modeling an exact floor map.

Fields:

- `tenantId`
- `restaurantId`
- `label`
- `minGuests`
- `maxGuests`
- `quantity`
- `status`
- `notes`
- timestamps

Allowed statuses:

- `active`
- `paused`
- `archived`

### RestaurantAvailabilityEntry

Purpose: define dated availability for a restaurant service window and optional table type.

Fields:

- `tenantId`
- `restaurantId`
- `serviceWindowId`
- optional `tableTypeId`
- `date`
- `status`
- `availableUnits`
- `availableSeats`
- `notes`
- timestamps

Allowed statuses:

- `open`
- `limited`
- `sold_out`
- `on_request`
- `closed`

### RestaurantReservationRequest

Purpose: capture real traveler dining intent for partner/admin handling.

Fields:

- `tenantId`
- `restaurantId`
- optional `serviceWindowId`
- optional `tableTypeId`
- traveler name
- traveler email
- traveler phone
- date
- preferred time
- guest count
- seating preference
- dietary notes
- occasion
- source
- status
- public notes
- partner notes
- linked inquiry metadata
- AI/autopilot metadata
- timestamps

Allowed sources:

- `direct`
- `itinerary`
- `operator-assisted`

Allowed statuses:

- `pending`
- `confirmed`
- `declined`
- `needs-clarification`
- `cancelled`

## Traveler Flow

On the restaurant detail page, travelers can request a reservation by selecting:

- service context
- date
- preferred time
- guest count
- seating preference
- dietary or occasion notes

The request source is `direct` when the traveler comes from the restaurant page. If the request comes from itinerary planning, the source is `itinerary` and the request preserves itinerary context.

The UI must make it clear that this is a reservation request that the restaurant or operator will confirm.

## Partner Flow

Approved restaurant partners can:

- create and edit service windows
- create and edit table types
- create and edit dated availability entries
- review reservation requests
- update request status to confirmed, declined, needs clarification, cancelled, or pending
- add partner notes

Partner actions should only apply to restaurants attached to the authenticated restaurant partner account.

## Tenant Admin Flow

Tenant admins can:

- view service windows, table types, availability entries, and reservation requests for their restaurants
- inspect reservation status
- help update operational records when needed
- see restaurant reservation activity in the restaurant workspace

Admin controls should be operationally useful without turning the tenant admin surface into a restaurant partner portal clone.

## AI Behavior

Traveler AI should help explain:

- best service window
- group or private dining fit
- family, romantic, lunch, dinner, or event suitability
- how the reservation request fits their itinerary

Partner AI should help with:

- request classification
- event or group dining detection
- clarification prompts
- confirmation or follow-up reply guidance
- high-value request flags

AI must not fabricate:

- confirmed availability
- table guarantees
- menu guarantees
- restaurant commitments

## API Shape

Public restaurant APIs should support:

- fetching public reservation options for a restaurant
- submitting a reservation request

Restaurant partner APIs should support:

- managing service windows
- managing table types
- managing availability entries
- listing reservation requests
- updating reservation request status and partner notes

Tenant admin restaurant APIs should support:

- listing reservation operations by restaurant
- managing service windows, table types, and availability where tenant admin permissions already apply
- viewing and updating reservation requests

## Testing

Backend tests should cover:

- service window normalization and validation
- table type normalization and validation
- availability summary rules
- reservation request normalization and status transitions
- public request submission
- partner authorization boundaries
- tenant admin access paths

Frontend tests should cover:

- reservation request form state
- availability option shaping
- partner dashboard state for windows, tables, availability, and requests
- admin restaurant reservation state

Build verification must include:

- focused `node --test` suites for restaurant reservation helpers, routes, and UI state
- `npm run build`

## Rollout Order

1. Backend models and utility helpers.
2. Public reservation option and request APIs.
3. Partner reservation operations APIs.
4. Tenant admin reservation visibility.
5. Restaurant detail reservation request widget.
6. Restaurant partner dashboard reservation controls.
7. Admin restaurant reservation visibility and tests.

## Success Criteria

- Travelers can submit direct restaurant reservation requests.
- Itinerary-linked dining requests can preserve reservation context.
- Restaurant partners can manage service windows, table types, dated availability, and incoming requests.
- Tenant admins can inspect and support restaurant reservation operations.
- AI assists with classification and follow-up guidance without overpromising confirmation.
- The subsystem is ready for the next phase: restaurant payments and event dining checkout.
