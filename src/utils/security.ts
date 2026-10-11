// Администратордун сырсөзүн ачык текст катары эмес, SHA-256 хэш катары сактоо үчүн жардамчы функциялар.
// Эскертүү: сервер жок болгондуктан бул толук коргоо эмес — бирок сырсөз экранда,
// localStorage'да жана баштапкы коддо ачык көрүнбөйт.

export const HASH_PREFIX = 'sha256:';

// Баштапкы сырсөз "1234" — биринчи киргенден кийин сөзсүз алмаштыруу керек.
// Өз сырсөзүңүздү .env файлында VITE_ADMIN_PIN_HASH аркылуу берсеңиз болот.
export const DEFAULT_ADMIN_PIN_HASH =
  'sha256:03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4';

export const isHashed = (value: string) => value.startsWith(HASH_PREFIX);

export async function hashPin(pin: string): Promise<string> {
  const data = new TextEncoder().encode(pin.trim());
  const digest = await crypto.subtle.digest('SHA-256', data);
  const hex = Array.from(new Uint8Array(digest))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  return HASH_PREFIX + hex;
}

export async function verifyPin(pin: string, stored: string): Promise<boolean> {
  if (!pin.trim()) return false;
  // Эски версиядан калган ачык сырсөз (миграция үчүн)
  if (!isHashed(stored)) return pin.trim() === stored;
  return (await hashPin(pin)) === stored;
}

export const MIN_PIN_LENGTH = 6;
export const MAX_LOGIN_ATTEMPTS = 5;
export const LOCKOUT_MS = 60_000;
