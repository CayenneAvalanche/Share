-- When a volunteer/local free ride is cancelled (history + alerts)
alter table share_volunteer_rides
  add column if not exists cancelled_at timestamptz;
