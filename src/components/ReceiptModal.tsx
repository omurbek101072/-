import React from 'react';
import { PaymentTransaction } from '../types';
import { useApp } from '../context/AppContext';
import { CheckCircle2, Printer, X, Download, ShieldCheck, QrCode } from 'lucide-react';

interface ReceiptModalProps {
  transaction: PaymentTransaction;
  onClose: () => void;
  isDemo?: boolean;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ transaction, onClose, isDemo }) => {
  const { siteSettings } = useApp();
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden border border-stone-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-emerald-800 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <CheckCircle2 className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <h3 className="font-bold text-base tracking-tight">Электрондук төлөм квитанциясы</h3>
              <p className="text-xs text-emerald-200">«Тазалык» муниципалдык ишканасы</p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Жабуу"
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            title="Жабуу"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Area */}
        <div id="printable-receipt" className="p-6 text-stone-800 space-y-5 bg-white">
          <div className="text-center border-b border-dashed border-stone-300 pb-4">
            <span className="text-[11px] font-semibold tracking-wider text-emerald-800 uppercase block">Кыргыз Республикасы · Айыл өкмөтү</span>
            <h2 className="text-lg font-extrabold text-stone-900 mt-0.5">«ТАЗАЛЫК» МУНИЦИПАЛДЫК ИШКАНАСЫ</h2>
            <p className="text-xs text-stone-500 mt-0.5">ИНН: {siteSettings.inn} · ОКПО: {siteSettings.okpo}</p>
            {isDemo && (
              <p className="mt-2 text-[11px] font-bold text-rose-600 uppercase">
                Демо квитанция: чыныгы төлөм эмес
              </p>
            )}
            <div className="inline-block mt-2 px-3 py-1 bg-stone-100 rounded-md text-xs font-mono font-medium text-stone-700">
              Квитанция № {transaction.receiptNumber}
            </div>
          </div>

          {/* Key transaction summary */}
          <div className="bg-stone-50 rounded-xl p-4 border border-stone-200/80 space-y-2.5 text-xs">
            <div className="flex justify-between items-center py-1 border-b border-stone-200">
              <span className="text-stone-500">Төлөм убактысы:</span>
              <span className="font-semibold text-stone-800 font-mono">{transaction.timestamp}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-stone-200">
              <span className="text-stone-500">Төлөөчү:</span>
              <span className="font-semibold text-stone-800">{transaction.payerName}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-stone-200">
              <span className="text-stone-500">Телефон номери:</span>
              <span className="font-mono text-stone-700">{transaction.payerPhone}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-stone-200">
              <span className="text-stone-500">Лицевой эсеп №:</span>
              <span className="font-bold text-stone-900 font-mono text-sm">{transaction.accountId}</span>
            </div>
            <div className="flex justify-between items-start py-1 border-b border-stone-200">
              <span className="text-stone-500">Кызматтын түрү:</span>
              <span className="font-semibold text-emerald-800 text-right max-w-[240px]">{transaction.serviceName}</span>
            </div>
            <div className="flex justify-between items-start py-1 border-b border-stone-200">
              <span className="text-stone-500">Кошумча маалымат:</span>
              <span className="text-stone-700 text-right max-w-[240px]">{transaction.details}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-stone-200">
              <span className="text-stone-500">Төлөм ыкмасы:</span>
              <span className="font-semibold text-stone-800">{transaction.paymentMethod}</span>
            </div>
            <div className="flex justify-between items-center pt-2 text-sm">
              <span className="font-bold text-stone-900">Жалпы төлөнгөн сумма:</span>
              <span className="text-xl font-extrabold text-emerald-700 font-mono tabular-nums">
                {transaction.amount.toLocaleString('ru-RU')} сом
              </span>
            </div>
          </div>

          {/* Verification stamp & QR */}
          <div className="flex items-center justify-between pt-2 border-t border-stone-200">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 bg-stone-100 border border-stone-300 rounded-lg flex flex-col items-center justify-center p-1">
                <QrCode className="w-10 h-10 text-stone-800" />
              </div>
              <div>
                <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Төлөм тастыкталды</span>
                </div>
                <p className="text-[10px] text-stone-500 mt-0.5">
                  Текшерүү коду: <span className="font-mono text-stone-700">{transaction.id}</span>
                </p>
                <p className="text-[10px] text-stone-400">Бул документ расмий финансылык чек болуп саналат.</p>
              </div>
            </div>

            {/* Simulated official seal */}
            <div className="w-16 h-16 rounded-full border-2 border-dashed border-emerald-700/60 flex flex-col items-center justify-center text-center p-1 text-emerald-800 rotate-[-8deg] opacity-85 select-none">
              <span className="text-[7px] font-bold uppercase leading-tight">МУНИЦИПАЛДЫК</span>
              <span className="text-[8px] font-extrabold my-0.5">«ТАЗАЛЫК»</span>
              <span className="text-[6px] font-semibold">МӨӨРҮ</span>
            </div>
          </div>
        </div>

        {/* Modal actions */}
        <div className="p-4 bg-stone-100 border-t border-stone-200 flex items-center justify-between gap-3">
          <p className="text-xs text-stone-500">Чек жеке кабинетте сакталды</p>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-stone-700 bg-white border border-stone-300 rounded-lg hover:bg-stone-50 hover:text-stone-900 transition-colors shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Басып чыгаруу (Печать)</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-700 rounded-lg hover:bg-emerald-800 transition-colors shadow-sm"
            >
              Даяр
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
