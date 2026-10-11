// Жеке маалыматтарды ачык беттерде жашыруу үчүн.
// Мисал: "Асанов Бакыт Токтогулович" -> "Асанов Б. Т."
export function maskName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  const [first, ...rest] = parts;
  return [first, ...rest.map(p => `${p[0]}.`)].join(' ');
}

// "+996 (702) 45-88-12" -> "+996 (702) **-**-12"
export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 4) return phone;
  const last2 = digits.slice(-2);
  const code = digits.length >= 12 ? digits.slice(3, 6) : '';
  return code ? `+996 (${code}) **-**-${last2}` : `***-**-${last2}`;
}

// Көчөнүн атын калтырып, үйдүн номерин жашыруу: "Ленин көч. 45" -> "Ленин көч. **"
export function maskAddress(address: string): string {
  return address.replace(/\d+[а-яa-z]?/gi, '**');
}
