create table if not exists public.knowledge_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  question text not null,
  answer text not null,
  tags text[] not null default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists knowledge_items_is_active_updated_at_idx
  on public.knowledge_items (is_active, updated_at desc);

drop trigger if exists set_knowledge_items_updated_at on public.knowledge_items;
create trigger set_knowledge_items_updated_at
before update on public.knowledge_items
for each row
execute function public.set_updated_at();

create table if not exists public.outbox_messages (
  id uuid primary key default gen_random_uuid(),
  contact_id text not null,
  delivery_jid text not null,
  reply_preview text not null,
  payload jsonb not null,
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'sent', 'failed')),
  attempt_count integer not null default 0,
  max_attempts integer not null default 3,
  last_error text,
  next_retry_at timestamptz not null default now(),
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists outbox_messages_status_next_retry_at_idx
  on public.outbox_messages (status, next_retry_at asc);

create index if not exists outbox_messages_contact_id_created_at_idx
  on public.outbox_messages (contact_id, created_at desc);

drop trigger if exists set_outbox_messages_updated_at on public.outbox_messages;
create trigger set_outbox_messages_updated_at
before update on public.outbox_messages
for each row
execute function public.set_updated_at();

alter table public.knowledge_items enable row level security;
alter table public.outbox_messages enable row level security;
