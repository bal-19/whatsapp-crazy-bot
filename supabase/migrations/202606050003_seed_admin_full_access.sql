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

update public.users
set
  password_hash = '$2a$10$4OQFoQL3xPlZuzxsNfBwBuziYuQEbBAlescR19upKl4lC/Zc2kO7u',
  role_id = roles.id,
  is_active = true,
  email = coalesce(public.users.email, 'admin@whatsapp-bot.local')
from public.roles
where public.users.username = 'admin'
  and roles.name = 'Admin';

insert into public.users (username, password_hash, email, role_id, is_active)
select
  'admin',
  '$2a$10$4OQFoQL3xPlZuzxsNfBwBuziYuQEbBAlescR19upKl4lC/Zc2kO7u',
  'admin@whatsapp-bot.local',
  roles.id,
  true
from public.roles
where roles.name = 'Admin'
  and not exists (
    select 1
    from public.users
    where username = 'admin'
  );
