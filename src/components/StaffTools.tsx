import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useApp, AccrualRun, AuditEntry } from '../context/AppContext';
import { SubscriberAccount } from '../data/mockData';
import { Calculator, Droplets, History, RefreshCw } from 'lucide-react';

const money = (n: number) => `${Math.round(n).toLocaleString('ru-RU')} сом`;

// ---------- Водомер көрсөткүчүн кызматкер киргизет ----------
export const MeterEntryButton: React.FC<{ sub: SubscriberAccount; onDone: (msg: string) => void }> = ({ sub, onDone }) => {
  const { staffMeterReading, tariffs } = useApp();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reading = Number(value.replace(',', '.'));
  const consumed = value && reading >= sub.waterLastMeterReading ? reading - sub.waterLastMeterReading : null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!value || !(reading >= sub.waterLastMeterReading)) {
      setError(`Жаңы көрсөткүч мурункудан (${sub.waterLastMeterReading} м³) кичине болбошу керек.`);
      return;
    }
    setBusy(true);
    try {
      const r = await staffMeterReading(sub.id, reading);
      setOpen(false);
      setValue('');
      onDone(`№ ${sub.id}: ${r.prev} → ${r.new} м³ (${r.consumed} м³), ${money(r.amount)} эсептелди.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ката');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="px-2.5 py-1 bg-sky-50 hover:bg-sky-100 text-sky-800 font-semibold rounded-lg text-[11px] transition-colors cursor-pointer flex items-center gap-1"
      >
        <Droplets className="w-3 h-3" />
        <span>Көрсөткүч</span>
      </button>
      {open &&
        createPortal(
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60" onClick={() => !busy && setOpen(false)}>
            <form
              onSubmit={submit}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-2xl p-5 max-w-sm w-full shadow-2xl space-y-3 text-sm text-stone-800"
            >
              <h3 className="font-bold text-base text-stone-900">Водомер көрсөткүчү — № {sub.id}</h3>
              <p className="text-xs text-stone-500">{sub.fullName}, {sub.address}</p>
              <div className="text-xs bg-stone-50 rounded-lg p-2.5">
                Мурунку көрсөткүч: <b className="font-mono">{sub.waterLastMeterReading} м³</b>
              </div>
              <label className="block text-xs font-semibold" htmlFor="staff-reading">Жаңы көрсөткүч (м³)</label>
              <input
                id="staff-reading"
                type="number"
                inputMode="decimal"
                step="any"
                autoFocus
                value={value}
                onChange={e => setValue(e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg font-mono"
              />
              {consumed !== null && (
                <p className="text-xs text-stone-600">
                  Сарпталды: <b>{Math.round(consumed * 100) / 100} м³</b> · Болжолдуу сумма: <b>{money(consumed * tariffs.waterPerM3)}</b>
                </p>
              )}
              {error && <p className="text-xs text-rose-700 bg-rose-50 rounded-lg p-2">{error}</p>}
              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={() => setOpen(false)} className="px-3 py-1.5 rounded-lg bg-stone-100 text-xs font-semibold">
                  Жокко чыгаруу
                </button>
                <button type="submit" disabled={busy} className="px-3 py-1.5 rounded-lg bg-sky-700 text-white text-xs font-bold disabled:opacity-60">
                  {busy ? 'Сакталууда...' : 'Сактоо'}
                </button>
              </div>
            </form>
          </div>,
          document.body
        )}
    </>
  );
};

// ---------- Айлык эсептөө ----------
const currentPeriod = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

export const AccrualPanel: React.FC = () => {
  const { runMonthlyAccrual, listAccruals, subscribers, tariffs } = useApp();
  const [period, setPeriod] = useState(currentPeriod());
  const [waste, setWaste] = useState(true);
  const [pasture, setPasture] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [runs, setRuns] = useState<AccrualRun[]>([]);

  const reload = () => listAccruals().then(setRuns);
  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const done = (kind: 'waste' | 'pasture') => runs.some(r => r.period === period && r.kind === kind);

  // Алдын ала эсеп (экранда гана)
  const wasteTotal = subscribers.reduce((a, s) => a + (s.wasteFamilyMembers > 0 ? s.wasteFamilyMembers * tariffs.wastePerPerson : 0), 0);
  const wasteCount = subscribers.filter(s => s.wasteFamilyMembers > 0).length;
  const pastureOf = (s: SubscriberAccount) =>
    s.registeredLivestock.cattle * tariffs.pastureCattleMonth +
    s.registeredLivestock.horses * tariffs.pastureHorseMonth +
    s.registeredLivestock.sheepGoats * tariffs.pastureSheepMonth +
    (s.registeredLivestock.yaks || 0) * tariffs.pastureYakMonth;
  const pastureTotal = subscribers.reduce((a, s) => a + pastureOf(s), 0);
  const pastureCount = subscribers.filter(s => pastureOf(s) > 0).length;

  const run = async () => {
    setBusy(true);
    setMsg(null);
    const r = await runMonthlyAccrual(period, waste, pasture);
    setBusy(false);
    setConfirming(false);
    setMsg({ ok: r.ok, text: r.ok ? r.info || 'Эсептелди' : r.error || 'Ката' });
    reload();
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-xl font-extrabold text-stone-900">Айлык эсептөө</h2>
        <p className="text-xs text-stone-500 mt-0.5">
          Ай сайын бир жолу: таштанды акысы (үй-бүлө мүчөлөрү × тариф) жана жайыт акысы (мал саны × тариф) ар бир абоненттин эсебине карыз болуп жазылат.
          Бир айды эки жолу эсептөөгө болбойт.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 p-5 space-y-4 text-sm">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label htmlFor="acc-period" className="block text-xs font-semibold text-stone-700 mb-1">Ай</label>
            <input
              id="acc-period"
              type="month"
              value={period}
              onChange={e => {
                setPeriod(e.target.value);
                setConfirming(false);
              }}
              className="px-3 py-2 border border-stone-300 rounded-lg text-sm"
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={waste} disabled={done('waste')} onChange={e => setWaste(e.target.checked)} />
            Таштанды {done('waste') && <span className="text-xs text-emerald-700">(эсептелген)</span>}
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={pasture} disabled={done('pasture')} onChange={e => setPasture(e.target.checked)} />
            Жайыт {done('pasture') && <span className="text-xs text-emerald-700">(эсептелген)</span>}
          </label>
        </div>

        <div className="grid sm:grid-cols-2 gap-3 text-xs">
          <div className="rounded-xl bg-stone-50 p-3">
            <div className="font-bold text-stone-800">Таштанды</div>
            <div>{wasteCount} абонент · болжол менен {money(wasteTotal)}</div>
            <div className="text-stone-500">Тариф: {tariffs.wastePerPerson} сом / адам</div>
          </div>
          <div className="rounded-xl bg-stone-50 p-3">
            <div className="font-bold text-stone-800">Жайыт</div>
            <div>{pastureCount} абонент · болжол менен {money(pastureTotal)}</div>
            <div className="text-stone-500">
              Уй {tariffs.pastureCattleMonth}, жылкы {tariffs.pastureHorseMonth}, кой/эчки {tariffs.pastureSheepMonth}, топоз {tariffs.pastureYakMonth} сом / ай
            </div>
          </div>
        </div>

        {!confirming ? (
          <button
            type="button"
            disabled={busy || ((!waste || done('waste')) && (!pasture || done('pasture')))}
            onClick={() => setConfirming(true)}
            className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm disabled:opacity-50 flex items-center gap-2"
          >
            <Calculator className="w-4 h-4" />
            Эсептөө
          </button>
        ) : (
          <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 space-y-2 text-sm">
            <p>
              <b>{period}</b> айы үчүн {[waste && !done('waste') && 'таштанды', pasture && !done('pasture') && 'жайыт'].filter(Boolean).join(' жана ')} акысы
              бардык абоненттерге карыз болуп жазылат. Аны кайра жокко чыгаруу оңой эмес. Улантасызбы?
            </p>
            <div className="flex gap-2">
              <button type="button" onClick={() => setConfirming(false)} className="px-3 py-1.5 rounded-lg bg-white border text-xs font-semibold">
                Жок
              </button>
              <button type="button" disabled={busy} onClick={run} className="px-3 py-1.5 rounded-lg bg-emerald-700 text-white text-xs font-bold">
                {busy ? 'Эсептелүүдө...' : 'Ооба, эсептөө'}
              </button>
            </div>
          </div>
        )}

        {msg && (
          <p className={`text-sm rounded-lg p-2.5 ${msg.ok ? 'bg-emerald-50 text-emerald-900' : 'bg-rose-50 text-rose-800'}`}>{msg.text}</p>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-stone-100 font-bold text-sm">Мурунку эсептөөлөр</div>
        {runs.length === 0 ? (
          <p className="p-4 text-xs text-stone-500">Азырынча эсептөө жүргүзүлгөн жок.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-stone-50 text-stone-500">
                <tr>
                  <th className="py-2 px-4">Ай</th>
                  <th className="py-2 px-4">Түрү</th>
                  <th className="py-2 px-4">Абонент</th>
                  <th className="py-2 px-4">Сумма</th>
                  <th className="py-2 px-4">Ким</th>
                  <th className="py-2 px-4">Качан</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {runs.map(r => (
                  <tr key={r.period + r.kind}>
                    <td className="py-2 px-4 font-mono">{r.period}</td>
                    <td className="py-2 px-4">{r.kind === 'waste' ? 'Таштанды' : 'Жайыт'}</td>
                    <td className="py-2 px-4">{r.accounts}</td>
                    <td className="py-2 px-4 font-mono">{money(Number(r.total))}</td>
                    <td className="py-2 px-4">{r.actor}</td>
                    <td className="py-2 px-4">{new Date(r.created_at).toLocaleString('ru-RU')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

// ---------- Өзгөртүүлөр журналы (админ гана) ----------
const FIELD_NAMES: Record<string, string> = {
  full_name: 'Аты-жөнү',
  address: 'Дареги',
  phone: 'Телефон',
  water_balance: 'Суу балансы',
  water_last_meter_reading: 'Водомер',
  water_tariff_per_m3: 'Суу тарифи',
  waste_balance: 'Таштанды балансы',
  waste_family_members: 'Үй-бүлө мүчөлөрү',
  waste_tariff_per_person: 'Таштанды тарифи',
  pasture_balance: 'Жайыт балансы',
  livestock: 'Мал'
};

const show = (v: unknown) => (v === null || v === undefined ? '—' : typeof v === 'object' ? JSON.stringify(v) : String(v));

const describe = (d: Record<string, unknown>) => {
  const parts = Object.entries(d || {}).map(([k, v]) => {
    if (v && typeof v === 'object' && 'мурун' in (v as object)) {
      const x = v as { мурун: unknown; эми: unknown };
      return `${FIELD_NAMES[k] || k}: ${show(x.мурун)} → ${show(x.эми)}`;
    }
    return `${FIELD_NAMES[k] || k}: ${show(v)}`;
  });
  return parts.join('; ');
};

export const AuditLogPanel: React.FC = () => {
  const { listAudit } = useApp();
  const [rows, setRows] = useState<AuditEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    listAudit(500)
      .then(r => {
        setRows(r);
        setError(null);
      })
      .catch(e => setError(e instanceof Error ? e.message : 'Ката'))
      .finally(() => setLoading(false));
  };
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const q = filter.trim().toLowerCase();
  const shown = q
    ? rows.filter(r => [r.actor, r.action, r.account_id || ''].some(x => x.toLowerCase().includes(q)))
    : rows;

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-stone-900 flex items-center gap-2">
            <History className="w-5 h-5" /> Өзгөртүүлөр журналы
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Абоненттердин маалыматын ким, качан, эмнени өзгөрттү — төлөмдөр, көрсөткүчтөр, айлык эсептөөлөр. Журналды өзгөртүүгө болбойт.
          </p>
        </div>
        <div className="flex gap-2">
          <input
            value={filter}
            onChange={e => setFilter(e.target.value)}
            placeholder="Издөө (email, эсеп №)..."
            className="px-3 py-1.5 text-xs bg-white border border-stone-200 rounded-lg"
          />
          <button type="button" onClick={load} className="px-2.5 py-1.5 bg-white border border-stone-200 rounded-lg" title="Жаңыртуу">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      {error && <p className="text-sm bg-rose-50 text-rose-800 rounded-lg p-3">{error}</p>}
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-stone-50 text-stone-500">
              <tr>
                <th className="py-2.5 px-4">Качан</th>
                <th className="py-2.5 px-4">Ким</th>
                <th className="py-2.5 px-4">Эсеп №</th>
                <th className="py-2.5 px-4">Аракет</th>
                <th className="py-2.5 px-4">Чоо-жайы</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {shown.map(r => (
                <tr key={r.id} className="align-top">
                  <td className="py-2 px-4 whitespace-nowrap">{new Date(r.at).toLocaleString('ru-RU')}</td>
                  <td className="py-2 px-4">{r.actor}</td>
                  <td className="py-2 px-4 font-mono">{r.account_id || ''}</td>
                  <td className="py-2 px-4 font-semibold">{r.action}</td>
                  <td className="py-2 px-4 text-stone-600 break-words max-w-md">{describe(r.details)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && !error && shown.length === 0 && <p className="p-4 text-xs text-stone-500">Жазуу жок.</p>}
        </div>
      </div>
    </div>
  );
};
