import React, { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../context/AppContext';
import { T, SectionEditButton, useInlineEdit } from './AdminInline';
import { ServiceMap, Stars, ContentTab } from './ContentManager';
import { intlPhone } from './FloatingContact';
import { Phone, Info, Users, Award, MapPin, CircleHelp, Star, FileText, X, CheckCircle2, AlertCircle, Send, Camera } from 'lucide-react';

// ---------------------------------------------------------------------------
// «Биз жөнүндө» бети: компания, команда, лицензиялар, аткарылган иштер,
// пикирлер, тейлөө аймактары (карта), көп берилүүчү суроолор
// ---------------------------------------------------------------------------

const SUBNAV: { id: string; label: string }[] = [
  { id: 'about-company', label: 'Компания' },
  { id: 'about-team', label: 'Команда' },
  { id: 'about-credentials', label: 'Лицензиялар' },
  { id: 'about-works', label: 'Аткарылган иштер' },
  { id: 'about-reviews', label: 'Пикирлер' },
  { id: 'about-areas', label: 'Тейлөө аймагы' },
  { id: 'about-faq', label: 'Суроо-жооп' }
];

const Lightbox: React.FC<{ src: string; title?: string; onClose: () => void }> = ({ src, title, onClose }) =>
  createPortal(
    <div
      className="fixed inset-0 z-[90] bg-black/85 flex flex-col items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title || 'Сүрөт'}
    >
      <button type="button" onClick={onClose} aria-label="Жабуу" className="absolute top-3 right-3 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white cursor-pointer">
        <X className="w-5 h-5" />
      </button>
      <img src={src} alt={title || ''} className="max-w-full max-h-[85vh] object-contain rounded-lg" onClick={e => e.stopPropagation()} />
      {title && <p className="mt-3 text-sm text-white/90 text-center max-w-2xl">{title}</p>}
    </div>,
    document.body
  );

const Block: React.FC<{
  id: string;
  icon: React.FC<{ className?: string }>;
  title: React.ReactNode;
  tab: ContentTab;
  editLabel: string;
  empty: boolean;
  emptyText: string;
  children: React.ReactNode;
}> = ({ id, icon: Icon, title, tab, editLabel, empty, emptyText, children }) => {
  const editing = useInlineEdit();
  return (
    <section id={id} className="scroll-mt-24 py-10 border-t border-stone-200 first:border-t-0">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <h3 className="text-xl sm:text-2xl font-extrabold text-stone-900 flex items-center gap-2">
          <Icon className="w-5 h-5 text-emerald-700" />
          <span>{title}</span>
        </h3>
        <SectionEditButton tab={tab} label={editLabel} />
      </div>
      {empty ? (
        editing ? (
          <p className="p-4 rounded-xl border border-dashed border-amber-300 bg-amber-50 text-xs text-amber-900">{emptyText}</p>
        ) : (
          <p className="p-4 rounded-xl border border-dashed border-stone-300 bg-white text-sm text-stone-500">
            <T>Маалымат жакында кошулат.</T>
          </p>
        )
      ) : (
        children
      )}
    </section>
  );
};

const ReviewForm: React.FC = () => {
  const { submitReview } = useApp();
  const [name, setName] = useState('');
  const [village, setVillage] = useState('');
  const [rating, setRating] = useState(5);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) return setResult({ ok: false, text: 'Атыңызды жазыңыз.' });
    if (text.trim().length < 10) return setResult({ ok: false, text: 'Пикириңизди кеңирээк жазыңыз (10 белгиден көп).' });
    setBusy(true);
    const r = await submitReview({ name: name.trim(), village: village.trim(), rating, text: text.trim() });
    setBusy(false);
    if (r.ok) {
      setResult({ ok: true, text: 'Рахмат! Пикириңиз кабыл алынды. Ишкана текшергенден кийин сайтта жарыяланат.' });
      setName('');
      setVillage('');
      setText('');
      setRating(5);
    } else setResult({ ok: false, text: r.error || 'Жөнөтүлгөн жок.' });
  };

  const inputCls = 'w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-none';
  return (
    <form onSubmit={submit} className="p-5 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-3" aria-label="Пикир калтыруу">
      <h4 className="text-sm font-bold text-stone-900"><T>Пикир калтыруу</T></h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="rv-name" className="block text-xs font-semibold text-stone-700 mb-1"><T>Атыңыз</T> *</label>
          <input id="rv-name" value={name} onChange={e => setName(e.target.value)} maxLength={60} className={inputCls} autoComplete="given-name" />
        </div>
        <div>
          <label htmlFor="rv-village" className="block text-xs font-semibold text-stone-700 mb-1"><T>Айылыңыз</T></label>
          <input id="rv-village" value={village} onChange={e => setVillage(e.target.value)} maxLength={60} className={inputCls} />
        </div>
      </div>
      <div>
        <span className="block text-xs font-semibold text-stone-700 mb-1"><T>Баа</T></span>
        <div className="flex gap-1" role="radiogroup" aria-label="Баа">
          {[1, 2, 3, 4, 5].map(n => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={rating === n}
              aria-label={`${n} жылдыз`}
              onClick={() => setRating(n)}
              className={`text-2xl leading-none cursor-pointer ${n <= rating ? 'text-amber-500' : 'text-stone-300'}`}
            >
              ★
            </button>
          ))}
        </div>
      </div>
      <div>
        <label htmlFor="rv-text" className="block text-xs font-semibold text-stone-700 mb-1"><T>Пикириңиз</T> *</label>
        <textarea id="rv-text" rows={4} value={text} onChange={e => setText(e.target.value)} maxLength={1000} className={`${inputCls} resize-y`} />
      </div>
      {result && (
        <p className={`text-xs font-semibold flex items-start gap-1.5 ${result.ok ? 'text-emerald-700' : 'text-rose-600'}`} role="status">
          {result.ok ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          <span>{result.text}</span>
        </p>
      )}
      <button
        type="submit"
        disabled={busy}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-bold cursor-pointer disabled:opacity-60"
      >
        <Send className="w-4 h-4" />
        <span>{busy ? 'Жөнөтүлүүдө…' : 'Жөнөтүү'}</span>
      </button>
      <p className="text-[11px] text-stone-400"><T>Пикирлер ишкана текшергенден кийин жарыяланат.</T></p>
    </form>
  );
};

export const AboutSection: React.FC = () => {
  const { content, reviews, siteSettings } = useApp();
  const { about, team, credentials, works, areas, faq } = content;
  const [zoom, setZoom] = useState<{ src: string; title?: string } | null>(null);
  const avg = useMemo(() => (reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0), [reviews]);
  const paragraphs = about.text.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
  const licenses = credentials.filter(c => c.kind === 'license');
  const certificates = credentials.filter(c => c.kind === 'certificate');

  const go = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const CredGrid: React.FC<{ items: typeof credentials }> = ({ items }) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map(c => (
        <div key={c.id} className="rounded-2xl border border-stone-200 bg-white overflow-hidden flex flex-col">
          {c.image ? (
            <button type="button" onClick={() => setZoom({ src: c.image!, title: c.title })} className="block h-48 bg-stone-100 cursor-zoom-in" aria-label={`${c.title} — чоңойтуп көрүү`}>
              <img src={c.image} alt={c.title} loading="lazy" className="w-full h-full object-contain" />
            </button>
          ) : (
            <div className="h-24 bg-emerald-50 flex items-center justify-center text-emerald-700">
              <Award className="w-8 h-8" />
            </div>
          )}
          <div className="p-4 space-y-1 text-xs flex-1">
            <div className="font-bold text-sm text-stone-900 leading-snug">{c.title}</div>
            {c.number && <div className="text-stone-600">№ <span className="font-mono">{c.number}</span></div>}
            {c.issuedBy && <div className="text-stone-500">{c.issuedBy}</div>}
            {c.date && <div className="text-stone-500">{c.date}</div>}
            {c.file && (
              <a href={c.file} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 pt-1 font-semibold text-emerald-700 hover:underline">
                <FileText className="w-3.5 h-3.5" /> PDF ачуу
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <section id="about" className="py-14 bg-stone-50 border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Ички меню */}
        <nav className="flex gap-2 overflow-x-auto pb-2 mb-4 -mx-1 px-1" aria-label="Бөлүмдөр">
          {SUBNAV.map(s => (
            <button
              key={s.id}
              type="button"
              onClick={() => go(s.id)}
              className="shrink-0 px-3 py-1.5 rounded-full bg-white border border-stone-200 text-xs font-semibold text-stone-700 hover:border-emerald-500 hover:text-emerald-800 cursor-pointer"
            >
              {s.label}
            </button>
          ))}
        </nav>

        {/* 1. Компания */}
        <section id="about-company" className="scroll-mt-24 pb-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 uppercase tracking-wider">
                <Info className="w-4 h-4" />
                <span><T>Биз жөнүндө</T></span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 mt-1" style={{ textWrap: 'balance' }}>{about.title}</h2>
              <SectionEditButton tab="about" label="Компания жөнүндө маалыматты өзгөртүү" className="mt-3" />
              <div className="mt-4 space-y-3 text-sm text-stone-700 leading-relaxed">
                {paragraphs.map((p, i) => (
                  <p key={i} className="whitespace-pre-line">{p}</p>
                ))}
              </div>
              {about.facts.length > 0 && (
                <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {about.facts.map(f => (
                    <div key={f.id} className="p-3 rounded-xl bg-white border border-stone-200">
                      <div className="text-xl font-extrabold text-emerald-800 font-mono">{f.value}</div>
                      <div className="text-[11px] text-stone-500 mt-0.5">{f.label}</div>
                    </div>
                  ))}
                </div>
              )}
              {siteSettings.dispatcherPhone && (
                <a
                  href={`tel:+${intlPhone(siteSettings.dispatcherPhone)}`}
                  className="mt-6 inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-bold"
                >
                  <Phone className="w-4 h-4" />
                  <span>{siteSettings.dispatcherPhone}</span>
                </a>
              )}
            </div>
            {about.image ? (
              <img src={about.image} alt={about.title} className="w-full h-72 lg:h-96 object-cover rounded-3xl border border-stone-200 shadow-sm" />
            ) : (
              <div className="hidden lg:flex h-96 rounded-3xl bg-gradient-to-br from-emerald-800 to-emerald-950 text-emerald-100 flex-col items-center justify-center gap-3 p-8 text-center">
                <span className="text-6xl font-extrabold">Т</span>
                <span className="text-sm font-semibold">{siteSettings.enterpriseName} {siteSettings.enterpriseSubName}</span>
              </div>
            )}
          </div>
        </section>

        {/* 2. Команда */}
        <Block id="about-team" icon={Users} title={<T>Биздин команда</T>} tab="team" editLabel="Команданы өзгөртүү" empty={team.length === 0} emptyText="Кызматкерлердин сүрөттөрү азырынча кошула элек Жогорудагы сары баскыч менен кошуңуз.">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {team.map(m => (
              <div key={m.id} className="rounded-2xl bg-white border border-stone-200 overflow-hidden text-center">
                {m.photo ? (
                  <button type="button" onClick={() => setZoom({ src: m.photo!, title: `${m.name} — ${m.role}` })} className="block w-full aspect-square bg-stone-100 cursor-zoom-in">
                    <img src={m.photo} alt={m.name} loading="lazy" className="w-full h-full object-cover" />
                  </button>
                ) : (
                  <div className="w-full aspect-square bg-stone-100 flex items-center justify-center text-stone-300">
                    <Users className="w-10 h-10" />
                  </div>
                )}
                <div className="p-3">
                  <div className="text-sm font-bold text-stone-900 leading-snug">{m.name}</div>
                  <div className="text-xs text-stone-500 mt-0.5">{m.role}</div>
                </div>
              </div>
            ))}
          </div>
        </Block>

        {/* 3. Лицензиялар жана сертификаттар */}
        <Block
          id="about-credentials"
          icon={Award}
          title={<T>Лицензиялар жана сертификаттар</T>}
          tab="credentials"
          editLabel="Лицензия / сертификат кошуу"
          empty={credentials.length === 0}
          emptyText="Лицензиялар жана сертификаттар азырынча кошула элек Жогорудагы сары баскыч менен кошуңуз."
        >
          <div className="space-y-6">
            {licenses.length > 0 && (
              <div>
                <h4 className="text-sm font-bold text-stone-700 mb-3"><T>Лицензиялар</T></h4>
                <CredGrid items={licenses} />
              </div>
            )}
            {certificates.length > 0 && (
              <div>
                <h4 className="text-sm font-bold text-stone-700 mb-3"><T>Сертификаттар</T></h4>
                <CredGrid items={certificates} />
              </div>
            )}
          </div>
        </Block>

        {/* 4. Аткарылган иштер */}
        <Block id="about-works" icon={Camera} title={<T>Аткарылган иштер</T>} tab="works" editLabel="Иштин сүрөтүн кошуу" empty={works.length === 0} emptyText="Аткарылган иштердин сүрөттөрү азырынча кошула элек Жогорудагы сары баскыч менен кошуңуз.">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {works.map(w => (
              <figure key={w.id} className="rounded-2xl bg-white border border-stone-200 overflow-hidden">
                {w.image ? (
                  <button type="button" onClick={() => setZoom({ src: w.image!, title: w.title })} className="block w-full h-52 bg-stone-100 cursor-zoom-in">
                    <img src={w.image} alt={w.title} loading="lazy" className="w-full h-full object-cover" />
                  </button>
                ) : null}
                <figcaption className="p-4 space-y-1">
                  {w.date && <span className="block text-[10px] font-mono text-emerald-700 font-semibold">{w.date}</span>}
                  <span className="block text-sm font-bold text-stone-900 leading-snug">{w.title}</span>
                  {w.desc && <span className="block text-xs text-stone-500 leading-relaxed whitespace-pre-line">{w.desc}</span>}
                </figcaption>
              </figure>
            ))}
          </div>
        </Block>

        {/* 5. Пикирлер */}
        <section id="about-reviews" className="scroll-mt-24 py-10 border-t border-stone-200">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            <h3 className="text-xl sm:text-2xl font-extrabold text-stone-900 flex items-center gap-2">
              <Star className="w-5 h-5 text-emerald-700" />
              <span><T>Кардарлардын пикирлери</T></span>
            </h3>
            <SectionEditButton tab="reviews" label="Пикирлерди текшерүү / жарыялоо" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
            <div className="lg:col-span-3 space-y-3">
              {reviews.length > 0 ? (
                <>
                  <div className="flex items-center gap-3 text-sm text-stone-700">
                    <span className="text-3xl font-extrabold text-stone-900">{avg.toFixed(1)}</span>
                    <Stars value={Math.round(avg)} className="text-xl" />
                    <span className="text-xs text-stone-500">({reviews.length})</span>
                  </div>
                  {reviews.map(r => (
                    <div key={r.id} className="p-4 rounded-2xl bg-white border border-stone-200">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="text-sm">
                          <span className="font-bold text-stone-900">{r.name}</span>
                          {r.village && <span className="text-stone-500"> · {r.village}</span>}
                        </div>
                        <Stars value={r.rating} />
                      </div>
                      <p className="mt-2 text-sm text-stone-700 leading-relaxed whitespace-pre-line">{r.text}</p>
                      <span className="block mt-2 text-[11px] text-stone-400">{new Date(r.created_at).toLocaleDateString('ru-RU')}</span>
                    </div>
                  ))}
                </>
              ) : (
                <p className="p-4 rounded-xl bg-white border border-stone-200 text-sm text-stone-500">
                  <T>Азырынча жарыяланган пикир жок. Биринчи болуп пикир калтырыңыз!</T>
                </p>
              )}
            </div>
            <div className="lg:col-span-2">
              <ReviewForm />
            </div>
          </div>
        </section>

        {/* 6. Тейлөө аймактары */}
        <Block
          id="about-areas"
          icon={MapPin}
          title={<T>Тейлөө аймактары</T>}
          tab="areas"
          editLabel="Аймактарды / картаны өзгөртүү"
          empty={areas.zones.length === 0 && !areas.mapQuery.trim()}
          emptyText="Тейлөө аймактары жана карта азырынча кошула элек Жогорудагы сары баскыч менен кошуңуз."
        >
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
            <div className="lg:col-span-2 space-y-3">
              {areas.intro && <p className="text-sm text-stone-600">{areas.intro}</p>}
              {areas.zones.map(z => (
                <div key={z.id} className="p-4 rounded-xl bg-white border border-stone-200 flex gap-3">
                  <MapPin className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm font-bold text-stone-900">{z.name}</div>
                    {z.desc && <div className="text-xs text-stone-500 mt-0.5 whitespace-pre-line">{z.desc}</div>}
                  </div>
                </div>
              ))}
            </div>
            {areas.mapQuery.trim() && (
              <div className="lg:col-span-3">
                <ServiceMap query={areas.mapQuery} zoom={areas.mapZoom} className="h-80 lg:h-[26rem]" />
              </div>
            )}
          </div>
        </Block>

        {/* 7. FAQ */}
        <Block id="about-faq" icon={CircleHelp} title={<T>Көп берилүүчү суроолор</T>} tab="faq" editLabel="Суроо-жоопту өзгөртүү" empty={faq.length === 0} emptyText="Суроо-жооптор азырынча жок.">
          <div className="space-y-2 max-w-4xl">
            {faq.map(f => (
              <details key={f.id} className="group rounded-xl bg-white border border-stone-200 open:border-emerald-300">
                <summary className="flex items-center justify-between gap-3 p-4 cursor-pointer list-none text-sm font-semibold text-stone-900">
                  <span>{f.q}</span>
                  <span className="text-emerald-700 text-lg leading-none transition-transform group-open:rotate-45" aria-hidden>
                    +
                  </span>
                </summary>
                <p className="px-4 pb-4 text-sm text-stone-600 leading-relaxed whitespace-pre-line">{f.a}</p>
              </details>
            ))}
          </div>
        </Block>
      </div>
      {zoom && <Lightbox src={zoom.src} title={zoom.title} onClose={() => setZoom(null)} />}
    </section>
  );
};
