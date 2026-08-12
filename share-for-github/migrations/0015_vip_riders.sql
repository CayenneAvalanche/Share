create table if not exists share_vip_riders (
  id text primary key,
  phone10 text not null unique,
  full_name text not null,
  local_price int not null default 5,
  note text,
  created_at timestamptz not null default now()
);
create index if not exists share_vip_riders_phone10_idx on share_vip_riders (phone10);
