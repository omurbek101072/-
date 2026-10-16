import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { EditableText } from './EditableText';
import { T, SectionEditButton } from './AdminInline';
import { downloadDocument, DOC_MISSING_MESSAGE } from '../utils/documents';
import { Mountain, Calculator, FileText, CheckCircle2, Download, ExternalLink, ShieldCheck, MapPin, Compass, AlertCircle, ArrowRight } from 'lucide-react';

interface PastureSectionProps {
  onDirectPayment: (serviceType: 'pasture', amount: number, details: string) => void;
}

export const PastureSection: React.FC<PastureSectionProps> = ({ onDirectPayment }) => {
  const { pastureZones, tariffs, siteSettings, content } = useApp();
  const report = content.pastureReport;

  // Calculator state
  const [cattleCount, setCattleCount] = useState<number>(3); // уй
  const [horsesCount, setHorsesCount] = useState<number>(2); // жылкы
  const [sheepCount, setSheepCount] = useState<number>(30); // кой-эчки
  const [yaksCount, setYaksCount] = useState<number>(0); // топоз
  const [periodType, setPeriodType] = useState<'season' | 'monthly'>('season'); // season is 5 months
  const [selectedZone, setSelectedZone] = useState<string>(pastureZones[0]?.name || 'Үч-Эмчек жайлоосу');
  const [herderName, setHerderName] = useState<string>('');

  // Tariff rates (сом)
  const cattleRate = periodType === 'season' ? tariffs.pastureCattleSeason : tariffs.pastureCattleMonth;
  const horsesRate = periodType === 'season' ? tariffs.pastureHorseSeason : tariffs.pastureHorseMonth;
  const sheepRate = periodType === 'season' ? tariffs.pastureSheepSeason : tariffs.pastureSheepMonth;
  const yaksRate = periodType === 'season' ? tariffs.pastureYakSeason : tariffs.pastureYakMonth;

  const totalAmount =
    cattleCount * cattleRate +
    horsesCount * horsesRate +
    sheepCount * sheepRate +
    yaksCount * yaksRate;

  const totalLivestockUnits =
    cattleCount * 1 +
    horsesCount * 1.2 +
    sheepCount * 0.2 +
    yaksCount * 0.8;

  const handlePayTicket = () => {
    const details = `Жайыт билети (${selectedZone}): ${cattleCount} уй, ${horsesCount} жылкы, ${sheepCount} кой${yaksCount > 0 ? `, ${yaksCount} топоз` : ''} [${periodType === 'season' ? 'Толук жайлоо сезону (5 ай)' : '1 айлык'}]`;
    onDirectPayment('pasture', totalAmount, details);
  };

  const [activeReportTab, setActiveReportTab] = useState<'works' | 'finances'>('works');
  const [reportModalOpen, setReportModalOpen] = useState<boolean>(false);
  const [downloadSuccessNotice, setDownloadSuccessNotice] = useState<string | null>(null);

  const handleDownloadReport = async () => {
    if (/^https?:\/\//.test(report.pdfUrl)) {
      window.open(report.pdfUrl, '_blank', 'noopener');
      return;
    }
    const ok = await downloadDocument(report.pdfUrl, `${report.title}.pdf`);
    setDownloadSuccessNotice(ok ? 'Отчет файлы жүктөлүп жатат.' : DOC_MISSING_MESSAGE);
    setTimeout(() => setDownloadSuccessNotice(null), 5000);
  };

  return (
    <section id="pasture" className="py-14 bg-stone-50 border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Section Header with Kyrgyz pasture banner image */}
        <div className="relative rounded-3xl overflow-hidden bg-stone-900 text-white mb-10 shadow-lg">
          <img
            src={content.images.pasture}
            alt="Кыргыз жайлоосу жана жайыттары"
            referrerPolicy="no-referrer"
            className="w-full h-56 sm:h-80 object-cover object-center"
          />
          {/* Ылдый жагын гана күңүрттөйбүз (аталыш окулушу үчүн), калганы тунук */}
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950/85 via-stone-950/25 to-transparent" />
          <div className="absolute top-3 right-3 z-10">
            <SectionEditButton tab="home" label="Сүрөттү алмаштыруу" title="Сүрөттөр" />
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1">
              <Mountain className="w-4 h-4" />
              <span>{siteSettings.municipalityName} · Жайыт пайдалануучулар бирикмеси</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              <EditableText settingKey="pastureSectionTitle" label="Жайыт бөлүмү башкы аталышы" />
            </h2>
            <p className="text-xs sm:text-sm text-stone-300 mt-1 max-w-2xl">
              <EditableText settingKey="pastureSectionSubtitle" multiline label="Жайыт бөлүмү түшүндүрмөсү" />
            </p>
          </div>
        </div>

        {downloadSuccessNotice && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-between text-xs font-semibold">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{downloadSuccessNotice}</span>
            </div>
            <button onClick={() => setDownloadSuccessNotice(null)} className="text-stone-500 hover:text-stone-800">
              <T>Жабуу</T>
            </button>
          </div>
        )}

        {/* 2-Column Split: Calculator & Pasture Ticket (Left) and Pasture Zones (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-12">
          {/* Interactive Calculator (7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-2xl p-6 sm:p-7 border border-stone-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-stone-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-emerald-700" />
                  <span><T>Жайыт акысын эсептөө</T></span>
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  <T>Айылдык кеңеш бекиткен тарифтер боюнча</T>
                </p>
              </div>

              {/* Period selector */}
              <div className="flex items-center p-1 bg-stone-100 rounded-lg text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setPeriodType('season')}
                  className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                    periodType === 'season'
                      ? 'bg-white text-stone-900 font-bold shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <T>Жайлоо сезону (5 ай)</T>
                </button>
                <button
                  type="button"
                  onClick={() => setPeriodType('monthly')}
                  className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                    periodType === 'monthly'
                      ? 'bg-white text-stone-900 font-bold shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  1 айлык
                </button>
              </div>
            </div>

            {/* Livestock Head Counters */}
            <div className="space-y-4">
              {/* Cattle */}
              <div className="p-3.5 rounded-xl border border-stone-200 bg-stone-50/60 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-stone-900"><T>Бодо мал (уй, бука, өгүз)</T></div>
                  <div className="text-[11px] text-stone-500">
                    <T>Тариф:</T> <strong className="font-mono text-emerald-800">{cattleRate} сом</strong> / 1 баш
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCattleCount(Math.max(0, cattleCount - 1))}
                    className="w-8 h-8 rounded-lg bg-white border border-stone-300 text-stone-700 font-bold hover:bg-stone-100 flex items-center justify-center cursor-pointer"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="0"
                    value={cattleCount}
                    onChange={(e) => setCattleCount(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-16 text-center py-1 bg-white border border-stone-300 rounded-lg font-bold font-mono text-stone-900 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setCattleCount(cattleCount + 1)}
                    className="w-8 h-8 rounded-lg bg-white border border-stone-300 text-stone-700 font-bold hover:bg-stone-100 flex items-center justify-center cursor-pointer"
                  >
                    +
                  </button>
                  <span className="w-20 text-right font-mono font-bold text-stone-800 text-xs tabular-nums">
                    {(cattleCount * cattleRate).toLocaleString('ru-RU')} с.
                  </span>
                </div>
              </div>

              {/* Horses */}
              <div className="p-3.5 rounded-xl border border-stone-200 bg-stone-50/60 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-stone-900"><T>Жылкы (айгыр, бээ, байтал)</T></div>
                  <div className="text-[11px] text-stone-500">
                    <T>Тариф:</T> <strong className="font-mono text-emerald-800">{horsesRate} сом</strong> / 1 баш
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setHorsesCount(Math.max(0, horsesCount - 1))}
                    className="w-8 h-8 rounded-lg bg-white border border-stone-300 text-stone-700 font-bold hover:bg-stone-100 flex items-center justify-center cursor-pointer"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="0"
                    value={horsesCount}
                    onChange={(e) => setHorsesCount(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-16 text-center py-1 bg-white border border-stone-300 rounded-lg font-bold font-mono text-stone-900 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setHorsesCount(horsesCount + 1)}
                    className="w-8 h-8 rounded-lg bg-white border border-stone-300 text-stone-700 font-bold hover:bg-stone-100 flex items-center justify-center cursor-pointer"
                  >
                    +
                  </button>
                  <span className="w-20 text-right font-mono font-bold text-stone-800 text-xs tabular-nums">
                    {(horsesCount * horsesRate).toLocaleString('ru-RU')} с.
                  </span>
                </div>
              </div>

              {/* Sheep & Goats */}
              <div className="p-3.5 rounded-xl border border-stone-200 bg-stone-50/60 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-stone-900"><T>Кой-эчки</T></div>
                  <div className="text-[11px] text-stone-500">
                    <T>Тариф:</T> <strong className="font-mono text-emerald-800">{sheepRate} сом</strong> / 1 баш
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSheepCount(Math.max(0, sheepCount - 5))}
                    className="w-8 h-8 rounded-lg bg-white border border-stone-300 text-stone-700 font-bold hover:bg-stone-100 flex items-center justify-center cursor-pointer"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="0"
                    value={sheepCount}
                    onChange={(e) => setSheepCount(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-16 text-center py-1 bg-white border border-stone-300 rounded-lg font-bold font-mono text-stone-900 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setSheepCount(sheepCount + 5)}
                    className="w-8 h-8 rounded-lg bg-white border border-stone-300 text-stone-700 font-bold hover:bg-stone-100 flex items-center justify-center cursor-pointer"
                  >
                    +
                  </button>
                  <span className="w-20 text-right font-mono font-bold text-stone-800 text-xs tabular-nums">
                    {(sheepCount * sheepRate).toLocaleString('ru-RU')} с.
                  </span>
                </div>
              </div>

              {/* Yaks */}
              <div className="p-3.5 rounded-xl border border-stone-200 bg-stone-50/60 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-stone-900"><T>Топоз</T></div>
                  <div className="text-[11px] text-stone-500">
                    <T>Тариф:</T> <strong className="font-mono text-emerald-800">{yaksRate} сом</strong> / 1 баш
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setYaksCount(Math.max(0, yaksCount - 1))}
                    className="w-8 h-8 rounded-lg bg-white border border-stone-300 text-stone-700 font-bold hover:bg-stone-100 flex items-center justify-center cursor-pointer"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="0"
                    value={yaksCount}
                    onChange={(e) => setYaksCount(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-16 text-center py-1 bg-white border border-stone-300 rounded-lg font-bold font-mono text-stone-900 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setYaksCount(yaksCount + 1)}
                    className="w-8 h-8 rounded-lg bg-white border border-stone-300 text-stone-700 font-bold hover:bg-stone-100 flex items-center justify-center cursor-pointer"
                  >
                    +
                  </button>
                  <span className="w-20 text-right font-mono font-bold text-stone-800 text-xs tabular-nums">
                    {(yaksCount * yaksRate).toLocaleString('ru-RU')} с.
                  </span>
                </div>
              </div>
            </div>

            {/* Pasture Zone Selection */}
            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1">
                <T>Жайлоону тандаңыз:</T>
              </label>
              <select
                value={selectedZone}
                onChange={(e) => setSelectedZone(e.target.value)}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              >
                {pastureZones.map(z => (
                  <option key={z.id} value={z.name}>
                    {z.name} ({z.elevation}, {z.season} жайыт)
                  </option>
                ))}
              </select>
            </div>

            {/* Summary Box & Action */}
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200/90 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <span className="text-[11px] uppercase tracking-wider text-emerald-800 font-semibold block">
                  <T>Жайыт билетинин суммасы</T>
                </span>
                <div className="text-2xl font-extrabold text-emerald-950 font-mono tabular-nums mt-0.5">
                  {totalAmount.toLocaleString('ru-RU')} сом
                </div>
                <div className="text-[11px] text-stone-600 mt-0.5">
                  <T>Шартуу мал башы:</T> {totalLivestockUnits.toFixed(1)} балл
                </div>
              </div>

              <button
                type="button"
                onClick={handlePayTicket}
                className="w-full sm:w-auto px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <span><T>Билет алуу</T></span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Pasture Zones List & Ecological Health (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm">
              <h3 className="text-sm font-bold text-stone-900 mb-3 flex items-center gap-2">
                <Compass className="w-4 h-4 text-emerald-700" />
                <span><T>Жайыттар</T></span>
              </h3>
              <p className="text-xs text-stone-500 mb-4">
                <T>Ар бир жайытка канча мал батарын жана анын абалын караңыз:</T>
              </p>

              <div className="space-y-3">
                {pastureZones.map(zone => {
                  const percent = Math.round((zone.currentGrazingHeads / zone.capacityHeads) * 100);
                  return (
                    <div
                      key={zone.id}
                      onClick={() => setSelectedZone(zone.name)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                        selectedZone === zone.name
                          ? 'border-emerald-600 bg-emerald-50/50 shadow-xs'
                          : 'border-stone-200 hover:border-stone-300 bg-stone-50/40'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-xs font-bold text-stone-900">{zone.name}</h4>
                          <span className="text-[10px] text-stone-500 block mt-0.5">
                            <T>Бийиктиги:</T> {zone.elevation} · {zone.season} жайыт
                          </span>
                        </div>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                          zone.condition === 'Жакшы' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {zone.condition}
                        </span>
                      </div>

                      {/* Capacity progress */}
                      <div className="mt-3">
                        <div className="flex justify-between text-[10px] text-stone-500 mb-1">
                          <span><T>Жүктөм:</T> {zone.currentGrazingHeads} / {zone.capacityHeads} баш</span>
                          <span className="font-mono font-bold text-stone-700">{percent}%</span>
                        </div>
                        <div className="w-full bg-stone-200 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              percent > 85 ? 'bg-amber-500' : 'bg-emerald-600'
                            }`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>

                      <div className="mt-2 text-[10px] text-stone-500 flex justify-between">
                        <span>Суу: {zone.waterSources}</span>
                        <span className="text-stone-400 font-medium"><T>Жооптуу:</T> {zone.manager}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick rules banner */}
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 space-y-1">
              <span className="font-bold block"><T>Эскертүү:</T></span>
              <p className="text-[11px] leading-relaxed">
                <T>Малды жайытка билетсиз чыгарууга болбойт. Билетсиз жайылган мал үчүн ээсине айып салынышы мүмкүн (КР «Жайыттар жөнүндө» Мыйзамы).</T>
              </p>
            </div>
          </div>
        </div>

        {/* Pasture Committee Financial & Operational Reports (Жайыт комитетинин отчеттору) */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-100 pb-6 mb-6">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 uppercase tracking-wider">
                <FileText className="w-4 h-4" />
                <span><T>Ачык отчет</T></span>
              </div>
              <h3 className="text-xl font-bold text-stone-900 mt-1">{report.title}</h3>
              <SectionEditButton tab="pasture" label="Жайыт отчетун өзгөртүү" title="Жайыт отчету" className="mt-2" />
              <p className="text-xs text-stone-500 mt-1 max-w-2xl whitespace-pre-line">{report.intro}</p>
            </div>

            {/* Download Main PDF */}
            {report.pdfUrl && (
            <button
              type="button"
              onClick={handleDownloadReport}
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors cursor-pointer shrink-0"
            >
              <Download className="w-4 h-4 text-emerald-700" />
              <span>{report.pdfLabel}</span>
            </button>
            )}
          </div>

          {/* Metric KPI cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80">
              <span className="text-[11px] uppercase tracking-wider text-stone-500 font-semibold block">
                {report.collectedLabel}
              </span>
              <div className="text-2xl font-extrabold text-emerald-700 font-mono tabular-nums mt-1">
                {(Number(report.collected) || 0).toLocaleString('ru-RU')} сом
              </div>
              <p className="text-[11px] text-stone-500 mt-1">{report.collectedNote}</p>
            </div>

            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80">
              <span className="text-[11px] uppercase tracking-wider text-stone-500 font-semibold block">
                {report.spentLabel}
              </span>
              <div className="text-2xl font-extrabold text-stone-900 font-mono tabular-nums mt-1">
                {(Number(report.spent) || 0).toLocaleString('ru-RU')} сом
              </div>
              <p className="text-[11px] text-emerald-700 font-medium mt-1">
                {Number(report.collected) - Number(report.spent) >= 0
                  ? `Калдык: ${(Number(report.collected) - Number(report.spent)).toLocaleString('ru-RU')} сом. `
                  : ''}
                {report.spentNote}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80">
              <span className="text-[11px] uppercase tracking-wider text-stone-500 font-semibold block">
                {report.worksLabel}
              </span>
              <div className="text-2xl font-extrabold text-indigo-700 font-mono tabular-nums mt-1">
                {report.worksValue}
              </div>
              <p className="text-[11px] text-stone-500 mt-1">{report.worksNote}</p>
            </div>
          </div>

          {/* Breakdown of Completed Works */}
          <div>
            <h4 className="text-sm font-bold text-stone-900 mb-3">
              {report.worksTitle}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {report.works.map((work, idx) => (
                <div key={work.id} className="p-4 rounded-xl border border-stone-200 bg-stone-50/50 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h5 className="font-bold text-xs text-stone-900 leading-snug">
                        {work.title}
                      </h5>
                      <span className="font-mono font-bold text-emerald-800 text-xs shrink-0 tabular-nums">
                        {(Number(work.cost) || 0).toLocaleString('ru-RU')} сом
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-600 mt-1.5 leading-relaxed">
                      {work.description}
                    </p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-stone-200/60 flex items-center justify-between text-[10px] text-stone-400">
                    <span>№ {idx + 1}</span>
                    <span className="text-emerald-700 font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <T>Аткарылды жана кабыл алынды</T>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
