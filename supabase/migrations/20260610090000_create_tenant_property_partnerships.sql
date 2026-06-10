create table if not exists public.tenant_property_partnerships (
  source_id text primary key,
  tenant_id text not null,
  property_id text not null default '',
  property_type text not null default '',
  property_name text not null default '',
  property_slug text not null default '',
  owner_tenant_id text null,
  commission_percent numeric(5,2) not null default 0,
  status text not null default 'active',
  deal_notes text not null default '',
  source_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tenant_property_partnerships_tenant_idx
  on public.tenant_property_partnerships (tenant_id, status);

create index if not exists tenant_property_partnerships_property_idx
  on public.tenant_property_partnerships (property_id, property_type);
