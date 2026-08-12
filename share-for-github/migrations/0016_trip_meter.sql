alter table share_volunteer_rides
  add column if not exists trip_miles double precision;
alter table share_volunteer_rides
  add column if not exists trip_fare double precision;
