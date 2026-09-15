create table if not exists letters (
  id           serial primary key,
  client_id    text not null unique,
  author_name  text not null,
  body         text not null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists letters_created_at_idx on letters (created_at);
