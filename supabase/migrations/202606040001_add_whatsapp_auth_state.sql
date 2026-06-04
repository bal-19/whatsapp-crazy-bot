create table if not exists public.whatsapp_auth_state (
  category text not null,
  key_id text not null,
  value jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (category, key_id)
);

alter table public.whatsapp_auth_state enable row level security;
