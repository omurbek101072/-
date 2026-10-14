import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../context/AppContext';
import { SiteSettings } from '../data/mockData';
import { Edit3, Check, X, ShieldAlert } from 'lucide-react';

interface EditableTextProps {
  settingKey: keyof SiteSettings;
  className?: string;
  multiline?: boolean;
  label?: string;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'span' | 'div';
}

export const EditableText: React.FC<EditableTextProps> = ({
  settingKey,
  className = '',
  multiline = false,
  label,
  as: Component = 'span'
}) => {
  const { siteSettings, updateSiteSettings, isAdminLoggedIn, isEditModeActive } = useApp();
  const [isEditing, setIsEditing] = useState(false);
  const [currentVal, setCurrentVal] = useState<string>(String(siteSettings[settingKey] || ''));

  // If not logged in, render as ordinary clean text
  if (!isAdminLoggedIn) {
    return <Component className={className}>{String(siteSettings[settingKey] || '')}</Component>;
  }

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    updateSiteSettings({ [settingKey]: currentVal });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setCurrentVal(String(siteSettings[settingKey] || ''));
    setIsEditing(false);
  };

  return (
    <span className="relative inline-block group">
      {/* Actual rendered text */}
      <Component className={className}>{String(siteSettings[settingKey] || '')}</Component>

      {/* Admin Quick Edit Pencil (visible only to logged-in administrator) */}
      {(isEditModeActive || isEditing) && (
        <span
          role="button"
          tabIndex={0}
          data-inline-edit="text"
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              e.stopPropagation();
              setCurrentVal(String(siteSettings[settingKey] || ''));
              setIsEditing(true);
            }
          }}
          onClick={e => {
            e.preventDefault();
            e.stopPropagation();
            setCurrentVal(String(siteSettings[settingKey] || ''));
            setIsEditing(true);
          }}
          title={`Аталышты өзгөртүү (${label || settingKey})`}
          className="inline-flex items-center gap-1 ml-2 px-1.5 py-0.5 text-[10px] font-sans font-bold bg-amber-500 hover:bg-amber-600 text-stone-950 rounded shadow-xs transition-all cursor-pointer select-none align-middle"
        >
          <Edit3 className="w-2.5 h-2.5" />
          <span>Өзгөртүү</span>
        </span>
      )}

      {/* Inline Edit Modal / Popover */}
      {isEditing && createPortal(
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs text-left font-sans normal-case tracking-normal"
          onClick={e => {
            e.stopPropagation();
            handleCancel();
          }}
          onSubmit={e => e.stopPropagation()}
          onKeyDown={e => e.stopPropagation()}
        >
          <div
            className="bg-white rounded-2xl p-5 max-w-lg w-full border border-stone-300 shadow-2xl text-stone-900 space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-stone-100 pb-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                <ShieldAlert className="w-4 h-4 text-emerald-600" />
                <span>Аталышты кол менен өзгөртүү: {label || String(settingKey)}</span>
              </div>
              <button
                type="button"
                onClick={handleCancel}
                className="text-stone-400 hover:text-stone-700 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div>
                <label className="block text-stone-700 font-semibold mb-1">
                  Жаңы текстти же аталышты жазыңыз:
                </label>
                {multiline ? (
                  <textarea
                    rows={4}
                    autoFocus
                    value={currentVal}
                    onChange={(e) => setCurrentVal(e.target.value)}
                    className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg text-xs font-sans text-stone-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  />
                ) : (
                  <input
                    type="text"
                    autoFocus
                    value={currentVal}
                    onChange={(e) => setCurrentVal(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs font-sans text-stone-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  />
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-stone-600 hover:bg-stone-100 cursor-pointer"
                >
                  Жокко чыгаруу
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Сайтта сактоо</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </span>
  );
};
