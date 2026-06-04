create table if not exists public.contact_memories (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references public.contacts(id) on delete cascade,
  memory_key text not null,
  memory_value text not null,
  confidence numeric(4,3),
  source_message_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (contact_id, memory_key)
);

create index if not exists contact_memories_contact_id_updated_at_idx
  on public.contact_memories (contact_id, updated_at desc);

drop trigger if exists set_contact_memories_updated_at on public.contact_memories;
create trigger set_contact_memories_updated_at
before update on public.contact_memories
for each row
execute function public.set_updated_at();

alter table public.contact_memories enable row level security;
