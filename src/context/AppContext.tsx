import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
  SubscriberAccount,
  MachineryItem,
  MachineryOrder,
  CitizenTicket,
  PaymentTransaction,
  TariffConfig,
  SiteSettings,
  PastureZone,
  MACHINERY_CATALOG,
  INITIAL_TARIFFS,
  INITIAL_SITE_SETTINGS,
  PASTURE_ZONES
} from '../data/mockData';
import { db, auth, getSession, ApiError, consumeAuthRedirect } from '../lib/supabase';
import { SiteContent, DEFAULT_CONTENT, mergeContent } from '../data/content';
import { rememberRequest } from '../utils/myDevice';

// ---------- Базадагы абонент ↔ сайттагы абонент ----------
interface SubscriberRow {
  id: string;
  full_name: string;
  address: string;
  phone: string;
  water_balance: number;
  water_last_meter_reading: number;
  water_tariff_per_m3: number;
  waste_balance: number;
  waste_family_members: number;
  waste_tariff_per_person: number;
  pasture_balance: number;
  livestock: SubscriberAccount['registeredLivestock'];
}

const fromRow = (r: SubscriberRow): SubscriberAccount => ({
  id: r.id,
  fullName: r.full_name,
  address: r.address,
  phone: r.phone,
  waterBalance: Number(r.water_balance),
  waterLastMeterReading: Number(r.water_last_meter_reading),
  waterTariffPerM3: Number(r.water_tariff_per_m3),
  wasteBalance: Number(r.waste_balance),
  wasteFamilyMembers: Number(r.waste_family_members),
  wasteTariffPerPerson: Number(r.waste_tariff_per_person),
  pastureBalance: Number(r.pasture_balance),
  registeredLivestock: r.livestock || { cattle: 0, horses: 0, sheepGoats: 0, yaks: 0 }
});

const toRow = (s: SubscriberAccount): SubscriberRow => ({
  id: s.id,
  full_name: s.fullName,
  address: s.address,
  phone: s.phone,
  water_balance: Number(s.waterBalance) || 0,
  water_last_meter_reading: Number(s.waterLastMeterReading) || 0,
  water_tariff_per_m3: Number(s.waterTariffPerM3) || 0,
  waste_balance: Number(s.wasteBalance) || 0,
  waste_family_members: Number(s.wasteFamilyMembers) || 0,
  waste_tariff_per_person: Number(s.wasteTariffPerPerson) || 0,
  pasture_balance: Number(s.pastureBalance) || 0,
  livestock: s.registeredLivestock
});

const enc = encodeURIComponent;

export interface MeterResult {
  prev: number;
  new: number;
  consumed: number;
  amount: number;
}

export interface Review {
  id: string;
  name: string;
  village: string;
  rating: number;
  text: string;
  approved: boolean;
  created_at: string;
}

export interface OrderStatus {
  id: string;
  machineName: string;
  status: string;
  orderDate: string;
  totalEstimate: number;
  paymentStatus: string;
}

export interface AccountHistory {
  payments: Pick<PaymentTransaction, 'id' | 'receiptNumber' | 'timestamp' | 'serviceType' | 'serviceName' | 'amount' | 'paymentMethod' | 'status' | 'accountId'>[];
  readings: { date: string; prev: number; new: number; amount: number }[];
}

export interface AdminInfo {
  email: string;
  addedAt: string;
  registered: boolean;
  confirmed: boolean;
  lastSignIn: string | null;
}

type Result = { ok: boolean; error?: string; info?: string };

export type TicketInput = Pick<CitizenTicket, 'category' | 'name' | 'phone' | 'address' | 'description'> & {
  photo?: string;
};

export type OrderInput = Omit<MachineryOrder, 'id' | 'status' | 'paymentStatus' | 'createdAt' | 'machineName'> & {
  machineName?: string;
};

interface AppContextType {
  subscribers: SubscriberAccount[];
  machineryCatalog: MachineryItem[];
  machineryOrders: MachineryOrder[];
  citizenTickets: CitizenTicket[];
  transactions: PaymentTransaction[];
  tariffs: TariffConfig;
  siteSettings: SiteSettings;
  pastureZones: PastureZone[];
  isAdminLoggedIn: boolean;
  adminEmail: string | null;
  isEditModeActive: boolean;
  isLoading: boolean;
  connectionError: string | null;
  errorNotice: string | null;
  clearErrorNotice: () => void;

  setIsEditModeActive: (active: boolean) => void;

  // Эл үчүн (сервердеги функциялар аркылуу)
  createTicket: (input: TicketInput) => Promise<string>;
  getTicketStatus: (id: string) => Promise<CitizenTicket | null>;
  getOrderStatus: (id: string) => Promise<OrderStatus | null>;
  getAccountHistory: (id: string) => Promise<AccountHistory | null>;
  createMachineryOrder: (input: OrderInput) => Promise<string>;
  lookupSubscriber: (id: string) => Promise<SubscriberAccount | null>;
  submitMeterReading: (accountId: string, reading: number, phone: string) => Promise<MeterResult>;

  // Админ үчүн
  addPayment: (payment: PaymentTransaction) => void;
  addMachineryOrder: (order: MachineryOrder) => void;
  updateMachineryOrder: (orderId: string, updates: Partial<MachineryOrder>) => void;
  addCitizenTicket: (ticket: CitizenTicket) => void;
  updateCitizenTicket: (ticketId: string, updates: Partial<CitizenTicket>) => void;
  updateSubscriber: (subscriber: SubscriberAccount) => void;
  addSubscriber: (subscriber: SubscriberAccount) => void;
  updateMachineryItem: (item: MachineryItem) => void;
  addMachineryItem: (item: MachineryItem) => void;
  deleteMachineryItem: (id: string) => void;
  content: SiteContent;
  reviews: Review[];
  submitReview: (r: { name: string; village: string; rating: number; text: string }) => Promise<Result>;
  listAllReviews: () => Promise<Review[]>;
  setReviewApproved: (id: string, approved: boolean) => Promise<Result>;
  deleteReview: (id: string) => Promise<Result>;
  updateContent: <K extends keyof SiteContent>(key: K, data: SiteContent[K]) => Promise<Result>;
  updateTariffs: (newTariffs: TariffConfig) => void;
  updateSiteSettings: (updates: Partial<SiteSettings>) => void;
  updatePastureZone: (zoneId: string, updates: Partial<PastureZone>) => void;
  addPastureZone: (zone: PastureZone) => void;
  deletePastureZone: (zoneId: string) => void;
  loginAdmin: (email: string, password: string) => Promise<Result>;
  registerAdmin: (email: string, password: string) => Promise<Result>;
  requestPasswordReset: (email: string) => Promise<Result>;
  completePasswordRecovery: (newPassword: string) => Promise<Result>;
  changeAdminPassword: (newPassword: string) => Promise<Result>;
  passwordRecoveryActive: boolean;
  authMessage: string | null;
  clearAuthMessage: () => void;
  listAdmins: () => Promise<AdminInfo[]>;
  addAdmin: (email: string) => Promise<Result>;
  removeAdmin: (email: string) => Promise<Result>;
  logoutAdmin: () => void;
  refreshData: (keepNonAdminSession?: boolean) => Promise<void>;
  resetToDefaults: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const errText = (e: unknown) => (e instanceof Error ? e.message : 'Белгисиз ката');

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Ачык маалымат: сервер жооп бергиче баштапкы тексттер көрсөтүлөт
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(INITIAL_SITE_SETTINGS);
  const settingsRef = useRef<SiteSettings>(INITIAL_SITE_SETTINGS);
  useEffect(() => {
    settingsRef.current = siteSettings;
  }, [siteSettings]);
  const [tariffs, setTariffs] = useState<TariffConfig>(INITIAL_TARIFFS);
  const [machineryCatalog, setMachineryCatalog] = useState<MachineryItem[]>(MACHINERY_CATALOG);
  const [pastureZones, setPastureZones] = useState<PastureZone[]>(PASTURE_ZONES);
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [content, setContent] = useState<SiteContent>(DEFAULT_CONTENT);
  const [reviews, setReviews] = useState<Review[]>([]);

  // Админге гана жүктөлүүчү жеке маалымат
  const [subscribers, setSubscribers] = useState<SubscriberAccount[]>([]);
  const [machineryOrders, setMachineryOrders] = useState<MachineryOrder[]>([]);
  const [citizenTickets, setCitizenTickets] = useState<CitizenTicket[]>([]);

  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminEmail, setAdminEmail] = useState<string | null>(null);
  const [isEditModeActive, setIsEditModeActive] = useState(false);
  // Админ киргенде сайттын бетиндеги «Өзгөртүү» баскычтары дароо көрүнсүн
  useEffect(() => {
    setIsEditModeActive(isAdminLoggedIn);
  }, [isAdminLoggedIn]);
  const [isLoading, setIsLoading] = useState(true);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [passwordRecoveryActive, setPasswordRecoveryActive] = useState(false);
  const [authMessage, setAuthMessage] = useState<string | null>(null);

  // Админдин өзгөртүүсү серверге сакталбай калса — экранга чыгарабыз
  const report = useCallback((e: unknown) => {
    console.error(e);
    setErrorNotice(`Сакталган жок: ${errText(e)}`);
  }, []);

  const loadPublic = useCallback(async () => {
    const [config, machines, zones, recent] = await Promise.all([
      db.select<{ key: string; value: any }>('site_config'),
      db.select<{ id: string; data: MachineryItem }>('machinery', 'select=id,data&order=sort.asc'),
      db.select<{ id: string; data: PastureZone }>('pasture_zones', 'select=id,data&order=sort.asc'),
      db.rpc<PaymentTransaction[]>('recent_transactions')
    ]);
    const s = config.find(c => c.key === 'site_settings');
    const t = config.find(c => c.key === 'tariffs');
    if (s) setSiteSettings({ ...INITIAL_SITE_SETTINGS, ...s.value });
    if (t) setTariffs({ ...INITIAL_TARIFFS, ...t.value });
    // Сүрөт жолдорун салыштырмалуу кылабыз (сайт папкадан ачылса да иштеши үчүн)
    if (machines.length) setMachineryCatalog(machines.map(m => ({ ...m.data, image: m.data.image?.replace(/^\/images\//, 'images/') })));
    setPastureZones(zones.map(z => z.data));
    setTransactions(recent || []);
    // Мазмун блоктору (003_content.sql иштетиле элек болсо — баштапкы тексттер калат)
    try {
      setContent(mergeContent(await db.select<{ key: string; data: unknown }>('content_blocks', 'select=key,data')));
    } catch (e) {
      console.warn('content_blocks:', e);
    }
    // Жарыяланган пикирлер (005_reviews.sql иштетиле элек болсо — бош)
    try {
      setReviews(
        (await db.select<Review>('reviews', 'select=id,name,village,rating,text,approved,created_at&order=created_at.desc&limit=200')).filter(
          r => r.approved
        )
      );
    } catch (e) {
      console.warn('reviews:', e);
    }
  }, []);

  const loadAdmin = useCallback(async () => {
    const [subs, orders, tickets, txs] = await Promise.all([
      db.select<SubscriberRow>('subscribers', 'select=*&order=id.asc'),
      db.select<{ data: MachineryOrder }>('machinery_orders', 'select=data&order=created_at.desc'),
      db.select<{ data: CitizenTicket }>('citizen_tickets', 'select=data&order=created_at.desc'),
      db.select<{ data: PaymentTransaction }>('transactions', 'select=data&order=created_at.desc&limit=500')
    ]);
    setSubscribers(subs.map(fromRow));
    setMachineryOrders(orders.map(o => o.data));
    setCitizenTickets(tickets.map(t => t.data));
    setTransactions(txs.map(t => t.data));
  }, []);

  const clearAdminData = () => {
    setSubscribers([]);
    setMachineryOrders([]);
    setCitizenTickets([]);
  };

  // Сессия бар болсо — админ экенин сервер аркылуу текшеребиз
  const checkAdmin = useCallback(async (): Promise<boolean> => {
    const s = getSession();
    if (!s) return false;
    const ok = await db.rpc<boolean>('is_admin');
    if (ok) {
      setIsAdminLoggedIn(true);
      setAdminEmail(s.email);
      await loadAdmin();
    }
    return !!ok;
  }, [loadAdmin]);

  const refreshData = useCallback(async (keepNonAdminSession = false) => {
    setIsLoading(true);
    try {
      await loadPublic();
      if (getSession()) {
        const ok = await checkAdmin();
        if (!ok && !keepNonAdminSession) {
          await auth.signOut();
          setIsAdminLoggedIn(false);
        }
      }
      setConnectionError(null);
    } catch (e) {
      setConnectionError(errText(e));
    } finally {
      setIsLoading(false);
    }
  }, [loadPublic, checkAdmin]);

  useEffect(() => {
    // Мурунку версия маалыматты браузерде сактачу — аны тазалайбыз
    try {
      Object.keys(localStorage)
        .filter(k => k.startsWith('tazalyk_portal_'))
        .forEach(k => localStorage.removeItem(k));
    } catch {
      // ignore
    }
    (async () => {
      // Почтадагы шилтемеден келдиби? (катталууну ырастоо / сырсөздү калыбына келтирүү)
      const r = await consumeAuthRedirect();
      if (r?.error) {
        setAuthMessage(r.error);
      } else if (r?.type === 'recovery') {
        setPasswordRecoveryActive(true);
      } else if (r) {
        setAuthMessage('Email ырасталды! Эгер сиз админ болсоңуз, башкаруу панели ачылат. Болбосо учурдагы админден сизди «Админдер» бөлүмүнө кошууну сураныңыз.');
      }
      await refreshData(r?.type === 'recovery');
    })();
  }, [refreshData]);

  // ================= Эл үчүн аракеттер =================

  const createTicket = async (input: TicketInput): Promise<string> => {
    const id = await db.rpc<string>('create_ticket', {
      p_category: input.category,
      p_name: input.name,
      p_phone: input.phone,
      p_address: input.address,
      p_description: input.description,
      p_photo: input.photo ?? null
    });
    rememberRequest(id, 'ticket');
    if (isAdminLoggedIn) loadAdmin().catch(() => undefined);
    return id;
  };

  const getTicketStatus = async (id: string): Promise<CitizenTicket | null> => {
    const r = await db.rpc<CitizenTicket | null>('get_ticket_status', { p_id: id });
    return r || null;
  };

  const createMachineryOrder = async (input: OrderInput): Promise<string> => {
    const id = await db.rpc<string>('create_machinery_order', { p_order: input });
    rememberRequest(id, 'order');
    if (isAdminLoggedIn) loadAdmin().catch(() => undefined);
    return id;
  };

  const getOrderStatus = async (id: string): Promise<OrderStatus | null> => {
    try {
      return (await db.rpc<OrderStatus | null>('get_order_status', { p_id: id })) || null;
    } catch {
      return null;
    }
  };

  const getAccountHistory = async (id: string): Promise<AccountHistory | null> => {
    try {
      const r = await db.rpc<AccountHistory | null>('account_history', { p_id: id });
      if (!r) return null;
      return {
        payments: (r.payments || []).map(p => ({ ...p, amount: Number(p.amount) })),
        readings: (r.readings || []).map(x => ({ date: x.date, prev: Number(x.prev), new: Number(x.new), amount: Number(x.amount) }))
      };
    } catch {
      return null; // 007_cabinet.sql иштетиле элек болсо
    }
  };

  const lookupSubscriber = async (id: string): Promise<SubscriberAccount | null> => {
    const r = await db.rpc<SubscriberAccount | null>('lookup_subscriber', { p_id: id });
    if (!r) return null;
    return {
      ...r,
      waterBalance: Number(r.waterBalance),
      waterLastMeterReading: Number(r.waterLastMeterReading),
      waterTariffPerM3: Number(r.waterTariffPerM3),
      wasteBalance: Number(r.wasteBalance),
      wasteFamilyMembers: Number(r.wasteFamilyMembers),
      wasteTariffPerPerson: Number(r.wasteTariffPerPerson),
      pastureBalance: Number(r.pastureBalance)
    };
  };

  const submitMeterReading = async (accountId: string, reading: number, phone: string): Promise<MeterResult> => {
    const r = await db.rpc<MeterResult>('submit_meter_reading', {
      p_account: accountId,
      p_reading: reading,
      p_phone: phone
    });
    if (isAdminLoggedIn) loadAdmin().catch(() => undefined);
    return r;
  };

  // ================= Админ аракеттери =================
  // Экранда дароо жаңыртабыз, анан серверге сактайбыз. Ката болсо — билдирүү чыгат
  // жана маалымат серверден кайра жүктөлөт.

  const persist = (p: Promise<unknown>) => {
    p.catch(e => {
      report(e);
      refreshData();
    });
  };

  const addPayment = (payment: PaymentTransaction) => {
    setTransactions(prev => [payment, ...prev]);
    setSubscribers(prev => prev.map(sub => {
      if (sub.id !== payment.accountId) return sub;
      if (payment.serviceType === 'water') return { ...sub, waterBalance: sub.waterBalance + payment.amount };
      if (payment.serviceType === 'waste') return { ...sub, wasteBalance: sub.wasteBalance + payment.amount };
      if (payment.serviceType === 'pasture') return { ...sub, pastureBalance: sub.pastureBalance + payment.amount };
      return sub;
    }));
    persist(db.rpc('admin_add_payment', { p_tx: payment }));
  };

  const addMachineryOrder = (order: MachineryOrder) => {
    setMachineryOrders(prev => [order, ...prev]);
    persist(db.insert('machinery_orders', { id: order.id, phone: order.customerPhone.replace(/\D/g, ''), data: order }));
  };

  const updateMachineryOrder = (orderId: string, updates: Partial<MachineryOrder>) => {
    const current = machineryOrders.find(o => o.id === orderId);
    if (!current) return;
    const merged = { ...current, ...updates };
    setMachineryOrders(prev => prev.map(o => (o.id === orderId ? merged : o)));
    persist(db.update('machinery_orders', `id=eq.${enc(orderId)}`, { data: merged }));
  };

  const addCitizenTicket = (ticket: CitizenTicket) => {
    setCitizenTickets(prev => [ticket, ...prev]);
    persist(db.insert('citizen_tickets', { id: ticket.id, phone: ticket.phone.replace(/\D/g, ''), data: ticket }));
  };

  const updateCitizenTicket = (ticketId: string, updates: Partial<CitizenTicket>) => {
    const current = citizenTickets.find(t => t.id === ticketId);
    if (!current) return;
    const merged = { ...current, ...updates };
    setCitizenTickets(prev => prev.map(t => (t.id === ticketId ? merged : t)));
    persist(db.update('citizen_tickets', `id=eq.${enc(ticketId)}`, { data: merged }));
  };

  const updateSubscriber = (updated: SubscriberAccount) => {
    setSubscribers(prev => prev.map(s => (s.id === updated.id ? updated : s)));
    const { id: _id, ...values } = toRow(updated);
    persist(db.update('subscribers', `id=eq.${enc(updated.id)}`, values));
  };

  const addSubscriber = (newSub: SubscriberAccount) => {
    setSubscribers(prev => [newSub, ...prev]);
    persist(db.insert('subscribers', toRow(newSub)));
  };

  const addMachineryItem = (item: MachineryItem) => {
    setMachineryCatalog(prev => [...prev, item]);
    persist(db.insert('machinery', { id: item.id, data: item, sort: machineryCatalog.length }));
  };

  const deleteMachineryItem = (id: string) => {
    setMachineryCatalog(prev => prev.filter(m => m.id !== id));
    persist(db.remove('machinery', `id=eq.${enc(id)}`));
  };

  const updateContent = async <K extends keyof SiteContent>(key: K, data: SiteContent[K]): Promise<Result> => {
    const prev = content[key];
    setContent(c => ({ ...c, [key]: data }));
    try {
      await db.upsert('content_blocks', { key, data, updated_at: new Date().toISOString() });
      return { ok: true };
    } catch (e) {
      setContent(c => ({ ...c, [key]: prev }));
      const msg = errText(e);
      return {
        ok: false,
        error: /content_blocks|schema cache|does not exist|даяр эмес/i.test(msg)
          ? "Маалымат базасы даяр эмес: supabase/003_content.sql файлын Supabase'те иштетиңиз."
          : msg
      };
    }
  };

  const updateMachineryItem = (item: MachineryItem) => {
    setMachineryCatalog(prev => prev.map(m => (m.id === item.id ? item : m)));
    const sort = machineryCatalog.findIndex(m => m.id === item.id);
    persist(db.upsert('machinery', { id: item.id, data: item, sort: Math.max(0, sort) }));
  };

  const updateTariffs = (newTariffs: TariffConfig) => {
    setTariffs(newTariffs);
    setSubscribers(prev => prev.map(s => ({
      ...s,
      waterTariffPerM3: newTariffs.waterPerM3,
      wasteTariffPerPerson: newTariffs.wastePerPerson
    })));
    persist(
      db.upsert('site_config', { key: 'tariffs', value: newTariffs, updated_at: new Date().toISOString() }).then(() =>
        db.update('subscribers', 'id=not.is.null', {
          water_tariff_per_m3: newTariffs.waterPerM3,
          waste_tariff_per_person: newTariffs.wastePerPerson
        })
      )
    );
  };

  const updateSiteSettings = (updates: Partial<SiteSettings>) => {
    // Акыркы абалдын үстүнө гана кошобуз (эски көчүрмө менен үстүнө жазып жибербеш үчүн)
    const merged = { ...settingsRef.current, ...updates };
    settingsRef.current = merged;
    setSiteSettings(merged);
    persist(db.upsert('site_config', { key: 'site_settings', value: merged, updated_at: new Date().toISOString() }));
  };

  const addPastureZone = (zone: PastureZone) => {
    setPastureZones(prev => [...prev, zone]);
    persist(db.upsert('pasture_zones', { id: zone.id, data: zone, sort: pastureZones.length }));
  };
  const deletePastureZone = (zoneId: string) => {
    setPastureZones(prev => prev.filter(z => z.id !== zoneId));
    persist(db.remove('pasture_zones', `id=eq.${enc(zoneId)}`));
  };

  const updatePastureZone = (zoneId: string, updates: Partial<PastureZone>) => {
    const current = pastureZones.find(z => z.id === zoneId);
    if (!current) return;
    const merged = { ...current, ...updates };
    setPastureZones(prev => prev.map(z => (z.id === zoneId ? merged : z)));
    const sort = pastureZones.findIndex(z => z.id === zoneId);
    persist(db.upsert('pasture_zones', { id: zoneId, data: merged, sort: Math.max(0, sort) }));
  };

  const NOT_ADMIN_MSG =
    'Сиз катталгансыз, бирок азырынча админ эмессиз. Учурдагы админден email\'иңизди Башкаруу панелиндеги «Админдер» бөлүмүнө кошууну сураныңыз.';

  const loginAdmin = async (email: string, password: string): Promise<Result> => {
    try {
      await auth.signIn(email, password);
      const ok = await checkAdmin();
      if (!ok) {
        await auth.signOut();
        return { ok: false, error: NOT_ADMIN_MSG };
      }
      return { ok: true };
    } catch (e) {
      return { ok: false, error: errText(e) };
    }
  };

  const registerAdmin = async (email: string, password: string): Promise<Result> => {
    if (password.length < 8) return { ok: false, error: 'Сырсөз кеминде 8 белгиден турушу керек.' };
    try {
      const { needsConfirmation } = await auth.signUp(email, password);
      if (needsConfirmation) {
        return {
          ok: true,
          info: auth.canReceiveEmailLinks()
            ? `${email} дарегине ырастоо каты жөнөтүлдү. Каттагы шилтемени басыңыз, анан ушул жерден кириңиз.`
            : `${email} дарегине ырастоо каты жөнөтүлдү. Каттагы шилтемени басыңыз (ачылган барак ката көрсөтсө да email ырасталат), анан ушул жерден кириңиз.`
        };
      }
      const ok = await checkAdmin();
      if (!ok) {
        await auth.signOut();
        return { ok: true, info: 'Катталдыңыз! ' + NOT_ADMIN_MSG };
      }
      return { ok: true };
    } catch (e) {
      return { ok: false, error: errText(e) };
    }
  };

  const requestPasswordReset = async (email: string): Promise<Result> => {
    try {
      await auth.sendPasswordReset(email);
      return {
        ok: true,
        info: auth.canReceiveEmailLinks()
          ? `Эгер ${email} катталган болсо, ага сырсөздү калыбына келтирүү шилтемеси жөнөтүлдү.`
          : `Шилтеме жөнөтүлдү, бирок ал сайт интернетке жайгаштырылганда гана иштейт. Азыр сырсөздү Supabase панелинен алмаштырыңыз.`
      };
    } catch (e) {
      return { ok: false, error: errText(e) };
    }
  };

  const completePasswordRecovery = async (newPassword: string): Promise<Result> => {
    if (newPassword.length < 8) return { ok: false, error: 'Сырсөз кеминде 8 белгиден турушу керек.' };
    try {
      await auth.changePassword(newPassword);
      setPasswordRecoveryActive(false);
      const ok = await checkAdmin();
      if (!ok) {
        await auth.signOut();
        return { ok: true, info: 'Сырсөз алмаштырылды. ' + NOT_ADMIN_MSG };
      }
      return { ok: true, info: 'Сырсөз алмаштырылды!' };
    } catch (e) {
      return { ok: false, error: errText(e) };
    }
  };

  const changeAdminPassword = async (newPassword: string): Promise<Result> => {
    if (newPassword.length < 8) return { ok: false, error: 'Сырсөз кеминде 8 белгиден турушу керек.' };
    try {
      await auth.changePassword(newPassword);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: errText(e) };
    }
  };

  const REVIEWS_MISSING = "Пикирлер таблицасы жок: supabase/005_reviews.sql файлын Supabase'те иштетиңиз.";
  const reviewErr = (e: unknown) => {
    const m = errText(e);
    return /reviews|submit_review|schema cache|does not exist|Could not find/i.test(m) ? REVIEWS_MISSING : m;
  };
  const submitReview = async (r: { name: string; village: string; rating: number; text: string }): Promise<Result> => {
    try {
      await db.rpc('submit_review', { p_name: r.name, p_village: r.village, p_rating: r.rating, p_text: r.text });
      return { ok: true };
    } catch (e) {
      return { ok: false, error: reviewErr(e) };
    }
  };
  const listAllReviews = async (): Promise<Review[]> => {
    try {
      return await db.select<Review>('reviews', 'select=id,name,village,rating,text,approved,created_at&order=created_at.desc&limit=500');
    } catch (e) {
      throw new Error(reviewErr(e));
    }
  };
  const refreshPublicReviews = (all: Review[]) => setReviews(all.filter(r => r.approved));
  const setReviewApproved = async (id: string, approved: boolean): Promise<Result> => {
    try {
      await db.update('reviews', `id=eq.${enc(id)}`, { approved });
      refreshPublicReviews(await listAllReviews());
      return { ok: true };
    } catch (e) {
      return { ok: false, error: reviewErr(e) };
    }
  };
  const deleteReview = async (id: string): Promise<Result> => {
    try {
      await db.remove('reviews', `id=eq.${enc(id)}`);
      refreshPublicReviews(await listAllReviews());
      return { ok: true };
    } catch (e) {
      return { ok: false, error: reviewErr(e) };
    }
  };

  const listAdmins = async (): Promise<AdminInfo[]> => (await db.rpc<AdminInfo[]>('admin_list')) || [];

  const addAdmin = async (email: string): Promise<Result> => {
    try {
      await db.rpc('admin_add', { p_email: email });
      return { ok: true };
    } catch (e) {
      return { ok: false, error: errText(e) };
    }
  };

  const removeAdmin = async (email: string): Promise<Result> => {
    try {
      await db.rpc('admin_remove', { p_email: email });
      return { ok: true };
    } catch (e) {
      return { ok: false, error: errText(e) };
    }
  };

  const logoutAdmin = () => {
    auth.signOut();
    setIsAdminLoggedIn(false);
    setAdminEmail(null);
    setIsEditModeActive(false);
    clearAdminData();
    loadPublic().catch(() => undefined);
  };

  // Мурунку "баштапкы абалга кайтаруу" чыныгы маалыматты өчүрүп салмак.
  // Эми ал серверден маалыматты кайра жүктөйт гана.
  const resetToDefaults = () => {
    refreshData();
  };

  return (
    <AppContext.Provider
      value={{
        subscribers,
        machineryCatalog,
        machineryOrders,
        citizenTickets,
        transactions,
        tariffs,
        siteSettings,
        pastureZones,
        isAdminLoggedIn,
        adminEmail,
        isEditModeActive,
        isLoading,
        connectionError,
        errorNotice,
        clearErrorNotice: () => setErrorNotice(null),
        setIsEditModeActive,
        createTicket,
        getTicketStatus,
        getOrderStatus,
        getAccountHistory,
        createMachineryOrder,
        lookupSubscriber,
        submitMeterReading,
        addPayment,
        addMachineryOrder,
        updateMachineryOrder,
        addCitizenTicket,
        updateCitizenTicket,
        updateSubscriber,
        addSubscriber,
        updateMachineryItem,
        addMachineryItem,
        deleteMachineryItem,
        content,
        reviews,
        submitReview,
        listAllReviews,
        setReviewApproved,
        deleteReview,
        updateContent,
        updateTariffs,
        updateSiteSettings,
        updatePastureZone,
        addPastureZone,
        deletePastureZone,
        loginAdmin,
        registerAdmin,
        requestPasswordReset,
        completePasswordRecovery,
        changeAdminPassword,
        passwordRecoveryActive,
        authMessage,
        clearAuthMessage: () => setAuthMessage(null),
        listAdmins,
        addAdmin,
        removeAdmin,
        logoutAdmin,
        refreshData,
        resetToDefaults
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export { ApiError };
