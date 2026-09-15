create table if not exists rsvps (
  id          serial primary key,
  client_id   text not null unique,
  guest_name  text not null,
  attending   boolean not null,
  party_size  integer not null default 1,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists rsvps_attending_idx on rsvps (attending);
