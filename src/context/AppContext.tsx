import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
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
import { db, auth, getSession, ApiError } from '../lib/supabase';

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
  updateTariffs: (newTariffs: TariffConfig) => void;
  updateSiteSettings: (updates: Partial<SiteSettings>) => void;
  updatePastureZone: (zoneId: string, updates: Partial<PastureZone>) => void;
  loginAdmin: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  changeAdminPassword: (newPassword: string) => Promise<{ ok: boolean; error?: string }>;
  logoutAdmin: () => void;
  refreshData: () => Promise<void>;
  resetToDefaults: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const errText = (e: unknown) => (e instanceof Error ? e.message : 'Белгисиз ката');

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Ачык маалымат: сервер жооп бергиче баштапкы тексттер көрсөтүлөт
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(INITIAL_SITE_SETTINGS);
  const [tariffs, setTariffs] = useState<TariffConfig>(INITIAL_TARIFFS);
  const [machineryCatalog, setMachineryCatalog] = useState<MachineryItem[]>(MACHINERY_CATALOG);
  const [pastureZones, setPastureZones] = useState<PastureZone[]>(PASTURE_ZONES);
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);

  // Админге гана жүктөлүүчү жеке маалымат
  const [subscribers, setSubscribers] = useState<SubscriberAccount[]>([]);
  const [machineryOrders, setMachineryOrders] = useState<MachineryOrder[]>([]);
  const [citizenTickets, setCitizenTickets] = useState<CitizenTicket[]>([]);

  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminEmail, setAdminEmail] = useState<string | null>(null);
  const [isEditModeActive, setIsEditModeActive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

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
    if (zones.length) setPastureZones(zones.map(z => z.data));
    setTransactions(recent || []);
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

  const refreshData = useCallback(async () => {
    setIsLoading(true);
    try {
      await loadPublic();
      if (getSession()) {
        const ok = await checkAdmin();
        if (!ok) {
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
    refreshData();
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
    if (isAdminLoggedIn) loadAdmin().catch(() => undefined);
    return id;
  };

  const getTicketStatus = async (id: string): Promise<CitizenTicket | null> => {
    const r = await db.rpc<CitizenTicket | null>('get_ticket_status', { p_id: id });
    return r || null;
  };

  const createMachineryOrder = async (input: OrderInput): Promise<string> => {
    const id = await db.rpc<string>('create_machinery_order', { p_order: input });
    if (isAdminLoggedIn) loadAdmin().catch(() => undefined);
    return id;
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
    const merged = { ...siteSettings, ...updates };
    setSiteSettings(merged);
    persist(db.upsert('site_config', { key: 'site_settings', value: merged, updated_at: new Date().toISOString() }));
  };

  const updatePastureZone = (zoneId: string, updates: Partial<PastureZone>) => {
    const current = pastureZones.find(z => z.id === zoneId);
    if (!current) return;
    const merged = { ...current, ...updates };
    setPastureZones(prev => prev.map(z => (z.id === zoneId ? merged : z)));
    const sort = pastureZones.findIndex(z => z.id === zoneId);
    persist(db.upsert('pasture_zones', { id: zoneId, data: merged, sort: Math.max(0, sort) }));
  };

  const loginAdmin = async (email: string, password: string): Promise<{ ok: boolean; error?: string }> => {
    try {
      await auth.signIn(email, password);
      const ok = await checkAdmin();
      if (!ok) {
        await auth.signOut();
        return { ok: false, error: 'Бул колдонуучу админ эмес. Supabase\'теги admins таблицасына email кошуңуз.' };
      }
      return { ok: true };
    } catch (e) {
      return { ok: false, error: errText(e) };
    }
  };

  const changeAdminPassword = async (newPassword: string): Promise<{ ok: boolean; error?: string }> => {
    if (newPassword.length < 8) return { ok: false, error: 'Сырсөз кеминде 8 белгиден турушу керек.' };
    try {
      await auth.changePassword(newPassword);
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
        updateTariffs,
        updateSiteSettings,
        updatePastureZone,
        loginAdmin,
        changeAdminPassword,
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
