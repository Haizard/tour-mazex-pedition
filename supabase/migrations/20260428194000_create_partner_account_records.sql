create table if not exists public.partner_account_records (
  source_id text primary key,
  tenant_id text not null,
  partner_type text not null default 'hotel',
  company_name text not null default '',
  contact_name text not null default '',
  email text not null default '',
  phone text not null default '',
  location text not null default '',
  service_focus text not null default '',
  contract_label text not null default '',
  payout_terms text not null default '',
  notes text not null default '',
  status text not null default 'pending',
  source_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists partner_account_records_tenant_idx
  on public.partner_account_records (tenant_id, partner_type, status);
