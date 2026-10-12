-- =====================================================================
-- 003: Сайттын мазмунун (жаңылыктар, документтер, отчеттор, графиктер,
-- сүрөттөр) админ панелинен өзгөртүү үчүн.
-- 002_admin_management.sql'дан кийин иштетиңиз. Кайра иштетсе да зыяны жок.
-- =====================================================================

-- Мазмун блоктору: ар бир ачкычта бир бөлүмдүн маалыматы (JSON)
create table if not exists public.content_blocks (
  key text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.content_blocks enable row level security;

drop policy if exists content_public_read on public.content_blocks;
create policy content_public_read on public.content_blocks for select using (true);

drop policy if exists content_admin_write on public.content_blocks;
create policy content_admin_write on public.content_blocks
  for all using (public.is_admin()) with check (public.is_admin());

grant select on public.content_blocks to anon, authenticated;
grant insert, update, delete on public.content_blocks to authenticated;

-- Техниканы кошуу/өчүрүү үчүн (окуу мурунтан ачык)
grant insert, update, delete on public.machinery to authenticated;

-- ---------- Сүрөттөр жана PDF файлдар үчүн сактагыч ----------
-- Баары окуй алат (сайтта көрүнүшү үчүн), админ гана жүктөйт/өчүрөт.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'media', 'media', true, 10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists media_admin_insert on storage.objects;
create policy media_admin_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'media' and public.is_admin());

drop policy if exists media_admin_update on storage.objects;
create policy media_admin_update on storage.objects
  for update to authenticated
  using (bucket_id = 'media' and public.is_admin())
  with check (bucket_id = 'media' and public.is_admin());

drop policy if exists media_admin_delete on storage.objects;
create policy media_admin_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'media' and public.is_admin());

drop policy if exists media_admin_select on storage.objects;
create policy media_admin_select on storage.objects
  for select to authenticated
  using (bucket_id = 'media' and public.is_admin());
