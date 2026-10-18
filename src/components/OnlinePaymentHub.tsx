import React, { useEffect, useState } from 'react';
import { T } from './AdminInline';
import { getMyAccounts, rememberAccount } from '../utils/myDevice';
import { SubscriberAccount, PaymentTransaction } from '../types';
import { useApp } from '../context/AppContext';
import { EditableText } from './EditableText';
import { Search, CreditCard, CheckCircle2, QrCode, Smartphone, Building, RefreshCw, AlertCircle, ArrowRight, UserCheck, ShieldCheck, History } from 'lucide-react';
import { ReceiptModal } from './ReceiptModal';
import { generateId, nowTimestamp } from '../utils/ids';
import { maskName, maskPhone, maskAddress } from '../utils/privacy';

// Төлөм тутуму (MBank, Optima ж.б.) азырынча туташтырыла элек.
// Чыныгы төлөм шлюзу кошулганда бул желекти false кылыңыз.
const PAYMENTS_DEMO_MODE = true;

interface OnlinePaymentHubProps {
  initialServiceType?: 'water' | 'waste' | 'pasture' | 'machinery';
  initialAmount?: number;
  initialDetails?: string;
  initialOrderId?: string;
  initialAccountId?: string;
}

export const OnlinePaymentHub: React.FC<OnlinePaymentHubProps> = ({
  initialServiceType,
  initialAmount,
  initialDetails,
  initialOrderId,
  initialAccountId
}) => {
  const { subscribers, transactions, isAdminLoggedIn, lookupSubscriber } = useApp();

  const [searchQuery, setSearchQuery] = useState(initialAccountId || '');
  const [searchNotFound, setSearchNotFound] = useState(false);
  // Эл үчүн абонент серверден (аты жашырылган түрдө) алынат.
  // Админ үчүн толук маалымат анын жүктөлгөн тизмесинен алынат.
  const [selectedSubscriberId, setSelectedSubscriberId] = useState<string | null>(null);
  const [lookedUp, setLookedUp] = useState<SubscriberAccount | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const selectedSubscriber: SubscriberAccount | null = selectedSubscriberId
    ? (isAdminLoggedIn ? subscribers.find(s => s.id === selectedSubscriberId) : undefined) || lookedUp
    : null;
  const [serviceType, setServiceType] = useState<'water' | 'waste' | 'pasture' | 'machinery'>(initialServiceType || 'water');
  const [customAmount, setCustomAmount] = useState<number>(initialAmount || 240);
  const pendingOrderId = initialOrderId;
  const [customPayerName, setCustomPayerName] = useState('');
  const [customPayerPhone, setCustomPayerPhone] = useState('+996 ');
  const [amountError, setAmountError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'MBank' | 'Optima24' | 'O!Dengi' | 'Balance.kg' | 'Элсом' | 'Банк картасы'>('MBank');
  const [paymentDetails, setPaymentDetails] = useState<string>(initialDetails || 'Таза суу карызын төлөө');
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeReceipt, setActiveReceipt] = useState<PaymentTransaction | null>(null);
  const [paymentSuccessNotice, setPaymentSuccessNotice] = useState<string | null>(null);

  const applyFoundSubscriber = (found: SubscriberAccount) => {
    setSearchNotFound(false);
    setSelectedSubscriberId(found.id);
    setLookedUp(found);
    if (isAdminLoggedIn) {
      setCustomPayerName(found.fullName);
      setCustomPayerPhone(found.phone);
    }
    // Карыз боюнча сумманы автоматтык коюу
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
  };

  const findSubscriber = async (rawQuery: string, keepAmount = false) => {
    const query = rawQuery.trim().toLowerCase().replace(/^№/, '');
    if (!query) return;
    setSearchError(null);

    // Админ өзүнүн тизмесинен аты же дареги боюнча да издей алат
    if (isAdminLoggedIn) {
      const local = subscribers.find(
        s => s.id.toLowerCase() === query ||
             s.fullName.toLowerCase().includes(query) ||
             s.address.toLowerCase().includes(query)
      );
      if (local) {
        if (keepAmount) { setSelectedSubscriberId(local.id); setLookedUp(local); } else applyFoundSubscriber(local);
        return;
      }
    }

    // Эл үчүн: так эсеп номери боюнча гана, сервер аты-жөнүн жашырып берет
    setIsSearching(true);
    try {
      const found = await lookupSubscriber(query);
      if (found) {
        if (keepAmount) { setSearchNotFound(false); setSelectedSubscriberId(found.id); setLookedUp(found); }
        else applyFoundSubscriber(found);
      } else {
        setSelectedSubscriberId(null);
        setLookedUp(null);
        setSearchNotFound(true);
      }
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : 'Издөөдө ката кетти.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    findSubscriber(searchQuery);
  };

  // Башка бөлүмдөн эсеп номери менен келсе — эсепти дароо ачабыз (сумманы өзгөртпөй)
  useEffect(() => {
    if (initialAccountId) findSubscriber(initialAccountId, true);
  }, [initialAccountId]);

  const handleClearSubscriber = () => {
    setSelectedSubscriberId(null);
    setLookedUp(null);
    setSearchQuery('');
    setSearchNotFound(false);
  };

  // Change service type
  const handleServiceChange = (type: 'water' | 'waste' | 'pasture' | 'machinery') => {
    setServiceType(type);
    if (selectedSubscriber) {
      if (type === 'water') {
        const amt = Math.abs(Math.min(0, selectedSubscriber.waterBalance));
        setCustomAmount(amt > 0 ? amt : 250);
        setPaymentDetails(`Таза суу акысы (Лицевой эсеп: ${selectedSubscriber.id})`);
      } else if (type === 'waste') {
        const amt = Math.abs(Math.min(0, selectedSubscriber.wasteBalance));
        setCustomAmount(amt > 0 ? amt : selectedSubscriber.wasteFamilyMembers * selectedSubscriber.wasteTariffPerPerson);
        setPaymentDetails(`Таштанды акысы (${selectedSubscriber.wasteFamilyMembers} киши)`);
      } else if (type === 'pasture') {
        const amt = Math.abs(Math.min(0, selectedSubscriber.pastureBalance));
        setCustomAmount(amt > 0 ? amt : 750);
        setPaymentDetails(`Жайыт комитетине төлөм`);
      }
    }
    if (type === 'machinery' && !pendingOrderId) {
      setCustomAmount(1800);
      setPaymentDetails(`Атайын техниканы ижарага алуу үчүн алдын ала төлөм`);
    }
  };

  // Execute payment simulation
  const handleExecutePayment = () => {
    const amount = Math.round(Number(customAmount));
    if (!Number.isFinite(amount) || amount < 10) {
      setAmountError('Төлөм суммасы кеминде 10 сом болушу керек.');
      return;
    }
    if (amount > 1_000_000) {
      setAmountError('Сумма өтө чоң. Текшерип кайра жазыңыз.');
      return;
    }
    setAmountError(null);
    setIsProcessing(true);

    const payerName = customPayerName.trim() || selectedSubscriber?.fullName || 'Айыл тургуну';
    const payerPhone = customPayerPhone.trim().length > 5 ? customPayerPhone.trim() : (selectedSubscriber?.phone || '-');
    // Техника ижарасы абоненттин коммуналдык балансына кошулбайт
    const accountId = serviceType === 'machinery'
      ? (pendingOrderId || 'ТЕХНИКА')
      : (selectedSubscriber?.id || 'ЭСЕПСИЗ');

    let sName = 'Таза суу акысы';
    if (serviceType === 'waste') sName = 'Катуу тиричилик калдыктары';
    if (serviceType === 'pasture') sName = 'Жайыт пайдалануу билети';
    if (serviceType === 'machinery') sName = 'Атайын техника ижарасы';

    setTimeout(() => {
      const newTx: PaymentTransaction = {
        id: `tx-${Date.now()}`,
        receiptNumber: generateId(PAYMENTS_DEMO_MODE ? 'DEMO' : 'TZL', transactions.map(t => t.receiptNumber)),
        timestamp: nowTimestamp(),
        payerName,
        payerPhone,
        accountId,
        serviceType,
        serviceName: sName,
        amount,
        paymentMethod,
        status: 'Төлөндү',
        details: paymentDetails
      };

      // Демо режимде төлөм базага жазылбайт: карыз жалган төлөм менен жабылып калбашы керек.
      // Чыныгы төлөм банктан келген ырастоо (webhook) аркылуу же админдин кассасы аркылуу гана катталат.
      // Техника заказы да ошол учурда гана «төлөндү» болот.
      setActiveReceipt(newTx);
      setIsProcessing(false);
      setPaymentSuccessNotice(
        PAYMENTS_DEMO_MODE
          ? `Демо квитанция № ${newTx.receiptNumber} түзүлдү. Чыныгы төлөм катталган жок.`
          : `Төлөм ийгиликтүү өттү! Квитанция № ${newTx.receiptNumber}`
      );
    }, 600);
  };

  return (
    <section id="payments" className="py-12 bg-stone-100/70 border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Section title */}
        <div className="max-w-3xl mb-8">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 uppercase tracking-wider">
            <span><T>Онлайн кызматтар</T></span>
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

        {PAYMENTS_DEMO_MODE && (
          <div className="mb-6 p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <T>Демо режим: онлайн төлөм азырынча банкка туташтырыла элек, чыныгы акча которулбайт.
              Төлөө үчүн ишкананын кассасына же банк реквизиттери аркылуу кайрылыңыз.</T>
            </span>
          </div>
        )}

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
              <T>Жабуу</T>
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Account Search & Subscriber Status (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Search Box */}
            <div className="bg-white rounded-2xl p-5 border border-stone-200/90 shadow-sm">
              <h3 className="text-sm font-bold text-stone-900 mb-3 flex items-center justify-between">
                <span>1. Лицевой эсеп номери боюнча издөө</span>
                <span className="text-[11px] text-stone-400 font-normal"><T>Квитанциядагы номер</T></span>
              </h3>
              
              <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={isAdminLoggedIn ? 'Эсеп номери, фамилия же дарек...' : 'Эсеп номери (мисалы: 1042)...'}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSearching}
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 rounded-lg transition-colors cursor-pointer"
                >
                  {isSearching ? '...' : 'Издөө'}
                </button>
              </form>

              {/* Sample Quick Account Selectors */}
              {searchError && (
                <p className="mt-2 text-[11px] text-rose-600 font-semibold">{searchError}</p>
              )}

              {searchNotFound && (
                <p className="mt-2 text-[11px] text-rose-600 font-semibold">
                  <T>Мындай эсеп номери табылган жок. Квитанциядагы номерди текшериңиз.</T>
                </p>
              )}

              {/* Абоненттердин тизмеси администраторго гана көрүнөт */}
              {isAdminLoggedIn && (
              <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs">
                <span className="text-stone-400 text-[11px]"><T>Абоненттер (админ):</T></span>
                {subscribers.map(s => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      setSearchQuery(s.id);
                      setSearchNotFound(false);
                      setSelectedSubscriberId(s.id);
                      setLookedUp(s);
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
              )}
            </div>

            {/* Subscriber Details Card */}
            {selectedSubscriber ? (
              <div className="bg-white rounded-2xl p-5 border border-stone-200/90 shadow-sm space-y-4">
                <div className="flex items-start justify-between border-b border-stone-100 pb-3">
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                      <UserCheck className="w-4 h-4" />
                      <span><T>Абоненттин жеке эсеби табылды</T></span>
                    </div>
                    <h4 className="text-base font-bold text-stone-900 mt-1">
                      {isAdminLoggedIn ? selectedSubscriber.fullName : maskName(selectedSubscriber.fullName)}
                    </h4>
                    <p className="text-xs text-stone-500 mt-0.5">
                      {isAdminLoggedIn ? selectedSubscriber.address : maskAddress(selectedSubscriber.address)}
                    </p>
                    <p className="text-xs font-mono text-stone-500">
                      {isAdminLoggedIn ? selectedSubscriber.phone : maskPhone(selectedSubscriber.phone)}
                    </p>
                    <button
                      type="button"
                      onClick={handleClearSubscriber}
                      className="mt-1 text-[11px] font-semibold text-stone-500 hover:text-rose-600 underline cursor-pointer"
                    >
                      <T>Башка эсеп тандоо</T>
                    </button>
                    <RememberAccountButton id={selectedSubscriber.id} />
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-stone-400 uppercase block font-mono"><T>Лицевой эсеп</T></span>
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
                      <div className="font-bold text-stone-800"><T>Таза суу балансы</T></div>
                      <div className="text-[11px] text-stone-500 mt-0.5">
                        <T>Акыркы көрсөткүч:</T> <strong className="font-mono text-stone-700">{selectedSubscriber.waterLastMeterReading} м³</strong> ({selectedSubscriber.waterTariffPerM3} с/м³)
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
                        <T>Төлөөгө тандоо</T>
                      </button>
                    </div>
                  </div>

                  {/* Waste */}
                  <div className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-colors ${
                    serviceType === 'waste' ? 'border-emerald-500 bg-emerald-50/50' : 'border-stone-200 bg-stone-50'
                  }`}>
                    <div>
                      <div className="font-bold text-stone-800"><T>Таштанды чыгаруу балансы</T></div>
                      <div className="text-[11px] text-stone-500 mt-0.5">
                        <T>Үй-бүлө:</T> <strong className="font-mono text-stone-700">{selectedSubscriber.wasteFamilyMembers} адам</strong> ({selectedSubscriber.wasteTariffPerPerson} с/адам)
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
                        <T>Төлөөгө тандоо</T>
                      </button>
                    </div>
                  </div>

                  {/* Pasture */}
                  <div className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-colors ${
                    serviceType === 'pasture' ? 'border-amber-500 bg-amber-50/50' : 'border-stone-200 bg-stone-50'
                  }`}>
                    <div>
                      <div className="font-bold text-stone-800"><T>Жайыт пайдалануу акысы</T></div>
                      <div className="text-[11px] text-stone-500 mt-0.5">
                        <T>Катталган мал:</T> {selectedSubscriber.registeredLivestock.cattle} уй, {selectedSubscriber.registeredLivestock.horses} жылкы, {selectedSubscriber.registeredLivestock.sheepGoats} кой
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
                        <T>Төлөөгө тандоо</T>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-amber-900 text-xs space-y-2">
                <div className="font-bold flex items-center gap-1.5 text-sm">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <span><T>Лицевой эсеп тандалган жок</T></span>
                </div>
                <p>
                  <T>Эсеп номериңизди билбесеңиз, оң жактагы формага аты-жөнүңүздү жазып, кызматты тандаңыз.</T>
                </p>
              </div>
            )}

            {/* Security Notice */}
            <div className="p-4 rounded-xl bg-white border border-stone-200 text-xs text-stone-500 flex items-center gap-3">
              <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0" />
              <div>
                <p className="font-semibold text-stone-800"><T>Жеке маалыматтар корголот</T></p>
                <p className="text-[11px]"><T>Эсеп так номери боюнча гана табылат, аты-жөнү жана телефону толук көрсөтүлбөйт.</T></p>
              </div>
            </div>
          </div>

          {/* Right Column: Payment Form, Gateway & QR Simulator (7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-2xl p-6 sm:p-7 border border-stone-200/90 shadow-sm space-y-6">
            <div>
              <h3 className="text-base font-bold text-stone-900">2. Кызматты жана төлөм суммасын тандоо</h3>
              <p className="text-xs text-stone-500 mt-0.5"><T>Керектүү багытты басып, сумманы тактаңыз</T></p>
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
                <span className="block text-xs font-semibold"><T>Таза суу</T></span>
                <span className="block text-[11px] text-stone-500 font-normal mt-0.5"><T>Водомер / норма</T></span>
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
                <span className="block text-xs font-semibold"><T>Таштанды</T></span>
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
                <span className="block text-xs font-semibold"><T>Жайыт акысы</T></span>
                <span className="block text-[11px] text-stone-500 font-normal mt-0.5"><T>Мал башына</T></span>
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
                <span className="block text-xs font-semibold"><T>Техника ижарасы</T></span>
                <span className="block text-[11px] text-stone-500 font-normal mt-0.5"><T>Экскаватор/КамАЗ</T></span>
              </button>
            </div>

            {/* Payer info inputs (if not selected subscriber) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1"><T>Төлөөчүнүн аты-жөнү:</T></label>
                <input
                  type="text"
                  value={customPayerName}
                  onChange={(e) => setCustomPayerName(e.target.value)}
                  placeholder="Фамилия Аты Атасынын аты"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1"><T>Телефонуңуз:</T></label>
                <input
                  type="text"
                  value={customPayerPhone}
                  inputMode="tel"
                  onChange={(e) => setCustomPayerPhone(e.target.value)}
                  placeholder="+996 (___) __-__-__"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white text-xs font-mono"
                />
              </div>
            </div>

            {/* Amount input & Quick Chips */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                <T>Төлөнүүчү сумма (сом):</T>
              </label>
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <input
                    type="number"
                    min="10"
                    step="10"
                    value={customAmount}
                    onChange={(e) => {
                      setCustomAmount(Number(e.target.value));
                      setAmountError(null);
                    }}
                    className="w-full px-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white text-lg font-bold font-mono text-stone-900"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-stone-400 text-sm">
                    СОМ
                  </span>
                </div>
              </div>

              {amountError && (
                <p className="mt-1 text-[11px] text-rose-600 font-semibold">{amountError}</p>
              )}

              {/* Quick Sum presets */}
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className="text-[11px] text-stone-400"><T>Тез тандоо:</T></span>
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
              <label className="block text-xs font-semibold text-stone-700 mb-1"><T>Төлөм баяндамасы:</T></label>
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
                    <T>Сумма:</T> <strong className="font-mono text-emerald-700 text-sm">{(customAmount || 0).toLocaleString('ru-RU')} сом</strong>
                  </p>
                  <p className="text-[10px] text-stone-400"><T>Төлөгөндөн кийин электрондук квитанция берилет.</T></p>
                </div>
              </div>

              <button
                type="button"
                disabled={isProcessing || !(customAmount > 0)}
                onClick={handleExecutePayment}
                className="w-full sm:w-auto px-6 py-3 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold rounded-xl shadow-md transition-all text-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span><T>Төлөм аткарылууда...</T></span>
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    <span>{(customAmount || 0).toLocaleString('ru-RU')} с. {PAYMENTS_DEMO_MODE ? 'Төлөө (демо)' : 'Төлөө'}</span>
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
                <span><T>Ачык реестр</T></span>
              </div>
              <h3 className="text-lg font-bold text-stone-900 mt-0.5"><T>Акыркы төлөнгөн квитанциялар</T></h3>
            </div>
            <span className="text-xs text-stone-500">
              <T>Төлөгөндөн кийин электрондук квитанция өзү түзүлөт</T>
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-stone-700">
              <thead className="bg-stone-50 text-stone-500 uppercase tracking-wider text-[11px] border-y border-stone-200">
                <tr>
                  <th className="py-2.5 px-3"><T>Квитанция №</T></th>
                  <th className="py-2.5 px-3"><T>Убактысы</T></th>
                  <th className="py-2.5 px-3"><T>Төлөөчү</T></th>
                  <th className="py-2.5 px-3"><T>Кызмат</T></th>
                  <th className="py-2.5 px-3"><T>Ыкмасы</T></th>
                  <th className="py-2.5 px-3 text-right"><T>Суммасы</T></th>
                  <th className="py-2.5 px-3 text-center"><T>Аракет</T></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {transactions.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-stone-400"><T>Азырынча катталган төлөм жок</T></td>
                  </tr>
                )}
                {(isAdminLoggedIn ? transactions : transactions.slice(0, 10)).map((tx) => (
                  <tr key={tx.id} className="hover:bg-stone-50/60 transition-colors">
                    <td className="py-3 px-3 font-mono font-medium text-stone-900">
                      {tx.receiptNumber}
                    </td>
                    <td className="py-3 px-3 font-mono text-stone-500 whitespace-nowrap">
                      {tx.timestamp}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-stone-900">
                        {isAdminLoggedIn ? tx.payerName : maskName(tx.payerName)}
                      </div>
                      {isAdminLoggedIn && (
                        <div className="text-[10px] text-stone-400 font-mono">{tx.payerPhone}</div>
                      )}
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
                        onClick={() => setActiveReceipt(
                          isAdminLoggedIn
                            ? tx
                            : { ...tx, payerName: maskName(tx.payerName), payerPhone: maskPhone(tx.payerPhone) }
                        )}
                        className="px-2.5 py-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-md transition-colors cursor-pointer"
                      >
                        <T>Чекти көрүү</T>
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
          isDemo={PAYMENTS_DEMO_MODE}
        />
      )}
    </section>
  );
};

// «Бул эсепти эстеп кал» — «Менин эсебим» бетине кошот
const RememberAccountButton: React.FC<{ id: string }> = ({ id }) => {
  const [saved, setSaved] = React.useState(() => getMyAccounts().includes(id));
  if (saved) return <span className="block mt-1 text-[11px] font-semibold text-emerald-700">✓ «Менин эсебим» бетинде сакталды</span>;
  return (
    <button
      type="button"
      onClick={() => {
        rememberAccount(id);
        setSaved(true);
      }}
      className="block mt-1 text-[11px] font-semibold text-emerald-700 hover:underline cursor-pointer"
    >
      + Бул эсепти «Менин эсебим» бетине сактоо
    </button>
  );
};
