-- =====================================================================
-- 010: Ар бир абоненттин айлык эсептөөлөрүнүн тарыхы.
-- «Менин эсебим» бетинде «октябрь — таштанды 140 сом (4 адам × 35 сом)»
-- деп көрүнөт. 009_services.sql'ден кийин иштетилет. Кайра иштетсе да зыяны жок.
-- =====================================================================

create table if not exists public.charge_items (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  period text not null,
  kind text not null check (kind in ('waste', 'pasture')),
  account_id text not null,
  amount numeric not null,
  detail text not null default ''
);
create index if not exists charge_items_account_idx on public.charge_items (account_id, created_at desc);
create unique index if not exists charge_items_once on public.charge_items (period, kind, account_id);
alter table public.charge_items enable row level security;
drop policy if exists charge_items_staff_read on public.charge_items;
create policy charge_items_staff_read on public.charge_items for select using (public.is_staff());
grant select on public.charge_items to authenticated;

-- Мурун жүргүзүлгөн эсептөөлөрдү журналдан калыбына келтиребиз
insert into public.charge_items (created_at, period, kind, account_id, amount, detail)
select a.at,
       substring(a.action from '(\d{4}-\d{2})$'),
       case when a.action like '%таштанды%' then 'waste' else 'pasture' end,
       a.account_id,
       case when a.action like '%таштанды%'
         then (a.details -> 'waste_balance' ->> 'мурун')::numeric - (a.details -> 'waste_balance' ->> 'эми')::numeric
         else (a.details -> 'pasture_balance' ->> 'мурун')::numeric - (a.details -> 'pasture_balance' ->> 'эми')::numeric
       end,
       ''
from public.audit_log a
where a.account_id is not null
  and a.action ~ '^Айлык эсептөө: (таштанды|жайыт) \d{4}-\d{2}$'
  and (a.details ? 'waste_balance' or a.details ? 'pasture_balance')
on conflict do nothing;

-- Айлык эсептөө: ар бир абонентке эмне үчүн канча жазылганы сакталат
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
  v_wt numeric;
  v_pc numeric; v_ph numeric; v_ps numeric; v_py numeric;
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
    v_wt := (v_t ->> 'wastePerPerson')::numeric;
    with upd as (
      update public.subscribers
      set waste_balance = waste_balance - waste_family_members * coalesce(v_wt, waste_tariff_per_person)
      where waste_family_members > 0
      returning id, waste_family_members as fam, coalesce(v_wt, waste_tariff_per_person) as tariff,
                waste_family_members * coalesce(v_wt, waste_tariff_per_person) as amt
    ), ins as (
      insert into public.charge_items (period, kind, account_id, amount, detail)
      select p_period, 'waste', id, amt, fam || ' адам × ' || tariff || ' сом' from upd
      on conflict do nothing
      returning 1
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
    v_pc := coalesce((v_t ->> 'pastureCattleMonth')::numeric, 0);
    v_ph := coalesce((v_t ->> 'pastureHorseMonth')::numeric, 0);
    v_ps := coalesce((v_t ->> 'pastureSheepMonth')::numeric, 0);
    v_py := coalesce((v_t ->> 'pastureYakMonth')::numeric, 0);
    with calc as (
      select id,
        coalesce((livestock ->> 'cattle')::numeric, 0) as c,
        coalesce((livestock ->> 'horses')::numeric, 0) as h,
        coalesce((livestock ->> 'sheepGoats')::numeric, 0) as s,
        coalesce((livestock ->> 'yaks')::numeric, 0) as y
      from public.subscribers
    ), priced as (
      select id, c * v_pc + h * v_ph + s * v_ps + y * v_py as amt,
        concat_ws(' + ',
          case when c > 0 then c || ' уй × ' || v_pc || ' сом' end,
          case when h > 0 then h || ' жылкы × ' || v_ph || ' сом' end,
          case when s > 0 then s || ' кой-эчки × ' || v_ps || ' сом' end,
          case when y > 0 then y || ' топоз × ' || v_py || ' сом' end) as detail
      from calc
    ), upd as (
      update public.subscribers sb
      set pasture_balance = sb.pasture_balance - p.amt
      from priced p
      where sb.id = p.id and p.amt > 0
      returning sb.id, p.amt, p.detail
    ), ins as (
      insert into public.charge_items (period, kind, account_id, amount, detail)
      select p_period, 'pasture', id, amt, detail from upd
      on conflict do nothing
      returning 1
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

-- Тургундун «Менин эсебим» бети: төлөмдөр, көрсөткүчтөр жана эсептөөлөр
create or replace function public.account_history(p_id text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  with acc as (
    select id from public.subscribers where id = trim(both from replace(p_id, '№', '')) limit 1
  )
  select case when not exists (select 1 from acc) then null else jsonb_build_object(
    'payments', coalesce((
      select jsonb_agg(p order by p_created desc)
      from (
        select t.created_at as p_created,
          jsonb_build_object(
            'id', t.id,
            'receiptNumber', t.data ->> 'receiptNumber',
            'timestamp', t.data ->> 'timestamp',
            'serviceType', t.data ->> 'serviceType',
            'serviceName', t.data ->> 'serviceName',
            'amount', (t.data ->> 'amount')::numeric,
            'paymentMethod', t.data ->> 'paymentMethod',
            'status', t.data ->> 'status',
            'accountId', t.data ->> 'accountId'
          ) as p
        from public.transactions t, acc
        where t.data ->> 'accountId' = acc.id
          and t.created_at > now() - interval '2 years'
        order by t.created_at desc
        limit 60
      ) x
    ), '[]'::jsonb),
    'readings', coalesce((
      select jsonb_agg(r order by r_created desc)
      from (
        select m.created_at as r_created,
          jsonb_build_object('date', m.created_at, 'prev', m.prev_reading, 'new', m.new_reading, 'amount', m.amount) as r
        from public.meter_readings m, acc
        where m.account_id = acc.id
        order by m.created_at desc
        limit 24
      ) y
    ), '[]'::jsonb),
    'charges', coalesce((
      select jsonb_agg(c order by c_created desc)
      from (
        select ci.created_at as c_created,
          jsonb_build_object('date', ci.created_at, 'period', ci.period, 'kind', ci.kind, 'amount', ci.amount, 'detail', ci.detail) as c
        from public.charge_items ci, acc
        where ci.account_id = acc.id
        order by ci.created_at desc
        limit 48
      ) z
    ), '[]'::jsonb)
  ) end;
$$;

revoke all on function public.account_history(text) from public;
grant execute on function public.account_history(text) to anon, authenticated;
grant execute on function public.staff_monthly_accrual(text, boolean, boolean) to authenticated;
