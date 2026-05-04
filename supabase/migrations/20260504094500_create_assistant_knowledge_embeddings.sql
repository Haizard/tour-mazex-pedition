create extension if not exists vector;

create table if not exists public.assistant_knowledge_embeddings (
  source_type text not null,
  source_id text not null,
  tenant_id text not null,
  title text not null default '',
  body text not null default '',
  embedding vector(64) not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (source_type, source_id)
);

create index if not exists assistant_knowledge_embeddings_tenant_idx
  on public.assistant_knowledge_embeddings (tenant_id, source_type);

create index if not exists assistant_knowledge_embeddings_vector_idx
  on public.assistant_knowledge_embeddings
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 50);
