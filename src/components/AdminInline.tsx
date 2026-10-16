import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../context/AppContext';
import { ContentEditorModal, ContentTab, MachineForm, EMPTY_MACHINE } from './ContentManager';
import { MachineryItem, PastureZone } from '../data/mockData';
import { Edit3, Plus, Trash2, X, Check, RotateCcw, Camera } from 'lucide-react';
import { uploadImage } from '../utils/media';

/** Админ кирип, «Түзөтүү режими» күйүк турганда гана true */
export const useInlineEdit = () => {
  const { isAdminLoggedIn, isEditModeActive } = useApp();
  return isAdminLoggedIn && isEditModeActive;
};

// Портал аркылуу ачылган терезедеги чыкылдатуулар/формалар сайттын
// астындагы баскычтарга жана формаларга өтүп кетпеши үчүн.
const stop = {
  onClick: (e: React.SyntheticEvent) => e.stopPropagation(),
  onSubmit: (e: React.SyntheticEvent) => e.stopPropagation(),
  onKeyDown: (e: React.SyntheticEvent) => e.stopPropagation(),
  onMouseDown: (e: React.SyntheticEvent) => e.stopPropagation()
};

// ---------------------------------------------------------------------------
// <T> — сайттагы каалаган текст. Админ түзөтүү режиминде жанындагы
// ✎ белгисин басып өзгөртөт; өзгөртүү базада (content_blocks.texts) сакталат.
// ---------------------------------------------------------------------------
export const T: React.FC<{ children: string; k?: string }> = ({ children, k }) => {
  const { content } = useApp();
  const editing = useInlineEdit();
  const [open, setOpen] = useState(false);
  const key = (k ?? String(children)).replace(/\s+/g, ' ').trim();
  const override = content.texts?.[key];
  const text = override ?? children;

  if (!editing) return <>{text}</>;

  return (
    <>
      {text}
      <span
        role="button"
        tabIndex={0}
        title="Бул текстти өзгөртүү"
        aria-label="Бул текстти өзгөртүү"
        onClick={e => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(true);
        }}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            e.stopPropagation();
            setOpen(true);
          }
        }}
        className="inline-flex align-middle items-center justify-center ml-1 w-5 h-5 sm:w-4 sm:h-4 rounded-full bg-amber-400 hover:bg-amber-500 text-stone-950 cursor-pointer shadow-xs select-none shrink-0"
        data-inline-edit="text"
      >
        <Edit3 className="w-2.5 h-2.5" />
      </span>
      {open && <TextEditDialog textKey={key} original={children} current={text} onClose={() => setOpen(false)} />}
    </>
  );
};

const TextEditDialog: React.FC<{ textKey: string; original: string; current: string; onClose: () => void }> = ({
  textKey,
  original,
  current,
  onClose
}) => {
  const { content, updateContent } = useApp();
  const [value, setValue] = useState(current);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const write = async (next: string | null) => {
    setSaving(true);
    setError(null);
    const texts = { ...(content.texts || {}) };
    if (next === null || next.trim() === '' || next === original) delete texts[textKey];
    else texts[textKey] = next;
    const r = await updateContent('texts', texts);
    setSaving(false);
    if (r.ok) onClose();
    else setError(r.error || 'Сакталган жок');
  };

  return createPortal(
    <div
      {...stop}
      className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs text-left font-sans normal-case tracking-normal"
    >
      <form
        onSubmit={e => {
          e.preventDefault();
          write(value);
        }}
        className="bg-white rounded-2xl p-5 max-w-lg w-full border border-stone-300 shadow-2xl text-stone-900 space-y-3 text-xs"
      >
        <div className="flex items-center justify-between border-b border-stone-100 pb-2">
          <span className="font-bold text-emerald-800 text-sm">Текстти өзгөртүү</span>
          <button type="button" onClick={onClose} aria-label="Жабуу" className="p-1 text-stone-400 hover:text-stone-700 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
        <textarea
          id="inline-text-value"
          autoFocus
          rows={Math.min(8, Math.max(2, Math.ceil(value.length / 60)))}
          value={value}
          onChange={e => setValue(e.target.value)}
          className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg text-sm text-stone-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
        />
        {current !== original && (
          <p className="text-[11px] text-stone-500">
            Баштапкы текст: <span className="italic">{original}</span>
          </p>
        )}
        {error && (
          <p className="text-[11px] text-rose-600 font-semibold" role="alert">
            {error}
          </p>
        )}
        <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
          {current !== original && (
            <button
              type="button"
              disabled={saving}
              onClick={() => write(null)}
              className="mr-auto inline-flex items-center gap-1 px-3 py-2 rounded-lg text-stone-600 hover:bg-stone-100 font-semibold cursor-pointer disabled:opacity-50"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Баштапкысына кайтаруу</span>
            </button>
          )}
          <button type="button" onClick={onClose} className="px-3 py-2 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold cursor-pointer">
            Жокко чыгаруу
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold cursor-pointer disabled:opacity-50"
          >
            <Check className="w-3.5 h-3.5" />
            <span>{saving ? 'Сакталууда…' : 'Сактоо'}</span>
          </button>
        </div>
      </form>
    </div>,
    document.body
  );
};

// ---------------------------------------------------------------------------
// Бөлүмдүн үстүндөгү «Өзгөртүү» баскычы — ошол бөлүмдүн редакторун ачат
// ---------------------------------------------------------------------------
export const SectionEditButton: React.FC<{ tab: ContentTab; label: string; title?: string; className?: string }> = ({
  tab,
  label,
  title,
  className = ''
}) => {
  const editing = useInlineEdit();
  const [open, setOpen] = useState(false);
  if (!editing) return null;
  return (
    <>
      <button
        type="button"
        onClick={e => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(true);
        }}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-500 text-stone-950 text-xs font-bold shadow-md cursor-pointer font-sans normal-case tracking-normal ${className}`}
        data-inline-edit="section"
      >
        <Edit3 className="w-3.5 h-3.5" />
        <span>{label}</span>
      </button>
      {open && <ContentEditorModal tab={tab} title={title} onClose={() => setOpen(false)} />}
    </>
  );
};

// ---------------------------------------------------------------------------
// Техника карточкасындагы админ баскычтары жана «Жаңы техника кошуу»
// ---------------------------------------------------------------------------
export const MachineAdminTools: React.FC<{ machine: MachineryItem }> = ({ machine }) => {
  const { deleteMachineryItem } = useApp();
  const editing = useInlineEdit();
  const [form, setForm] = useState(false);
  const [confirm, setConfirm] = useState(false);
  if (!editing) return null;
  return (
    <div
      className="flex flex-wrap items-center gap-2 p-2 rounded-lg bg-amber-50 border border-amber-300 text-xs font-sans"
      onClick={e => e.stopPropagation()}
    >
      <button
        type="button"
        onClick={() => setForm(true)}
        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-amber-400 hover:bg-amber-500 text-stone-950 font-bold cursor-pointer"
      >
        <Edit3 className="w-3.5 h-3.5" />
        <span>Өзгөртүү (сүрөт, баа, текст)</span>
      </button>
      {!confirm ? (
        <button
          type="button"
          onClick={() => setConfirm(true)}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-white border border-rose-200 text-rose-700 hover:bg-rose-50 font-semibold cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Өчүрүү</span>
        </button>
      ) : (
        <span className="inline-flex items-center gap-1.5">
          <span className="font-semibold text-rose-700">Өчүрөсүзбү?</span>
          <button
            type="button"
            onClick={() => deleteMachineryItem(machine.id)}
            className="px-2.5 py-1 rounded-md bg-rose-600 hover:bg-rose-700 text-white font-bold cursor-pointer"
          >
            Ооба
          </button>
          <button type="button" onClick={() => setConfirm(false)} className="px-2.5 py-1 rounded-md bg-stone-200 hover:bg-stone-300 font-semibold cursor-pointer">
            Жок
          </button>
        </span>
      )}
      {form && <MachineForm initial={machine} isNew={false} onClose={() => setForm(false)} />}
    </div>
  );
};

export const AddMachineButton: React.FC = () => {
  const editing = useInlineEdit();
  const [form, setForm] = useState(false);
  if (!editing) return null;
  return (
    <>
      <button
        type="button"
        onClick={() => setForm(true)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-500 text-stone-950 text-xs font-bold shadow-md cursor-pointer"
        data-inline-edit="section"
      >
        <Plus className="w-3.5 h-3.5" />
        <span>Жаңы техника кошуу</span>
      </button>
      {form && <MachineForm initial={EMPTY_MACHINE()} isNew onClose={() => setForm(false)} />}
    </>
  );
};

// ---------------------------------------------------------------------------
// Техниканын сүрөтүн карточканын өзүнөн бир басуу менен алмаштыруу
// ---------------------------------------------------------------------------
export const MachinePhotoButton: React.FC<{ machine: MachineryItem }> = ({ machine }) => {
  const { updateMachineryItem } = useApp();
  const editing = useInlineEdit();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!editing) return null;
  const inputId = `mphoto-${machine.id}`;
  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const url = await uploadImage(file, 'machinery');
      updateMachineryItem({ ...machine, image: url });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Сүрөт жүктөлгөн жок');
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="absolute bottom-3 left-3 right-3 z-10 flex flex-col items-start gap-1" onClick={e => e.stopPropagation()}>
      <label
        htmlFor={inputId}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-500 text-stone-950 text-xs font-bold shadow-md cursor-pointer ${busy ? 'opacity-70 pointer-events-none' : ''}`}
        data-inline-edit="section"
      >
        <Camera className="w-3.5 h-3.5" />
        <span>{busy ? 'Жүктөлүүдө…' : machine.image ? 'Сүрөттү алмаштыруу' : 'Сүрөт кошуу'}</span>
      </label>
      <input id={inputId} type="file" accept="image/*" className="sr-only" onChange={onFile} disabled={busy} />
      {error && <span className="px-2 py-1 rounded bg-rose-600 text-white text-[11px] font-semibold">{error}</span>}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Кичинекей форма-терезе (бир нече талаа) — сандар, жайлоолор ж.б. үчүн
// ---------------------------------------------------------------------------
type FieldDef = { key: string; label: string; type?: 'text' | 'number' | 'select'; options?: string[]; hint?: string };

const FieldsDialog: React.FC<{
  title: string;
  fields: FieldDef[];
  initial: Record<string, string | number>;
  onSave: (v: Record<string, string>) => Promise<string | null> | string | null;
  onClose: () => void;
}> = ({ title, fields, initial, onSave, onClose }) => {
  const [v, setV] = useState<Record<string, string>>(() =>
    Object.fromEntries(fields.map(f => [f.key, String(initial[f.key] ?? '')]))
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputCls =
    'w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-sm text-stone-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none';
  return createPortal(
    <div {...stop} className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/60 text-left font-sans normal-case tracking-normal">
      <form
        onSubmit={async e => {
          e.preventDefault();
          setBusy(true);
          setError(null);
          const err = await onSave(v);
          setBusy(false);
          if (err) setError(err);
          else onClose();
        }}
        className="bg-white rounded-2xl p-5 max-w-md w-full max-h-[90vh] overflow-y-auto border border-stone-300 shadow-2xl text-stone-900 space-y-3 text-xs"
      >
        <div className="flex items-center justify-between border-b border-stone-100 pb-2">
          <span className="font-bold text-emerald-800 text-sm">{title}</span>
          <button type="button" onClick={onClose} aria-label="Жабуу" className="p-1 text-stone-400 hover:text-stone-700 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
        {fields.map((f, i) => (
          <div key={f.key}>
            <label htmlFor={`fd-${f.key}`} className="block font-semibold text-stone-700 mb-1">
              {f.label}
            </label>
            {f.type === 'select' ? (
              <select id={`fd-${f.key}`} value={v[f.key]} onChange={e => setV({ ...v, [f.key]: e.target.value })} className={inputCls}>
                {f.options!.map(o => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            ) : (
              <input
                id={`fd-${f.key}`}
                autoFocus={i === 0}
                type={f.type === 'number' ? 'number' : 'text'}
                value={v[f.key]}
                onChange={e => setV({ ...v, [f.key]: e.target.value })}
                className={inputCls}
              />
            )}
            {f.hint && <p className="text-[10px] text-stone-400 mt-0.5">{f.hint}</p>}
          </div>
        ))}
        {error && (
          <p className="text-[11px] text-rose-600 font-semibold" role="alert">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="px-3 py-2 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold cursor-pointer">
            Жокко чыгаруу
          </button>
          <button type="submit" disabled={busy} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold cursor-pointer disabled:opacity-50">
            <Check className="w-3.5 h-3.5" />
            <span>{busy ? 'Сакталууда…' : 'Сактоо'}</span>
          </button>
        </div>
      </form>
    </div>,
    document.body
  );
};

const Pencil: React.FC<{ label: string; onClick: () => void; className?: string }> = ({ label, onClick, className = '' }) => (
  <button
    type="button"
    title={label}
    aria-label={label}
    onClick={e => {
      e.preventDefault();
      e.stopPropagation();
      onClick();
    }}
    className={`inline-flex items-center gap-1 px-2 py-1 rounded-md bg-amber-400 hover:bg-amber-500 text-stone-950 text-[11px] font-bold shadow-xs cursor-pointer ${className}`}
    data-inline-edit="text"
  >
    <Edit3 className="w-3 h-3" />
    <span>Өзгөртүү</span>
  </button>
);

// Башкы беттеги сандардын ар бири
export const HeroStatEdit: React.FC<{ index: number }> = ({ index }) => {
  const { content, updateContent } = useApp();
  const editing = useInlineEdit();
  const [open, setOpen] = useState(false);
  if (!editing) return null;
  const stat = content.heroStats[index];
  if (!stat) return null;
  return (
    <>
      <Pencil label="Бул санды өзгөртүү" onClick={() => setOpen(true)} className="mt-1" />
      {open && (
        <FieldsDialog
          title="Санды өзгөртүү"
          fields={[
            { key: 'value', label: 'Сан', hint: 'Мисалы: 1 500+ же 24 / 7' },
            { key: 'label', label: 'Түшүндүрмө', hint: 'Мисалы: Тейленген үй чарба' }
          ]}
          initial={{ value: stat.value, label: stat.label }}
          onClose={() => setOpen(false)}
          onSave={async v => {
            const next = content.heroStats.map((s, i) => (i === index ? { ...s, value: v.value.trim(), label: v.label.trim() } : s));
            const r = await updateContent('heroStats', next);
            return r.ok ? null : r.error || 'Сакталган жок';
          }}
        />
      )}
    </>
  );
};

// Жайлоолор (жайыт участоктору)
const ZONE_FIELDS: FieldDef[] = [
  { key: 'name', label: 'Жайлоонун аталышы *' },
  { key: 'elevation', label: 'Бийиктиги', hint: 'Мисалы: 2 400 – 2 900 м' },
  { key: 'capacityHeads', label: 'Канча мал батат (баш)', type: 'number' },
  { key: 'currentGrazingHeads', label: 'Азыр жайылып жаткан мал (баш)', type: 'number' },
  { key: 'season', label: 'Мезгили', type: 'select', options: ['Жазгы', 'Жайкы', 'Күзгү'] },
  { key: 'condition', label: 'Абалы', type: 'select', options: ['Жакшы', 'Орточо', 'Калыбына келтирүүдө'] },
  { key: 'waterSources', label: 'Суу булактары' },
  { key: 'manager', label: 'Жооптуу адам' }
];
const toZone = (id: string, v: Record<string, string>): PastureZone => ({
  id,
  name: v.name.trim(),
  elevation: v.elevation.trim(),
  capacityHeads: Math.max(0, Number(v.capacityHeads) || 0),
  currentGrazingHeads: Math.max(0, Number(v.currentGrazingHeads) || 0),
  season: v.season as PastureZone['season'],
  condition: v.condition as PastureZone['condition'],
  waterSources: v.waterSources.trim(),
  manager: v.manager.trim()
});

export const PastureZoneTools: React.FC<{ zone: PastureZone }> = ({ zone }) => {
  const { updatePastureZone, deletePastureZone } = useApp();
  const editing = useInlineEdit();
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState(false);
  if (!editing) return null;
  return (
    <div className="mt-2 flex flex-wrap items-center gap-2" onClick={e => e.stopPropagation()}>
      <Pencil label="Жайлоону өзгөртүү" onClick={() => setOpen(true)} />
      {!confirm ? (
        <button type="button" onClick={() => setConfirm(true)} className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white border border-rose-200 text-rose-700 text-[11px] font-semibold cursor-pointer">
          <Trash2 className="w-3 h-3" /> Өчүрүү
        </button>
      ) : (
        <span className="inline-flex items-center gap-1.5 text-[11px]">
          <span className="font-semibold text-rose-700">Өчүрөсүзбү?</span>
          <button type="button" onClick={() => deletePastureZone(zone.id)} className="px-2 py-1 rounded-md bg-rose-600 text-white font-bold cursor-pointer">Ооба</button>
          <button type="button" onClick={() => setConfirm(false)} className="px-2 py-1 rounded-md bg-stone-200 font-semibold cursor-pointer">Жок</button>
        </span>
      )}
      {open && (
        <FieldsDialog
          title={`Жайлоо: ${zone.name}`}
          fields={ZONE_FIELDS}
          initial={zone as unknown as Record<string, string | number>}
          onClose={() => setOpen(false)}
          onSave={v => {
            if (!v.name.trim()) return 'Аталышын жазыңыз.';
            updatePastureZone(zone.id, toZone(zone.id, v));
            return null;
          }}
        />
      )}
    </div>
  );
};

export const AddPastureZoneButton: React.FC = () => {
  const { addPastureZone } = useApp();
  const editing = useInlineEdit();
  const [open, setOpen] = useState(false);
  if (!editing) return null;
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-500 text-stone-950 text-xs font-bold shadow-md cursor-pointer"
        data-inline-edit="section"
      >
        <Plus className="w-3.5 h-3.5" />
        <span>Жайлоо кошуу</span>
      </button>
      {open && (
        <FieldsDialog
          title="Жаңы жайлоо"
          fields={ZONE_FIELDS}
          initial={{ name: '', elevation: '', capacityHeads: 0, currentGrazingHeads: 0, season: 'Жайкы', condition: 'Жакшы', waterSources: '', manager: '' }}
          onClose={() => setOpen(false)}
          onSave={v => {
            if (!v.name.trim()) return 'Аталышын жазыңыз.';
            addPastureZone(toZone(`pz-${Date.now().toString(36)}`, v));
            return null;
          }}
        />
      )}
    </>
  );
};
