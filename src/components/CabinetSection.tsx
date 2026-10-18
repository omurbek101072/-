import React, { useCallback, useEffect, useState } from 'react';
import { useApp, AccountHistory, OrderStatus } from '../context/AppContext';
import { SubscriberAccount, PaymentTransaction, CitizenTicket } from '../data/mockData';
import { ReceiptModal } from './ReceiptModal';
import { T } from './AdminInline';
import { isValidKgPhone, PHONE_ERROR } from '../utils/validation';
import {
  getMyAccounts,
  rememberAccount,
  forgetAccount,
  getMyRequests,
  forgetRequest,
  MY_DEVICE_EVENT,
  MyRequest
} from '../utils/myDevice';
import { Droplets, Trash2, Mountain, Search, X, FileText, ClipboardList, RefreshCw, Plus, AlertCircle, CheckCircle2, Truck } from 'lucide-react';

type Service = 'water' | 'waste' | 'pasture';

interface CabinetProps {
  onPay: (serviceType: Service, amount: number, details: string, accountId: string) => void;
  onOpenCitizenRequest: () => void;
}

const fmt = (n: number) => `${Math.round(Number(n) || 0).toLocaleString('ru-RU')} сом`;
const fmtDate = (s: string) => {
  const d = new Date(s);
  return isNaN(d.getTime()) ? s : d.toLocaleDateString('ru-RU');
};

// Түзмөктөгү эсептер жана арыздар тизмеси (башка өтмөктө өзгөрсө да жаңырат)
const useMyDevice = () => {
  const [accounts, setAccounts] = useState<string[]>(getMyAccounts);
  const [requests, setRequests] = useState<MyRequest[]>(getMyRequests);
  useEffect(() => {
    const sync = () => {
      setAccounts(getMyAccounts());
      setRequests(getMyRequests());
    };
    window.addEventListener(MY_DEVICE_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(MY_DEVICE_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);
  return { accounts, requests };
};

// ---------------------------------------------------------------------------
// Эсеп кошуу
// ---------------------------------------------------------------------------
const AddAccountForm: React.FC<{ onAdded: (id: string) => void; compact?: boolean }> = ({ onAdded, compact }) => {
  const { lookupSubscriber } = useApp();
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = value.replace('№', '').trim();
    if (!id) return setError('Эсеп номерин жазыңыз.');
    setBusy(true);
    setError(null);
    try {
      const found = await lookupSubscriber(id);
      if (!found) setError('Мындай эсеп номери табылган жок. Квитанциядагы номерди текшериңиз.');
      else {
        rememberAccount(found.id);
        setValue('');
        onAdded(found.id);
      }
    } catch {
      setError('Байланыш жок. Бир аздан кийин кайталаңыз.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className={compact ? 'flex flex-wrap items-start gap-2' : 'space-y-3'}>
      {!compact && (
        <label htmlFor="cab-acc" className="block text-sm font-semibold text-stone-800">
          <T>Квитанциядагы лицевой эсебиңиздин номерин жазыңыз</T>
        </label>
      )}
      <div className="flex gap-2 flex-1 min-w-[14rem]">
        <input
          id="cab-acc"
          inputMode="numeric"
          value={value}
          onChange={e => setValue(e.target.value)}
          placeholder="Мисалы: 1042"
          className="flex-1 min-w-0 px-4 py-3 bg-white border border-stone-300 rounded-xl text-base font-mono focus:ring-2 focus:ring-emerald-600 focus:outline-none"
        />
        <button
          type="submit"
          disabled={busy}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-bold cursor-pointer disabled:opacity-60 shrink-0"
        >
          {compact ? <Plus className="w-4 h-4" /> : <Search className="w-4 h-4" />}
          <span>{busy ? 'Изделүүдө…' : compact ? 'Кошуу' : 'Ачуу'}</span>
        </button>
      </div>
      {error && (
        <p className="w-full text-sm text-rose-600 font-semibold flex items-start gap-1.5" role="alert">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </p>
      )}
    </form>
  );
};

// ---------------------------------------------------------------------------
// Бир эсептин маалыматы
// ---------------------------------------------------------------------------
const AccountView: React.FC<{ id: string; onPay: CabinetProps['onPay'] }> = ({ id, onPay }) => {
  const { lookupSubscriber, getAccountHistory, submitMeterReading } = useApp();
  const [sub, setSub] = useState<SubscriberAccount | null | undefined>(undefined);
  const [hist, setHist] = useState<AccountHistory | null>(null);
  const [receipt, setReceipt] = useState<PaymentTransaction | null>(null);
  const [reading, setReading] = useState('');
  const [phone, setPhone] = useState('');
  const [meterMsg, setMeterMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [meterBusy, setMeterBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const [s, h] = await Promise.all([lookupSubscriber(id), getAccountHistory(id)]);
      setSub(s);
      setHist(h);
    } catch {
      setSub(null);
    }
  }, [id]);
  useEffect(() => {
    setSub(undefined);
    setHist(null);
    load();
  }, [load]);

  if (sub === undefined) return <p className="text-sm text-stone-500 py-6">Жүктөлүүдө…</p>;
  if (sub === null)
    return (
      <p className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-900">
        Бул эсеп табылган жок же өчүрүлгөн. Ишкананын кассасына кайрылыңыз.
      </p>
    );

  const debts: { type: Service; title: string; icon: React.FC<{ className?: string }>; balance: number; note: string; color: string }[] = [
    { type: 'water', title: 'Таза суу', icon: Droplets, balance: sub.waterBalance, note: `Акыркы көрсөткүч: ${sub.waterLastMeterReading} м³`, color: 'text-cyan-700 bg-cyan-50' },
    { type: 'waste', title: 'Таштанды', icon: Trash2, balance: sub.wasteBalance, note: `${sub.wasteFamilyMembers} адам`, color: 'text-emerald-700 bg-emerald-50' },
    { type: 'pasture', title: 'Жайыт', icon: Mountain, balance: sub.pastureBalance, note: '', color: 'text-amber-700 bg-amber-50' }
  ];

  const sendMeter = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = Number(reading.replace(',', '.'));
    if (!(value > 0)) return setMeterMsg({ ok: false, text: 'Көрсөткүчтү жазыңыз.' });
    if (!isValidKgPhone(phone)) return setMeterMsg({ ok: false, text: PHONE_ERROR });
    setMeterBusy(true);
    setMeterMsg(null);
    try {
      const r = await submitMeterReading(id, value, phone);
      setMeterMsg({ ok: true, text: `Кабыл алынды. Сарпталган суу: ${r.consumed} м³, сумма: ${fmt(r.amount)}.` });
      setReading('');
      load();
    } catch (err) {
      setMeterMsg({ ok: false, text: err instanceof Error ? err.message : 'Жөнөтүлгөн жок.' });
    } finally {
      setMeterBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <div className="text-xs text-stone-500">Лицевой эсеп № <span className="font-mono font-bold text-stone-800">{sub.id}</span></div>
          <div className="text-lg font-bold text-stone-900">{sub.fullName}</div>
          <div className="text-xs text-stone-500">{sub.address}</div>
        </div>
        <button type="button" onClick={load} className="inline-flex items-center gap-1 text-xs font-semibold text-stone-500 hover:text-stone-800 cursor-pointer">
          <RefreshCw className="w-3.5 h-3.5" /> Жаңыртуу
        </button>
      </div>

      {/* Карыздар */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {debts.map(d => {
          const Icon = d.icon;
          // Базада карыз терс сан менен сакталат (−333 = 333 сом карыз)
          const debt = Math.max(0, -Number(d.balance || 0));
          const prepaid = Math.max(0, Number(d.balance || 0));
          const owes = debt > 0;
          return (
            <div key={d.type} className="p-4 rounded-2xl bg-white border border-stone-200 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <span className={`w-9 h-9 rounded-lg flex items-center justify-center ${d.color}`}>
                  <Icon className="w-5 h-5" />
                </span>
                <span className="font-bold text-stone-900">{d.title}</span>
              </div>
              <div>
                <div className="text-xs text-stone-500">{owes ? 'Карыз' : prepaid > 0 ? 'Алдын ала төлөнгөн' : 'Карыз жок'}</div>
                <div className={`text-2xl font-extrabold font-mono ${owes ? 'text-rose-700' : 'text-emerald-700'}`}>{fmt(owes ? debt : prepaid)}</div>
                {d.note && <div className="text-xs text-stone-500 mt-0.5">{d.note}</div>}
              </div>
              {owes && (
                <button
                  type="button"
                  onClick={() => onPay(d.type, Math.round(debt), `${d.title}: эсеп №${sub.id}`, sub.id)}
                  className="mt-auto w-full py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-bold cursor-pointer"
                >
                  Төлөө
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Водомер */}
      <div className="p-5 rounded-2xl bg-white border border-stone-200 space-y-3">
        <h3 className="font-bold text-stone-900 flex items-center gap-2">
          <Droplets className="w-4 h-4 text-cyan-700" /> <T>Водомердин көрсөткүчү</T>
        </h3>
        <form onSubmit={sendMeter} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2 items-end">
          <div>
            <label htmlFor="cab-reading" className="block text-xs font-semibold text-stone-600 mb-1">
              Бүгүнкү көрсөткүч (м³), мурункусу: {sub.waterLastMeterReading}
            </label>
            <input id="cab-reading" inputMode="decimal" value={reading} onChange={e => setReading(e.target.value)} className="w-full px-3 py-2.5 border border-stone-300 rounded-xl font-mono" />
          </div>
          <div>
            <label htmlFor="cab-phone" className="block text-xs font-semibold text-stone-600 mb-1">Телефонуңуз</label>
            <input id="cab-phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="0700 123 456" className="w-full px-3 py-2.5 border border-stone-300 rounded-xl" />
          </div>
          <button type="submit" disabled={meterBusy} className="px-5 py-2.5 rounded-xl bg-cyan-700 hover:bg-cyan-800 text-white text-sm font-bold cursor-pointer disabled:opacity-60">
            {meterBusy ? 'Жөнөтүлүүдө…' : 'Жөнөтүү'}
          </button>
        </form>
        {meterMsg && (
          <p className={`text-sm font-semibold ${meterMsg.ok ? 'text-emerald-700' : 'text-rose-600'}`} role="status">
            {meterMsg.text}
          </p>
        )}
        {hist && hist.readings.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-stone-500 text-left">
                <tr>
                  <th className="py-1.5 pr-3 font-semibold">Күнү</th>
                  <th className="py-1.5 pr-3 font-semibold">Көрсөткүч</th>
                  <th className="py-1.5 pr-3 font-semibold">Сарпталды</th>
                  <th className="py-1.5 font-semibold">Сумма</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {hist.readings.map((r, i) => (
                  <tr key={i}>
                    <td className="py-1.5 pr-3">{fmtDate(r.date)}</td>
                    <td className="py-1.5 pr-3 font-mono">{r.new}</td>
                    <td className="py-1.5 pr-3 font-mono">{Math.round((r.new - r.prev) * 100) / 100} м³</td>
                    <td className="py-1.5 font-mono">{fmt(r.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Төлөм тарыхы */}
      <div className="p-5 rounded-2xl bg-white border border-stone-200 space-y-3">
        <h3 className="font-bold text-stone-900 flex items-center gap-2">
          <FileText className="w-4 h-4 text-emerald-700" /> <T>Төлөмдөр жана квитанциялар</T>
        </h3>
        {!hist || hist.payments.length === 0 ? (
          <p className="text-sm text-stone-500">Азырынча катталган төлөм жок.</p>
        ) : (
          <ul className="divide-y divide-stone-100">
            {hist.payments.map(p => (
              <li key={p.id} className="py-2.5 flex flex-wrap items-center justify-between gap-2 text-sm">
                <div>
                  <div className="font-semibold text-stone-900">{p.serviceName}</div>
                  <div className="text-xs text-stone-500">
                    {p.timestamp} · {p.paymentMethod} · № {p.receiptNumber}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-emerald-800">{fmt(p.amount)}</span>
                  <button
                    type="button"
                    onClick={() => setReceipt({ ...p, payerName: sub.fullName, payerPhone: '', details: '' } as PaymentTransaction)}
                    className="px-3 py-1.5 rounded-lg border border-stone-200 text-xs font-semibold text-emerald-800 hover:bg-emerald-50 cursor-pointer"
                  >
                    Квитанция
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {receipt && <ReceiptModal transaction={receipt} onClose={() => setReceipt(null)} isDemo={receipt.receiptNumber?.startsWith('DEMO')} />}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Менин арыздарым жана заказдарым
// ---------------------------------------------------------------------------
const MyRequests: React.FC<{ requests: MyRequest[]; onOpenCitizenRequest: () => void }> = ({ requests, onOpenCitizenRequest }) => {
  const { getTicketStatus, getOrderStatus } = useApp();
  const [items, setItems] = useState<Record<string, CitizenTicket | OrderStatus | null>>({});

  useEffect(() => {
    let alive = true;
    (async () => {
      const out: Record<string, CitizenTicket | OrderStatus | null> = {};
      for (const r of requests) {
        try {
          out[r.id] = r.kind === 'ticket' ? await getTicketStatus(r.id) : await getOrderStatus(r.id);
        } catch {
          out[r.id] = null;
        }
      }
      if (alive) setItems(out);
    })();
    return () => {
      alive = false;
    };
  }, [requests]);

  return (
    <div className="p-5 rounded-2xl bg-white border border-stone-200 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-bold text-stone-900 flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-amber-600" /> <T>Менин арыздарым жана заказдарым</T>
        </h3>
        <button type="button" onClick={onOpenCitizenRequest} className="text-xs font-semibold text-emerald-700 hover:underline cursor-pointer">
          + Жаңы арыз
        </button>
      </div>
      {requests.length === 0 ? (
        <p className="text-sm text-stone-500">
          <T>Бул телефондон жөнөтүлгөн арыздар жана техника заказдары ушул жерде көрүнөт.</T>
        </p>
      ) : (
        <ul className="divide-y divide-stone-100">
          {requests.map(r => {
            const it = items[r.id];
            const isTicket = r.kind === 'ticket';
            const t = it as CitizenTicket | null;
            const o = it as OrderStatus | null;
            return (
              <li key={r.id} className="py-2.5 flex flex-wrap items-center justify-between gap-2 text-sm">
                <div className="flex items-start gap-2">
                  {isTicket ? <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5" /> : <Truck className="w-4 h-4 text-indigo-700 mt-0.5" />}
                  <div>
                    <div className="font-semibold text-stone-900">
                      {isTicket ? t?.category || 'Арыз' : o?.machineName || 'Техника заказы'} <span className="font-mono text-xs text-stone-500">№ {r.id}</span>
                    </div>
                    <div className="text-xs text-stone-500">
                      {fmtDate(r.createdAt)}
                      {isTicket && t?.address ? ` · ${t.address}` : ''}
                      {!isTicket && o?.totalEstimate ? ` · ${fmt(o.totalEstimate)}` : ''}
                    </div>
                    {isTicket && t?.resolutionNotes && <div className="text-xs text-emerald-800 mt-0.5">{t.resolutionNotes}</div>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      it === undefined
                        ? 'bg-stone-100 text-stone-500'
                        : !it
                        ? 'bg-stone-100 text-stone-500'
                        : /Аткарылды|бүттү/.test((it as any).status)
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {it === undefined ? '…' : it ? (it as any).status : 'табылган жок'}
                  </span>
                  <button type="button" onClick={() => forgetRequest(r.id)} aria-label="Тизмеден алып салуу" className="p-1 text-stone-400 hover:text-stone-700 cursor-pointer">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Негизги бет
// ---------------------------------------------------------------------------
export const CabinetSection: React.FC<CabinetProps> = ({ onPay, onOpenCitizenRequest }) => {
  const { accounts, requests } = useMyDevice();
  const [active, setActive] = useState<string | null>(accounts[0] || null);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (!active || !accounts.includes(active)) setActive(accounts[0] || null);
  }, [accounts]);

  return (
    <section id="cabinet" className="py-10 sm:py-14 bg-stone-50 border-b border-stone-200 min-h-[60vh]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900"><T>Менин эсебим</T></h2>
          <p className="text-sm text-stone-600 mt-1">
            <T>Карызыңызды, төлөмдөрүңүздү, водомердин көрсөткүчүн жана арыздарыңызды бир жерден көрүңүз.</T>
          </p>
        </div>

        {accounts.length === 0 ? (
          <div className="p-5 sm:p-6 rounded-2xl bg-white border border-stone-200 shadow-xs">
            <AddAccountForm onAdded={id => setActive(id)} />
            <p className="text-xs text-stone-500 mt-3">
              <T>Эсебиңиз ушул телефондо эстеп калынат — кийинки жолу номерди кайра жазуунун кереги жок.</T>
            </p>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2">
              {accounts.map(a => (
                <span key={a} className={`inline-flex items-center rounded-full border text-sm ${a === active ? 'bg-emerald-700 border-emerald-700 text-white' : 'bg-white border-stone-200 text-stone-700'}`}>
                  <button type="button" onClick={() => setActive(a)} className="pl-3.5 pr-2 py-1.5 font-mono font-semibold cursor-pointer">
                    № {a}
                  </button>
                  <button
                    type="button"
                    onClick={() => forgetAccount(a)}
                    title="Бул телефондон унутуу"
                    aria-label={`№ ${a} эсебин унутуу`}
                    className={`pr-2.5 py-1.5 cursor-pointer ${a === active ? 'text-emerald-100 hover:text-white' : 'text-stone-400 hover:text-stone-700'}`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
              {!adding && (
                <button type="button" onClick={() => setAdding(true)} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-dashed border-stone-300 text-sm text-stone-600 hover:border-emerald-500 cursor-pointer">
                  <Plus className="w-3.5 h-3.5" /> Башка эсеп
                </button>
              )}
            </div>
            {adding && (
              <div className="p-4 rounded-2xl bg-white border border-stone-200">
                <AddAccountForm
                  compact
                  onAdded={id => {
                    setActive(id);
                    setAdding(false);
                  }}
                />
              </div>
            )}
            {active && <AccountView key={active} id={active} onPay={onPay} />}
          </>
        )}

        <MyRequests requests={requests} onOpenCitizenRequest={onOpenCitizenRequest} />

        <p className="text-xs text-stone-500 flex items-start gap-1.5">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-stone-400" />
          <span>
            <T>Эсеп номерлериңиз ушул түзмөктө гана сакталат. Башка бирөөнүн телефонунан кирсеңиз, бүткөндөн кийин номердин жанындагы × белгисин басып унуттуруңуз.</T>
          </span>
        </p>
      </div>
    </section>
  );
};
