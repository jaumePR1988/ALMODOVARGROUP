import { useState, useEffect } from 'react';
import {
  Bell,
  Sun,
  Moon,
  MapPin,
  Clock,
  Activity,
  Calendar,
  Home,
  Plus,
  User,
  MessageSquare
} from 'lucide-react';

// --- MOCK DATA FOR CLASSES ---
const CLASSES = [
  {
    id: 1,
    time: '09:00',
    period: 'AM',
    title: 'Open Box',
    subtitle: 'Sesión libre • 60 min',
    status: 'Disponible',
    spots: 8
  },
  {
    id: 2,
    time: '10:30',
    period: 'AM',
    title: 'Fit Boxing Kids',
    subtitle: '12-16 años • COMPLETO',
    status: 'Lista Espera',
    spots: 0
  },
  {
    id: 3,
    time: '18:00',
    period: 'PM',
    title: 'Fit Boxing WOD',
    subtitle: 'Fuerza funcional • 50 min',
    status: 'Reservado', // Reserved
    spots: 4
  },
  {
    id: 4,
    time: '19:30',
    period: 'PM',
    title: 'Open Box',
    subtitle: 'Sesión libre • 60 min',
    status: 'Disponible',
    spots: 12
  }
];

const UserDashboard = () => {
  // 1. Configuración General: Dark Mode by default
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [weekDays, setWeekDays] = useState<{ day: string; date: string; active: boolean }[]>([]);

  useEffect(() => {
    // Force dark mode class
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    // Generate Rolling 7-Day Window starting Today
    const days = ['DOM', 'LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB'];
    const today = new Date();

    const generatedWeek = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const dayName = days[d.getDay()];

      return {
        day: dayName,
        date: d.getDate().toString(),
        active: i === 0 // Today (first item) is always active
      };
    });

    setWeekDays(generatedWeek);
  }, []);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  // Placeholder Menu Items for User
  const menuItems = [
    { icon: <Activity size={20} />, label: 'Entrenar' },
    { icon: <Plus size={20} />, label: 'Peso' },
    { icon: <MessageSquare size={20} />, label: 'Chat' },
  ];

  return (
    <div className={`min-h-screen transition-colors duration-300 font-sans ${isDarkMode ? 'bg-[#1F2128] text-white' : 'bg-gray-100 text-gray-900'} overflow-x-hidden pb-24`}>
      {/* Mobile Wrapper: max-w-md mx-auto */}
      <div className="max-w-[440px] mx-auto p-4 sm:p-6 space-y-6">

        {/* 2. Header */}
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#FF1F40] rounded-full flex items-center justify-center font-bold text-lg text-white shadow-lg shadow-red-600/20">
              AG
            </div>
            <div>
              <h1 className="text-xl font-bold leading-tight tracking-tight">Almodovar <span className="text-[#FF1F40]">Group</span> <span className="text-[10px] opacity-30">v2.1</span></h1>
              <p className="text-xs font-semibold text-gray-500/80 dark:text-gray-400/80">Hola, Jaume 👋</p>
            </div>
          </div>
          <div className="flex gap-2.5">
            <button
              onClick={toggleTheme}
              className={`w-11 h-11 rounded-full flex items-center justify-center shadow-sm transition-all active:scale-90 ${isDarkMode ? 'bg-[#2A2D3A] text-white' : 'bg-white text-gray-600 border border-gray-100'}`}
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button className={`w-11 h-11 rounded-full flex items-center justify-center relative shadow-sm transition-all active:scale-90 ${isDarkMode ? 'bg-[#2A2D3A] text-white' : 'bg-white text-gray-600 border border-gray-100'}`}>
              <Bell size={20} />
              <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-[#FF1F40] rounded-full border-2 border-white dark:border-[#2A2D3A]"></span>
            </button>
          </div>
        </div>

        {/* 3. Créditos (Grid 2 col) */}
        <section className="grid grid-cols-2 gap-4">
          <div className="bg-white dark:bg-[#2A2D3A] p-5 rounded-3xl shadow-sm flex flex-col justify-between h-32">
            <span className="text-4xl font-black text-[#FF1F40]">12</span>
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Clases este mes</span>
          </div>
          <div className="bg-white dark:bg-[#2A2D3A] p-5 rounded-3xl shadow-sm flex flex-col justify-between h-32">
            <span className="text-4xl font-black text-gray-900 dark:text-white">3</span>
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Clases restantes</span>
          </div>
        </section>

        {/* 4. Calendario Horizontal (Strip) */}
        <section>
          <div className="flex justify-between items-end mb-2">
            <h2 className="text-lg font-bold dark:text-white">Esta semana</h2>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar" style={{ scrollbarWidth: 'none' }}>
            {weekDays.map((day, idx) => (
              <div
                key={idx}
                className={`
                  flex-shrink-0 flex flex-col items-center justify-center w-14 h-20 rounded-2xl transition-all cursor-pointer
                  ${day.active
                    ? 'bg-[#FF1F40] text-white shadow-lg shadow-red-900/30'
                    : 'bg-white dark:bg-[#2A2D3A] text-gray-500 dark:text-gray-400 border border-transparent hover:border-[#FF1F40]/50'}
                `}
              >
                <span className="text-[10px] font-bold uppercase mb-1">{day.day}</span>
                <span className="text-xl font-bold">{day.date}</span>
              </div>
            ))}
          </div>
        </section>

        {/* 5. Hero Section (Tu próxima clase) */}
        <section>
          <div className="flex justify-between items-end mb-4">
            <h2 className="text-xl font-bold dark:text-white">Tu próxima clase</h2>
            <a href="#" className="text-sm font-black text-[#FF1F40] tracking-wide hover:underline">VER CALENDARIO</a>
          </div>

          <div className="relative w-full h-56 rounded-3xl overflow-hidden shadow-lg group pointer-events-none">
            {/* Image */}
            <img
              src="https://images.unsplash.com/photo-1599058945522-28d584b6f0ff?q=80&w=800&auto=format&fit=crop"
              className="absolute inset-0 w-full h-full object-cover grayscale-[30%] group-hover:scale-105 transition-transform duration-700"
              alt="Next Class"
            />
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>

            {/* Content */}
            <div className="absolute inset-x-0 bottom-0 p-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="bg-[#FF1F40] text-white text-[10px] font-black px-3 py-1.5 rounded-lg uppercase shadow-lg shadow-red-900/40">HOY</span>
                <div className="flex items-center text-white text-[10px] bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-lg font-bold border border-white/10">
                  <Clock size={12} className="mr-1.5" />
                  18:00 - 18:50
                </div>
              </div>

              <h3 className="text-3xl text-white font-black italic uppercase mb-1 drop-shadow-md">Fit Boxing WOD</h3>

              <div className="flex items-center text-gray-200 text-xs font-bold gap-1 uppercase">
                <MapPin size={14} />
                <span>Sala Principal</span>
                <span className="mx-1">•</span>
                <span>Coach Alex</span>
              </div>
            </div>
          </div>
        </section>

        {/* 6. Acciones Rápidas (Grid 2 col) */}
        <section>
          <h2 className="text-xl font-bold mb-4 dark:text-white">Reservar nueva sesión</h2>
          <div className="grid grid-cols-2 gap-4">
            <button className="relative h-32 rounded-3xl overflow-hidden shadow-md group">
              <img
                src="https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?q=80&w=400&auto=format&fit=crop"
                className="absolute inset-0 w-full h-full object-cover brightness-[0.4] group-hover:scale-110 transition-transform duration-500"
                alt="Box"
              />
              <div className="relative z-10 flex flex-col items-center justify-center h-full">
                <span className="text-white text-xs font-bold uppercase tracking-widest opacity-80 mb-1">Almodovar</span>
                <span className="text-white text-3xl font-black italic bg-[#FF1F40] px-2 -rotate-2">BOX</span>
              </div>
            </button>

            <button className="relative h-32 rounded-3xl overflow-hidden shadow-md group border border-gray-200 dark:border-gray-700">
              <img
                src="https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=400&auto=format&fit=crop"
                className="absolute inset-0 w-full h-full object-cover brightness-[0.4] group-hover:scale-110 transition-transform duration-500"
                alt="Fit"
              />
              <div className="relative z-10 flex flex-col items-center justify-center h-full">
                <span className="text-white text-xs font-bold uppercase tracking-widest opacity-80 mb-1">Almodovar</span>
                <span className="text-[#FF1F40] bg-white text-3xl font-black px-2 rotate-2">FIT</span>
              </div>
            </button>
          </div>
        </section>

        {/* 7. Lista de Clases (Agenda) */}
        <section className="space-y-4">
          {CLASSES.map((item) => (
            <div
              key={item.id}
              className="bg-white dark:bg-[#2A2D3A] p-5 rounded-3xl flex items-center justify-between shadow-sm relative overflow-hidden"
            >
              {/* Left Decoration Border */}
              <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${item.status === 'Reservado' ? 'bg-[#FF1F40]' : 'bg-gray-200 dark:bg-gray-700'}`}></div>

              <div className="flex items-center gap-4 pl-2">
                <div className="flex flex-col text-center w-12">
                  <span className={`text-sm font-black ${item.status === 'Reservado' ? 'text-[#FF1F40]' : 'text-gray-900 dark:text-white'}`}>
                    {item.time}
                  </span>
                  <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase">{item.period}</span>
                </div>

                <div>
                  <h4 className="font-bold text-gray-900 dark:text-white uppercase leading-tight mb-0.5">{item.title}</h4>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">{item.subtitle}</p>
                </div>
              </div>

              {/* Action Button Logic */}
              <div>
                {item.status === 'Reservado' && (
                  <button className="bg-[#FF1F40] text-white text-xs font-bold px-4 py-2 rounded-xl shadow-md shadow-red-900/20 active:scale-95 transition-transform">
                    Reservado
                  </button>
                )}
                {item.status === 'Disponible' && (
                  <button className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                    Reservar
                  </button>
                )}
                {item.status === 'Lista Espera' && (
                  <button className="border border-gray-300 dark:border-gray-600 text-gray-400 text-xs font-bold px-4 py-2 rounded-xl cursor-not-allowed">
                    Lista Esp.
                  </button>
                )}
              </div>
            </div>
          ))}
        </section>

      </div>

      {/* Action Menu (Medialuna) Overlay */}
      {showMenu && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-md z-[100] transition-all duration-500"
          onClick={() => setShowMenu(false)}
        >
          <div className="absolute bottom-32 left-1/2 -translate-x-1/2 w-full max-w-md pointer-events-none">
            {menuItems.map((item, i) => {
              const totalItems = menuItems.length;
              const angleRange = 120;
              const startAngle = 150;
              const angle = startAngle - (i * (angleRange / (totalItems - 1)));

              const radius = 110;
              const x = radius * Math.cos((angle * Math.PI) / 180);
              const y = radius * Math.sin((angle * Math.PI) / 180);

              return (
                <button
                  key={i}
                  className="absolute left-1/2 bottom-0 -translate-x-1/2 w-16 h-16 bg-white dark:bg-[#2A2D3A] rounded-full shadow-xl flex flex-col items-center justify-center gap-0.5 pointer-events-auto active:scale-90 transition-all duration-300 ease-out border border-gray-100 dark:border-gray-700/50 group hover:shadow-[0_0_20px_rgba(255,31,64,0.4)] hover:border-[#FF1F40] hover:scale-110"
                  style={{
                    transform: `translate(calc(-50% + ${x}px), -${y}px)`,
                    opacity: showMenu ? 1 : 0,
                    transitionDelay: `${i * 50}ms`
                  }}
                >
                  <div className="text-gray-400 dark:text-gray-500 group-hover:text-[#FF1F40] transition-colors duration-300">
                    {item.icon}
                  </div>
                  <span className="text-[7px] font-black uppercase tracking-tighter text-gray-500 dark:text-gray-400 group-hover:text-[#FF1F40] transition-colors duration-300">
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Navigation (Fixed Bottom) */}
      <nav className={`fixed bottom-0 left-0 right-0 z-[110] border-t px-6 pb-6 pt-3 ${isDarkMode ? 'bg-[#1F2128]/95 backdrop-blur-md border-gray-800/60' : 'bg-white/95 backdrop-blur-md border-gray-200/60'}`}>
        <div className="max-w-[440px] mx-auto flex justify-between items-end px-4 relative">

          <a href="#" className="flex flex-col items-center gap-1.5 text-[#FF1F40] w-12 transition-transform active:scale-90">
            <Home size={26} strokeWidth={2.5} />
            <span className="text-[10px] font-bold tracking-wide">Box</span>
          </a>

          <a href="#" className={`flex flex-col items-center gap-1.5 w-12 transition-all active:scale-90 ${isDarkMode ? 'text-gray-500 hover:text-white' : 'text-gray-400 hover:text-gray-900'}`}>
            <Calendar size={26} strokeWidth={2} />
            <span className="text-[10px] font-bold tracking-wide">Agenda</span>
          </a>

          {/* Central Plus Button - PERFECTLY CENTERED */}
          <div className="relative -top-8">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className={`w-16 h-16 bg-[#FF1F40] rounded-full flex items-center justify-center text-white border-[6px] shadow-2xl shadow-red-900/50 active:scale-95 transition-all group ${isDarkMode ? 'border-[#1F2128]' : 'border-gray-100'
                } ${showMenu ? 'rotate-45' : 'rotate-0'}`}
            >
              <Plus size={36} strokeWidth={4} />
            </button>
          </div>

          <a href="#" className={`flex flex-col items-center gap-1.5 w-12 transition-all active:scale-90 ${isDarkMode ? 'text-gray-500 hover:text-white' : 'text-gray-400 hover:text-gray-900'}`}>
            <Activity size={26} strokeWidth={2} />
            <span className="text-[10px] font-bold tracking-wide">Perfil</span>
          </a>

          <a href="#" className={`flex flex-col items-center gap-1.5 w-12 transition-all active:scale-90 ${isDarkMode ? 'text-gray-500 hover:text-white' : 'text-gray-400 hover:text-gray-900'}`}>
            <User size={26} strokeWidth={2} />
            <span className="text-[10px] font-bold tracking-wide">Cuenta</span>
          </a>

        </div>
      </nav>
    </div>
  );
};

export default UserDashboard;
