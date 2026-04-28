create table if not exists public.shadow_entity_snapshots (
  entity_type text not null,
  source_id text not null,
  tenant_id text not null,
  canonical_id text not null,
  payload jsonb not null default '{}'::jsonb,
  source_created_at timestamptz null,
  source_updated_at timestamptz null,
  shadow_synced_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (entity_type, source_id)
);

create index if not exists shadow_entity_snapshots_tenant_idx
  on public.shadow_entity_snapshots (tenant_id, entity_type);

create or replace function public.set_shadow_entity_snapshots_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists shadow_entity_snapshots_set_updated_at
  on public.shadow_entity_snapshots;

create trigger shadow_entity_snapshots_set_updated_at
before update on public.shadow_entity_snapshots
for each row
execute function public.set_shadow_entity_snapshots_updated_at();
