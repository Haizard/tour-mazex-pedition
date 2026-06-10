-- Rollback for migration 20260610100000_add_missing_commission_columns.sql
-- ⚠️ Destructive: drops columns and indexes. Only run if you accept data loss.
-- Run in reverse order of the forward migration.

drop index if exists public.booking_records_distributor_idx;
drop index if exists public.payment_records_payout_idx;

alter table public.booking_records
  drop column if exists marketplace_commission_percent,
  drop column if exists distributor_tenant_id,
  drop column if exists itinerary_media_id;

alter table public.payment_records
  drop column if exists checkout_kind,
  drop column if exists marketplace_payout_amount,
  drop column if exists invoice_media_id;
