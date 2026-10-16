export interface SubscriberAccount {
  id: string; // e.g. "1042"
  fullName: string;
  address: string;
  phone: string;
  waterBalance: number; // negative is debt, positive is prepayment
  waterLastMeterReading: number;
  waterTariffPerM3: number;
  wasteBalance: number;
  wasteFamilyMembers: number;
  wasteTariffPerPerson: number;
  pastureBalance: number;
  registeredLivestock: {
    cattle: number; // уй/бодо мал
    horses: number; // жылкы
    sheepGoats: number; // кой-эчки
    yaks: number; // топоз
  };
}

export interface MachineryItem {
  id: string;
  name: string;
  category: 'excavator' | 'heavy_truck' | 'light_truck' | 'special';
  model: string;
  year: number;
  hourlyRate: number; // сом
  shiftRate: number; // 8 сааттык смена, сом
  tripRate?: number; // 1 рейс үчүн, сом
  image: string;
  status: 'бош' | 'иште' | 'ремонтто';
  specs: {
    capacity: string; // e.g. "0.9 м³ чөмүч" же "15 тонна"
    driverIncluded: boolean;
    fuelIncluded: boolean;
    minOrderHours: number;
  };
  description: string;
  commonUses: string[];
}

export interface MachineryOrder {
  id: string;
  machineId: string;
  machineName: string;
  customerName: string;
  customerPhone: string;
  address: string;
  workDescription: string;
  orderDate: string;
  orderType: 'hours' | 'shift' | 'trips';
  units: number;
  totalEstimate: number;
  status: 'жаңы' | 'кабыл алынды' | 'аткарылууда' | 'бүттү' | 'жокко чыгарылды';
  paymentStatus: 'төлөндү' | 'күтүлүүдө';
  assignedDriver?: string;
  createdAt: string;
}

export interface CitizenTicket {
  id: string;
  category: string;
  name: string;
  phone: string;
  address: string;
  description: string;
  status: 'Кабыл алынды' | 'Бригада жөнөтүлдү' | 'Аткарылды' | 'Кароодо';
  assignedCrew?: string;
  date: string;
  resolutionNotes?: string;
  photo?: string; // кичирейтилген сүрөт (data URL)
}

export interface SiteSettings {
  // 1. Уюмдун жана Айыл өкмөтүнүн аталыштары
  enterpriseName: string;
  enterpriseSubName: string;
  municipalityName: string;

  // 2. Башкы бет (Hero) ураан жана кызмат карточкалары
  heroKicker: string;
  heroTitle: string;
  heroSubtitle: string;
  heroWaterCardTitle: string;
  heroWaterCardDesc: string;
  heroWasteCardTitle: string;
  heroWasteCardDesc: string;
  heroPastureCardTitle: string;
  heroPastureCardDesc: string;
  heroMachineryCardTitle: string;
  heroMachineryCardDesc: string;

  // 3. Бөлүмдөрдүн башкы аталыштары жана түшүндүрмөлөрү
  waterSectionTitle: string;
  waterSectionSubtitle: string;
  pastureSectionTitle: string;
  pastureSectionSubtitle: string;
  machinerySectionTitle: string;
  machinerySectionSubtitle: string;
  paymentSectionTitle: string;
  paymentSectionSubtitle: string;
  reportsSectionTitle: string;
  reportsSectionSubtitle: string;

  // 4. Байланыштар жана даректер
  dispatcherPhone: string;
  whatsappPhone: string;
  officeAddress: string;
  workHours: string;

  // 5. Банктык жана расмий реквизиттер
  bankName: string;
  bankAccount: string;
  bankBik: string;
  inn: string;
  okpo: string;

}

export const INITIAL_SITE_SETTINGS: SiteSettings = {
  enterpriseName: "«Тазалык»",
  enterpriseSubName: "Муниципалдык ишканасы",
  municipalityName: "Айыл өкмөтү",

  heroKicker: "«Тазалык» муниципалдык ишканасы",
  heroTitle: "Таза айыл, тунук суу жана өнүккөн жамаат",
  heroSubtitle: "Суу, таштанды, жайыт жана техника кызматтары бир жерде. Карызыңызды текшериңиз, водомердин көрсөткүчүн жөнөтүңүз, жайыт билетин алыңыз же техника заказ кылыңыз.",
  heroWaterCardTitle: "Таза ичүүчү суу",
  heroWaterCardDesc: "Водомердин көрсөткүчүн жөнөтүү жана суу акысын эсептөө.",
  heroWasteCardTitle: "Таштанды чыгаруу",
  heroWasteCardDesc: "Көчөлөр боюнча график жана ири таштандыга заказ.",
  heroPastureCardTitle: "Жайыт пайдалануу",
  heroPastureCardDesc: "Жайыт акысын эсептөө, билет алуу жана ачык отчеттор.",
  heroMachineryCardTitle: "Техника жана оңдоо",
  heroMachineryCardDesc: "Экскаватор, самосвал, суу түтүгүн жана суу кампасын оңдоо.",

  waterSectionTitle: "Таза суу жана таштанды",
  waterSectionSubtitle: "Водомердин көрсөткүчүн жөнөтүңүз, суу акысын эсептеңиз жана таштанды чыгаруу графигин караңыз.",
  pastureSectionTitle: "Жайыт пайдалануу",
  pastureSectionSubtitle: "Малыңыздын санына жараша жайыт акысын эсептеп, билет алыңыз. Чогулган каражат кайда жумшалганы ачык жарыяланат.",
  machinerySectionTitle: "Техника ижарасы жана оңдоо кызматтары",
  machinerySectionSubtitle: "Экскаватор, самосвал жана жүк ташуучу унааларды айдоочусу менен заказ кылыңыз. Суу түтүгүн жана суу кампасын оңдотуу да ушул жерде.",
  paymentSectionTitle: "Төлөмдөр",
  paymentSectionSubtitle: "Лицевой эсебиңиздин номерин жазып, карызыңызды текшериңиз жана квитанция алыңыз.",
  reportsSectionTitle: "Отчеттор жана жаңылыктар",
  reportsSectionSubtitle: "Ишкананын кирешеси жана чыгашасы, расмий документтер жана акыркы кабарлар.",

  dispatcherPhone: "0 (312) 55-01-20",
  whatsappPhone: "+996 (702) 00-11-22",
  officeAddress: "Айыл өкмөтүнүн имараты, Ленин көч. 12",
  workHours: "Дш–Жм 08:30–17:30",

  bankName: "РСК Банк / Айыл Банк",
  bankAccount: "1290123456780192",
  bankBik: "129001",
  inn: "01204201010045",
  okpo: "29481023"
};

export interface TariffConfig {
  waterPerM3: number;
  waterWithoutMeterPerPerson: number;
  waterCommercialPerM3: number;
  waterIrrigationPerSotka: number;
  wastePerPerson: number;
  wasteCommercialPerM3: number;
  pastureCattleSeason: number;
  pastureCattleMonth: number;
  pastureHorseSeason: number;
  pastureHorseMonth: number;
  pastureSheepSeason: number;
  pastureSheepMonth: number;
  pastureYakSeason: number;
  pastureYakMonth: number;
}

export interface PastureReport {
  id: string;
  period: string; // e.g. "2025-жыл, Жылдык жыйынтык"
  totalCollected: number; // сом
  totalSpent: number; // сом
  livestockCount: {
    cattle: number;
    horses: number;
    sheepGoats: number;
  };
  completedWorks: {
    title: string;
    cost: number;
    description: string;
  }[];
  fileSize: string;
}

export interface PastureZone {
  id: string;
  name: string;
  elevation: string;
  capacityHeads: number;
  currentGrazingHeads: number;
  season: 'Жазгы' | 'Жайкы' | 'Күзгү';
  waterSources: string;
  condition: 'Жакшы' | 'Орточо' | 'Калыбына келтирүүдө';
  manager: string;
}

export interface PaymentTransaction {
  id: string;
  receiptNumber: string;
  timestamp: string;
  payerName: string;
  payerPhone: string;
  accountId: string;
  serviceType: 'water' | 'waste' | 'pasture' | 'machinery';
  serviceName: string;
  amount: number;
  paymentMethod: 'MBank' | 'Optima24' | 'O!Dengi' | 'Balance.kg' | 'Элсом' | 'Банк картасы' | 'Накталай (Касса)';
  status: 'Төлөндү' | 'Иштелүүдө';
  details: string;
}

export interface WasteScheduleItem {
  day: string;
  streets: string[];
  time: string;
  truckModel: string;
}

export const INITIAL_TARIFFS: TariffConfig = {
  waterPerM3: 18.5,
  waterWithoutMeterPerPerson: 45,
  waterCommercialPerM3: 32,
  waterIrrigationPerSotka: 25,
  wastePerPerson: 35,
  wasteCommercialPerM3: 70,
  pastureCattleSeason: 300,
  pastureCattleMonth: 60,
  pastureHorseSeason: 375,
  pastureHorseMonth: 75,
  pastureSheepSeason: 75,
  pastureSheepMonth: 15,
  pastureYakSeason: 250,
  pastureYakMonth: 50
};

// Initial mock subscribers in the rural municipality
export const INITIAL_SUBSCRIBERS: SubscriberAccount[] = [
  {
    id: "1042",
    fullName: "Асанбек уулу Нурлан",
    address: "Ленин көчөсү, 42-үй",
    phone: "+996 (702) 45-88-12",
    waterBalance: -240, // 240 сом карыз
    waterLastMeterReading: 312,
    waterTariffPerM3: 18.5,
    wasteBalance: -105, // 105 сом карыз (3 адам * 35 сом)
    wasteFamilyMembers: 3,
    wasteTariffPerPerson: 35,
    pastureBalance: 0,
    registeredLivestock: {
      cattle: 4,
      horses: 2,
      sheepGoats: 25,
      yaks: 0
    }
  },
  {
    id: "1043",
    fullName: "Садыкова Гүлмира Эргешовна",
    address: "Жибек-Жолу көчөсү, 18-үй",
    phone: "+996 (770) 12-34-56",
    waterBalance: 150, // ашыкча төлөм
    waterLastMeterReading: 184,
    waterTariffPerM3: 18.5,
    wasteBalance: 0,
    wasteFamilyMembers: 4,
    wasteTariffPerPerson: 35,
    pastureBalance: -750,
    registeredLivestock: {
      cattle: 2,
      horses: 1,
      sheepGoats: 40,
      yaks: 0
    }
  },
  {
    id: "1044",
    fullName: "Токтосунов Бакытбек Касымович",
    address: "Манас көчөсү, 77-үй",
    phone: "+996 (555) 98-76-54",
    waterBalance: -480,
    waterLastMeterReading: 420,
    waterTariffPerM3: 18.5,
    wasteBalance: -210,
    wasteFamilyMembers: 6,
    wasteTariffPerPerson: 35,
    pastureBalance: -1400,
    registeredLivestock: {
      cattle: 8,
      horses: 4,
      sheepGoats: 60,
      yaks: 0
    }
  },
  {
    id: "1045",
    fullName: "Кадыров Медербек Алмазович",
    address: "Айтматов көчөсү, 12-үй",
    phone: "+996 (707) 33-22-11",
    waterBalance: 50,
    waterLastMeterReading: 95,
    waterTariffPerM3: 18.5,
    wasteBalance: 0,
    wasteFamilyMembers: 2,
    wasteTariffPerPerson: 35,
    pastureBalance: 0,
    registeredLivestock: {
      cattle: 0,
      horses: 0,
      sheepGoats: 0,
      yaks: 0
    }
  },
  {
    id: "1046",
    fullName: "Жумалиев Алмаз Бакасович",
    address: "Токтогул көчөсү, 55-үй",
    phone: "+996 (500) 44-55-66",
    waterBalance: -370,
    waterLastMeterReading: 210,
    waterTariffPerM3: 18.5,
    wasteBalance: -140,
    wasteFamilyMembers: 4,
    wasteTariffPerPerson: 35,
    pastureBalance: -600,
    registeredLivestock: {
      cattle: 2,
      horses: 1,
      sheepGoats: 15,
      yaks: 0
    }
  }
];

export const MACHINERY_CATALOG: MachineryItem[] = [
  {
    id: "m-01",
    name: "Чоң чынжыр тамандуу экскаватор",
    category: "excavator",
    model: "XCMG XE215C (0.9 м³ чөмүч)",
    year: 2023,
    hourlyRate: 2600,
    shiftRate: 19000,
    image: "images/tazalyk_machinery_excavator_1791715428773.jpg",
    status: "бош",
    specs: {
      capacity: "0.9 м³ чөмүч, казуу тереңдиги 6.6 м",
      driverIncluded: true,
      fuelIncluded: true,
      minOrderHours: 2
    },
    description: "Суу түтүктөрүн жана арыктарды казуу, септик, пайдубал чуңкурларын даярдоо, жер кыртышын тазалоо жана тегиздөө иштерине арналган кубаттуу техника.",
    commonUses: ["Суу түтүгүнө траншея казуу", "Фундамент чуңкуру", "Дренаж арыктарын тазалоо", "Жер тегиздөө"]
  },
  {
    id: "m-02",
    name: "Дөңгөлөктүү экскаватор-жүктөгүч",
    category: "excavator",
    model: "JCB 3CX Super",
    year: 2022,
    hourlyRate: 2100,
    shiftRate: 15500,
    image: "images/tazalyk_machinery_excavator_1791715428773.jpg",
    status: "бош",
    specs: {
      capacity: "Алдыңкы чөмүч 1.1 м³, арткы 0.3 м³",
      driverIncluded: true,
      fuelIncluded: true,
      minOrderHours: 2
    },
    description: "Айыл көчөлөрүндө жана тар короолордо иштөөгө өтө ыңгайлуу. Жүк жүктөө, чуңкур казуу жана кар күрөө үчүн идеалдуу универсалдуу техника.",
    commonUses: ["Шагыл жана топурак жүктөө", "Арык казуу", "Короо тегиздөө", "Курулуш калдыктарын тазалоо"]
  },
  {
    id: "m-03",
    name: "Оор жүк ташуучу самосвал",
    category: "heavy_truck",
    model: "КамАЗ-65115 (15 тонна)",
    year: 2021,
    hourlyRate: 1800,
    shiftRate: 13000,
    tripRate: 2500,
    image: "images/tazalyk_machinery_excavator_1791715428773.jpg",
    status: "иште",
    specs: {
      capacity: "15 тонна / 10.5 м³ чанагы",
      driverIncluded: true,
      fuelIncluded: true,
      minOrderHours: 2
    },
    description: "Шагыл, кум, таш, кара топурак, көң жана чоң көлөмдөгү курулуш калдыктарын ташууга ылайыкташкан оор жүк ташуучу унаа.",
    commonUses: ["Шагыл жана кум ташуу", "Көң жана органикалык жер семирткич", "Чоң таштандыларды полигонго чыгаруу"]
  },
  {
    id: "m-04",
    name: "Жеңил жүк ташуучу чарбалык унаа",
    category: "light_truck",
    model: "Hyundai Porter II (Борт/Тент)",
    year: 2020,
    hourlyRate: 800,
    shiftRate: 5500,
    tripRate: 900,
    image: "images/tazalyk_machinery_excavator_1791715428773.jpg",
    status: "бош",
    specs: {
      capacity: "1.5 тонна борт",
      driverIncluded: true,
      fuelIncluded: true,
      minOrderHours: 1
    },
    description: "Айыл ичинде үй эмеректерин, чарбалык жүктөрдү, курулуш материалдарын жана тиричилик калдыктарын жеңил ташуу үчүн шамдагай унаа.",
    commonUses: ["Турмуш-тиричилик буюмдарын ташуу", "Айыл чарба түшүмдөрү", "Кичи курулуш материалдары"]
  },
  {
    id: "m-07",
    name: "Таза суу түтүктөрүн оңдоо",
    category: "special",
    model: "Авариялык-оңдоо бригадасы",
    year: 2026,
    hourlyRate: 1500,
    shiftRate: 10000,
    image: "images/tazalyk_clean_water_source_1791715441093.jpg",
    status: "бош",
    specs: {
      capacity: "Ø20–160 мм түтүктөр, ширетүү жабдуусу",
      driverIncluded: true,
      fuelIncluded: true,
      minOrderHours: 1
    },
    description: "Таза суу түтүктөрүндөгү агып кетүүлөрдү жабуу, жарылган жана эскирген түтүктөрдү алмаштыруу, крандарды жана суу өлчөгүч түйүндөрдү оңдоо.",
    commonUses: [
      "Суу агып кетүүсүн жабуу",
      "Түтүктөрдү алмаштыруу",
      "Кран жана кудуктарды оңдоо",
      "Үйгө суу түтүгүн туташтыруу"
    ]
  },
  {
    id: "m-08",
    name: "Суу кампаларын (резервуарларды) оңдоо",
    category: "special",
    model: "Резервуар тейлөө бригадасы",
    year: 2026,
    hourlyRate: 2000,
    shiftRate: 14000,
    image: "",
    status: "бош",
    specs: {
      capacity: "Суу сактагыч резервуарлар, бактар, мунаралар",
      driverIncluded: true,
      fuelIncluded: true,
      minOrderHours: 2
    },
    description: "Суу кампаларын жана резервуарларды тазалоо, жуушуруу (дезинфекциялоо), жаракаларын бекитүү, капкактарын жана түтүк туташууларын оңдоо.",
    commonUses: [
      "Резервуарды тазалоо жана дезинфекциялоо",
      "Жарака жана агып кетүүнү бекитүү",
      "Капкак, тепкич, туташууларды оңдоо"
    ]
  }
];

export const INITIAL_MACHINERY_ORDERS: MachineryOrder[] = [
  {
    id: "ORD-101",
    machineId: "m-01",
    machineName: "Чоң чынжыр тамандуу экскаватор XCMG",
    customerName: "Осмонов Канат Жумабекович",
    customerPhone: "+996 (700) 88-11-22",
    address: "Манас көчөсү, 114",
    workDescription: "30 метр суу түтүгүнө траншея казуу",
    orderDate: "2026-10-12",
    orderType: "hours",
    units: 3,
    totalEstimate: 7800,
    status: "кабыл алынды",
    paymentStatus: "төлөндү",
    assignedDriver: "Абдыкалыков Руслан (оператор)",
    createdAt: "2026-10-11 08:30"
  },
  {
    id: "ORD-102",
    machineId: "m-03",
    machineName: "Оор жүк ташуучу самосвал КамАЗ-65115",
    customerName: "Базарбаев Нурдин",
    customerPhone: "+996 (772) 34-99-01",
    address: "Жаңы Конуш, 5-көчө",
    workDescription: "2 рейс шагыл төгүү",
    orderDate: "2026-10-12",
    orderType: "trips",
    units: 2,
    totalEstimate: 5000,
    status: "аткарылууда",
    paymentStatus: "күтүлүүдө",
    assignedDriver: "Сыдыков Тилек",
    createdAt: "2026-10-10 16:45"
  },
  {
    id: "ORD-103",
    machineId: "m-07",
    machineName: "Таза суу түтүктөрүн оңдоо",
    customerName: "Исмаилова Назира",
    customerPhone: "+996 (550) 65-43-21",
    address: "Ленин көчөсү, 89",
    workDescription: "Суу түтүгүнүн агып кетүүсүн жабуу",
    orderDate: "2026-10-13",
    orderType: "trips",
    units: 1,
    totalEstimate: 1600,
    status: "жаңы",
    paymentStatus: "күтүлүүдө",
    createdAt: "2026-10-11 09:20"
  }
];

export const INITIAL_CITIZEN_TICKETS: CitizenTicket[] = [
  {
    id: "ТЗЛ-804",
    category: "Суу түтүгү жарылды / Суу жок",
    name: "Эсенбеков Бакыт",
    phone: "+996 (700) 11-22-33",
    address: "Ленин көчөсү, 58-үй",
    description: "Жол жээгиндеги колонкадан суу агып жатат",
    status: "Бригада жөнөтүлдү",
    assignedCrew: "Тез чара көрүү тобу №2 (мастер: А. Ибраимов)",
    date: "2026-10-11 09:15"
  },
  {
    id: "ТЗЛ-803",
    category: "Таштанды чыгарылбай калды",
    name: "Сулайманова Айнура",
    phone: "+996 (773) 89-00-11",
    address: "Айтматов көчөсү, 23",
    description: "Таштанды контейнери толду, ит-куштар чачып жатат",
    status: "Кабыл алынды",
    date: "2026-10-11 08:40"
  },
  {
    id: "ТЗЛ-801",
    category: "Арык бүтөлүп суу каптоодо",
    name: "Молдобаев Касым",
    phone: "+996 (555) 32-11-00",
    address: "Жибек-Жолу көчөсү, 102",
    description: "Көпүрөнүн алды таш-шагылга толуп, короого суу кирип жатат",
    status: "Аткарылды",
    assignedCrew: "Бригада №1 + JCB экскаватор",
    date: "2026-10-10 14:10",
    resolutionNotes: "Арык тазаланып, суунун агымы жөнгө салынды."
  }
];

export const PASTURE_ZONES: PastureZone[] = [
  {
    id: "pz-01",
    name: "Үч-Эмчек жайлоосу",
    elevation: "2,400 – 2,900 м",
    capacityHeads: 4200,
    currentGrazingHeads: 3150,
    season: "Жайкы",
    waterSources: "3 табигый булак, Үч-Эмчек суусу",
    condition: "Жакшы",
    manager: "Мамытов Жолдошбек"
  },
  {
    id: "pz-02",
    name: "Чоң-Төр капчыгайы",
    elevation: "2,100 – 2,600 м",
    capacityHeads: 2800,
    currentGrazingHeads: 2400,
    season: "Жайкы",
    waterSources: "Мөңгү суусу, суу түтүгү орнотулган",
    condition: "Жакшы",
    manager: "Исаков Канат"
  },
  {
    id: "pz-03",
    name: "Бел-Булак жазгы-күзгү жайыты",
    elevation: "1,600 – 1,950 м",
    capacityHeads: 1900,
    currentGrazingHeads: 1200,
    season: "Жазгы",
    waterSources: "Булак жана суу топтомо челектер",
    condition: "Калыбына келтирүүдө",
    manager: "Эркин уулу Султан"
  },
  {
    id: "pz-04",
    name: "Күнгөй адырлары",
    elevation: "1,400 – 1,750 м",
    capacityHeads: 1500,
    currentGrazingHeads: 850,
    season: "Күзгү",
    waterSources: "Ала-Арча каналынан тартылган арык",
    condition: "Орточо",
    manager: "Байгазиев Мурат"
  }
];

export const PASTURE_REPORTS: PastureReport[] = [
  {
    id: "rep-2025-annual",
    period: "2025-жыл, Жылдык финансылык жана чарбалык отчет",
    totalCollected: 1485600, // 1 млн 485 миң сом
    totalSpent: 1392400,
    livestockCount: {
      cattle: 2480,
      horses: 1120,
      sheepGoats: 16400
    },
    completedWorks: [
      {
        title: "Үч-Эмчек жайлоосуна 2 автоунаа көпүрөсүн оңдоо",
        cost: 420000,
        description: "Жазгы селден бузулган жыгач көпүрөлөр темир-бетон конструкциясы менен капиталдык оңдолду."
      },
      {
        title: "18 км ички жайыт жолдорун грейдер менен тегиздөө",
        cost: 295000,
        description: "Чоң-Төр жана Үч-Эмчек капчыгайларындагы ашуу жолдору тоо таштарынан тазаланып кеңейтилди."
      },
      {
        title: "Мал сугаруучу 6 даана темир-бетон ноо (корыто) орнотуу",
        cost: 185000,
        description: "Булактардын көзү ачылып, мал тебелебей таза суу ичүүсү үчүн санитардык зона тосулду."
      },
      {
        title: "45 гектар деградацияга учураган жайытка беде жана эспарцет сээп байытуу",
        cost: 215000,
        description: "Бел-Булак жайытында отоо чөптөр чабылып, көп жылдык тоют чөптөрдүн үрөнү себилди."
      },
      {
        title: "Ветеринардык дарылоо жана дегельминтизация иш-чаралары",
        cost: 145000,
        description: "Айыл өкмөттүн ветеринардык кызматы менен биргеликте эхинококкоз жана шарп ооруларына каршы дезинфекция."
      },
      {
        title: "Административдик чыгымдар жана жайыт көзөмөлчүлөрүнүн маянасы",
        cost: 132400,
        description: "Жайыт комитетинин 3 кызматкеринин маянасы, Соцфонд төгүмдөрү жана күйүүчү май чыгымдары."
      }
    ],
    fileSize: "PDF (2.4 MB)"
  },
  {
    id: "rep-2025-q3",
    period: "2025-жыл, III квартал (Жайлоо сезону)",
    totalCollected: 940000,
    totalSpent: 870000,
    livestockCount: {
      cattle: 2350,
      horses: 1050,
      sheepGoats: 15800
    },
    completedWorks: [
      {
        title: "Күнгөй жайытындагы суу насосун оңдоо",
        cost: 140000,
        description: "Күн панелдери менен иштеген суу сордургуч насос калыбына келтирилди."
      },
      {
        title: "Ашуу жолун селден тазалоо",
        cost: 95000,
        description: "Ишкананын экскаватору жана КамАЗ унаасы тартылып, 3 күн аралыгында жол каттамы ачылды."
      }
    ],
    fileSize: "PDF (1.8 MB)"
  }
];

export const WASTE_SCHEDULE: WasteScheduleItem[] = [
  {
    day: "Дүйшөмбү",
    streets: ["Ленин көчөсү (1-120)", "Айтматов көчөсү", "Манас көчөсү", "Көл-Төр туюк көчөлөрү"],
    time: "08:00 – 13:00",
    truckModel: "КамАЗ-КО-440 таштанды ташуучу (№01-140)"
  },
  {
    day: "Шейшемби",
    streets: ["Жибек-Жолу көчөсү", "Токтогул көчөсү", "Жаштык көчөсү", "Жаңы Конуш 1-квартал"],
    time: "08:00 – 13:00",
    truckModel: "КамАЗ-КО-440 таштанды ташуучу (№01-140)"
  },
  {
    day: "Шаршемби",
    streets: ["Борбордук базар аймагы", "Мектеп жана Бала бакчалар", "Оорукана аймагы", "Соода түйүндөрү"],
    time: "07:30 – 12:00",
    truckModel: "КамАЗ жана Hyundai Porter көмөкчү унаа"
  },
  {
    day: "Бейшемби",
    streets: ["Курманжан Датка көчөсү", "Биримдик көчөсү", "Батыш конушу", "Өнөр жай зонасы"],
    time: "08:00 – 13:00",
    truckModel: "КамАЗ-КО-440 таштанды ташуучу (№01-140)"
  },
  {
    day: "Жума",
    streets: ["Чыгыш конушу 1-2-көчөлөрү", "Мечит айланасы", "Эски айыл көчөлөрү", "Спорт аянтчасы"],
    time: "08:00 – 12:30",
    truckModel: "КамАЗ-КО-440 таштанды ташуучу (№01-140)"
  },
  {
    day: "Ишемби",
    streets: ["Ири көлөмдөгү таштандылар боюнча атайын буйрутмалар", "Короолордон бак-дарак жана курулуш калдыктары"],
    time: "09:00 – 16:00",
    truckModel: "Экскаватор-жүктөгүч + КамАЗ самосвал"
  }
];

export const INITIAL_TRANSACTIONS: PaymentTransaction[] = [
  {
    id: "tx-9821",
    receiptNumber: "TZL-2026-09821",
    timestamp: "2026-10-10 14:22",
    payerName: "Асанбек уулу Нурлан",
    payerPhone: "+996 (702) 45-88-12",
    accountId: "1042",
    serviceType: "water",
    serviceName: "Таза суу (ичүүчү суу) акысы",
    amount: 350,
    paymentMethod: "MBank",
    status: "Төлөндү",
    details: "Эсептегич көрсөткүчү: 312 -> 330 (18 м³)"
  },
  {
    id: "tx-9820",
    receiptNumber: "TZL-2026-09820",
    timestamp: "2026-10-10 11:45",
    payerName: "Садыкова Гүлмира Эргешовна",
    payerPhone: "+996 (770) 12-34-56",
    accountId: "1043",
    serviceType: "waste",
    serviceName: "Катуу тиричилик калдыктары (Таштанды чыгаруу)",
    amount: 140,
    paymentMethod: "Optima24",
    status: "Төлөндү",
    details: "4 адамга 1 айлык төлөм"
  },
  {
    id: "tx-9819",
    receiptNumber: "TZL-2026-09819",
    timestamp: "2026-10-09 16:10",
    payerName: "Токтосунов Бакытбек Касымович",
    payerPhone: "+996 (555) 98-76-54",
    accountId: "1044",
    serviceType: "pasture",
    serviceName: "Жайыт пайдалануу акысы (Жайлоо билети)",
    amount: 2450,
    paymentMethod: "O!Dengi",
    status: "Төлөндү",
    details: "Үч-Эмчек жайлоосу: 8 бодо мал, 4 жылкы, 60 кой"
  },
  {
    id: "tx-9818",
    receiptNumber: "TZL-2026-09818",
    timestamp: "2026-10-08 09:30",
    payerName: "Осмонов Канат Жумабекович",
    payerPhone: "+996 (700) 88-11-22",
    accountId: "1098",
    serviceType: "machinery",
    serviceName: "Атайын техника ижарасы: JCB 3CX Экскаватор",
    amount: 4200,
    paymentMethod: "MBank",
    status: "Төлөндү",
    details: "2 саат арык казуу кызматы (оператор менен)"
  }
];
