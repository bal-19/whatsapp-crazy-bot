create table if not exists public.roles (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  permissions jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_roles_name on public.roles(name);

drop trigger if exists set_roles_updated_at on public.roles;
create trigger set_roles_updated_at before update on public.roles
  for each row execute function public.set_updated_at();

insert into public.roles (name, permissions)
values (
  'Admin',
  '[
    "dashboard.view",
    "conversations.view",
    "contacts.manage",
    "groups.manage",
    "config.manage",
    "analytics.view",
    "logs.view",
    "users.manage",
    "roles.manage",
    "bot.manage",
    "maintenance.manage"
  ]'::jsonb
)
on conflict (name) do update
set permissions = excluded.permissions;

do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public' and table_name = 'admin_users'
  ) and not exists (
    select 1
    from information_schema.tables
    where table_schema = 'public' and table_name = 'users'
  ) then
    alter table public.admin_users rename to users;
  end if;
end $$;

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  username text not null unique,
  password_hash text not null,
  email text,
  is_active boolean not null default true,
  role_id uuid references public.roles(id) on delete set null,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.users
  add column if not exists role_id uuid references public.roles(id) on delete set null;

create index if not exists idx_users_username on public.users(username);
create index if not exists idx_users_is_active on public.users(is_active);
create index if not exists idx_users_role_id on public.users(role_id);

drop trigger if exists set_users_updated_at on public.users;
drop trigger if exists set_admin_users_updated_at on public.users;
create trigger set_users_updated_at before update on public.users
  for each row execute function public.set_updated_at();

update public.users
set role_id = roles.id
from public.roles
where public.users.role_id is null
  and roles.name = 'Admin';

insert into public.users (username, password_hash, email, role_id)
select
  'admin',
  '$2a$10$H6EHBi.p0.a5Hy1a6xQV2.vPJqwPKR4yqGzPM.8.ZwJVt2yFy3BKq',
  'admin@whatsapp-bot.local',
  roles.id
from public.roles
where roles.name = 'Admin'
on conflict (username) do update
set role_id = excluded.role_id;

alter table public.roles enable row level security;
alter table public.users enable row level security;

drop policy if exists "Enable all for service role" on public.roles;
create policy "Enable all for service role" on public.roles
  for all using (true);

drop policy if exists "Public can't see roles" on public.roles;
create policy "Public can't see roles" on public.roles
  as restrictive for select to public using (false);

drop policy if exists "Enable all for service role" on public.users;
create policy "Enable all for service role" on public.users
  for all using (true);

drop policy if exists "Public can't see users" on public.users;
create policy "Public can't see users" on public.users
  as restrictive for select to public using (false);
