alter table share_volunteer_rides
  add column if not exists rider_rating int;
alter table share_volunteer_rides
  add column if not exists rider_review text;
alter table share_volunteer_rides
  add column if not exists rated_at timestamptz;
