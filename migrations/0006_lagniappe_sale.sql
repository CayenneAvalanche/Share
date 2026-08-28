-- Lagniappe: rent + optional sell (Letgo-style)
alter table share_rentals
  add column if not exists for_rent boolean not null default true;

alter table share_rentals
  add column if not exists for_sale boolean not null default false;

alter table share_rentals
  add column if not exists sale_price integer;

create table if not exists share_marketplace_requests (
  id text primary key,
  rental_id text not null,
  kind text not null default 'rent',
  requester_name text not null default '',
  requester_email text,
  note text not null default '',
  preferred_pickup text,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

create index if not exists share_marketplace_requests_rental_idx
  on share_marketplace_requests (rental_id, created_at desc);
