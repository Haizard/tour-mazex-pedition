create table if not exists public.competitor_insight_records (
  source_id text primary key,
  tenant_id text not null,
  competitor_name text not null default '',
  market_region text not null default '',
  focus_route text not null default '',
  observed_price_usd numeric(12,2) null,
  currency text not null default 'USD',
  market_trend text not null default '',
  offer_summary text not null default '',
  source_label text not null default '',
  intelligence_date timestamptz null,
  strength_signals jsonb not null default '[]'::jsonb,
  risk_signals jsonb not null default '[]'::jsonb,
  status text not null default 'watchlist',
  notes text not null default '',
  source_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists competitor_insight_records_tenant_idx
  on public.competitor_insight_records (tenant_id, status, intelligence_date desc);
