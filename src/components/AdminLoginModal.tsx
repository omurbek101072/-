import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Lock, Shield, KeyRound, X, AlertCircle, CheckCircle2 } from 'lucide-react';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type Mode = 'login' | 'register' | 'forgot';

const inputCls =
  'w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none';

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { loginAdmin, registerAdmin, requestPasswordReset } = useApp();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [pin2, setPin2] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  if (!isOpen) return null;

  const switchMode = (m: Mode) => {
    setMode(m);
    setError(null);
    setInfo(null);
    setPin('');
    setPin2('');
  };

  const handleClose = () => {
    setPin('');
    setPin2('');
    setError(null);
    setInfo(null);
    setMode('login');
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isChecking) return;
    setError(null);
    setInfo(null);

    if (mode === 'register' && pin !== pin2) {
      setError('Сырсөздөр дал келбейт. Экөөн тең бирдей жазыңыз.');
      return;
    }

    setIsChecking(true);
    const result =
      mode === 'login'
        ? await loginAdmin(email, pin)
        : mode === 'register'
        ? await registerAdmin(email, pin)
        : await requestPasswordReset(email);
    setIsChecking(false);
    setPin('');
    setPin2('');

    if (!result.ok) {
      setError(result.error || 'Ката кетти.');
      return;
    }
    if (result.info) {
      setInfo(result.info);
      return;
    }
    handleClose();
    onSuccess();
  };

  const tabs: { id: Mode; label: string }[] = [
    { id: 'login', label: 'Кирүү' },
    { id: 'register', label: 'Катталуу' },
    { id: 'forgot', label: 'Сырсөздү унуттум' }
  ];

  const submitLabel = isChecking
    ? 'Текшерилүүдө...'
    : mode === 'login'
    ? 'Башкаруу панелине кирүү'
    : mode === 'register'
    ? 'Катталуу'
    : 'Шилтеме жөнөтүү';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-sm w-full p-6 border border-stone-200 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-stone-900">Кызматкерлердин кирүүсү</h3>
              <p className="text-[11px] text-stone-500">«Тазалык» МИ администраторлору үчүн</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Жабуу"
            className="p-1 rounded text-stone-400 hover:text-stone-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex gap-1 p-1 bg-stone-100 rounded-lg text-[11px] font-semibold" role="tablist">
          {tabs.map(t => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={mode === t.id}
              onClick={() => switchMode(t.id)}
              className={`flex-1 py-1.5 rounded-md transition-colors cursor-pointer ${
                mode === t.id ? 'bg-white text-emerald-800 shadow-xs' : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {mode === 'register' && (
          <p className="text-[11px] text-stone-500 leading-relaxed">
            Катталгандан кийин учурдагы админ сиздин email'иңизди «Админдер» бөлүмүнө кошкондо гана башкаруу панелине кире аласыз.
          </p>
        )}
        {mode === 'forgot' && (
          <p className="text-[11px] text-stone-500 leading-relaxed">
            Email'иңизди жазыңыз, ага жаңы сырсөз коюу үчүн шилтеме жөнөтүлөт.
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label htmlFor="auth-email" className="block text-stone-700 font-semibold mb-1">Email:</label>
            <input
              id="auth-email"
              type="email"
              autoComplete="username"
              required
              autoFocus
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError(null);
              }}
              placeholder="admin@example.com"
              className={inputCls}
            />
          </div>

          {mode !== 'forgot' && (
            <div>
              <label htmlFor="auth-password" className="block text-stone-700 font-semibold mb-1">
                {mode === 'register' ? 'Сырсөз (кеминде 8 белги):' : 'Сырсөз:'}
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="auth-password"
                  type="password"
                  autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                  required
                  minLength={mode === 'register' ? 8 : undefined}
                  value={pin}
                  onChange={(e) => {
                    setPin(e.target.value);
                    setError(null);
                  }}
                  placeholder="Сырсөздү териңиз..."
                  className={`${inputCls} pl-9 font-mono`}
                />
              </div>
            </div>
          )}

          {mode === 'register' && (
            <div>
              <label htmlFor="auth-password2" className="block text-stone-700 font-semibold mb-1">Сырсөздү кайталаңыз:</label>
              <input
                id="auth-password2"
                type="password"
                autoComplete="new-password"
                required
                value={pin2}
                onChange={(e) => setPin2(e.target.value)}
                className={`${inputCls} font-mono`}
              />
            </div>
          )}

          {mode !== 'forgot' && (
            <p className="text-[10px] text-stone-400">
              Кеңеш: сырсөздү териштен мурун клавиатура тили туура экенин (мисалы, ENG) текшериңиз.
            </p>
          )}

          {error && (
            <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-[11px] flex items-start gap-1.5" role="alert">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-px" />
              <span>{error}</span>
            </div>
          )}
          {info && (
            <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] flex items-start gap-1.5" role="status">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-px" />
              <span>{info}</span>
            </div>
          )}

          <div className="pt-1">
            <button
              type="submit"
              disabled={isChecking}
              className="w-full disabled:opacity-60 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer shadow-xs flex items-center justify-center gap-2"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{submitLabel}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Почтадагы «сырсөздү калыбына келтирүү» шилтемесинен келгенде жаңы сырсөз коюу терезеси
export const PasswordRecoveryModal: React.FC<{ onDone: () => void }> = ({ onDone }) => {
  const { passwordRecoveryActive, completePasswordRecovery, authMessage, clearAuthMessage } = useApp();
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Шилтемеден келген билдирүү (email ырасталды / шилтеме эскирген)
  if (!passwordRecoveryActive && !info && authMessage) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <div className="bg-white rounded-2xl max-w-sm w-full p-6 border border-stone-200 shadow-2xl space-y-4 text-xs" role="dialog" aria-modal="true">
          <p className="text-stone-800 leading-relaxed">{authMessage}</p>
          <button
            type="button"
            onClick={clearAuthMessage}
            className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl cursor-pointer"
          >
            Түшүнүктүү
          </button>
        </div>
      </div>
    );
  }

  if (!passwordRecoveryActive && !info) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw !== pw2) {
      setError('Сырсөздөр дал келбейт.');
      return;
    }
    setBusy(true);
    const r = await completePasswordRecovery(pw);
    setBusy(false);
    if (!r.ok) {
      setError(r.error || 'Ката кетти.');
      return;
    }
    setError(null);
    setInfo(r.info || 'Сырсөз алмаштырылды!');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl max-w-sm w-full p-6 border border-stone-200 shadow-2xl space-y-4 text-xs" role="dialog" aria-modal="true">
        <h3 className="font-bold text-sm text-stone-900 flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-emerald-700" />
          <span>Жаңы сырсөз коюу</span>
        </h3>
        {info ? (
          <>
            <p className="text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg p-2.5">{info}</p>
            <button
              type="button"
              onClick={() => {
                setInfo(null);
                onDone();
              }}
              className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl cursor-pointer"
            >
              Улантуу
            </button>
          </>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <div>
              <label htmlFor="recovery-pw" className="block text-stone-700 font-semibold mb-1">Жаңы сырсөз (кеминде 8 белги):</label>
              <input id="recovery-pw" type="password" autoComplete="new-password" required minLength={8} value={pw} onChange={e => setPw(e.target.value)} className={`${inputCls} font-mono`} />
            </div>
            <div>
              <label htmlFor="recovery-pw2" className="block text-stone-700 font-semibold mb-1">Кайталаңыз:</label>
              <input id="recovery-pw2" type="password" autoComplete="new-password" required value={pw2} onChange={e => setPw2(e.target.value)} className={`${inputCls} font-mono`} />
            </div>
            {error && <p className="text-rose-600 font-semibold text-[11px]" role="alert">{error}</p>}
            <button
              type="submit"
              disabled={busy}
              className="w-full disabled:opacity-60 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl cursor-pointer"
            >
              {busy ? 'Сакталууда...' : 'Сырсөздү сактоо'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
