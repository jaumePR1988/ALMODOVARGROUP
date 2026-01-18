import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Bell,
    Sun,
    Moon,
    Calendar,
    Home,
    Users,
    Plus,
    Clock,
    Activity,
    MessageSquare,
    Settings,
    ClipboardList,
    User,
    Zap
} from 'lucide-react';

const [showMenu, setShowMenu] = useState(false);
const navigate = useNavigate();

useEffect(() => {
    if (isDarkMode) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
}, [isDarkMode]);

const toggleTheme = () => setIsDarkMode(!isDarkMode);

// Menu Items for Coach
const menuItems = [
    { icon: <ClipboardList size={22} />, label: 'Asistencia' },
    { icon: <Zap size={22} />, label: 'WOD' },
    { icon: <Activity size={22} />, label: '+Ejercicio' },
    { icon: <User size={22} />, label: 'Perfil' },
];

return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-[#1F2128] text-white' : 'bg-gray-100 text-gray-900'} font-sans pb-32 overflow-x-hidden`}>
        <div className="max-w-md mx-auto px-6 pt-6 space-y-8">

            {/* Header */}
            <header className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-[#FF1F40] flex items-center justify-center font-bold text-lg text-white shadow-lg shadow-red-600/20">
                        AG
                    </div>
                    <div>
                        <h1 className="text-xl font-bold leading-tight">Coach Panel</h1>
                        <p className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Coach: Marc Almodovar 👋</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={toggleTheme}
                        className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm transition-colors ${isDarkMode ? 'bg-[#2A2D3A] text-white' : 'bg-white text-gray-600'}`}
                    >
                        {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                    </button>
                    <button
                        onClick={() => navigate('/notifications')}
                        className={`w-10 h-10 rounded-full flex items-center justify-center relative shadow-sm transition-colors ${isDarkMode ? 'bg-[#2A2D3A] text-white' : 'bg-white text-gray-600'}`}
                    >
                        <Bell size={20} />
                        <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-[#FF1F40] rounded-full border-2 border-transparent"></span>
                    </button>
                </div>
            </header>

            {/* Coach Stats Grid */}
            <section className="grid grid-cols-2 gap-4">
                <div className={`${isDarkMode ? 'bg-[#2A2D3A]' : 'bg-white'} p-5 rounded-3xl shadow-sm flex flex-col justify-between h-36 border border-transparent dark:border-gray-800/50`}>
                    <div className="flex justify-between items-start">
                        <div className={`p-2.5 rounded-xl text-orange-400 ${isDarkMode ? 'bg-[#1F2128]' : 'bg-orange-50'}`}>
                            <Activity size={22} strokeWidth={2.5} />
                        </div>
                        <span className="text-[10px] font-black text-white bg-[#FF1F40] px-2 py-1 rounded-lg">HOY</span>
                    </div>
                    <div>
                        <span className="text-3xl font-black block leading-none">6</span>
                        <span className={`text-[10px] font-bold uppercase tracking-widest ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Clases Programadas</span>
                    </div>
                </div>
                <div className={`${isDarkMode ? 'bg-[#2A2D3A]' : 'bg-white'} p-5 rounded-3xl shadow-sm flex flex-col justify-between h-36 border border-transparent dark:border-gray-800/50`}>
                    <div className="flex justify-between items-start">
                        <div className={`p-2.5 rounded-xl text-blue-400 ${isDarkMode ? 'bg-[#1F2128]' : 'bg-blue-50'}`}>
                            <Users size={22} strokeWidth={2.5} />
                        </div>
                        <span className="text-[10px] font-black text-green-400 bg-green-400/10 px-2 py-1 rounded-lg">94%</span>
                    </div>
                    <div>
                        <span className="text-3xl font-black block leading-none">124</span>
                        <span className={`text-[10px] font-bold uppercase tracking-widest ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Alumnos Totales</span>
                    </div>
                </div>
            </section>

            {/* Next Class Focus */}
            <section className="relative h-48 rounded-[2.5rem] overflow-hidden shadow-2xl group active:scale-[0.98] transition-all">
                <img
                    src="https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80"
                    className="w-full h-full object-cover opacity-80 group-hover:scale-110 transition-transform duration-700"
                    alt="Coach"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col justify-end p-6">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="px-3 py-1 bg-white/20 backdrop-blur-md text-white text-[9px] font-black rounded-full uppercase border border-white/20">Próxima en 15m</span>
                    </div>
                    <h2 className="text-2xl font-black text-white leading-tight uppercase tracking-tight">Fit Boxing WOD<br /><span className="text-[#FF1F40]">Avanzado</span></h2>
                </div>
            </section>

            {/* Assigned Classes (Agenda del Coach) */}
            <section>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold uppercase italic tracking-tight">Mi Agenda <span className="text-[#FF1F40]">Enero</span></h2>
                    <button className="text-xs font-bold text-[#FF1F40] bg-[#FF1F40]/10 px-3 py-1.5 rounded-full">Ver Calendario</button>
                </div>

                <div className="space-y-3">
                    {[
                        { title: 'Taller Técnica Boxeo', time: '17:30 - 18:30', students: '22/25', level: 'Intermedio' },
                        { title: 'Open Box Coach Support', time: '18:30 - 19:30', students: '12/15', level: 'General' },
                        { title: 'Kids Boxing Session', time: '19:30 - 20:20', students: '25/25', level: 'Kids' },
                    ].map((clase, i) => (
                        <div key={i} className={`p-4 rounded-3xl flex items-center justify-between group cursor-pointer transition-all border shadow-sm ${isDarkMode ? 'bg-[#2A2D3A] border-white/5 hover:bg-[#323645]' : 'bg-white border-gray-100 hover:bg-gray-50'}`}>
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center overflow-hidden ${isDarkMode ? 'bg-[#1F2128]' : 'bg-gray-100'}`}>
                                    <img src={`https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=100&q=80&sig=${i}`} className="w-full h-full object-cover opacity-60" alt="" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-sm uppercase leading-tight tracking-tight">{clase.title}</h4>
                                    <div className="flex items-center text-gray-500 text-[10px] gap-1 font-bold mt-1">
                                        <Clock size={12} />
                                        {clase.time}
                                        <span className="mx-1">•</span>
                                        <span className="text-[#FF1F40]">{clase.level}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg ${clase.students === '25/25' ? 'bg-red-400/10 text-red-500 border border-red-500/20' : 'bg-green-400/10 text-green-400'}`}>
                                    {clase.students}
                                </span>
                                <p className="text-[8px] font-bold text-gray-500 uppercase mt-1 tracking-tighter">Pasar Lista</p>
                            </div>
                        </div>
                    ))}
                </div>
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
                        const angleRange = 140;
                        const startAngle = 160;
                        const angle = startAngle - (i * (angleRange / (totalItems - 1)));
                        const radius = 110;
                        const x = radius * Math.cos((angle * Math.PI) / 180);
                        const y = radius * Math.sin((angle * Math.PI) / 180);

                        return (
                            <button
                                key={i}
                                className="absolute left-1/2 bottom-0 -translate-x-1/2 w-16 h-16 bg-white dark:bg-[#2A2D3A] rounded-full shadow-xl flex flex-col items-center justify-center gap-0.5 pointer-events-auto active:scale-90 transition-all duration-300 border border-gray-100 dark:border-gray-700/50 group hover:shadow-[0_0_20px_rgba(255,31,64,0.4)] hover:border-[#FF1F40] hover:scale-110"
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

        {/* Navigation (Standardized) */}
        <nav className={`fixed bottom-0 left-0 right-0 z-[110] border-t px-6 pb-6 pt-3 ${isDarkMode ? 'bg-[#1F2128]/95 backdrop-blur-md border-gray-800/60' : 'bg-white/95 backdrop-blur-md border-gray-200/60'}`}>
            <div className="max-w-[440px] mx-auto flex justify-between items-end px-4 relative">

                <button className="flex flex-col items-center gap-1.5 text-[#FF1F40] w-12 transition-transform active:scale-90">
                    <Home size={26} strokeWidth={2.5} />
                    <span className="text-[10px] font-bold tracking-wide">Inicio</span>
                </button>

                <button className={`flex flex-col items-center gap-1.5 w-12 transition-all active:scale-90 ${isDarkMode ? 'text-gray-500 hover:text-white' : 'text-gray-400 hover:text-gray-900'}`}>
                    <Calendar size={26} strokeWidth={2} />
                    <span className="text-[10px] font-bold tracking-wide">Agenda</span>
                </button>

                <div className="relative -top-8">
                    <button
                        onClick={() => setShowMenu(!showMenu)}
                        className={`w-16 h-16 bg-[#FF1F40] rounded-full flex items-center justify-center text-white border-[6px] shadow-2xl shadow-red-900/50 active:scale-95 transition-all group ${isDarkMode ? 'border-[#1F2128]' : 'border-gray-100'
                            } ${showMenu ? 'rotate-45' : 'rotate-0'}`}
                    >
                        <Plus size={36} strokeWidth={4} />
                    </button>
                </div>

                <button className={`flex flex-col items-center gap-1.5 w-12 transition-all active:scale-90 ${isDarkMode ? 'text-gray-500 hover:text-white' : 'text-gray-400 hover:text-gray-900'}`}>
                    <MessageSquare size={26} strokeWidth={2} />
                    <span className="text-[10px] font-bold tracking-wide">Inbox</span>
                </button>

                <button className={`flex flex-col items-center gap-1.5 w-12 transition-all active:scale-90 ${isDarkMode ? 'text-gray-500 hover:text-white' : 'text-gray-400 hover:text-gray-900'}`}>
                    <Settings size={26} strokeWidth={2} />
                    <span className="text-[10px] font-bold tracking-wide">Ajustes</span>
                </button>

            </div>
        </nav>
    </div>
);
};

export default CoachDashboard;
