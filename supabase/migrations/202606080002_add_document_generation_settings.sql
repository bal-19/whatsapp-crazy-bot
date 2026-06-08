alter table public.bot_settings
add column if not exists documents_enabled boolean not null default true,
add column if not exists allowed_document_formats text[] not null default array['pdf', 'docx', 'xlsx']::text[];

alter table public.bot_settings
drop constraint if exists bot_settings_allowed_document_formats_check;

alter table public.bot_settings
add constraint bot_settings_allowed_document_formats_check
check (
  cardinality(allowed_document_formats) > 0
  and allowed_document_formats <@ array['pdf', 'docx', 'xlsx']::text[]
);
