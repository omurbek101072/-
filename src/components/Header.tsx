import React from 'react';
import { Phone, CreditCard, AlertTriangle, Menu, X, ShieldCheck, Settings } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { EditableText } from './EditableText';
import { PhoneLink } from './PhoneLink';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenQuickPayment: () => void;
  onOpenCitizenRequest: () => void;
  onOpenAdminPanel?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenQuickPayment,
  onOpenCitizenRequest,
  onOpenAdminPanel
}) => {
  const { siteSettings, isAdminLoggedIn } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const navItems = [
    { id: 'overview', label: 'Башкы бет' },
    { id: 'water-waste', label: 'Суу & Калдыктар' },
    { id: 'pasture', label: 'Жайыт пайдалануу' },
    { id: 'machinery', label: 'Атайын техника' },
    { id: 'payments', label: 'Онлайн төлөм' },
    { id: 'reports', label: 'Отчеттор' }
  ];

  const handleNavClick = (id: string) => {
    setActiveTab(id);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200">
      {/* Operational Utility Ribbon */}
      <div className="bg-emerald-950 text-white text-xs py-1.5 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3 text-[11px] sm:text-xs">
            <span className="text-emerald-300 font-medium">
              <EditableText settingKey="municipalityName" label="Айыл өкмөтү" /> ·{' '}
              <EditableText settingKey="enterpriseName" label="Ишкананын аталышы" />
            </span>
            <span className="text-emerald-700 hidden sm:inline" aria-hidden="true">|</span>
            <span className="hidden sm:inline text-stone-300">
              Иш убактысы: <EditableText settingKey="workHours" label="Иш убактысы" />
            </span>
          </div>

          <div className="flex items-center gap-3 sm:gap-4 text-[11px] sm:text-xs">
            <div className="flex items-center gap-1.5 text-emerald-200">
              <Phone className="w-3.5 h-3.5 text-emerald-400" />
              <span>
                Диспетчер:{' '}
                <strong className="text-white font-mono">
                  <PhoneLink phone={siteSettings.dispatcherPhone}><EditableText settingKey="dispatcherPhone" label="Диспетчер телефон" /></PhoneLink>
                </strong>
              </span>
            </div>
            <button
              onClick={onOpenCitizenRequest}
              className="text-amber-300 hover:text-amber-200 underline decoration-amber-400/50 underline-offset-2 transition-colors cursor-pointer"
            >
              Авария / Арыз
            </button>

            {/* Admin shortcut button: ONLY visible when administrator is logged in */}
            {isAdminLoggedIn && onOpenAdminPanel && (
              <button
                onClick={onOpenAdminPanel}
                className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-800/80 hover:bg-emerald-700 text-amber-300 font-bold text-[11px] transition-colors cursor-pointer shadow-xs border border-emerald-600/50"
                title="Башкаруу панелин ачуу"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>Башкаруу панели</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Top Bar Contract (Wordmark - 4-5 nav links - 1 Primary Action) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single text element wordmark */}
        <button
          onClick={() => handleNavClick('overview')}
          className="text-left group cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-bold text-lg shadow-sm">
              {siteSettings.enterpriseName.charAt(1) || 'Т'}
            </div>
            <div>
              <span className="text-lg font-extrabold tracking-tight text-stone-900 block leading-tight">
                {siteSettings.enterpriseName}
              </span>
              <span className="text-[10px] text-stone-500 font-medium block">
                {siteSettings.enterpriseSubName}
              </span>
            </div>
          </div>
        </button>

        {/* Zone 2: 4-5 single-line nav links */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`whitespace-nowrap shrink-0 transition-colors py-1 cursor-pointer ${
                  isActive
                    ? 'text-emerald-800 font-bold border-b-2 border-emerald-700'
                    : 'text-stone-600 hover:text-stone-950'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="hidden sm:flex items-center gap-2.5 shrink-0">
          <button
            onClick={onOpenQuickPayment}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Онлайн төлөм</span>
          </button>
        </div>

        {/* Mobile menu trigger */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden p-2 rounded-lg text-stone-700 hover:bg-stone-100"
          aria-label="Меню"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-stone-200 bg-white px-4 py-4 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium ${
                activeTab === item.id
                  ? 'bg-emerald-50 text-emerald-800 font-bold'
                  : 'text-stone-700 hover:bg-stone-50'
              }`}
            >
              {item.label}
            </button>
          ))}
          <div className="pt-2 border-t border-stone-100 flex flex-col gap-2">
            <button
              onClick={() => {
                onOpenQuickPayment();
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-emerald-700 rounded-lg"
            >
              <CreditCard className="w-4 h-4" />
              <span>Онлайн төлөө</span>
            </button>
            <button
              onClick={() => {
                onOpenCitizenRequest();
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-stone-700 bg-stone-100 rounded-lg"
            >
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Арыз же авария билдирүү</span>
            </button>
            {isAdminLoggedIn && onOpenAdminPanel && (
              <button
                onClick={() => {
                  onOpenAdminPanel();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-emerald-900 bg-emerald-100 rounded-lg"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                <span>Башкаруу панели (Админ)</span>
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
