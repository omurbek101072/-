// Кыргызстандын телефон номерин текшерүү: +996 жана 9 сан (мис. +996 702 45 88 12)
// же 0 менен башталган 10 сан (мис. 0702 458 812).
export function isValidKgPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('996')) return digits.length === 12;
  if (digits.startsWith('0')) return digits.length === 10;
  return digits.length === 9;
}

export const PHONE_ERROR = 'Телефон номерин толук жазыңыз (мисалы: +996 702 45 88 12).';

// Бүгүнкү күн YYYY-MM-DD форматында (жергиликтүү убакыт боюнча)
export function todayIso(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
