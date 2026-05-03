alter table public.payment_records
  add column if not exists public_token text not null default '';

create index if not exists payment_records_public_token_idx
  on public.payment_records (public_token);
