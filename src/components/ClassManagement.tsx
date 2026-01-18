import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ChevronLeft,
    Calendar as CalendarIcon,
    List,
    MoreVertical,
    Plus,
    Trash2
} from 'lucide-react';

const ClassManagement = () => {
    const navigate = useNavigate();
    const [isDarkMode, setIsDarkMode] = useState(document.documentElement.classList.contains('dark'));
    const [view, setView] = useState<'calendar' | 'list'>('list');
    const [selectedDate, setSelectedDate] = useState(24);

    // Sync with global theme
    useEffect(() => {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'class') {
                    setIsDarkMode(document.documentElement.classList.contains('dark'));
                }
            });
        });
        observer.observe(document.documentElement, { attributes: true });
        return () => observer.disconnect();
    }, []);

    const dates = [
        { day: 'LUN', date: 23 },
        { day: 'MAR', date: 24 },
        { day: 'MIE', date: 25 },
        { day: 'JUE', date: 26 },
        { day: 'VIE', date: 27 },
        { day: 'SAB', date: 28 },
    ];

    const classes = [
        {
            id: 1,
            time: '09:00',
            ampm: 'AM',
            name: 'Yoga Morning',
            instructor: 'Ana G.',
            capacity: 15,
            total: 20,
            status: 'available',
            color: 'bg-green-500'
        },
        {
            id: 2,
            time: '11:30',
            ampm: 'AM',
            name: 'HIIT Intenso',
            instructor: 'Carlos M.',
            capacity: 8,
            total: 10,
            status: 'warning',
            color: 'bg-yellow-500'
        },
        {
            id: 3,
            time: '18:00',
            ampm: 'PM',
            name: 'BodyPump',
            instructor: 'Maria L.',
            capacity: 20,
            total: 20,
            status: 'full',
            color: 'bg-red-500'
        },
        {
            id: 4,
            time: '20:00',
            ampm: 'PM',
            name: 'Zumba',
            instructor: 'Sofia R.',
            capacity: 0,
            total: 20,
            status: 'cancelled',
            color: 'bg-gray-400'
        }
    ];

    return (
        <div className={`min-h-screen transition-colors duration-500 pb-40 ${isDarkMode ? 'bg-[#1F2128] text-white' : 'bg-[#F3F4F6]'}`}>
            {/* Header */}
            <header className={`sticky top-0 z-[200] px-6 py-5 flex items-center justify-between backdrop-blur-md ${isDarkMode ? 'bg-[#1F2128]/80' : 'bg-white/80'}`}>
                <button
                    onClick={() => navigate(-1)}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isDarkMode ? 'hover:bg-white/5' : 'hover:bg-gray-100'}`}
                >
                    <ChevronLeft size={24} className={isDarkMode ? 'text-white' : 'text-gray-900'} />
                </button>
                <h1 className={`text-sm font-black uppercase tracking-widest ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Gestión de Clases
                </h1>
                <div className="relative">
                    <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-[#FF1F40]/50 shadow-[0_0_15px_rgba(255,31,64,0.3)]">
                        <img src="https://i.pravatar.cc/150?u=jaume" alt="User" className="w-full h-full object-cover" />
                    </div>
                </div>
            </header>

            <div className="max-w-md mx-auto px-6 pt-6 space-y-8">
                {/* View Switcher */}
                <div className={`p-1 rounded-2xl flex ${isDarkMode ? 'bg-[#2A2D3A]' : 'bg-gray-200'}`}>
                    <button
                        onClick={() => setView('calendar')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl transition-all font-bold text-sm ${view === 'calendar' ? (isDarkMode ? 'bg-[#323645] text-white shadow-lg' : 'bg-white text-gray-900 shadow-md') : 'text-gray-500'}`}
                    >
                        <CalendarIcon size={18} />
                        Calendario
                    </button>
                    <button
                        onClick={() => setView('list')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl transition-all font-bold text-sm ${view === 'list' ? (isDarkMode ? 'bg-[#323645] text-white shadow-lg' : 'bg-white text-gray-900 shadow-md') : 'text-gray-500'}`}
                    >
                        <List size={18} />
                        Lista
                    </button>
                </div>

                {/* Date Picker - Static Grid */}
                <div className="space-y-4">
                    <div className="grid grid-cols-6 gap-2">
                        {dates.map((d) => (
                            <button
                                key={d.date}
                                onClick={() => setSelectedDate(d.date)}
                                className="flex flex-col items-center gap-2 transition-all group"
                            >
                                <span className={`text-[10px] font-black tracking-widest ${selectedDate === d.date ? 'text-[#FF1F40]' : 'text-gray-500'}`}>{d.day}</span>
                                <div className={`w-full aspect-square max-w-[55px] rounded-2xl flex items-center justify-center font-black text-base transition-all ${selectedDate === d.date
                                    ? 'bg-[#FF1F40] text-white shadow-[0_8px_20px_rgba(255,31,64,0.4)] scale-110'
                                    : (isDarkMode ? 'bg-[#2A2D3A] text-gray-400 hover:bg-[#323645]' : 'bg-white text-gray-600 hover:bg-white shadow-md border border-gray-100')
                                    }`}>
                                    {d.date}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Section Title */}
                <div className="flex justify-between items-end pt-2">
                    <h2 className={`text-xl font-black uppercase tracking-tight ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Clases de Hoy</h2>
                    <span className="text-[10px] font-black text-[#FF1F40] bg-[#FF1F40]/10 px-3 py-1.5 rounded-full uppercase tracking-wider">4 clases</span>
                </div>

                {/* Classes List */}
                <div className="space-y-4">
                    {classes.map((cls) => (
                        <div
                            key={cls.id}
                            className={`relative rounded-[2.5rem] overflow-hidden transition-all active:scale-[0.98] ${cls.status === 'cancelled'
                                ? (isDarkMode ? 'bg-transparent border-2 border-dashed border-gray-800 opacity-50' : 'bg-transparent border-2 border-dashed border-gray-200 opacity-60')
                                : (isDarkMode ? 'bg-[#2A2D3A]' : 'bg-white shadow-xl shadow-gray-300/30')
                                }`}
                        >
                            {/* Accent Line */}
                            {!['cancelled', 'full'].includes(cls.status) && (
                                <div className={`absolute left-0 top-0 bottom-0 w-1.5 transition-colors ${cls.status === 'available' ? 'bg-[#FF1F40]' : 'bg-[#1F2128]'}`}></div>
                            )}

                            <div className="p-6 space-y-6">
                                {/* Top Row */}
                                <div className="flex items-center gap-4">
                                    <div className={`w-16 h-14 rounded-2xl flex flex-col items-center justify-center shrink-0 ${isDarkMode ? 'bg-[#1F2128]' : 'bg-gray-100/50'}`}>
                                        <span className={`text-sm font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{cls.time}</span>
                                        <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">{cls.ampm}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className={`text-base font-black truncate ${isDarkMode ? 'text-white' : 'text-gray-900'} ${cls.status === 'cancelled' ? 'line-through' : ''}`}>
                                                {cls.name}
                                            </h3>
                                            {cls.status === 'full' && (
                                                <span className="bg-[#FF1F40] text-white text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter">Lleno</span>
                                            )}
                                            {cls.status === 'cancelled' && (
                                                <span className="bg-gray-200 dark:bg-gray-700 text-gray-500 text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter">Cancelado</span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1.5 text-gray-500">
                                            <div className="w-5 h-5 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
                                                <UserIcon size={12} fill="currentColor" />
                                            </div>
                                            <span className="text-xs font-bold">Instructor: {cls.instructor}</span>
                                        </div>
                                    </div>
                                    <button className="text-gray-400 hover:text-white transition-colors">
                                        {cls.status === 'cancelled' ? <Trash2 size={18} /> : <MoreVertical size={20} />}
                                    </button>
                                </div>

                                {/* Bottom Row (Aforo) */}
                                <div className="space-y-2">
                                    <div className="flex justify-between items-end">
                                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                                            {cls.status === 'full' ? 'Aforo Completo' : 'Aforo'}
                                        </span>
                                        <span className={`text-[10px] font-black ${cls.status === 'full' ? 'text-[#FF1F40]' : 'text-gray-500'}`}>
                                            {cls.capacity}/{cls.total}
                                        </span>
                                    </div>
                                    <div className={`h-2 rounded-full overflow-hidden ${isDarkMode ? 'bg-[#1F2128]' : 'bg-gray-200'}`}>
                                        <div
                                            className={`h-full rounded-full transition-all duration-700 ${cls.status === 'cancelled' ? 'bg-gray-300 dark:bg-gray-700' :
                                                cls.status === 'full' ? 'bg-[#FF1F40]' :
                                                    cls.status === 'warning' ? 'bg-yellow-500' : 'bg-green-500'
                                                }`}
                                            style={{ width: `${(cls.capacity / cls.total) * 100}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Floating Action Button - Centered */}
            <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[300]">
                <button
                    onClick={() => navigate('/create-class')}
                    className="w-16 h-16 bg-[#FF1F40] rounded-full flex items-center justify-center text-white shadow-[0_10px_30px_rgba(255,31,64,0.5)] hover:scale-110 active:scale-95 transition-all outline-none"
                >
                    <Plus size={36} strokeWidth={3} />
                </button>
            </div>
        </div>
    );
};

// Helper component for Icon
const UserIcon = ({ size, fill, className }: { size: number, fill?: string, className?: string }) => (
    <svg
        width={size} height={size} viewBox="0 0 24 24" fill={fill || "none"}
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}
    >
        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
    </svg>
);

export default ClassManagement;
