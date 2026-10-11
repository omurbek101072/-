import React, { useState } from 'react';
import { SubscriberAccount, PaymentTransaction } from '../types';
import { useApp } from '../context/AppContext';
import { EditableText } from './EditableText';
import { Search, CreditCard, CheckCircle2, QrCode, Smartphone, Building, RefreshCw, AlertCircle, ArrowRight, UserCheck, ShieldCheck, History } from 'lucide-react';
import { ReceiptModal } from './ReceiptModal';

interface OnlinePaymentHubProps {
  initialServiceType?: 'water' | 'waste' | 'pasture' | 'machinery';
  initialAmount?: number;
  initialDetails?: string;
}

export const OnlinePaymentHub: React.FC<OnlinePaymentHubProps> = ({
  initialServiceType,
  initialAmount,
  initialDetails
}) => {
  const { subscribers, transactions, addPayment } = useApp();

  const [searchQuery, setSearchQuery] = useState('1042');
  const [selectedSubscriber, setSelectedSubscriber] = useState<SubscriberAccount | null>(subscribers[0] || null);
  const [serviceType, setServiceType] = useState<'water' | 'waste' | 'pasture' | 'machinery'>(initialServiceType || 'water');
  const [customAmount, setCustomAmount] = useState<number>(initialAmount || 240);
  const [customPayerName, setCustomPayerName] = useState(subscribers[0]?.fullName || '');
  const [customPayerPhone, setCustomPayerPhone] = useState(subscribers[0]?.phone || '+996 ');
  const [paymentMethod, setPaymentMethod] = useState<'MBank' | 'Optima24' | 'O!Dengi' | 'Balance.kg' | 'Элсом' | 'Банк картасы'>('MBank');
  const [paymentDetails, setPaymentDetails] = useState<string>(initialDetails || 'Таза суу карызын төлөө');
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeReceipt, setActiveReceipt] = useState<PaymentTransaction | null>(null);
  const [paymentSuccessNotice, setPaymentSuccessNotice] = useState<string | null>(null);

  // Search for subscriber account
  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = searchQuery.trim().toLowerCase();
    if (!query) return;

    const found = subscribers.find(
      s => s.id.toLowerCase() === query || 
           s.fullName.toLowerCase().includes(query) ||
           s.address.toLowerCase().includes(query)
    );

    if (found) {
      setSelectedSubscriber(found);
      setCustomPayerName(found.fullName);
      setCustomPayerPhone(found.phone);
      // Auto-set amount based on service debt
      if (serviceType === 'water') {
        const debt = Math.abs(Math.min(0, found.waterBalance));
        setCustomAmount(debt > 0 ? debt : 200);
        setPaymentDetails(`Суу акысы (Лицевой эсеп: ${found.id})`);
      } else if (serviceType === 'waste') {
        const debt = Math.abs(Math.min(0, found.wasteBalance));
        setCustomAmount(debt > 0 ? debt : found.wasteFamilyMembers * found.wasteTariffPerPerson);
        setPaymentDetails(`Таштанды чыгаруу акысы (${found.wasteFamilyMembers} адам)`);
      } else if (serviceType === 'pasture') {
        const debt = Math.abs(Math.min(0, found.pastureBalance));
        setCustomAmount(debt > 0 ? debt : 500);
        setPaymentDetails(`Жайыт пайдалануу акысы`);
      }
    } else {
      setSelectedSubscriber(null);
    }
  };

  // Change service type
  const handleServiceChange = (type: 'water' | 'waste' | 'pasture' | 'machinery') => {
    setServiceType(type);
    if (selectedSubscriber) {
      if (type === 'water') {
        const amt = Math.abs(Math.min(0, selectedSubscriber.waterBalance));
        setCustomAmount(amt > 0 ? amt : 250);
        setPaymentDetails(`Таза суу акысы (${selectedSubscriber.address})`);
      } else if (type === 'waste') {
        const amt = Math.abs(Math.min(0, selectedSubscriber.wasteBalance));
        setCustomAmount(amt > 0 ? amt : selectedSubscriber.wasteFamilyMembers * 35);
        setPaymentDetails(`Таштанды акысы (${selectedSubscriber.wasteFamilyMembers} киши)`);
      } else if (type === 'pasture') {
        const amt = Math.abs(Math.min(0, selectedSubscriber.pastureBalance));
        setCustomAmount(amt > 0 ? amt : 750);
        setPaymentDetails(`Жайыт комитетине төлөм`);
      } else {
        setCustomAmount(1800);
        setPaymentDetails(`Атайын техниканы ижарага алуу үчүн алдын ала төлөм`);
      }
    }
  };

  // Execute payment simulation
  const handleExecutePayment = () => {
    if (customAmount <= 0) return;
    setIsProcessing(true);

    const payerName = selectedSubscriber?.fullName || customPayerName || 'Айыл тургуну';
    const payerPhone = selectedSubscriber?.phone || customPayerPhone || '+996 (700) 00-00-00';
    const accountId = selectedSubscriber?.id || 'МУН-9901';

    let sName = 'Таза суу акысы';
    if (serviceType === 'waste') sName = 'Катуу тиричилик калдыктары';
    if (serviceType === 'pasture') sName = 'Жайыт пайдалануу билети';
    if (serviceType === 'machinery') sName = 'Атайын техника ижарасы';

    setTimeout(() => {
      const newTx: PaymentTransaction = {
        id: `tx-${Date.now().toString().slice(-6)}`,
        receiptNumber: `TZL-2026-${Math.floor(10000 + Math.random() * 90000)}`,
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
        payerName,
        payerPhone,
        accountId,
        serviceType,
        serviceName: sName,
        amount: Number(customAmount),
        paymentMethod,
        status: 'Төлөндү',
        details: paymentDetails
      };

      addPayment(newTx);
      setActiveReceipt(newTx);
      setIsProcessing(false);
      setPaymentSuccessNotice(`Төлөм ийгиликтүү өттү! Квитанция № ${newTx.receiptNumber}`);
    }, 600);
  };

  return (
    <section id="payments" className="py-12 bg-stone-100/70 border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Section title */}
        <div className="max-w-3xl mb-8">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 uppercase tracking-wider">
            <span>Санариптик кызматтар</span>
            <span aria-hidden="true">·</span>
            <span>24/7 Коопсуз төлөмдөр</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 mt-1" style={{ textWrap: 'balance' }}>
            <EditableText settingKey="paymentSectionTitle" label="Онлайн төлөм башкы аталышы" />
          </h2>
          <p className="text-sm text-stone-600 mt-2">
            <EditableText settingKey="paymentSectionSubtitle" multiline label="Онлайн төлөм түшүндүрмөсү" />
          </p>
        </div>

        {paymentSuccessNotice && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span className="text-sm font-semibold">{paymentSuccessNotice}</span>
            </div>
            <button
              onClick={() => setPaymentSuccessNotice(null)}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-900 cursor-pointer"
            >
              Жабуу
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Account Search & Subscriber Status (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Search Box */}
            <div className="bg-white rounded-2xl p-5 border border-stone-200/90 shadow-sm">
              <h3 className="text-sm font-bold text-stone-900 mb-3 flex items-center justify-between">
                <span>1. Лицевой эсеп же фамилия боюнча издөө</span>
                <span className="text-[11px] text-stone-400 font-normal">Мисал: 1042, 1043</span>
              </h3>
              
              <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Эсеп номери же фамилия..."
                    className="w-full pl-9 pr-3 py-2 text-sm bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors cursor-pointer"
                >
                  Издөө
                </button>
              </form>

              {/* Sample Quick Account Selectors */}
              <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs">
                <span className="text-stone-400 text-[11px]">Даяр эсептер:</span>
                {subscribers.map(s => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      setSearchQuery(s.id);
                      setSelectedSubscriber(s);
                      setCustomPayerName(s.fullName);
                      setCustomPayerPhone(s.phone);
                    }}
                    className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors cursor-pointer ${
                      selectedSubscriber?.id === s.id
                        ? 'bg-emerald-700 text-white font-bold'
                        : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                    }`}
                  >
                    №{s.id} ({s.fullName.split(' ')[0]})
                  </button>
                ))}
              </div>
            </div>

            {/* Subscriber Details Card */}
            {selectedSubscriber ? (
              <div className="bg-white rounded-2xl p-5 border border-stone-200/90 shadow-sm space-y-4">
                <div className="flex items-start justify-between border-b border-stone-100 pb-3">
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                      <UserCheck className="w-4 h-4" />
                      <span>Абоненттин жеке эсеби табылды</span>
                    </div>
                    <h4 className="text-base font-bold text-stone-900 mt-1">{selectedSubscriber.fullName}</h4>
                    <p className="text-xs text-stone-500 mt-0.5">{selectedSubscriber.address}</p>
                    <p className="text-xs font-mono text-stone-500">{selectedSubscriber.phone}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-stone-400 uppercase block font-mono">Лицевой эсеп</span>
                    <span className="text-lg font-extrabold text-stone-900 font-mono">№{selectedSubscriber.id}</span>
                  </div>
                </div>

                {/* Debts & Balances */}
                <div className="space-y-2.5">
                  {/* Water */}
                  <div className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-colors ${
                    serviceType === 'water' ? 'border-cyan-500 bg-cyan-50/50' : 'border-stone-200 bg-stone-50'
                  }`}>
                    <div>
                      <div className="font-bold text-stone-800">Таза суу балансы</div>
                      <div className="text-[11px] text-stone-500 mt-0.5">
                        Акыркы көрсөткүч: <strong className="font-mono text-stone-700">{selectedSubscriber.waterLastMeterReading} м³</strong> ({selectedSubscriber.waterTariffPerM3} с/м³)
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-mono font-bold text-sm tabular-nums ${
                        selectedSubscriber.waterBalance < 0 ? 'text-rose-600' : 'text-emerald-700'
                      }`}>
                        {selectedSubscriber.waterBalance < 0 
                          ? `${Math.abs(selectedSubscriber.waterBalance)} сом карыз` 
                          : `${selectedSubscriber.waterBalance} сом баланс`}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleServiceChange('water')}
                        className="text-[11px] font-semibold text-emerald-700 hover:underline mt-0.5 cursor-pointer"
                      >
                        Төлөөгө тандоо
                      </button>
                    </div>
                  </div>

                  {/* Waste */}
                  <div className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-colors ${
                    serviceType === 'waste' ? 'border-emerald-500 bg-emerald-50/50' : 'border-stone-200 bg-stone-50'
                  }`}>
                    <div>
                      <div className="font-bold text-stone-800">Таштанды чыгаруу балансы</div>
                      <div className="text-[11px] text-stone-500 mt-0.5">
                        Үй-бүлө: <strong className="font-mono text-stone-700">{selectedSubscriber.wasteFamilyMembers} адам</strong> ({selectedSubscriber.wasteTariffPerPerson} с/адам)
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-mono font-bold text-sm tabular-nums ${
                        selectedSubscriber.wasteBalance < 0 ? 'text-rose-600' : 'text-emerald-700'
                      }`}>
                        {selectedSubscriber.wasteBalance < 0 
                          ? `${Math.abs(selectedSubscriber.wasteBalance)} сом карыз` 
                          : `Төлөнгөн`}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleServiceChange('waste')}
                        className="text-[11px] font-semibold text-emerald-700 hover:underline mt-0.5 cursor-pointer"
                      >
                        Төлөөгө тандоо
                      </button>
                    </div>
                  </div>

                  {/* Pasture */}
                  <div className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-colors ${
                    serviceType === 'pasture' ? 'border-amber-500 bg-amber-50/50' : 'border-stone-200 bg-stone-50'
                  }`}>
                    <div>
                      <div className="font-bold text-stone-800">Жайыт пайдалануу акысы</div>
                      <div className="text-[11px] text-stone-500 mt-0.5">
                        Катталган мал: {selectedSubscriber.registeredLivestock.cattle} уй, {selectedSubscriber.registeredLivestock.horses} жылкы, {selectedSubscriber.registeredLivestock.sheepGoats} кой
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-mono font-bold text-sm tabular-nums ${
                        selectedSubscriber.pastureBalance < 0 ? 'text-rose-600' : 'text-stone-700'
                      }`}>
                        {selectedSubscriber.pastureBalance < 0 
                          ? `${Math.abs(selectedSubscriber.pastureBalance)} сом` 
                          : `Төлөмдө`}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleServiceChange('pasture')}
                        className="text-[11px] font-semibold text-amber-700 hover:underline mt-0.5 cursor-pointer"
                      >
                        Төлөөгө тандоо
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-amber-900 text-xs space-y-2">
                <div className="font-bold flex items-center gap-1.5 text-sm">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <span>Лицевой эсеп тандалган жок</span>
                </div>
                <p>
                  Эгерде эсеп номериңизди билбесеңиз, оң жактагы формага аты-жөнүңүздү жана кызматты тандап түз төлөңүз.
                </p>
              </div>
            )}

            {/* Security Notice */}
            <div className="p-4 rounded-xl bg-white border border-stone-200 text-xs text-stone-500 flex items-center gap-3">
              <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0" />
              <div>
                <p className="font-semibold text-stone-800">Коопсуз мамлекеттик шлюз</p>
                <p className="text-[11px]">Бардык төлөмдөр Улуттук Банктын лицензияланган төлөм операторлору аркылуу дароо кабыл алынат.</p>
              </div>
            </div>
          </div>

          {/* Right Column: Payment Form, Gateway & QR Simulator (7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-2xl p-6 sm:p-7 border border-stone-200/90 shadow-sm space-y-6">
            <div>
              <h3 className="text-base font-bold text-stone-900">2. Кызматты жана төлөм суммасын тандоо</h3>
              <p className="text-xs text-stone-500 mt-0.5">Керектүү багытты басып, сумманы тактаңыз</p>
            </div>

            {/* Service selector segmented tabs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => handleServiceChange('water')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  serviceType === 'water'
                    ? 'border-emerald-600 bg-emerald-50/70 text-emerald-950 font-bold shadow-xs'
                    : 'border-stone-200 hover:border-stone-300 text-stone-700 bg-stone-50/50'
                }`}
              >
                <span className="block text-xs font-semibold">Таза суу</span>
                <span className="block text-[11px] text-stone-500 font-normal mt-0.5">Водомер / норма</span>
              </button>

              <button
                type="button"
                onClick={() => handleServiceChange('waste')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  serviceType === 'waste'
                    ? 'border-emerald-600 bg-emerald-50/70 text-emerald-950 font-bold shadow-xs'
                    : 'border-stone-200 hover:border-stone-300 text-stone-700 bg-stone-50/50'
                }`}
              >
                <span className="block text-xs font-semibold">Таштанды</span>
                <span className="block text-[11px] text-stone-500 font-normal mt-0.5">35 сом/адам</span>
              </button>

              <button
                type="button"
                onClick={() => handleServiceChange('pasture')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  serviceType === 'pasture'
                    ? 'border-emerald-600 bg-emerald-50/70 text-emerald-950 font-bold shadow-xs'
                    : 'border-stone-200 hover:border-stone-300 text-stone-700 bg-stone-50/50'
                }`}
              >
                <span className="block text-xs font-semibold">Жайыт акысы</span>
                <span className="block text-[11px] text-stone-500 font-normal mt-0.5">Мал башына</span>
              </button>

              <button
                type="button"
                onClick={() => handleServiceChange('machinery')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  serviceType === 'machinery'
                    ? 'border-emerald-600 bg-emerald-50/70 text-emerald-950 font-bold shadow-xs'
                    : 'border-stone-200 hover:border-stone-300 text-stone-700 bg-stone-50/50'
                }`}
              >
                <span className="block text-xs font-semibold">Техника ижарасы</span>
                <span className="block text-[11px] text-stone-500 font-normal mt-0.5">Экскаватор/КамАЗ</span>
              </button>
            </div>

            {/* Payer info inputs (if not selected subscriber) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Төлөөчүнүн аты-жөнү:</label>
                <input
                  type="text"
                  value={selectedSubscriber ? selectedSubscriber.fullName : customPayerName}
                  onChange={(e) => setCustomPayerName(e.target.value)}
                  placeholder="Фамилия Аты Атасынын аты"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Байланыш телефону (SMS чек үчүн):</label>
                <input
                  type="text"
                  value={selectedSubscriber ? selectedSubscriber.phone : customPayerPhone}
                  onChange={(e) => setCustomPayerPhone(e.target.value)}
                  placeholder="+996 (___) __-__-__"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white text-xs font-mono"
                />
              </div>
            </div>

            {/* Amount input & Quick Chips */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Төлөнүүчү сумма (сом):
              </label>
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <input
                    type="number"
                    min="10"
                    step="10"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(Number(e.target.value))}
                    className="w-full px-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white text-lg font-bold font-mono text-stone-900"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-stone-400 text-sm">
                    СОМ
                  </span>
                </div>
              </div>

              {/* Quick Sum presets */}
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className="text-[11px] text-stone-400">Тез тандоо:</span>
                {[105, 240, 500, 1000, 2000, 5000].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setCustomAmount(val)}
                    className="px-2.5 py-1 text-[11px] font-mono font-medium rounded-md bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors cursor-pointer"
                  >
                    {val} с.
                  </button>
                ))}
              </div>
            </div>

            {/* Payment Details Input */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Төлөм баяндамасы:</label>
              <input
                type="text"
                value={paymentDetails}
                onChange={(e) => setPaymentDetails(e.target.value)}
                placeholder="Мисалы: 2026-жылдын май айына чейин суу төлөмү..."
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white text-xs"
              />
            </div>

            {/* Payment Method Selector */}
            <div>
              <label className="block text-xs font-bold text-stone-900 mb-2">
                3. Төлөм ыкмасын тандаңыз (Кыргызстан банктары жана капчыктары):
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {[
                  { id: 'MBank', name: 'MBank', desc: 'QR же телефон номер' },
                  { id: 'Optima24', name: 'Оптима24', desc: 'Optima Bank' },
                  { id: 'O!Dengi', name: 'О!Деньги', desc: 'Мой О!' },
                  { id: 'Balance.kg', name: 'Balance.kg', desc: 'Билайн капчык' },
                  { id: 'Элсом', name: 'Элсом', desc: 'KICB капчык' },
                  { id: 'Банк картасы', name: 'Элкарт / Visa', desc: 'Банк картасы' }
                ].map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setPaymentMethod(item.id as any)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      paymentMethod === item.id
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold ring-2 ring-emerald-600/20'
                        : 'border-stone-200 hover:border-stone-300 text-stone-700 bg-stone-50/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold">{item.name}</span>
                      {paymentMethod === item.id && (
                        <div className="w-2 h-2 rounded-full bg-emerald-600" />
                      )}
                    </div>
                    <span className="text-[10px] text-stone-500 font-normal block mt-0.5">{item.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* QR simulation preview & Pay Button */}
            <div className="bg-stone-50 rounded-xl p-4 border border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 bg-white border border-stone-300 rounded-lg p-1.5 flex flex-col items-center justify-center shrink-0 shadow-xs">
                  <QrCode className="w-12 h-12 text-stone-800" />
                </div>
                <div>
                  <div className="text-xs font-bold text-stone-800">
                    {paymentMethod} аркылуу тез төлөө
                  </div>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    Сумма: <strong className="font-mono text-emerald-700 text-sm">{customAmount.toLocaleString('ru-RU')} сом</strong>
                  </p>
                  <p className="text-[10px] text-stone-400">Комиссия: 0 сом (айыл өкмөтү тарабынан субсидияланган)</p>
                </div>
              </div>

              <button
                type="button"
                disabled={isProcessing || customAmount <= 0}
                onClick={handleExecutePayment}
                className="w-full sm:w-auto px-6 py-3 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold rounded-xl shadow-md transition-all text-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Төлөм аткарылууда...</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    <span>{customAmount.toLocaleString('ru-RU')} с. Төлөө</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Recent Transactions Log */}
        <div className="mt-12 bg-white rounded-2xl p-6 border border-stone-200/90 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 uppercase tracking-wider">
                <History className="w-4 h-4" />
                <span>Ачык финансылык реестр</span>
              </div>
              <h3 className="text-lg font-bold text-stone-900 mt-0.5">Акыркы төлөнгөн квитанциялар</h3>
            </div>
            <span className="text-xs text-stone-500">
              Төлөм жасалгандан кийин электрондук чек автоматтык түрдө жаралат
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-stone-700">
              <thead className="bg-stone-50 text-stone-500 uppercase tracking-wider text-[11px] border-y border-stone-200">
                <tr>
                  <th className="py-2.5 px-3">Квитанция №</th>
                  <th className="py-2.5 px-3">Убактысы</th>
                  <th className="py-2.5 px-3">Төлөөчү</th>
                  <th className="py-2.5 px-3">Кызмат</th>
                  <th className="py-2.5 px-3">Ыкмасы</th>
                  <th className="py-2.5 px-3 text-right">Суммасы</th>
                  <th className="py-2.5 px-3 text-center">Аракет</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-stone-50/60 transition-colors">
                    <td className="py-3 px-3 font-mono font-medium text-stone-900">
                      {tx.receiptNumber}
                    </td>
                    <td className="py-3 px-3 font-mono text-stone-500 whitespace-nowrap">
                      {tx.timestamp}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-stone-900">{tx.payerName}</div>
                      <div className="text-[10px] text-stone-400 font-mono">{tx.payerPhone}</div>
                    </td>
                    <td className="py-3 px-3 max-w-[200px] truncate" title={tx.serviceName}>
                      {tx.serviceName}
                    </td>
                    <td className="py-3 px-3">
                      <span className="inline-block text-[11px] font-medium text-stone-700">
                        {tx.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700 tabular-nums text-sm">
                      {tx.amount.toLocaleString('ru-RU')} сом
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => setActiveReceipt(tx)}
                        className="px-2.5 py-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-md transition-colors cursor-pointer"
                      >
                        Чекти көрүү
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Printable Receipt Modal */}
      {activeReceipt && (
        <ReceiptModal
          transaction={activeReceipt}
          onClose={() => setActiveReceipt(null)}
        />
      )}
    </section>
  );
};
