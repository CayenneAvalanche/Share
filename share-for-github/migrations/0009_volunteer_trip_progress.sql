alter table share_volunteer_rides
  add column if not exists trip_started_at timestamptz;
alter table share_volunteer_rides
  add column if not exists trip_ended_at timestamptz;
