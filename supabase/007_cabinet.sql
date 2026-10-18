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
