import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  MachineryOrder,
  CitizenTicket,
  SubscriberAccount,
  MachineryItem,
  PaymentTransaction
} from '../data/mockData';
import {
  LayoutDashboard,
  ClipboardList,
  AlertTriangle,
  CreditCard,
  Users,
  Settings2,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  XCircle,
  Truck,
  Search,
  Plus,
  Edit2,
  Save,
  Trash2,
  Printer,
  ArrowRight,
  ShieldAlert,
  Calendar,
  Phone,
  MapPin,
  RefreshCw,
  LogOut,
  Sliders,
  DollarSign,
  Droplets
} from 'lucide-react';
import { generateId, nowTimestamp } from '../utils/ids';
import { ReceiptModal } from './ReceiptModal';
import { SiteContentEditor } from './SiteContentEditor';
import { AdminManager } from './AdminManager';

interface AdminPanelProps {
  onClose: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onClose }) => {
  const {
    subscribers,
    machineryCatalog,
    machineryOrders,
    citizenTickets,
    transactions,
    tariffs,
    siteSettings,
    pastureZones,
    updateSiteSettings,
    updatePastureZone,
    logoutAdmin,
    addPayment,
    updateMachineryOrder,
    addMachineryOrder,
    updateCitizenTicket,
    updateSubscriber,
    addSubscriber,
    updateMachineryItem,
    updateTariffs,
    resetToDefaults
  } = useApp();

  const [activeTab, setActiveTab] = useState<
    'overview' | 'orders' | 'tickets' | 'cashier' | 'subscribers' | 'settings' | 'site_content' | 'reports' | 'admins'
  >('overview');

  const [localSiteSettings, setLocalSiteSettings] = useState(siteSettings);
  const [editingPastureZone, setEditingPastureZone] = useState<any | null>(null);

  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const showNotice = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 3500);
  };

  // Receipt modal state for payments accepted in admin
  const [activeReceipt, setActiveReceipt] = useState<PaymentTransaction | null>(null);

  // --- 1. CASHIER FORM STATE ---
  const [cashierAccountId, setCashierAccountId] = useState('');
  const [cashierPayerName, setCashierPayerName] = useState('');
  const [cashierPhone, setCashierPhone] = useState('');
  const [cashierService, setCashierService] = useState<'water' | 'waste' | 'pasture' | 'machinery'>('water');
  const [cashierAmount, setCashierAmount] = useState<number>(240);
  const [cashierMethod, setCashierMethod] = useState<'Накталай (Касса)' | 'MBank' | 'Optima24' | 'Банк картасы'>('Накталай (Касса)');
  const [cashierDetails, setCashierDetails] = useState('Кассадан накталай кабыл алынды');

  const handleSelectCashierSubscriber = (sub: SubscriberAccount) => {
    setCashierAccountId(sub.id);
    setCashierPayerName(sub.fullName);
    setCashierPhone(sub.phone);
    if (cashierService === 'water') {
      setCashierAmount(Math.abs(Math.min(0, sub.waterBalance)) || 200);
    } else if (cashierService === 'waste') {
      setCashierAmount(Math.abs(Math.min(0, sub.wasteBalance)) || sub.wasteFamilyMembers * sub.wasteTariffPerPerson);
    } else if (cashierService === 'pasture') {
      setCashierAmount(Math.abs(Math.min(0, sub.pastureBalance)) || 500);
    }
  };

  const handleExecuteCashierPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!(cashierAmount >= 1)) return;
    if (cashierService !== 'machinery' && !subscribers.some(s => s.id === cashierAccountId.trim())) {
      showNotice(`Лицевой эсеп № ${cashierAccountId || '—'} табылган жок. Тизмеден абонентти тандаңыз.`);
      return;
    }

    let sName = 'Таза суу акысы';
    if (cashierService === 'waste') sName = 'Катуу тиричилик калдыктары';
    if (cashierService === 'pasture') sName = 'Жайыт пайдалануу акысы';
    if (cashierService === 'machinery') sName = 'Атайын техника ижара акысы';

    const newTx: PaymentTransaction = {
      id: `tx-${Date.now()}`,
      receiptNumber: generateId('TZL-K', transactions.map(t => t.receiptNumber)),
      timestamp: nowTimestamp(),
      payerName: cashierPayerName,
      payerPhone: cashierPhone,
      accountId: cashierAccountId.trim(),
      serviceType: cashierService,
      serviceName: sName,
      amount: Math.round(Number(cashierAmount)),
      paymentMethod: cashierMethod as any,
      status: 'Төлөндү',
      details: cashierDetails
    };

    addPayment(newTx);
    setActiveReceipt(newTx);
    showNotice(`Төлөм кабыл алынды! Квитанция № ${newTx.receiptNumber}. Баланс жаңыртылды.`);
  };

  // --- 2. ORDERS MANAGEMENT STATE ---
  const [orderFilter, setOrderFilter] = useState<string>('all');
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [driverInput, setDriverInput] = useState<string>('');

  const filteredOrders = machineryOrders.filter(ord => {
    if (orderFilter === 'all') return true;
    return ord.status === orderFilter;
  });

  const handleOrderStatusChange = (
    orderId: string,
    newStatus: 'жаңы' | 'кабыл алынды' | 'аткарылууда' | 'бүттү' | 'жокко чыгарылды',
    paymentStatus?: 'төлөндү' | 'күтүлүүдө'
  ) => {
    const updates: Partial<MachineryOrder> = { status: newStatus };
    if (paymentStatus) updates.paymentStatus = paymentStatus;
    updateMachineryOrder(orderId, updates);
    showNotice(`Заказ № ${orderId} абалы өзгөртүлдү: «${newStatus}»`);
  };

  const handleAssignDriver = (orderId: string) => {
    if (!driverInput.trim()) return;
    updateMachineryOrder(orderId, {
      assignedDriver: driverInput.trim(),
      status: 'кабыл алынды'
    });
    setEditingOrderId(null);
    setDriverInput('');
    showNotice(`Заказ № ${orderId} үчүн айдоочу бекитилди: ${driverInput}`);
  };

  // --- 3. CITIZEN TICKETS STATE ---
  const [ticketFilter, setTicketFilter] = useState<string>('all');
  const [selectedTicketCrew, setSelectedTicketCrew] = useState<string>('Бригада №1 (Суу түтүк)');
  const [ticketCrewModalId, setTicketCrewModalId] = useState<string | null>(null);

  const filteredTickets = citizenTickets.filter(t => {
    if (ticketFilter === 'all') return true;
    return t.status === ticketFilter;
  });

  const handleTicketStatusChange = (
    ticketId: string,
    newStatus: 'Кабыл алынды' | 'Бригада жөнөтүлдү' | 'Аткарылды' | 'Кароодо',
    notes?: string
  ) => {
    updateCitizenTicket(ticketId, {
      status: newStatus,
      resolutionNotes: notes || undefined
    });
    showNotice(`Арыз № ${ticketId} абалы өзгөртүлдү: «${newStatus}»`);
  };

  const handleAssignTicketCrew = (ticketId: string) => {
    updateCitizenTicket(ticketId, {
      status: 'Бригада жөнөтүлдү',
      assignedCrew: selectedTicketCrew
    });
    setTicketCrewModalId(null);
    showNotice(`Арыз № ${ticketId} боюнча бригада дайындалды!`);
  };

  // --- 4. SUBSCRIBERS STATE & MODAL ---
  const [subscriberSearch, setSubscriberSearch] = useState('');
  const [editingSub, setEditingSub] = useState<SubscriberAccount | null>(null);
  const [newSubModalOpen, setNewSubModalOpen] = useState(false);
  const [newSubData, setNewSubData] = useState<SubscriberAccount>({
    id: `${1040 + subscribers.length + 1}`,
    fullName: '',
    address: '',
    phone: '+996 ',
    waterBalance: 0,
    waterLastMeterReading: 0,
    waterTariffPerM3: tariffs.waterPerM3,
    wasteBalance: 0,
    wasteFamilyMembers: 4,
    wasteTariffPerPerson: tariffs.wastePerPerson,
    pastureBalance: 0,
    registeredLivestock: { cattle: 0, horses: 0, sheepGoats: 0, yaks: 0 }
  });

  const filteredSubscribers = subscribers.filter(s =>
    s.id.toLowerCase().includes(subscriberSearch.toLowerCase()) ||
    s.fullName.toLowerCase().includes(subscriberSearch.toLowerCase()) ||
    s.address.toLowerCase().includes(subscriberSearch.toLowerCase())
  );

  const handleSaveSubEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSub) return;
    updateSubscriber(editingSub);
    setEditingSub(null);
    showNotice(`Абонент № ${editingSub.id} (${editingSub.fullName}) маалыматтары жаңыртылды!`);
  };

  const handleAddNewSub = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubData.fullName.trim()) return;
    addSubscriber(newSubData);
    setNewSubModalOpen(false);
    showNotice(`Жаңы абонент № ${newSubData.id} базага катталды!`);
  };

  // --- 5. TARIFFS & MACHINERY SETTINGS STATE ---
  const [localTariffs, setLocalTariffs] = useState(tariffs);
  useEffect(() => {
    setLocalTariffs(tariffs);
  }, [tariffs]);
  const [editingMachine, setEditingMachine] = useState<MachineryItem | null>(null);

  const handleSaveTariffs = (e: React.FormEvent) => {
    e.preventDefault();
    updateTariffs(localTariffs);
    showNotice('Муниципалдык тарифтер ийгиликтүү жаңыртылды жана сайт боюнча күчүнө кирди!');
  };

  const handleSaveMachine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMachine) return;
    updateMachineryItem(editingMachine);
    setEditingMachine(null);
    showNotice(`«${editingMachine.name}» техникасынын параметрлери жаңыртылды!`);
  };

  const handleSaveSiteSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSiteSettings(localSiteSettings);
    showNotice('Бардык аталыштар жана мазмун ийгиликтүү сакталды!');
  };

  const handleSavePastureZone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPastureZone) return;
    updatePastureZone(editingPastureZone.id, editingPastureZone);
    setEditingPastureZone(null);
    showNotice(`«${editingPastureZone.name}» жайыт зонасы жаңыртылды!`);
  };

  // Key KPI numbers
  const totalCollectedToday = transactions.reduce((acc, t) => acc + t.amount, 0);
  const pendingOrdersCount = machineryOrders.filter(o => o.status === 'жаңы' || o.status === 'кабыл алынды').length;
  const pendingTicketsCount = citizenTickets.filter(t => t.status !== 'Аткарылды').length;
  const totalDebtorsCount = subscribers.filter(s => s.waterBalance < 0 || s.wasteBalance < 0 || s.pastureBalance < 0).length;

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/90 backdrop-blur-md flex flex-col overflow-hidden text-stone-900">
      {/* Top Admin Header Bar */}
      <header className="bg-stone-950 text-white px-4 sm:px-6 py-3 border-b border-stone-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center font-bold text-sm text-white">
            БП
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-extrabold tracking-tight text-white">
                «Тазалык» МИ — Башкаруу панели (Админ)
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-400 border border-emerald-800">
                Айыл өкмөтү
              </span>
            </div>
            <p className="text-[11px] text-stone-400">
              Заказдарды кабыл алуу, төлөмдөр, маалыматтарды өзгөртүү жана отчеттуулук
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5 text-stone-400" />
            <span>Сайтка чыгуу</span>
          </button>
        </div>
      </header>

      {/* Notice alert */}
      {actionNotice && (
        <div className="bg-emerald-600 text-white text-xs font-semibold px-4 py-2 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-200" />
            <span>{actionNotice}</span>
          </div>
          <button onClick={() => setActionNotice(null)} className="text-white/80 hover:text-white">
            Жабуу
          </button>
        </div>
      )}

      {/* Main Admin Layout: Sidebar + Workspace */}
      <div className="flex-1 flex overflow-hidden bg-stone-100">
        {/* Navigation Sidebar */}
        <aside className="w-56 sm:w-64 bg-white border-r border-stone-200 p-3 flex flex-col justify-between shrink-0 overflow-y-auto">
          <div className="space-y-1 text-xs font-semibold">
            <div className="text-[11px] text-stone-400 uppercase tracking-wider px-3 py-2 font-mono">
              Башкаруу менюсу
            </div>

            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-colors cursor-pointer ${
                activeTab === 'overview'
                  ? 'bg-emerald-50 text-emerald-900 font-bold'
                  : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 text-emerald-700" />
              <span>Көзөмөл панели</span>
            </button>

            <button
              onClick={() => setActiveTab('orders')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-colors cursor-pointer ${
                activeTab === 'orders'
                  ? 'bg-emerald-50 text-emerald-900 font-bold'
                  : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Truck className="w-4 h-4 text-indigo-700" />
                <span>Техника заказдары</span>
              </div>
              {pendingOrdersCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-indigo-100 text-indigo-800">
                  {pendingOrdersCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('tickets')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-colors cursor-pointer ${
                activeTab === 'tickets'
                  ? 'bg-emerald-50 text-emerald-900 font-bold'
                  : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Арыздар & Авариялар</span>
              </div>
              {pendingTicketsCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-amber-100 text-amber-800">
                  {pendingTicketsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('cashier')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-colors cursor-pointer ${
                activeTab === 'cashier'
                  ? 'bg-emerald-50 text-emerald-900 font-bold'
                  : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'
              }`}
            >
              <DollarSign className="w-4 h-4 text-emerald-700" />
              <span>Төлөм кабыл алуу (Касса)</span>
            </button>

            <button
              onClick={() => setActiveTab('subscribers')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-colors cursor-pointer ${
                activeTab === 'subscribers'
                  ? 'bg-emerald-50 text-emerald-900 font-bold'
                  : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'
              }`}
            >
              <Users className="w-4 h-4 text-cyan-700" />
              <span>Абоненттер базасы</span>
            </button>

            <button
              onClick={() => setActiveTab('site_content')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-colors cursor-pointer ${
                activeTab === 'site_content'
                  ? 'bg-emerald-50 text-emerald-900 font-bold'
                  : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'
              }`}
            >
              <Edit2 className="w-4 h-4 text-amber-600" />
              <span>Аталыштар & Мазмун</span>
            </button>

            <button
              onClick={() => setActiveTab('admins')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-colors cursor-pointer ${
                activeTab === 'admins'
                  ? 'bg-emerald-50 text-emerald-900 font-bold'
                  : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'
              }`}
            >
              <ShieldAlert className="w-4 h-4 text-emerald-700" />
              <span>Админдер</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-colors cursor-pointer ${
                activeTab === 'settings'
                  ? 'bg-emerald-50 text-emerald-900 font-bold'
                  : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'
              }`}
            >
              <Sliders className="w-4 h-4 text-purple-700" />
              <span>Тарифтер & Техника</span>
            </button>

            <button
              onClick={() => setActiveTab('reports')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-colors cursor-pointer ${
                activeTab === 'reports'
                  ? 'bg-emerald-50 text-emerald-900 font-bold'
                  : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 text-stone-700" />
              <span>Финансылык отчеттор</span>
            </button>
          </div>

          <div className="pt-4 border-t border-stone-200 text-[11px] text-stone-400 space-y-2">
            <button
              onClick={() => {
                resetToDefaults();
                showNotice('Маалыматтар серверден кайра жүктөлдү.');
              }}
              className="w-full text-left text-stone-500 hover:text-rose-600 py-1 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Серверден жаңыртуу</span>
            </button>
            <div className="font-mono text-[10px]">Версия 2.4-КИ · 2026</div>
          </div>
        </aside>

        {/* Dynamic Workspace Container */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {/* ================= TAB 1: OVERVIEW ================= */}
          {activeTab === 'overview' && (
            <div className="space-y-6 max-w-6xl">
              <div>
                <h2 className="text-xl font-extrabold text-stone-900">
                  Муниципалдык кызматтардын көзөмөл дашборду
                </h2>
                <p className="text-xs text-stone-500 mt-0.5">
                  Бүгүнкү күнгө карата негизги көрсөткүчтөр жана ыкчам аракеттер
                </p>
              </div>

              {/* 4 Big KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-xs">
                  <div className="flex items-center justify-between text-stone-500 text-xs font-semibold">
                    <span>Жалпы түшкөн төлөмдөр</span>
                    <CreditCard className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="text-2xl font-extrabold text-emerald-700 font-mono tabular-nums mt-2">
                    {totalCollectedToday.toLocaleString('ru-RU')} сом
                  </div>
                  <div className="text-[11px] text-stone-400 mt-1">
                    {transactions.length} транзакция катталды
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-xs">
                  <div className="flex items-center justify-between text-stone-500 text-xs font-semibold">
                    <span>Аткарылуучу заказдар</span>
                    <Truck className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div className="text-2xl font-extrabold text-indigo-900 font-mono tabular-nums mt-2">
                    {pendingOrdersCount} заказ
                  </div>
                  <div className="text-[11px] text-stone-400 mt-1">
                    Экскаватор жана оор унаалар
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-xs">
                  <div className="flex items-center justify-between text-stone-500 text-xs font-semibold">
                    <span>Чечилүүчү арыздар</span>
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="text-2xl font-extrabold text-amber-700 font-mono tabular-nums mt-2">
                    {pendingTicketsCount} арыз
                  </div>
                  <div className="text-[11px] text-stone-400 mt-1">
                    Суу авариясы жана таштанды
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-xs">
                  <div className="flex items-center justify-between text-stone-500 text-xs font-semibold">
                    <span>Карызкор абоненттер</span>
                    <Users className="w-4 h-4 text-rose-600" />
                  </div>
                  <div className="text-2xl font-extrabold text-rose-700 font-mono tabular-nums mt-2">
                    {totalDebtorsCount} үй чарба
                  </div>
                  <div className="text-[11px] text-stone-400 mt-1">
                    Суу жана таштанды карызы
                  </div>
                </div>
              </div>

              {/* Quick Actions Strip */}
              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold text-stone-900">Ыкчам административдик аракеттер:</h3>
                  <p className="text-xs text-stone-500">Керектүү модулга түз өтүңүз</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setActiveTab('cashier')}
                    className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Төлөм кабыл алуу</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('orders')}
                    className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-stone-800 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors cursor-pointer"
                  >
                    <Truck className="w-3.5 h-3.5 text-indigo-700" />
                    <span>Заказдарды кабыл алуу ({pendingOrdersCount})</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('tickets')}
                    className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-stone-800 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors cursor-pointer"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    <span>Арыздарды кароо ({pendingTicketsCount})</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('settings')}
                    className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-stone-800 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors cursor-pointer"
                  >
                    <Sliders className="w-3.5 h-3.5 text-purple-700" />
                    <span>Тарифтерди өзгөртүү</span>
                  </button>
                </div>
              </div>

              {/* 2-Column Split: Latest Orders & Latest Transactions */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Orders box */}
                <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                    <h3 className="text-sm font-bold text-stone-900">Акыркы техника заказдары</h3>
                    <button
                      onClick={() => setActiveTab('orders')}
                      className="text-xs text-emerald-700 font-semibold hover:underline cursor-pointer"
                    >
                      Баарын көрүү →
                    </button>
                  </div>
                  <div className="space-y-2.5">
                    {machineryOrders.slice(0, 3).map(ord => (
                      <div key={ord.id} className="p-3 rounded-xl border border-stone-200 bg-stone-50/60 flex items-center justify-between text-xs">
                        <div>
                          <div className="font-bold text-stone-900">{ord.machineName}</div>
                          <div className="text-[11px] text-stone-500 mt-0.5">
                            {ord.customerName} · {ord.address}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            ord.status === 'кабыл алынды' ? 'bg-indigo-100 text-indigo-800' :
                            ord.status === 'аткарылууда' ? 'bg-amber-100 text-amber-800' :
                            ord.status === 'бүттү' ? 'bg-emerald-100 text-emerald-800' :
                            'bg-stone-200 text-stone-700'
                          }`}>
                            {ord.status}
                          </span>
                          <div className="font-mono font-bold text-stone-800 mt-1">
                            {ord.totalEstimate.toLocaleString('ru-RU')} сом
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Transactions box */}
                <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                    <h3 className="text-sm font-bold text-stone-900">Акыркы түшкөн төлөмдөр</h3>
                    <button
                      onClick={() => setActiveTab('reports')}
                      className="text-xs text-emerald-700 font-semibold hover:underline cursor-pointer"
                    >
                      Отчетко өтүү →
                    </button>
                  </div>
                  <div className="space-y-2.5">
                    {transactions.slice(0, 3).map(tx => (
                      <div key={tx.id} className="p-3 rounded-xl border border-stone-200 bg-stone-50/60 flex items-center justify-between text-xs">
                        <div>
                          <div className="font-bold text-stone-900">{tx.payerName}</div>
                          <div className="text-[11px] text-stone-500 mt-0.5">
                            {tx.serviceName} · {tx.paymentMethod}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-mono font-bold text-emerald-700 text-sm">
                            +{tx.amount.toLocaleString('ru-RU')} с.
                          </span>
                          <div className="text-[10px] text-stone-400 font-mono mt-0.5">
                            {tx.timestamp}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 2: ORDERS MANAGEMENT ================= */}
          {activeTab === 'orders' && (
            <div className="space-y-6 max-w-6xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-extrabold text-stone-900">
                    Атайын техника заказдарын кабыл алуу жана башкаруу
                  </h2>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Айыл тургундарынан жана уюмдардан түшкөн экскаватор, КамАЗ, ассенизатор заказдары
                  </p>
                </div>

                {/* Filter buttons */}
                <div className="flex items-center gap-1.5 p-1 bg-white border border-stone-200 rounded-xl text-xs font-semibold">
                  {[
                    { id: 'all', label: 'Баары' },
                    { id: 'жаңы', label: 'Жаңы' },
                    { id: 'кабыл алынды', label: 'Кабыл алынды' },
                    { id: 'аткарылууда', label: 'Аткарылууда' },
                    { id: 'бүттү', label: 'Бүттү' }
                  ].map(f => (
                    <button
                      key={f.id}
                      onClick={() => setOrderFilter(f.id)}
                      className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                        orderFilter === f.id
                          ? 'bg-stone-900 text-white'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Orders Table */}
              <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-stone-700">
                    <thead className="bg-stone-50 text-stone-500 uppercase tracking-wider text-[11px] border-b border-stone-200">
                      <tr>
                        <th className="py-3 px-4">№ Заказ</th>
                        <th className="py-3 px-4">Техника</th>
                        <th className="py-3 px-4">Кардар & Дарек</th>
                        <th className="py-3 px-4">Көлөм & Сумма</th>
                        <th className="py-3 px-4">Айдоочу</th>
                        <th className="py-3 px-4">Статусу</th>
                        <th className="py-3 px-4 text-right">Аракеттер</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {filteredOrders.map(order => (
                        <tr key={order.id} className="hover:bg-stone-50/70 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-bold text-stone-900">
                            {order.id}
                            <span className="block text-[10px] text-stone-400 font-normal">
                              {order.createdAt}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <strong className="text-stone-900 block">{order.machineName}</strong>
                            <span className="text-[11px] text-stone-500">
                              Иш: {order.workDescription}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-stone-900">{order.customerName}</div>
                            <div className="text-stone-500 font-mono text-[11px]">{order.customerPhone}</div>
                            <div className="text-stone-400 text-[10px]">{order.address}</div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-emerald-800 font-mono text-sm">
                              {order.totalEstimate.toLocaleString('ru-RU')} сом
                            </div>
                            <span className="text-[10px] text-stone-500">
                              {order.units} {order.orderType === 'hours' ? 'саат' : order.orderType === 'shift' ? 'смена' : 'рейс'}
                            </span>
                            <span className={`block text-[10px] font-semibold ${
                              order.paymentStatus === 'төлөндү' ? 'text-emerald-700' : 'text-amber-600'
                            }`}>
                              {order.paymentStatus === 'төлөндү' ? '✓ Төлөндү' : '• Күтүлүүдө'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-[11px]">
                            {order.assignedDriver ? (
                              <span className="text-stone-800 font-medium">{order.assignedDriver}</span>
                            ) : (
                              <span className="text-stone-400 italic">Бекитиле элек</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`inline-block px-2.5 py-1 rounded text-[11px] font-bold ${
                              order.status === 'кабыл алынды' ? 'bg-indigo-100 text-indigo-800' :
                              order.status === 'аткарылууда' ? 'bg-amber-100 text-amber-800' :
                              order.status === 'бүттү' ? 'bg-emerald-100 text-emerald-800' :
                              order.status === 'жаңы' ? 'bg-blue-100 text-blue-800' :
                              'bg-stone-200 text-stone-600'
                            }`}>
                              {order.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {order.status === 'жаңы' && (
                                <button
                                  onClick={() => {
                                    setEditingOrderId(order.id);
                                    setDriverInput('Абдыкалыков Руслан (оператор)');
                                  }}
                                  className="px-2.5 py-1 bg-indigo-700 hover:bg-indigo-800 text-white font-bold rounded-lg text-[11px] cursor-pointer"
                                >
                                  Кабыл алуу & Айдоочу
                                </button>
                              )}

                              {order.status === 'кабыл алынды' && (
                                <button
                                  onClick={() => handleOrderStatusChange(order.id, 'аткарылууда')}
                                  className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-[11px] cursor-pointer"
                                >
                                  Ишке жөнөтүү
                                </button>
                              )}

                              {order.status === 'аткарылууда' && (
                                <button
                                  onClick={() => handleOrderStatusChange(order.id, 'бүттү', 'төлөндү')}
                                  className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg text-[11px] cursor-pointer"
                                >
                                  Бүттү (Аткарылды)
                                </button>
                              )}

                              {order.paymentStatus === 'күтүлүүдө' && (
                                <button
                                  onClick={() => {
                                    updateMachineryOrder(order.id, { paymentStatus: 'төлөндү' });
                                    showNotice(`Заказ № ${order.id} боюнча төлөм тастыкталды!`);
                                  }}
                                  className="px-2 py-1 bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold rounded-lg text-[11px] cursor-pointer"
                                  title="Төлөндү деп белгилөө"
                                >
                                  Төлөндү
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Assign Driver modal overlay */}
              {editingOrderId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                  <div className="bg-white rounded-2xl p-6 max-w-md w-full border border-stone-200 shadow-2xl space-y-4">
                    <h3 className="text-base font-bold text-stone-900">
                      Заказды кабыл алуу жана оператор/айдоочу дайындоо
                    </h3>
                    <p className="text-xs text-stone-500">
                      Заказ № {editingOrderId} үчүн жооптуу кызматкерди тандаңыз:
                    </p>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        Айдоочунун / Оператордун аты-жөнү:
                      </label>
                      <input
                        type="text"
                        value={driverInput}
                        onChange={(e) => setDriverInput(e.target.value)}
                        placeholder="Мисалы: Абдыкалыков Руслан..."
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs"
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        onClick={() => setEditingOrderId(null)}
                        className="px-3.5 py-2 text-xs font-semibold text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-lg cursor-pointer"
                      >
                        Жокко чыгаруу
                      </button>
                      <button
                        onClick={() => handleAssignDriver(editingOrderId)}
                        className="px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg cursor-pointer"
                      >
                        Кабыл алуу жана бекитүү
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================= TAB 3: CITIZEN TICKETS ================= */}
          {activeTab === 'tickets' && (
            <div className="space-y-6 max-w-6xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-extrabold text-stone-900">
                    Жарандардын арыздары жана Авариялык билдирүүлөр
                  </h2>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Суу түтүгү жарылышы, таштанды чыгаруу жана дренаж маселелери
                  </p>
                </div>

                <div className="flex items-center gap-1.5 p-1 bg-white border border-stone-200 rounded-xl text-xs font-semibold">
                  {[
                    { id: 'all', label: 'Баары' },
                    { id: 'Кабыл алынды', label: 'Кабыл алынгандар' },
                    { id: 'Бригада жөнөтүлдү', label: 'Бригада иште' },
                    { id: 'Аткарылды', label: 'Аткарылгандар' }
                  ].map(f => (
                    <button
                      key={f.id}
                      onClick={() => setTicketFilter(f.id)}
                      className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                        ticketFilter === f.id
                          ? 'bg-stone-900 text-white'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tickets list */}
              <div className="space-y-3">
                {filteredTickets.map(ticket => (
                  <div
                    key={ticket.id}
                    className="p-5 bg-white rounded-2xl border border-stone-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 max-w-2xl">
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-xs text-stone-900">№ {ticket.id}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          ticket.status === 'Аткарылды' ? 'bg-emerald-100 text-emerald-800' :
                          ticket.status === 'Бригада жөнөтүлдү' ? 'bg-amber-100 text-amber-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {ticket.status}
                        </span>
                        <span className="text-[11px] text-stone-400 font-mono">{ticket.date}</span>
                      </div>

                      <h4 className="text-sm font-bold text-stone-900">{ticket.category}</h4>
                      <p className="text-xs text-stone-600">{ticket.description}</p>
                      {ticket.photo && (
                        <img src={ticket.photo} alt="Арызга тиркелген сүрөт" className="w-40 max-w-full rounded-lg border border-stone-200" />
                      )}

                      <div className="flex flex-wrap items-center gap-4 text-xs text-stone-500 pt-1">
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-stone-400" />
                          {ticket.name}
                        </span>
                        <span className="flex items-center gap-1 font-mono">
                          <Phone className="w-3.5 h-3.5 text-stone-400" />
                          <a href={`tel:${ticket.phone.replace(/[^\d+]/g, '')}`} className="hover:underline">{ticket.phone}</a>
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-stone-400" />
                          {ticket.address}
                        </span>
                      </div>

                      {ticket.assignedCrew && (
                        <div className="text-[11px] text-indigo-700 font-semibold pt-1">
                          Жооптуу: {ticket.assignedCrew}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      {ticket.status !== 'Бригада жөнөтүлдү' && ticket.status !== 'Аткарылды' && (
                        <button
                          onClick={() => setTicketCrewModalId(ticket.id)}
                          className="px-3 py-2 bg-indigo-700 hover:bg-indigo-800 text-white font-bold rounded-xl text-xs cursor-pointer"
                        >
                          Бригада жөнөтүү
                        </button>
                      )}

                      {ticket.status !== 'Аткарылды' && (
                        <button
                          onClick={() => handleTicketStatusChange(ticket.id, 'Аткарылды', 'Маселе толугу менен чечилди')}
                          className="px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs cursor-pointer"
                        >
                          Аткарылды деп белгилөө
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Assign Crew Modal */}
              {ticketCrewModalId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                  <div className="bg-white rounded-2xl p-6 max-w-md w-full border border-stone-200 shadow-2xl space-y-4">
                    <h3 className="text-base font-bold text-stone-900">
                      Жооптуу авариялык бригаданы дайындоо
                    </h3>
                    <p className="text-xs text-stone-500">
                      Арыз № {ticketCrewModalId} боюнча тез чара көрүүчү топту тандаңыз:
                    </p>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        Бригада:
                      </label>
                      <select
                        value={selectedTicketCrew}
                        onChange={(e) => setSelectedTicketCrew(e.target.value)}
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs"
                      >
                        <option value="Тез чара көрүү тобу №1 (мастер: Касымов М.)">
                          Тез чара көрүү тобу №1 (мастер: Касымов М.)
                        </option>
                        <option value="Тез чара көрүү тобу №2 (мастер: А. Ибраимов)">
                          Тез чара көрүү тобу №2 (мастер: А. Ибраимов)
                        </option>
                        <option value="Таштанды бригадасы (КамАЗ-КО №01-140)">
                          Таштанды бригадасы (КамАЗ-КО №01-140)
                        </option>
                        <option value="Жайыт көзөмөлчүлөрү (инспекторлор)">
                          Жайыт көзөмөлчүлөрү (инспекторлор)
                        </option>
                      </select>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        onClick={() => setTicketCrewModalId(null)}
                        className="px-3.5 py-2 text-xs font-semibold text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-lg cursor-pointer"
                      >
                        Жокко чыгаруу
                      </button>
                      <button
                        onClick={() => handleAssignTicketCrew(ticketCrewModalId)}
                        className="px-4 py-2 text-xs font-bold text-white bg-indigo-700 hover:bg-indigo-800 rounded-lg cursor-pointer"
                      >
                        Бригаданы жиберүү
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================= TAB 4: CASHIER / ACCEPT PAYMENT ================= */}
          {activeTab === 'cashier' && (
            <div className="space-y-6 max-w-4xl">
              <div>
                <h2 className="text-xl font-extrabold text-stone-900">
                  Төлөмдөрдү кабыл алуу (Муниципалдык касса)
                </h2>
                <p className="text-xs text-stone-500 mt-0.5">
                  Тургундардан накталай же банк аркылуу төлөм кабыл алып, квитанция чыгаруу жана балансты автоматтык жаңыртуу
                </p>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-xs space-y-6">
                {/* Subscriber quick picker */}
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-2">
                    1. Абонентти тандаңыз же лицевой эсебин жазыңыз:
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {subscribers.map(sub => (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => handleSelectCashierSubscriber(sub)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                          cashierAccountId === sub.id
                            ? 'bg-emerald-700 text-white font-bold'
                            : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                        }`}
                      >
                        №{sub.id} {sub.fullName}
                      </button>
                    ))}
                  </div>
                </div>

                <form onSubmit={handleExecuteCashierPayment} className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-stone-700 font-semibold mb-1">Лицевой эсеп №:</label>
                      <input
                        type="text"
                        required
                        value={cashierAccountId}
                        onChange={(e) => setCashierAccountId(e.target.value)}
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-stone-700 font-semibold mb-1">Төлөөчүнүн аты-жөнү:</label>
                      <input
                        type="text"
                        required
                        value={cashierPayerName}
                        onChange={(e) => setCashierPayerName(e.target.value)}
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-stone-700 font-semibold mb-1">Телефону:</label>
                      <input
                        type="text"
                        value={cashierPhone}
                        onChange={(e) => setCashierPhone(e.target.value)}
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg font-mono text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-stone-700 font-semibold mb-1">Кызматтын түрү:</label>
                      <select
                        value={cashierService}
                        onChange={(e) => setCashierService(e.target.value as any)}
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs font-medium"
                      >
                        <option value="water">Таза суу акысы</option>
                        <option value="waste">Таштанды чыгаруу</option>
                        <option value="pasture">Жайыт пайдалануу акысы</option>
                        <option value="machinery">Атайын техника ижарасы</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-stone-700 font-semibold mb-1">Төлөм ыкмасы:</label>
                      <select
                        value={cashierMethod}
                        onChange={(e) => setCashierMethod(e.target.value as any)}
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs font-medium"
                      >
                        <option value="Накталай (Касса)">Накталай (Касса)</option>
                        <option value="MBank">MBank</option>
                        <option value="Optima24">Optima24</option>
                        <option value="Банк картасы">Элкарт / Банк картасы</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-stone-900 font-bold mb-1">Суммасы (сом):</label>
                      <input
                        type="number"
                        required
                        min="10"
                        value={cashierAmount}
                        onChange={(e) => setCashierAmount(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-white border border-emerald-500 rounded-lg font-bold font-mono text-emerald-800 text-sm focus:ring-2 focus:ring-emerald-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-stone-700 font-semibold mb-1">Төлөм баяндамасы:</label>
                    <input
                      type="text"
                      value={cashierDetails}
                      onChange={(e) => setCashierDetails(e.target.value)}
                      placeholder="Мисалы: 2026-ж. октябрь айы үчүн..."
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>{cashierAmount.toLocaleString('ru-RU')} сом төлөмдү кабыл алуу жана квитанция чыгаруу</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ================= TAB 5: SUBSCRIBERS ================= */}
          {activeTab === 'subscribers' && (
            <div className="space-y-6 max-w-6xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-extrabold text-stone-900">
                    Абоненттер базасы жана Лицевой эсептер
                  </h2>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Үй чарбалардын эсептегич көрсөткүчтөрү, үй-бүлө мүчөлөрү, катталган мал саны жана карыздары
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={subscriberSearch}
                      onChange={(e) => setSubscriberSearch(e.target.value)}
                      placeholder="Издөө (аты, эсеп №)..."
                      className="pl-8 pr-3 py-1.5 text-xs bg-white border border-stone-200 rounded-lg focus:outline-none"
                    />
                  </div>

                  <button
                    onClick={() => setNewSubModalOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Жаңы абонент</span>
                  </button>
                </div>
              </div>

              {/* Subscribers Table */}
              <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-stone-700">
                    <thead className="bg-stone-50 text-stone-500 uppercase tracking-wider text-[11px] border-b border-stone-200">
                      <tr>
                        <th className="py-3 px-4">Эсеп №</th>
                        <th className="py-3 px-4">Абоненттин аты-жөнү</th>
                        <th className="py-3 px-4">Дареги & Телефон</th>
                        <th className="py-3 px-4">Суу балансы (м³)</th>
                        <th className="py-3 px-4">Таштанды (адам)</th>
                        <th className="py-3 px-4">Катталган мал</th>
                        <th className="py-3 px-4 text-right">Аракет</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {filteredSubscribers.map(sub => (
                        <tr key={sub.id} className="hover:bg-stone-50/70 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-bold text-stone-900">
                            №{sub.id}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-stone-900">
                            {sub.fullName}
                          </td>
                          <td className="py-3.5 px-4">
                            <div>{sub.address}</div>
                            <div className="text-stone-400 font-mono text-[11px]">{sub.phone}</div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`font-mono font-bold ${
                              sub.waterBalance < 0 ? 'text-rose-600' : 'text-emerald-700'
                            }`}>
                              {sub.waterBalance < 0 ? `${Math.abs(sub.waterBalance)} с. карыз` : `${sub.waterBalance} с.`}
                            </span>
                            <span className="block text-[10px] text-stone-400 font-mono">
                              Водомер: {sub.waterLastMeterReading} м³
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`font-mono font-bold ${
                              sub.wasteBalance < 0 ? 'text-rose-600' : 'text-emerald-700'
                            }`}>
                              {sub.wasteBalance < 0 ? `${Math.abs(sub.wasteBalance)} с. карыз` : `Төлөнгөн`}
                            </span>
                            <span className="block text-[10px] text-stone-400">
                              {sub.wasteFamilyMembers} адам
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-[11px]">
                            {sub.registeredLivestock.cattle} уй, {sub.registeredLivestock.horses} жылкы, {sub.registeredLivestock.sheepGoats} кой
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => setEditingSub(sub)}
                              className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold rounded-lg text-[11px] transition-colors cursor-pointer flex items-center gap-1 ml-auto"
                            >
                              <Edit2 className="w-3 h-3 text-stone-600" />
                              <span>Өзгөртүү</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Edit Subscriber Modal */}
              {editingSub && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                  <div className="bg-white rounded-2xl p-6 max-w-lg w-full border border-stone-200 shadow-2xl space-y-4">
                    <h3 className="text-base font-bold text-stone-900">
                      Абоненттин маалыматтарын өзгөртүү (№{editingSub.id})
                    </h3>

                    <form onSubmit={handleSaveSubEdit} className="space-y-3 text-xs">
                      <div>
                        <label className="block text-stone-700 font-semibold mb-1">Аты-жөнү:</label>
                        <input
                          type="text"
                          required
                          value={editingSub.fullName}
                          onChange={(e) => setEditingSub({ ...editingSub, fullName: e.target.value })}
                          className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-stone-700 font-semibold mb-1">Дареги:</label>
                          <input
                            type="text"
                            required
                            value={editingSub.address}
                            onChange={(e) => setEditingSub({ ...editingSub, address: e.target.value })}
                            className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-stone-700 font-semibold mb-1">Телефону:</label>
                          <input
                            type="text"
                            required
                            value={editingSub.phone}
                            onChange={(e) => setEditingSub({ ...editingSub, phone: e.target.value })}
                            className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs font-mono"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 p-3 bg-stone-50 rounded-xl border border-stone-200">
                        <div>
                          <label className="block text-stone-700 font-semibold mb-1">Суу балансы (сом):</label>
                          <input
                            type="number"
                            value={editingSub.waterBalance}
                            onChange={(e) => setEditingSub({ ...editingSub, waterBalance: Number(e.target.value) })}
                            className="w-full px-3 py-1.5 bg-white border border-stone-300 rounded-lg font-mono text-xs"
                          />
                          <span className="text-[10px] text-stone-400">Минус (-) карызды билдирет</span>
                        </div>
                        <div>
                          <label className="block text-stone-700 font-semibold mb-1">Водомер акыркы көрсөткүч (м³):</label>
                          <input
                            type="number"
                            value={editingSub.waterLastMeterReading}
                            onChange={(e) => setEditingSub({ ...editingSub, waterLastMeterReading: Number(e.target.value) })}
                            className="w-full px-3 py-1.5 bg-white border border-stone-300 rounded-lg font-mono text-xs"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 p-3 bg-stone-50 rounded-xl border border-stone-200">
                        <div>
                          <label className="block text-stone-700 font-semibold mb-1">Үй-бүлө мүчөлөрүнүн саны:</label>
                          <input
                            type="number"
                            value={editingSub.wasteFamilyMembers}
                            onChange={(e) => setEditingSub({ ...editingSub, wasteFamilyMembers: Number(e.target.value) })}
                            className="w-full px-3 py-1.5 bg-white border border-stone-300 rounded-lg font-mono text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-stone-700 font-semibold mb-1">Таштанды балансы (сом):</label>
                          <input
                            type="number"
                            value={editingSub.wasteBalance}
                            onChange={(e) => setEditingSub({ ...editingSub, wasteBalance: Number(e.target.value) })}
                            className="w-full px-3 py-1.5 bg-white border border-stone-300 rounded-lg font-mono text-xs"
                          />
                        </div>
                      </div>

                      <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
                        <label className="block text-stone-700 font-semibold">Катталган малдын саны:</label>
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <span className="text-[10px] text-stone-500">Уй/бодо:</span>
                            <input
                              type="number"
                              value={editingSub.registeredLivestock.cattle}
                              onChange={(e) => setEditingSub({
                                ...editingSub,
                                registeredLivestock: { ...editingSub.registeredLivestock, cattle: Number(e.target.value) }
                              })}
                              className="w-full px-2 py-1 bg-white border border-stone-300 rounded text-xs"
                            />
                          </div>
                          <div>
                            <span className="text-[10px] text-stone-500">Жылкы:</span>
                            <input
                              type="number"
                              value={editingSub.registeredLivestock.horses}
                              onChange={(e) => setEditingSub({
                                ...editingSub,
                                registeredLivestock: { ...editingSub.registeredLivestock, horses: Number(e.target.value) }
                              })}
                              className="w-full px-2 py-1 bg-white border border-stone-300 rounded text-xs"
                            />
                          </div>
                          <div>
                            <span className="text-[10px] text-stone-500">Кой-эчки:</span>
                            <input
                              type="number"
                              value={editingSub.registeredLivestock.sheepGoats}
                              onChange={(e) => setEditingSub({
                                ...editingSub,
                                registeredLivestock: { ...editingSub.registeredLivestock, sheepGoats: Number(e.target.value) }
                              })}
                              className="w-full px-2 py-1 bg-white border border-stone-300 rounded text-xs"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setEditingSub(null)}
                          className="px-3.5 py-2 text-xs font-semibold text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-lg cursor-pointer"
                        >
                          Жокко чыгаруу
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg cursor-pointer flex items-center gap-1.5"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>Сактоо</span>
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* Add New Subscriber Modal */}
              {newSubModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                  <div className="bg-white rounded-2xl p-6 max-w-lg w-full border border-stone-200 shadow-2xl space-y-4">
                    <h3 className="text-base font-bold text-stone-900">
                      Жаңы абонентти каттоого алуу
                    </h3>

                    <form onSubmit={handleAddNewSub} className="space-y-3 text-xs">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-stone-700 font-semibold mb-1">Лицевой эсеп №:</label>
                          <input
                            type="text"
                            required
                            value={newSubData.id}
                            onChange={(e) => setNewSubData({ ...newSubData, id: e.target.value })}
                            className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg font-mono text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-stone-700 font-semibold mb-1">Телефону:</label>
                          <input
                            type="text"
                            required
                            value={newSubData.phone}
                            onChange={(e) => setNewSubData({ ...newSubData, phone: e.target.value })}
                            className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs font-mono"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-stone-700 font-semibold mb-1">Аты-жөнү:</label>
                        <input
                          type="text"
                          required
                          value={newSubData.fullName}
                          onChange={(e) => setNewSubData({ ...newSubData, fullName: e.target.value })}
                          placeholder="Толук аты-жөнү..."
                          className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-stone-700 font-semibold mb-1">Дареги (көчө, үй):</label>
                        <input
                          type="text"
                          required
                          value={newSubData.address}
                          onChange={(e) => setNewSubData({ ...newSubData, address: e.target.value })}
                          placeholder="Мисалы: Манас көчөсү, 88..."
                          className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-stone-700 font-semibold mb-1">Үй-бүлө мүчөлөрү (адам):</label>
                          <input
                            type="number"
                            value={newSubData.wasteFamilyMembers}
                            onChange={(e) => setNewSubData({ ...newSubData, wasteFamilyMembers: Number(e.target.value) })}
                            className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-stone-700 font-semibold mb-1">Водомер баштапкы көрсөткүчү:</label>
                          <input
                            type="number"
                            value={newSubData.waterLastMeterReading}
                            onChange={(e) => setNewSubData({ ...newSubData, waterLastMeterReading: Number(e.target.value) })}
                            className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setNewSubModalOpen(false)}
                          className="px-3.5 py-2 text-xs font-semibold text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-lg cursor-pointer"
                        >
                          Жокко чыгаруу
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg cursor-pointer"
                        >
                          Базага кошуу
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================= TAB: SITE CONTENT & TITLES ================= */}
          {activeTab === 'admins' && (
            <div className="max-w-2xl">
              <AdminManager />
            </div>
          )}

          {activeTab === 'site_content' && (
            <SiteContentEditor />
          )}

          {/* ================= TAB 6: SETTINGS & TARIFFS ================= */}
          {activeTab === 'settings' && (
            <div className="space-y-6 max-w-5xl">
              <div>
                <h2 className="text-xl font-extrabold text-stone-900">
                  Тарифтерди жана Техника параметрлерин өзгөртүү
                </h2>
                <p className="text-xs text-stone-500 mt-0.5">
                  Айылдык Кеңештин токтомдору боюнча коммуналык төлөм тарифтерин жана техникалардын сааттык баасын өзгөртүү
                </p>
              </div>

              {/* Tariffs form */}
              <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-xs space-y-5">
                <div className="border-b border-stone-100 pb-3">
                  <h3 className="text-sm font-bold text-stone-900">1. Негизги коммуналдык тарифтер</h3>
                </div>

                <form onSubmit={handleSaveTariffs} className="space-y-4 text-xs">
                  <div className="bg-cyan-50/40 p-4 rounded-xl border border-cyan-150 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-cyan-950 flex items-center gap-1.5 text-xs">
                        <Droplets className="w-4 h-4 text-cyan-600" />
                        <span>Таза суу тарифтери (Айылдык Кеңештин токтому)</span>
                      </h4>
                      <span className="text-[11px] text-cyan-800 font-mono">2026-жылкы бекитилген ченемдер</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      <div className="p-3 bg-white rounded-xl border border-stone-200">
                        <label className="block text-stone-800 font-bold mb-1">
                          1. Водомер менен (калкка):
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            step="0.1"
                            value={localTariffs.waterPerM3 ?? 18.5}
                            onChange={(e) => setLocalTariffs({ ...localTariffs, waterPerM3: Number(e.target.value) })}
                            className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-lg font-mono font-bold text-stone-900 focus:bg-white"
                          />
                          <span className="text-stone-500 font-semibold whitespace-nowrap text-[11px]">сом/м³</span>
                        </div>
                        <span className="text-[10px] text-stone-400 mt-1 block">Чындыгында сарпталган көлөмгө</span>
                      </div>

                      <div className="p-3 bg-white rounded-xl border border-stone-200">
                        <label className="block text-stone-800 font-bold mb-1">
                          2. Водомери жокторго:
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            step="1"
                            value={localTariffs.waterWithoutMeterPerPerson ?? 45}
                            onChange={(e) => setLocalTariffs({ ...localTariffs, waterWithoutMeterPerPerson: Number(e.target.value) })}
                            className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-lg font-mono font-bold text-stone-900 focus:bg-white"
                          />
                          <span className="text-stone-500 font-semibold whitespace-nowrap text-[11px]">сом/адам/ай</span>
                        </div>
                        <span className="text-[10px] text-stone-400 mt-1 block">Үй-бүлө мүчөсүнүн санына</span>
                      </div>

                      <div className="p-3 bg-white rounded-xl border border-stone-200">
                        <label className="block text-stone-800 font-bold mb-1">
                          3. Коммерциялык колдонуу:
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            step="1"
                            value={localTariffs.waterCommercialPerM3 ?? 32}
                            onChange={(e) => setLocalTariffs({ ...localTariffs, waterCommercialPerM3: Number(e.target.value) })}
                            className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-lg font-mono font-bold text-stone-900 focus:bg-white"
                          />
                          <span className="text-stone-500 font-semibold whitespace-nowrap text-[11px]">сом/м³</span>
                        </div>
                        <span className="text-[10px] text-stone-400 mt-1 block">Цех, мончо, автожуугуч, дүкөн</span>
                      </div>

                      <div className="p-3 bg-white rounded-xl border border-stone-200">
                        <label className="block text-stone-800 font-bold mb-1">
                          4. Сугат суу (короо-жай):
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            step="1"
                            value={localTariffs.waterIrrigationPerSotka ?? 25}
                            onChange={(e) => setLocalTariffs({ ...localTariffs, waterIrrigationPerSotka: Number(e.target.value) })}
                            className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-lg font-mono font-bold text-stone-900 focus:bg-white"
                          />
                          <span className="text-stone-500 font-semibold whitespace-nowrap text-[11px]">сом/сотых/ай</span>
                        </div>
                        <span className="text-[10px] text-stone-400 mt-1 block">Жайкы сугат сезонуна</span>
                      </div>
                    </div>
                  </div>

                  {/* Waste Collection */}
                  <div className="p-4 bg-emerald-50/40 rounded-xl border border-emerald-150 space-y-3">
                    <h4 className="font-bold text-emerald-950 flex items-center gap-1.5 text-xs">
                      <Trash2 className="w-4 h-4 text-emerald-700" />
                      <span>Таштанды чыгаруу тарифтери</span>
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-3 bg-white rounded-xl border border-stone-200">
                        <label className="block text-stone-800 font-bold mb-1">
                          Калкка (турак жайларга):
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            step="1"
                            value={localTariffs.wastePerPerson ?? 35}
                            onChange={(e) => setLocalTariffs({ ...localTariffs, wastePerPerson: Number(e.target.value) })}
                            className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-lg font-mono font-bold text-stone-900 focus:bg-white"
                          />
                          <span className="text-stone-500 font-semibold whitespace-nowrap text-[11px]">сом/адам/ай</span>
                        </div>
                      </div>

                      <div className="p-3 bg-white rounded-xl border border-stone-200">
                        <label className="block text-stone-800 font-bold mb-1">
                          Ишкана жана соода объектилерине:
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            step="5"
                            value={localTariffs.wasteCommercialPerM3 ?? 70}
                            onChange={(e) => setLocalTariffs({ ...localTariffs, wasteCommercialPerM3: Number(e.target.value) })}
                            className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-lg font-mono font-bold text-stone-900 focus:bg-white"
                          />
                          <span className="text-stone-500 font-semibold whitespace-nowrap text-[11px]">сом/м³</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Pasture tariffs */}
                  <div className="border-t border-stone-100 pt-3">
                    <h4 className="font-bold text-stone-900 mb-2">Жайыт пайдалануу акысы (сезон 5 ай / 1 айлык):</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                        <span className="font-bold text-stone-800 block">Бодо мал (уй):</span>
                        <div className="mt-1 space-y-1">
                          <input
                            type="number"
                            value={localTariffs.pastureCattleSeason}
                            onChange={(e) => setLocalTariffs({ ...localTariffs, pastureCattleSeason: Number(e.target.value) })}
                            className="w-full px-2 py-1 bg-white border border-stone-300 rounded text-xs font-mono font-bold"
                          />
                          <span className="text-[10px] text-stone-500 block">Сезондук тариф (сом)</span>
                        </div>
                      </div>

                      <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                        <span className="font-bold text-stone-800 block">Жылкы:</span>
                        <div className="mt-1 space-y-1">
                          <input
                            type="number"
                            value={localTariffs.pastureHorseSeason}
                            onChange={(e) => setLocalTariffs({ ...localTariffs, pastureHorseSeason: Number(e.target.value) })}
                            className="w-full px-2 py-1 bg-white border border-stone-300 rounded text-xs font-mono font-bold"
                          />
                          <span className="text-[10px] text-stone-500 block">Сезондук тариф (сом)</span>
                        </div>
                      </div>

                      <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                        <span className="font-bold text-stone-800 block">Кой жана эчки:</span>
                        <div className="mt-1 space-y-1">
                          <input
                            type="number"
                            value={localTariffs.pastureSheepSeason}
                            onChange={(e) => setLocalTariffs({ ...localTariffs, pastureSheepSeason: Number(e.target.value) })}
                            className="w-full px-2 py-1 bg-white border border-stone-300 rounded text-xs font-mono font-bold"
                          />
                          <span className="text-[10px] text-stone-500 block">Сезондук тариф (сом)</span>
                        </div>
                      </div>

                      <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                        <span className="font-bold text-stone-800 block">Топоз:</span>
                        <div className="mt-1 space-y-1">
                          <input
                            type="number"
                            value={localTariffs.pastureYakSeason}
                            onChange={(e) => setLocalTariffs({ ...localTariffs, pastureYakSeason: Number(e.target.value) })}
                            className="w-full px-2 py-1 bg-white border border-stone-300 rounded text-xs font-mono font-bold"
                          />
                          <span className="text-[10px] text-stone-500 block">Сезондук тариф (сом)</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Тарифтерди сактоо жана жаңылоо</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Machinery management */}
              <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-xs space-y-4">
                <div className="border-b border-stone-100 pb-3">
                  <h3 className="text-sm font-bold text-stone-900">
                    2. Атайын техникалардын бааларын жана статусун башкаруу
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {machineryCatalog.map(machine => (
                    <div key={machine.id} className="p-4 rounded-xl border border-stone-200 bg-stone-50/60 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between">
                          <h4 className="font-bold text-stone-900 text-xs">{machine.name}</h4>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            machine.status === 'бош' ? 'bg-emerald-100 text-emerald-800' :
                            machine.status === 'иште' ? 'bg-amber-100 text-amber-800' :
                            'bg-rose-100 text-rose-800'
                          }`}>
                            {machine.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-500 font-mono mt-0.5">{machine.model}</p>
                        <div className="mt-2 text-[11px] text-stone-600 space-y-0.5">
                          <div>Сааттык тариф: <strong className="font-mono text-stone-900">{machine.hourlyRate} сом</strong></div>
                          <div>Смена (8 саат): <strong className="font-mono text-stone-900">{machine.shiftRate} сом</strong></div>
                          {machine.tripRate && (
                            <div>Рейс тарифи: <strong className="font-mono text-stone-900">{machine.tripRate} сом</strong></div>
                          )}
                        </div>
                      </div>

                      <div className="mt-3 pt-2 border-t border-stone-200 flex items-center justify-between">
                        <button
                          onClick={() => setEditingMachine(machine)}
                          className="text-xs font-semibold text-emerald-700 hover:underline cursor-pointer"
                        >
                          Баасын же статусун өзгөртүү →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Edit Machinery Modal */}
              {editingMachine && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                  <div className="bg-white rounded-2xl p-6 max-w-md w-full border border-stone-200 shadow-2xl space-y-4">
                    <h3 className="text-base font-bold text-stone-900">
                      Техниканы өзгөртүү: {editingMachine.name}
                    </h3>

                    <form onSubmit={handleSaveMachine} className="space-y-3 text-xs">
                      <div>
                        <label className="block text-stone-700 font-semibold mb-1">Техниканын аталышы:</label>
                        <input
                          type="text"
                          value={editingMachine.name}
                          onChange={(e) => setEditingMachine({ ...editingMachine, name: e.target.value })}
                          className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs font-bold"
                          placeholder="Мисалы: Экскаватор-жүктөгүч"
                        />
                      </div>

                      <div>
                        <label className="block text-stone-700 font-semibold mb-1">Маркасы жана модели:</label>
                        <input
                          type="text"
                          value={editingMachine.model}
                          onChange={(e) => setEditingMachine({ ...editingMachine, model: e.target.value })}
                          className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs"
                          placeholder="Мисалы: JCB 3CX Super"
                        />
                      </div>

                      <div>
                        <label className="block text-stone-700 font-semibold mb-1">Статусу:</label>
                        <select
                          value={editingMachine.status}
                          onChange={(e) => setEditingMachine({ ...editingMachine, status: e.target.value as any })}
                          className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs"
                        >
                          <option value="бош">Бош (Иштөөгө даяр)</option>
                          <option value="иште">Иште (Заказ аткарууда)</option>
                          <option value="ремонтто">Ремонтто (Техникалык тейлөөдө)</option>
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-stone-700 font-semibold mb-1">Сааттык баасы (сом):</label>
                          <input
                            type="number"
                            value={editingMachine.hourlyRate}
                            onChange={(e) => setEditingMachine({ ...editingMachine, hourlyRate: Number(e.target.value) })}
                            className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs font-mono font-bold"
                          />
                        </div>
                        <div>
                          <label className="block text-stone-700 font-semibold mb-1">Сменалык баасы (сом):</label>
                          <input
                            type="number"
                            value={editingMachine.shiftRate}
                            onChange={(e) => setEditingMachine({ ...editingMachine, shiftRate: Number(e.target.value) })}
                            className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs font-mono font-bold"
                          />
                        </div>
                      </div>

                      {editingMachine.tripRate !== undefined && (
                        <div>
                          <label className="block text-stone-700 font-semibold mb-1">1 рейс баасы (сом):</label>
                          <input
                            type="number"
                            value={editingMachine.tripRate}
                            onChange={(e) => setEditingMachine({ ...editingMachine, tripRate: Number(e.target.value) })}
                            className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs font-mono font-bold"
                          />
                        </div>
                      )}

                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setEditingMachine(null)}
                          className="px-3.5 py-2 text-xs font-semibold text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-lg cursor-pointer"
                        >
                          Жокко чыгаруу
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg cursor-pointer"
                        >
                          Сактоо
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================= TAB 7: REPORTS & DEBTORS ================= */}
          {activeTab === 'reports' && (
            <div className="space-y-6 max-w-6xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-extrabold text-stone-900">
                    Финансылык жана Чарбалык отчеттор
                  </h2>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Кассалык кирешелер, дебитордук карыздар жана айыл өкмөтүнө расмий маалымкаттар
                  </p>
                </div>

                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-stone-900 hover:bg-stone-800 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Отчетту басып чыгаруу (Печать)</span>
                </button>
              </div>

              {/* Debtors List */}
              <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-stone-900">
                      Карызы бар абоненттердин тизмеси (Дебиторлор)
                    </h3>
                    <p className="text-xs text-stone-500">
                      Суу, таштанды же жайыт боюнча карызы бар үй чарбалар
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-md">
                    {totalDebtorsCount} карызкор
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-stone-700">
                    <thead className="bg-stone-50 text-stone-500 uppercase tracking-wider text-[11px] border-b border-stone-200">
                      <tr>
                        <th className="py-2.5 px-3">Эсеп №</th>
                        <th className="py-2.5 px-3">Абонент</th>
                        <th className="py-2.5 px-3">Дареги</th>
                        <th className="py-2.5 px-3">Телефону</th>
                        <th className="py-2.5 px-3 text-right">Суу карызы</th>
                        <th className="py-2.5 px-3 text-right">Таштанды карызы</th>
                        <th className="py-2.5 px-3 text-right">Жалпы карыз</th>
                        <th className="py-2.5 px-3 text-center">Аракет</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {subscribers
                        .filter(s => s.waterBalance < 0 || s.wasteBalance < 0 || s.pastureBalance < 0)
                        .map(sub => {
                          const wDebt = Math.abs(Math.min(0, sub.waterBalance));
                          const wsDebt = Math.abs(Math.min(0, sub.wasteBalance));
                          const pDebt = Math.abs(Math.min(0, sub.pastureBalance));
                          const total = wDebt + wsDebt + pDebt;
                          return (
                            <tr key={sub.id} className="hover:bg-stone-50/70">
                              <td className="py-3 px-3 font-mono font-bold text-stone-900">№{sub.id}</td>
                              <td className="py-3 px-3 font-semibold text-stone-900">{sub.fullName}</td>
                              <td className="py-3 px-3 text-stone-500">{sub.address}</td>
                              <td className="py-3 px-3 font-mono text-stone-600">{sub.phone}</td>
                              <td className="py-3 px-3 text-right font-mono text-rose-600 tabular-nums">
                                {wDebt > 0 ? `${wDebt} с.` : '—'}
                              </td>
                              <td className="py-3 px-3 text-right font-mono text-rose-600 tabular-nums">
                                {wsDebt > 0 ? `${wsDebt} с.` : '—'}
                              </td>
                              <td className="py-3 px-3 text-right font-mono font-extrabold text-rose-700 tabular-nums text-sm">
                                {total.toLocaleString('ru-RU')} сом
                              </td>
                              <td className="py-3 px-3 text-center">
                                <button
                                  onClick={() => {
                                    handleSelectCashierSubscriber(sub);
                                    setActiveTab('cashier');
                                  }}
                                  className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold rounded text-[11px] cursor-pointer"
                                >
                                  Кассага алуу
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Transactions archive */}
              <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                  <h3 className="text-sm font-bold text-stone-900">
                    Кассалык транзакциялардын толук архиви
                  </h3>
                  <span className="text-xs text-stone-400 font-mono">
                    Жалпы: {transactions.length} чек
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-stone-700">
                    <thead className="bg-stone-50 text-stone-500 uppercase tracking-wider text-[11px] border-b border-stone-200">
                      <tr>
                        <th className="py-2.5 px-3">Квитанция №</th>
                        <th className="py-2.5 px-3">Убактысы</th>
                        <th className="py-2.5 px-3">Төлөөчү</th>
                        <th className="py-2.5 px-3">Кызмат</th>
                        <th className="py-2.5 px-3">Ыкмасы</th>
                        <th className="py-2.5 px-3 text-right">Суммасы</th>
                        <th className="py-2.5 px-3 text-center">Чек</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {transactions.map(tx => (
                        <tr key={tx.id} className="hover:bg-stone-50/70">
                          <td className="py-3 px-3 font-mono font-semibold text-stone-900">{tx.receiptNumber}</td>
                          <td className="py-3 px-3 font-mono text-stone-500">{tx.timestamp}</td>
                          <td className="py-3 px-3 font-medium text-stone-900">{tx.payerName}</td>
                          <td className="py-3 px-3 text-stone-600">{tx.serviceName}</td>
                          <td className="py-3 px-3">{tx.paymentMethod}</td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700 tabular-nums">
                            {tx.amount.toLocaleString('ru-RU')} сом
                          </td>
                          <td className="py-3 px-3 text-center">
                            <button
                              onClick={() => setActiveReceipt(tx)}
                              className="px-2 py-1 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded text-[11px] font-semibold cursor-pointer"
                            >
                              Көрүү
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Printable Receipt Modal if requested */}
      {activeReceipt && (
        <ReceiptModal
          transaction={activeReceipt}
          onClose={() => setActiveReceipt(null)}
        />
      )}
    </div>
  );
};
