import React from 'react';
import { useApp } from '../context/AppContext';
import { Phone } from 'lucide-react';

/** «0 (312) 55-01-20» → «996312550120» */
export const intlPhone = (phone: string) => {
  const d = (phone || '').replace(/\D/g, '');
  return d.startsWith('996') ? d : d.startsWith('0') ? `996${d.slice(1)}` : d;
};

const WhatsAppIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
    <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.6-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3z" />
  </svg>
);

// Сайттын оң жак ылдыйкы бурчундагы «Чалуу» жана «WhatsApp» баскычтары
export const FloatingContact: React.FC = () => {
  const { content, siteSettings } = useApp();
  const c = content.contacts;
  if (!c.showFloating) return null;
  const call = intlPhone(c.callPhone || siteSettings.dispatcherPhone || '');
  const wa = intlPhone(c.whatsapp || '');
  if (call.length < 6 && wa.length < 6) return null;
  const waHref = `https://wa.me/${wa}${c.whatsappMessage ? `?text=${encodeURIComponent(c.whatsappMessage)}` : ''}`;

  return (
    <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-2.5 print:hidden" data-floating-contact>
      {wa.length >= 6 && (
        <a
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="WhatsApp аркылуу жазуу"
          title="WhatsApp аркылуу жазуу"
          className="w-14 h-14 rounded-full bg-[#25D366] hover:bg-[#1ebe5b] text-white shadow-lg shadow-black/20 flex items-center justify-center transition-transform hover:scale-105"
        >
          <WhatsAppIcon className="w-7 h-7" />
        </a>
      )}
      {call.length >= 6 && (
        <a
          href={`tel:+${call}`}
          aria-label="Ишканага чалуу"
          title="Ишканага чалуу"
          className="w-14 h-14 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white shadow-lg shadow-black/20 flex items-center justify-center transition-transform hover:scale-105"
        >
          <Phone className="w-6 h-6" />
        </a>
      )}
    </div>
  );
};
