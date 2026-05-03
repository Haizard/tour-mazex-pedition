create table if not exists public.media_asset_records (
  source_id text primary key,
  tenant_id text not null,
  filename text not null default '',
  content_type text not null default 'application/octet-stream',
  size bigint not null default 0,
  storage_provider text not null default 'mongo-inline',
  storage_key text not null default '',
  storage_bucket text not null default '',
  storage_endpoint text not null default '',
  public_url text not null default '',
  uploaded_by text null,
  source_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists media_asset_records_tenant_idx
  on public.media_asset_records (tenant_id, storage_provider, created_at desc);
