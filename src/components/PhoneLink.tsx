import React from 'react';
import { useApp } from '../context/AppContext';

interface PhoneLinkProps {
  phone: string;
  kind?: 'tel' | 'whatsapp';
  children: React.ReactNode;
  className?: string;
}

// Телефон номерин басканда чалуу (же WhatsApp ачуу).
// Админ "түз түзөтүү" режиминде болсо шилтеме өчөт, ошондо текстти оңдоого болот.
export const PhoneLink: React.FC<PhoneLinkProps> = ({ phone, kind = 'tel', children, className = '' }) => {
  const { isEditModeActive } = useApp();
  const digits = phone.replace(/\D/g, '');

  if (isEditModeActive || digits.length < 6) {
    return <>{children}</>;
  }

  // "0 (312) 55-01-20" сыяктуу жергиликтүү номерди эл аралык форматка айлантуу
  const international = digits.startsWith('996') ? digits : digits.startsWith('0') ? `996${digits.slice(1)}` : digits;

  const href = kind === 'whatsapp' ? `https://wa.me/${international}` : `tel:+${international}`;

  return (
    <a
      href={href}
      className={`hover:underline underline-offset-2 ${className}`}
      {...(kind === 'whatsapp' ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
    >
      {children}
    </a>
  );
};
