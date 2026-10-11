import React from 'react';
import { useApp } from '../context/AppContext';
import { Droplets, Trash2, Mountain, Truck, CreditCard, ArrowRight } from 'lucide-react';
import { EditableText } from './EditableText';

interface HeroProps {
  onSelectService: (serviceTab: string) => void;
  onOpenQuickPayment: () => void;
  onOpenCitizenRequest: () => void;
}

export const Hero: React.FC<HeroProps> = ({
  onSelectService,
  onOpenQuickPayment,
  onOpenCitizenRequest
}) => {
  const { siteSettings } = useApp();

  return (
    <section className="relative overflow-hidden bg-stone-900 text-white">
      {/* Background Hero Image with measured scrim */}
      <div className="absolute inset-0 z-0">
        <img
          src="/images/tazalyk_hero_village_1791715414641.jpg"
          alt="Кыргыз айылынын көрүнүшү жана таза көчөлөрү"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center scale-105 transition-transform duration-1000"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-stone-950/95 via-stone-950/80 to-stone-900/60" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-14 lg:py-20">
        <div className="max-w-3xl">
          {/* Unboxed metadata kicker */}
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 tracking-wide uppercase mb-3">
            <EditableText settingKey="heroKicker" label="Башкы сап (Kicker)" />
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight" style={{ textWrap: 'balance' }}>
            <EditableText settingKey="heroTitle" label="Башкы ураан / Негизги аталыш" />
          </h1>

          <p className="mt-4 text-base sm:text-lg text-stone-300 leading-relaxed max-w-2xl">
            <EditableText settingKey="heroSubtitle" multiline label="Башкы беттин түшүндүрмө тексти" />
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button
              onClick={onOpenQuickPayment}
              className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl shadow-lg shadow-emerald-950/40 transition-all text-sm cursor-pointer"
            >
              <CreditCard className="w-4 h-4" />
              <span>Онлайн төлөм жүргүзүү</span>
            </button>

            <button
              onClick={() => onSelectService('water-waste')}
              className="flex items-center gap-2 px-5 py-3 bg-white/10 hover:bg-white/20 text-white border border-white/20 font-semibold rounded-xl backdrop-blur-sm transition-all text-sm cursor-pointer"
            >
              <span>Кызматтар жана график</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={onOpenCitizenRequest}
              className="px-4 py-3 text-stone-300 hover:text-white text-sm font-medium transition-colors cursor-pointer"
            >
              Авариялык билдирүү жөнөтүү
            </button>
          </div>

          {/* Trust stats strip */}
          <div className="mt-12 pt-6 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-4 text-left">
            <div>
              <div className="text-2xl font-extrabold text-white font-mono tabular-nums">1,240+</div>
              <div className="text-xs text-stone-400 mt-0.5">Тейленген үй чарба</div>
            </div>
            <div>
              <div className="text-2xl font-extrabold text-white font-mono tabular-nums">24 / 7</div>
              <div className="text-xs text-stone-400 mt-0.5">Авариялык диспетчер</div>
            </div>
            <div>
              <div className="text-2xl font-extrabold text-white font-mono tabular-nums">6 бирдик</div>
              <div className="text-xs text-stone-400 mt-0.5">Муниципалдык техника</div>
            </div>
            <div>
              <div className="text-2xl font-extrabold text-white font-mono tabular-nums">10,400 га</div>
              <div className="text-xs text-stone-400 mt-0.5">Көзөмөлдөгү жайыттар</div>
            </div>
          </div>
        </div>
      </div>

      {/* 4-Column Quick Service Route Cards Strip */}
      <div className="relative z-10 bg-stone-950/80 border-t border-stone-800 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1 */}
          <button
            onClick={() => onSelectService('water-waste')}
            className="group p-4 bg-stone-900/90 hover:bg-stone-800/90 border border-stone-800 hover:border-emerald-500/50 rounded-xl text-left transition-all cursor-pointer"
          >
            <div className="w-10 h-10 rounded-lg bg-cyan-950 text-cyan-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Droplets className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-white group-hover:text-emerald-300 transition-colors">
              <EditableText settingKey="heroWaterCardTitle" label="1-карточка аталышы" />
            </h3>
            <p className="text-xs text-stone-400 mt-1 leading-snug">
              <EditableText settingKey="heroWaterCardDesc" label="1-карточка сүрөттөмөсү" />
            </p>
          </button>

          {/* Card 2 */}
          <button
            onClick={() => onSelectService('water-waste')}
            className="group p-4 bg-stone-900/90 hover:bg-stone-800/90 border border-stone-800 hover:border-emerald-500/50 rounded-xl text-left transition-all cursor-pointer"
          >
            <div className="w-10 h-10 rounded-lg bg-emerald-950 text-emerald-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Trash2 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-white group-hover:text-emerald-300 transition-colors">
              <EditableText settingKey="heroWasteCardTitle" label="2-карточка аталышы" />
            </h3>
            <p className="text-xs text-stone-400 mt-1 leading-snug">
              <EditableText settingKey="heroWasteCardDesc" label="2-карточка сүрөттөмөсү" />
            </p>
          </button>

          {/* Card 3 */}
          <button
            onClick={() => onSelectService('pasture')}
            className="group p-4 bg-stone-900/90 hover:bg-stone-800/90 border border-stone-800 hover:border-emerald-500/50 rounded-xl text-left transition-all cursor-pointer"
          >
            <div className="w-10 h-10 rounded-lg bg-amber-950 text-amber-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Mountain className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-white group-hover:text-amber-300 transition-colors">
              <EditableText settingKey="heroPastureCardTitle" label="3-карточка аталышы" />
            </h3>
            <p className="text-xs text-stone-400 mt-1 leading-snug">
              <EditableText settingKey="heroPastureCardDesc" label="3-карточка сүрөттөмөсү" />
            </p>
          </button>

          {/* Card 4 */}
          <button
            onClick={() => onSelectService('machinery')}
            className="group p-4 bg-stone-900/90 hover:bg-stone-800/90 border border-stone-800 hover:border-emerald-500/50 rounded-xl text-left transition-all cursor-pointer"
          >
            <div className="w-10 h-10 rounded-lg bg-indigo-950 text-indigo-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Truck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-white group-hover:text-indigo-300 transition-colors">
              <EditableText settingKey="heroMachineryCardTitle" label="4-карточка аталышы" />
            </h3>
            <p className="text-xs text-stone-400 mt-1 leading-snug">
              <EditableText settingKey="heroMachineryCardDesc" label="4-карточка сүрөттөмөсү" />
            </p>
          </button>
        </div>
      </div>
    </section>
  );
};
