alter table public.quote_records
  add column if not exists public_token text not null default '';

create index if not exists quote_records_public_token_idx
  on public.quote_records (public_token);
