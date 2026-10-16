import React from 'react';
import { T } from './AdminInline';
import { Phone, MapPin, Clock, Lock, ShieldCheck } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { EditableText } from './EditableText';
import { PhoneLink } from './PhoneLink';

interface FooterProps {
  onNavClick: (tab: string) => void;
  onOpenCitizenRequest: () => void;
  onOpenAdminLogin: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onNavClick,
  onOpenCitizenRequest,
  onOpenAdminLogin
}) => {
  const { siteSettings, isAdminLoggedIn } = useApp();

  return (
    <footer className="bg-stone-950 text-stone-300 border-t border-stone-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10 text-xs">
          {/* Col 1: Identity */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-base">
                {siteSettings.enterpriseName.charAt(1) || 'Т'}
              </div>
              <span className="font-extrabold text-base text-white tracking-tight">
                <EditableText settingKey="enterpriseName" label="Ишкананын аталышы" />
              </span>
            </div>
            <p className="text-stone-400 leading-relaxed text-[11px]">
              {siteSettings.municipalityName}нин карамагындагы {siteSettings.enterpriseName} {siteSettings.enterpriseSubName}. Айыл аймагын тазалоо, ичүүчү суу менен камсыздоо, таштанды чыгаруу, жайыттарды башкаруу жана атайын техника ижарасы кызматтары.
            </p>
            <div className="pt-2 text-[10px] text-stone-500 font-mono space-y-0.5">
              <div>ИНН: <EditableText settingKey="inn" label="ИНН" /></div>
              <div><T>ОКПО:</T> <EditableText settingKey="okpo" label="ОКПО" /></div>
            </div>
          </div>

          {/* Col 2: Navigation */}
          <div className="space-y-3">
            <h4 className="font-bold text-white text-xs uppercase tracking-wider">
              <T>Бөлүмдөр жана кызматтар</T>
            </h4>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => onNavClick('water-waste')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  <T>Таза суу жана водомер көрсөткүчү</T>
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavClick('water-waste')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  <T>Таштанды чыгаруу графиги</T>
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavClick('pasture')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  <T>Жайыт пайдалануу жана билет алуу</T>
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavClick('machinery')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  <T>Техника ижарасы жана оңдоо</T>
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavClick('payments')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  <T>Төлөм жана карызды текшерүү</T>
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Contacts */}
          <div className="space-y-3">
            <h4 className="font-bold text-white text-xs uppercase tracking-wider">
              <T>Байланыш жана диспетчер</T>
            </h4>
            <div className="space-y-2 text-stone-400">
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>
                  <T>Авариялык диспетчер:</T>{' '}
                  <strong className="text-white font-mono">
                    <PhoneLink phone={siteSettings.dispatcherPhone}><EditableText settingKey="dispatcherPhone" label="Диспетчердик телефон" /></PhoneLink>
                  </strong>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>
                  WhatsApp:{' '}
                  <strong className="text-white font-mono">
                    <PhoneLink phone={siteSettings.whatsappPhone} kind="whatsapp"><EditableText settingKey="whatsappPhone" label="WhatsApp номери" /></PhoneLink>
                  </strong>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>
                  <T>Дарек:</T>{' '}
                  <EditableText settingKey="officeAddress" label="Кеңсе дареги" />
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>
                  <T>Иш убактысы:</T>{' '}
                  <EditableText settingKey="workHours" label="Иш убактысы" />
                </span>
              </div>
            </div>
          </div>

          {/* Col 4: Bank Requisites & Emergency Button */}
          <div className="space-y-3">
            <h4 className="font-bold text-white text-xs uppercase tracking-wider">
              <T>Банктык реквизиттер</T>
            </h4>
            <div className="p-3 bg-stone-900 rounded-xl border border-stone-800 text-[11px] space-y-1 font-mono text-stone-400">
              <div><T>Банк:</T> <EditableText settingKey="bankName" label="Банктын аталышы" /></div>
              <div>БИК: <EditableText settingKey="bankBik" label="БИК" /></div>
              <div><T>Эсеп:</T> <EditableText settingKey="bankAccount" label="Расчетный счет" /></div>
              <div><T>Алуучу:</T> {siteSettings.enterpriseName} МИ</div>
            </div>

            <button
              onClick={onOpenCitizenRequest}
              className="w-full py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer"
            >
              <T>Арыз же авария билдирүү</T>
            </button>
          </div>
        </div>

        {/* Bottom copyright row with discreet hidden administrator lock */}
        <div className="pt-6 border-t border-stone-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-500">
          <div className="flex items-center gap-3">
            <p>© 2026 {siteSettings.enterpriseName} {siteSettings.enterpriseSubName}. Бардык укуктар корголгон.</p>

            {/* Hidden admin access: Only accessible through clicking this subtle link or pressing Ctrl+Shift+A */}
            {!isAdminLoggedIn ? (
              <button
                type="button"
                onClick={onOpenAdminLogin}
                title="Кызматкерлер үчүн башкаруу кирүүсү (PIN/Сырсөз талап кылынат)"
                className="opacity-25 hover:opacity-100 transition-opacity flex items-center gap-1 text-[11px] text-stone-400 hover:text-stone-200 cursor-pointer p-1 rounded hover:bg-stone-800"
              >
                <Lock className="w-3 h-3" />
                <span className="text-[10px]"><T>Кызматтык кирүү</T></span>
              </button>
            ) : (
              <span className="flex items-center gap-1 text-emerald-400 text-[10px] font-semibold">
                <ShieldCheck className="w-3 h-3" />
                <span><T>Админ активдүү</T></span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span><T>Кыргыз Республикасынын Мыйзамдары</T></span>
            <span aria-hidden="true">·</span>
            <span><T>Айылдык Кеңештин көзөмөлүндө</T></span>
          </div>
        </div>
      </div>
    </footer>
  );
};
