create table if not exists public.traveler_inquiry_records (
  source_id text primary key,
  tenant_id text not null,
  traveler_name text not null default '',
  first_name text not null default '',
  last_name text not null default '',
  email text not null default '',
  phone text not null default '',
  destinations jsonb not null default '[]'::jsonb,
  travel_when text not null default '',
  trip_length_days integer not null default 0,
  adults integer not null default 0,
  children_under_5 integer not null default 0,
  children_6_to_15 integer not null default 0,
  budget text not null default '',
  lead_stage text not null default 'new',
  status text not null default 'Pending',
  source_channel text not null default 'website',
  campaign_label text not null default '',
  referral_code text not null default '',
  lead_score integer not null default 0,
  lead_temperature text not null default 'cold',
  first_touch_at timestamptz null,
  converted_at timestamptz null,
  source_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists traveler_inquiry_records_tenant_idx
  on public.traveler_inquiry_records (tenant_id, lead_stage, status, source_channel);
