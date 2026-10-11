// Расмий документтерди (PDF) жүктөө.
// Файлдарды долбоордун public/docs/ папкасына салыңыз — алар сайтта /docs/... дареги менен ачылат.
// Файл жок болсо, жасалма "жүктөлдү" билдирүүсүнүн ордуна чынчыл жооп кайтарабыз.
export async function downloadDocument(path: string, displayName: string): Promise<boolean> {
  try {
    const res = await fetch(path, { method: 'HEAD' });
    const type = res.headers.get('content-type') || '';
    // Vite жана көп хостингдер жок файлга index.html (200) кайтарат — ошону текшеребиз
    if (!res.ok || type.includes('text/html')) return false;

    const a = document.createElement('a');
    a.href = path;
    a.download = displayName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    return true;
  } catch {
    return false;
  }
}

export const DOC_MISSING_MESSAGE =
  'Бул документ азырынча сайтка жүктөлө элек. Ишкананын кеңсесине кайрылыңыз.';
