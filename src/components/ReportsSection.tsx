import React, { useState } from 'react';
import { EditableText } from './EditableText';
import { T, SectionEditButton } from './AdminInline';
import { downloadDocument, DOC_MISSING_MESSAGE } from '../utils/documents';
import { useApp } from '../context/AppContext';
import { FileText, Download, CheckCircle2, TrendingUp, BarChart3, AlertCircle, Calendar, ShieldCheck } from 'lucide-react';

export const ReportsSection: React.FC = () => {
  const [downloadNotice, setDownloadNotice] = useState<string | null>(null);

  const handleDownload = async (fileName: string, path: string) => {
    const ok = await downloadDocument(path, fileName);
    setDownloadNotice(ok ? `«${fileName}» файлы жүктөлүп жатат.` : DOC_MISSING_MESSAGE);
    setTimeout(() => setDownloadNotice(null), 5000);
  };

  const { content } = useApp();
  const { news, documents, budget, reception } = content;
  const total = budget.items.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
  const pct = (n: number) => (total > 0 ? Math.round(((Number(n) || 0) / total) * 1000) / 10 : 0);
  const barColor: Record<string, string> = {
    cyan: 'bg-cyan-600', amber: 'bg-amber-600', emerald: 'bg-emerald-600',
    indigo: 'bg-indigo-600', rose: 'bg-rose-600', stone: 'bg-stone-500'
  };
  const isExternal = (url: string) => /^https?:\/\//.test(url);

  return (
    <section id="reports" className="py-14 bg-stone-50 border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Title */}
        <div className="max-w-3xl mb-10">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 uppercase tracking-wider">
            <FileText className="w-4 h-4" />
            <span><T>Ачык өкмөт · Финансылык айкындуулук</T></span>
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
              <T>Жабуу</T>
            </button>
          </div>
        )}

        {/* 2-Column: Financial Transparency (Left) and Official Documents / News (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Financial Transparency Overview (7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-2xl p-6 sm:p-7 border border-stone-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-stone-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-stone-900">{budget.title}</h3>
                <span className="text-xs text-stone-500">{budget.subtitle}</span>
              </div>
              <SectionEditButton tab="budget" label="Бюджетти өзгөртүү" title="Бюджет жана коомдук кабыл алуу" />
              {budget.badge && (
                <span className="text-[11px] font-mono font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md">
                  {budget.badge}
                </span>
              )}
            </div>

            {/* Income breakdown bars */}
            <div className="space-y-4">
              {budget.items.map(item => (
                <div key={item.id}>
                  <div className="flex justify-between gap-3 text-xs font-semibold text-stone-800 mb-1">
                    <span>{item.label}</span>
                    <span className="font-mono text-emerald-700 shrink-0">
                      {(Number(item.amount) || 0).toLocaleString('ru-RU')} сом ({pct(item.amount)}%)
                    </span>
                  </div>
                  <div className="w-full bg-stone-100 rounded-full h-2">
                    <div className={`${barColor[item.color] || 'bg-emerald-600'} h-2 rounded-full`} style={{ width: `${pct(item.amount)}%` }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between text-xs">
              <div>
                <span className="text-stone-500 block text-[11px]"><T>Жалпы жылдык жыйым:</T></span>
                <span className="text-xl font-extrabold text-stone-900 font-mono tabular-nums">
                  {total.toLocaleString('ru-RU')} сом
                </span>
              </div>
              <div className="text-right">
                <span className="text-stone-500 block text-[11px]">{budget.spentLabel}:</span>
                <span className="text-sm font-bold text-emerald-800 font-mono tabular-nums">
                  {(Number(budget.spent) || 0).toLocaleString('ru-RU')} сом ({pct(budget.spent)}%)
                </span>
              </div>
            </div>

            {/* Official Files download grid */}
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <h4 className="text-xs font-bold text-stone-900">
                  <T>Жүктөп алууга жеткиликтүү расмий документтер:</T>
                </h4>
                <SectionEditButton tab="documents" label="Документтерди өзгөртүү / PDF кошуу" title="Документтер" />
              </div>
              <div className="space-y-2">
                {documents.length === 0 && <p className="text-[11px] text-stone-400"><T>Азырынча документ жок</T></p>}
                {documents.map((doc, idx) => (
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
                    {isExternal(doc.url) ? (
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-white border border-stone-200 rounded-lg hover:bg-emerald-50 transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span><T>Ачуу</T></span>
                      </a>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleDownload(doc.name + '.pdf', doc.url)}
                        className="px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-white border border-stone-200 rounded-lg hover:bg-emerald-50 transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span><T>Жүктөө</T></span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* News & Announcements (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm space-y-4">
              <div className="border-b border-stone-100 pb-3 flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-700" />
                  <span><T>Кулактандыруулар жана жаңылыктар</T></span>
                </h3>
                <SectionEditButton tab="news" label="Жаңылык кошуу / өзгөртүү" title="Жаңылыктар" />
              </div>

              <div className="space-y-4">
                {news.length === 0 && <p className="text-[11px] text-stone-400"><T>Азырынча жаңылык жок</T></p>}
                {news.map((item) => (
                  <div key={item.id} className="border-b border-stone-100 pb-4 last:border-b-0 last:pb-0">
                    {item.image && (
                      <img src={item.image} alt="" loading="lazy" className="w-full max-h-48 object-cover rounded-lg mb-2 border border-stone-100" />
                    )}
                    <span className="text-[10px] font-mono text-emerald-700 font-semibold block">
                      {item.date}
                    </span>
                    <h4 className="text-xs font-bold text-stone-900 mt-0.5 leading-snug">
                      {item.title}
                    </h4>
                    <p className="text-[11px] text-stone-500 mt-1 leading-relaxed whitespace-pre-line">
                      {item.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Public Reception Hotline Card */}
            <div className="p-5 rounded-2xl bg-emerald-950 text-white text-xs space-y-3">
              <SectionEditButton tab="budget" label="Бул блокту өзгөртүү" title="Бюджет жана коомдук кабыл алуу" />
              <span className="text-[11px] text-emerald-400 font-semibold uppercase tracking-wider block">
                {reception.title}
              </span>
              <p className="text-stone-300 leading-relaxed text-xs whitespace-pre-line">{reception.text}</p>
              {reception.address && (
                <div className="pt-2 border-t border-emerald-900 font-mono text-emerald-200 text-xs">
                  <T>Дарек:</T> {reception.address}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
