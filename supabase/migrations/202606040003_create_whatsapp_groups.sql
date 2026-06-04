create table if not exists public.whatsapp_groups (
  id uuid primary key default gen_random_uuid(),
  group_jid text not null unique,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists whatsapp_groups_group_jid_idx
  on public.whatsapp_groups (group_jid);

drop view if exists public.conversation_summaries;

create view public.conversation_summaries as
select
  c.whatsapp_jid as contact_id,
  c.display_name as contact_name,
  wg.display_name as group_name,
  latest.body as last_message,
  latest.created_at as last_message_at,
  count(m.id)::int as message_count,
  round(avg(case when m.direction = 'outbound' and m.latency_ms is not null then m.latency_ms end))::int as avg_response_time_ms
from public.contacts c
left join public.whatsapp_groups wg
  on wg.group_jid = split_part(c.whatsapp_jid, '::', 1)
  and position('::' in c.whatsapp_jid) > 0
join lateral (
  select body, created_at
  from public.messages
  where contact_id = c.id
  order by created_at desc
  limit 1
) latest on true
left join public.messages m on m.contact_id = c.id
group by c.id, c.whatsapp_jid, c.display_name, wg.display_name, latest.body, latest.created_at;
