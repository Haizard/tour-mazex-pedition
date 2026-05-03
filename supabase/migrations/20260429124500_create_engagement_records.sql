create table if not exists public.traveler_feedback_records (
  source_id text primary key,
  tenant_id text not null,
  booking_id text not null,
  rating numeric null,
  private_note text not null default '',
  public_review text not null default '',
  public_token text not null default '',
  referral_code text not null default '',
  status text not null default 'pending',
  submitted_at timestamptz null,
  ai_sentiment text not null default '',
  ai_score numeric null,
  ai_summary text not null default '',
  ai_key_topics jsonb not null default '[]'::jsonb,
  ai_improvement_suggestion text not null default '',
  source_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists traveler_feedback_records_tenant_idx
  on public.traveler_feedback_records (tenant_id, updated_at desc);

create index if not exists traveler_feedback_records_booking_idx
  on public.traveler_feedback_records (booking_id);

create unique index if not exists traveler_feedback_records_public_token_idx
  on public.traveler_feedback_records (public_token);

create table if not exists public.lead_follow_up_sequence_records (
  source_id text primary key,
  tenant_id text not null,
  inquiry_id text null,
  booking_id text null,
  status text not null default 'active',
  touchpoints jsonb not null default '[]'::jsonb,
  source_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists lead_follow_up_sequence_records_tenant_idx
  on public.lead_follow_up_sequence_records (tenant_id, updated_at desc);

create index if not exists lead_follow_up_sequence_records_inquiry_idx
  on public.lead_follow_up_sequence_records (inquiry_id);

create index if not exists lead_follow_up_sequence_records_booking_idx
  on public.lead_follow_up_sequence_records (booking_id);
