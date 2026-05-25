# Restaurant Payments And Event Dining Checkout Design

## Goal

Add restaurant payment support for confirmed reservation deposits and custom event/private/group dining payment requests.

This phase bridges restaurant reservation intent into the existing platform payment system. It does not create a restaurant POS, menu basket, delivery checkout, or separate payment stack.

## Product Direction

The checkout model is a balanced hybrid:

- Standard confirmed restaurant reservations can generate deposit payment requests.
- Event, private dining, and group dining requests can generate custom payment requests.
- Both flows create `PaymentTransaction` records with restaurant and reservation metadata.
- Payment status is tracked separately from reservation operational status.

This keeps restaurants operationally flexible while aligning dining revenue with the existing Revenue Core.

## Scope

Implement now:

- Restaurant checkout settings.
- Reservation deposit amount calculation.
- Custom event/private/group dining payment request creation.
- Payment transaction creation tied to restaurant reservation requests.
- Partner controls to request payment.
- Tenant admin controls and visibility.
- Reservation payment status fields.
- Payment metadata for restaurant revenue attribution.

Keep out of this phase:

- Full POS checkout.
- Menu item basket checkout.
- Ordering or delivery workflows.
- Tax/service charge engines.
- Third-party restaurant payment vendor sync.
- Automatic reservation confirmation based only on payment.

## Data Model

### Restaurant Checkout Settings

Add `restaurantCheckout` to `Restaurant`:

- `enabled`
- `depositMode`
  - `none`
  - `fixed`
  - `percentage`
  - `custom-only`
- `depositAmount`
- `depositPercentage`
- `currency`
- `paymentInstructions`

Default behavior:

- checkout is disabled by default
- currency defaults to `USD`
- deposit mode defaults to `none`

### Restaurant Reservation Payment Fields

Add payment state to `RestaurantReservationRequest`:

- `paymentStatus`
  - `not_required`
  - `payment_requested`
  - `pending`
  - `paid`
  - `failed`
  - `refunded`
- `paymentTransactionId`
- `paymentAmount`
- `paymentCurrency`
- `paymentReason`
  - `reservation_deposit`
  - `event_dining`
  - `private_dining`
  - `group_dining`
  - `custom`
- `paymentRequestedAt`
- `paymentPaidAt`
- `paymentInstructions`

Operational status remains separate:

- `pending`
- `confirmed`
- `declined`
- `needs-clarification`
- `cancelled`

## PaymentTransaction Integration

Restaurant checkout should use the existing `PaymentTransaction` model.

Restaurant payment transactions should include metadata:

- `sourceType: restaurant_reservation`
- `restaurantId`
- `reservationRequestId`
- `serviceWindowId`
- `tableTypeId`
- `source`
- `paymentReason`
- event/group/private dining classification when available

The payment transaction remains the financial object. The reservation request remains the operational object.

## Checkout Flow

### Deposit Flow

1. Traveler submits reservation request.
2. Partner/admin confirms the reservation request operationally.
3. Partner/admin creates deposit payment request.
4. Platform calculates deposit from restaurant checkout settings.
5. Platform creates `PaymentTransaction`.
6. Reservation request payment status becomes `payment_requested` or `pending`.
7. Existing payment webhook/status logic marks transaction paid.
8. Reservation request payment status becomes `paid`.

### Event Dining Flow

1. Traveler submits event, private dining, or group dining request.
2. AI/autopilot flags the request for review where appropriate.
3. Partner/admin sets custom amount and payment reason.
4. Platform creates restaurant dining `PaymentTransaction`.
5. Traveler pays through existing public payment flow.
6. Reservation retains both operational status and payment state.

## Partner Controls

Restaurant partners can:

- see reservation payment status
- create deposit payment requests
- create custom dining payment requests
- add payment instructions
- see linked transaction ID and status

Partner actions must be limited to restaurants attached to the authenticated partner admin.

## Tenant Admin Controls

Tenant admins can:

- update restaurant checkout settings
- inspect reservation payment state
- create payment requests for reservation deposits or custom dining amounts
- see linked transaction references
- support future revenue reporting through restaurant payment metadata

## Guardrails

- Custom payment amount must be positive.
- Deposit calculation must be deterministic.
- Payment request creation should require a reservation request.
- Deposit payment requests should generally require confirmed reservation status.
- Event/group/private custom requests can be created for high-intent requests that need review.
- Do not create duplicate active unpaid transactions for the same reservation unless explicitly regenerated later.
- Payment does not silently create operational confirmation.

## Testing

Backend tests should cover:

- checkout setting normalization
- fixed deposit calculation
- percentage deposit calculation
- custom payment amount validation
- duplicate active transaction prevention
- reservation payment state updates
- partner authorization boundaries
- tenant admin route wiring

Frontend tests should cover:

- partner payment control state
- admin payment visibility state
- payment amount display and validation
- reservation payment status labels

Build verification must include:

- focused `node --test` suites for restaurant checkout helpers, routes, and UI state
- `npm run build`

## Rollout Order

1. Extend models and checkout utility.
2. Add backend route tests and endpoints.
3. Add partner payment controls.
4. Add tenant admin payment visibility and controls.
5. Verify payment transaction import safety and build.

## Success Criteria

- Confirmed restaurant reservations can generate deposit payment requests.
- Event/private/group dining reservations can generate custom payment requests.
- Payment transactions carry restaurant reservation metadata.
- Reservation requests show payment state separately from operational state.
- Partner and tenant admin controls respect ownership and tenant boundaries.
- Existing payment infrastructure remains the only money-handling system.
