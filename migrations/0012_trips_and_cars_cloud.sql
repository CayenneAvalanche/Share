-- Corridor trips + Share-a-car listings (multi-device pilot).

create table if not exists share_trips (
  id text primary key,
  type text not null default 'ride',
  from_place text not null,
  to_place text not null,
  from_short text not null default '',
  to_short text not null default '',
  depart_at timestamptz not null,
  arrive_at timestamptz not null,
  seats_available integer not null default 1,
  seats_total integer not null default 1,
  cargo_capacity text not null default '',
  price_per_seat integer not null default 0,
  delivery_rate integer not null default 0,
  stops_json text not null default '[]',
  schedule text not null default 'moderate',
  notes text not null default '',
  driver_id text not null default 'member',
  distance_miles integer not null default 0,
  duration_hours real not null default 0,
  vehicle_photo text,
  vehicle_type text,
  vehicle_label text,
  posted_by_email text,
  posted_by_name text,
  driver_selfie text,
  created_at timestamptz not null default now()
);

create index if not exists share_trips_depart_idx on share_trips (depart_at desc);

create table if not exists share_car_listings (
  id text primary key,
  make_model text not null,
  year integer not null default 2020,
  seats integer not null default 5,
  transmission text not null default 'auto',
  rate_per_day integer not null default 45,
  deposit integer not null default 200,
  city text not null default 'Lafayette, LA',
  owner_name text not null default '',
  owner_email text,
  has_dashcam boolean not null default true,
  insurance_note text not null default '',
  rules text not null default '',
  available boolean not null default true,
  trips_hosted integer not null default 0,
  rating real not null default 5,
  photo_url text,
  created_at timestamptz not null default now()
);

create index if not exists share_car_listings_created_idx
  on share_car_listings (created_at desc);
