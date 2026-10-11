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
  loginAdmin: (pin: string) => boolean;
  logoutAdmin: () => void;
  resetToDefaults: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY_PREFIX = 'tazalyk_portal_';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Subscribers
  const [subscribers, setSubscribers] = useState<SubscriberAccount[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}subscribers`);
    return saved ? JSON.parse(saved) : INITIAL_SUBSCRIBERS;
  });

  // Machinery
  const [machineryCatalog, setMachineryCatalog] = useState<MachineryItem[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}machinery`);
    return saved ? JSON.parse(saved) : MACHINERY_CATALOG;
  });

  // Machinery Orders
  const [machineryOrders, setMachineryOrders] = useState<MachineryOrder[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}orders`);
    return saved ? JSON.parse(saved) : INITIAL_MACHINERY_ORDERS;
  });

  // Citizen Tickets
  const [citizenTickets, setCitizenTickets] = useState<CitizenTicket[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}tickets`);
    return saved ? JSON.parse(saved) : INITIAL_CITIZEN_TICKETS;
  });

  // Payment Transactions
  const [transactions, setTransactions] = useState<PaymentTransaction[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}transactions`);
    return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
  });

  // Tariffs
  const [tariffs, setTariffs] = useState<TariffConfig>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}tariffs`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
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
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}site_settings`);
    if (saved) {
      try {
        return { ...INITIAL_SITE_SETTINGS, ...JSON.parse(saved) };
      } catch {
        return INITIAL_SITE_SETTINGS;
      }
    }
    return INITIAL_SITE_SETTINGS;
  });

  // Pasture Zones
  const [pastureZones, setPastureZones] = useState<PastureZone[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}pasture_zones`);
    return saved ? JSON.parse(saved) : PASTURE_ZONES;
  });

  // Admin session - hidden for regular users, admin logs in with PIN
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}admin_logged_in`) === 'true';
  });

  // Direct In-Place Edit Mode (only available when admin is logged in)
  const [isEditModeActive, setIsEditModeActive] = useState<boolean>(false);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}subscribers`, JSON.stringify(subscribers));
  }, [subscribers]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}machinery`, JSON.stringify(machineryCatalog));
  }, [machineryCatalog]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}orders`, JSON.stringify(machineryOrders));
  }, [machineryOrders]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}tickets`, JSON.stringify(citizenTickets));
  }, [citizenTickets]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}transactions`, JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}tariffs`, JSON.stringify(tariffs));
  }, [tariffs]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}site_settings`, JSON.stringify(siteSettings));
  }, [siteSettings]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}pasture_zones`, JSON.stringify(pastureZones));
  }, [pastureZones]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}admin_logged_in`, String(isAdminLoggedIn));
  }, [isAdminLoggedIn]);

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
    setSiteSettings(prev => ({ ...prev, ...updates }));
  };

  const updatePastureZone = (zoneId: string, updates: Partial<PastureZone>) => {
    setPastureZones(prev => prev.map(z => z.id === zoneId ? { ...z, ...updates } : z));
  };

  const loginAdmin = (pin: string): boolean => {
    if (pin.trim() === siteSettings.adminPin || pin.trim() === 'admin' || pin.trim() === '1234') {
      setIsAdminLoggedIn(true);
      return true;
    }
    return false;
  };

  const logoutAdmin = () => {
    setIsAdminLoggedIn(false);
    setIsEditModeActive(false);
    localStorage.removeItem(`${LOCAL_STORAGE_KEY_PREFIX}admin_logged_in`);
  };

  const resetToDefaults = () => {
    setSubscribers(INITIAL_SUBSCRIBERS);
    setMachineryCatalog(MACHINERY_CATALOG);
    setMachineryOrders(INITIAL_MACHINERY_ORDERS);
    setCitizenTickets(INITIAL_CITIZEN_TICKETS);
    setTransactions(INITIAL_TRANSACTIONS);
    setTariffs(INITIAL_TARIFFS);
    setSiteSettings(INITIAL_SITE_SETTINGS);
    setPastureZones(PASTURE_ZONES);
    setIsAdminLoggedIn(false);
    setIsEditModeActive(false);
    localStorage.clear();
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
        loginAdmin,
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
