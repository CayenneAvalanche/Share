-- Driver rates rider after completed trip (symmetric to rider_rating)
alter table share_volunteer_rides
  add column if not exists driver_rating int;
alter table share_volunteer_rides
  add column if not exists driver_review text;
alter table share_volunteer_rides
  add column if not exists driver_rated_at timestamptz;
