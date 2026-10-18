// Тургундун түзмөгүндө гана сакталуучу маалымат («Менин эсебим»).
// Браузер сактагычы жабык болсо (жашыруун терезе ж.б.) — жөн гана бош кайтат.

const ACCOUNTS_KEY = 'tz_my_accounts';
const REQUESTS_KEY = 'tz_my_requests';
export const MY_DEVICE_EVENT = 'tz-my-device';

export interface MyRequest {
  id: string;
  kind: 'ticket' | 'order';
  createdAt: string;
}

const read = <T,>(key: string, fallback: T): T => {
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
};
const write = (key: string, value: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new Event(MY_DEVICE_EVENT));
  } catch {
    /* сактагыч жеткиликсиз */
  }
};

export const getMyAccounts = (): string[] => read<string[]>(ACCOUNTS_KEY, []).filter(x => typeof x === 'string');
export const rememberAccount = (id: string) => {
  const clean = id.replace('№', '').trim();
  if (!clean) return;
  write(ACCOUNTS_KEY, [clean, ...getMyAccounts().filter(a => a !== clean)].slice(0, 10));
};
export const forgetAccount = (id: string) => write(ACCOUNTS_KEY, getMyAccounts().filter(a => a !== id));

export const getMyRequests = (): MyRequest[] => read<MyRequest[]>(REQUESTS_KEY, []).filter(r => r && r.id);
export const rememberRequest = (id: string, kind: MyRequest['kind']) => {
  if (!id) return;
  write(REQUESTS_KEY, [{ id, kind, createdAt: new Date().toISOString() }, ...getMyRequests().filter(r => r.id !== id)].slice(0, 30));
};
export const forgetRequest = (id: string) => write(REQUESTS_KEY, getMyRequests().filter(r => r.id !== id));
