-- Create admin_users table for dashboard authentication
-- Replaces environment-based credentials with database-backed users

create table if not exists public.admin_users (
  id uuid primary key default gen_random_uuid(),
  username text not null unique,
  password_hash text not null,
  email text,
  is_active boolean not null default true,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Add index on username for faster lookups
create index if not exists idx_admin_users_username on public.admin_users(username);
create index if not exists idx_admin_users_is_active on public.admin_users(is_active);

-- Add trigger for updated_at
create trigger set_admin_users_updated_at before update on public.admin_users
  for each row execute function public.set_updated_at();

-- Insert default admin user (password: admin123, bcrypt hash)
-- Hash generated with: bcrypt('admin123', 10)
-- ⚠️ IMPORTANT: Change this password immediately after first login!
insert into public.admin_users (username, password_hash, email)
values ('admin', '$2a$10$H6EHBi.p0.a5Hy1a6xQV2.vPJqwPKR4yqGzPM.8.ZwJVt2yFy3BKq', 'admin@whatsapp-bot.local')
on conflict (username) do nothing;

-- Add RLS (Row Level Security) - Only backend service role can access
alter table public.admin_users enable row level security;

-- Allow service role (backend) to do everything
create policy "Enable all for service role" on public.admin_users
  for all using (true);

-- Optionally: Prevent authenticated users from seeing passwords
create policy "Public can't see admin_users" on public.admin_users
  as restrictive for select to public using (false);
