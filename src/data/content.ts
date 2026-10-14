// Админ панелинен өзгөртүлүүчү мазмун (базадагы content_blocks таблицасы).
// Төмөндөгү маанилер база бош болгондо же жүктөлгүчө көрсөтүлөт.

export interface NewsItem {
  id: string;
  date: string;
  title: string;
  desc: string;
  image?: string;
}

export interface DocumentItem {
  id: string;
  name: string;
  url: string; // жүктөлгөн PDF же башка шилтеме
}

export interface BudgetItem {
  id: string;
  label: string;
  amount: number;
  color: 'cyan' | 'amber' | 'emerald' | 'indigo' | 'rose' | 'stone';
}

export interface BudgetBlock {
  title: string;
  subtitle: string;
  badge: string;
  items: BudgetItem[];
  spentLabel: string;
  spent: number;
}

export interface ReceptionBlock {
  title: string;
  text: string;
  address: string;
}

export interface PastureWork {
  id: string;
  title: string;
  cost: number;
  description: string;
}

export interface PastureReportBlock {
  title: string;
  intro: string;
  pdfUrl: string;
  pdfLabel: string;
  collectedLabel: string;
  collected: number;
  collectedNote: string;
  spentLabel: string;
  spent: number;
  spentNote: string;
  worksLabel: string;
  worksValue: string;
  worksNote: string;
  worksTitle: string;
  works: PastureWork[];
}

export interface WasteDay {
  id: string;
  day: string;
  streets: string[];
  time: string;
  truckModel: string;
}

export interface HeroStat {
  id: string;
  value: string;
  label: string;
}

export interface SiteImages {
  hero: string;
  pasture: string;
}

export interface SiteContent {
  news: NewsItem[];
  documents: DocumentItem[];
  budget: BudgetBlock;
  reception: ReceptionBlock;
  pastureReport: PastureReportBlock;
  wasteSchedule: WasteDay[];
  heroStats: HeroStat[];
  images: SiteImages;
  /** Сайттагы майда тексттердин админ өзгөрткөн варианттары: баштапкы текст → жаңы текст */
  texts: Record<string, string>;
}

export const CONTENT_KEYS: (keyof SiteContent)[] = [
  'news',
  'documents',
  'budget',
  'reception',
  'pastureReport',
  'wasteSchedule',
  'heroStats',
  'images',
  'texts'
];

export const newId = () => Math.random().toString(36).slice(2, 10);

export const DEFAULT_CONTENT: SiteContent = {
  news: [
    {
      id: 'n1',
      date: '10-Октябрь, 2026',
      title: 'Күзгү санитардык тазалоо жана жазгы суу түтүктөрүн жылуулоо иштери башталды',
      desc: 'Айыл өкмөтү жана «Тазалык» ишканасы кышкы мезгилге даярдык көрүү максатында көчөлөрдү тазалоо жана суу колонкаларын тоңуудан сактоо иш-чараларын өткөрүүдө.'
    },
    {
      id: 'n2',
      date: '02-Октябрь, 2026',
      title: 'Үч-Эмчек жайлоосунан малдарды түшүрүү жана жайыт отчетун кабыл алуу жыйыны',
      desc: 'Жайыт комитетинин 2026-жылкы жайлоо сезону боюнча жыйынтыктоочу чогулушу айылдык клубда өтүп, малчылардын жана тургундардын сунуштары угулду.'
    },
    {
      id: 'n3',
      date: '25-Сентябрь, 2026',
      title: 'Жаңы XCMG чынжыр тамандуу экскаватор ишке киргизилди',
      desc: 'Айыл өкмөттүн өнүктүрүү фонду тарабынан сатылып алынган заманбап экскаватор эми тургундардын арык казуу жана курулуш иштерине толук кызмат көрсөтөт.'
    }
  ],
  documents: [
    { id: 'd1', name: '«Тазалык» МИ 2025-жылдык толук финансылык отчету', url: '/docs/finansy-otchet-2025.pdf' },
    { id: 'd2', name: 'Айылдык Кеңештин тарифтер жөнүндө Токтому (№14-2026)', url: '/docs/tarif-toktom-14-2026.pdf' },
    { id: 'd3', name: 'Жайыт пайдалануучулар бирикмесинин планы жана сметасы', url: '/docs/jayyt-plan-smeta.pdf' }
  ],
  budget: {
    title: '2025-2026-жж. Бюджеттин аткарылышы',
    subtitle: 'Жалпы кирешелер жана коммуналдык тейлөө чыгашалары',
    badge: 'Аудиттен өткөн',
    items: [
      { id: 'b1', label: 'Таза суу төлөмдөрү (водомер + калк)', amount: 1820000, color: 'cyan' },
      { id: 'b2', label: 'Жайыт пайдалануу жыйымдары', amount: 1485600, color: 'amber' },
      { id: 'b3', label: 'Катуу калдыктар (таштанды ташуу)', amount: 540000, color: 'emerald' },
      { id: 'b4', label: 'Атайын техниканы ижарага берүүдөн түшкөн киреше', amount: 460000, color: 'indigo' }
    ],
    spentLabel: 'Инфраструктурага сарпталган',
    spent: 3980200
  },
  reception: {
    title: 'Коомдук кабыл алуу жана байланыш',
    text: 'Жарандардын арыздары жана сунуштары боюнча ишкананын жетекчиси аптанын шаршемби күндөрү саат 10:00дөн 13:00гө чейин жеке кабыл алат.',
    address: 'Айыл өкмөтүнүн имараты, 1-кабат, 104-кабинет'
  },
  pastureReport: {
    title: 'Жайыт комитетинин каржылык жана чарбалык отчеттору',
    intro: 'Тургундардан чогулган жайыт акысы кайда сарпталды? Көпүрөлөрдү оңдоо, ашуу жолдорун тегиздөө, суу ноолорун орнотуу жана чөп сээп калыбына келтирүү иштери.',
    pdfUrl: '/docs/jayyt-otchet-2025.pdf',
    pdfLabel: 'Жылдык отчетту жүктөө (PDF)',
    collectedLabel: 'Чогултулган каражаттар (2025-ж)',
    collected: 1485600,
    collectedNote: '2,480 бодо мал, 1,120 жылкы, 16,400 койдон',
    spentLabel: 'Жайыт жакшыртууга сарпталган',
    spent: 1392400,
    spentNote: 'Калдык каражат резервдик фонддо',
    worksLabel: 'Аткарылган чарбалык иштер',
    worksValue: '6 ири долбоор',
    worksNote: '2 көпүрө, 18 км жол, 6 суу ноосу, 45 га сээлди',
    worksTitle: 'Жайыт фондунун эсебинен аткарылган иштердин тизмеси:',
    works: [
      { id: 'w1', title: 'Үч-Эмчек жайлоосуна 2 автоунаа көпүрөсүн оңдоо', cost: 420000, description: 'Жазгы селден бузулган жыгач көпүрөлөр темир-бетон конструкциясы менен капиталдык оңдолду.' },
      { id: 'w2', title: '18 км ички жайыт жолдорун грейдер менен тегиздөө', cost: 295000, description: 'Чоң-Төр жана Үч-Эмчек капчыгайларындагы ашуу жолдору тоо таштарынан тазаланып кеңейтилди.' },
      { id: 'w3', title: 'Мал сугаруучу 6 даана темир-бетон ноо (корыто) орнотуу', cost: 185000, description: 'Булактардын көзү ачылып, мал тебелебей таза суу ичүүсү үчүн санитардык зона тосулду.' },
      { id: 'w4', title: '45 гектар деградацияга учураган жайытка беде жана эспарцет сээп байытуу', cost: 215000, description: 'Бел-Булак жайытында отоо чөптөр чабылып, көп жылдык тоют чөптөрдүн үрөнү себилди.' },
      { id: 'w5', title: 'Ветеринардык дарылоо жана дегельминтизация иш-чаралары', cost: 145000, description: 'Айыл өкмөттүн ветеринардык кызматы менен биргеликте эхинококкоз жана шарп ооруларына каршы дезинфекция.' },
      { id: 'w6', title: 'Административдик чыгымдар жана жайыт көзөмөлчүлөрүнүн маянасы', cost: 132400, description: 'Жайыт комитетинин 3 кызматкеринин маянасы, Соцфонд төгүмдөрү жана күйүүчү май чыгымдары.' }
    ]
  },
  wasteSchedule: [
    { id: 's1', day: 'Дүйшөмбү', streets: ['Ленин көчөсү (1-120)', 'Айтматов көчөсү', 'Манас көчөсү', 'Көл-Төр туюк көчөлөрү'], time: '08:00 – 13:00', truckModel: 'КамАЗ-КО-440 таштанды ташуучу (№01-140)' },
    { id: 's2', day: 'Шейшемби', streets: ['Жибек-Жолу көчөсү', 'Токтогул көчөсү', 'Жаштык көчөсү', 'Жаңы Конуш 1-квартал'], time: '08:00 – 13:00', truckModel: 'КамАЗ-КО-440 таштанды ташуучу (№01-140)' },
    { id: 's3', day: 'Шаршемби', streets: ['Борбордук базар аймагы', 'Мектеп жана Бала бакчалар', 'Оорукана аймагы', 'Соода түйүндөрү'], time: '07:30 – 12:00', truckModel: 'КамАЗ жана Hyundai Porter көмөкчү унаа' },
    { id: 's4', day: 'Бейшемби', streets: ['Курманжан Датка көчөсү', 'Биримдик көчөсү', 'Батыш конушу', 'Өнөр жай зонасы'], time: '08:00 – 13:00', truckModel: 'КамАЗ-КО-440 таштанды ташуучу (№01-140)' },
    { id: 's5', day: 'Жума', streets: ['Чыгыш конушу 1-2-көчөлөрү', 'Мечит айланасы', 'Эски айыл көчөлөрү', 'Спорт аянтчасы'], time: '08:00 – 12:30', truckModel: 'КамАЗ-КО-440 таштанды ташуучу (№01-140)' },
    { id: 's6', day: 'Ишемби', streets: ['Ири көлөмдөгү таштандылар боюнча атайын буйрутмалар', 'Короолордон бак-дарак жана курулуш калдыктары'], time: '09:00 – 16:00', truckModel: 'Экскаватор-жүктөгүч + КамАЗ самосвал' }
  ],
  heroStats: [
    { id: 'h1', value: '1,240+', label: 'Тейленген үй чарба' },
    { id: 'h2', value: '24 / 7', label: 'Авариялык диспетчер' },
    { id: 'h3', value: '6 бирдик', label: 'Муниципалдык техника' },
    { id: 'h4', value: '10,400 га', label: 'Көзөмөлдөгү жайыттар' }
  ],
  images: {
    hero: 'images/tazalyk_hero_village_1791715414641.jpg',
    pasture: 'images/tazalyk_pasture_landscape_1791715452252.jpg'
  },
  texts: {}
};

// Базадан келген маалыматты баштапкы маанилер менен айкалыштыруу
// (жаңы талаа кошулса, эски жазууда жок болсо да сайт бузулбайт)
export function mergeContent(rows: { key: string; data: unknown }[]): SiteContent {
  const out: SiteContent = { ...DEFAULT_CONTENT };
  for (const r of rows) {
    const k = r.key as keyof SiteContent;
    if (!CONTENT_KEYS.includes(k) || r.data == null) continue;
    const def = DEFAULT_CONTENT[k];
    (out as any)[k] = Array.isArray(def) ? (Array.isArray(r.data) ? r.data : def) : { ...(def as object), ...(r.data as object) };
  }
  return out;
}
