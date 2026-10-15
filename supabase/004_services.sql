-- =====================================================================
-- 004: Септик тазалоо жана водовоз кызматтарын алып салып, ордуна
-- таза суу түтүктөрүн жана суу кампаларын оңдоо кызматтарын кошуу.
-- Кайра иштетсе да зыяны жок. Баалары үлгү — сайттан өзгөртүңүз.
-- =====================================================================
delete from public.machinery where id in ('m-05', 'm-06');

insert into public.machinery (id, data, sort) values ('m-07', '{"id": "m-07", "name": "Таза суу түтүктөрүн оңдоо", "category": "special", "model": "Авариялык-оңдоо бригадасы", "year": 2026, "hourlyRate": 1500, "shiftRate": 10000, "image": "images/tazalyk_clean_water_source_1791715441093.jpg", "status": "бош", "specs": {"capacity": "Ø20–160 мм түтүктөр, ширетүү жабдуусу", "driverIncluded": true, "fuelIncluded": true, "minOrderHours": 1}, "description": "Таза суу түтүктөрүндөгү агып кетүүлөрдү жабуу, жарылган жана эскирген түтүктөрдү алмаштыруу, крандарды жана суу өлчөгүч түйүндөрдү оңдоо.", "commonUses": ["Суу агып кетүүсүн жабуу", "Түтүктөрдү алмаштыруу", "Кран жана кудуктарды оңдоо", "Үйгө суу түтүгүн туташтыруу"]}'::jsonb, 7)
on conflict (id) do nothing;

insert into public.machinery (id, data, sort) values ('m-08', '{"id": "m-08", "name": "Суу кампаларын (резервуарларды) оңдоо", "category": "special", "model": "Резервуар тейлөө бригадасы", "year": 2026, "hourlyRate": 2000, "shiftRate": 14000, "image": "", "status": "бош", "specs": {"capacity": "Суу сактагыч резервуарлар, бактар, мунаралар", "driverIncluded": true, "fuelIncluded": true, "minOrderHours": 2}, "description": "Суу кампаларын жана резервуарларды тазалоо, жуушуруу (дезинфекциялоо), жаракаларын бекитүү, капкактарын жана түтүк туташууларын оңдоо.", "commonUses": ["Резервуарды тазалоо жана дезинфекциялоо", "Жарака жана агып кетүүнү бекитүү", "Капкак, тепкич, туташууларды оңдоо"]}'::jsonb, 8)
on conflict (id) do nothing;

update public.site_config
set value = jsonb_set(value, '{heroMachineryCardDesc}',
  to_jsonb('Экскаватор, КамАЗ, Портер, таза суу түтүктөрүн жана суу кампаларын оңдоо.'::text))
where key = 'site_settings'
  and value->>'heroMachineryCardDesc' = 'Экскаватор, КамАЗ, Портер жана септик тазалоочу ассенизатор кызматы.';

select id, data->>'name' as name from public.machinery order by sort;
