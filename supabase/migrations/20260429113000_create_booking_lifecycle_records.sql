create table if not exists public.review_request_records (
  source_id text primary key,
  tenant_id text not null,
  booking_id text not null,
  guest_name text not null default '',
  guest_email text not null default '',
  booking_label text not null default '',
  subject text not null default '',
  message text not null default '',
  status text not null default 'draft',
  platforms jsonb not null default '[]'::jsonb,
  send_window_label text not null default '',
  next_step_checklist jsonb not null default '[]'::jsonb,
  sent_at timestamptz null,
  completed_at timestamptz null,
  source_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists review_request_records_tenant_idx
  on public.review_request_records (tenant_id, updated_at desc);

create index if not exists review_request_records_booking_idx
  on public.review_request_records (booking_id);

create table if not exists public.repeat_customer_campaign_records (
  source_id text primary key,
  tenant_id text not null,
  booking_id text not null,
  guest_name text not null default '',
  guest_email text not null default '',
  booking_label text not null default '',
  campaign_type text not null default 'referral',
  audience_tag text not null default '',
  segment text not null default 'First-Timer',
  channel text not null default 'email',
  offer_label text not null default '',
  subject text not null default '',
  message text not null default '',
  status text not null default 'draft',
  recommended_send_at_label text not null default '',
  next_step_checklist jsonb not null default '[]'::jsonb,
  sent_at timestamptz null,
  converted_at timestamptz null,
  source_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists repeat_customer_campaign_records_tenant_idx
  on public.repeat_customer_campaign_records (tenant_id, updated_at desc);

create index if not exists repeat_customer_campaign_records_booking_idx
  on public.repeat_customer_campaign_records (booking_id);
