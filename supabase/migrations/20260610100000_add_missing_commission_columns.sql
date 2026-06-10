-- Add missing columns to payment_records
-- These were previously applied via scratch scripts but never formalized as migrations
alter table public.payment_records
  add column if not exists invoice_media_id text,
  add column if not exists marketplace_payout_amount numeric(15,2) not null default 0,
  add column if not exists checkout_kind text not null default '';

-- Add missing columns to booking_records
alter table public.booking_records
  add column if not exists itinerary_media_id text,
  add column if not exists distributor_tenant_id text,
  add column if not exists marketplace_commission_percent numeric(10,2) not null default 0;

-- Index for commission report queries — filter on payout > 0 is the common pattern
create index if not exists payment_records_payout_idx
  on public.payment_records (marketplace_payout_amount)
  where marketplace_payout_amount > 0;

-- Index for booking distributor lookups
create index if not exists booking_records_distributor_idx
  on public.booking_records (distributor_tenant_id)
  where distributor_tenant_id is not null and distributor_tenant_id != '';
