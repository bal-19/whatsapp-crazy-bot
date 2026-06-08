alter table public.messages
  add column if not exists reply_to_message_id text;

create index if not exists messages_reply_to_message_id_idx
  on public.messages (reply_to_message_id)
  where reply_to_message_id is not null;
