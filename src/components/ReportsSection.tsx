import React, { useState } from 'react';
import { EditableText } from './EditableText';
import { downloadDocument, DOC_MISSING_MESSAGE } from '../utils/documents';
import { FileText, Download, CheckCircle2, TrendingUp, BarChart3, AlertCircle, Calendar, ShieldCheck } from 'lucide-react';

export const ReportsSection: React.FC = () => {
  const [downloadNotice, setDownloadNotice] = useState<string | null>(null);

  const handleDownload = async (fileName: string, path: string) => {
    const ok = await downloadDocument(path, fileName);
    setDownloadNotice(ok ? `«${fileName}» файлы жүктөлүп жатат.` : DOC_MISSING_MESSAGE);
    setTimeout(() => setDownloadNotice(null), 5000);
  };

  const newsItems = [
    {
      date: '10-Октябрь, 2026',
      title: 'Күзгү санитардык тазалоо жана жазгы суу түтүктөрүн жылуулоо иштери башталды',
      desc: 'Айыл өкмөтү жана «Тазалык» ишканасы кышкы мезгилге даярдык көрүү максатында көчөлөрдү тазалоо жана суу колонкаларын тоңуудан сактоо иш-чараларын өткөрүүдө.'
    },
    {
      date: '02-Октябрь, 2026',
      title: 'Үч-Эмчек жайлоосунан малдарды түшүрүү жана жайыт отчетун кабыл алуу жыйыны',
      desc: 'Жайыт комитетинин 2026-жылкы жайлоо сезону боюнча жыйынтыктоочу чогулушу айылдык клубда өтүп, малчылардын жана тургундардын сунуштары угулду.'
    },
    {
      date: '25-Сентябрь, 2026',
      title: 'Жаңы XCMG чынжыр тамандуу экскаватор ишке киргизилди',
      desc: 'Айыл өкмөттүн өнүктүрүү фонду тарабынан сатылып алынган заманбап экскаватор эми тургундардын арык казуу жана курулуш иштерине толук кызмат көрсөтөт.'
    }
  ];

  return (
    <section id="reports" className="py-14 bg-stone-50 border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Title */}
        <div className="max-w-3xl mb-10">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 uppercase tracking-wider">
            <FileText className="w-4 h-4" />
            <span>Ачык өкмөт · Финансылык айкындуулук</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 mt-1" style={{ textWrap: 'balance' }}>
            <EditableText settingKey="reportsSectionTitle" label="Отчеттор бөлүмү башкы аталышы" />
          </h2>
          <p className="text-sm text-stone-600 mt-2">
            <EditableText settingKey="reportsSectionSubtitle" multiline label="Отчеттор бөлүмү түшүндүрмөсү" />
          </p>
        </div>

        {downloadNotice && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-between text-xs font-semibold">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{downloadNotice}</span>
            </div>
            <button onClick={() => setDownloadNotice(null)} className="text-stone-500 hover:text-stone-800">
              Жабуу
            </button>
          </div>
        )}

        {/* 2-Column: Financial Transparency (Left) and Official Documents / News (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Financial Transparency Overview (7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-2xl p-6 sm:p-7 border border-stone-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-stone-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-stone-900">
                  2025-2026-жж. Бюджеттин аткарылышы
                </h3>
                <span className="text-xs text-stone-500">
                  Жалпы кирешелер жана коммуналдык тейлөө чыгашалары
                </span>
              </div>
              <span className="text-[11px] font-mono font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md">
                Аудиттен өткөн
              </span>
            </div>

            {/* Income breakdown bar simulation */}
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-semibold text-stone-800 mb-1">
                  <span>Таза суу төлөмдөрү (водомер + калк)</span>
                  <span className="font-mono text-emerald-700">1,820,000 сом (42%)</span>
                </div>
                <div className="w-full bg-stone-100 rounded-full h-2">
                  <div className="bg-cyan-600 h-2 rounded-full" style={{ width: '42%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-stone-800 mb-1">
                  <span>Жайыт пайдалануу жыйымдары</span>
                  <span className="font-mono text-emerald-700">1,485,600 сом (34%)</span>
                </div>
                <div className="w-full bg-stone-100 rounded-full h-2">
                  <div className="bg-amber-600 h-2 rounded-full" style={{ width: '34%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-stone-800 mb-1">
                  <span>Катуу калдыктар (таштанды ташуу)</span>
                  <span className="font-mono text-emerald-700">540,000 сом (13%)</span>
                </div>
                <div className="w-full bg-stone-100 rounded-full h-2">
                  <div className="bg-emerald-600 h-2 rounded-full" style={{ width: '13%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-stone-800 mb-1">
                  <span>Атайын техниканы ижарага берүүдөн түшкөн киреше</span>
                  <span className="font-mono text-emerald-700">460,000 сом (11%)</span>
                </div>
                <div className="w-full bg-stone-100 rounded-full h-2">
                  <div className="bg-indigo-600 h-2 rounded-full" style={{ width: '11%' }} />
                </div>
              </div>
            </div>

            {/* Totals */}
            <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between text-xs">
              <div>
                <span className="text-stone-500 block text-[11px]">Жалпы жылдык жыйым:</span>
                <span className="text-xl font-extrabold text-stone-900 font-mono tabular-nums">
                  4,305,600 сом
                </span>
              </div>
              <div className="text-right">
                <span className="text-stone-500 block text-[11px]">Инфраструктурага сарпталган:</span>
                <span className="text-sm font-bold text-emerald-800 font-mono tabular-nums">
                  3,980,200 сом (92.4%)
                </span>
              </div>
            </div>

            {/* Official Files download grid */}
            <div>
              <h4 className="text-xs font-bold text-stone-900 mb-2">
                Жүктөп алууга жеткиликтүү расмий документтер:
              </h4>
              <div className="space-y-2">
                {[
                  { name: '«Тазалык» МИ 2025-жылдык толук финансылык отчету.pdf', file: '/docs/finansy-otchet-2025.pdf' },
                  { name: 'Айылдык Кеңештин тарифтер жөнүндө Токтому (№14-2026).pdf', file: '/docs/tarif-toktom-14-2026.pdf' },
                  { name: 'Жайыт пайдалануучулар бирикмесинин планы жана сметасы.pdf', file: '/docs/jayyt-plan-smeta.pdf' }
                ].map((doc, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl border border-stone-200 bg-stone-50/50 flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FileText className="w-4 h-4 text-emerald-700 shrink-0" />
                      <div className="min-w-0">
                        <span className="font-medium text-stone-900 block truncate sm:max-w-md">
                          {doc.name}
                        </span>
                        <span className="text-[10px] text-stone-400 font-mono">PDF</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDownload(doc.name, doc.file)}
                      className="px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-white border border-stone-200 rounded-lg hover:bg-emerald-50 transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Жүктөө</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* News & Announcements (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm space-y-4">
              <div className="border-b border-stone-100 pb-3">
                <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-700" />
                  <span>Кулактандыруулар жана жаңылыктар</span>
                </h3>
              </div>

              <div className="space-y-4">
                {newsItems.map((item, i) => (
                  <div key={i} className="border-b border-stone-100 pb-4 last:border-b-0 last:pb-0">
                    <span className="text-[10px] font-mono text-emerald-700 font-semibold block">
                      {item.date}
                    </span>
                    <h4 className="text-xs font-bold text-stone-900 mt-0.5 leading-snug">
                      {item.title}
                    </h4>
                    <p className="text-[11px] text-stone-500 mt-1 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Public Reception Hotline Card */}
            <div className="p-5 rounded-2xl bg-emerald-950 text-white text-xs space-y-3">
              <span className="text-[11px] text-emerald-400 font-semibold uppercase tracking-wider block">
                Коомдук кабыл алуу жана байланыш
              </span>
              <p className="text-stone-300 leading-relaxed text-xs">
                Жарандардын арыздары жана сунуштары боюнча ишкананын жетекчиси аптанын шаршемби күндөрү саат 10:00дөн 13:00гө чейин жеке кабыл алат.
              </p>
              <div className="pt-2 border-t border-emerald-900 font-mono text-emerald-200 text-xs">
                Дарек: Айыл өкмөтүнүн имараты, 1-кабат, 104-кабинет
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
