import React, { useState } from 'react';
import { X, Send, AlertTriangle, CheckCircle2, Camera, Phone, MapPin, Search } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CitizenTicket } from '../types';

interface CitizenRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CitizenRequestModal: React.FC<CitizenRequestModalProps> = ({ isOpen, onClose }) => {
  const { citizenTickets, addCitizenTicket } = useApp();
  const [activeTab, setActiveTab] = useState<'create' | 'check'>('create');
  
  // Form fields
  const [category, setCategory] = useState<string>('Суу түтүгү жарылды / Суу жок');
  const [name, setName] = useState<string>('');
  const [phone, setPhone] = useState<string>('+996 ');
  const [address, setAddress] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [hasPhoto, setHasPhoto] = useState<boolean>(false);
  const [createdTicket, setCreatedTicket] = useState<CitizenTicket | null>(null);

  // Check status fields
  const [checkId, setCheckId] = useState<string>('ТЗЛ-804');
  const [foundTicket, setFoundTicket] = useState<CitizenTicket | null>(citizenTickets[0] || null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newId = `ТЗЛ-${Math.floor(100 + Math.random() * 900)}`;
    const newTicket: CitizenTicket = {
      id: newId,
      category,
      name: name || 'Айыл тургуну',
      phone,
      address,
      description,
      status: 'Кабыл алынды',
      date: new Date().toISOString().replace('T', ' ').slice(0, 16)
    };
    addCitizenTicket(newTicket);
    setCreatedTicket(newTicket);
  };

  const handleSearchTicket = (e: React.FormEvent) => {
    e.preventDefault();
    const q = checkId.trim().toUpperCase();
    if (q) {
      const match = citizenTickets.find(t => t.id.toUpperCase() === q);
      if (match) {
        setFoundTicket(match);
      } else {
        setFoundTicket({
          id: q,
          category: 'Кайрылуу',
          name: 'Тургун',
          phone: '+996 (702) **-**-**',
          address: 'Айыл аймагы',
          description: 'Арыз кароодо турат',
          status: 'Кароодо',
          date: new Date().toISOString().replace('T', ' ').slice(0, 16)
        });
      }
    }
  };



  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden border border-stone-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-emerald-900 text-white p-5 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-amber-300 font-semibold uppercase">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Диспетчердик кызматка кайрылуу</span>
            </div>
            <h3 className="font-bold text-base text-white mt-0.5">
              Авариялык билдирүү же арыз калтыруу
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switchers */}
        <div className="flex border-b border-stone-200 text-xs font-semibold bg-stone-50">
          <button
            onClick={() => { setActiveTab('create'); setCreatedTicket(null); }}
            className={`flex-1 py-3 text-center transition-colors cursor-pointer ${
              activeTab === 'create'
                ? 'bg-white text-emerald-800 border-b-2 border-emerald-700'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            Жаңы арыз жөнөтүү
          </button>
          <button
            onClick={() => setActiveTab('check')}
            className={`flex-1 py-3 text-center transition-colors cursor-pointer ${
              activeTab === 'check'
                ? 'bg-white text-emerald-800 border-b-2 border-emerald-700'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            Арыздын абалын текшерүү
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6">
          {activeTab === 'create' ? (
            createdTicket ? (
              <div className="text-center py-4 space-y-4">
                <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-700">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-stone-900">Арызыңыз ийгиликтүү кабыл алынды!</h4>
                  <p className="text-xs text-stone-500 mt-1">
                    Көзөмөл номериңизди сактап коюңуз:
                  </p>
                  <div className="mt-2 inline-block px-4 py-2 bg-stone-100 rounded-lg text-base font-extrabold font-mono text-emerald-800">
                    № {createdTicket.id}
                  </div>
                </div>
                <div className="bg-stone-50 p-4 rounded-xl text-left text-xs border border-stone-200 space-y-1.5 text-stone-700">
                  <div><strong>Категория:</strong> {createdTicket.category}</div>
                  <div><strong>Дарек:</strong> {createdTicket.address}</div>
                  <div><strong>Убактысы:</strong> {createdTicket.date}</div>
                  <div className="text-emerald-700 font-semibold">
                    Бригада нөөмөтчүсү карап жатат. Керек болсо сизге чалышат.
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Түшүнүктүү, жабуу
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">
                    Маселенин түрү:
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs font-medium"
                  >
                    <option value="Суу түтүгү жарылды / Суу жок">Суу түтүгү жарылды / Суу чыкпай жатат</option>
                    <option value="Таштанды чыгарылбай калды">Таштанды чыгарылбай калды / Челек толду</option>
                    <option value="Арык бүтөлүп суу каптоодо">Арык бүтөлүп суу каптоодо / Дренаж</option>
                    <option value="Колонка же суу чоргосу бузулду">Көчөдөгү суу колонкасы бузулду</option>
                    <option value="Жайыт чек арасы же суу маселеси">Жайыт чек арасы же мал сугаруу маселеси</option>
                    <option value="Сунуш же башка кайрылуу">Сунуш же башка кайрылуу</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-stone-700 font-semibold mb-1">Аты-жөнүңүз:</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Атыңыз..."
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-stone-700 font-semibold mb-1">Телефон номери:</label>
                    <input
                      type="text"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+996 (___) __-__-__"
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Так дареги (көчө, үй, ориентир):</label>
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Мисалы: Ленин көчөсү, 45-үй (мектептин жаны)"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Кырдаалдын баяндамасы:</label>
                  <textarea
                    rows={3}
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Эмне болгонун кыскача жазыңыз..."
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs resize-none"
                  />
                </div>

                {/* Photo attachment toggle */}
                <div className="flex items-center justify-between p-3 bg-stone-50 rounded-xl border border-stone-200">
                  <div className="flex items-center gap-2">
                    <Camera className="w-4 h-4 text-stone-500" />
                    <span className="text-stone-700">Сүрөт тиркөө (бузулган жери)</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setHasPhoto(!hasPhoto)}
                    className={`px-2.5 py-1 rounded text-[11px] font-semibold cursor-pointer ${
                      hasPhoto ? 'bg-emerald-700 text-white' : 'bg-stone-200 text-stone-700'
                    }`}
                  >
                    {hasPhoto ? 'Сүрөт тиркелди (1)' : '+ Сүрөт жүктөө'}
                  </button>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Диспетчерге жөнөтүү</span>
                  </button>
                </div>
              </form>
            )
          ) : (
            <div className="space-y-4 text-xs">
              <form onSubmit={handleSearchTicket} className="flex gap-2">
                <input
                  type="text"
                  value={checkId}
                  onChange={(e) => setCheckId(e.target.value)}
                  placeholder="Арыз номери (Мисалы: ТЗЛ-804)..."
                  className="flex-1 px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs font-mono"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-lg text-xs cursor-pointer"
                >
                  Текшерүү
                </button>
              </form>

              {foundTicket && (
                <div className="p-4 rounded-xl border border-stone-200 bg-stone-50 space-y-3">
                  <div className="flex items-center justify-between border-b border-stone-200 pb-2">
                    <span className="font-mono font-bold text-stone-900 text-sm">№ {foundTicket.id}</span>
                    <span className={`px-2.5 py-0.5 rounded text-[11px] font-bold ${
                      foundTicket.status === 'Аткарылды'
                        ? 'bg-emerald-100 text-emerald-800'
                        : foundTicket.status === 'Бригада жөнөтүлдү'
                        ? 'bg-amber-100 text-amber-900'
                        : 'bg-blue-100 text-blue-900'
                    }`}>
                      {foundTicket.status}
                    </span>
                  </div>
                  <div className="space-y-1 text-stone-600">
                    <div><strong>Категория:</strong> {foundTicket.category}</div>
                    <div><strong>Дарек:</strong> {foundTicket.address}</div>
                    <div><strong>Катталган убактысы:</strong> {foundTicket.date}</div>
                    <div><strong>Баяндама:</strong> {foundTicket.description}</div>
                  </div>
                  <div className="text-[11px] text-stone-400 border-t border-stone-200 pt-2">
                    Жооптуу бригада: Тез чара көрүү тобу №2 (мастер: А. Ибраимов)
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
