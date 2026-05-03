create table if not exists public.language_assistant_profile_records (
  source_id text primary key,
  tenant_id text not null,
  language text not null default '',
  locale_code text not null default '',
  tone text not null default '',
  use_cases jsonb not null default '[]'::jsonb,
  glossary jsonb not null default '[]'::jsonb,
  status text not null default 'draft',
  notes text not null default '',
  source_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.travel_documentation_guide_records (
  source_id text primary key,
  tenant_id text not null,
  market text not null default '',
  topic text not null default '',
  requirement_summary text not null default '',
  source_label text not null default '',
  last_reviewed_at timestamptz null,
  status text not null default 'draft',
  notes text not null default '',
  source_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists language_assistant_profile_records_tenant_idx
  on public.language_assistant_profile_records (tenant_id, status, language);
create index if not exists travel_documentation_guide_records_tenant_idx
  on public.travel_documentation_guide_records (tenant_id, status, market);
