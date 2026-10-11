// Кайталанбай турган, бирок адам окуй ала турган номер жаратуу.
// Мисал: ТЗЛ-261011-4821 (префикс - ЖЖААКК - 4 кокус сан)
export function generateId(prefix: string, existingIds: string[] = []): string {
  const now = new Date();
  const datePart =
    String(now.getFullYear()).slice(-2) +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0');

  const existing = new Set(existingIds.map(id => id.toUpperCase()));
  for (let i = 0; i < 50; i++) {
    const rnd = new Uint32Array(1);
    crypto.getRandomValues(rnd);
    const id = `${prefix}-${datePart}-${String(rnd[0] % 10000).padStart(4, '0')}`;
    if (!existing.has(id.toUpperCase())) return id;
  }
  // Абдан сейрек учур: убакыт белгисин кошобуз
  return `${prefix}-${datePart}-${Date.now().toString().slice(-6)}`;
}

export function nowTimestamp(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  // Жергиликтүү убакыт (toISOString UTC берип, 6 саатка жаңылыштык кетирет)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
