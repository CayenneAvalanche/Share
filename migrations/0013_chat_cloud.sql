-- Cloud chat threads + messages (multi-device Chat tab)

create table if not exists share_chat_threads (
  id text primary key,
  subject text not null default '',
  participants_json text not null default '[]',
  participant_emails_json text not null default '[]',
  participant_phones_json text not null default '[]',
  related_type text not null default 'support',
  related_id text,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists share_chat_threads_updated_idx
  on share_chat_threads (updated_at desc);

create table if not exists share_chat_messages (
  id text primary key,
  thread_id text not null references share_chat_threads(id) on delete cascade,
  from_name text not null default '',
  from_email text,
  body text not null default '',
  kind text not null default 'text',
  at timestamptz not null default now()
);

create index if not exists share_chat_messages_thread_idx
  on share_chat_messages (thread_id, at asc);

create table if not exists share_chat_reads (
  thread_id text not null,
  reader_key text not null,
  last_read_at timestamptz not null default now(),
  primary key (thread_id, reader_key)
);
