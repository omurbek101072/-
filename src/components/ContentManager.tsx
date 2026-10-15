import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useApp, Review } from '../context/AppContext';
import { MachineryItem } from '../data/mockData';
import {
  SiteContent,
  NewsItem,
  DocumentItem,
  BudgetBlock,
  PastureReportBlock,
  WasteDay,
  HeroStat,
  ReceptionBlock,
  SiteImages,
  AboutBlock,
  TeamMember,
  Credential,
  WorkItem,
  AreasBlock,
  FaqItem,
  ContactsBlock,
  newId
} from '../data/content';
import { uploadImage, uploadPdf } from '../utils/media';
import {
  FileText,
  Calendar,
  BarChart3,
  Mountain,
  Trash2,
  Plus,
  Save,
  Truck,
  Sparkles,
  Camera,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  X,
  Users,
  Award,
  Image as ImageIcon,
  MapPin,
  CircleHelp,
  Star,
  Info,
  Eye,
  EyeOff
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Жалпы майда компоненттер
// ---------------------------------------------------------------------------

const inputCls =
  'w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs text-stone-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none';

const Field: React.FC<{
  id: string;
  label: string;
  value: string | number;
  onChange: (v: string) => void;
  type?: 'text' | 'number';
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
  hint?: string;
}> = ({ id, label, value, onChange, type = 'text', placeholder, multiline, rows = 3, hint }) => (
  <div className="min-w-0">
    <label htmlFor={id} className="block text-[11px] font-semibold text-stone-700 mb-1">
      {label}
    </label>
    {multiline ? (
      <textarea id={id} rows={rows} value={value} placeholder={placeholder} onChange={e => onChange(e.target.value)} className={`${inputCls} resize-y`} />
    ) : (
      <input id={id} type={type} value={value} placeholder={placeholder} onChange={e => onChange(e.target.value)} className={`${inputCls} ${type === 'number' ? 'font-mono' : ''}`} />
    )}
    {hint && <p className="text-[10px] text-stone-400 mt-0.5">{hint}</p>}
  </div>
);

// Сүрөт тандоо + жүктөө + алдын ала көрүү
const ImagePicker: React.FC<{
  id: string;
  label: string;
  value?: string;
  folder: string;
  onChange: (url: string | undefined) => void;
  allowRemove?: boolean;
}> = ({ id, label, value, folder, onChange, allowRemove = true }) => {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handle = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      onChange(await uploadImage(file, folder));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Жүктөө мүмкүн болгон жок.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-1.5">
      <span className="block text-[11px] font-semibold text-stone-700">{label}</span>
      <div className="flex flex-wrap items-center gap-3">
        {value ? (
          <img src={value} alt="" className="w-28 h-20 object-cover rounded-lg border border-stone-200 bg-stone-100" />
        ) : (
          <div className="w-28 h-20 rounded-lg border border-dashed border-stone-300 bg-stone-50 flex items-center justify-center text-stone-400">
            <Camera className="w-5 h-5" />
          </div>
        )}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor={id}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer ${
              busy ? 'bg-stone-200 text-stone-500' : 'bg-emerald-700 hover:bg-emerald-800 text-white'
            }`}
          >
            {busy ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
            <span>{busy ? 'Жүктөлүүдө...' : value ? 'Башка сүрөт' : 'Сүрөт жүктөө'}</span>
          </label>
          <input id={id} type="file" accept="image/*" className="hidden" disabled={busy} onChange={handle} />
          {value && allowRemove && (
            <button type="button" onClick={() => onChange(undefined)} className="text-[11px] text-rose-600 hover:underline text-left cursor-pointer">
              Сүрөттү алып салуу
            </button>
          )}
        </div>
      </div>
      {error && <p className="text-[11px] text-rose-600 font-semibold">{error}</p>}
    </div>
  );
};

// PDF жүктөө же шилтеме жазуу
const PdfPicker: React.FC<{ id: string; label: string; value: string; onChange: (url: string) => void }> = ({ id, label, value, onChange }) => {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handle = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      onChange(await uploadPdf(file));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Жүктөө мүмкүн болгон жок.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-1.5 min-w-0">
      <label htmlFor={`${id}-url`} className="block text-[11px] font-semibold text-stone-700">{label}</label>
      <div className="flex flex-wrap gap-2">
        <input
          id={`${id}-url`}
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="PDF жүктөңүз же шилтеме жазыңыз"
          className={`${inputCls} flex-1 min-w-[12rem] font-mono text-[11px]`}
        />
        <label
          htmlFor={`${id}-file`}
          className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-bold cursor-pointer shrink-0 ${
            busy ? 'bg-stone-200 text-stone-500' : 'bg-stone-800 hover:bg-stone-900 text-white'
          }`}
        >
          {busy ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
          <span>{busy ? 'Жүктөлүүдө...' : 'PDF жүктөө'}</span>
        </label>
        <input id={`${id}-file`} type="file" accept="application/pdf,.pdf" className="hidden" disabled={busy} onChange={handle} />
      </div>
      {value && /^https?:\/\//.test(value) && (
        <a href={value} target="_blank" rel="noopener noreferrer" className="text-[11px] text-emerald-700 hover:underline">
          Файлды ачып текшерүү →
        </a>
      )}
      {error && <p className="text-[11px] text-rose-600 font-semibold">{error}</p>}
    </div>
  );
};

// Тизмедеги элементтин жогору/төмөн/өчүрүү баскычтары
const RowTools: React.FC<{ onUp?: () => void; onDown?: () => void; onRemove: () => void; removeLabel?: string }> = ({
  onUp,
  onDown,
  onRemove,
  removeLabel = 'Өчүрүү'
}) => {
  const [confirm, setConfirm] = useState(false);
  return (
    <div className="flex items-center gap-1 shrink-0">
      {onUp && (
        <button type="button" onClick={onUp} aria-label="Жогору жылдыруу" className="w-7 h-7 rounded-md bg-stone-100 hover:bg-stone-200 text-stone-600 cursor-pointer">↑</button>
      )}
      {onDown && (
        <button type="button" onClick={onDown} aria-label="Төмөн жылдыруу" className="w-7 h-7 rounded-md bg-stone-100 hover:bg-stone-200 text-stone-600 cursor-pointer">↓</button>
      )}
      {confirm ? (
        <>
          <button type="button" onClick={onRemove} className="px-2 h-7 rounded-md bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold cursor-pointer">Ооба</button>
          <button type="button" onClick={() => setConfirm(false)} className="px-2 h-7 rounded-md bg-stone-100 text-stone-700 text-[11px] cursor-pointer">Жок</button>
        </>
      ) : (
        <button type="button" onClick={() => setConfirm(true)} className="inline-flex items-center gap-1 px-2 h-7 rounded-md text-rose-600 hover:bg-rose-50 text-[11px] font-semibold cursor-pointer">
          <Trash2 className="w-3.5 h-3.5" />
          <span>{removeLabel}</span>
        </button>
      )}
    </div>
  );
};

function move<T>(list: T[], i: number, d: number): T[] {
  const j = i + d;
  if (j < 0 || j >= list.length) return list;
  const out = [...list];
  [out[i], out[j]] = [out[j], out[i]];
  return out;
}

// Бөлүмдүн өзгөртүүлөрүн сактоо тилкеси
function useDraft<K extends keyof SiteContent>(key: K) {
  const { content, updateContent } = useApp();
  const [draft, setDraft] = useState<SiteContent[K]>(content[key]);
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const dirty = JSON.stringify(draft) !== JSON.stringify(content[key]);

  // Серверден жаңы маалымат келсе (жана өзгөртүү жок болсо) — жаңыртабыз
  useEffect(() => {
    if (!dirty) setDraft(content[key]);
  }, [content[key]]);

  const save = async (override?: SiteContent[K]) => {
    const value = override ?? draft;
    if (override) setDraft(override);
    setSaving(true);
    const r = await updateContent(key, value);
    setSaving(false);
    setStatus(r.ok ? { ok: true, text: 'Сакталды! Сайтта дароо көрүнөт.' } : { ok: false, text: r.error || 'Сактоо мүмкүн болгон жок.' });
    if (r.ok) setTimeout(() => setStatus(null), 4000);
  };
  const reset = () => {
    setDraft(content[key]);
    setStatus(null);
  };
  return { draft, setDraft, save, reset, dirty, saving, status };
}

const SaveBar: React.FC<{ dirty: boolean; saving: boolean; status: { ok: boolean; text: string } | null; onSave: () => void; onReset: () => void }> = ({
  dirty,
  saving,
  status,
  onSave,
  onReset
}) => (
  <div className="sticky bottom-0 z-10 -mx-1 px-1 pt-3 pb-1 bg-gradient-to-t from-stone-100 via-stone-100 to-transparent">
    <div className="flex flex-wrap items-center justify-end gap-2 p-3 rounded-xl bg-white border border-stone-200 shadow-sm">
      {status && (
        <span className={`mr-auto text-[11px] font-semibold flex items-center gap-1 ${status.ok ? 'text-emerald-700' : 'text-rose-600'}`} role="status">
          {status.ok ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
          {status.text}
        </span>
      )}
      {!status && dirty && <span className="mr-auto text-[11px] text-amber-700 font-semibold">Сакталбаган өзгөртүүлөр бар</span>}
      <button type="button" disabled={!dirty || saving} onClick={onReset} className="px-3 py-2 rounded-lg text-xs font-semibold text-stone-600 bg-stone-100 hover:bg-stone-200 disabled:opacity-40 cursor-pointer">
        Жокко чыгаруу
      </button>
      <button
        type="button"
        disabled={!dirty || saving}
        onClick={onSave}
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-40 cursor-pointer"
      >
        <Save className="w-3.5 h-3.5" />
        <span>{saving ? 'Сакталууда...' : 'Сактоо'}</span>
      </button>
    </div>
  </div>
);

const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`p-4 rounded-xl border border-stone-200 bg-white space-y-3 ${className}`}>{children}</div>
);

// ---------------------------------------------------------------------------
// 1. Жаңылыктар
// ---------------------------------------------------------------------------
const NewsEditor: React.FC = () => {
  const { draft, setDraft, save, reset, dirty, saving, status } = useDraft('news');
  const set = (i: number, patch: Partial<NewsItem>) => setDraft(draft.map((n, k) => (k === i ? { ...n, ...patch } : n)));
  const today = new Date().toLocaleDateString('ru-RU');

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => setDraft([{ id: newId(), date: today, title: '', desc: '' }, ...draft])}
        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold cursor-pointer"
      >
        <Plus className="w-3.5 h-3.5" />
        <span>Жаңы жаңылык кошуу</span>
      </button>
      {draft.length === 0 && <p className="text-xs text-stone-400">Жаңылык жок. «Жаңы жаңылык кошуу» басыңыз.</p>}
      {draft.map((n, i) => (
        <Card key={n.id}>
          <div className="flex items-start justify-between gap-2">
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">Жаңылык {i + 1}</span>
            <RowTools
              onUp={i > 0 ? () => setDraft(move(draft, i, -1)) : undefined}
              onDown={i < draft.length - 1 ? () => setDraft(move(draft, i, 1)) : undefined}
              onRemove={() => setDraft(draft.filter((_, k) => k !== i))}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-[10rem_1fr] gap-3">
            <Field id={`news-date-${n.id}`} label="Күнү" value={n.date} onChange={v => set(i, { date: v })} placeholder="12-Октябрь, 2026" />
            <Field id={`news-title-${n.id}`} label="Аталышы" value={n.title} onChange={v => set(i, { title: v })} />
          </div>
          <Field id={`news-desc-${n.id}`} label="Тексти" multiline rows={4} value={n.desc} onChange={v => set(i, { desc: v })} />
          <ImagePicker id={`news-img-${n.id}`} label="Сүрөт (милдеттүү эмес)" folder="news" value={n.image} onChange={url => set(i, { image: url })} />
        </Card>
      ))}
      <SaveBar dirty={dirty} saving={saving} status={status} onSave={() => save()} onReset={reset} />
    </div>
  );
};

// ---------------------------------------------------------------------------
// 2. Документтер
// ---------------------------------------------------------------------------
const DocumentsEditor: React.FC = () => {
  const { draft, setDraft, save, reset, dirty, saving, status } = useDraft('documents');
  const set = (i: number, patch: Partial<DocumentItem>) => setDraft(draft.map((d, k) => (k === i ? { ...d, ...patch } : d)));

  return (
    <div className="space-y-3">
      <p className="text-[11px] text-stone-500">Отчеттор бөлүмүндөгү «Расмий документтер» тизмеси. PDF файлды жүктөсөңүз же шилтемесин жазсаңыз болот.</p>
      <button
        type="button"
        onClick={() => setDraft([...draft, { id: newId(), name: '', url: '' }])}
        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold cursor-pointer"
      >
        <Plus className="w-3.5 h-3.5" />
        <span>Документ кошуу</span>
      </button>
      {draft.map((d, i) => (
        <Card key={d.id}>
          <div className="flex items-start justify-between gap-2">
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">Документ {i + 1}</span>
            <RowTools
              onUp={i > 0 ? () => setDraft(move(draft, i, -1)) : undefined}
              onDown={i < draft.length - 1 ? () => setDraft(move(draft, i, 1)) : undefined}
              onRemove={() => setDraft(draft.filter((_, k) => k !== i))}
            />
          </div>
          <Field id={`doc-name-${d.id}`} label="Документтин аталышы" value={d.name} onChange={v => set(i, { name: v })} />
          <PdfPicker id={`doc-file-${d.id}`} label="Файл" value={d.url} onChange={url => set(i, { url })} />
        </Card>
      ))}
      <SaveBar dirty={dirty} saving={saving} status={status} onSave={() => save()} onReset={reset} />
    </div>
  );
};

// ---------------------------------------------------------------------------
// 3. Бюджет жана кабыл алуу
// ---------------------------------------------------------------------------
const COLORS: { id: BudgetBlock['items'][number]['color']; label: string }[] = [
  { id: 'cyan', label: 'Көк' },
  { id: 'amber', label: 'Сары' },
  { id: 'emerald', label: 'Жашыл' },
  { id: 'indigo', label: 'Кызгылт-көк' },
  { id: 'rose', label: 'Кызыл' },
  { id: 'stone', label: 'Боз' }
];

const BudgetEditor: React.FC = () => {
  const { draft, setDraft, save, reset, dirty, saving, status } = useDraft('budget');
  const rec = useDraft('reception');
  const setItem = (i: number, patch: Partial<BudgetBlock['items'][number]>) =>
    setDraft({ ...draft, items: draft.items.map((it, k) => (k === i ? { ...it, ...patch } : it)) });
  const total = draft.items.reduce((s, i) => s + (Number(i.amount) || 0), 0);

  return (
    <div className="space-y-4">
      <Card>
        <h4 className="text-xs font-bold text-stone-900">Бюджеттин аткарылышы</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field id="budget-title" label="Аталышы" value={draft.title} onChange={v => setDraft({ ...draft, title: v })} />
          <Field id="budget-badge" label="Белги (мис. «Аудиттен өткөн»)" value={draft.badge} onChange={v => setDraft({ ...draft, badge: v })} />
        </div>
        <Field id="budget-sub" label="Түшүндүрмө" value={draft.subtitle} onChange={v => setDraft({ ...draft, subtitle: v })} />
        <div className="space-y-2">
          <span className="block text-[11px] font-semibold text-stone-700">Киреше беренелери (жалпы: {total.toLocaleString('ru-RU')} сом)</span>
          {draft.items.map((it, i) => (
            <div key={it.id} className="grid grid-cols-1 sm:grid-cols-[1fr_9rem_8rem_auto] gap-2 items-end p-2 rounded-lg bg-stone-50">
              <Field id={`bi-label-${it.id}`} label="Аталышы" value={it.label} onChange={v => setItem(i, { label: v })} />
              <Field id={`bi-amt-${it.id}`} label="Сумма (сом)" type="number" value={it.amount} onChange={v => setItem(i, { amount: Number(v) })} />
              <div>
                <label htmlFor={`bi-color-${it.id}`} className="block text-[11px] font-semibold text-stone-700 mb-1">Түсү</label>
                <select id={`bi-color-${it.id}`} value={it.color} onChange={e => setItem(i, { color: e.target.value as any })} className={inputCls}>
                  {COLORS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
              </div>
              <RowTools onRemove={() => setDraft({ ...draft, items: draft.items.filter((_, k) => k !== i) })} />
            </div>
          ))}
          <button
            type="button"
            onClick={() => setDraft({ ...draft, items: [...draft.items, { id: newId(), label: '', amount: 0, color: 'emerald' }] })}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-900 text-white text-[11px] font-bold cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Берене кошуу</span>
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field id="budget-spent-label" label="Сарпталган (аталышы)" value={draft.spentLabel} onChange={v => setDraft({ ...draft, spentLabel: v })} />
          <Field id="budget-spent" label="Сарпталган сумма (сом)" type="number" value={draft.spent} onChange={v => setDraft({ ...draft, spent: Number(v) })} />
        </div>
        <SaveBar dirty={dirty} saving={saving} status={status} onSave={() => save()} onReset={reset} />
      </Card>

      <Card>
        <h4 className="text-xs font-bold text-stone-900">Коомдук кабыл алуу (жашыл блок)</h4>
        <Field id="rec-title" label="Аталышы" value={rec.draft.title} onChange={v => rec.setDraft({ ...rec.draft, title: v } as ReceptionBlock)} />
        <Field id="rec-text" label="Тексти" multiline value={rec.draft.text} onChange={v => rec.setDraft({ ...rec.draft, text: v } as ReceptionBlock)} />
        <Field id="rec-addr" label="Дарек" value={rec.draft.address} onChange={v => rec.setDraft({ ...rec.draft, address: v } as ReceptionBlock)} />
        <SaveBar dirty={rec.dirty} saving={rec.saving} status={rec.status} onSave={() => rec.save()} onReset={rec.reset} />
      </Card>
    </div>
  );
};

// ---------------------------------------------------------------------------
// 4. Жайыт отчету
// ---------------------------------------------------------------------------
const PastureReportEditor: React.FC = () => {
  const { draft, setDraft, save, reset, dirty, saving, status } = useDraft('pastureReport');
  const set = (patch: Partial<PastureReportBlock>) => setDraft({ ...draft, ...patch });
  const setWork = (i: number, patch: Partial<PastureReportBlock['works'][number]>) =>
    set({ works: draft.works.map((w, k) => (k === i ? { ...w, ...patch } : w)) });

  return (
    <div className="space-y-4">
      <Card>
        <Field id="pr-title" label="Аталышы" value={draft.title} onChange={v => set({ title: v })} />
        <Field id="pr-intro" label="Киришүү тексти" multiline value={draft.intro} onChange={v => set({ intro: v })} />
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_14rem] gap-3">
          <PdfPicker id="pr-pdf" label="Толук отчет (PDF)" value={draft.pdfUrl} onChange={url => set({ pdfUrl: url })} />
          <Field id="pr-pdf-label" label="Баскычтын тексти" value={draft.pdfLabel} onChange={v => set({ pdfLabel: v })} />
        </div>
      </Card>
      <Card>
        <h4 className="text-xs font-bold text-stone-900">Негизги көрсөткүчтөр</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="space-y-2">
            <Field id="pr-col-l" label="1-карточка аталышы" value={draft.collectedLabel} onChange={v => set({ collectedLabel: v })} />
            <Field id="pr-col" label="Чогултулган (сом)" type="number" value={draft.collected} onChange={v => set({ collected: Number(v) })} />
            <Field id="pr-col-n" label="Эскертүү" value={draft.collectedNote} onChange={v => set({ collectedNote: v })} />
          </div>
          <div className="space-y-2">
            <Field id="pr-sp-l" label="2-карточка аталышы" value={draft.spentLabel} onChange={v => set({ spentLabel: v })} />
            <Field id="pr-sp" label="Сарпталган (сом)" type="number" value={draft.spent} onChange={v => set({ spent: Number(v) })} />
            <Field id="pr-sp-n" label="Эскертүү" value={draft.spentNote} onChange={v => set({ spentNote: v })} />
          </div>
          <div className="space-y-2">
            <Field id="pr-w-l" label="3-карточка аталышы" value={draft.worksLabel} onChange={v => set({ worksLabel: v })} />
            <Field id="pr-w-v" label="Чоң сан/текст" value={draft.worksValue} onChange={v => set({ worksValue: v })} />
            <Field id="pr-w-n" label="Эскертүү" value={draft.worksNote} onChange={v => set({ worksNote: v })} />
          </div>
        </div>
      </Card>
      <Card>
        <Field id="pr-works-title" label="Аткарылган иштер — аталышы" value={draft.worksTitle} onChange={v => set({ worksTitle: v })} />
        {draft.works.map((w, i) => (
          <div key={w.id} className="p-3 rounded-lg bg-stone-50 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <span className="text-[11px] font-bold text-stone-500">Иш {i + 1}</span>
              <RowTools
                onUp={i > 0 ? () => set({ works: move(draft.works, i, -1) }) : undefined}
                onDown={i < draft.works.length - 1 ? () => set({ works: move(draft.works, i, 1) }) : undefined}
                onRemove={() => set({ works: draft.works.filter((_, k) => k !== i) })}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_10rem] gap-2">
              <Field id={`pw-t-${w.id}`} label="Иштин аталышы" value={w.title} onChange={v => setWork(i, { title: v })} />
              <Field id={`pw-c-${w.id}`} label="Наркы (сом)" type="number" value={w.cost} onChange={v => setWork(i, { cost: Number(v) })} />
            </div>
            <Field id={`pw-d-${w.id}`} label="Түшүндүрмө" multiline rows={2} value={w.description} onChange={v => setWork(i, { description: v })} />
          </div>
        ))}
        <button
          type="button"
          onClick={() => set({ works: [...draft.works, { id: newId(), title: '', cost: 0, description: '' }] })}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-900 text-white text-[11px] font-bold cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Иш кошуу</span>
        </button>
      </Card>
      <SaveBar dirty={dirty} saving={saving} status={status} onSave={() => save()} onReset={reset} />
    </div>
  );
};

// ---------------------------------------------------------------------------
// 5. Таштанды чыгаруу графиги
// ---------------------------------------------------------------------------
const WasteEditor: React.FC = () => {
  const { draft, setDraft, save, reset, dirty, saving, status } = useDraft('wasteSchedule');
  const set = (i: number, patch: Partial<WasteDay>) => setDraft(draft.map((d, k) => (k === i ? { ...d, ...patch } : d)));

  return (
    <div className="space-y-3">
      {draft.map((d, i) => (
        <Card key={d.id}>
          <div className="flex items-start justify-between gap-2">
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">{d.day || `Күн ${i + 1}`}</span>
            <RowTools
              onUp={i > 0 ? () => setDraft(move(draft, i, -1)) : undefined}
              onDown={i < draft.length - 1 ? () => setDraft(move(draft, i, 1)) : undefined}
              onRemove={() => setDraft(draft.filter((_, k) => k !== i))}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Field id={`ws-day-${d.id}`} label="Апта күнү" value={d.day} onChange={v => set(i, { day: v })} />
            <Field id={`ws-time-${d.id}`} label="Убактысы" value={d.time} onChange={v => set(i, { time: v })} placeholder="08:00 – 13:00" />
            <Field id={`ws-truck-${d.id}`} label="Бригада / Техника" value={d.truckModel} onChange={v => set(i, { truckModel: v })} />
          </div>
          <Field
            id={`ws-streets-${d.id}`}
            label="Көчөлөр (ар бирин жаңы сапка жазыңыз)"
            multiline
            rows={4}
            value={d.streets.join('\n')}
            onChange={v => set(i, { streets: v.split('\n') })}
          />
        </Card>
      ))}
      <button
        type="button"
        onClick={() => setDraft([...draft, { id: newId(), day: '', time: '', truckModel: '', streets: [] }])}
        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold cursor-pointer"
      >
        <Plus className="w-3.5 h-3.5" />
        <span>Күн кошуу</span>
      </button>
      <SaveBar
        dirty={dirty}
        saving={saving}
        status={status}
        onSave={() => {
          // Бош саптарды алып салабыз
          save(draft.map(d => ({ ...d, streets: d.streets.map(s => s.trim()).filter(Boolean) })));
        }}
        onReset={reset}
      />
    </div>
  );
};

// ---------------------------------------------------------------------------
// 6. Башкы бет: сүрөттөр жана сандар
// ---------------------------------------------------------------------------
const HomeEditor: React.FC = () => {
  const img = useDraft('images');
  const stats = useDraft('heroStats');
  const setStat = (i: number, patch: Partial<HeroStat>) => stats.setDraft(stats.draft.map((s, k) => (k === i ? { ...s, ...patch } : s)));

  return (
    <div className="space-y-4">
      <Card>
        <h4 className="text-xs font-bold text-stone-900">Бөлүмдөрдүн чоң сүрөттөрү</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ImagePicker
            id="img-hero"
            label="Башкы беттин фону"
            folder="site"
            allowRemove={false}
            value={img.draft.hero}
            onChange={url => url && img.setDraft({ ...img.draft, hero: url } as SiteImages)}
          />
          <ImagePicker
            id="img-pasture"
            label="Жайыт бөлүмүнүн сүрөтү"
            folder="site"
            allowRemove={false}
            value={img.draft.pasture}
            onChange={url => url && img.setDraft({ ...img.draft, pasture: url } as SiteImages)}
          />
        </div>
        <SaveBar dirty={img.dirty} saving={img.saving} status={img.status} onSave={() => img.save()} onReset={img.reset} />
      </Card>
      <Card>
        <h4 className="text-xs font-bold text-stone-900">Башкы беттеги 4 сан</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {stats.draft.map((s, i) => (
            <div key={s.id} className="grid grid-cols-[7rem_1fr] gap-2 p-2 rounded-lg bg-stone-50">
              <Field id={`hs-v-${s.id}`} label="Сан" value={s.value} onChange={v => setStat(i, { value: v })} />
              <Field id={`hs-l-${s.id}`} label="Түшүндүрмө" value={s.label} onChange={v => setStat(i, { label: v })} />
            </div>
          ))}
        </div>
        <SaveBar dirty={stats.dirty} saving={stats.saving} status={stats.status} onSave={() => stats.save()} onReset={stats.reset} />
      </Card>
      <p className="text-[11px] text-stone-500">
        Башкы беттин аталыштары жана бөлүмдөрдүн тексттери «Аталыштар & Мазмун» бөлүмүндө.
      </p>
    </div>
  );
};

// ---------------------------------------------------------------------------
// 7. Техника
// ---------------------------------------------------------------------------
export const EMPTY_MACHINE = (): MachineryItem => ({
  id: `m-${newId()}`,
  name: '',
  category: 'special',
  model: '',
  year: new Date().getFullYear(),
  hourlyRate: 0,
  shiftRate: 0,
  image: '',
  status: 'бош',
  specs: { capacity: '', driverIncluded: true, fuelIncluded: true, minOrderHours: 1 },
  description: '',
  commonUses: []
});

export const MachineForm: React.FC<{ initial: MachineryItem; isNew: boolean; onClose: () => void }> = ({ initial, isNew, onClose }) => {
  const { updateMachineryItem, addMachineryItem } = useApp();
  const [m, setM] = useState<MachineryItem>(initial);
  const [error, setError] = useState<string | null>(null);
  const set = (patch: Partial<MachineryItem>) => setM({ ...m, ...patch });
  const setSpec = (patch: Partial<MachineryItem['specs']>) => setM({ ...m, specs: { ...m.specs, ...patch } });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!m.name.trim()) return setError('Техниканын аталышын жазыңыз.');
    if (!(m.hourlyRate > 0)) return setError('Сааттык баасын жазыңыз.');
    const clean = { ...m, commonUses: m.commonUses.map(s => s.trim()).filter(Boolean) };
    if (isNew) addMachineryItem(clean);
    else updateMachineryItem(clean);
    onClose();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm text-left"
      onClick={e => e.stopPropagation()}
      onSubmit={e => e.stopPropagation()}
      onKeyDown={e => e.stopPropagation()}
    >
      <form onSubmit={submit} className="bg-white rounded-2xl p-5 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-stone-200 shadow-2xl space-y-3 text-xs">
        <div className="flex items-center justify-between border-b border-stone-100 pb-2">
          <h3 className="text-sm font-bold text-stone-900">{isNew ? 'Жаңы техника кошуу' : `Өзгөртүү: ${initial.name}`}</h3>
          <button type="button" onClick={onClose} aria-label="Жабуу" className="p-1 text-stone-400 hover:text-stone-700 cursor-pointer"><X className="w-4 h-4" /></button>
        </div>
        <ImagePicker id="m-img" label="Сүрөтү" folder="machinery" value={m.image || undefined} onChange={url => set({ image: url || '' })} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field id="m-name" label="Аталышы *" value={m.name} onChange={v => set({ name: v })} />
          <Field id="m-model" label="Маркасы / модели" value={m.model} onChange={v => set({ model: v })} />
          <div>
            <label htmlFor="m-cat" className="block text-[11px] font-semibold text-stone-700 mb-1">Түрү</label>
            <select id="m-cat" value={m.category} onChange={e => set({ category: e.target.value as any })} className={inputCls}>
              <option value="excavator">Экскаватор</option>
              <option value="heavy_truck">Оор жүк ташуучу</option>
              <option value="light_truck">Жеңил жүк ташуучу</option>
              <option value="special">Суу түтүгү / суу кампасын оңдоо</option>
            </select>
          </div>
          <div>
            <label htmlFor="m-status" className="block text-[11px] font-semibold text-stone-700 mb-1">Абалы</label>
            <select id="m-status" value={m.status} onChange={e => set({ status: e.target.value as any })} className={inputCls}>
              <option value="бош">Бош (иштөөгө даяр)</option>
              <option value="иште">Иште</option>
              <option value="ремонтто">Ремонтто</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Field id="m-year" label="Жылы" type="number" value={m.year} onChange={v => set({ year: Number(v) })} />
          <Field id="m-hour" label="Саатына (сом) *" type="number" value={m.hourlyRate} onChange={v => set({ hourlyRate: Number(v) })} />
          <Field id="m-shift" label="Сменага (сом)" type="number" value={m.shiftRate} onChange={v => set({ shiftRate: Number(v) })} />
          <Field
            id="m-trip"
            label="Рейске (сом)"
            type="number"
            value={m.tripRate ?? ''}
            onChange={v => set({ tripRate: v === '' ? undefined : Number(v) })}
            hint="Бош калтырса — рейс жок"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_9rem] gap-3">
          <Field id="m-cap" label="Мүмкүнчүлүгү (мис. «15 тонна»)" value={m.specs.capacity} onChange={v => setSpec({ capacity: v })} />
          <Field id="m-min" label="Мин. заказ (саат)" type="number" value={m.specs.minOrderHours} onChange={v => setSpec({ minOrderHours: Math.max(1, Number(v) || 1) })} />
        </div>
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={m.specs.driverIncluded} onChange={e => setSpec({ driverIncluded: e.target.checked })} />
            <span>Айдоочусу менен</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={m.specs.fuelIncluded} onChange={e => setSpec({ fuelIncluded: e.target.checked })} />
            <span>Күйүүчү майы баада</span>
          </label>
        </div>
        <Field id="m-desc" label="Сүрөттөмө" multiline value={m.description} onChange={v => set({ description: v })} />
        <Field
          id="m-uses"
          label="Колдонулушу (ар бирин жаңы сапка)"
          multiline
          value={m.commonUses.join('\n')}
          onChange={v => set({ commonUses: v.split('\n') })}
        />
        {error && <p className="text-[11px] text-rose-600 font-semibold" role="alert">{error}</p>}
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="px-3 py-2 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold cursor-pointer">Жокко чыгаруу</button>
          <button type="submit" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold cursor-pointer">
            <Save className="w-3.5 h-3.5" />
            <span>Сактоо</span>
          </button>
        </div>
      </form>
    </div>,
    document.body
  );
};

export const MachineryEditor: React.FC = () => {
  const { machineryCatalog, deleteMachineryItem } = useApp();
  const [editing, setEditing] = useState<{ item: MachineryItem; isNew: boolean } | null>(null);

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => setEditing({ item: EMPTY_MACHINE(), isNew: true })}
        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold cursor-pointer"
      >
        <Plus className="w-3.5 h-3.5" />
        <span>Жаңы техника кошуу</span>
      </button>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {machineryCatalog.map(m => (
          <Card key={m.id} className="flex gap-3 space-y-0">
            {m.image ? (
              <img src={m.image} alt="" className="w-24 h-20 object-cover rounded-lg border border-stone-200 shrink-0" />
            ) : (
              <div className="w-24 h-20 rounded-lg bg-stone-100 flex items-center justify-center text-stone-400 shrink-0"><Truck className="w-6 h-6" /></div>
            )}
            <div className="min-w-0 flex-1 space-y-1">
              <div className="font-bold text-xs text-stone-900 truncate">{m.name}</div>
              <div className="text-[11px] text-stone-500 truncate">{m.model}</div>
              <div className="text-[11px] font-mono text-stone-700">{m.hourlyRate} с/саат · {m.status}</div>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button type="button" onClick={() => setEditing({ item: m, isNew: false })} className="text-[11px] font-semibold text-emerald-700 hover:underline cursor-pointer">
                  Өзгөртүү →
                </button>
                <RowTools onRemove={() => deleteMachineryItem(m.id)} />
              </div>
            </div>
          </Card>
        ))}
      </div>
      {editing && <MachineForm initial={editing.item} isNew={editing.isNew} onClose={() => setEditing(null)} />}
    </div>
  );
};


// ---------------------------------------------------------------------------
// 8. Компания жөнүндө + байланыш (WhatsApp, чалуу)
// ---------------------------------------------------------------------------
const AboutEditor: React.FC = () => {
  const ab = useDraft('about');
  const ct = useDraft('contacts');
  const setA = (patch: Partial<AboutBlock>) => ab.setDraft({ ...ab.draft, ...patch });
  const setC = (patch: Partial<ContactsBlock>) => ct.setDraft({ ...ct.draft, ...patch });
  const facts = ab.draft.facts || [];
  return (
    <div className="space-y-4">
      <Card>
        <h4 className="text-xs font-bold text-stone-900">Компания жөнүндө</h4>
        <Field id="about-title" label="Аталышы" value={ab.draft.title} onChange={v => setA({ title: v })} />
        <Field id="about-text" label="Тексти (абзацтарды бош сап менен бөлүңүз)" multiline rows={7} value={ab.draft.text} onChange={v => setA({ text: v })} />
        <ImagePicker id="about-img" label="Сүрөт (мис. ишкананын имараты)" folder="about" value={ab.draft.image || undefined} onChange={url => setA({ image: url || '' })} />
        <div className="space-y-2">
          <span className="block text-[11px] font-semibold text-stone-700">Сандар (мис. «2008» — «негизделген жылы»)</span>
          {facts.map((f, i) => (
            <div key={f.id} className="grid grid-cols-[7rem_1fr_auto] gap-2 items-end">
              <Field id={`af-v-${f.id}`} label="Сан" value={f.value} onChange={v => setA({ facts: facts.map((x, k) => (k === i ? { ...x, value: v } : x)) })} />
              <Field id={`af-l-${f.id}`} label="Түшүндүрмө" value={f.label} onChange={v => setA({ facts: facts.map((x, k) => (k === i ? { ...x, label: v } : x)) })} />
              <RowTools onRemove={() => setA({ facts: facts.filter((_, k) => k !== i) })} />
            </div>
          ))}
          <button type="button" onClick={() => setA({ facts: [...facts, { id: newId(), value: '', label: '' }] })} className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:underline cursor-pointer">
            <Plus className="w-3.5 h-3.5" /> Сан кошуу
          </button>
        </div>
        <SaveBar dirty={ab.dirty} saving={ab.saving} status={ab.status} onSave={() => ab.save()} onReset={ab.reset} />
      </Card>
      <Card>
        <h4 className="text-xs font-bold text-stone-900">WhatsApp жана чалуу баскычтары</h4>
        <p className="text-[11px] text-stone-500">Сайттын оң жак ылдыйкы бурчунда турат. Тургун бир басуу менен чалат же WhatsApp'ка жазат.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field id="ct-wa" label="WhatsApp номери" placeholder="996700123456" value={ct.draft.whatsapp} onChange={v => setC({ whatsapp: v })} hint="Өлкө коду менен, + жана боштуксуз. Бош болсо WhatsApp баскычы көрүнбөйт." />
          <Field id="ct-call" label="Чалуу үчүн номер" placeholder="0 (312) 55-01-20" value={ct.draft.callPhone} onChange={v => setC({ callPhone: v })} hint="Бош болсо диспетчердин номери колдонулат." />
        </div>
        <Field id="ct-wamsg" label="WhatsApp'тагы даяр билдирүү" value={ct.draft.whatsappMessage} onChange={v => setC({ whatsappMessage: v })} />
        <label className="flex items-center gap-2 text-xs cursor-pointer">
          <input type="checkbox" checked={ct.draft.showFloating} onChange={e => setC({ showFloating: e.target.checked })} />
          <span>Баскычтарды сайтта көрсөтүү</span>
        </label>
        <SaveBar dirty={ct.dirty} saving={ct.saving} status={ct.status} onSave={() => ct.save()} onReset={ct.reset} />
      </Card>
    </div>
  );
};

// ---------------------------------------------------------------------------
// 9. Команда
// ---------------------------------------------------------------------------
const TeamEditor: React.FC = () => {
  const { draft, setDraft, save, reset, dirty, saving, status } = useDraft('team');
  const set = (i: number, patch: Partial<TeamMember>) => setDraft(draft.map((m, k) => (k === i ? { ...m, ...patch } : m)));
  return (
    <div className="space-y-3">
      <button type="button" onClick={() => setDraft([...draft, { id: newId(), name: '', role: '' }])} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold cursor-pointer">
        <Plus className="w-3.5 h-3.5" />
        <span>Кызматкер кошуу</span>
      </button>
      {draft.length === 0 && <p className="text-xs text-stone-400">Азырынча эч ким жок. Кызматкерди сүрөтү менен кошуңуз.</p>}
      {draft.map((m, i) => (
        <Card key={m.id}>
          <div className="flex items-start justify-between gap-2">
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">Кызматкер {i + 1}</span>
            <RowTools onUp={i > 0 ? () => setDraft(move(draft, i, -1)) : undefined} onDown={i < draft.length - 1 ? () => setDraft(move(draft, i, 1)) : undefined} onRemove={() => setDraft(draft.filter((_, k) => k !== i))} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field id={`tm-n-${m.id}`} label="Аты-жөнү" value={m.name} onChange={v => set(i, { name: v })} />
            <Field id={`tm-r-${m.id}`} label="Кызматы" value={m.role} onChange={v => set(i, { role: v })} placeholder="Мис. Директор" />
          </div>
          <ImagePicker id={`tm-p-${m.id}`} label="Сүрөтү" folder="team" value={m.photo} onChange={url => set(i, { photo: url })} />
        </Card>
      ))}
      <SaveBar dirty={dirty} saving={saving} status={status} onSave={() => save()} onReset={reset} />
    </div>
  );
};

// ---------------------------------------------------------------------------
// 10. Лицензиялар жана сертификаттар
// ---------------------------------------------------------------------------
const CredentialsEditor: React.FC = () => {
  const { draft, setDraft, save, reset, dirty, saving, status } = useDraft('credentials');
  const set = (i: number, patch: Partial<Credential>) => setDraft(draft.map((c, k) => (k === i ? { ...c, ...patch } : c)));
  const add = (kind: Credential['kind']) => setDraft([...draft, { id: newId(), kind, title: '', number: '', issuedBy: '', date: '' }]);
  return (
    <div className="space-y-3">
      <p className="text-[11px] text-stone-500">Ар бирине документтин сүрөтүн (скан) же PDF файлын тиркеңиз.</p>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => add('license')} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold cursor-pointer">
          <Plus className="w-3.5 h-3.5" />
          <span>Лицензия кошуу</span>
        </button>
        <button type="button" onClick={() => add('certificate')} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-stone-800 hover:bg-stone-900 text-white text-xs font-bold cursor-pointer">
          <Plus className="w-3.5 h-3.5" />
          <span>Сертификат кошуу</span>
        </button>
      </div>
      {draft.length === 0 && <p className="text-xs text-stone-400">Азырынча документ жок.</p>}
      {draft.map((c, i) => (
        <Card key={c.id}>
          <div className="flex items-start justify-between gap-2">
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">{c.kind === 'license' ? 'Лицензия' : 'Сертификат'} {i + 1}</span>
            <RowTools onUp={i > 0 ? () => setDraft(move(draft, i, -1)) : undefined} onDown={i < draft.length - 1 ? () => setDraft(move(draft, i, 1)) : undefined} onRemove={() => setDraft(draft.filter((_, k) => k !== i))} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field id={`cr-t-${c.id}`} label="Аталышы" value={c.title} onChange={v => set(i, { title: v })} placeholder="Мис. Ичүүчү суу менен камсыздоо лицензиясы" />
            <div>
              <label htmlFor={`cr-k-${c.id}`} className="block text-[11px] font-semibold text-stone-700 mb-1">Түрү</label>
              <select id={`cr-k-${c.id}`} value={c.kind} onChange={e => set(i, { kind: e.target.value as Credential['kind'] })} className={inputCls}>
                <option value="license">Лицензия</option>
                <option value="certificate">Сертификат</option>
              </select>
            </div>
            <Field id={`cr-n-${c.id}`} label="Номери" value={c.number} onChange={v => set(i, { number: v })} />
            <Field id={`cr-d-${c.id}`} label="Берилген күнү / мөөнөтү" value={c.date} onChange={v => set(i, { date: v })} />
          </div>
          <Field id={`cr-i-${c.id}`} label="Ким берген" value={c.issuedBy} onChange={v => set(i, { issuedBy: v })} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <ImagePicker id={`cr-img-${c.id}`} label="Документтин сүрөтү" folder="credentials" value={c.image} onChange={url => set(i, { image: url })} />
            <PdfPicker id={`cr-f-${c.id}`} label="PDF (милдеттүү эмес)" value={c.file || ''} onChange={url => set(i, { file: url })} />
          </div>
        </Card>
      ))}
      <SaveBar dirty={dirty} saving={saving} status={status} onSave={() => save()} onReset={reset} />
    </div>
  );
};

// ---------------------------------------------------------------------------
// 11. Аткарылган иштер (сүрөттөр)
// ---------------------------------------------------------------------------
const WorksEditor: React.FC = () => {
  const { draft, setDraft, save, reset, dirty, saving, status } = useDraft('works');
  const set = (i: number, patch: Partial<WorkItem>) => setDraft(draft.map((w, k) => (k === i ? { ...w, ...patch } : w)));
  const today = new Date().toLocaleDateString('ru-RU');
  return (
    <div className="space-y-3">
      <button type="button" onClick={() => setDraft([{ id: newId(), title: '', desc: '', date: today }, ...draft])} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold cursor-pointer">
        <Plus className="w-3.5 h-3.5" />
        <span>Аткарылган иш кошуу</span>
      </button>
      {draft.length === 0 && <p className="text-xs text-stone-400">Азырынча жок. Иштин сүрөтүн жана кыскача сүрөттөмөсүн кошуңуз.</p>}
      {draft.map((w, i) => (
        <Card key={w.id}>
          <div className="flex items-start justify-between gap-2">
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">Иш {i + 1}</span>
            <RowTools onUp={i > 0 ? () => setDraft(move(draft, i, -1)) : undefined} onDown={i < draft.length - 1 ? () => setDraft(move(draft, i, 1)) : undefined} onRemove={() => setDraft(draft.filter((_, k) => k !== i))} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_10rem] gap-3">
            <Field id={`wk-t-${w.id}`} label="Аталышы" value={w.title} onChange={v => set(i, { title: v })} placeholder="Мис. Ленин көчөсүндөгү суу түтүгү алмаштырылды" />
            <Field id={`wk-d-${w.id}`} label="Күнү" value={w.date} onChange={v => set(i, { date: v })} />
          </div>
          <Field id={`wk-s-${w.id}`} label="Кыскача" multiline rows={2} value={w.desc} onChange={v => set(i, { desc: v })} />
          <ImagePicker id={`wk-img-${w.id}`} label="Сүрөтү" folder="works" value={w.image} onChange={url => set(i, { image: url })} />
        </Card>
      ))}
      <SaveBar dirty={dirty} saving={saving} status={status} onSave={() => save()} onReset={reset} />
    </div>
  );
};

// ---------------------------------------------------------------------------
// 12. Тейлөө аймактары жана карта
// ---------------------------------------------------------------------------
const AreasEditor: React.FC = () => {
  const { draft, setDraft, save, reset, dirty, saving, status } = useDraft('areas');
  const setA = (patch: Partial<AreasBlock>) => setDraft({ ...draft, ...patch });
  const zones = draft.zones || [];
  return (
    <div className="space-y-3">
      <Card>
        <Field id="ar-intro" label="Киришүү тексти" multiline rows={2} value={draft.intro} onChange={v => setA({ intro: v })} />
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_8rem] gap-3">
          <Field
            id="ar-map"
            label="Картада көрсөтүлө турган жер"
            placeholder="Мис. Ноокат, Ош облусу  же  40.2600, 72.6200"
            value={draft.mapQuery}
            onChange={v => setA({ mapQuery: v })}
            hint="Айылдын аталышын облусу менен жазыңыз, же Google Maps'тен координатаны көчүрүп коюңуз. Бош болсо карта көрүнбөйт."
          />
          <Field id="ar-zoom" label="Масштаб (8–17)" type="number" value={draft.mapZoom} onChange={v => setA({ mapZoom: Math.min(17, Math.max(8, Number(v) || 12)) })} />
        </div>
        {draft.mapQuery.trim() && <ServiceMap query={draft.mapQuery} zoom={draft.mapZoom} className="h-56" />}
      </Card>
      <button type="button" onClick={() => setA({ zones: [...zones, { id: newId(), name: '', desc: '' }] })} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold cursor-pointer">
        <Plus className="w-3.5 h-3.5" />
        <span>Аймак кошуу</span>
      </button>
      {zones.map((z, i) => (
        <Card key={z.id}>
          <div className="flex items-start justify-between gap-2">
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">Аймак {i + 1}</span>
            <RowTools onUp={i > 0 ? () => setA({ zones: move(zones, i, -1) }) : undefined} onDown={i < zones.length - 1 ? () => setA({ zones: move(zones, i, 1) }) : undefined} onRemove={() => setA({ zones: zones.filter((_, k) => k !== i) })} />
          </div>
          <Field id={`zn-n-${z.id}`} label="Айыл / участок" value={z.name} onChange={v => setA({ zones: zones.map((x, k) => (k === i ? { ...x, name: v } : x)) })} />
          <Field id={`zn-d-${z.id}`} label="Кызматтар / көчөлөр" multiline rows={2} value={z.desc} onChange={v => setA({ zones: zones.map((x, k) => (k === i ? { ...x, desc: v } : x)) })} placeholder="Мис. Таза суу, таштанды чыгаруу. Ленин, Манас көчөлөрү" />
        </Card>
      ))}
      <SaveBar dirty={dirty} saving={saving} status={status} onSave={() => save()} onReset={reset} />
    </div>
  );
};

// ---------------------------------------------------------------------------
// 13. Көп берилүүчү суроолор
// ---------------------------------------------------------------------------
const FaqEditor: React.FC = () => {
  const { draft, setDraft, save, reset, dirty, saving, status } = useDraft('faq');
  const set = (i: number, patch: Partial<FaqItem>) => setDraft(draft.map((f, k) => (k === i ? { ...f, ...patch } : f)));
  return (
    <div className="space-y-3">
      <button type="button" onClick={() => setDraft([...draft, { id: newId(), q: '', a: '' }])} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold cursor-pointer">
        <Plus className="w-3.5 h-3.5" />
        <span>Суроо кошуу</span>
      </button>
      {draft.map((f, i) => (
        <Card key={f.id}>
          <div className="flex items-start justify-between gap-2">
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">Суроо {i + 1}</span>
            <RowTools onUp={i > 0 ? () => setDraft(move(draft, i, -1)) : undefined} onDown={i < draft.length - 1 ? () => setDraft(move(draft, i, 1)) : undefined} onRemove={() => setDraft(draft.filter((_, k) => k !== i))} />
          </div>
          <Field id={`fq-q-${f.id}`} label="Суроо" value={f.q} onChange={v => set(i, { q: v })} />
          <Field id={`fq-a-${f.id}`} label="Жооп" multiline rows={3} value={f.a} onChange={v => set(i, { a: v })} />
        </Card>
      ))}
      <SaveBar dirty={dirty} saving={saving} status={status} onSave={() => save()} onReset={reset} />
    </div>
  );
};

// ---------------------------------------------------------------------------
// 14. Кардарлардын пикирлери (текшерүү жана жарыялоо)
// ---------------------------------------------------------------------------
export const Stars: React.FC<{ value: number; className?: string }> = ({ value, className = '' }) => (
  <span className={`inline-flex text-amber-500 tracking-tight ${className}`} aria-label={`${value} / 5`}>
    {'★★★★★'.slice(0, value)}
    <span className="text-stone-300">{'★★★★★'.slice(value)}</span>
  </span>
);

const ReviewsEditor: React.FC = () => {
  const { listAllReviews, setReviewApproved, deleteReview } = useApp();
  const [list, setList] = useState<Review[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'new' | 'all'>('new');

  const load = async () => {
    setError(null);
    try {
      setList(await listAllReviews());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Жүктөлгөн жок');
      setList([]);
    }
  };
  useEffect(() => {
    load();
  }, []);

  const act = async (p: Promise<{ ok: boolean; error?: string }>) => {
    const r = await p;
    if (!r.ok) setError(r.error || 'Ката');
    await load();
  };

  const shown = (list || []).filter(r => (filter === 'new' ? !r.approved : true));
  const newCount = (list || []).filter(r => !r.approved).length;

  return (
    <div className="space-y-3">
      <p className="text-[11px] text-stone-500">
        Тургундар сайттан пикир калтырат. Сиз «Жарыялоо» баскандан кийин гана сайтта көрүнөт.
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => setFilter('new')} className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${filter === 'new' ? 'bg-emerald-700 text-white' : 'bg-white border border-stone-200 text-stone-700'}`}>
          Жаңылар ({newCount})
        </button>
        <button type="button" onClick={() => setFilter('all')} className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${filter === 'all' ? 'bg-emerald-700 text-white' : 'bg-white border border-stone-200 text-stone-700'}`}>
          Баары ({(list || []).length})
        </button>
        <button type="button" onClick={load} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-stone-200 text-stone-700 cursor-pointer">
          <RefreshCw className="w-3.5 h-3.5" /> Жаңыртуу
        </button>
      </div>
      {error && <p className="text-[11px] text-rose-600 font-semibold" role="alert">{error}</p>}
      {list === null && <p className="text-xs text-stone-400">Жүктөлүүдө…</p>}
      {list !== null && shown.length === 0 && !error && (
        <p className="text-xs text-stone-400">{filter === 'new' ? 'Жаңы пикир жок.' : 'Азырынча пикир жок.'}</p>
      )}
      {shown.map(r => (
        <Card key={r.id} className={r.approved ? '' : 'border-amber-300 bg-amber-50/40'}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs">
              <span className="font-bold text-stone-900">{r.name}</span>
              {r.village && <span className="text-stone-500"> · {r.village}</span>}
              <span className="text-stone-400"> · {new Date(r.created_at).toLocaleDateString('ru-RU')}</span>
            </div>
            <Stars value={r.rating} className="text-sm" />
          </div>
          <p className="text-xs text-stone-700 whitespace-pre-line">{r.text}</p>
          <div className="flex flex-wrap items-center gap-2">
            {r.approved ? (
              <button type="button" onClick={() => act(setReviewApproved(r.id, false))} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-[11px] font-semibold cursor-pointer">
                <EyeOff className="w-3.5 h-3.5" /> Сайттан алуу
              </button>
            ) : (
              <button type="button" onClick={() => act(setReviewApproved(r.id, true))} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-bold cursor-pointer">
                <Eye className="w-3.5 h-3.5" /> Жарыялоо
              </button>
            )}
            <RowTools onRemove={() => act(deleteReview(r.id))} />
            <span className={`ml-auto text-[10px] font-bold uppercase ${r.approved ? 'text-emerald-700' : 'text-amber-700'}`}>
              {r.approved ? 'Сайтта' : 'Текшерилбеген'}
            </span>
          </div>
        </Card>
      ))}
    </div>
  );
};

// Карта (Google Maps — ачкычсыз embed)
export const mapEmbedUrl = (query: string, zoom = 12) =>
  `https://maps.google.com/maps?q=${encodeURIComponent(query.trim())}&z=${zoom}&output=embed`;

export const ServiceMap: React.FC<{ query: string; zoom?: number; className?: string }> = ({ query, zoom = 12, className = '' }) => (
  <iframe
    title="Тейлөө аймагынын картасы"
    src={mapEmbedUrl(query, zoom)}
    className={`w-full rounded-xl border border-stone-200 bg-stone-100 ${className}`}
    loading="lazy"
    referrerPolicy="no-referrer-when-downgrade"
  />
);

// ---------------------------------------------------------------------------
// Негизги компонент
// ---------------------------------------------------------------------------
export type ContentTab =
  | 'news'
  | 'documents'
  | 'budget'
  | 'pasture'
  | 'waste'
  | 'machinery'
  | 'home'
  | 'about'
  | 'team'
  | 'credentials'
  | 'works'
  | 'areas'
  | 'faq'
  | 'reviews';

const TABS: { id: ContentTab; label: string; icon: React.FC<{ className?: string }> }[] = [
  { id: 'news', label: 'Жаңылыктар', icon: Calendar },
  { id: 'documents', label: 'Документтер', icon: FileText },
  { id: 'budget', label: 'Бюджет', icon: BarChart3 },
  { id: 'pasture', label: 'Жайыт отчету', icon: Mountain },
  { id: 'waste', label: 'Таштанды графиги', icon: Trash2 },
  { id: 'machinery', label: 'Техника', icon: Truck },
  { id: 'home', label: 'Башкы бет / Сүрөттөр', icon: Sparkles },
  { id: 'about', label: 'Компания жана байланыш', icon: Info },
  { id: 'team', label: 'Команда', icon: Users },
  { id: 'credentials', label: 'Лицензия / Сертификат', icon: Award },
  { id: 'works', label: 'Аткарылган иштер', icon: ImageIcon },
  { id: 'reviews', label: 'Пикирлер', icon: Star },
  { id: 'areas', label: 'Аймактар / Карта', icon: MapPin },
  { id: 'faq', label: 'Суроо-жооп', icon: CircleHelp }
];

export const ContentManager: React.FC = () => {
  const [tab, setTab] = useState<ContentTab>('news');

  return (
    <div className="space-y-5 max-w-5xl">
      <div>
        <h2 className="text-xl font-extrabold text-stone-900">Сайттын мазмуну</h2>
        <p className="text-xs text-stone-500 mt-0.5 flex items-center gap-1">
          Жаңылыктарды, документтерди, отчетторду, графикти, техниканы жана сүрөттөрдү өзгөртүңүз
          <ArrowRight className="w-3 h-3" /> «Сактоо» баскан соң сайтта дароо көрүнөт.
        </p>
      </div>
      <div className="flex flex-wrap gap-1.5 p-1 bg-stone-200/80 rounded-xl text-xs font-medium" role="tablist">
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all cursor-pointer ${
                tab === t.id ? 'bg-white text-emerald-900 font-bold shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>
      {tab === 'news' && <NewsEditor />}
      {tab === 'documents' && <DocumentsEditor />}
      {tab === 'budget' && <BudgetEditor />}
      {tab === 'pasture' && <PastureReportEditor />}
      {tab === 'waste' && <WasteEditor />}
      {tab === 'machinery' && <MachineryEditor />}
      {tab === 'home' && <HomeEditor />}
      {tab === 'about' && <AboutEditor />}
      {tab === 'team' && <TeamEditor />}
      {tab === 'credentials' && <CredentialsEditor />}
      {tab === 'works' && <WorksEditor />}
      {tab === 'reviews' && <ReviewsEditor />}
      {tab === 'areas' && <AreasEditor />}
      {tab === 'faq' && <FaqEditor />}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Сайттын бетинен түз ачылуучу терезе (админ «Өзгөртүү» баскычын басканда)
// ---------------------------------------------------------------------------
const EDITORS: Record<ContentTab, React.FC> = {
  news: NewsEditor,
  documents: DocumentsEditor,
  budget: BudgetEditor,
  pasture: PastureReportEditor,
  waste: WasteEditor,
  machinery: MachineryEditor,
  home: HomeEditor,
  about: AboutEditor,
  team: TeamEditor,
  credentials: CredentialsEditor,
  works: WorksEditor,
  areas: AreasEditor,
  faq: FaqEditor,
  reviews: ReviewsEditor
};

export const ContentEditorModal: React.FC<{ tab: ContentTab; title?: string; onClose: () => void }> = ({ tab, title, onClose }) => {
  const Editor = EDITORS[tab];
  const label = title || TABS.find(t => t.id === tab)?.label || '';
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);
  return createPortal(
    <div
      className="fixed inset-0 z-[65] flex items-start sm:items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm text-left font-sans"
      onClick={e => e.stopPropagation()}
      onSubmit={e => e.stopPropagation()}
      onKeyDown={e => e.stopPropagation()}
      role="dialog"
      aria-modal="true"
      aria-label={label}
    >
      <div className="bg-stone-100 rounded-2xl w-full max-w-4xl max-h-[95vh] flex flex-col shadow-2xl border border-stone-200 text-stone-900">
        <div className="flex items-center justify-between gap-3 px-4 py-3 bg-white border-b border-stone-200 rounded-t-2xl">
          <h3 className="text-sm font-bold">Өзгөртүү: {label}</h3>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-xs font-semibold cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            <span>Жабуу</span>
          </button>
        </div>
        <div className="p-3 sm:p-4 overflow-y-auto">
          <Editor />
        </div>
      </div>
    </div>,
    document.body
  );
};
