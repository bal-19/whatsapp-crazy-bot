create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  whatsapp_jid text not null unique,
  display_name text,
  is_blocked boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_seen_at timestamptz
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  whatsapp_message_id text not null unique,
  contact_id uuid not null references public.contacts(id) on delete cascade,
  direction text not null check (direction in ('inbound', 'outbound')),
  body text not null,
  status text not null default 'sent' check (status in ('sent', 'delivered', 'read', 'failed')),
  ai_model text,
  tokens_used integer,
  latency_ms integer,
  raw_payload jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.bot_settings (
  id uuid primary key default gen_random_uuid(),
  bot_name text not null,
  system_prompt text not null,
  is_active boolean not null default true,
  ignore_groups boolean not null default true,
  tone_style text not null default 'pedas'
    check (tone_style in ('pedas', 'wholesome', 'absurd', 'helpful', 'custom')),
  updated_at timestamptz not null default now()
);

create table if not exists public.system_logs (
  id bigint generated always as identity primary key,
  level text not null check (level in ('info', 'warn', 'error')),
  event text not null,
  message text not null,
  meta jsonb,
  created_at timestamptz not null default now()
);

create index if not exists contacts_last_seen_at_idx on public.contacts (last_seen_at desc);
create index if not exists messages_contact_id_created_at_idx on public.messages (contact_id, created_at desc);
create index if not exists messages_created_at_idx on public.messages (created_at desc);
create index if not exists system_logs_level_created_at_idx on public.system_logs (level, created_at desc);

drop trigger if exists set_contacts_updated_at on public.contacts;
create trigger set_contacts_updated_at
before update on public.contacts
for each row
execute function public.set_updated_at();

drop trigger if exists set_bot_settings_updated_at on public.bot_settings;
create trigger set_bot_settings_updated_at
before update on public.bot_settings
for each row
execute function public.set_updated_at();

create or replace view public.conversation_summaries as
select
  c.whatsapp_jid as contact_id,
  c.display_name as contact_name,
  latest.body as last_message,
  latest.created_at as last_message_at,
  count(m.id)::int as message_count,
  round(avg(case when m.direction = 'outbound' and m.latency_ms is not null then m.latency_ms end))::int as avg_response_time_ms
from public.contacts c
join lateral (
  select body, created_at
  from public.messages
  where contact_id = c.id
  order by created_at desc
  limit 1
) latest on true
left join public.messages m on m.contact_id = c.id
group by c.id, c.whatsapp_jid, c.display_name, latest.body, latest.created_at;

alter table public.contacts enable row level security;
alter table public.messages enable row level security;
alter table public.bot_settings enable row level security;
alter table public.system_logs enable row level security;
