import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  SubscriberAccount,
  MachineryItem,
  MachineryOrder,
  CitizenTicket,
  PaymentTransaction,
  TariffConfig,
  SiteSettings,
  PastureZone,
  INITIAL_SUBSCRIBERS,
  MACHINERY_CATALOG,
  INITIAL_MACHINERY_ORDERS,
  INITIAL_CITIZEN_TICKETS,
  INITIAL_TRANSACTIONS,
  INITIAL_TARIFFS,
  INITIAL_SITE_SETTINGS,
  PASTURE_ZONES
} from '../data/mockData';
import {
  hashPin,
  verifyPin,
  isHashed,
  DEFAULT_ADMIN_PIN_HASH,
  MIN_PIN_LENGTH,
  MAX_LOGIN_ATTEMPTS,
  LOCKOUT_MS
} from '../utils/security';

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
  isEditModeActive: boolean;
  
  // Actions
  setIsEditModeActive: (active: boolean) => void;
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
  submitMeterReading: (accountId: string, newReading: number, amount: number) => boolean;
  loginAdmin: (pin: string) => Promise<{ ok: boolean; error?: string }>;
  changeAdminPin: (currentPin: string, newPin: string) => Promise<{ ok: boolean; error?: string }>;
  isDefaultAdminPin: boolean;
  logoutAdmin: () => void;
  resetToDefaults: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY_PREFIX = 'tazalyk_portal_';

// localStorage'дагы маалымат бузулуп калса, сайт ак экран болуп калбашы үчүн
function loadSaved<T>(key: string, fallback: T): T {
  try {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}${key}`);
    return saved ? (JSON.parse(saved) as T) : fallback;
  } catch {
    return fallback;
  }
}

function saveSafe(key: string, value: unknown) {
  try {
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}${key}`, JSON.stringify(value));
  } catch {
    // Сактагыч толуп калса же жабык болсо - сайт иштей берет
  }
}

const ADMIN_SESSION_KEY = `${LOCAL_STORAGE_KEY_PREFIX}admin_session`;

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Subscribers
  const [subscribers, setSubscribers] = useState<SubscriberAccount[]>(() => loadSaved('subscribers', INITIAL_SUBSCRIBERS));

  // Machinery
  const [machineryCatalog, setMachineryCatalog] = useState<MachineryItem[]>(() =>
    // Эски версияда сакталган сүрөт жолдорун (/src/assets/images/) жаңысына оңдоо
    loadSaved('machinery', MACHINERY_CATALOG).map(m => ({
      ...m,
      image: m.image?.replace('/src/assets/images/', '/images/') ?? m.image
    }))
  );

  // Machinery Orders
  const [machineryOrders, setMachineryOrders] = useState<MachineryOrder[]>(() => loadSaved('orders', INITIAL_MACHINERY_ORDERS));

  // Citizen Tickets
  const [citizenTickets, setCitizenTickets] = useState<CitizenTicket[]>(() => loadSaved('tickets', INITIAL_CITIZEN_TICKETS));

  // Payment Transactions
  const [transactions, setTransactions] = useState<PaymentTransaction[]>(() => loadSaved('transactions', INITIAL_TRANSACTIONS));

  // Tariffs
  const [tariffs, setTariffs] = useState<TariffConfig>(() => {
    const parsed = loadSaved<Partial<TariffConfig> | null>('tariffs', null);
    if (parsed) {
      try {
        return {
          ...INITIAL_TARIFFS,
          ...parsed,
          waterPerM3: Number(parsed.waterPerM3) || INITIAL_TARIFFS.waterPerM3,
          waterWithoutMeterPerPerson: Number(parsed.waterWithoutMeterPerPerson) || INITIAL_TARIFFS.waterWithoutMeterPerPerson,
          waterCommercialPerM3: Number(parsed.waterCommercialPerM3) || INITIAL_TARIFFS.waterCommercialPerM3,
          waterIrrigationPerSotka: Number(parsed.waterIrrigationPerSotka) || INITIAL_TARIFFS.waterIrrigationPerSotka,
          wastePerPerson: Number(parsed.wastePerPerson) || INITIAL_TARIFFS.wastePerPerson,
          wasteCommercialPerM3: Number(parsed.wasteCommercialPerM3) || INITIAL_TARIFFS.wasteCommercialPerM3,
        };
      } catch {
        return INITIAL_TARIFFS;
      }
    }
    return INITIAL_TARIFFS;
  });

  // Site Settings (All titles and text)
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(() => {
    const parsed = loadSaved<Partial<SiteSettings> | null>('site_settings', null);
    const merged = parsed ? { ...INITIAL_SITE_SETTINGS, ...parsed } : INITIAL_SITE_SETTINGS;
    if (!merged.adminPin) merged.adminPin = INITIAL_SITE_SETTINGS.adminPin;
    return merged;
  });

  // Pasture Zones
  const [pastureZones, setPastureZones] = useState<PastureZone[]>(() => loadSaved('pasture_zones', PASTURE_ZONES));

  // Админ сессиясы sessionStorage'да: браузер/өтмөк жабылганда автоматтык түрдө чыгат
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(() => {
    try {
      // Эски версиядагы "түбөлүк" сессияны өчүрүү
      localStorage.removeItem(`${LOCAL_STORAGE_KEY_PREFIX}admin_logged_in`);
      return sessionStorage.getItem(ADMIN_SESSION_KEY) === 'true';
    } catch {
      return false;
    }
  });

  // Туура эмес сырсөз көп терилсе, убактылуу бөгөттөө
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);

  // Direct In-Place Edit Mode (only available when admin is logged in)
  const [isEditModeActive, setIsEditModeActive] = useState<boolean>(false);

  // Save to localStorage
  useEffect(() => {
    saveSafe('subscribers', subscribers);
  }, [subscribers]);

  useEffect(() => {
    saveSafe('machinery', machineryCatalog);
  }, [machineryCatalog]);

  useEffect(() => {
    saveSafe('orders', machineryOrders);
  }, [machineryOrders]);

  useEffect(() => {
    saveSafe('tickets', citizenTickets);
  }, [citizenTickets]);

  useEffect(() => {
    saveSafe('transactions', transactions);
  }, [transactions]);

  useEffect(() => {
    saveSafe('tariffs', tariffs);
  }, [tariffs]);

  useEffect(() => {
    saveSafe('site_settings', siteSettings);
  }, [siteSettings]);

  useEffect(() => {
    saveSafe('pasture_zones', pastureZones);
  }, [pastureZones]);

  useEffect(() => {
    try {
      if (isAdminLoggedIn) sessionStorage.setItem(ADMIN_SESSION_KEY, 'true');
      else sessionStorage.removeItem(ADMIN_SESSION_KEY);
    } catch {
      // ignore
    }
  }, [isAdminLoggedIn]);

  // Эски версиядан калган ачык сырсөздү хэшке айландыруу
  useEffect(() => {
    if (siteSettings.adminPin && !isHashed(siteSettings.adminPin)) {
      hashPin(siteSettings.adminPin).then(h => {
        setSiteSettings(prev => ({ ...prev, adminPin: h }));
      });
    }
  }, [siteSettings.adminPin]);

  // Actions
  const addPayment = (payment: PaymentTransaction) => {
    setTransactions(prev => [payment, ...prev]);

    // Also update subscriber balance if valid account ID
    setSubscribers(prev => prev.map(sub => {
      if (sub.id === payment.accountId) {
        if (payment.serviceType === 'water') {
          return { ...sub, waterBalance: sub.waterBalance + payment.amount };
        } else if (payment.serviceType === 'waste') {
          return { ...sub, wasteBalance: sub.wasteBalance + payment.amount };
        } else if (payment.serviceType === 'pasture') {
          return { ...sub, pastureBalance: sub.pastureBalance + payment.amount };
        }
      }
      return sub;
    }));
  };

  const addMachineryOrder = (order: MachineryOrder) => {
    setMachineryOrders(prev => [order, ...prev]);
  };

  const updateMachineryOrder = (orderId: string, updates: Partial<MachineryOrder>) => {
    setMachineryOrders(prev => prev.map(ord => ord.id === orderId ? { ...ord, ...updates } : ord));
  };

  const addCitizenTicket = (ticket: CitizenTicket) => {
    setCitizenTickets(prev => [ticket, ...prev]);
  };

  const updateCitizenTicket = (ticketId: string, updates: Partial<CitizenTicket>) => {
    setCitizenTickets(prev => prev.map(tick => tick.id === ticketId ? { ...tick, ...updates } : tick));
  };

  const updateSubscriber = (updated: SubscriberAccount) => {
    setSubscribers(prev => prev.map(sub => sub.id === updated.id ? updated : sub));
  };

  const addSubscriber = (newSub: SubscriberAccount) => {
    setSubscribers(prev => [newSub, ...prev]);
  };

  const updateMachineryItem = (updatedItem: MachineryItem) => {
    setMachineryCatalog(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
  };

  const updateTariffs = (newTariffs: TariffConfig) => {
    setTariffs(newTariffs);
    setSubscribers(prev => prev.map(s => ({
      ...s,
      waterTariffPerM3: newTariffs.waterPerM3,
      wasteTariffPerPerson: newTariffs.wastePerPerson
    })));
  };

  const updateSiteSettings = (updates: Partial<SiteSettings>) => {
    // Сырсөз бул жерден өзгөртүлбөйт — changeAdminPin аркылуу гана
    const { adminPin: _ignored, ...rest } = updates;
    setSiteSettings(prev => ({ ...prev, ...rest }));
  };

  const updatePastureZone = (zoneId: string, updates: Partial<PastureZone>) => {
    setPastureZones(prev => prev.map(z => z.id === zoneId ? { ...z, ...updates } : z));
  };

  const submitMeterReading = (accountId: string, newReading: number, amount: number): boolean => {
    const sub = subscribers.find(s => s.id === accountId);
    if (!sub || newReading < sub.waterLastMeterReading) return false;
    setSubscribers(prev => prev.map(s =>
      s.id === accountId
        ? { ...s, waterLastMeterReading: newReading, waterBalance: s.waterBalance - amount }
        : s
    ));
    return true;
  };

  const loginAdmin = async (pin: string): Promise<{ ok: boolean; error?: string }> => {
    if (lockedUntil && Date.now() < lockedUntil) {
      const sec = Math.ceil((lockedUntil - Date.now()) / 1000);
      return { ok: false, error: `Өтө көп туура эмес аракет. ${sec} секунддан кийин кайра аракет кылыңыз.` };
    }
    const ok = await verifyPin(pin, siteSettings.adminPin);
    if (ok) {
      setFailedAttempts(0);
      setLockedUntil(null);
      setIsAdminLoggedIn(true);
      return { ok: true };
    }
    const attempts = failedAttempts + 1;
    setFailedAttempts(attempts);
    if (attempts >= MAX_LOGIN_ATTEMPTS) {
      setLockedUntil(Date.now() + LOCKOUT_MS);
      setFailedAttempts(0);
      return { ok: false, error: 'Өтө көп туура эмес аракет. 1 мүнөттөн кийин кайра аракет кылыңыз.' };
    }
    return { ok: false, error: `Сырсөз туура эмес! (калган аракет: ${MAX_LOGIN_ATTEMPTS - attempts})` };
  };

  const changeAdminPin = async (currentPin: string, newPin: string): Promise<{ ok: boolean; error?: string }> => {
    if (!(await verifyPin(currentPin, siteSettings.adminPin))) {
      return { ok: false, error: 'Учурдагы сырсөз туура эмес.' };
    }
    if (newPin.trim().length < MIN_PIN_LENGTH) {
      return { ok: false, error: `Жаңы сырсөз кеминде ${MIN_PIN_LENGTH} белгиден турушу керек.` };
    }
    const h = await hashPin(newPin);
    if (h === DEFAULT_ADMIN_PIN_HASH) {
      return { ok: false, error: 'Баштапкы сырсөздү колдонууга болбойт.' };
    }
    setSiteSettings(prev => ({ ...prev, adminPin: h }));
    return { ok: true };
  };

  const isDefaultAdminPin =
    siteSettings.adminPin === DEFAULT_ADMIN_PIN_HASH || siteSettings.adminPin === '1234';

  const logoutAdmin = () => {
    setIsAdminLoggedIn(false);
    setIsEditModeActive(false);
  };

  const resetToDefaults = () => {
    setSubscribers(INITIAL_SUBSCRIBERS);
    setMachineryCatalog(MACHINERY_CATALOG);
    setMachineryOrders(INITIAL_MACHINERY_ORDERS);
    setCitizenTickets(INITIAL_CITIZEN_TICKETS);
    setTransactions(INITIAL_TRANSACTIONS);
    setTariffs(INITIAL_TARIFFS);
    // Админдин сырсөзү сакталып калат, болбосо баштапкы "1234" кайра иштеп калат
    setSiteSettings(prev => ({ ...INITIAL_SITE_SETTINGS, adminPin: prev.adminPin }));
    setPastureZones(PASTURE_ZONES);
    setIsAdminLoggedIn(false);
    setIsEditModeActive(false);
    try {
      Object.keys(localStorage)
        .filter(k => k.startsWith(LOCAL_STORAGE_KEY_PREFIX))
        .forEach(k => localStorage.removeItem(k));
    } catch {
      // ignore
    }
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
        isEditModeActive,
        setIsEditModeActive,
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
        submitMeterReading,
        loginAdmin,
        changeAdminPin,
        isDefaultAdminPin,
        logoutAdmin,
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
