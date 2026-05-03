create table if not exists public.guide_driver_assignment_records (
  source_id text primary key,
  tenant_id text not null,
  assigned_booking_id text null,
  staff_type text not null default 'guide',
  full_name text not null default '',
  phone text not null default '',
  email text not null default '',
  home_base text not null default '',
  availability_status text not null default 'available',
  languages jsonb not null default '[]'::jsonb,
  specialties jsonb not null default '[]'::jsonb,
  assigned_tour_title text not null default '',
  assignment_date timestamptz null,
  assignment_start_date timestamptz null,
  assignment_end_date timestamptz null,
  assignment_notes text not null default '',
  license_category text not null default '',
  source_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.accommodation_reservation_records (
  source_id text primary key,
  tenant_id text not null,
  booking_id text null,
  booking_guest_name text not null default '',
  hotel_name text not null default '',
  supplier_name text not null default '',
  supplier_contact text not null default '',
  destination text not null default '',
  reservation_code text not null default '',
  room_plan text not null default '',
  check_in_date timestamptz null,
  check_out_date timestamptz null,
  guest_count integer not null default 1,
  status text not null default 'pending',
  notes text not null default '',
  assigned_tour_title text not null default '',
  source_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.airport_pickup_records (
  source_id text primary key,
  tenant_id text not null,
  booking_id text null,
  driver_id text null,
  guest_name text not null default '',
  airport_code text not null default '',
  flight_number text not null default '',
  pickup_date_time timestamptz null,
  destination_label text not null default '',
  assigned_tour_title text not null default '',
  driver_name text not null default '',
  vehicle_label text not null default '',
  guest_count integer not null default 1,
  status text not null default 'pending',
  notes text not null default '',
  source_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists guide_driver_assignment_records_tenant_idx
  on public.guide_driver_assignment_records (tenant_id, staff_type, availability_status);
create index if not exists accommodation_reservation_records_tenant_idx
  on public.accommodation_reservation_records (tenant_id, status, check_in_date);
create index if not exists airport_pickup_records_tenant_idx
  on public.airport_pickup_records (tenant_id, status, pickup_date_time);
