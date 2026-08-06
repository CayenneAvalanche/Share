-- Share marketplace tables (applications, waitlist, driver availability).
-- Applied on Neon at build (`npm run db:migrate`) and on PGLite at startup.

create table if not exists share_waitlist (
  id text primary key,
  email text not null,
  source text not null default 'landing',
  created_at timestamptz not null default now()
);

create unique index if not exists share_waitlist_email_idx
  on share_waitlist (lower(email));

create table if not exists share_driver_apps (
  id text primary key,
  full_name text not null,
  email text not null,
  phone text not null,
  city text not null,
  vehicle text not null default '',
  license_plate text not null default '',
  years_driving text not null default '',
  corridors text not null default '',
  interview_mode text not null default 'either',
  preferred_time text not null default '',
  notes text not null default '',
  gender text not null default 'unspecified',
  status text not null default 'pending_interview',
  public_bio text not null default '',
  hometown text not null default '',
  other_job text not null default '',
  platforms_text text not null default '',
  has_dashcam boolean not null default false,
  emergency_contact_name text not null default '',
  emergency_contact_phone text not null default '',
  docs_note text not null default '',
  invite_code text,
  interview_at timestamptz,
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists share_driver_apps_status_idx on share_driver_apps (status);
create index if not exists share_driver_apps_created_idx on share_driver_apps (created_at desc);

create table if not exists share_rider_apps (
  id text primary key,
  full_name text not null,
  email text not null,
  phone text not null,
  city text not null,
  typical_routes text not null default '',
  interview_mode text not null default 'either',
  preferred_time text not null default '',
  notes text not null default '',
  status text not null default 'pending_interview',
  invite_code text,
  interview_at timestamptz,
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists share_rider_apps_status_idx on share_rider_apps (status);

create table if not exists share_delivery_apps (
  id text primary key,
  business_name text not null,
  contact_name text not null,
  email text not null,
  phone text not null,
  city text not null,
  notes text not null default '',
  status text not null default 'pending_interview',
  admin_note text,
  created_at timestamptz not null default now()
);

-- Lightweight signal for "drivers nearby" (local Available toggle)
create table if not exists share_driver_presence (
  id text primary key,
  display_name text not null,
  city text not null default 'Lafayette, LA',
  available boolean not null default false,
  lat double precision,
  lng double precision,
  updated_at timestamptz not null default now()
);

create index if not exists share_driver_presence_avail_idx
  on share_driver_presence (available) where available = true;
