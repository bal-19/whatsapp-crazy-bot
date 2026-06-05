create table public.contacts_new (
  id uuid primary key default gen_random_uuid(),
  whatsapp_jid text not null unique,
  display_name text,
  is_blocked boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_seen_at timestamptz
);

insert into public.contacts_new (
  whatsapp_jid,
  display_name,
  is_blocked,
  created_at,
  updated_at,
  last_seen_at
)
with normalized_contacts as (
  select
    c.id as legacy_contact_id,
    c.whatsapp_jid as scope_key,
    case
      when position('::' in c.whatsapp_jid) > 0 then split_part(c.whatsapp_jid, '::', 2)
      else c.whatsapp_jid
    end as canonical_jid,
    case
      when position('::' in c.whatsapp_jid) > 0 then split_part(c.whatsapp_jid, '::', 1)
      else null
    end as group_jid,
    c.display_name,
    c.is_blocked,
    c.created_at,
    c.updated_at,
    c.last_seen_at
  from public.contacts c
),
deduped_contacts as (
  select
    canonical_jid,
    (array_remove(array_agg(display_name order by updated_at desc), null))[1] as display_name,
    bool_or(is_blocked) as is_blocked,
    min(created_at) as created_at,
    max(updated_at) as updated_at,
    max(last_seen_at) as last_seen_at
  from normalized_contacts
  group by canonical_jid
)
select
  canonical_jid,
  display_name,
  is_blocked,
  created_at,
  updated_at,
  last_seen_at
from deduped_contacts
on conflict (whatsapp_jid) do update
set
  display_name = coalesce(public.contacts_new.display_name, excluded.display_name),
  is_blocked = public.contacts_new.is_blocked or excluded.is_blocked,
  updated_at = greatest(public.contacts_new.updated_at, excluded.updated_at),
  last_seen_at = greatest(public.contacts_new.last_seen_at, excluded.last_seen_at);

create table if not exists public.conversation_scopes (
  id uuid primary key default gen_random_uuid(),
  scope_key text not null unique,
  contact_id uuid not null references public.contacts_new(id) on delete cascade,
  group_jid text references public.whatsapp_groups(group_jid) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_seen_at timestamptz
);

with normalized_contacts as (
  select
    c.id as legacy_contact_id,
    c.whatsapp_jid as scope_key,
    case
      when position('::' in c.whatsapp_jid) > 0 then split_part(c.whatsapp_jid, '::', 2)
      else c.whatsapp_jid
    end as canonical_jid,
    case
      when position('::' in c.whatsapp_jid) > 0 then split_part(c.whatsapp_jid, '::', 1)
      else null
    end as group_jid,
    c.created_at,
    c.updated_at,
    c.last_seen_at
  from public.contacts c
)
insert into public.conversation_scopes (
  scope_key,
  contact_id,
  group_jid,
  created_at,
  updated_at,
  last_seen_at
)
select
  nc.scope_key,
  cn.id,
  nc.group_jid,
  nc.created_at,
  nc.updated_at,
  nc.last_seen_at
from normalized_contacts nc
join public.contacts_new cn
  on cn.whatsapp_jid = nc.canonical_jid
on conflict (scope_key) do update
set
  contact_id = excluded.contact_id,
  group_jid = excluded.group_jid,
  updated_at = greatest(public.conversation_scopes.updated_at, excluded.updated_at),
  last_seen_at = greatest(public.conversation_scopes.last_seen_at, excluded.last_seen_at);

drop view if exists public.conversation_summaries;

alter table public.messages
  add column conversation_scope_id uuid references public.conversation_scopes(id) on delete cascade;

update public.messages m
set conversation_scope_id = cs.id
from public.contacts c
join public.conversation_scopes cs
  on cs.scope_key = c.whatsapp_jid
where m.contact_id = c.id;

alter table public.messages drop constraint if exists messages_contact_id_fkey;
alter table public.messages drop column contact_id;
alter table public.messages rename column conversation_scope_id to contact_id;
alter table public.messages alter column contact_id set not null;
create index if not exists messages_contact_id_created_at_idx
  on public.messages (contact_id, created_at desc);

alter table public.contact_memories
  add column conversation_scope_id uuid references public.conversation_scopes(id) on delete cascade;

update public.contact_memories cm
set conversation_scope_id = cs.id
from public.contacts c
join public.conversation_scopes cs
  on cs.scope_key = c.whatsapp_jid
where cm.contact_id = c.id;

alter table public.contact_memories drop constraint if exists contact_memories_contact_id_fkey;
alter table public.contact_memories drop constraint if exists contact_memories_contact_id_memory_key_key;
alter table public.contact_memories drop column contact_id;
alter table public.contact_memories rename column conversation_scope_id to contact_id;
alter table public.contact_memories alter column contact_id set not null;
alter table public.contact_memories
  add constraint contact_memories_contact_id_fkey
    foreign key (contact_id) references public.conversation_scopes(id) on delete cascade;
alter table public.contact_memories
  add constraint contact_memories_contact_id_memory_key_key
    unique (contact_id, memory_key);
create index if not exists contact_memories_contact_id_updated_at_idx
  on public.contact_memories (contact_id, updated_at desc);

drop trigger if exists set_contacts_updated_at on public.contacts;
drop table public.contacts;

alter table public.contacts_new rename to contacts;

create index if not exists contacts_last_seen_at_idx on public.contacts (last_seen_at desc);

drop trigger if exists set_contacts_updated_at on public.contacts;
create trigger set_contacts_updated_at
before update on public.contacts
for each row
execute function public.set_updated_at();

drop trigger if exists set_conversation_scopes_updated_at on public.conversation_scopes;
create trigger set_conversation_scopes_updated_at
before update on public.conversation_scopes
for each row
execute function public.set_updated_at();

create or replace view public.conversation_summaries as
select
  cs.scope_key as contact_id,
  c.whatsapp_jid as contact_jid,
  c.display_name as contact_name,
  wg.display_name as group_name,
  latest.body as last_message,
  latest.created_at as last_message_at,
  count(m.id)::int as message_count,
  round(avg(case when m.direction = 'outbound' and m.latency_ms is not null then m.latency_ms end))::int as avg_response_time_ms
from public.conversation_scopes cs
join public.contacts c on c.id = cs.contact_id
left join public.whatsapp_groups wg on wg.group_jid = cs.group_jid
join lateral (
  select body, created_at
  from public.messages
  where contact_id = cs.id
  order by created_at desc
  limit 1
) latest on true
left join public.messages m on m.contact_id = cs.id
group by cs.id, cs.scope_key, c.whatsapp_jid, c.display_name, wg.display_name, latest.body, latest.created_at;

alter table public.contacts enable row level security;
alter table public.conversation_scopes enable row level security;
