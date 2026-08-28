-- Public beta: volunteer ride board (multi-device)

create table if not exists share_volunteer_rides (
  id text primary key,
  category text not null default 'elder',
  full_name text not null,
  phone text not null default '',
  pickup text not null default '',
  dropoff text not null default '',
  when_text text not null default 'ASAP',
  notes text not null default '',
  escalate_after_hours integer not null default 2,
  paid_offer integer not null default 12,
  requester_name text not null default '',
  status text not null default 'seeking_volunteer',
  matched_driver_name text,
  escalated_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists share_volunteer_status_idx
  on share_volunteer_rides (status);

create index if not exists share_volunteer_created_idx
  on share_volunteer_rides (created_at desc);
