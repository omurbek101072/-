-- =====================================================================
-- 005: Кардарлардын пикирлери.
-- Тургун сайттан пикир калтырат → админ текшерип «Жарыялоо» баскандан
-- кийин гана сайтта көрүнөт. Кайра иштетсе да зыяны жок.
-- =====================================================================

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 60),
  village text not null default '' check (char_length(village) <= 60),
  rating int not null check (rating between 1 and 5),
  text text not null check (char_length(text) between 10 and 1000),
  approved boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.reviews enable row level security;

-- Эл жарыяланган пикирлерди гана көрөт, админ баарын көрөт
drop policy if exists reviews_read on public.reviews;
create policy reviews_read on public.reviews
  for select using (approved or public.is_admin());

-- Жарыялоо, оңдоо, өчүрүү — админ гана
drop policy if exists reviews_admin_update on public.reviews;
create policy reviews_admin_update on public.reviews
  for update using (public.is_admin()) with check (public.is_admin());
drop policy if exists reviews_admin_delete on public.reviews;
create policy reviews_admin_delete on public.reviews
  for delete using (public.is_admin());
drop policy if exists reviews_admin_insert on public.reviews;
create policy reviews_admin_insert on public.reviews
  for insert with check (public.is_admin());

grant select on public.reviews to anon, authenticated;
grant insert, update, delete on public.reviews to authenticated;

-- Тургун пикирди ушул функция аркылуу гана жөнөтөт (дайыма текшерилбеген абалда)
create or replace function public.submit_review(p_name text, p_village text, p_rating int, p_text text)
returns json
language plpgsql
security definer
set search_path = public
as $$
begin
  p_name := btrim(coalesce(p_name, ''));
  p_village := btrim(coalesce(p_village, ''));
  p_text := btrim(coalesce(p_text, ''));
  if char_length(p_name) < 2 or char_length(p_name) > 60 then
    raise exception 'Атыңызды жазыңыз (2–60 белги).';
  end if;
  if char_length(p_village) > 60 then
    raise exception 'Айылдын аталышы өтө узун.';
  end if;
  if p_rating is null or p_rating < 1 or p_rating > 5 then
    raise exception 'Баа 1ден 5ке чейин болушу керек.';
  end if;
  if char_length(p_text) < 10 or char_length(p_text) > 1000 then
    raise exception 'Пикириңизди жазыңыз (10–1000 белги).';
  end if;
  -- Спамдан коргоо: текшерилбеген пикир өтө көп болсо кабыл албайбыз
  if (select count(*) from public.reviews where not approved and created_at > now() - interval '1 hour') >= 30 then
    raise exception 'Азыр пикир кабыл алынбай жатат, бир аздан кийин кайталаңыз.';
  end if;
  insert into public.reviews (name, village, rating, text) values (p_name, p_village, p_rating, p_text);
  return json_build_object('ok', true);
end;
$$;

revoke all on function public.submit_review(text, text, int, text) from public;
grant execute on function public.submit_review(text, text, int, text) to anon, authenticated;
