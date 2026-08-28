-- Lagniappe item photos + rider/driver selfies

alter table share_rentals
  add column if not exists photo text not null default '';

alter table share_borrows
  add column if not exists photo text not null default '';

alter table share_driver_apps
  add column if not exists selfie text not null default '';

alter table share_rider_apps
  add column if not exists selfie text not null default '';
