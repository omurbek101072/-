import React, { useState } from 'react';
import { X, Send, AlertTriangle, CheckCircle2, Camera, Phone, MapPin, Search } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CitizenTicket } from '../types';
import { generateId, nowTimestamp } from '../utils/ids';
import { isValidKgPhone, PHONE_ERROR } from '../utils/validation';

// Сүрөттү кичирейтип (макс. 1024px, JPEG) data URL кылуу — браузердин сактагычына батышы үчүн
function compressImage(file: File, maxSize = 1024, quality = 0.7): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('read'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('image'));
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('canvas'));
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

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
  const [photo, setPhoto] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [createdTicket, setCreatedTicket] = useState<CitizenTicket | null>(null);

  // Check status fields
  const [checkId, setCheckId] = useState<string>('');
  const [foundTicket, setFoundTicket] = useState<CitizenTicket | null>(null);
  const [ticketNotFound, setTicketNotFound] = useState(false);

  if (!isOpen) return null;

  const resetForm = () => {
    setCategory('Суу түтүгү жарылды / Суу жок');
    setName('');
    setPhone('+996 ');
    setAddress('');
    setDescription('');
    setPhoto(null);
    setPhotoError(null);
    setFormError(null);
  };

  const handleClose = () => {
    if (createdTicket) {
      setCreatedTicket(null);
      resetForm();
    }
    onClose();
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setPhotoError('Сүрөт файлын гана тандаңыз.');
      return;
    }
    try {
      setPhoto(await compressImage(file));
      setPhotoError(null);
    } catch {
      setPhotoError('Сүрөттү жүктөөдө ката кетти. Башка сүрөт тандаңыз.');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidKgPhone(phone)) {
      setFormError(PHONE_ERROR);
      return;
    }
    if (!address.trim() || !description.trim()) {
      setFormError('Дарек жана баяндама талааларын толтуруңуз.');
      return;
    }
    setFormError(null);
    const newTicket: CitizenTicket = {
      id: generateId('ТЗЛ', citizenTickets.map(t => t.id)),
      category,
      name: name.trim() || 'Айыл тургуну',
      phone: phone.trim(),
      address: address.trim(),
      description: description.trim(),
      status: 'Кабыл алынды',
      date: nowTimestamp(),
      ...(photo ? { photo } : {})
    };
    addCitizenTicket(newTicket);
    setCreatedTicket(newTicket);
    resetForm();
  };

  const handleSearchTicket = (e: React.FormEvent) => {
    e.preventDefault();
    const q = checkId.trim().toUpperCase();
    if (q) {
      const cleaned = q.replace(/^№\s*/, '');
      const match = citizenTickets.find(t => t.id.toUpperCase() === cleaned);
      // Жок арыз үчүн жасалма жыйынтык көрсөтпөйбүз
      setFoundTicket(match || null);
      setTicketNotFound(!match);
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
            type="button"
            aria-label="Жабуу"
            onClick={handleClose}
            className="p-1.5 rounded-lg text-stone-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switchers */}
        <div className="flex border-b border-stone-200 text-xs font-semibold bg-stone-50">
          <button
            type="button"
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
            type="button"
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
                  type="button"
                  onClick={handleClose}
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
                      type="tel"
                      inputMode="tel"
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

                {/* Сүрөт тиркөө (чыныгы файл) */}
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Camera className="w-4 h-4 text-stone-500" />
                      <span className="text-stone-700">Сүрөт тиркөө (милдеттүү эмес)</span>
                    </div>
                    <label className="px-2.5 py-1 rounded text-[11px] font-semibold cursor-pointer bg-stone-200 text-stone-700 hover:bg-stone-300">
                      {photo ? 'Башка сүрөт' : '+ Сүрөт жүктөө'}
                      <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                    </label>
                  </div>
                  {photo && (
                    <div className="flex items-center gap-2">
                      <img src={photo} alt="Тиркелген сүрөт" className="w-16 h-16 object-cover rounded-lg border border-stone-200" />
                      <button
                        type="button"
                        onClick={() => setPhoto(null)}
                        className="text-[11px] font-semibold text-rose-600 hover:underline cursor-pointer"
                      >
                        Алып салуу
                      </button>
                    </div>
                  )}
                  {photoError && <p className="text-[11px] text-rose-600 font-semibold">{photoError}</p>}
                </div>

                {formError && (
                  <p className="text-[11px] text-rose-600 font-semibold">{formError}</p>
                )}

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
                  placeholder="Арыз номери (мисалы: ТЗЛ-261011-4821)..."
                  className="flex-1 px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs font-mono"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-lg text-xs cursor-pointer"
                >
                  Текшерүү
                </button>
              </form>

              {ticketNotFound && (
                <div className="p-3 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 font-semibold">
                  Мындай номердеги арыз табылган жок. Номерди текшерип кайра жазыңыз же диспетчерге чалыңыз.
                </div>
              )}

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
                    Жооптуу бригада: {foundTicket.assignedCrew || 'азырынча дайындала элек'}
                    {foundTicket.resolutionNotes && (
                      <div className="mt-1 text-stone-600">Жыйынтык: {foundTicket.resolutionNotes}</div>
                    )}
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
