alter table public.messages
  add column if not exists message_timestamp timestamptz;

update public.messages
set message_timestamp = created_at
where message_timestamp is null;

alter table public.messages
  alter column message_timestamp set default now();

alter table public.messages
  alter column message_timestamp set not null;

create index if not exists messages_contact_id_message_timestamp_idx
  on public.messages (contact_id, message_timestamp desc);

create index if not exists messages_message_timestamp_idx
  on public.messages (message_timestamp desc);

drop view if exists public.conversation_summaries;

create or replace view public.conversation_summaries as
select
  cs.scope_key as contact_id,
  c.whatsapp_jid as contact_jid,
  c.display_name as contact_name,
  wg.display_name as group_name,
  latest.body as last_message,
  latest.message_timestamp as last_message_at,
  count(m.id)::int as message_count,
  round(avg(case when m.direction = 'outbound' and m.latency_ms is not null then m.latency_ms end))::int as avg_response_time_ms
from public.conversation_scopes cs
join public.contacts c on c.id = cs.contact_id
left join public.whatsapp_groups wg on wg.group_jid = cs.group_jid
join lateral (
  select body, message_timestamp
  from public.messages
  where contact_id = cs.id
  order by message_timestamp desc, created_at desc
  limit 1
) latest on true
left join public.messages m on m.contact_id = cs.id
group by cs.id, cs.scope_key, c.whatsapp_jid, c.display_name, wg.display_name, latest.body, latest.message_timestamp;
