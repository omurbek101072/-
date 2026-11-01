import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useApp, DebtNotice, SERVICE_NAMES, AccrualRun } from '../context/AppContext';
import { SubscriberAccount } from '../data/mockData';
import { downloadXlsx, Sheet } from '../utils/xlsx';
import { AlertTriangle, Download, Phone, Search, FileSpreadsheet, CheckCircle2 } from 'lucide-react';

type DebtService = 'water' | 'waste' | 'pasture';
const DEBT_SERVICES: DebtService[] = ['water', 'waste', 'pasture'];

const balanceOf = (s: SubscriberAccount, k: DebtService) =>
  k === 'water' ? s.waterBalance : k === 'waste' ? s.wasteBalance : s.pastureBalance;
const debtOf = (s: SubscriberAccount, k: DebtService) => Math.max(0, -Number(balanceOf(s, k) || 0));
const money = (n: number) => `${Math.round(n).toLocaleString('ru-RU')} сом`;
const fmtDate = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('ru-RU');
};
const today = () => new Date().toISOString().slice(0, 10);

export interface DebtorRow {
  sub: SubscriberAccount;
  debts: Record<DebtService, number>;
  total: number;
  lastNotice?: DebtNotice;
}

// Кызматкердин кызматтарына жараша карызкорлор
export const useDebtors = (filter: DebtService | 'all', notices: DebtNotice[]) => {
  const { subscribers, hasService } = useApp();
  const services = DEBT_SERVICES.filter(k => hasService(k) && (filter === 'all' || filter === k));
  return useMemo(() => {
    const lastBy = new Map<string, DebtNotice>();
    for (const n of notices) {
      if (!services.includes(n.service)) continue;
      const prev = lastBy.get(n.account_id);
      if (!prev || prev.at < n.at) lastBy.set(n.account_id, n);
    }
    return subscribers
      .map(sub => {
        const debts = { water: 0, waste: 0, pasture: 0 } as Record<DebtService, number>;
        for (const k of services) debts[k] = debtOf(sub, k);
        const total = services.reduce((a, k) => a + debts[k], 0);
        return { sub, debts, total, lastNotice: lastBy.get(sub.id) } as DebtorRow;
      })
      .filter(r => r.total > 0)
      .sort((a, b) => b.total - a.total);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subscribers, notices, services.join(',')]);
};

const debtorsSheet = (rows: DebtorRow[], services: DebtService[]): Sheet => ({
  name: 'Карызкорлор',
  widths: [10, 30, 30, 18, ...services.map(() => 14), 14, 16, 30],
  rows: [
    ['Эсеп №', 'Аты-жөнү', 'Дареги', 'Телефону', ...services.map(k => `${SERVICE_NAMES[k]} карызы, сом`), 'Жалпы, сом', 'Акыркы эскертүү', 'Эскертүүнүн белгиси'],
    ...rows.map(r => [
      r.sub.id,
      r.sub.fullName,
      r.sub.address,
      r.sub.phone,
      ...services.map(k => r.debts[k]),
      r.total,
      r.lastNotice ? fmtDate(r.lastNotice.at) : '',
      r.lastNotice ? `${SERVICE_NAMES[r.lastNotice.service]}: ${r.lastNotice.note || '—'} (${r.lastNotice.actor})` : ''
    ]),
    [],
    ['', 'Бардыгы', '', '', ...services.map(k => rows.reduce((a, r) => a + r.debts[k], 0)), rows.reduce((a, r) => a + r.total, 0)]
  ]
});

const subscribersSheet = (subs: SubscriberAccount[], has: (k: DebtService) => boolean): Sheet => {
  const head: string[] = ['Эсеп №', 'Аты-жөнү', 'Дареги', 'Телефону'];
  const widths = [10, 30, 30, 18];
  if (has('water')) {
    head.push('Суу балансы, сом', 'Водомер, м³');
    widths.push(16, 12);
  }
  if (has('waste')) {
    head.push('Таштанды балансы, сом', 'Үй-бүлө, адам');
    widths.push(18, 12);
  }
  if (has('pasture')) {
    head.push('Жайыт балансы, сом', 'Уй', 'Жылкы', 'Кой-эчки', 'Топоз');
    widths.push(16, 8, 8, 10, 8);
  }
  return {
    name: 'Абоненттер',
    widths,
    rows: [
      head,
      ...subs.map(s => {
        const row: (string | number)[] = [s.id, s.fullName, s.address, s.phone];
        if (has('water')) row.push(Number(s.waterBalance), Number(s.waterLastMeterReading));
        if (has('waste')) row.push(Number(s.wasteBalance), Number(s.wasteFamilyMembers));
        if (has('pasture'))
          row.push(
            Number(s.pastureBalance),
            s.registeredLivestock.cattle,
            s.registeredLivestock.horses,
            s.registeredLivestock.sheepGoats,
            s.registeredLivestock.yaks || 0
          );
        return row;
      })
    ]
  };
};

// ---------- Эскертүү берүү терезеси ----------
const NoticeDialog: React.FC<{ row: DebtorRow; services: DebtService[]; onClose: () => void; onSaved: (msg: string) => void }> = ({
  row,
  services,
  onClose,
  onSaved
}) => {
  const { markDebtNotice } = useApp();
  const options = services.filter(k => row.debts[k] > 0);
  const [service, setService] = useState<DebtService>(options[0] || services[0]);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const r = await markDebtNotice(row.sub.id, service, note.trim());
    setBusy(false);
    if (r.ok) onSaved(`№ ${row.sub.id}: эскертүү белгиленди.`);
    else setError(r.error || 'Ката');
  };

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60" onClick={() => !busy && onClose()}>
      <form onSubmit={save} onClick={e => e.stopPropagation()} className="bg-white rounded-2xl p-5 max-w-sm w-full shadow-2xl space-y-3 text-sm text-stone-800">
        <h3 className="font-bold text-base text-stone-900">Эскертүү берилди — № {row.sub.id}</h3>
        <p className="text-xs text-stone-500">
          {row.sub.fullName} · карызы {money(row.total)}
        </p>
        <label className="block text-xs font-semibold" htmlFor="notice-service">Кызмат</label>
        <select id="notice-service" value={service} onChange={e => setService(e.target.value as DebtService)} className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm">
          {options.map(k => (
            <option key={k} value={k}>
              {SERVICE_NAMES[k]} — {money(row.debts[k])}
            </option>
          ))}
        </select>
        <label className="block text-xs font-semibold" htmlFor="notice-note">Кантип эскертилди / убада</label>
        <input
          id="notice-note"
          value={note}
          maxLength={300}
          onChange={e => setNote(e.target.value)}
          placeholder="Мисалы: телефон аркылуу, 15-ноябрга чейин төлөйт"
          className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm"
        />
        {error && <p className="text-xs text-rose-700 bg-rose-50 rounded-lg p-2">{error}</p>}
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="px-3 py-1.5 rounded-lg bg-stone-100 text-xs font-semibold">
            Жокко чыгаруу
          </button>
          <button type="submit" disabled={busy} className="px-3 py-1.5 rounded-lg bg-rose-700 text-white text-xs font-bold disabled:opacity-60">
            {busy ? 'Сакталууда...' : 'Белгилөө'}
          </button>
        </div>
      </form>
    </div>,
    document.body
  );
};

// ---------- Карызкорлор ----------
export const DebtorsPanel: React.FC = () => {
  const { hasService, listDebtNotices } = useApp();
  const services = DEBT_SERVICES.filter(k => hasService(k));
  const [filter, setFilter] = useState<DebtService | 'all'>(services.length === 1 ? services[0] : 'all');
  const [minDebt, setMinDebt] = useState('');
  const [query, setQuery] = useState('');
  const [onlyUnnoticed, setOnlyUnnoticed] = useState(false);
  const [notices, setNotices] = useState<DebtNotice[]>([]);
  const [noticeFor, setNoticeFor] = useState<DebtorRow | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const reload = () => listDebtNotices().then(setNotices);
  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const all = useDebtors(filter, notices);
  const shownServices = services.filter(k => filter === 'all' || filter === k);
  const q = query.trim().toLowerCase();
  const min = Number(minDebt) || 0;
  const rows = all.filter(
    r =>
      r.total >= min &&
      (!onlyUnnoticed || !r.lastNotice) &&
      (!q || [r.sub.id, r.sub.fullName, r.sub.address, r.sub.phone].some(x => String(x).toLowerCase().includes(q)))
  );
  const total = rows.reduce((a, r) => a + r.total, 0);

  if (!services.length) {
    return <p className="text-sm text-stone-600">Сизге суу, таштанды же жайыт кызматы бекитилген эмес.</p>;
  }

  return (
    <div className="space-y-5 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-stone-900 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-600" /> Карызкорлор
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Карызы бар абоненттер, эң чоң карыздан баштап. Эскертүү бергенде белгилеп коюңуз — ким, качан эскерткени сакталат.
          </p>
        </div>
        <button
          type="button"
          onClick={() => downloadXlsx(`karyzkorlor-${today()}`, [debtorsSheet(rows, shownServices)])}
          disabled={!rows.length}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs disabled:opacity-50"
        >
          <Download className="w-3.5 h-3.5" /> Excel'ге жүктөө
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-stone-200 p-3">
          <div className="text-[11px] text-stone-500">Карызкорлор</div>
          <div className="text-lg font-extrabold text-stone-900" data-testid="debtors-count">{rows.length}</div>
        </div>
        <div className="bg-white rounded-xl border border-stone-200 p-3">
          <div className="text-[11px] text-stone-500">Жалпы карыз</div>
          <div className="text-lg font-extrabold text-rose-700" data-testid="debtors-total">{money(total)}</div>
        </div>
        <div className="bg-white rounded-xl border border-stone-200 p-3 col-span-2 sm:col-span-1">
          <div className="text-[11px] text-stone-500">Эскертүү берилбегендер</div>
          <div className="text-lg font-extrabold text-amber-700">{rows.filter(r => !r.lastNotice).length}</div>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-3 bg-white rounded-xl border border-stone-200 p-3 text-xs">
        {services.length > 1 && (
          <div>
            <label htmlFor="debt-service" className="block font-semibold text-stone-700 mb-1">Кызмат</label>
            <select id="debt-service" value={filter} onChange={e => setFilter(e.target.value as DebtService | 'all')} className="px-2 py-1.5 border border-stone-300 rounded-lg">
              <option value="all">Баары</option>
              {services.map(k => (
                <option key={k} value={k}>
                  {SERVICE_NAMES[k]}
                </option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label htmlFor="debt-min" className="block font-semibold text-stone-700 mb-1">Карызы кеминде (сом)</label>
          <input id="debt-min" type="number" min={0} value={minDebt} onChange={e => setMinDebt(e.target.value)} className="w-28 px-2 py-1.5 border border-stone-300 rounded-lg" />
        </div>
        <div className="relative flex-1 min-w-40">
          <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 bottom-2.5" />
          <input
            aria-label="Карызкорлорду издөө"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Аты, эсеп №, дарек..."
            className="w-full pl-8 pr-2 py-1.5 border border-stone-300 rounded-lg"
          />
        </div>
        <label className="flex items-center gap-1.5 pb-1.5">
          <input type="checkbox" checked={onlyUnnoticed} onChange={e => setOnlyUnnoticed(e.target.checked)} />
          Эскертүү берилбегендер гана
        </label>
      </div>

      {msg && (
        <div className="flex items-center gap-2 text-xs bg-emerald-50 text-emerald-900 rounded-lg p-2.5">
          <CheckCircle2 className="w-4 h-4" /> {msg}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-stone-50 text-stone-500">
              <tr>
                <th className="py-2.5 px-3">Эсеп №</th>
                <th className="py-2.5 px-3">Абонент</th>
                {shownServices.map(k => (
                  <th key={k} className="py-2.5 px-3 text-right">{SERVICE_NAMES[k]}</th>
                ))}
                <th className="py-2.5 px-3 text-right">Жалпы</th>
                <th className="py-2.5 px-3">Акыркы эскертүү</th>
                <th className="py-2.5 px-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {rows.map(r => (
                <tr key={r.sub.id} className="align-top" data-testid={`debtor-${r.sub.id}`}>
                  <td className="py-2 px-3 font-mono font-bold">№{r.sub.id}</td>
                  <td className="py-2 px-3">
                    <div className="font-semibold text-stone-900">{r.sub.fullName}</div>
                    <div className="text-stone-500">{r.sub.address}</div>
                    {r.sub.phone && (
                      <a href={`tel:${r.sub.phone.replace(/[^\d+]/g, '')}`} className="inline-flex items-center gap-1 text-sky-700 font-mono">
                        <Phone className="w-3 h-3" /> {r.sub.phone}
                      </a>
                    )}
                  </td>
                  {shownServices.map(k => (
                    <td key={k} className={`py-2 px-3 text-right font-mono ${r.debts[k] ? 'text-rose-700 font-bold' : 'text-stone-300'}`}>
                      {r.debts[k] ? money(r.debts[k]) : '—'}
                    </td>
                  ))}
                  <td className="py-2 px-3 text-right font-mono font-extrabold text-rose-800">{money(r.total)}</td>
                  <td className="py-2 px-3 text-stone-600">
                    {r.lastNotice ? (
                      <>
                        <div>{fmtDate(r.lastNotice.at)} · {SERVICE_NAMES[r.lastNotice.service]}</div>
                        {r.lastNotice.note && <div className="text-stone-500">{r.lastNotice.note}</div>}
                      </>
                    ) : (
                      <span className="text-amber-700">Берилген жок</span>
                    )}
                  </td>
                  <td className="py-2 px-3 text-right">
                    <button
                      type="button"
                      onClick={() => setNoticeFor(r)}
                      className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-800 font-semibold rounded-lg text-[11px] whitespace-nowrap"
                    >
                      Эскертүү берилди
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!rows.length && <p className="p-4 text-xs text-stone-500">Карызкор жок.</p>}
        </div>
      </div>

      {noticeFor && (
        <NoticeDialog
          row={noticeFor}
          services={shownServices}
          onClose={() => setNoticeFor(null)}
          onSaved={m => {
            setNoticeFor(null);
            setMsg(m);
            reload();
          }}
        />
      )}
    </div>
  );
};

// ---------- Excel отчеттор ----------
const monthRange = (period: string) => {
  const [y, m] = period.split('-').map(Number);
  const from = new Date(y, m - 1, 1);
  const to = new Date(y, m, 1);
  return { from: from.toISOString(), to: to.toISOString() };
};
const currentPeriod = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

export const ExcelReportsPanel: React.FC = () => {
  const { subscribers, hasService, listTransactionsBetween, listAccruals, listDebtNotices } = useApp();
  const [period, setPeriod] = useState(currentPeriod());
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notices, setNotices] = useState<DebtNotice[]>([]);
  useEffect(() => {
    listDebtNotices().then(setNotices);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const debtServices = DEBT_SERVICES.filter(k => hasService(k));
  const debtors = useDebtors('all', notices);
  const payServices = (['water', 'waste', 'pasture', 'machinery'] as const).filter(k => hasService(k));

  const run = async (key: string, fn: () => Promise<void> | void) => {
    setBusy(key);
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ката');
    } finally {
      setBusy(null);
    }
  };

  const monthly = () =>
    run('monthly', async () => {
      const { from, to } = monthRange(period);
      const [txs, runs] = await Promise.all([listTransactionsBetween(from, to), listAccruals()]);
      const mine = txs.filter(t => (payServices as readonly string[]).includes(t.serviceType));
      const acc = runs.filter((r: AccrualRun) => r.period === period);
      const summary: (string | number)[][] = [['Кызмат', 'Төлөмдөр саны', 'Төлөндү, сом', 'Айлык эсептелди, сом', 'Азыркы карыз, сом', 'Карызкорлор']];
      for (const k of payServices) {
        const list = mine.filter(t => t.serviceType === k);
        const isDebt = k !== 'machinery';
        const accrued = acc.filter(a => a.kind === k).reduce((a, r) => a + Number(r.total), 0);
        const debt = isDebt ? subscribers.reduce((a, s) => a + debtOf(s, k as DebtService), 0) : 0;
        const cnt = isDebt ? subscribers.filter(s => debtOf(s, k as DebtService) > 0).length : 0;
        summary.push([SERVICE_NAMES[k], list.length, list.reduce((a, t) => a + t.amount, 0), isDebt && k !== 'water' ? accrued : '', isDebt ? debt : '', isDebt ? cnt : '']);
      }
      summary.push([]);
      summary.push(['Бардыгы', mine.length, mine.reduce((a, t) => a + t.amount, 0)]);
      summary.push([]);
      summary.push(['Мөөнөт', period]);
      summary.push(['Түзүлгөн күнү', new Date().toLocaleString('ru-RU')]);

      const byMethod = new Map<string, number>();
      for (const t of mine) byMethod.set(t.paymentMethod, (byMethod.get(t.paymentMethod) || 0) + t.amount);

      const sheets: Sheet[] = [
        { name: 'Жыйынтык', widths: [20, 16, 16, 22, 18, 14], rows: summary },
        {
          name: 'Төлөмдөр',
          widths: [18, 14, 10, 28, 18, 26, 12, 18],
          rows: [
            ['Күнү', 'Квитанция №', 'Эсеп №', 'Төлөөчү', 'Кызмат', 'Ыкмасы', 'Сумма, сом', 'Абалы'],
            ...mine.map(t => [t.timestamp || fmtDate(t.createdAt), t.receiptNumber, t.accountId, t.payerName, SERVICE_NAMES[t.serviceType as keyof typeof SERVICE_NAMES] || t.serviceName, t.paymentMethod, t.amount, t.status])
          ]
        },
        {
          name: 'Төлөм ыкмалары',
          widths: [26, 16],
          rows: [['Ыкмасы', 'Сумма, сом'], ...[...byMethod.entries()].sort((a, b) => b[1] - a[1])]
        }
      ];
      if (debtServices.length) sheets.push(debtorsSheet(debtors, debtServices));
      downloadXlsx(`ailyk-otchet-${period}`, sheets);
    });

  const cards = [
    {
      key: 'monthly',
      title: 'Айлык отчет',
      text: 'Тандалган айдын төлөмдөрү, ыкмалары, айлык эсептөөлөр, азыркы карыздар жана карызкорлор — бир файлда, бир нече баракта.',
      action: monthly,
      needsMonth: true
    },
    {
      key: 'subs',
      title: 'Абоненттер тизмеси',
      text: 'Бардык абоненттер: дареги, телефону, баланстары, водомер, үй-бүлө жана мал саны.',
      action: () => run('subs', () => downloadXlsx(`abonentter-${today()}`, [subscribersSheet(subscribers, k => hasService(k))]))
    },
    ...(debtServices.length
      ? [
          {
            key: 'debtors',
            title: 'Карызкорлор',
            text: 'Карызы бар абоненттер, кызмат боюнча карыз жана акыркы эскертүү.',
            action: () => run('debtors', () => downloadXlsx(`karyzkorlor-${today()}`, [debtorsSheet(debtors, debtServices)]))
          }
        ]
      : [])
  ];

  return (
    <div className="space-y-5 max-w-4xl">
      <div>
        <h2 className="text-xl font-extrabold text-stone-900 flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5 text-emerald-700" /> Excel отчеттор
        </h2>
        <p className="text-xs text-stone-500 mt-0.5">
          Файл компьютериңизге .xlsx болуп жүктөлөт — Excel, LibreOffice же Google Sheets'те ачылат.
          {payServices.length < 4 && ` Отчетто сиздин кызматтарыңыз гана: ${payServices.map(k => SERVICE_NAMES[k]).join(', ')}.`}
        </p>
      </div>
      <div className="flex items-end gap-3 bg-white rounded-xl border border-stone-200 p-3 text-xs">
        <div>
          <label htmlFor="xl-period" className="block font-semibold text-stone-700 mb-1">Ай (айлык отчет үчүн)</label>
          <input id="xl-period" type="month" value={period} onChange={e => setPeriod(e.target.value)} className="px-2 py-1.5 border border-stone-300 rounded-lg" />
        </div>
      </div>
      {error && <p className="text-sm bg-rose-50 text-rose-800 rounded-lg p-3">{error}</p>}
      <div className="grid sm:grid-cols-3 gap-3">
        {cards.map(c => (
          <div key={c.key} className="bg-white rounded-2xl border border-stone-200 p-4 flex flex-col gap-3">
            <div className="font-bold text-stone-900 text-sm">{c.title}</div>
            <p className="text-xs text-stone-600 flex-1">{c.text}</p>
            <button
              type="button"
              disabled={!!busy}
              onClick={c.action}
              className="flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              {busy === c.key ? 'Даярдалууда...' : `Жүктөө${c.needsMonth ? ` (${period})` : ''}`}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
