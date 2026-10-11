import React, { useState } from 'react';
import { MachineryItem, MachineryOrder } from '../types';
import { useApp } from '../context/AppContext';
import { EditableText } from './EditableText';
import { generateId, nowTimestamp } from '../utils/ids';
import { isValidKgPhone, PHONE_ERROR, todayIso } from '../utils/validation';
import { Truck, Clock, Fuel, ShieldCheck, CheckCircle2, Calendar, Phone, ArrowRight, UserCheck, AlertCircle, X } from 'lucide-react';

interface MachineryFleetSectionProps {
  onDirectPayment: (serviceType: 'machinery', amount: number, details: string, orderId?: string) => void;
}

export const MachineryFleetSection: React.FC<MachineryFleetSectionProps> = ({ onDirectPayment }) => {
  const { machineryCatalog, machineryOrders, addMachineryOrder } = useApp();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [bookingItem, setBookingItem] = useState<MachineryItem | null>(null);
  
  // Booking calculator state
  const [orderType, setOrderType] = useState<'hours' | 'shift' | 'trips'>('hours');
  const [hoursCount, setHoursCount] = useState<number>(3);
  const [shiftsCount, setShiftsCount] = useState<number>(1);
  const [tripsCount, setTripsCount] = useState<number>(1);
  const [bookingDate, setBookingDate] = useState<string>(todayIso(1));
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('+996 ');
  const [workAddress, setWorkAddress] = useState<string>('');
  const [workDescription, setWorkDescription] = useState<string>('Арык казуу жана жер түздөө');
  
  const [bookingNotice, setBookingNotice] = useState<string | null>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);

  // Filter machines
  const filteredMachines = selectedCategory === 'all'
    ? machineryCatalog
    : machineryCatalog.filter(m => m.category === selectedCategory);

  const calculateEstimate = (item: MachineryItem): number => {
    if (orderType === 'shift') {
      return item.shiftRate * shiftsCount;
    }
    if (orderType === 'trips' && item.tripRate) {
      return item.tripRate * tripsCount;
    }
    return item.hourlyRate * hoursCount;
  };

  const handleOpenBooking = (item: MachineryItem) => {
    setBookingItem(item);
    setBookingError(null);
    // Минималдуу заказ саатынан аз болбосун
    setHoursCount(prev => Math.max(item.specs.minOrderHours, prev));
    if (item.tripRate && item.category === 'special') {
      setOrderType('trips');
    } else {
      setOrderType('hours');
    }
  };

  // Форманы текшерүү (катасы болсо - ката текстин кайтарат)
  const validateBooking = (): string | null => {
    if (!isValidKgPhone(customerPhone)) return PHONE_ERROR;
    if (!workAddress.trim()) return 'Иштин дарегин жазыңыз.';
    if (!bookingDate || bookingDate < todayIso()) return 'Күндү туура тандаңыз (бүгүн же андан кийин).';
    return null;
  };

  const buildOrder = (item: MachineryItem): MachineryOrder => ({
    id: generateId('ORD', machineryOrders.map(o => o.id)),
    machineId: item.id,
    machineName: item.name,
    customerName: customerName.trim() || 'Айыл тургуну',
    customerPhone: customerPhone.trim(),
    address: workAddress.trim(),
    workDescription,
    orderDate: bookingDate,
    orderType,
    units: orderType === 'hours' ? hoursCount : orderType === 'shift' ? shiftsCount : tripsCount,
    totalEstimate: calculateEstimate(item),
    status: 'жаңы',
    // Төлөм чындап өткөндө гана "төлөндү" болот (OnlinePaymentHub)
    paymentStatus: 'күтүлүүдө',
    createdAt: nowTimestamp()
  });

  const handleSubmitBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingItem) return;
    const err = validateBooking();
    if (err) {
      setBookingError(err);
      return;
    }

    const newOrder = buildOrder(bookingItem);
    addMachineryOrder(newOrder);
    setBookingNotice(`Өтүнмө № ${newOrder.id} кабыл алынды! Диспетчер сиз менен байланышат.`);
    setBookingItem(null);
  };

  const handlePayNow = () => {
    if (!bookingItem) return;
    const err = validateBooking();
    if (err) {
      setBookingError(err);
      return;
    }
    const newOrder = buildOrder(bookingItem);
    addMachineryOrder(newOrder);

    const orderDetails = `Заказ № ${newOrder.id}: ${bookingItem.name} (${bookingItem.model}) ижарасы, ${orderType === 'hours' ? `${hoursCount} саат` : orderType === 'shift' ? `${shiftsCount} смена` : `${tripsCount} рейс`}`;
    setBookingItem(null);
    onDirectPayment('machinery', newOrder.totalEstimate, orderDetails, newOrder.id);
  };

  return (
    <section id="machinery" className="py-14 bg-white border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 uppercase tracking-wider">
              <Truck className="w-4 h-4" />
              <span>Муниципалдык автопарк</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 mt-1" style={{ textWrap: 'balance' }}>
              <EditableText settingKey="machinerySectionTitle" label="Атайын техника башкы аталышы" />
            </h2>
            <p className="text-sm text-stone-600 mt-2 max-w-2xl">
              <EditableText settingKey="machinerySectionSubtitle" multiline label="Атайын техника түшүндүрмөсү" />
            </p>
          </div>

          {/* Category Filter segmented tabs */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-stone-100 rounded-xl text-xs font-medium shrink-0">
            {[
              { id: 'all', label: 'Бардык техникалар' },
              { id: 'excavator', label: 'Экскаваторлор' },
              { id: 'heavy_truck', label: 'Оор жүк (самосвал)' },
              { id: 'light_truck', label: 'Жеңил жүк' },
              { id: 'special', label: 'Септик / Водовоз' }
            ].map(cat => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-white text-stone-900 font-bold shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {bookingNotice && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-between text-xs font-semibold">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{bookingNotice}</span>
            </div>
            <button onClick={() => setBookingNotice(null)} className="text-stone-500 hover:text-stone-800">
              Жабуу
            </button>
          </div>
        )}

        {/* Machinery Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMachines.map(machine => (
            <div
              key={machine.id}
              className="rounded-2xl border border-stone-200 bg-white hover:border-emerald-500/60 shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between"
            >
              <div>
                {/* Photo */}
                <div className="relative h-48 bg-stone-100 overflow-hidden">
                  <img
                    src={machine.image}
                    alt={machine.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                  />
                  <div className="absolute top-3 left-3 bg-stone-950/80 backdrop-blur-sm text-white px-2.5 py-1 rounded-md text-[11px] font-mono">
                    {machine.model}
                  </div>
                  <div className="absolute top-3 right-3 bg-emerald-600 text-white px-2 py-0.5 rounded text-[10px] font-semibold">
                    {machine.status === 'бош' ? 'Иштөөгө даяр' : machine.status}
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 space-y-3">
                  <div>
                    <h3 className="text-base font-bold text-stone-900 leading-snug">
                      {machine.name}
                    </h3>
                    <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                      {machine.description}
                    </p>
                  </div>

                  {/* Specs & Tags */}
                  <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/70 space-y-1.5 text-xs">
                    <div className="flex justify-between text-stone-700">
                      <span className="text-stone-500">Мүнөздөмөсү:</span>
                      <span className="font-semibold text-right">{machine.specs.capacity}</span>
                    </div>
                    <div className="flex justify-between text-stone-700">
                      <span className="text-stone-500">Айдоочу / Оператор:</span>
                      <span className="text-emerald-700 font-semibold">Камтылган</span>
                    </div>
                    <div className="flex justify-between text-stone-700">
                      <span className="text-stone-500">Күйүүчү май (ГСМ):</span>
                      <span className="text-emerald-700 font-semibold">Камтылган</span>
                    </div>
                    <div className="flex justify-between text-stone-700">
                      <span className="text-stone-500">Минималдуу заказ:</span>
                      <span className="font-mono text-stone-800">{machine.specs.minOrderHours} сааттан баштап</span>
                    </div>
                  </div>

                  {/* Rates */}
                  <div className="pt-2 flex items-baseline justify-between border-t border-stone-100">
                    <div>
                      <span className="text-[11px] text-stone-400 block">Сааттык тариф:</span>
                      <span className="text-lg font-extrabold text-stone-900 font-mono tabular-nums">
                        {machine.hourlyRate.toLocaleString('ru-RU')} с.
                        <span className="text-xs font-normal text-stone-500">/саат</span>
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] text-stone-400 block">Смена (8 саат):</span>
                      <span className="text-sm font-bold text-emerald-800 font-mono tabular-nums">
                        {machine.shiftRate.toLocaleString('ru-RU')} с.
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="p-5 pt-0">
                <button
                  type="button"
                  onClick={() => handleOpenBooking(machine)}
                  className="w-full py-2.5 bg-stone-900 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Ижарага алуу / Смета эсептөө</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Fleet Guarantee Banner */}
        <div className="mt-12 p-6 rounded-2xl bg-stone-50 border border-stone-200 grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-stone-600">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-stone-900">Расмий келишим жана дүмүрчөк</h4>
              <p className="mt-0.5">Кызматтар айыл өкмөттүн расмий тарифи менен көрсөтүлүп, бардык каржылык документтер берилет.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-stone-900">Өз убагында жеткирүү</h4>
              <p className="mt-0.5">Заказ кабыл алынгандан кийин техника көрсөтүлгөн дарекке графикке ылайык өз убагында келет.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
              <Fuel className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-stone-900">Тажрыйбалуу операторлор</h4>
              <p className="mt-0.5">Бардык техникаларды 5+ жылдык тажрыйбасы бар кесипкөй айдоочулар башкарат.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Booking & Estimate Modal */}
      {bookingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden border border-stone-200 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-stone-900 text-white p-5 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-emerald-400 font-semibold uppercase tracking-wider block">
                  Техниканы ижарага алуу өтүнмөсү
                </span>
                <h3 className="font-bold text-base text-white mt-0.5">{bookingItem.name}</h3>
                <p className="text-xs text-stone-300 font-mono">{bookingItem.model}</p>
              </div>
              <button
                onClick={() => setBookingItem(null)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitBooking} className="p-6 space-y-4 text-xs">
              {/* Order Mode selector */}
              <div>
                <label className="block font-bold text-stone-800 mb-1.5">Ижара түрү:</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setOrderType('hours')}
                    className={`py-2 px-3 rounded-lg border text-center transition-all cursor-pointer ${
                      orderType === 'hours'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold'
                        : 'border-stone-200 bg-stone-50 text-stone-600'
                    }`}
                  >
                    <span>Сааттык</span>
                    <span className="block text-[10px] text-stone-400">{bookingItem.hourlyRate} с/саат</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setOrderType('shift')}
                    className={`py-2 px-3 rounded-lg border text-center transition-all cursor-pointer ${
                      orderType === 'shift'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold'
                        : 'border-stone-200 bg-stone-50 text-stone-600'
                    }`}
                  >
                    <span>Смена (8 саат)</span>
                    <span className="block text-[10px] text-stone-400">{bookingItem.shiftRate} с/күн</span>
                  </button>

                  {bookingItem.tripRate ? (
                    <button
                      type="button"
                      onClick={() => setOrderType('trips')}
                      className={`py-2 px-3 rounded-lg border text-center transition-all cursor-pointer ${
                        orderType === 'trips'
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold'
                          : 'border-stone-200 bg-stone-50 text-stone-600'
                      }`}
                    >
                      <span>Рейс боюнча</span>
                      <span className="block text-[10px] text-stone-400">{bookingItem.tripRate} с/рейс</span>
                    </button>
                  ) : (
                    <div className="py-2 px-3 rounded-lg border border-dashed border-stone-200 text-center text-stone-400">
                      Рейс тарифи жок
                    </div>
                  )}
                </div>
              </div>

              {/* Units counter */}
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between">
                <span className="font-medium text-stone-700">
                  {orderType === 'hours' ? 'Саат саны:' : orderType === 'shift' ? 'Смена (күн) саны:' : 'Рейс саны:'}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (orderType === 'hours') setHoursCount(Math.max(bookingItem.specs.minOrderHours, hoursCount - 1));
                      if (orderType === 'shift') setShiftsCount(Math.max(1, shiftsCount - 1));
                      if (orderType === 'trips') setTripsCount(Math.max(1, tripsCount - 1));
                    }}
                    className="w-7 h-7 rounded bg-white border border-stone-300 font-bold flex items-center justify-center hover:bg-stone-100"
                  >
                    -
                  </button>
                  <span className="w-12 text-center font-bold font-mono text-sm text-stone-900">
                    {orderType === 'hours' ? hoursCount : orderType === 'shift' ? shiftsCount : tripsCount}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (orderType === 'hours') setHoursCount(hoursCount + 1);
                      if (orderType === 'shift') setShiftsCount(shiftsCount + 1);
                      if (orderType === 'trips') setTripsCount(tripsCount + 1);
                    }}
                    className="w-7 h-7 rounded bg-white border border-stone-300 font-bold flex items-center justify-center hover:bg-stone-100"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Inputs */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Күнү:</label>
                  <input
                    type="date"
                    min={todayIso()}
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Телефон номери:</label>
                  <input
                    type="tel"
                    inputMode="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="+996 (___) __-__-__"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-1">Иштин дареги (көчө, үй номери):</label>
                <input
                  type="text"
                  required
                  value={workAddress}
                  onChange={(e) => setWorkAddress(e.target.value)}
                  placeholder="Мисалы: Ленин көчөсү, 85-үй"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-1">Иштин түрү жана тапшырма:</label>
                <input
                  type="text"
                  value={workDescription}
                  onChange={(e) => setWorkDescription(e.target.value)}
                  placeholder="Мисалы: 20 метр траншея казуу, шагыл ташуу..."
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs"
                />
              </div>

              {bookingError && (
                <p className="text-[11px] font-semibold text-rose-600">{bookingError}</p>
              )}

              {/* Estimate & Buttons */}
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200/90 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase text-emerald-800 font-semibold block">Болжолдуу смета</span>
                  <div className="text-xl font-extrabold text-emerald-950 font-mono tabular-nums">
                    {calculateEstimate(bookingItem).toLocaleString('ru-RU')} сом
                  </div>
                  <span className="text-[10px] text-stone-500">Оператор жана май баага камтылган</span>
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="px-3 py-2 bg-stone-800 hover:bg-stone-900 text-white font-semibold rounded-lg text-xs cursor-pointer shadow-xs"
                  >
                    Өтүнмө калтыруу
                  </button>
                  <button
                    type="button"
                    onClick={handlePayNow}
                    className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg text-xs cursor-pointer shadow-xs"
                  >
                    Азыр онлайн төлөө
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
