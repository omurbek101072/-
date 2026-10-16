-- =====================================================================
-- 006: Сайттын тексттерин кыскартуу жана жөнөкөйлөтүү.
-- Админ мурун өзгөрткөн тексттерге тийбейт (эски баштапкы текст турса гана алмашат).
-- =====================================================================

update public.site_config set value = jsonb_set(value, '{heroKicker}', to_jsonb('«Тазалык» муниципалдык ишканасы'::text))
where key = 'site_settings' and value->>'heroKicker' = 'Айыл өкмөтү · «Тазалык» МИ · 2026';

update public.site_config set value = jsonb_set(value, '{heroSubtitle}', to_jsonb('Суу, таштанды, жайыт жана техника кызматтары бир жерде. Карызыңызды текшериңиз, водомердин көрсөткүчүн жөнөтүңүз, жайыт билетин алыңыз же техника заказ кылыңыз.'::text))
where key = 'site_settings' and value->>'heroSubtitle' = '«Тазалык» муниципалдык ишканасынын расмий санариптик сервиси. Коммуналдык квитанцияларды үйдөн чыкпай MBank жана башка тиркемелер аркылуу төлөңүз, суу көрсөткүчүн жибериңиз, жайыт билеттерин рәсмийлештириңиз жана техника ижаралаңыз.';

update public.site_config set value = jsonb_set(value, '{heroWaterCardDesc}', to_jsonb('Водомердин көрсөткүчүн жөнөтүү жана суу акысын эсептөө.'::text))
where key = 'site_settings' and value->>'heroWaterCardDesc' = 'Суу эсептегичтин көрсөткүчүн онлайн тапшыруу жана кудуктарды оңдоо.';

update public.site_config set value = jsonb_set(value, '{heroWasteCardTitle}', to_jsonb('Таштанды чыгаруу'::text))
where key = 'site_settings' and value->>'heroWasteCardTitle' = 'Калдыктарды башкаруу';

update public.site_config set value = jsonb_set(value, '{heroWasteCardDesc}', to_jsonb('Көчөлөр боюнча график жана ири таштандыга заказ.'::text))
where key = 'site_settings' and value->>'heroWasteCardDesc' = 'Таштанды чыгаруу графиги, сорттоо пункттары жана полигон акысы.';

update public.site_config set value = jsonb_set(value, '{heroPastureCardDesc}', to_jsonb('Жайыт акысын эсептөө, билет алуу жана ачык отчеттор.'::text))
where key = 'site_settings' and value->>'heroPastureCardDesc' = 'Мал башы калькулятору, жайыт билеттери жана ачык каржылык отчеттор.';

update public.site_config set value = jsonb_set(value, '{heroMachineryCardTitle}', to_jsonb('Техника жана оңдоо'::text))
where key = 'site_settings' and value->>'heroMachineryCardTitle' = 'Атайын техника ижарасы';

update public.site_config set value = jsonb_set(value, '{heroMachineryCardDesc}', to_jsonb('Экскаватор, самосвал, суу түтүгүн жана суу кампасын оңдоо.'::text))
where key = 'site_settings' and value->>'heroMachineryCardDesc' = 'Экскаватор, КамАЗ, Портер, таза суу түтүктөрүн жана суу кампаларын оңдоо.';

update public.site_config set value = jsonb_set(value, '{waterSectionTitle}', to_jsonb('Таза суу жана таштанды'::text))
where key = 'site_settings' and value->>'waterSectionTitle' = 'Таза суу менен камсыздоо жана калдыктарды башкаруу';

update public.site_config set value = jsonb_set(value, '{waterSectionSubtitle}', to_jsonb('Водомердин көрсөткүчүн жөнөтүңүз, суу акысын эсептеңиз жана таштанды чыгаруу графигин караңыз.'::text))
where key = 'site_settings' and value->>'waterSectionSubtitle' = 'Суу эсептегич (водомер) көрсөткүчүн онлайн тапшыруу, айылдын таштанды чыгаруу графиги жана санитардык эрежелер.';

update public.site_config set value = jsonb_set(value, '{pastureSectionTitle}', to_jsonb('Жайыт пайдалануу'::text))
where key = 'site_settings' and value->>'pastureSectionTitle' = 'Жайыт пайдалануу жана Жайыт комитети';

update public.site_config set value = jsonb_set(value, '{pastureSectionSubtitle}', to_jsonb('Малыңыздын санына жараша жайыт акысын эсептеп, билет алыңыз. Чогулган каражат кайда жумшалганы ачык жарыяланат.'::text))
where key = 'site_settings' and value->>'pastureSectionSubtitle' = 'Мал башы боюнча мыйзамдуу жайыт билетин онлайн рәсмийлештирүү, жайыт сыйымдуулугун көзөмөлдөө жана чогултулган каражаттардын ачык сарпталышы.';

update public.site_config set value = jsonb_set(value, '{machinerySectionTitle}', to_jsonb('Техника ижарасы жана оңдоо кызматтары'::text))
where key = 'site_settings' and value->>'machinerySectionTitle' = 'Экскаватор, оор жана жеңил жүк ташуучу унаалардын ижарасы';

update public.site_config set value = jsonb_set(value, '{machinerySectionSubtitle}', to_jsonb('Экскаватор, самосвал жана жүк ташуучу унааларды айдоочусу менен заказ кылыңыз. Суу түтүгүн жана суу кампасын оңдотуу да ушул жерде.'::text))
where key = 'site_settings' and value->>'machinerySectionSubtitle' = 'Айыл тургундарына жана уюмдарга ыңгайлуу баада атайын техникалык кызматтар: тажрыйбалуу оператору жана күйүүчү майы менен берилет.';

update public.site_config set value = jsonb_set(value, '{paymentSectionTitle}', to_jsonb('Төлөмдөр'::text))
where key = 'site_settings' and value->>'paymentSectionTitle' = 'Онлайн төлөм борбору';

update public.site_config set value = jsonb_set(value, '{paymentSectionSubtitle}', to_jsonb('Лицевой эсебиңиздин номерин жазып, карызыңызды текшериңиз жана квитанция алыңыз.'::text))
where key = 'site_settings' and value->>'paymentSectionSubtitle' = 'Үйүңүздүн жеке лицевой эсебин же фамилиясын киргизип карызды текшериңиз, же каалаган коммуналдык кызмат үчүн MBank, Optima24, O!Dengi жана башка банк системалары аркылуу төлөңүз.';

update public.site_config set value = jsonb_set(value, '{reportsSectionTitle}', to_jsonb('Отчеттор жана жаңылыктар'::text))
where key = 'site_settings' and value->>'reportsSectionTitle' = 'Ишкананын жылдык отчеттору жана айыл өкмөтүнүн жаңылыктары';

update public.site_config set value = jsonb_set(value, '{reportsSectionSubtitle}', to_jsonb('Ишкананын кирешеси жана чыгашасы, расмий документтер жана акыркы кабарлар.'::text))
where key = 'site_settings' and value->>'reportsSectionSubtitle' = '«Тазалык» муниципалдык ишканасынын киреше-чыгашалары, сатып алынган техникалар жана айылдык кеңештин токтомдору боюнча расмий документтер.';

select value->>'machinerySectionTitle' as machinery_title from public.site_config where key = 'site_settings';
