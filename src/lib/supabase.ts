// Supabase менен иштөө үчүн жеңил клиент (кошумча пакетсиз, fetch аркылуу).
// URL жана "anon" ачкычы ачык маалымат — алар браузерде көрүнөт, бул нормалдуу.
// Коргоо базадагы RLS эрежелери менен камсыз кылынат (supabase/schema.sql).

const env = (import.meta as any).env || {};

export const SUPABASE_URL: string = (env.VITE_SUPABASE_URL || 'https://inykrnoloqugzexapbgr.supabase.co').replace(/\/(rest\/v1\/?)?$/, '');
export const SUPABASE_ANON_KEY: string =
  env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlueWtybm9sb3F1Z3pleGFwYmdyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE3MzM2MDEsImV4cCI6MjEwNzMwOTYwMX0.NVrnJte60c_PJeZFknTfLv5gubrjGCBNLoASBFxwkvk';

const SESSION_KEY = 'tazalyk_auth_session';

export interface AuthSession {
  access_token: string;
  refresh_token: string;
  expires_at: number; // секунд (unix)
  email: string;
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

// ---------- Сессия ----------
let session: AuthSession | null = loadSession();
let refreshing: Promise<AuthSession | null> | null = null;

function loadSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as AuthSession) : null;
  } catch {
    return null;
  }
}

function saveSession(s: AuthSession | null) {
  session = s;
  try {
    if (s) localStorage.setItem(SESSION_KEY, JSON.stringify(s));
    else localStorage.removeItem(SESSION_KEY);
  } catch {
    // ignore
  }
}

export function getSession(): AuthSession | null {
  return session;
}

function toSession(data: any): AuthSession {
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: data.expires_at || Math.floor(Date.now() / 1000) + (data.expires_in || 3600),
    email: data.user?.email || ''
  };
}

async function parseError(res: Response): Promise<ApiError> {
  let msg = `Сервер катасы (${res.status})`;
  try {
    const body = await res.json();
    msg = body.message || body.msg || body.error_description || body.error || msg;
  } catch {
    // ignore
  }
  return new ApiError(translateError(msg, res.status), res.status);
}

function translateError(msg: string, status: number): string {
  if (/Invalid login credentials/i.test(msg)) return 'Email же сырсөз туура эмес.';
  if (/Email not confirmed/i.test(msg)) return 'Email ырастала элек. Supabase панелинен колдонуучуну ырастаңыз.';
  if (/Password should be at least/i.test(msg)) return 'Сырсөз кеминде 6 белгиден турушу керек.';
  if (/rate limit|too many/i.test(msg)) return 'Өтө көп аракет. Бир аздан кийин кайра аракет кылыңыз.';
  if (/row-level security|permission denied/i.test(msg) || status === 401 || status === 403) {
    return 'Уруксат жок. Админ катары кайра кириңиз.';
  }
  if (/Could not find the function|relation .* does not exist|schema cache/i.test(msg)) {
    return 'Маалымат базасы даяр эмес: supabase/schema.sql файлын Supabase\'те иштетиңиз.';
  }
  return msg;
}

async function refreshSession(): Promise<AuthSession | null> {
  if (!session) return null;
  if (!refreshing) {
    refreshing = (async () => {
      try {
        const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
          method: 'POST',
          headers: { apikey: SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: session!.refresh_token })
        });
        if (!res.ok) {
          saveSession(null);
          return null;
        }
        const s = toSession(await res.json());
        saveSession(s);
        return s;
      } catch {
        return session; // тармак жок — эски токен менен аракет кылабыз
      } finally {
        refreshing = null;
      }
    })();
  }
  return refreshing;
}

async function authHeader(): Promise<string> {
  if (session && session.expires_at - 60 < Date.now() / 1000) {
    await refreshSession();
  }
  return `Bearer ${session ? session.access_token : SUPABASE_ANON_KEY}`;
}

// ---------- Негизги сурам ----------
async function request<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${SUPABASE_URL}${path}`, {
      ...init,
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: await authHeader(),
        'Content-Type': 'application/json',
        ...(init.headers || {})
      }
    });
  } catch {
    throw new ApiError('Сервер менен байланыш жок. Интернетти текшериңиз.', 0);
  }

  // Токендин мөөнөтү бүтсө — бир жолу жаңыртып кайталайбыз
  if (res.status === 401 && retry && session) {
    const s = await refreshSession();
    if (s) return request<T>(path, init, false);
  }
  if (!res.ok) throw await parseError(res);
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

// ---------- REST (таблицалар) ----------
export const db = {
  select<T>(table: string, query = 'select=*'): Promise<T[]> {
    return request<T[]>(`/rest/v1/${table}?${query}`);
  },
  upsert(table: string, rows: object | object[]): Promise<void> {
    return request<void>(`/rest/v1/${table}`, {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify(rows)
    });
  },
  insert(table: string, rows: object | object[]): Promise<void> {
    return request<void>(`/rest/v1/${table}`, {
      method: 'POST',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify(rows)
    });
  },
  update(table: string, filter: string, values: object): Promise<void> {
    return request<void>(`/rest/v1/${table}?${filter}`, {
      method: 'PATCH',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify(values)
    });
  },
  rpc<T>(fn: string, args: object = {}): Promise<T> {
    return request<T>(`/rest/v1/rpc/${fn}`, { method: 'POST', body: JSON.stringify(args) });
  }
};

// ---------- Кирүү (Supabase Auth) ----------
export const auth = {
  async signIn(email: string, password: string): Promise<AuthSession> {
    let res: Response;
    try {
      res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: { apikey: SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password })
      });
    } catch {
      throw new ApiError('Сервер менен байланыш жок. Интернетти текшериңиз.', 0);
    }
    if (!res.ok) throw await parseError(res);
    const s = toSession(await res.json());
    saveSession(s);
    return s;
  },

  async signOut(): Promise<void> {
    const s = session;
    saveSession(null);
    if (!s) return;
    try {
      await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
        method: 'POST',
        headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${s.access_token}` }
      });
    } catch {
      // ignore
    }
  },

  async changePassword(newPassword: string): Promise<void> {
    await request<void>('/auth/v1/user', { method: 'PUT', body: JSON.stringify({ password: newPassword }) });
  },

  async sendPasswordReset(email: string): Promise<void> {
    await request<void>('/auth/v1/recover', { method: 'POST', body: JSON.stringify({ email: email.trim() }) });
  }
};
