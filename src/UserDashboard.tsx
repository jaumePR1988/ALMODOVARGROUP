import React, { useState, useEffect } from 'react';
import {
  Bell,
  Sun,
  Moon,
  MapPin,
  Clock,
  Dumbbell,
  Activity,
  Calendar,
  Home,
  User,
  Plus
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

  return (
    // Base Container: #1F2128 (brand-dark) in dark mode
    <div className="min-h-screen bg-gray-100 dark:bg-[#1F2128] text-gray-900 dark:text-white font-sans transition-colors duration-300 pb-32">

      {/* Mobile Wrapper: max-w-md mx-auto */}
      <div className="max-w-md mx-auto relative px-6 pt-6 space-y-8">

        {/* 2. Header */}
        <header className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full border-2 border-[#FF1F40] p-0.5">
              <img
                src="https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=400&auto=format&fit=crop&q=60"
                alt="Avatar"
                className="w-full h-full object-cover rounded-full"
              />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Hola, Alex</p>
              <h1 className="text-xl font-bold leading-tight">Vamos a entrenar</h1>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={toggleTheme}
              className="w-10 h-10 rounded-full bg-white dark:bg-[#2A2D3A] flex items-center justify-center text-gray-600 dark:text-white shadow-sm"
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button className="w-10 h-10 rounded-full bg-white dark:bg-[#2A2D3A] flex items-center justify-center text-gray-600 dark:text-white shadow-sm relative">
              <Bell size={20} />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-[#FF1F40] rounded-full border-2 border-white dark:border-[#2A2D3A]"></span>
            </button>
          </div>
        </header>

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

      {/* 8. Bottom Navigation (Sticky Bottom) - FIXED */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white dark:bg-[#1F2128] border-t border-gray-200 dark:border-gray-800 z-50 pb-safe">
        <div className="flex justify-between items-end h-20 px-6 pb-4 relative">

          <a href="#" className="flex flex-col items-center gap-1 text-[#FF1F40] w-12">
            <Home size={24} strokeWidth={2} />
            <span className="text-[10px] font-bold">Inicio</span>
          </a>

          <a href="#" className="flex flex-col items-center gap-1 text-gray-400 dark:text-gray-500 w-12 hover:text-[#FF1F40] dark:hover:text-white transition-colors">
            <Calendar size={24} strokeWidth={2} />
            <span className="text-[10px] font-bold">Agenda</span>
          </a>

          {/* Giant Floating Plus Button - FIXED CUTOUT FOR LIGHT MODE */}
          <div className="relative -top-8">
            <button className="w-16 h-16 bg-[#FF1F40] rounded-full flex items-center justify-center text-white border-[6px] border-white dark:border-[#1F2128] shadow-2xl shadow-red-900/50 active:scale-95 transition-transform group">
              <Plus size={36} strokeWidth={4} className="group-hover:scale-110 transition-transform" />
            </button>
          </div>

          <a href="#" className="flex flex-col items-center gap-1 text-gray-400 dark:text-gray-500 w-12 hover:text-[#FF1F40] dark:hover:text-white transition-colors">
            <Activity size={24} strokeWidth={2} />
            <span className="text-[10px] font-bold">Perfil</span>
          </a>

          <a href="#" className="flex flex-col items-center gap-1 text-gray-400 dark:text-gray-500 w-12 hover:text-[#FF1F40] dark:hover:text-white transition-colors">
            <User size={24} strokeWidth={2} />
            <span className="text-[10px] font-bold">Cuenta</span>
          </a>

        </div>
      </nav>

    </div>
  );
};

export default UserDashboard;
