-- =====================================================================
-- 009: Кызмат боюнча операторлор жана карызкорлорго эскертүүлөр.
-- Оператордун кызматтары: water (таза суу), waste (таштанды),
-- pasture (жайыт), machinery (техника). Бош болсо — бардык кызматтар.
-- Ар бир оператор өзүнүн кызматынын балансын, көрсөткүчүн, төлөмүн жана
-- айлык эсептөөсүн гана өзгөртө алат. 008_roles.sql'ден кийин иштетилет.
-- Кайра иштетсе да зыяны жок.
-- =====================================================================

alter table public.admins add column if not exists services text[];

-- Учурдагы кызматкердин кызматтары (админ — баары)
create or replace function public.staff_services()
returns text[]
language sql
stable
security definer
set search_path = public
as $$
  select case
    when a.role = 'admin' or a.services is null or cardinality(a.services) = 0
      then array['water', 'waste', 'pasture', 'machinery']
    else a.services
  end
  from auth.users u
  join public.admins a on lower(a.email) = lower(u.email)
  where u.id = auth.uid() and u.email_confirmed_at is not null
  limit 1;
$$;

create or replace function public.has_service(p_service text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(p_service = any(public.staff_services()), false);
$$;

create or replace function public.my_staff()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select case when public.staff_role() is null then null
    else jsonb_build_object('role', public.staff_role(), 'services', to_jsonb(public.staff_services())) end;
$$;

-- Оператор башка кызматтын эсебин өзгөртө албайт (база деңгээлинде)
create or replace function public.guard_subscriber_services()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.staff_role() is distinct from 'operator' then
    return new;
  end if;
  if not public.has_service('water') and (
       new.water_balance is distinct from old.water_balance
    or new.water_last_meter_reading is distinct from old.water_last_meter_reading
    or new.water_tariff_per_m3 is distinct from old.water_tariff_per_m3) then
    raise exception 'Таза суу маалыматын өзгөртүүгө уруксатыңыз жок' using errcode = '42501';
  end if;
  if not public.has_service('waste') and (
       new.waste_balance is distinct from old.waste_balance
    or new.waste_family_members is distinct from old.waste_family_members
    or new.waste_tariff_per_person is distinct from old.waste_tariff_per_person) then
    raise exception 'Таштанды маалыматын өзгөртүүгө уруксатыңыз жок' using errcode = '42501';
  end if;
  if not public.has_service('pasture') and (
       new.pasture_balance is distinct from old.pasture_balance
    or new.livestock is distinct from old.livestock) then
    raise exception 'Жайыт маалыматын өзгөртүүгө уруксатыңыз жок' using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_guard_subscriber_services on public.subscribers;
create trigger trg_guard_subscriber_services
before update on public.subscribers
for each row execute function public.guard_subscriber_services();

-- ---------- Касса: оператор өз кызматынын төлөмүн гана ----------
create or replace function public.admin_add_payment(p_tx jsonb)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id text := p_tx ->> 'id';
  v_amount numeric := (p_tx ->> 'amount')::numeric;
  v_type text := p_tx ->> 'serviceType';
  v_acc text := p_tx ->> 'accountId';
begin
  if not public.is_staff() then
    raise exception 'Уруксат жок' using errcode = '42501';
  end if;
  if v_type in ('water', 'waste', 'pasture', 'machinery') and not public.has_service(v_type) then
    raise exception 'Бул кызматтын төлөмүн кабыл алууга уруксатыңыз жок' using errcode = '42501';
  end if;
  if v_amount is null or v_amount <= 0 then
    raise exception 'Сумма туура эмес' using errcode = '22023';
  end if;

  insert into public.transactions (id, data) values (v_id, p_tx);
  perform set_config('tz.audit_action', 'Төлөм кабыл алынды: ' || v_amount || ' сом (' || coalesce(v_type, '') || ')', true);

  update public.subscribers set
    water_balance = water_balance + case when v_type = 'water' then v_amount else 0 end,
    waste_balance = waste_balance + case when v_type = 'waste' then v_amount else 0 end,
    pasture_balance = pasture_balance + case when v_type = 'pasture' then v_amount else 0 end
  where id = v_acc and v_type in ('water', 'waste', 'pasture');

  if not found and v_acc is not null and v_acc <> '' then
    insert into public.audit_log (actor, action, account_id, details)
    values (public.current_actor(), 'Төлөм кабыл алынды: ' || v_amount || ' сом (' || coalesce(v_type, '') || ')', v_acc,
            jsonb_build_object('amount', v_amount, 'type', v_type));
  end if;
  perform set_config('tz.audit_action', '', true);
  return v_id;
end;
$$;

-- ---------- Водомер: суу кызматы гана ----------
create or replace function public.staff_meter_reading(p_account text, p_reading numeric)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sub public.subscribers;
  v_tariff numeric;
  v_amount numeric;
begin
  if not public.is_staff() or not public.has_service('water') then
    raise exception 'Уруксат жок' using errcode = '42501';
  end if;
  select * into v_sub from public.subscribers where id = trim(p_account) for update;
  if not found then
    raise exception 'Мындай лицевой эсеп табылган жок' using errcode = '22023';
  end if;
  if p_reading is null or p_reading < v_sub.water_last_meter_reading then
    raise exception 'Жаңы көрсөткүч мурункудан (%) кичине болбошу керек', v_sub.water_last_meter_reading using errcode = '22023';
  end if;
  if p_reading - v_sub.water_last_meter_reading > 5000 then
    raise exception 'Сарпталган суу өтө көп. Көрсөткүчтү текшериңиз' using errcode = '22023';
  end if;

  select coalesce((value ->> 'waterPerM3')::numeric, v_sub.water_tariff_per_m3)
    into v_tariff from public.site_config where key = 'tariffs';
  v_tariff := coalesce(v_tariff, v_sub.water_tariff_per_m3);
  v_amount := round((p_reading - v_sub.water_last_meter_reading) * v_tariff);

  insert into public.meter_readings (account_id, prev_reading, new_reading, amount, phone)
  values (v_sub.id, v_sub.water_last_meter_reading, p_reading, v_amount, 'кызматкер: ' || public.current_actor());

  perform set_config('tz.audit_action', 'Водомер көрсөткүчү: ' || v_sub.water_last_meter_reading || ' → ' || p_reading || ' м³, ' || v_amount || ' сом', true);
  update public.subscribers
  set water_last_meter_reading = p_reading,
      water_balance = water_balance - v_amount
  where id = v_sub.id;
  perform set_config('tz.audit_action', '', true);

  return jsonb_build_object('prev', v_sub.water_last_meter_reading, 'new', p_reading,
                            'consumed', p_reading - v_sub.water_last_meter_reading, 'amount', v_amount);
end;
$$;

-- ---------- Айлык эсептөө: өз кызматы гана ----------
create or replace function public.staff_monthly_accrual(p_period text, p_waste boolean, p_pasture boolean)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_t jsonb;
  v_count int := 0;
  v_waste numeric := 0;
  v_pasture numeric := 0;
  v_out jsonb := '{}'::jsonb;
begin
  if not public.is_staff() then
    raise exception 'Уруксат жок' using errcode = '42501';
  end if;
  if coalesce(p_waste, false) and not public.has_service('waste') then
    raise exception 'Таштанды акысын эсептөөгө уруксатыңыз жок' using errcode = '42501';
  end if;
  if coalesce(p_pasture, false) and not public.has_service('pasture') then
    raise exception 'Жайыт акысын эсептөөгө уруксатыңыз жок' using errcode = '42501';
  end if;
  if p_period !~ '^\d{4}-(0[1-9]|1[0-2])$' then
    raise exception 'Айды туура тандаңыз' using errcode = '22023';
  end if;
  if not coalesce(p_waste, false) and not coalesce(p_pasture, false) then
    raise exception 'Эмнени эсептөө керек экенин тандаңыз' using errcode = '22023';
  end if;
  select value into v_t from public.site_config where key = 'tariffs';
  v_t := coalesce(v_t, '{}'::jsonb);

  if coalesce(p_waste, false) then
    if exists (select 1 from public.accruals where period = p_period and kind = 'waste') then
      raise exception 'Таштанды акысы % айы үчүн мурун эле эсептелген', p_period using errcode = '22023';
    end if;
    perform set_config('tz.audit_action', 'Айлык эсептөө: таштанды ' || p_period, true);
    with upd as (
      update public.subscribers
      set waste_balance = waste_balance
        - waste_family_members * coalesce((v_t ->> 'wastePerPerson')::numeric, waste_tariff_per_person)
      where waste_family_members > 0
      returning waste_family_members * coalesce((v_t ->> 'wastePerPerson')::numeric, waste_tariff_per_person) as amt
    )
    select count(*), coalesce(sum(amt), 0) into v_count, v_waste from upd;
    insert into public.accruals (period, kind, actor, accounts, total)
    values (p_period, 'waste', public.current_actor(), v_count, v_waste);
    v_out := v_out || jsonb_build_object('waste', jsonb_build_object('accounts', v_count, 'total', v_waste));
  end if;

  if coalesce(p_pasture, false) then
    if exists (select 1 from public.accruals where period = p_period and kind = 'pasture') then
      raise exception 'Жайыт акысы % айы үчүн мурун эле эсептелген', p_period using errcode = '22023';
    end if;
    perform set_config('tz.audit_action', 'Айлык эсептөө: жайыт ' || p_period, true);
    with calc as (
      select id,
        coalesce((livestock ->> 'cattle')::numeric, 0) * coalesce((v_t ->> 'pastureCattleMonth')::numeric, 0)
        + coalesce((livestock ->> 'horses')::numeric, 0) * coalesce((v_t ->> 'pastureHorseMonth')::numeric, 0)
        + coalesce((livestock ->> 'sheepGoats')::numeric, 0) * coalesce((v_t ->> 'pastureSheepMonth')::numeric, 0)
        + coalesce((livestock ->> 'yaks')::numeric, 0) * coalesce((v_t ->> 'pastureYakMonth')::numeric, 0) as amt
      from public.subscribers
    ), upd as (
      update public.subscribers s
      set pasture_balance = s.pasture_balance - c.amt
      from calc c
      where s.id = c.id and c.amt > 0
      returning c.amt
    )
    select count(*), coalesce(sum(amt), 0) into v_count, v_pasture from upd;
    insert into public.accruals (period, kind, actor, accounts, total)
    values (p_period, 'pasture', public.current_actor(), v_count, v_pasture);
    v_out := v_out || jsonb_build_object('pasture', jsonb_build_object('accounts', v_count, 'total', v_pasture));
  end if;

  perform set_config('tz.audit_action', '', true);
  return v_out;
end;
$$;

-- ---------- Админдерди башкаруу: кызматтары менен ----------
create or replace function public.clean_services(p_services text[])
returns text[]
language sql
immutable
as $$
  select case when p_services is null then null else nullif(array(
    select distinct s from unnest(p_services) s where s in ('water', 'waste', 'pasture', 'machinery') order by s
  ), '{}'::text[]) end;
$$;

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
      'role', a.role,
      'services', to_jsonb(a.services),
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

drop function if exists public.admin_add(text, text);
create or replace function public.admin_add(p_email text, p_role text default 'admin', p_services text[] default null)
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
  if coalesce(p_role, 'admin') not in ('admin', 'operator') then
    raise exception 'Ролу туура эмес' using errcode = '22023';
  end if;
  if exists (select 1 from public.admins where lower(email) = v_email) then
    raise exception 'Бул email мурунтан эле тизмеде бар (ролун тизмеден өзгөртүңүз)' using errcode = '22023';
  end if;
  insert into public.admins (email, role, services)
  values (v_email, coalesce(p_role, 'admin'), public.clean_services(p_services));
  insert into public.audit_log (actor, action, details)
  values (public.current_actor(), 'Кызматкер кошулду',
          jsonb_build_object('email', v_email, 'role', coalesce(p_role, 'admin'), 'services', to_jsonb(public.clean_services(p_services))));
end;
$$;

create or replace function public.admin_set_services(p_email text, p_services text[])
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
  update public.admins set services = public.clean_services(p_services) where lower(email) = v_email;
  if not found then
    raise exception 'Мындай кызматкер табылган жок' using errcode = '22023';
  end if;
  insert into public.audit_log (actor, action, details)
  values (public.current_actor(), 'Кызматтары өзгөрдү',
          jsonb_build_object('email', v_email, 'services', to_jsonb(public.clean_services(p_services))));
end;
$$;

-- ---------- Карызкорлорго эскертүүлөр ----------
create table if not exists public.debt_notices (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  actor text not null default '',
  account_id text not null,
  service text not null check (service in ('water', 'waste', 'pasture')),
  note text not null default ''
);
create index if not exists debt_notices_account_idx on public.debt_notices (account_id, at desc);
alter table public.debt_notices enable row level security;
drop policy if exists debt_notices_staff_read on public.debt_notices;
create policy debt_notices_staff_read on public.debt_notices for select using (public.is_staff());
grant select on public.debt_notices to authenticated;

create or replace function public.staff_debt_notice(p_account text, p_service text, p_note text default '')
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_staff() or not public.has_service(p_service) then
    raise exception 'Уруксат жок' using errcode = '42501';
  end if;
  if not exists (select 1 from public.subscribers where id = trim(p_account)) then
    raise exception 'Мындай лицевой эсеп табылган жок' using errcode = '22023';
  end if;
  insert into public.debt_notices (actor, account_id, service, note)
  values (public.current_actor(), trim(p_account), p_service, left(coalesce(p_note, ''), 300));
  insert into public.audit_log (actor, action, account_id, details)
  values (public.current_actor(), 'Карыз боюнча эскертүү берилди', trim(p_account),
          jsonb_build_object('service', p_service, 'note', left(coalesce(p_note, ''), 300)));
end;
$$;

-- ---------- Уруксаттар ----------
revoke all on function public.staff_services() from public;
revoke all on function public.has_service(text) from public;
revoke all on function public.my_staff() from public;
revoke all on function public.admin_add(text, text, text[]) from public;
revoke all on function public.admin_set_services(text, text[]) from public;
revoke all on function public.staff_debt_notice(text, text, text) from public;
grant execute on function public.staff_services() to anon, authenticated;
grant execute on function public.has_service(text) to anon, authenticated;
grant execute on function public.my_staff() to anon, authenticated;
grant execute on function public.admin_add(text, text, text[]) to authenticated;
grant execute on function public.admin_set_services(text, text[]) to authenticated;
grant execute on function public.staff_debt_notice(text, text, text) to authenticated;
grant execute on function public.admin_add_payment(jsonb) to authenticated;
grant execute on function public.staff_meter_reading(text, numeric) to authenticated;
grant execute on function public.staff_monthly_accrual(text, boolean, boolean) to authenticated;
grant execute on function public.admin_list() to authenticated;
