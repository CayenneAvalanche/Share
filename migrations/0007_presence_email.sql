-- Driver online presence: optional email + staleness via updated_at
alter table share_driver_presence
  add column if not exists email text;

create index if not exists share_driver_presence_updated_idx
  on share_driver_presence (updated_at desc);
