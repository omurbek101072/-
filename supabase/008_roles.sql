-- =====================================================================
-- 008: Ролдор (Админ / Оператор), айлык эсептөө жана өзгөртүүлөр журналы.
-- Оператор: абоненттерди кошот жана өзгөртөт, водомер көрсөткүчүн,
-- кассадагы төлөмдү киргизет, айлык эсептөө жүргүзөт. Сайттын тексттерине,
-- тарифтерге, админдерге тийе албайт. Кайра иштетсе да зыяны жок.
-- =====================================================================

-- ---------- Ролу ----------
alter table public.admins add column if not exists role text not null default 'admin';
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'admins_role_check') then
    alter table public.admins add constraint admins_role_check check (role in ('admin', 'operator'));
  end if;
end $$;

-- Учурдагы колдонуучунун ролу (email ырасталган болушу керек), болбосо null
create or replace function public.staff_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select a.role
  from auth.users u
  join public.admins a on lower(a.email) = lower(u.email)
  where u.id = auth.uid()
    and u.email_confirmed_at is not null
  limit 1;
$$;

-- Админ = толук укук (мурунку бардык эрежелер ушуну колдонот)
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.staff_role() = 'admin', false);
$$;

-- Кызматкер = админ же оператор
create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.staff_role() is not null;
$$;

create or replace function public.my_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select public.staff_role();
$$;

-- ---------- Абоненттер: оператор окуйт, кошот, өзгөртөт; өчүрөт админ гана ----------
drop policy if exists subscribers_admin_all on public.subscribers;
drop policy if exists subscribers_staff_select on public.subscribers;
drop policy if exists subscribers_staff_insert on public.subscribers;
drop policy if exists subscribers_staff_update on public.subscribers;
drop policy if exists subscribers_admin_delete on public.subscribers;
create policy subscribers_staff_select on public.subscribers for select using (public.is_staff());
create policy subscribers_staff_insert on public.subscribers for insert with check (public.is_staff());
create policy subscribers_staff_update on public.subscribers for update using (public.is_staff()) with check (public.is_staff());
create policy subscribers_admin_delete on public.subscribers for delete using (public.is_admin());

-- Төлөмдөр жана көрсөткүчтөр: оператор окуйт (жазуу функциялар аркылуу гана)
drop policy if exists tx_staff_select on public.transactions;
create policy tx_staff_select on public.transactions for select using (public.is_staff());
drop policy if exists readings_staff_select on public.meter_readings;
create policy readings_staff_select on public.meter_readings for select using (public.is_staff());

-- ---------- Өзгөртүүлөр журналы ----------
create table if not exists public.audit_log (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  actor text not null default '',
  action text not null,
  account_id text,
  details jsonb not null default '{}'::jsonb
);
alter table public.audit_log enable row level security;
drop policy if exists audit_admin_read on public.audit_log;
create policy audit_admin_read on public.audit_log for select using (public.is_admin());
grant select on public.audit_log to authenticated;

create or replace function public.current_actor()
returns text
language sql
stable
as $$
  select coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'email', 'система');
$$;

-- Абонент кошулса / өзгөрсө / өчсө — эмне өзгөргөнүн жазабыз
create or replace function public.audit_subscribers()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_changes jsonb := '{}'::jsonb;
  k text;
begin
  if tg_op = 'INSERT' then
    insert into public.audit_log (actor, action, account_id, details)
    values (public.current_actor(), 'Абонент кошулду', new.id, jsonb_build_object('full_name', new.full_name));
    return new;
  elsif tg_op = 'DELETE' then
    insert into public.audit_log (actor, action, account_id, details)
    values (public.current_actor(), 'Абонент өчүрүлдү', old.id, to_jsonb(old) - 'created_at');
    return old;
  end if;
  for k in select jsonb_object_keys(to_jsonb(new) - 'created_at') loop
    if (to_jsonb(old) -> k) is distinct from (to_jsonb(new) -> k) then
      v_changes := v_changes || jsonb_build_object(k, jsonb_build_object('мурун', to_jsonb(old) -> k, 'эми', to_jsonb(new) -> k));
    end if;
  end loop;
  if v_changes <> '{}'::jsonb then
    insert into public.audit_log (actor, action, account_id, details)
    values (public.current_actor(), coalesce(nullif(current_setting('tz.audit_action', true), ''), 'Абонент өзгөртүлдү'), new.id, v_changes);
  end if;
  return new;
end;
$$;

drop trigger if exists trg_audit_subscribers on public.subscribers;
create trigger trg_audit_subscribers
after insert or update or delete on public.subscribers
for each row execute function public.audit_subscribers();

-- ---------- Кассага төлөм: оператор да киргизе алат ----------
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
  if v_amount is null or v_amount <= 0 then
    raise exception 'Сумма туура эмес' using errcode = '22023';
  end if;

  insert into public.transactions (id, data) values (v_id, p_tx);
  perform set_config('tz.audit_action', 'Төлөм кабыл алынды: ' || v_amount || ' сом (' || coalesce(v_type, '') || ')', true);

  update public.subscribers set
    water_balance = water_balance + case when v_type = 'water' then v_amount else 0 end,
    waste_balance = waste_balance + case when v_type = 'waste' then v_amount else 0 end,
    pasture_balance = pasture_balance + case when v_type = 'pasture' then v_amount else 0 end
  where id = v_acc;

  if not found and v_acc is not null and v_acc <> '' then
    insert into public.audit_log (actor, action, account_id, details)
    values (public.current_actor(), 'Төлөм кабыл алынды (эсепсиз)', v_acc, jsonb_build_object('amount', v_amount, 'type', v_type));
  end if;
  perform set_config('tz.audit_action', '', true);
  return v_id;
end;
$$;

-- ---------- Кызматкер водомер көрсөткүчүн киргизет ----------
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
  if not public.is_staff() then
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

-- ---------- Айлык эсептөө (таштанды жана жайыт) ----------
create table if not exists public.accruals (
  period text not null,          -- '2026-10'
  kind text not null,            -- 'waste' | 'pasture'
  created_at timestamptz not null default now(),
  actor text not null default '',
  accounts int not null default 0,
  total numeric not null default 0,
  primary key (period, kind)
);
alter table public.accruals enable row level security;
drop policy if exists accruals_staff_read on public.accruals;
create policy accruals_staff_read on public.accruals for select using (public.is_staff());
grant select on public.accruals to authenticated;

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

-- ---------- Админдерди башкаруу: ролу менен ----------
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

drop function if exists public.admin_add(text);
create or replace function public.admin_add(p_email text, p_role text default 'admin')
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
  insert into public.admins (email, role) values (v_email, coalesce(p_role, 'admin'));
  insert into public.audit_log (actor, action, details)
  values (public.current_actor(), 'Кызматкер кошулду', jsonb_build_object('email', v_email, 'role', coalesce(p_role, 'admin')));
end;
$$;

create or replace function public.admin_set_role(p_email text, p_role text)
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
  if p_role not in ('admin', 'operator') then
    raise exception 'Ролу туура эмес' using errcode = '22023';
  end if;
  if p_role = 'operator' and v_email = lower(public.current_actor()) then
    raise exception 'Өзүңүздүн админ укугуңузду алып сала албайсыз' using errcode = '22023';
  end if;
  if p_role = 'operator' and (select count(*) from public.admins where role = 'admin' and lower(email) <> v_email) = 0 then
    raise exception 'Жок дегенде бир админ калышы керек' using errcode = '22023';
  end if;
  update public.admins set role = p_role where lower(email) = v_email;
  insert into public.audit_log (actor, action, details)
  values (public.current_actor(), 'Ролу өзгөрдү', jsonb_build_object('email', v_email, 'role', p_role));
end;
$$;

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
    raise exception 'Өзүңүздү тизмеден алып сала албайсыз' using errcode = '22023';
  end if;
  delete from public.admins where lower(email) = v_email;
  if not found then
    raise exception 'Мындай кызматкер табылган жок' using errcode = '22023';
  end if;
  insert into public.audit_log (actor, action, details)
  values (public.current_actor(), 'Кызматкер алынды', jsonb_build_object('email', v_email));
end;
$$;

-- ---------- Уруксаттар ----------
revoke all on function public.staff_role() from public;
revoke all on function public.is_staff() from public;
revoke all on function public.my_role() from public;
revoke all on function public.staff_meter_reading(text, numeric) from public;
revoke all on function public.staff_monthly_accrual(text, boolean, boolean) from public;
revoke all on function public.admin_add(text, text) from public;
revoke all on function public.admin_set_role(text, text) from public;
grant execute on function public.staff_role() to anon, authenticated;
grant execute on function public.is_staff() to anon, authenticated;
grant execute on function public.my_role() to anon, authenticated;
grant execute on function public.staff_meter_reading(text, numeric) to authenticated;
grant execute on function public.staff_monthly_accrual(text, boolean, boolean) to authenticated;
grant execute on function public.admin_add(text, text) to authenticated;
grant execute on function public.admin_set_role(text, text) to authenticated;
grant execute on function public.admin_add_payment(jsonb) to authenticated;
grant execute on function public.admin_list() to authenticated;
grant execute on function public.admin_remove(text) to authenticated;
