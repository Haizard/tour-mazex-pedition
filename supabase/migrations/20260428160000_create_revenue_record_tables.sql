create table if not exists public.booking_records (
  source_id text primary key,
  tenant_id text not null,
  quote_proposal_id text null,
  traveler_name text not null default '',
  email text not null default '',
  phone text not null default '',
  package_tour text not null default '',
  status text not null default 'Pending',
  revenue_stage text not null default 'new',
  payment_status text not null default 'not-started',
  total_price numeric(12,2) not null default 0,
  currency text not null default 'USD',
  referral_code text not null default '',
  lead_source text not null default '',
  campaign_label text not null default '',
  first_touch_at timestamptz null,
  converted_at timestamptz null,
  travel_date timestamptz null,
  source_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.quote_records (
  source_id text primary key,
  tenant_id text not null,
  inquiry_id text null,
  booking_id text null,
  title text not null default '',
  traveler_name text not null default '',
  status text not null default 'draft',
  conversion_stage text not null default 'draft',
  payment_status text not null default 'not-started',
  currency text not null default 'USD',
  total_price numeric(12,2) not null default 0,
  valid_until timestamptz null,
  sent_at timestamptz null,
  accepted_at timestamptz null,
  source_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payment_records (
  source_id text primary key,
  tenant_id text not null,
  booking_id text null,
  provider text not null default 'stripe',
  provider_reference text not null default '',
  customer_name text not null default '',
  status text not null default 'pending',
  currency text not null default 'USD',
  amount numeric(12,2) not null default 0,
  fee_percent numeric(8,2) not null default 0,
  fee_amount numeric(12,2) not null default 0,
  failure_reason text not null default '',
  paid_at timestamptz null,
  refunded_at timestamptz null,
  cancelled_at timestamptz null,
  source_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists booking_records_tenant_idx on public.booking_records (tenant_id, revenue_stage, payment_status);
create index if not exists quote_records_tenant_idx on public.quote_records (tenant_id, conversion_stage, payment_status);
create index if not exists payment_records_tenant_idx on public.payment_records (tenant_id, status, provider);
