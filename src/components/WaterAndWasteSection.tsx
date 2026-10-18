import React, { useEffect, useState } from 'react';
import { SubscriberAccount } from '../types';
import { useApp } from '../context/AppContext';
import { EditableText } from './EditableText';
import { T, SectionEditButton } from './AdminInline';
import { PhoneLink } from './PhoneLink';
import { 
  Droplets, 
  Trash2, 
  Calendar, 
  CheckCircle2, 
  AlertTriangle, 
  MapPin, 
  ArrowRight, 
  ShieldCheck, 
  Calculator, 
  Users, 
  Building2, 
  Edit3, 
  Check, 
  X,
  Phone,
  Sparkles
} from 'lucide-react';
import { isValidKgPhone, PHONE_ERROR } from '../utils/validation';

interface WaterAndWasteSectionProps {
  onDirectPayment: (serviceType: 'water' | 'waste', amount: number, details: string, orderId?: string, accountId?: string) => void;
  onOpenCitizenRequest: () => void;
}

export const WaterAndWasteSection: React.FC<WaterAndWasteSectionProps> = ({
  onDirectPayment,
  onOpenCitizenRequest
}) => {
  const { tariffs, updateTariffs, siteSettings, isAdminLoggedIn: isStaff, isOperator, lookupSubscriber, submitMeterReading, createTicket, content } = useApp();
  const canEditTariffs = isStaff && !isOperator;
  const [activeTab, setActiveTab] = useState<'water' | 'waste'>('water');

  // Calculator Sub-mode:
  // 'meter' = Водомер менен
  // 'no-meter' = Водомери жокторго (адам башына)
  // 'commercial' = Коммерциялык жана сугат суу
  const [waterCalcMode, setWaterCalcMode] = useState<'meter' | 'no-meter' | 'commercial'>('meter');

  // 1. Water with meter state
  const [accountNumber, setAccountNumber] = useState<string>('');
  const [manualPrevReading, setManualPrevReading] = useState<number>(0);
  const [currentReading, setCurrentReading] = useState<number>(0);
  const [readingPhone, setReadingPhone] = useState<string>('+996 ');
  const [meterNotice, setMeterNotice] = useState<string | null>(null);
  const [meterError, setMeterError] = useState<string | null>(null);
  const [isMeterSending, setIsMeterSending] = useState(false);
  // Абонент табылса, мурунку көрсөткүч ишкананын базасынан алынат (колго өзгөртүүгө болбойт)
  const [meterSubscriber, setMeterSubscriber] = useState<SubscriberAccount | null>(null);
  useEffect(() => {
    const acc = accountNumber.trim().replace(/^№/, '');
    if (!acc) {
      setMeterSubscriber(null);
      return;
    }
    let cancelled = false;
    const t = setTimeout(() => {
      lookupSubscriber(acc)
        .then(sub => { if (!cancelled) setMeterSubscriber(sub); })
        .catch(() => { if (!cancelled) setMeterSubscriber(null); });
    }, 400);
    return () => { cancelled = true; clearTimeout(t); };
  }, [accountNumber]);
  const prevReading = meterSubscriber ? meterSubscriber.waterLastMeterReading : manualPrevReading;
  const setPrevReading = setManualPrevReading;

  // 2. Water without meter state (per person)
  const [noMeterAccount, setNoMeterAccount] = useState<string>('');
  const [familyMembersCount, setFamilyMembersCount] = useState<number>(4);
  const [monthsCount, setMonthsCount] = useState<number>(1);
  const [noMeterPhone, setNoMeterPhone] = useState<string>('+996 ');

  // 3. Commercial & Irrigation state
  const [commercialAccount, setCommercialAccount] = useState<string>('');
  const [commercialType, setCommercialType] = useState<'commercial' | 'irrigation'>('commercial');
  const [commercialVolume, setCommercialVolume] = useState<number>(15); // м³ or сотых
  const [commercialMonths, setCommercialMonths] = useState<number>(1);

  // In-line Admin Tariff Quick Edit state
  const [isEditingTariffs, setIsEditingTariffs] = useState<boolean>(false);
  const [tempTariffs, setTempTariffs] = useState({
    waterPerM3: tariffs.waterPerM3 || 18.5,
    waterWithoutMeterPerPerson: tariffs.waterWithoutMeterPerPerson || 45,
    waterCommercialPerM3: tariffs.waterCommercialPerM3 || 32,
    waterIrrigationPerSotka: tariffs.waterIrrigationPerSotka || 25,
  });

  // Rates from context with guaranteed fallback numbers
  const waterRate = Number(tariffs.waterPerM3) || 18.5;
  const waterWithoutMeterRate = Number(tariffs.waterWithoutMeterPerPerson) || 45;
  const waterCommercialRate = Number(tariffs.waterCommercialPerM3) || 32;
  const waterIrrigationRate = Number(tariffs.waterIrrigationPerSotka) || 25;
  const wasteRate = Number(tariffs.wastePerPerson) || 35;

  // 1. Meter Calculations
  const consumedM3 = Math.max(0, currentReading - prevReading);
  const calculatedWaterCost = Math.round(consumedM3 * waterRate);

  // 2. No-meter Calculations
  const calculatedNoMeterCost = Math.round(familyMembersCount * monthsCount * waterWithoutMeterRate);

  // 3. Commercial Calculations
  const activeCommRate = commercialType === 'commercial' ? waterCommercialRate : waterIrrigationRate;
  const calculatedCommercialCost = Math.round(commercialVolume * commercialMonths * activeCommRate);

  // Көрсөткүчтү серверге жөнөтүү. Ийгиликтүү болсо эсептелген сумманы кайтарат.
  const recordMeterReading = async (): Promise<number | null> => {
    if (isMeterSending) return null;
    if (!meterSubscriber) {
      setMeterError('Мындай лицевой эсеп табылган жок. Квитанциядагы номерди текшериңиз.');
      return null;
    }
    if (!isValidKgPhone(readingPhone)) {
      setMeterError(PHONE_ERROR);
      return null;
    }
    if (currentReading <= prevReading) {
      setMeterError(`Жаңы көрсөткүч мурункудан (${prevReading} м³) чоң болушу керек.`);
      return null;
    }
    setIsMeterSending(true);
    try {
      const r = await submitMeterReading(meterSubscriber.id, currentReading, readingPhone);
      setMeterError(null);
      setMeterNotice(`Көрсөткүч кабыл алынды (эсеп №${meterSubscriber.id})! Сарпталган суу: ${r.consumed} м³. Эсептелген сумма: ${r.amount} сом.`);
      // Жаңы көрсөткүч жана баланс серверден
      lookupSubscriber(meterSubscriber.id).then(setMeterSubscriber).catch(() => undefined);
      return r.amount;
    } catch (e) {
      setMeterError(e instanceof Error ? e.message : 'Көрсөткүчтү сактоо мүмкүн болгон жок.');
      return null;
    } finally {
      setIsMeterSending(false);
    }
  };

  const handleMeterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await recordMeterReading();
  };

  const handlePayWaterNow = async () => {
    // Төлөмдөн мурун көрсөткүч сөзсүз катталат, болбосо карыз эсепке алынбай калат
    const prev = prevReading;
    const reading = currentReading;
    const sub = meterSubscriber;
    const amount = await recordMeterReading();
    if (amount === null || !sub) return;
    onDirectPayment(
      'water',
      amount,
      `Водомер көрсөткүчү (${prev} -> ${reading} м³, сарпталды: ${reading - prev} м³, эсеп №${sub.id})`,
      undefined,
      sub.id
    );
  };

  const handlePayNoMeterNow = () => {
    onDirectPayment(
      'water', 
      calculatedNoMeterCost, 
      `Эсептегичи жок суу акысы (${familyMembersCount} адам, ${monthsCount} ай, эсеп №${noMeterAccount || '-'})`,
      undefined,
      noMeterAccount.trim() || undefined
    );
  };

  const handlePayCommercialNow = () => {
    const typeLabel = commercialType === 'commercial' ? 'Коммерциялык суу' : 'Сугат суу';
    const unitLabel = commercialType === 'commercial' ? 'м³' : 'сотых';
    onDirectPayment(
      'water', 
      calculatedCommercialCost, 
      `${typeLabel} (${commercialVolume} ${unitLabel}, ${commercialMonths} ай, эсеп №${commercialAccount || '-'})`,
      undefined,
      commercialAccount.trim() || undefined
    );
  };

  // Quick save edited tariffs by Admin
  const handleSaveQuickTariffs = (e: React.FormEvent) => {
    e.preventDefault();
    updateTariffs({
      ...tariffs,
      waterPerM3: Number(tempTariffs.waterPerM3) || 18.5,
      waterWithoutMeterPerPerson: Number(tempTariffs.waterWithoutMeterPerPerson) || 45,
      waterCommercialPerM3: Number(tempTariffs.waterCommercialPerM3) || 32,
      waterIrrigationPerSotka: Number(tempTariffs.waterIrrigationPerSotka) || 25,
    });
    setIsEditingTariffs(false);
  };

  // Bulky waste order state
  const [bulkyAddress, setBulkyAddress] = useState<string>('');
  const [bulkyType, setBulkyType] = useState<string>('Курулуш калдыктары');
  const [bulkyPhone, setBulkyPhone] = useState<string>('+996 ');
  const [bulkyNotice, setBulkyNotice] = useState<string | null>(null);

  const handleBulkySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidKgPhone(bulkyPhone)) {
      setBulkyNotice(PHONE_ERROR);
      return;
    }
    if (!bulkyAddress.trim()) {
      setBulkyNotice('Дарегиңизди жазыңыз.');
      return;
    }
    // Өтүнмө админ панелиндеги «Арыздар» тизмесине түшөт
    try {
      const id = await createTicket({
        category: `Ири таштанды чыгаруу: ${bulkyType}`,
        name: '',
        phone: bulkyPhone.trim(),
        address: bulkyAddress.trim(),
        description: `Ири таштанды чыгаруу өтүнмөсү (${bulkyType})`
      });
      setBulkyNotice(`Ири таштанды чыгаруу өтүнмөсү катталды (№ ${id}). Диспетчер тактоо үчүн байланышат.`);
      setBulkyAddress('');
      setBulkyPhone('+996 ');
    } catch (err) {
      setBulkyNotice(err instanceof Error ? err.message : 'Жөнөтүүдө ката кетти.');
    }
  };

  return (
    <section id="water-waste" className="py-14 bg-stone-100/70 border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 uppercase tracking-wider">
              <span><T>Коммуналдык кызматтар</T></span>
              <span aria-hidden="true">·</span>
              <span><T>Жашоо шарттары</T></span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 mt-1" style={{ textWrap: 'balance' }}>
              <EditableText settingKey="waterSectionTitle" label="Суу жана Калдыктар башкы аталышы" />
            </h2>
            <p className="text-sm text-stone-600 mt-2 max-w-2xl">
              <EditableText settingKey="waterSectionSubtitle" multiline label="Суу жана Калдыктар түшүндүрмөсү" />
            </p>
          </div>

          {/* Service Switcher Tabs */}
          <div className="flex items-center gap-2 p-1 bg-stone-200/80 rounded-xl text-xs font-medium shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('water')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all cursor-pointer ${
                activeTab === 'water'
                  ? 'bg-white text-stone-900 font-bold shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Droplets className="w-4 h-4 text-cyan-600" />
              <span><T>Таза суу кызматы</T></span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('waste')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all cursor-pointer ${
                activeTab === 'waste'
                  ? 'bg-white text-stone-900 font-bold shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Trash2 className="w-4 h-4 text-emerald-700" />
              <span><T>Калдыктар жана график</T></span>
            </button>
          </div>
        </div>

        {/* TAB 1: CLEAN WATER */}
        {activeTab === 'water' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {meterNotice && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-between text-xs font-semibold">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{meterNotice}</span>
                </div>
                <button onClick={() => setMeterNotice(null)} className="text-stone-500 hover:text-stone-800 cursor-pointer">
                  <T>Жабуу</T>
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Online Water Calculator & Submission Hub (7 cols) */}
              <div className="lg:col-span-7 bg-white rounded-2xl p-6 sm:p-7 border border-stone-200 shadow-sm space-y-6">
                <div className="border-b border-stone-100 pb-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-cyan-800 uppercase">
                      <Droplets className="w-4 h-4" />
                      <span><T>Суу акысы</T></span>
                    </div>
                    <span className="text-[11px] font-semibold text-cyan-900 bg-cyan-50 px-2.5 py-0.5 rounded-full border border-cyan-150">
                      2026-жылкы расмий тарифтер
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-stone-900 mt-1">
                    <T>Суу акысын эсептөө жана көрсөткүч жөнөтүү</T>
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    <T>Түрүн тандап, водомердин көрсөткүчүн же үй-бүлөнүн санын жазыңыз — сумма өзү эсептелет</T>
                  </p>

                  {/* 3 Sub-tabs for Calculator */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-4 p-1.5 bg-stone-100 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setWaterCalcMode('meter')}
                      className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        waterCalcMode === 'meter'
                          ? 'bg-white text-cyan-950 shadow-xs border border-stone-200'
                          : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/50'
                      }`}
                    >
                      <Droplets className="w-3.5 h-3.5 text-cyan-600" />
                      <span><T>Водомер менен</T></span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setWaterCalcMode('no-meter')}
                      className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        waterCalcMode === 'no-meter'
                          ? 'bg-white text-cyan-950 shadow-xs border border-stone-200'
                          : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/50'
                      }`}
                    >
                      <Users className="w-3.5 h-3.5 text-emerald-600" />
                      <span><T>Водомери жокторго</T></span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setWaterCalcMode('commercial')}
                      className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        waterCalcMode === 'commercial'
                          ? 'bg-white text-cyan-950 shadow-xs border border-stone-200'
                          : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/50'
                      }`}
                    >
                      <Building2 className="w-3.5 h-3.5 text-amber-600" />
                      <span><T>Коммерциялык / Сугат</T></span>
                    </button>
                  </div>
                </div>

                {/* MODE 1: WITH WATER METER */}
                {waterCalcMode === 'meter' && (
                  <form onSubmit={handleMeterSubmit} className="space-y-4 text-xs animate-in fade-in duration-200">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-stone-700 font-semibold mb-1">
                          <T>Лицевой эсеп номери:</T>
                        </label>
                        <input
                          type="text"
                          value={accountNumber}
                          onChange={(e) => setAccountNumber(e.target.value)}
                          placeholder="Мисалы: 1042"
                          className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg font-mono text-xs focus:ring-2 focus:ring-cyan-600 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-stone-700 font-semibold mb-1">
                          <T>Байланыш телефону:</T>
                        </label>
                        <input
                          type="tel"
                          inputMode="tel"
                          value={readingPhone}
                          onChange={(e) => setReadingPhone(e.target.value)}
                          placeholder="+996 (___) __-__-__"
                          className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg font-mono text-xs focus:ring-2 focus:ring-cyan-600 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-cyan-50/50 border border-cyan-100">
                      <div>
                        <label className="block text-stone-700 font-semibold mb-1">
                          <T>Өткөн айдагы көрсөткүч (м³):</T>
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={prevReading}
                          readOnly={!!meterSubscriber}
                          onChange={(e) => setPrevReading(Math.max(0, Number(e.target.value) || 0))}
                          className="w-full px-3 py-2 bg-white read-only:bg-stone-100 border border-stone-300 rounded-lg font-mono font-bold text-stone-800 text-sm focus:ring-2 focus:ring-cyan-600 focus:outline-none"
                        />
                        <span className="text-[10px] text-stone-400 mt-0.5 block">
                          {meterSubscriber
                            ? <T>Ишканада катталган акыркы көрсөткүч</T>
                            : <T>Эсеп номерин жазсаңыз, өзү толтурулат</T>}
                        </span>
                      </div>

                      <div>
                        <label className="block text-stone-900 font-bold mb-1">
                          <T>Бүгүнкү көрсөткүч (м³):</T>
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={currentReading}
                          onChange={(e) => setCurrentReading(Math.max(0, Number(e.target.value) || 0))}
                          className="w-full px-3 py-2 bg-white border border-cyan-400 rounded-lg font-mono font-extrabold text-cyan-900 text-sm focus:ring-2 focus:ring-cyan-600 focus:outline-none"
                        />
                        <span className="text-[10px] text-cyan-700 mt-0.5 block"><T>Водомерден карап жазыңыз</T></span>
                      </div>
                    </div>

                    {meterError && (
                      <p className="text-[11px] font-semibold text-rose-600">{meterError}</p>
                    )}

                    {/* Dynamic calculation banner */}
                    <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div>
                        <div className="text-[11px] text-stone-500">
                          <T>Сарпталган суу:</T> <strong className="font-mono text-stone-900 text-xs font-bold">{consumedM3} м³</strong> · Тариф: <span className="font-mono text-cyan-800 font-bold">{waterRate} сом/м³</span>
                        </div>
                        <div className="text-xl font-black text-stone-950 font-mono tabular-nums mt-0.5">
                          <T>Төлөм суммасы:</T> {calculatedWaterCost.toLocaleString('ru-RU')} сом
                        </div>
                      </div>

                      <div className="flex gap-2 w-full sm:w-auto">
                        <button
                          type="submit"
                          className="flex-1 sm:flex-none px-4 py-2 bg-stone-800 hover:bg-stone-900 text-white font-semibold rounded-lg text-xs cursor-pointer transition-colors"
                        >
                          <T>Көрсөткүчтү сактоо</T>
                        </button>
                        <button
                          type="button"
                          onClick={handlePayWaterNow}
                          className="flex-1 sm:flex-none px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg text-xs shadow-xs cursor-pointer transition-colors"
                        >
                          <T>Төлөөгө өтүү</T>
                        </button>
                      </div>
                    </div>
                  </form>
                )}

                {/* MODE 2: WITHOUT WATER METER (PER PERSON) */}
                {waterCalcMode === 'no-meter' && (
                  <div className="space-y-4 text-xs animate-in fade-in duration-200">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-stone-700 font-semibold mb-1">
                          <T>Лицевой эсеп номери:</T>
                        </label>
                        <input
                          type="text"
                          value={noMeterAccount}
                          onChange={(e) => setNoMeterAccount(e.target.value)}
                          placeholder="Мисалы: 1043"
                          className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg font-mono text-xs focus:ring-2 focus:ring-cyan-600 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-stone-700 font-semibold mb-1">
                          <T>Байланыш телефону:</T>
                        </label>
                        <input
                          type="tel"
                          inputMode="tel"
                          value={noMeterPhone}
                          onChange={(e) => setNoMeterPhone(e.target.value)}
                          placeholder="+996 (___) __-__-__"
                          className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg font-mono text-xs focus:ring-2 focus:ring-cyan-600 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-emerald-50/50 border border-emerald-100">
                      {/* Family members counter */}
                      <div>
                        <label className="block text-stone-900 font-bold mb-1">
                          <T>Үй-бүлө мүчөлөрүнүн саны (адам):</T>
                        </label>
                        <div className="flex items-center gap-2 mt-1">
                          <button
                            type="button"
                            onClick={() => setFamilyMembersCount(Math.max(1, familyMembersCount - 1))}
                            className="w-9 h-9 rounded-lg bg-white border border-stone-300 text-stone-700 font-bold text-base hover:bg-stone-100 flex items-center justify-center cursor-pointer shadow-xs"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min="1"
                            max="30"
                            value={familyMembersCount}
                            onChange={(e) => setFamilyMembersCount(Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-20 text-center py-2 bg-white border border-emerald-400 rounded-lg font-bold font-mono text-emerald-950 text-base"
                          />
                          <button
                            type="button"
                            onClick={() => setFamilyMembersCount(familyMembersCount + 1)}
                            className="w-9 h-9 rounded-lg bg-white border border-stone-300 text-stone-700 font-bold text-base hover:bg-stone-100 flex items-center justify-center cursor-pointer shadow-xs"
                          >
                            +
                          </button>
                        </div>
                        <span className="text-[10px] text-stone-500 mt-1 block">
                          <T>Тариф:</T> <strong>{waterWithoutMeterRate} сом / адам башына</strong>
                        </span>
                      </div>

                      {/* Period selector */}
                      <div>
                        <label className="block text-stone-900 font-bold mb-1">
                          <T>Төлөнүүчү айлардын саны:</T>
                        </label>
                        <div className="grid grid-cols-4 gap-1.5 mt-1">
                          {[1, 2, 3, 6].map((m) => (
                            <button
                              key={m}
                              type="button"
                              onClick={() => setMonthsCount(m)}
                              className={`py-2 px-1 rounded-lg font-bold text-xs cursor-pointer border transition-all ${
                                monthsCount === m
                                  ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                                  : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-50'
                              }`}
                            >
                              {m} ай
                            </button>
                          ))}
                        </div>
                        <span className="text-[10px] text-stone-500 mt-1 block">
                          {familyMembersCount} адам × {waterWithoutMeterRate} сом × {monthsCount} ай
                        </span>
                      </div>
                    </div>

                    {/* Calculation summary */}
                    <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div>
                        <div className="text-[11px] text-stone-500">
                          <T>Жалпы:</T> <strong className="font-mono text-stone-900">{familyMembersCount} адам</strong> · Мөөнөт: <strong className="font-mono text-stone-900">{monthsCount} ай</strong> · Тариф: <span className="font-mono font-bold text-emerald-800">{waterWithoutMeterRate} сом/адам</span>
                        </div>
                        <div className="text-xl font-black text-stone-950 font-mono tabular-nums mt-0.5">
                          <T>Төлөм суммасы:</T> {calculatedNoMeterCost.toLocaleString('ru-RU')} сом
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handlePayNoMeterNow}
                        className="w-full sm:w-auto px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg text-xs shadow-xs cursor-pointer transition-colors"
                      >
                        <T>Дароо онлайн төлөө (</T>{calculatedNoMeterCost} сом)
                      </button>
                    </div>
                  </div>
                )}

                {/* MODE 3: COMMERCIAL & IRRIGATION WATER */}
                {waterCalcMode === 'commercial' && (
                  <div className="space-y-4 text-xs animate-in fade-in duration-200">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-stone-700 font-semibold mb-1">
                          <T>Абоненттин коду:</T>
                        </label>
                        <input
                          type="text"
                          value={commercialAccount}
                          onChange={(e) => setCommercialAccount(e.target.value)}
                          placeholder="Мисалы: 2001"
                          className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg font-mono text-xs focus:ring-2 focus:ring-cyan-600 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-stone-700 font-semibold mb-1">
                          <T>Эмнеге колдонулат:</T>
                        </label>
                        <select
                          value={commercialType}
                          onChange={(e) => setCommercialType(e.target.value as 'commercial' | 'irrigation')}
                          className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg font-semibold text-stone-800 text-xs"
                        >
                          <option value="commercial">Коммерциялык (мончо, цех, дүкөн) — {waterCommercialRate} с/м³</option>
                          <option value="irrigation">Сугат суу (короо-жай, бакча) — {waterIrrigationRate} с/сотых/ай</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-amber-50/50 border border-amber-100">
                      <div>
                        <label className="block text-stone-900 font-bold mb-1">
                          {commercialType === 'commercial' ? <T>Сарпталган көлөм (м³):</T> : <T>Короо-бакча аянты (сотых):</T>}
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={commercialVolume}
                          onChange={(e) => setCommercialVolume(Math.max(1, Number(e.target.value) || 1))}
                          className="w-full px-3 py-2 bg-white border border-amber-400 rounded-lg font-mono font-bold text-stone-900 text-sm focus:ring-2 focus:ring-amber-500"
                        />
                        <span className="text-[10px] text-stone-500 mt-1 block">
                          <T>Тариф:</T> <strong>{activeCommRate} сом / {commercialType === 'commercial' ? '1 м³' : '1 сотых'}</strong>
                        </span>
                      </div>

                      <div>
                        <label className="block text-stone-900 font-bold mb-1">
                          <T>Мөөнөт (айлардын саны):</T>
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="12"
                          value={commercialMonths}
                          onChange={(e) => setCommercialMonths(Math.max(1, Number(e.target.value) || 1))}
                          className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg font-mono font-bold text-stone-800 text-sm"
                        />
                        <span className="text-[10px] text-stone-500 mt-1 block">
                          {commercialVolume} × {activeCommRate} сом × {commercialMonths} ай
                        </span>
                      </div>
                    </div>

                    {/* Calculation summary */}
                    <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div>
                        <div className="text-[11px] text-stone-500">
                          {commercialType === 'commercial' ? <T>Коммерциялык эсеп</T> : <T>Сугат суу эсеби</T>} · <T>Тариф:</T> <span className="font-mono font-bold text-amber-800">{activeCommRate} сом</span>
                        </div>
                        <div className="text-xl font-black text-stone-950 font-mono tabular-nums mt-0.5">
                          <T>Төлөм суммасы:</T> {calculatedCommercialCost.toLocaleString('ru-RU')} сом
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handlePayCommercialNow}
                        className="w-full sm:w-auto px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg text-xs shadow-xs cursor-pointer transition-colors"
                      >
                        <T>Дароо онлайн төлөө (</T>{calculatedCommercialCost} сом)
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Water Info & OFFICIAL TARIFFS BOARD (5 cols) */}
              <div className="lg:col-span-5 space-y-4">
                <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
                    <div>
                      <h3 className="text-sm font-bold text-stone-900">
                        <T>Суунун тарифтери</T>
                      </h3>
                      <p className="text-[11px] text-stone-500">
                        <T>Айылдык кеңеш бекиткен</T>
                      </p>
                    </div>

                    {/* Quick Admin Edit Trigger */}
                    {canEditTariffs && (
                      <button
                        type="button"
                        onClick={() => {
                          setTempTariffs({
                            waterPerM3: tariffs.waterPerM3 || 18.5,
                            waterWithoutMeterPerPerson: tariffs.waterWithoutMeterPerPerson || 45,
                            waterCommercialPerM3: tariffs.waterCommercialPerM3 || 32,
                            waterIrrigationPerSotka: tariffs.waterIrrigationPerSotka || 25,
                          });
                          setIsEditingTariffs(!isEditingTariffs);
                        }}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-100 text-amber-900 hover:bg-amber-200 cursor-pointer transition-colors"
                        title="Тариф цифраларын өзгөртүү"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>{isEditingTariffs ? 'Жабуу' : 'Тарифти өзгөртүү'}</span>
                      </button>
                    )}
                  </div>

                  {/* ADMIN INLINE EDITING FORM */}
                  {canEditTariffs && isEditingTariffs ? (
                    <form onSubmit={handleSaveQuickTariffs} className="p-4 bg-amber-50 rounded-xl border border-amber-200 space-y-3 text-xs">
                      <div className="font-bold text-amber-950 flex items-center gap-1.5 text-xs">
                        <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                        <span><T>Администратор: Тарифтердин цифраларын өзгөртүү</T></span>
                      </div>

                      <div>
                        <label className="block text-stone-800 font-semibold text-[11px] mb-1">
                          <T>Водомер менен (сом / 1 м³):</T>
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={tempTariffs.waterPerM3}
                          onChange={(e) => setTempTariffs({ ...tempTariffs, waterPerM3: Number(e.target.value) })}
                          className="w-full px-2.5 py-1.5 bg-white border border-stone-300 rounded font-mono font-bold text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-stone-800 font-semibold text-[11px] mb-1">
                          <T>Водомери жокторго (сом / адам башына):</T>
                        </label>
                        <input
                          type="number"
                          step="1"
                          value={tempTariffs.waterWithoutMeterPerPerson}
                          onChange={(e) => setTempTariffs({ ...tempTariffs, waterWithoutMeterPerPerson: Number(e.target.value) })}
                          className="w-full px-2.5 py-1.5 bg-white border border-stone-300 rounded font-mono font-bold text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-stone-800 font-semibold text-[11px] mb-1">
                          <T>Коммерциялык (сом / 1 м³):</T>
                        </label>
                        <input
                          type="number"
                          step="1"
                          value={tempTariffs.waterCommercialPerM3}
                          onChange={(e) => setTempTariffs({ ...tempTariffs, waterCommercialPerM3: Number(e.target.value) })}
                          className="w-full px-2.5 py-1.5 bg-white border border-stone-300 rounded font-mono font-bold text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-stone-800 font-semibold text-[11px] mb-1">
                          <T>Сугат суу (сом / сотых):</T>
                        </label>
                        <input
                          type="number"
                          step="1"
                          value={tempTariffs.waterIrrigationPerSotka}
                          onChange={(e) => setTempTariffs({ ...tempTariffs, waterIrrigationPerSotka: Number(e.target.value) })}
                          className="w-full px-2.5 py-1.5 bg-white border border-stone-300 rounded font-mono font-bold text-xs"
                        />
                      </div>

                      <div className="flex gap-2 pt-1">
                        <button
                          type="submit"
                          className="flex-1 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded text-xs flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span><T>Сактоо жана киргизүү</T></span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsEditingTariffs(false)}
                          className="px-3 py-1.5 bg-stone-200 hover:bg-stone-300 text-stone-800 font-semibold rounded text-xs cursor-pointer"
                        >
                          <T>Артка</T>
                        </button>
                      </div>
                    </form>
                  ) : (
                    /* 4 PROMINENT TARIFF CARDS WITH BIG CLEAR NUMBERS */
                    <div className="space-y-2.5 text-xs">
                      {/* 1. With Meter */}
                      <div className="p-3.5 bg-cyan-50/60 rounded-xl border border-cyan-200 hover:border-cyan-400 transition-colors">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-stone-900 text-xs">1. Эсептегичи (водомер) барларга:</span>
                          <span className="text-[10px] font-bold text-cyan-800 bg-white px-2 py-0.5 rounded border border-cyan-150">
                            <T>Калкка</T>
                          </span>
                        </div>
                        <div className="flex items-baseline gap-1.5 mt-1">
                          <span className="text-2xl font-black font-mono text-cyan-950 tabular-nums">
                            {waterRate} сом
                          </span>
                          <span className="text-stone-600 font-semibold text-xs">
                            / 1 м³ (кубометр)
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-600 mt-1 leading-snug">
                          <T>Водомер көрсөткөн көлөм үчүн гана төлөйсүз.</T>
                        </p>
                        <div className="mt-2 pt-2 border-t border-cyan-100 flex items-center justify-between">
                          <span className="text-[10px] text-stone-500"><T>Мисалы: 10 м³ сарпталса =</T> {(10 * waterRate).toFixed(0)} сом</span>
                          <button
                            type="button"
                            onClick={() => setWaterCalcMode('meter')}
                            className="text-[11px] font-bold text-cyan-800 hover:underline cursor-pointer"
                          >
                            <T>Эсептөө →</T>
                          </button>
                        </div>
                      </div>

                      {/* 2. Without Meter */}
                      <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-200 hover:border-emerald-400 transition-colors">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-stone-900 text-xs">2. Эсептегичи жок турак жайларга:</span>
                          <span className="text-[10px] font-bold text-emerald-800 bg-white px-2 py-0.5 rounded border border-emerald-150">
                            <T>Адам башына</T>
                          </span>
                        </div>
                        <div className="flex items-baseline gap-1.5 mt-1">
                          <span className="text-2xl font-black font-mono text-emerald-950 tabular-nums">
                            {waterWithoutMeterRate} сом
                          </span>
                          <span className="text-stone-600 font-semibold text-xs">
                            / адам башына айына
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-600 mt-1 leading-snug">
                          <T>Үйдө катталган адамдардын санына жараша эсептелет.</T>
                        </p>
                        <div className="mt-2 pt-2 border-t border-emerald-100 flex items-center justify-between">
                          <span className="text-[10px] text-stone-500"><T>Мисалы: 4 адам =</T> {4 * waterWithoutMeterRate} сом/ай</span>
                          <button
                            type="button"
                            onClick={() => setWaterCalcMode('no-meter')}
                            className="text-[11px] font-bold text-emerald-800 hover:underline cursor-pointer"
                          >
                            <T>Эсептөө →</T>
                          </button>
                        </div>
                      </div>

                      {/* 3. Commercial */}
                      <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 hover:border-stone-400 transition-colors">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-stone-900 text-xs">3. Коммерциялык колдонуу:</span>
                          <span className="text-[10px] font-bold text-stone-700 bg-white px-2 py-0.5 rounded border border-stone-200">
                            <T>Бизнеске</T>
                          </span>
                        </div>
                        <div className="flex items-baseline gap-1.5 mt-1">
                          <span className="text-2xl font-black font-mono text-stone-950 tabular-nums">
                            {waterCommercialRate} сом
                          </span>
                          <span className="text-stone-600 font-semibold text-xs">
                            / 1 м³
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-600 mt-1 leading-snug">
                          <T>Мончо, автожуугуч, цехтер, кафе, дүкөн жана мал чарбалары үчүн.</T>
                        </p>
                      </div>

                      {/* 4. Irrigation */}
                      <div className="p-3.5 bg-amber-50/60 rounded-xl border border-amber-200 hover:border-amber-400 transition-colors">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-stone-900 text-xs">4. Короо жана сугат суу:</span>
                          <span className="text-[10px] font-bold text-amber-800 bg-white px-2 py-0.5 rounded border border-amber-150">
                            <T>Жайкы сезон</T>
                          </span>
                        </div>
                        <div className="flex items-baseline gap-1.5 mt-1">
                          <span className="text-2xl font-black font-mono text-amber-950 tabular-nums">
                            {waterIrrigationRate} сом
                          </span>
                          <span className="text-stone-600 font-semibold text-xs">
                            / 1 сотых айына
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-600 mt-1 leading-snug">
                          <T>Короо-жайды, бакчаны жана эгиндерди сугарууга.</T>
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Emergency notice and contacts */}
                  <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
                    <span className="text-[11px] text-stone-500"><T>Суу чыкпай жатса же авария болсо:</T></span>
                    <button
                      type="button"
                      onClick={onOpenCitizenRequest}
                      className="text-xs font-bold text-rose-700 hover:underline cursor-pointer"
                    >
                      <T>Авария тууралуу кабарлоо</T>
                    </button>
                  </div>
                </div>

                {/* Quality certificate */}
                <div className="p-4 rounded-2xl bg-cyan-900 text-white text-xs space-y-2">
                  <div className="flex items-center gap-2 font-bold text-cyan-300">
                    <ShieldCheck className="w-4 h-4" />
                    <span><T>Суунун сапаты</T></span>
                  </div>
                  <p className="text-cyan-100 leading-relaxed text-[11px]">
                    <T>Ичүүчү суунун сапатын санитардык кызмат текшерет. Суунун түсү же жыты өзгөрсө, дароо диспетчерге кабарлаңыз.</T>
                  </p>
                  <div className="pt-1 flex items-center gap-2 text-[10px] text-cyan-200">
                    <Phone className="w-3 h-3" />
                    <span><T>Диспетчер:</T> <strong className="font-mono text-white"><PhoneLink phone={siteSettings.dispatcherPhone}>{siteSettings.dispatcherPhone}</PhoneLink></strong></span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: WASTE MANAGEMENT */}
        {activeTab === 'waste' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {bulkyNotice && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-between text-xs font-semibold">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{bulkyNotice}</span>
                </div>
                <button onClick={() => setBulkyNotice(null)} className="text-stone-500 hover:text-stone-800 cursor-pointer">
                  <T>Жабуу</T>
                </button>
              </div>
            )}

            {/* Waste Collection Schedule Table */}
            <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                  <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-emerald-700" />
                    <span><T>Таштанды чыгаруу графиги</T></span>
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    <T>Таштандыны графиктеги күнү эртең менен саат 8:00гө чейин дарбаза алдына чыгарып коюңуз</T>
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-bold text-emerald-900 bg-emerald-100/80 px-3 py-1.5 rounded-lg border border-emerald-200">
                    <T>Тариф:</T> <strong className="font-mono text-emerald-950 font-black">{wasteRate} сом</strong> / 1 адамга айына
                  </span>
                </div>
              </div>

              <SectionEditButton tab="waste" label="Графикти өзгөртүү" title="Таштанды графиги" className="mb-3" />
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-stone-700">
                  <thead className="bg-stone-50 text-stone-500 uppercase tracking-wider text-[11px] border-y border-stone-200">
                    <tr>
                      <th className="py-2.5 px-4 font-bold text-stone-900"><T>Апта күнү</T></th>
                      <th className="py-2.5 px-4"><T>Көчөлөр</T></th>
                      <th className="py-2.5 px-4"><T>Убактысы</T></th>
                      <th className="py-2.5 px-4"><T>Техника</T></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {content.wasteSchedule.map((item) => (
                      <tr key={item.id} className="hover:bg-stone-50/70 transition-colors">
                        <td className="py-3 px-4 font-bold text-emerald-900 whitespace-nowrap">
                          {item.day}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-wrap gap-1.5">
                            {item.streets.map((st, i) => (
                              <span key={i} className="inline-block bg-stone-100 px-2 py-0.5 rounded text-[11px] text-stone-800">
                                {st}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono font-medium text-stone-600 whitespace-nowrap">
                          {item.time}
                        </td>
                        <td className="py-3 px-4 text-stone-500 text-[11px]">
                          {item.truckModel}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bulky Waste Order Form & Rules */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Order bulky waste (6 cols) */}
              <div className="lg:col-span-6 bg-white rounded-2xl p-6 border border-stone-200 shadow-sm space-y-4">
                <div className="border-b border-stone-100 pb-3">
                  <h4 className="text-sm font-bold text-stone-900">
                    <T>Ири таштандыны чыгартуу</T>
                  </h4>
                  <p className="text-xs text-stone-500 mt-0.5">
                    <T>Курулуш калдыгы, бутак же эски эмерек болсо — КамАЗ же Портер чакырыңыз</T>
                  </p>
                </div>

                <form onSubmit={handleBulkySubmit} className="space-y-3 text-xs">
                  <div>
                    <label className="block text-stone-700 font-semibold mb-1"><T>Калдыктын түрү:</T></label>
                    <select
                      value={bulkyType}
                      onChange={(e) => setBulkyType(e.target.value)}
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs"
                    >
                      <option value="Курулуш калдыктары (кыш, бетон, топурак)">Курулуш калдыктары (кыш, бетон, топурак)</option>
                      <option value="Бак-дарак бутактары, жалбырактар">Бак-дарак бутактары, жалбырактар, чөп</option>
                      <option value="Эски эмеректер жана тиричилик техникалары">Эски эмеректер жана тиричилик техникалары</option>
                      <option value="Короодон көң жана чарбалык калдыктар">Короодон көң жана чарбалык калдыктар</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-stone-700 font-semibold mb-1"><T>Дарегиңиз (көчө, үй):</T></label>
                    <input
                      type="text"
                      required
                      value={bulkyAddress}
                      onChange={(e) => setBulkyAddress(e.target.value)}
                      placeholder="Мисалы: Жибек-Жолу көчөсү, 34-үй"
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-stone-700 font-semibold mb-1"><T>Байланыш телефону:</T></label>
                    <input
                      type="tel"
                      inputMode="tel"
                      required
                      value={bulkyPhone}
                      onChange={(e) => setBulkyPhone(e.target.value)}
                      placeholder="+996 (___) __-__-__"
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs font-mono"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs shadow-xs transition-colors cursor-pointer"
                  >
                    <T>Заказ жөнөтүү</T>
                  </button>
                </form>
              </div>

              {/* Sorting & Eco Guidelines (6 cols) */}
              <div className="lg:col-span-6 bg-white rounded-2xl p-6 border border-stone-200 shadow-sm space-y-4">
                <h4 className="text-sm font-bold text-stone-900">
                  <T>Таштанды боюнча эрежелер</T>
                </h4>
                <div className="space-y-3 text-xs text-stone-600">
                  <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 flex items-start gap-3">
                    <div className="w-6 h-6 rounded-md bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 font-bold">1</div>
                    <div>
                      <strong className="text-stone-900 block"><T>Пластикти өзүнчө чогултуңуз</T></strong>
                      <p className="text-[11px] mt-0.5"><T>Бөтөлкөлөрдү кысып, атайын тор челектерге салыңыз.</T></p>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 flex items-start gap-3">
                    <div className="w-6 h-6 rounded-md bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 font-bold">2</div>
                    <div>
                      <strong className="text-stone-900 block"><T>Ысык күлдү салбаңыз</T></strong>
                      <p className="text-[11px] mt-0.5"><T>Өрт чыкпашы үчүн күл толук муздагандан кийин бекем капка салып чыгарыңыз.</T></p>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 flex items-start gap-3">
                    <div className="w-6 h-6 rounded-md bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 font-bold">3</div>
                    <div>
                      <strong className="text-stone-900 block"><T>Арыкка таштанды таштабаңыз</T></strong>
                      <p className="text-[11px] mt-0.5"><T>Арыкка же жол четине таштанды таштагандарга мыйзам боюнча айып салынат.</T></p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
