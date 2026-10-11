import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { SiteSettings, INITIAL_SITE_SETTINGS } from '../data/mockData';
import {
  Save,
  RotateCcw,
  Building,
  Type,
  LayoutGrid,
  Phone,
  Landmark,
  KeyRound,
  CheckCircle2,
  Mountain,
  Edit2,
  ShieldCheck,
  Sparkles
} from 'lucide-react';

export const SiteContentEditor: React.FC = () => {
  const { siteSettings, updateSiteSettings, pastureZones, updatePastureZone } = useApp();
  const [formData, setFormData] = useState<SiteSettings>(siteSettings);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [subTab, setSubTab] = useState<'general' | 'hero' | 'sections' | 'contacts' | 'pasture_zones' | 'security'>('general');

  // Pasture zone editing
  const [editingZoneId, setEditingZoneId] = useState<string | null>(null);
  const [zoneFormData, setZoneFormData] = useState<any>({});

  const handleInputChange = (key: keyof SiteSettings, value: string) => {
    setFormData(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSaveAll = (e: React.FormEvent) => {
    e.preventDefault();
    updateSiteSettings(formData);
    setSuccessMessage('Бардык аталыштар жана сайттын маалыматтары ийгиликтүү сакталды!');
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  const handleResetToDefault = () => {
    if (confirm('Бардык аталыштарды баштапкы абалга келтирүүнү каалайсызбы?')) {
      setFormData(INITIAL_SITE_SETTINGS);
      updateSiteSettings(INITIAL_SITE_SETTINGS);
      setSuccessMessage('Баштапкы аталыштар калыбына келтирилди!');
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  const startEditZone = (zone: any) => {
    setEditingZoneId(zone.id);
    setZoneFormData({ ...zone });
  };

  const handleSaveZone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingZoneId) return;
    updatePastureZone(editingZoneId, zoneFormData);
    setEditingZoneId(null);
    setSuccessMessage(`«${zoneFormData.name}» жайытынын маалыматтары жаңыртылды!`);
    setTimeout(() => setSuccessMessage(null), 3500);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-stone-900 flex items-center gap-2">
            <Edit2 className="w-5 h-5 text-amber-600" />
            <span>Сайттын бардык аталыштарын жана мазмунун кол менен өзгөртүү</span>
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Ишкананын, айыл өкмөтүнүн, бөлүмдөрдүн, ураандардын жана кызматтардын аталыштарын каалагандай жазып өзгөртүңүз
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleResetToDefault}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-stone-600 text-xs font-semibold transition-colors cursor-pointer"
            title="Баштапкы тексти калыбына келтирүү"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Баштапкыга келтирүү</span>
          </button>

          <button
            type="button"
            onClick={handleSaveAll}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Сактоо жана сайтта жаңылоо</span>
          </button>
        </div>
      </div>

      {successMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-stone-400 hover:text-stone-700">
            Жабуу
          </button>
        </div>
      )}

      {/* Sub Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 bg-stone-200/80 rounded-xl text-xs font-medium">
        {[
          { id: 'general', label: '1. Ишкана жана Айыл өкмөтү', icon: Building },
          { id: 'hero', label: '2. Башкы бет жана Карточкалар', icon: Sparkles },
          { id: 'sections', label: '3. Бөлүмдөрдүн аталыштары', icon: LayoutGrid },
          { id: 'contacts', label: '4. Байланыш жана Реквизиттер', icon: Phone },
          { id: 'pasture_zones', label: '5. Жайыт зоналары (Жайлоолор)', icon: Mountain },
          { id: 'security', label: '6. Админ PIN-код (Сырсөз)', icon: KeyRound }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = subTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSubTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all cursor-pointer ${
                isActive
                  ? 'bg-white text-stone-900 font-bold shadow-xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100/60'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <form onSubmit={handleSaveAll} className="space-y-6">
        {/* SUBTAB 1: ИШКАНА ЖАНА АЙЫЛ ӨКМӨТҮ */}
        {subTab === 'general' && (
          <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-xs space-y-4 text-xs">
            <div className="border-b border-stone-100 pb-3">
              <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                <Building className="w-4 h-4 text-emerald-700" />
                <span>Ишкананын жана Айыл өкмөтүнүн расмий аталыштары</span>
              </h3>
              <p className="text-[11px] text-stone-500 mt-0.5">
                Сайттын бардык башкы менюсунда, үстүнкү сапта жана подвалда колдонулат
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-stone-700 font-bold mb-1">
                  Ишкананын кыска аталышы:
                </label>
                <input
                  type="text"
                  value={formData.enterpriseName}
                  onChange={(e) => handleInputChange('enterpriseName', e.target.value)}
                  placeholder="Мисалы: «Тазалык» же «Ала-Тоо Тазалык»"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg font-medium text-stone-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
                <p className="text-[10px] text-stone-400 mt-1">Негизги логотипте жана барактарда көрсөтүлөт</p>
              </div>

              <div>
                <label className="block text-stone-700 font-bold mb-1">
                  Ишкананын статусу / кошумча аталышы:
                </label>
                <input
                  type="text"
                  value={formData.enterpriseSubName}
                  onChange={(e) => handleInputChange('enterpriseSubName', e.target.value)}
                  placeholder="Мисалы: Муниципалдык ишканасы"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg font-medium text-stone-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
                <p className="text-[10px] text-stone-400 mt-1">Логотиптин алдындагы кичине жазуу</p>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-stone-700 font-bold mb-1">
                  Караштуу Айыл өкмөтүнүн же аймактын аталышы:
                </label>
                <input
                  type="text"
                  value={formData.municipalityName}
                  onChange={(e) => handleInputChange('municipalityName', e.target.value)}
                  placeholder="Мисалы: Айыл өкмөтү, Ак-Өргөө айыл өкмөтү, ж.б."
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg font-medium text-stone-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
                <p className="text-[10px] text-stone-400 mt-1">Үстүнкү тилкеде жана расмий маалыматтарда жазылат</p>
              </div>
            </div>
          </div>
        )}

        {/* SUBTAB 2: БАШКЫ БЕТ ЖАНА КАРТОЧКАЛАР */}
        {subTab === 'hero' && (
          <div className="space-y-6 text-xs">
            {/* Hero text */}
            <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-xs space-y-4">
              <div className="border-b border-stone-100 pb-3">
                <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                  <Type className="w-4 h-4 text-emerald-700" />
                  <span>Башкы беттин негизги урааны жана тексти (Hero Section)</span>
                </h3>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-stone-700 font-bold mb-1">
                    Башкы сап (Үстүнкү чакан жазуу / Kicker):
                  </label>
                  <input
                    type="text"
                    value={formData.heroKicker}
                    onChange={(e) => handleInputChange('heroKicker', e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg font-medium text-stone-900"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 font-bold mb-1">
                    Негизги чоң ураан (Башкы аталыш H1):
                  </label>
                  <input
                    type="text"
                    value={formData.heroTitle}
                    onChange={(e) => handleInputChange('heroTitle', e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg font-bold text-stone-900"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 font-bold mb-1">
                    Түшүндүрмө текст (Ураандын алдындагы сыпаттама):
                  </label>
                  <textarea
                    rows={3}
                    value={formData.heroSubtitle}
                    onChange={(e) => handleInputChange('heroSubtitle', e.target.value)}
                    className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg font-medium text-stone-900"
                  />
                </div>
              </div>
            </div>

            {/* 4 Service Cards */}
            <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-xs space-y-4">
              <div className="border-b border-stone-100 pb-3">
                <h3 className="text-sm font-bold text-stone-900">
                  Башкы беттеги 4 кызмат карточкаларынын аталыштары
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 1. Water Card */}
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
                  <div className="font-bold text-stone-900 text-[11px] text-cyan-800">1. Таза суу карточкасы</div>
                  <input
                    type="text"
                    value={formData.heroWaterCardTitle}
                    onChange={(e) => handleInputChange('heroWaterCardTitle', e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-stone-300 rounded font-semibold text-xs"
                    placeholder="Аталышы"
                  />
                  <textarea
                    rows={2}
                    value={formData.heroWaterCardDesc}
                    onChange={(e) => handleInputChange('heroWaterCardDesc', e.target.value)}
                    className="w-full p-2 bg-white border border-stone-300 rounded text-[11px]"
                    placeholder="Түшүндүрмөсү"
                  />
                </div>

                {/* 2. Waste Card */}
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
                  <div className="font-bold text-stone-900 text-[11px] text-emerald-800">2. Калдыктар карточкасы</div>
                  <input
                    type="text"
                    value={formData.heroWasteCardTitle}
                    onChange={(e) => handleInputChange('heroWasteCardTitle', e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-stone-300 rounded font-semibold text-xs"
                    placeholder="Аталышы"
                  />
                  <textarea
                    rows={2}
                    value={formData.heroWasteCardDesc}
                    onChange={(e) => handleInputChange('heroWasteCardDesc', e.target.value)}
                    className="w-full p-2 bg-white border border-stone-300 rounded text-[11px]"
                    placeholder="Түшүндүрмөсү"
                  />
                </div>

                {/* 3. Pasture Card */}
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
                  <div className="font-bold text-stone-900 text-[11px] text-amber-800">3. Жайыт карточкасы</div>
                  <input
                    type="text"
                    value={formData.heroPastureCardTitle}
                    onChange={(e) => handleInputChange('heroPastureCardTitle', e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-stone-300 rounded font-semibold text-xs"
                    placeholder="Аталышы"
                  />
                  <textarea
                    rows={2}
                    value={formData.heroPastureCardDesc}
                    onChange={(e) => handleInputChange('heroPastureCardDesc', e.target.value)}
                    className="w-full p-2 bg-white border border-stone-300 rounded text-[11px]"
                    placeholder="Түшүндүрмөсү"
                  />
                </div>

                {/* 4. Machinery Card */}
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
                  <div className="font-bold text-stone-900 text-[11px] text-indigo-800">4. Атайын техника карточкасы</div>
                  <input
                    type="text"
                    value={formData.heroMachineryCardTitle}
                    onChange={(e) => handleInputChange('heroMachineryCardTitle', e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-stone-300 rounded font-semibold text-xs"
                    placeholder="Аталышы"
                  />
                  <textarea
                    rows={2}
                    value={formData.heroMachineryCardDesc}
                    onChange={(e) => handleInputChange('heroMachineryCardDesc', e.target.value)}
                    className="w-full p-2 bg-white border border-stone-300 rounded text-[11px]"
                    placeholder="Түшүндүрмөсү"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SUBTAB 3: БӨЛҮМДӨРДҮН АТАЛЫШТАРЫ */}
        {subTab === 'sections' && (
          <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-xs space-y-5 text-xs">
            <div className="border-b border-stone-100 pb-3">
              <h3 className="text-sm font-bold text-stone-900">
                Сайттагы 5 негизги бөлүмдүн аталыштары жана сыпаттамалары
              </h3>
            </div>

            {/* 1. Water & Waste Section */}
            <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
              <span className="font-bold text-stone-800 block text-xs">
                1. «Таза суу жана Калдыктар» бөлүмү:
              </span>
              <div>
                <label className="block text-[11px] text-stone-500 mb-1">Башкы аталышы:</label>
                <input
                  type="text"
                  value={formData.waterSectionTitle}
                  onChange={(e) => handleInputChange('waterSectionTitle', e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-stone-300 rounded font-bold text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] text-stone-500 mb-1">Түшүндүрмөсү:</label>
                <textarea
                  rows={2}
                  value={formData.waterSectionSubtitle}
                  onChange={(e) => handleInputChange('waterSectionSubtitle', e.target.value)}
                  className="w-full p-2 bg-white border border-stone-300 rounded text-xs"
                />
              </div>
            </div>

            {/* 2. Pasture Section */}
            <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
              <span className="font-bold text-stone-800 block text-xs">
                2. «Жайыт пайдалануу» бөлүмү:
              </span>
              <div>
                <label className="block text-[11px] text-stone-500 mb-1">Башкы аталышы:</label>
                <input
                  type="text"
                  value={formData.pastureSectionTitle}
                  onChange={(e) => handleInputChange('pastureSectionTitle', e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-stone-300 rounded font-bold text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] text-stone-500 mb-1">Түшүндүрмөсү:</label>
                <textarea
                  rows={2}
                  value={formData.pastureSectionSubtitle}
                  onChange={(e) => handleInputChange('pastureSectionSubtitle', e.target.value)}
                  className="w-full p-2 bg-white border border-stone-300 rounded text-xs"
                />
              </div>
            </div>

            {/* 3. Machinery Section */}
            <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
              <span className="font-bold text-stone-800 block text-xs">
                3. «Атайын техника жана автопарк» бөлүмү:
              </span>
              <div>
                <label className="block text-[11px] text-stone-500 mb-1">Башкы аталышы:</label>
                <input
                  type="text"
                  value={formData.machinerySectionTitle}
                  onChange={(e) => handleInputChange('machinerySectionTitle', e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-stone-300 rounded font-bold text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] text-stone-500 mb-1">Түшүндүрмөсү:</label>
                <textarea
                  rows={2}
                  value={formData.machinerySectionSubtitle}
                  onChange={(e) => handleInputChange('machinerySectionSubtitle', e.target.value)}
                  className="w-full p-2 bg-white border border-stone-300 rounded text-xs"
                />
              </div>
            </div>

            {/* 4. Online Payment Section */}
            <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
              <span className="font-bold text-stone-800 block text-xs">
                4. «Онлайн төлөм борбору» бөлүмү:
              </span>
              <div>
                <label className="block text-[11px] text-stone-500 mb-1">Башкы аталышы:</label>
                <input
                  type="text"
                  value={formData.paymentSectionTitle}
                  onChange={(e) => handleInputChange('paymentSectionTitle', e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-stone-300 rounded font-bold text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] text-stone-500 mb-1">Түшүндүрмөсү:</label>
                <textarea
                  rows={2}
                  value={formData.paymentSectionSubtitle}
                  onChange={(e) => handleInputChange('paymentSectionSubtitle', e.target.value)}
                  className="w-full p-2 bg-white border border-stone-300 rounded text-xs"
                />
              </div>
            </div>

            {/* 5. Reports Section */}
            <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
              <span className="font-bold text-stone-800 block text-xs">
                5. «Финансылык отчеттор жана жаңылыктар» бөлүмү:
              </span>
              <div>
                <label className="block text-[11px] text-stone-500 mb-1">Башкы аталышы:</label>
                <input
                  type="text"
                  value={formData.reportsSectionTitle}
                  onChange={(e) => handleInputChange('reportsSectionTitle', e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-stone-300 rounded font-bold text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] text-stone-500 mb-1">Түшүндүрмөсү:</label>
                <textarea
                  rows={2}
                  value={formData.reportsSectionSubtitle}
                  onChange={(e) => handleInputChange('reportsSectionSubtitle', e.target.value)}
                  className="w-full p-2 bg-white border border-stone-300 rounded text-xs"
                />
              </div>
            </div>
          </div>
        )}

        {/* SUBTAB 4: БАЙЛАНЫШ ЖАНА РЕКВИЗИТТЕР */}
        {subTab === 'contacts' && (
          <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-xs space-y-4 text-xs">
            <div className="border-b border-stone-100 pb-3">
              <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-700" />
                <span>Байланыш телефондору, даректер жана банктык реквизиттер</span>
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-stone-700 font-bold mb-1">Диспетчер телефон номери:</label>
                <input
                  type="text"
                  value={formData.dispatcherPhone}
                  onChange={(e) => handleInputChange('dispatcherPhone', e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-bold mb-1">WhatsApp байланыш номери:</label>
                <input
                  type="text"
                  value={formData.whatsappPhone}
                  onChange={(e) => handleInputChange('whatsappPhone', e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-bold mb-1">Кеңсенин дареги:</label>
                <input
                  type="text"
                  value={formData.officeAddress}
                  onChange={(e) => handleInputChange('officeAddress', e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-bold mb-1">Иш убактысы:</label>
                <input
                  type="text"
                  value={formData.workHours}
                  onChange={(e) => handleInputChange('workHours', e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-bold mb-1">Кызмат көрсөткөн банк:</label>
                <input
                  type="text"
                  value={formData.bankName}
                  onChange={(e) => handleInputChange('bankName', e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-bold mb-1">Расчетный счет (Эсептик эсеп):</label>
                <input
                  type="text"
                  value={formData.bankAccount}
                  onChange={(e) => handleInputChange('bankAccount', e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-bold mb-1">Банк БИК коду:</label>
                <input
                  type="text"
                  value={formData.bankBik}
                  onChange={(e) => handleInputChange('bankBik', e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-bold mb-1">ИНН жана ОКПО:</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={formData.inn}
                    placeholder="ИНН"
                    onChange={(e) => handleInputChange('inn', e.target.value)}
                    className="w-full px-2 py-2 bg-stone-50 border border-stone-300 rounded-lg font-mono text-xs"
                  />
                  <input
                    type="text"
                    value={formData.okpo}
                    placeholder="ОКПО"
                    onChange={(e) => handleInputChange('okpo', e.target.value)}
                    className="w-full px-2 py-2 bg-stone-50 border border-stone-300 rounded-lg font-mono text-xs"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SUBTAB 5: ЖАЙЫТ ЗОНАЛАРЫ */}
        {subTab === 'pasture_zones' && (
          <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-xs space-y-4 text-xs">
            <div className="border-b border-stone-100 pb-3">
              <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                <Mountain className="w-4 h-4 text-emerald-700" />
                <span>Жайыт контурлары жана жайлоолордун аталыштары</span>
              </h3>
              <p className="text-[11px] text-stone-500 mt-0.5">
                Ар бир жайлоонун аталышын, бийиктигин, сыйымдуулугун жана жооптуу адамдарын өзгөртүү
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {pastureZones.map(zone => (
                <div key={zone.id} className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between">
                      <h4 className="font-bold text-stone-900 text-xs">{zone.name}</h4>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {zone.condition}
                      </span>
                    </div>
                    <div className="mt-2 text-[11px] text-stone-600 space-y-0.5">
                      <div>Бийиктиги: <strong>{zone.elevation}</strong></div>
                      <div>Сыйымдуулугу: <strong>{zone.capacityHeads} баш мал</strong></div>
                      <div>Жооптуу башчы: <strong>{zone.manager}</strong></div>
                      <div>Суу булактары: <strong>{zone.waterSources}</strong></div>
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-stone-200">
                    <button
                      type="button"
                      onClick={() => startEditZone(zone)}
                      className="text-xs font-semibold text-emerald-700 hover:underline cursor-pointer"
                    >
                      Жайлоо маалыматын өзгөртүү →
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Edit zone modal */}
            {editingZoneId && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <div className="bg-white rounded-2xl p-6 max-w-md w-full border border-stone-200 shadow-2xl space-y-4">
                  <h3 className="text-base font-bold text-stone-900">
                    Жайлоону өзгөртүү: {zoneFormData.name}
                  </h3>

                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="block text-stone-700 font-semibold mb-1">Жайлоонун аталышы:</label>
                      <input
                        type="text"
                        value={zoneFormData.name || ''}
                        onChange={(e) => setZoneFormData({ ...zoneFormData, name: e.target.value })}
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs font-bold"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-stone-700 font-semibold mb-1">Бийиктиги:</label>
                        <input
                          type="text"
                          value={zoneFormData.elevation || ''}
                          onChange={(e) => setZoneFormData({ ...zoneFormData, elevation: e.target.value })}
                          className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-stone-700 font-semibold mb-1">Сыйымдуулугу (баш):</label>
                        <input
                          type="number"
                          value={zoneFormData.capacityHeads || 0}
                          onChange={(e) => setZoneFormData({ ...zoneFormData, capacityHeads: Number(e.target.value) })}
                          className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs font-mono font-bold"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-stone-700 font-semibold mb-1">Жооптуу комендант / башчы:</label>
                      <input
                        type="text"
                        value={zoneFormData.manager || ''}
                        onChange={(e) => setZoneFormData({ ...zoneFormData, manager: e.target.value })}
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-stone-700 font-semibold mb-1">Суу булактары:</label>
                      <input
                        type="text"
                        value={zoneFormData.waterSources || ''}
                        onChange={(e) => setZoneFormData({ ...zoneFormData, waterSources: e.target.value })}
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs"
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setEditingZoneId(null)}
                        className="px-3.5 py-2 text-xs font-semibold text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-lg cursor-pointer"
                      >
                        Жокко чыгаруу
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveZone}
                        className="px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg cursor-pointer"
                      >
                        Сактоо
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* SUBTAB 6: АДМИН СЫРСӨЗҮ */}
        {subTab === 'security' && (
          <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-xs space-y-4 text-xs max-w-md">
            <div className="border-b border-stone-100 pb-3">
              <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-emerald-700" />
                <span>Администратордун коопсуздук PIN-коду</span>
              </h3>
              <p className="text-[11px] text-stone-500 mt-0.5">
                Башкаруу панелине жана маалыматтарды өзгөртүүгө кирүү үчүн жашыруун сырсөз
              </p>
            </div>

            <div>
              <label className="block text-stone-700 font-bold mb-1">
                Жаңы PIN-код же сырсөз:
              </label>
              <input
                type="text"
                value={formData.adminPin}
                onChange={(e) => handleInputChange('adminPin', e.target.value)}
                placeholder="Сырсөздү жазыңыз..."
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg font-mono font-bold text-stone-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              />
              <p className="text-[11px] text-stone-500 mt-1.5">
                Учурдагы сырсөз: <span className="font-mono font-bold text-stone-800">{formData.adminPin}</span>.
                Бул сырсөздү кызматкерлер гана билиши керек.
              </p>
            </div>
          </div>
        )}

        {/* Global Save Button at bottom */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={handleResetToDefault}
            className="px-4 py-2.5 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 text-xs font-semibold cursor-pointer"
          >
            Баштапкы абалга кайтаруу
          </button>

          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <Save className="w-4 h-4" />
            <span>Бардык өзгөртүүлөрдү сактоо</span>
          </button>
        </div>
      </form>
    </div>
  );
};
