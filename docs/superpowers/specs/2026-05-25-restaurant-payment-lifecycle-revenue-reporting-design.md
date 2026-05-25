# Restaurant Payment Lifecycle And Revenue Reporting Design

## Goal

Keep restaurant reservation payment state aligned with `PaymentTransaction` lifecycle changes and expose restaurant dining revenue analytics for admins and partners.

## Scope

Implement now:

- Sync restaurant reservation payment fields when a linked payment becomes `paid`, `failed`, `cancelled`, or `refunded`.
- Include restaurant reservation sync in queued payment webhook processing.
- Add restaurant revenue analytics based on reservation-linked payment transactions.
- Surface dining revenue totals in restaurant admin analytics.
- Surface partner reservation payment summaries in the partner dashboard state.

Keep out:

- New payment provider integrations.
- Manual settlement reconciliation.
- Accounting exports.
- Restaurant POS reporting.

## Lifecycle Sync

When `PaymentTransaction.restaurantReservationRequestId` is present:

- `paid` updates reservation `paymentStatus` to `paid` and sets `paymentPaidAt`.
- `failed` updates reservation `paymentStatus` to `failed`.
- `cancelled` updates reservation `paymentStatus` to `failed`.
- `refunded` updates reservation `paymentStatus` to `refunded`.
- `pending` keeps or sets reservation `paymentStatus` to `pending`.

The reservation keeps its operational status separate from payment status.

## Revenue Reporting

Restaurant analytics should include:

- total requested restaurant payment amount
- pending amount
- paid amount
- failed/refunded amount
- paid transaction count
- requested transaction count
- event/private/group/custom reason split

Analytics rows should connect payment totals to restaurant IDs so the restaurant manager can show revenue beside existing lead and sponsored metrics.

## Testing

Backend tests should cover:

- lifecycle patch mapping
- reservation sync from payment objects
- webhook processor invoking restaurant reservation sync
- restaurant analytics payment totals

Frontend tests should cover:

- revenue summary shaping
- payment status display helpers

## Success Criteria

- A restaurant payment webhook update automatically updates the linked reservation payment status.
- Restaurant analytics show payment totals and paid revenue.
- Existing payment and restaurant route tests remain green.
