import React, { useEffect, useState } from 'react';
import { useApp, AdminInfo } from '../context/AppContext';
import { Users, Plus, Trash2, RefreshCw, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

// Админдерди сайттын ичинен кошуу жана алып салуу
export const AdminManager: React.FC = () => {
  const { listAdmins, addAdmin, removeAdmin, adminEmail } = useApp();
  const [admins, setAdmins] = useState<AdminInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [newEmail, setNewEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      setAdmins(await listAdmins());
    } catch (e) {
      setMessage({ ok: false, text: e instanceof Error ? e.message : 'Тизмени жүктөө мүмкүн болгон жок.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = newEmail.trim();
    if (!email || busy) return;
    setBusy(true);
    const r = await addAdmin(email);
    setBusy(false);
    if (r.ok) {
      setMessage({
        ok: true,
        text: `${email} админ катары кошулду. Ал сайттагы «Кызматтык кирүү → Катталуу» аркылуу ушул email менен катталып, кире алат.`
      });
      setNewEmail('');
      load();
    } else {
      setMessage({ ok: false, text: r.error || 'Кошуу мүмкүн болгон жок.' });
    }
  };

  const handleRemove = async (email: string) => {
    setBusy(true);
    const r = await removeAdmin(email);
    setBusy(false);
    setConfirmRemove(null);
    setMessage(r.ok ? { ok: true, text: `${email} админдиктен алынды.` } : { ok: false, text: r.error || 'Алып салуу мүмкүн болгон жок.' });
    if (r.ok) load();
  };

  const isMe = (email: string) => email.toLowerCase() === (adminEmail || '').toLowerCase();

  return (
    <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-xs space-y-4 text-xs">
      <div className="flex items-start justify-between gap-3 border-b border-stone-100 pb-3">
        <div>
          <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-700" />
            <span>Админдер</span>
          </h3>
          <p className="text-[11px] text-stone-500 mt-0.5">
            Бул тизмедеги email менен катталган адамдар башкаруу панелине кире алат.
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="p-1.5 rounded-lg text-stone-500 hover:bg-stone-100 cursor-pointer disabled:opacity-50"
          aria-label="Тизмени жаңыртуу"
          title="Тизмени жаңыртуу"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <ul className="divide-y divide-stone-100" aria-busy={loading}>
        {admins.map(a => (
          <li key={a.email} className="py-2.5 flex flex-wrap items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="font-mono font-semibold text-stone-900 break-all">
                {a.email}
                {isMe(a.email) && <span className="ml-2 font-sans text-[10px] text-emerald-700 font-bold">(сиз)</span>}
              </div>
              <div className="text-[10px] text-stone-500 mt-0.5 flex items-center gap-1">
                {a.confirmed ? (
                  <>
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>Катталган{a.lastSignIn ? ` · акыркы кирүү ${a.lastSignIn}` : ''}</span>
                  </>
                ) : a.registered ? (
                  <>
                    <Clock className="w-3 h-3 text-amber-600" />
                    <span>Катталган, email ырастала элек</span>
                  </>
                ) : (
                  <>
                    <Clock className="w-3 h-3 text-stone-400" />
                    <span>Али каттала элек</span>
                  </>
                )}
              </div>
            </div>

            {!isMe(a.email) &&
              (confirmRemove === a.email ? (
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-rose-700 font-semibold">Алып салуу?</span>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => handleRemove(a.email)}
                    className="px-2.5 py-1 rounded-md bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold cursor-pointer disabled:opacity-50"
                  >
                    Ооба
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmRemove(null)}
                    className="px-2.5 py-1 rounded-md bg-stone-100 hover:bg-stone-200 text-stone-700 text-[11px] font-semibold cursor-pointer"
                  >
                    Жок
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmRemove(a.email)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-md text-rose-600 hover:bg-rose-50 text-[11px] font-semibold cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Алып салуу</span>
                </button>
              ))}
          </li>
        ))}
        {!loading && admins.length === 0 && <li className="py-3 text-stone-400">Тизме бош</li>}
      </ul>

      <form onSubmit={handleAdd} className="space-y-2 pt-2 border-t border-stone-100">
        <label htmlFor="new-admin-email" className="block text-stone-700 font-bold">
          Жаңы админ кошуу:
        </label>
        <div className="flex flex-wrap gap-2">
          <input
            id="new-admin-email"
            type="email"
            required
            value={newEmail}
            onChange={e => setNewEmail(e.target.value)}
            placeholder="kyzmatker@gmail.com"
            className="flex-1 min-w-0 px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none"
          />
          <button
            type="submit"
            disabled={busy}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold cursor-pointer disabled:opacity-50"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Кошуу</span>
          </button>
        </div>
        <p className="text-[11px] text-stone-500">
          Кошулган адам сайттын ылдыйындагы «Кызматтык кирүү» → «Катталуу» аркылуу ушул email менен катталат, анан кирет.
        </p>
      </form>

      {message && (
        <div
          role="status"
          className={`p-2.5 rounded-lg text-[11px] flex items-start gap-1.5 border ${
            message.ok ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-700'
          }`}
        >
          {message.ok ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-px" /> : <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-px" />}
          <span>{message.text}</span>
        </div>
      )}
    </div>
  );
};
