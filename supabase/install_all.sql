-- =====================================================================
-- «Тазалык» сайтын ЖАҢЫ Supabase долбооруна бир жолу орнотуу.
-- SQL Editor → New query → ушул файлды толук чаптап → Run.
-- Ичинде: таблицалар, коопсуздук эрежелери, ролдор, журнал, баштапкы тексттер
-- жана 5 ДЕМО абонент (ойдон чыгарылган). Бош долбоорго гана иштетиңиз.
-- =====================================================================

-- ---------- schema.sql ----------
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

-- ---------- 002_admin_management.sql ----------
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

-- ---------- 003_content.sql ----------
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

-- ---------- 005_reviews.sql ----------
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

-- ---------- 007_cabinet.sql ----------
-- =====================================================================
-- 007: Тургундун «Менин эсебим» (жеке кабинет) бети үчүн.
-- Эсеп номери боюнча төлөмдөр жана водомер көрсөткүчтөрү (аты-жөнү,
-- телефону КӨРСӨТҮЛБӨЙТ), техника заказынын абалы. Кайра иштетсе да зыяны жок.
-- =====================================================================

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
          jsonb_build_object(
            'date', m.created_at,
            'prev', m.prev_reading,
            'new', m.new_reading,
            'amount', m.amount
          ) as r
        from public.meter_readings m, acc
        where m.account_id = acc.id
        order by m.created_at desc
        limit 24
      ) y
    ), '[]'::jsonb)
  ) end;
$$;

create or replace function public.get_order_status(p_id text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'id', id,
    'machineName', data ->> 'machineName',
    'status', data ->> 'status',
    'orderDate', data ->> 'orderDate',
    'totalEstimate', (data ->> 'totalEstimate')::numeric,
    'paymentStatus', data ->> 'paymentStatus'
  )
  from public.machinery_orders
  where upper(id) = upper(trim(p_id))
  limit 1;
$$;

revoke all on function public.account_history(text) from public;
revoke all on function public.get_order_status(text) from public;
grant execute on function public.account_history(text) to anon, authenticated;
grant execute on function public.get_order_status(text) to anon, authenticated;

-- ---------- 008_roles.sql ----------
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

-- ---------- seed.sql ----------
-- Баштапкы маалымат: сайттын тексттери, тарифтер, техника, жайыт зоналары.
-- schema.sql'дан кийин бир жолу иштетиңиз. Бар маалыматты өзгөртпөйт (on conflict do nothing).

insert into public.site_config (key, value) values ('site_settings', '{"enterpriseName":"«Тазалык»","enterpriseSubName":"Муниципалдык ишканасы","municipalityName":"Айыл өкмөтү","heroKicker":"«Тазалык» муниципалдык ишканасы","heroTitle":"Таза айыл, тунук суу жана өнүккөн жамаат","heroSubtitle":"Суу, таштанды, жайыт жана техника кызматтары бир жерде. Карызыңызды текшериңиз, водомердин көрсөткүчүн жөнөтүңүз, жайыт билетин алыңыз же техника заказ кылыңыз.","heroWaterCardTitle":"Таза ичүүчү суу","heroWaterCardDesc":"Водомердин көрсөткүчүн жөнөтүү жана суу акысын эсептөө.","heroWasteCardTitle":"Таштанды чыгаруу","heroWasteCardDesc":"Көчөлөр боюнча график жана ири таштандыга заказ.","heroPastureCardTitle":"Жайыт пайдалануу","heroPastureCardDesc":"Жайыт акысын эсептөө, билет алуу жана ачык отчеттор.","heroMachineryCardTitle":"Техника жана оңдоо","heroMachineryCardDesc":"Экскаватор, самосвал, суу түтүгүн жана суу кампасын оңдоо.","waterSectionTitle":"Таза суу жана таштанды","waterSectionSubtitle":"Водомердин көрсөткүчүн жөнөтүңүз, суу акысын эсептеңиз жана таштанды чыгаруу графигин караңыз.","pastureSectionTitle":"Жайыт пайдалануу","pastureSectionSubtitle":"Малыңыздын санына жараша жайыт акысын эсептеп, билет алыңыз. Чогулган каражат кайда жумшалганы ачык жарыяланат.","machinerySectionTitle":"Техника ижарасы жана оңдоо кызматтары","machinerySectionSubtitle":"Экскаватор, самосвал жана жүк ташуучу унааларды айдоочусу менен заказ кылыңыз. Суу түтүгүн жана суу кампасын оңдотуу да ушул жерде.","paymentSectionTitle":"Төлөмдөр","paymentSectionSubtitle":"Лицевой эсебиңиздин номерин жазып, карызыңызды текшериңиз жана квитанция алыңыз.","reportsSectionTitle":"Отчеттор жана жаңылыктар","reportsSectionSubtitle":"Ишкананын кирешеси жана чыгашасы, расмий документтер жана акыркы кабарлар.","dispatcherPhone":"0 (312) 55-01-20","whatsappPhone":"+996 (702) 00-11-22","officeAddress":"Айыл өкмөтүнүн имараты, Ленин көч. 12","workHours":"Дш–Жм 08:30–17:30","bankName":"РСК Банк / Айыл Банк","bankAccount":"1290123456780192","bankBik":"129001","inn":"01204201010045","okpo":"29481023"}'::jsonb) on conflict (key) do nothing;
insert into public.site_config (key, value) values ('tariffs', '{"waterPerM3":18.5,"waterWithoutMeterPerPerson":45,"waterCommercialPerM3":32,"waterIrrigationPerSotka":25,"wastePerPerson":35,"wasteCommercialPerM3":70,"pastureCattleSeason":300,"pastureCattleMonth":60,"pastureHorseSeason":375,"pastureHorseMonth":75,"pastureSheepSeason":75,"pastureSheepMonth":15,"pastureYakSeason":250,"pastureYakMonth":50}'::jsonb) on conflict (key) do nothing;
insert into public.machinery (id, data, sort) values ('m-01', '{"id":"m-01","name":"Чоң чынжыр тамандуу экскаватор","category":"excavator","model":"XCMG XE215C (0.9 м³ чөмүч)","year":2023,"hourlyRate":2600,"shiftRate":19000,"image":"/images/tazalyk_machinery_excavator_1791715428773.jpg","status":"бош","specs":{"capacity":"0.9 м³ чөмүч, казуу тереңдиги 6.6 м","driverIncluded":true,"fuelIncluded":true,"minOrderHours":2},"description":"Суу түтүктөрүн жана арыктарды казуу, септик, пайдубал чуңкурларын даярдоо, жер кыртышын тазалоо жана тегиздөө иштерине арналган кубаттуу техника.","commonUses":["Суу түтүгүнө траншея казуу","Фундамент чуңкуру","Дренаж арыктарын тазалоо","Жер тегиздөө"]}'::jsonb, 0) on conflict (id) do nothing;
insert into public.machinery (id, data, sort) values ('m-02', '{"id":"m-02","name":"Дөңгөлөктүү экскаватор-жүктөгүч","category":"excavator","model":"JCB 3CX Super","year":2022,"hourlyRate":2100,"shiftRate":15500,"image":"/images/tazalyk_machinery_excavator_1791715428773.jpg","status":"бош","specs":{"capacity":"Алдыңкы чөмүч 1.1 м³, арткы 0.3 м³","driverIncluded":true,"fuelIncluded":true,"minOrderHours":2},"description":"Айыл көчөлөрүндө жана тар короолордо иштөөгө өтө ыңгайлуу. Жүк жүктөө, чуңкур казуу жана кар күрөө үчүн идеалдуу универсалдуу техника.","commonUses":["Шагыл жана топурак жүктөө","Арык казуу","Короо тегиздөө","Курулуш калдыктарын тазалоо"]}'::jsonb, 1) on conflict (id) do nothing;
insert into public.machinery (id, data, sort) values ('m-03', '{"id":"m-03","name":"Оор жүк ташуучу самосвал","category":"heavy_truck","model":"КамАЗ-65115 (15 тонна)","year":2021,"hourlyRate":1800,"shiftRate":13000,"tripRate":2500,"image":"/images/tazalyk_machinery_excavator_1791715428773.jpg","status":"иште","specs":{"capacity":"15 тонна / 10.5 м³ чанагы","driverIncluded":true,"fuelIncluded":true,"minOrderHours":2},"description":"Шагыл, кум, таш, кара топурак, көң жана чоң көлөмдөгү курулуш калдыктарын ташууга ылайыкташкан оор жүк ташуучу унаа.","commonUses":["Шагыл жана кум ташуу","Көң жана органикалык жер семирткич","Чоң таштандыларды полигонго чыгаруу"]}'::jsonb, 2) on conflict (id) do nothing;
insert into public.machinery (id, data, sort) values ('m-04', '{"id":"m-04","name":"Жеңил жүк ташуучу чарбалык унаа","category":"light_truck","model":"Hyundai Porter II (Борт/Тент)","year":2020,"hourlyRate":800,"shiftRate":5500,"tripRate":900,"image":"/images/tazalyk_machinery_excavator_1791715428773.jpg","status":"бош","specs":{"capacity":"1.5 тонна борт","driverIncluded":true,"fuelIncluded":true,"minOrderHours":1},"description":"Айыл ичинде үй эмеректерин, чарбалык жүктөрдү, курулуш материалдарын жана тиричилик калдыктарын жеңил ташуу үчүн шамдагай унаа.","commonUses":["Турмуш-тиричилик буюмдарын ташуу","Айыл чарба түшүмдөрү","Кичи курулуш материалдары"]}'::jsonb, 3) on conflict (id) do nothing;
insert into public.machinery (id, data, sort) values ('m-07', '{"id": "m-07", "name": "Таза суу түтүктөрүн оңдоо", "category": "special", "model": "Авариялык-оңдоо бригадасы", "year": 2026, "hourlyRate": 1500, "shiftRate": 10000, "image": "images/tazalyk_clean_water_source_1791715441093.jpg", "status": "бош", "specs": {"capacity": "Ø20–160 мм түтүктөр, ширетүү жабдуусу", "driverIncluded": true, "fuelIncluded": true, "minOrderHours": 1}, "description": "Таза суу түтүктөрүндөгү агып кетүүлөрдү жабуу, жарылган жана эскирген түтүктөрдү алмаштыруу, крандарды жана суу өлчөгүч түйүндөрдү оңдоо.", "commonUses": ["Суу агып кетүүсүн жабуу", "Түтүктөрдү алмаштыруу", "Кран жана кудуктарды оңдоо", "Үйгө суу түтүгүн туташтыруу"]}'::jsonb, 7) on conflict (id) do nothing;
insert into public.machinery (id, data, sort) values ('m-08', '{"id": "m-08", "name": "Суу кампаларын (резервуарларды) оңдоо", "category": "special", "model": "Резервуар тейлөө бригадасы", "year": 2026, "hourlyRate": 2000, "shiftRate": 14000, "image": "", "status": "бош", "specs": {"capacity": "Суу сактагыч резервуарлар, бактар, мунаралар", "driverIncluded": true, "fuelIncluded": true, "minOrderHours": 2}, "description": "Суу кампаларын жана резервуарларды тазалоо, жуушуруу (дезинфекциялоо), жаракаларын бекитүү, капкактарын жана түтүк туташууларын оңдоо.", "commonUses": ["Резервуарды тазалоо жана дезинфекциялоо", "Жарака жана агып кетүүнү бекитүү", "Капкак, тепкич, туташууларды оңдоо"]}'::jsonb, 8) on conflict (id) do nothing;
insert into public.pasture_zones (id, data, sort) values ('pz-01', '{"id":"pz-01","name":"Үч-Эмчек жайлоосу","elevation":"2,400 – 2,900 м","capacityHeads":4200,"currentGrazingHeads":3150,"season":"Жайкы","waterSources":"3 табигый булак, Үч-Эмчек суусу","condition":"Жакшы","manager":"Мамытов Жолдошбек"}'::jsonb, 0) on conflict (id) do nothing;
insert into public.pasture_zones (id, data, sort) values ('pz-02', '{"id":"pz-02","name":"Чоң-Төр капчыгайы","elevation":"2,100 – 2,600 м","capacityHeads":2800,"currentGrazingHeads":2400,"season":"Жайкы","waterSources":"Мөңгү суусу, суу түтүгү орнотулган","condition":"Жакшы","manager":"Исаков Канат"}'::jsonb, 1) on conflict (id) do nothing;
insert into public.pasture_zones (id, data, sort) values ('pz-03', '{"id":"pz-03","name":"Бел-Булак жазгы-күзгү жайыты","elevation":"1,600 – 1,950 м","capacityHeads":1900,"currentGrazingHeads":1200,"season":"Жазгы","waterSources":"Булак жана суу топтомо челектер","condition":"Калыбына келтирүүдө","manager":"Эркин уулу Султан"}'::jsonb, 2) on conflict (id) do nothing;
insert into public.pasture_zones (id, data, sort) values ('pz-04', '{"id":"pz-04","name":"Күнгөй адырлары","elevation":"1,400 – 1,750 м","capacityHeads":1500,"currentGrazingHeads":850,"season":"Күзгү","waterSources":"Ала-Арча каналынан тартылган арык","condition":"Орточо","manager":"Байгазиев Мурат"}'::jsonb, 3) on conflict (id) do nothing;

-- ---------- demo_subscribers.sql ----------
-- ДЕМО абоненттер (сыноо үчүн гана). Чыныгы абоненттерди админ панелинен кошуңуз.
-- Керексиз болсо: delete from public.subscribers where id in ('1042', '1043', '1044', '1045', '1046');

insert into public.subscribers (id, full_name, address, phone, water_balance, water_last_meter_reading, water_tariff_per_m3, waste_balance, waste_family_members, waste_tariff_per_person, pasture_balance, livestock) values ('1042', 'Асанбек уулу Нурлан', 'Ленин көчөсү, 42-үй', '+996 (702) 45-88-12', -240, 312, 18.5, -105, 3, 35, 0, '{"cattle":4,"horses":2,"sheepGoats":25,"yaks":0}'::jsonb) on conflict (id) do nothing;
insert into public.subscribers (id, full_name, address, phone, water_balance, water_last_meter_reading, water_tariff_per_m3, waste_balance, waste_family_members, waste_tariff_per_person, pasture_balance, livestock) values ('1043', 'Садыкова Гүлмира Эргешовна', 'Жибек-Жолу көчөсү, 18-үй', '+996 (770) 12-34-56', 150, 184, 18.5, 0, 4, 35, -750, '{"cattle":2,"horses":1,"sheepGoats":40,"yaks":0}'::jsonb) on conflict (id) do nothing;
insert into public.subscribers (id, full_name, address, phone, water_balance, water_last_meter_reading, water_tariff_per_m3, waste_balance, waste_family_members, waste_tariff_per_person, pasture_balance, livestock) values ('1044', 'Токтосунов Бакытбек Касымович', 'Манас көчөсү, 77-үй', '+996 (555) 98-76-54', -480, 420, 18.5, -210, 6, 35, -1400, '{"cattle":8,"horses":4,"sheepGoats":60,"yaks":0}'::jsonb) on conflict (id) do nothing;
insert into public.subscribers (id, full_name, address, phone, water_balance, water_last_meter_reading, water_tariff_per_m3, waste_balance, waste_family_members, waste_tariff_per_person, pasture_balance, livestock) values ('1045', 'Кадыров Медербек Алмазович', 'Айтматов көчөсү, 12-үй', '+996 (707) 33-22-11', 50, 95, 18.5, 0, 2, 35, 0, '{"cattle":0,"horses":0,"sheepGoats":0,"yaks":0}'::jsonb) on conflict (id) do nothing;
insert into public.subscribers (id, full_name, address, phone, water_balance, water_last_meter_reading, water_tariff_per_m3, waste_balance, waste_family_members, waste_tariff_per_person, pasture_balance, livestock) values ('1046', 'Жумалиев Алмаз Бакасович', 'Токтогул көчөсү, 55-үй', '+996 (500) 44-55-66', -370, 210, 18.5, -140, 4, 35, -600, '{"cattle":2,"horses":1,"sheepGoats":15,"yaks":0}'::jsonb) on conflict (id) do nothing;
