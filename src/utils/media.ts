import { uploadMedia } from '../lib/supabase';

// Сүрөттү кичирейтип (макс. maxSize px) JPEG кылуу — жүктөө тез, сайт жеңил болот
export function resizeImage(file: File, maxSize = 1600, quality = 0.82): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Сүрөттү окуу мүмкүн болгон жок. Башка файл тандаңыз.'));
    };
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Сүрөттү иштетүү мүмкүн болгон жок.'));
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(b => (b ? resolve(b) : reject(new Error('Сүрөттү иштетүү мүмкүн болгон жок.'))), 'image/jpeg', quality);
    };
    img.src = url;
  });
}

const stamp = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

// Сүрөт жүктөп, анын ачык дарегин кайтарат
export async function uploadImage(file: File, folder: string): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('Сүрөт файлын тандаңыз (JPG, PNG, WEBP).');
  const blob = await resizeImage(file);
  return uploadMedia(blob, `${folder}/${stamp()}.jpg`, 'image/jpeg');
}

// PDF документ жүктөп, анын ачык дарегин кайтарат
export async function uploadPdf(file: File, folder = 'docs'): Promise<string> {
  if (file.type !== 'application/pdf' && !/\.pdf$/i.test(file.name)) {
    throw new Error('PDF файлын тандаңыз.');
  }
  return uploadMedia(file, `${folder}/${stamp()}.pdf`, 'application/pdf');
}
