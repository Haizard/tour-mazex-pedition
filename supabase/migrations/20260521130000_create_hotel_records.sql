create table if not exists public.hotel_records (
  source_id text primary key,
  tenant_id text not null,
  name text not null default '',
  slug text not null default '',
  summary text not null default '',
  description text not null default '',
  destination text not null default '',
  region text not null default '',
  accommodation_type text not null default 'hotel',
  amenities jsonb not null default '[]'::jsonb,
  room_style_summary text not null default '',
  published boolean not null default false,
  marketplace_visible boolean not null default false,
  sponsored_placement boolean not null default false,
  partner_account_id text not null default '',
  latitude numeric null,
  longitude numeric null,
  average_rating numeric null,
  review_count integer not null default 0,
  trust_summary text not null default '',
  status text not null default 'draft',
  source_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists hotel_records_tenant_idx
  on public.hotel_records (tenant_id, published, marketplace_visible);

create index if not exists hotel_records_destination_idx
  on public.hotel_records (destination, accommodation_type, sponsored_placement);

alter table public.accommodation_reservation_records
  add column if not exists hotel_id text not null default '';
