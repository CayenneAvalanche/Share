-- Driver document photos + public marketplace (Lagniappe) for multi-user beta.

alter table share_driver_apps
  add column if not exists license_front text not null default '';

alter table share_driver_apps
  add column if not exists license_back text not null default '';

alter table share_driver_apps
  add column if not exists insurance_card text not null default '';

create table if not exists share_rentals (
  id text primary key,
  title text not null,
  description text not null default '',
  category text not null default 'other',
  rate integer not null default 0,
  rate_unit text not null default 'day',
  city text not null default 'Lafayette, LA',
  owner_name text not null default '',
  owner_email text,
  deposit integer,
  available boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists share_rentals_created_idx
  on share_rentals (created_at desc);

create table if not exists share_borrows (
  id text primary key,
  title text not null,
  description text not null default '',
  category text not null default 'other',
  offer integer not null default 0,
  rate_unit text not null default 'day',
  city text not null default 'Lafayette, LA',
  needed_by timestamptz,
  requester_name text not null default '',
  requester_email text,
  status text not null default 'open',
  created_at timestamptz not null default now()
);

create index if not exists share_borrows_created_idx
  on share_borrows (created_at desc);
