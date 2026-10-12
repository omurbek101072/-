-- =====================================================================
-- 002: Админдерди сайттын ичинен башкаруу
-- schema.sql'дан кийин иштетиңиз. Кайра иштетсе да зыяны жок.
-- =====================================================================

-- Админ болуу үчүн email ЫРАСТАЛГАН болушу керек.
-- (Болбосо бирөө админдин email'и менен катталып, ырастабай туруп кирип алышы мүмкүн.)
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from auth.users u
    join public.admins a on lower(a.email) = lower(u.email)
    where u.id = auth.uid()
      and u.email_confirmed_at is not null
  );
$$;

-- Админдердин тизмеси: ким катталган, ким али каттала элек
create or replace function public.admin_list()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Уруксат жок' using errcode = '42501';
  end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'email', a.email,
      'addedAt', to_char(a.created_at at time zone 'Asia/Bishkek', 'YYYY-MM-DD HH24:MI'),
      'registered', u.id is not null,
      'confirmed', u.email_confirmed_at is not null,
      'lastSignIn', to_char(u.last_sign_in_at at time zone 'Asia/Bishkek', 'YYYY-MM-DD HH24:MI')
    ) order by a.created_at)
    from public.admins a
    left join auth.users u on lower(u.email) = lower(a.email)
  ), '[]'::jsonb);
end;
$$;

-- Жаңы админ кошуу (email боюнча). Ал адам ошол email менен катталып кирет.
create or replace function public.admin_add(p_email text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := lower(trim(p_email));
begin
  if not public.is_admin() then
    raise exception 'Уруксат жок' using errcode = '42501';
  end if;
  if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'Email туура эмес жазылды' using errcode = '22023';
  end if;
  if exists (select 1 from public.admins where lower(email) = v_email) then
    raise exception 'Бул email мурунтан эле админ' using errcode = '22023';
  end if;
  insert into public.admins (email) values (v_email);
end;
$$;

-- Админди алып салуу. Өзүңүздү жана акыркы админди өчүрүүгө болбойт.
create or replace function public.admin_remove(p_email text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := lower(trim(p_email));
begin
  if not public.is_admin() then
    raise exception 'Уруксат жок' using errcode = '42501';
  end if;
  if v_email = lower(coalesce(auth.jwt() ->> 'email', '')) then
    raise exception 'Өзүңүздү админдиктен алып сала албайсыз' using errcode = '22023';
  end if;
  if (select count(*) from public.admins) <= 1 then
    raise exception 'Акыркы админди өчүрүүгө болбойт' using errcode = '22023';
  end if;
  delete from public.admins where lower(email) = v_email;
  if not found then
    raise exception 'Мындай админ табылган жок' using errcode = '22023';
  end if;
end;
$$;

revoke all on function public.admin_list() from public;
revoke all on function public.admin_add(text) from public;
revoke all on function public.admin_remove(text) from public;
grant execute on function public.admin_list() to authenticated;
grant execute on function public.admin_add(text) to authenticated;
grant execute on function public.admin_remove(text) to authenticated;

-- admins таблицасына түз жазууну жабабыз: өзгөртүү жогорудагы функциялар аркылуу гана
revoke insert, update, delete on public.admins from authenticated;
