-- =====================================================================
-- «Тазалык» порталынын маалымат базасы (Supabase / PostgreSQL)
--
-- Колдонуу: Supabase → SQL Editor → New query → бул файлды толугу менен
-- көчүрүп салып, "Run" басыңыз. Кайра иштетсе да зыяны жок (idempotent).
--
-- Негизги эреже:
--   * Эл (anon) таблицаларды түз окуй/жаза албайт. Арыз, заказ, водомер
--     көрсөткүчү жана эсеп текшерүү атайын функциялар (RPC) аркылуу гана.
--   * Админдер — admins таблицасындагы email менен кирген колдонуучулар.
-- =====================================================================

-- ---------- Админдер ----------
create table if not exists public.admins (
  email text primary key,
  created_at timestamptz not null default now()
);
alter table public.admins enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admins
    where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

drop policy if exists admins_self_read on public.admins;
create policy admins_self_read on public.admins
  for select using (public.is_admin());

-- ---------- Сайттын жөндөөлөрү (тексттер, тарифтер) ----------
create table if not exists public.site_config (
  key text primary key,            -- 'site_settings' | 'tariffs'
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.site_config enable row level security;
drop policy if exists site_config_public_read on public.site_config;
create policy site_config_public_read on public.site_config for select using (true);
drop policy if exists site_config_admin_write on public.site_config;
create policy site_config_admin_write on public.site_config
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------- Техника каталогу ----------
create table if not exists public.machinery (
  id text primary key,
  data jsonb not null,
  sort int not null default 0
);
alter table public.machinery enable row level security;
drop policy if exists machinery_public_read on public.machinery;
create policy machinery_public_read on public.machinery for select using (true);
drop policy if exists machinery_admin_write on public.machinery;
create policy machinery_admin_write on public.machinery
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------- Жайыт зоналары ----------
create table if not exists public.pasture_zones (
  id text primary key,
  data jsonb not null,
  sort int not null default 0
);
alter table public.pasture_zones enable row level security;
drop policy if exists pasture_public_read on public.pasture_zones;
create policy pasture_public_read on public.pasture_zones for select using (true);
drop policy if exists pasture_admin_write on public.pasture_zones;
create policy pasture_admin_write on public.pasture_zones
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------- Абоненттер (жеке маалымат — админге гана) ----------
create table if not exists public.subscribers (
  id text primary key,
  full_name text not null,
  address text not null default '',
  phone text not null default '',
  water_balance numeric not null default 0,
  water_last_meter_reading numeric not null default 0,
  water_tariff_per_m3 numeric not null default 18.5,
  waste_balance numeric not null default 0,
  waste_family_members int not null default 1,
  waste_tariff_per_person numeric not null default 35,
  pasture_balance numeric not null default 0,
  livestock jsonb not null default '{"cattle":0,"horses":0,"sheepGoats":0,"yaks":0}'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.subscribers enable row level security;
drop policy if exists subscribers_admin_all on public.subscribers;
create policy subscribers_admin_all on public.subscribers
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------- Тургундардын арыздары ----------
create table if not exists public.citizen_tickets (
  id text primary key,
  data jsonb not null,
  phone text not null default '',
  created_at timestamptz not null default now()
);
alter table public.citizen_tickets enable row level security;
drop policy if exists tickets_admin_all on public.citizen_tickets;
create policy tickets_admin_all on public.citizen_tickets
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------- Техника заказдары ----------
create table if not exists public.machinery_orders (
  id text primary key,
  data jsonb not null,
  phone text not null default '',
  created_at timestamptz not null default now()
);
alter table public.machinery_orders enable row level security;
drop policy if exists orders_admin_all on public.machinery_orders;
create policy orders_admin_all on public.machinery_orders
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------- Төлөмдөр (касса/банк аркылуу админ киргизет) ----------
create table if not exists public.transactions (
  id text primary key,
  data jsonb not null,
  created_at timestamptz not null default now()
);
alter table public.transactions enable row level security;
drop policy if exists tx_admin_all on public.transactions;
create policy tx_admin_all on public.transactions
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------- Водомер көрсөткүчтөрүнүн журналы ----------
create table if not exists public.meter_readings (
  id bigint generated always as identity primary key,
  account_id text not null references public.subscribers(id) on delete cascade,
  prev_reading numeric not null,
  new_reading numeric not null,
  amount numeric not null,
  phone text not null default '',
  created_at timestamptz not null default now()
);
alter table public.meter_readings enable row level security;
drop policy if exists readings_admin_all on public.meter_readings;
create policy readings_admin_all on public.meter_readings
  for all using (public.is_admin()) with check (public.is_admin());

-- =====================================================================
-- Жардамчы функциялар
-- =====================================================================

-- Окула турган, кайталанбаган номер: ТЗЛ-261011-4821
create or replace function public.make_public_id(p_prefix text)
returns text
language sql
volatile
as $$
  select p_prefix || '-' || to_char(now() at time zone 'Asia/Bishkek', 'YYMMDD')
         || '-' || lpad((floor(random() * 10000))::int::text, 4, '0');
$$;

create or replace function public.local_ts()
returns text
language sql
stable
as $$
  select to_char(now() at time zone 'Asia/Bishkek', 'YYYY-MM-DD HH24:MI');
$$;

-- Телефонду текшерүү: +996XXXXXXXXX же 0XXXXXXXXX
create or replace function public.valid_kg_phone(p text)
returns boolean
language sql
immutable
as $$
  select case
    when regexp_replace(coalesce(p, ''), '\D', '', 'g') like '996%'
      then length(regexp_replace(p, '\D', '', 'g')) = 12
    when regexp_replace(coalesce(p, ''), '\D', '', 'g') like '0%'
      then length(regexp_replace(p, '\D', '', 'g')) = 10
    else length(regexp_replace(coalesce(p, ''), '\D', '', 'g')) = 9
  end;
$$;

create or replace function public.mask_name(p text)
returns text
language sql
immutable
as $$
  select coalesce(
    (select string_agg(case when i = 1 then w else left(w, 1) || '.' end, ' ' order by i)
     from unnest(regexp_split_to_array(trim(coalesce(p, '')), '\s+')) with ordinality as t(w, i)
     where w <> ''),
    '');
$$;

-- =====================================================================
-- Эл үчүн функциялар (RPC)
-- =====================================================================

-- 1. Арыз калтыруу
create or replace function public.create_ticket(
  p_category text, p_name text, p_phone text, p_address text,
  p_description text, p_photo text default null
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id text;
  v_recent int;
begin
  if not public.valid_kg_phone(p_phone) then
    raise exception 'Телефон номери туура эмес' using errcode = '22023';
  end if;
  if coalesce(trim(p_address), '') = '' or coalesce(trim(p_description), '') = '' then
    raise exception 'Дарек жана баяндама милдеттүү' using errcode = '22023';
  end if;
  if length(p_description) > 2000 or length(p_address) > 300 or length(coalesce(p_name, '')) > 120 then
    raise exception 'Текст өтө узун' using errcode = '22023';
  end if;
  if p_photo is not null and (length(p_photo) > 1500000 or p_photo not like 'data:image/%') then
    raise exception 'Сүрөт туура эмес же өтө чоң' using errcode = '22023';
  end if;

  -- Спамдан коргоо: бир номерден саатына 5 арыздан ашпайт
  select count(*) into v_recent from public.citizen_tickets
  where phone = regexp_replace(p_phone, '\D', '', 'g')
    and created_at > now() - interval '1 hour';
  if v_recent >= 5 then
    raise exception 'Өтө көп арыз. Бир сааттан кийин кайра аракет кылыңыз.' using errcode = '22023';
  end if;

  loop
    v_id := public.make_public_id(case when p_category like 'Ири таштанды%' then 'ТШ' else 'ТЗЛ' end);
    exit when not exists (select 1 from public.citizen_tickets where id = v_id);
  end loop;

  insert into public.citizen_tickets (id, phone, data)
  values (
    v_id,
    regexp_replace(p_phone, '\D', '', 'g'),
    jsonb_strip_nulls(jsonb_build_object(
      'id', v_id,
      'category', left(coalesce(p_category, 'Кайрылуу'), 200),
      'name', coalesce(nullif(trim(p_name), ''), 'Айыл тургуну'),
      'phone', trim(p_phone),
      'address', trim(p_address),
      'description', trim(p_description),
      'status', 'Кабыл алынды',
      'date', public.local_ts(),
      'photo', p_photo
    ))
  );
  return v_id;
end;
$$;

-- 2. Арыздын абалын текшерүү (номери боюнча гана; телефон жана аты кайтарылбайт)
create or replace function public.get_ticket_status(p_id text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'id', id,
    'category', data ->> 'category',
    'address', data ->> 'address',
    'description', data ->> 'description',
    'status', data ->> 'status',
    'date', data ->> 'date',
    'assignedCrew', data ->> 'assignedCrew',
    'resolutionNotes', data ->> 'resolutionNotes'
  )
  from public.citizen_tickets
  where upper(id) = upper(trim(p_id))
  limit 1;
$$;

-- 3. Техника заказы
create or replace function public.create_machinery_order(p_order jsonb)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id text;
  v_machine jsonb;
  v_type text := p_order ->> 'orderType';
  v_units numeric := (p_order ->> 'units')::numeric;
  v_rate numeric;
  v_recent int;
begin
  if not public.valid_kg_phone(p_order ->> 'customerPhone') then
    raise exception 'Телефон номери туура эмес' using errcode = '22023';
  end if;
  if coalesce(trim(p_order ->> 'address'), '') = '' then
    raise exception 'Дарек милдеттүү' using errcode = '22023';
  end if;
  if v_type not in ('hours', 'shift', 'trips') or v_units is null or v_units < 1 or v_units > 1000 then
    raise exception 'Заказдын көлөмү туура эмес' using errcode = '22023';
  end if;

  select data into v_machine from public.machinery where id = p_order ->> 'machineId';
  if v_machine is null then
    raise exception 'Мындай техника жок' using errcode = '22023';
  end if;

  select count(*) into v_recent from public.machinery_orders
  where phone = regexp_replace(p_order ->> 'customerPhone', '\D', '', 'g')
    and created_at > now() - interval '1 hour';
  if v_recent >= 5 then
    raise exception 'Өтө көп заказ. Бир сааттан кийин кайра аракет кылыңыз.' using errcode = '22023';
  end if;

  -- Баа сервердин өзүндө эсептелет (браузерден келген суммага ишенбейбиз)
  v_rate := case v_type
    when 'shift' then (v_machine ->> 'shiftRate')::numeric
    when 'trips' then coalesce((v_machine ->> 'tripRate')::numeric, (v_machine ->> 'hourlyRate')::numeric)
    else (v_machine ->> 'hourlyRate')::numeric
  end;

  loop
    v_id := public.make_public_id('ORD');
    exit when not exists (select 1 from public.machinery_orders where id = v_id);
  end loop;

  insert into public.machinery_orders (id, phone, data)
  values (
    v_id,
    regexp_replace(p_order ->> 'customerPhone', '\D', '', 'g'),
    jsonb_build_object(
      'id', v_id,
      'machineId', p_order ->> 'machineId',
      'machineName', v_machine ->> 'name',
      'customerName', coalesce(nullif(trim(p_order ->> 'customerName'), ''), 'Айыл тургуну'),
      'customerPhone', trim(p_order ->> 'customerPhone'),
      'address', left(trim(p_order ->> 'address'), 300),
      'workDescription', left(coalesce(p_order ->> 'workDescription', ''), 1000),
      'orderDate', p_order ->> 'orderDate',
      'orderType', v_type,
      'units', v_units,
      'totalEstimate', v_rate * v_units,
      'status', 'жаңы',
      'paymentStatus', 'күтүлүүдө',
      'createdAt', public.local_ts()
    )
  );
  return v_id;
end;
$$;

-- 4. Лицевой эсепти текшерүү (аты, дареги, телефону жашырылат)
create or replace function public.lookup_subscriber(p_id text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'id', id,
    'fullName', public.mask_name(full_name),
    'address', regexp_replace(address, '\d+', '**', 'g'),
    'phone', case when length(regexp_replace(phone, '\D', '', 'g')) >= 2
                  then '***-**-' || right(regexp_replace(phone, '\D', '', 'g'), 2) else '' end,
    'waterBalance', water_balance,
    'waterLastMeterReading', water_last_meter_reading,
    'waterTariffPerM3', water_tariff_per_m3,
    'wasteBalance', waste_balance,
    'wasteFamilyMembers', waste_family_members,
    'wasteTariffPerPerson', waste_tariff_per_person,
    'pastureBalance', pasture_balance,
    'registeredLivestock', livestock
  )
  from public.subscribers
  where id = trim(both from replace(p_id, '№', ''))
  limit 1;
$$;

-- 5. Водомер көрсөткүчүн тапшыруу
create or replace function public.submit_meter_reading(p_account text, p_reading numeric, p_phone text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sub public.subscribers;
  v_tariff numeric;
  v_amount numeric;
  v_recent int;
begin
  if not public.valid_kg_phone(p_phone) then
    raise exception 'Телефон номери туура эмес' using errcode = '22023';
  end if;

  select * into v_sub from public.subscribers where id = trim(p_account) for update;
  if not found then
    raise exception 'Мындай лицевой эсеп табылган жок' using errcode = '22023';
  end if;
  if p_reading is null or p_reading <= v_sub.water_last_meter_reading then
    raise exception 'Жаңы көрсөткүч мурункудан чоң болушу керек' using errcode = '22023';
  end if;
  if p_reading - v_sub.water_last_meter_reading > 1000 then
    raise exception 'Сарпталган суу өтө көп. Көрсөткүчтү текшериңиз' using errcode = '22023';
  end if;

  select count(*) into v_recent from public.meter_readings
  where account_id = v_sub.id and created_at > now() - interval '1 day';
  if v_recent >= 3 then
    raise exception 'Бул эсеп боюнча бүгүн көрсөткүч тапшырылган. Ката болсо диспетчерге чалыңыз.' using errcode = '22023';
  end if;

  select coalesce((value ->> 'waterPerM3')::numeric, v_sub.water_tariff_per_m3)
    into v_tariff from public.site_config where key = 'tariffs';
  v_tariff := coalesce(v_tariff, v_sub.water_tariff_per_m3);
  v_amount := round((p_reading - v_sub.water_last_meter_reading) * v_tariff);

  insert into public.meter_readings (account_id, prev_reading, new_reading, amount, phone)
  values (v_sub.id, v_sub.water_last_meter_reading, p_reading, v_amount, trim(p_phone));

  update public.subscribers
  set water_last_meter_reading = p_reading,
      water_balance = water_balance - v_amount
  where id = v_sub.id;

  return jsonb_build_object(
    'prev', v_sub.water_last_meter_reading,
    'new', p_reading,
    'consumed', p_reading - v_sub.water_last_meter_reading,
    'amount', v_amount
  );
end;
$$;

-- 6. Акыркы төлөмдөр (ачык реестр, аты жашырылган, телефонсуз)
create or replace function public.recent_transactions()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(jsonb_agg(x order by created_at desc), '[]'::jsonb)
  from (
    select created_at,
      jsonb_build_object(
        'id', id,
        'receiptNumber', data ->> 'receiptNumber',
        'timestamp', data ->> 'timestamp',
        'payerName', public.mask_name(data ->> 'payerName'),
        'payerPhone', '',
        'accountId', '',
        'serviceType', data ->> 'serviceType',
        'serviceName', data ->> 'serviceName',
        'amount', (data ->> 'amount')::numeric,
        'paymentMethod', data ->> 'paymentMethod',
        'status', data ->> 'status',
        'details', ''
      ) as x
    from public.transactions
    order by created_at desc
    limit 10
  ) t;
$$;

-- =====================================================================
-- Админ үчүн: төлөм киргизүү (балансты бир транзакцияда жаңыртат)
-- =====================================================================
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
  if not public.is_admin() then
    raise exception 'Уруксат жок' using errcode = '42501';
  end if;
  if v_amount is null or v_amount <= 0 then
    raise exception 'Сумма туура эмес' using errcode = '22023';
  end if;

  insert into public.transactions (id, data) values (v_id, p_tx);

  update public.subscribers set
    water_balance = water_balance + case when v_type = 'water' then v_amount else 0 end,
    waste_balance = waste_balance + case when v_type = 'waste' then v_amount else 0 end,
    pasture_balance = pasture_balance + case when v_type = 'pasture' then v_amount else 0 end
  where id = v_acc;

  return v_id;
end;
$$;

-- ---------- Функцияларга уруксат ----------
revoke all on function public.create_ticket(text, text, text, text, text, text) from public;
revoke all on function public.get_ticket_status(text) from public;
revoke all on function public.create_machinery_order(jsonb) from public;
revoke all on function public.lookup_subscriber(text) from public;
revoke all on function public.submit_meter_reading(text, numeric, text) from public;
revoke all on function public.recent_transactions() from public;
revoke all on function public.admin_add_payment(jsonb) from public;

grant execute on function public.create_ticket(text, text, text, text, text, text) to anon, authenticated;
grant execute on function public.get_ticket_status(text) to anon, authenticated;
grant execute on function public.create_machinery_order(jsonb) to anon, authenticated;
grant execute on function public.lookup_subscriber(text) to anon, authenticated;
grant execute on function public.submit_meter_reading(text, numeric, text) to anon, authenticated;
grant execute on function public.recent_transactions() to anon, authenticated;
grant execute on function public.admin_add_payment(jsonb) to authenticated;
grant execute on function public.is_admin() to anon, authenticated;

grant usage on schema public to anon, authenticated;
grant select on public.site_config, public.machinery, public.pasture_zones to anon, authenticated;
grant select, insert, update, delete on
  public.site_config, public.machinery, public.pasture_zones, public.subscribers,
  public.citizen_tickets, public.machinery_orders, public.transactions,
  public.meter_readings, public.admins
  to authenticated;
