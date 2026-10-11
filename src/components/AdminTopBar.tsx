import React from 'react';
import { useApp } from '../context/AppContext';
import { ShieldCheck, Settings2, Edit3, LogOut, Eye } from 'lucide-react';

interface AdminTopBarProps {
  onOpenAdminPanel: () => void;
}

export const AdminTopBar: React.FC<AdminTopBarProps> = ({ onOpenAdminPanel }) => {
  const { isAdminLoggedIn, logoutAdmin, isEditModeActive, setIsEditModeActive } = useApp();

  if (!isAdminLoggedIn) return null;

  return (
    <div className="bg-stone-900 border-b border-amber-500/40 text-white px-4 py-2 text-xs sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <div className="flex items-center gap-1.5 font-bold text-amber-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Администратор сессиясы активдүү</span>
          </div>
          <span className="text-stone-500 hidden sm:inline">|</span>
          <span className="text-stone-400 text-[11px] hidden md:inline">
            Башкаруу панели жана аталыштарды өзгөртүү сизге гана көрүнүүдө
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Toggle In-Place Title Editing */}
          <button
            type="button"
            onClick={() => setIsEditModeActive(!isEditModeActive)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              isEditModeActive
                ? 'bg-amber-400 text-stone-950 font-bold shadow-xs'
                : 'bg-stone-800 text-stone-300 hover:text-white hover:bg-stone-700'
            }`}
            title="Башкы беттеги аталыштарды түздөн-түз өзгөртүү"
          >
            <Edit3 className="w-3.5 h-3.5 text-amber-500" />
            <span>Түз түзөтүү: {isEditModeActive ? 'КҮЙГҮЗҮЛГӨН' : 'ӨЧҮК'}</span>
          </button>

          {/* Open Full Admin Panel */}
          <button
            type="button"
            onClick={onOpenAdminPanel}
            className="flex items-center gap-1.5 px-3 py-1 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-xs"
          >
            <Settings2 className="w-3.5 h-3.5" />
            <span>Башкаруу панели</span>
          </button>

          {/* Logout button */}
          <button
            type="button"
            onClick={logoutAdmin}
            className="flex items-center gap-1 px-2.5 py-1 bg-stone-800 hover:bg-rose-900/60 text-stone-300 hover:text-rose-200 rounded-lg text-xs font-medium transition-colors cursor-pointer"
            title="Админден чыгуу жана панелди кайра жашыруу"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Чыгуу</span>
          </button>
        </div>
      </div>
    </div>
  );
};
