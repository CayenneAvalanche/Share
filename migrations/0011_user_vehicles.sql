-- Per-user vehicle garage (synced across devices)
create table if not exists share_user_vehicles (
  id text primary key,
  email text not null,
  label text not null,
  vehicle_type text not null default 'Other',
  license_plate text not null default '',
  photo_url text not null default '',
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists share_user_vehicles_email_idx
  on share_user_vehicles (lower(email));

-- Default car photo on driver applications (for HQ / multi-device)
alter table share_driver_apps
  add column if not exists vehicle_photo text not null default '';
