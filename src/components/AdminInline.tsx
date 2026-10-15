import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../context/AppContext';
import { ContentEditorModal, ContentTab, MachineForm, EMPTY_MACHINE } from './ContentManager';
import { MachineryItem } from '../data/mockData';
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
