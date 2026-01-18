import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ChevronLeft,
    Camera,
    Calendar,
    Clock,
    User,
    Users,
    Plus,
    Minus,
    Bell,
    Check
} from 'lucide-react';

const CreateClass = () => {
    const navigate = useNavigate();
    const [isDarkMode, setIsDarkMode] = useState(document.documentElement.classList.contains('dark'));

    // Form States
    const [group, setGroup] = useState<'box' | 'fit'>('box');
    const [selectedDays, setSelectedDays] = useState<string[]>(['M']);
    const [capacity, setCapacity] = useState(20);
    const [repeatAllYear, setRepeatAllYear] = useState(true);
    const [notifyUsers, setNotifyUsers] = useState(false);

    // Sync theme
    useEffect(() => {
        const observer = new MutationObserver(() => {
            setIsDarkMode(document.documentElement.classList.contains('dark'));
        });
        observer.observe(document.documentElement, { attributes: true });
        return () => observer.disconnect();
    }, []);

    const days = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

    const toggleDay = (day: string) => {
        if (selectedDays.includes(day)) {
            setSelectedDays(selectedDays.filter(d => d !== day));
        } else {
            setSelectedDays([...selectedDays, day]);
        }
    };

    return (
        <div className={`min-h-screen transition-colors duration-500 pb-20 ${isDarkMode ? 'bg-[#1F2128] text-white' : 'bg-gray-50'}`}>
            {/* Header */}
            <header className={`sticky top-0 z-[200] px-6 py-5 flex items-center justify-between backdrop-blur-md ${isDarkMode ? 'bg-[#1F2128]/80' : 'bg-white/80'}`}>
                <button
                    onClick={() => navigate(-1)}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isDarkMode ? 'hover:bg-white/5' : 'hover:bg-gray-100'}`}
                >
                    <ChevronLeft size={24} className={isDarkMode ? 'text-white' : 'text-gray-900'} />
                </button>
                <h1 className={`text-sm font-black uppercase tracking-widest ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Nueva Clase
                </h1>
                <button className="text-xs font-black text-[#FF1F40] uppercase tracking-widest hover:opacity-80 transition-opacity">
                    Guardar
                </button>
            </header>

            <div className="max-w-md mx-auto px-6 pt-6 space-y-8">
                {/* Cover Image Upload */}
                <div className="space-y-3">
                    <h3 className="text-[10px] font-black tracking-[0.2em] text-gray-500 uppercase">Imagen de Portada</h3>
                    <div className={`aspect-video rounded-[2rem] border-2 border-dashed flex flex-col items-center justify-center gap-3 transition-colors ${isDarkMode ? 'border-gray-800 bg-[#2A2D3A]/30 hover:bg-[#2A2D3A]/50' : 'border-gray-200 bg-white hover:bg-gray-50 shadow-sm'
                        }`}>
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${isDarkMode ? 'bg-[#1F2128] text-gray-500' : 'bg-gray-100 text-gray-400'}`}>
                            <Camera size={28} />
                        </div>
                        <div className="text-center">
                            <p className={`text-sm font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Sube una foto</p>
                            <p className="text-[10px] text-gray-500 font-medium mt-1">Esta imagen se mostrará como hero en la clase</p>
                        </div>
                    </div>
                </div>

                {/* Class Name */}
                <div className="space-y-3">
                    <h3 className="text-[10px] font-black tracking-[0.2em] text-gray-500 uppercase">Nombre de la clase</h3>
                    <input
                        type="text"
                        defaultValue="Crossfit Morning"
                        className={`w-full py-5 px-6 rounded-2xl outline-none font-black text-base transition-all ${isDarkMode
                                ? 'bg-[#2A2D3A] text-white border border-transparent focus:border-[#FF1F40]/30'
                                : 'bg-white text-gray-900 border border-gray-100 shadow-sm focus:border-[#FF1F40]/30'
                            }`}
                    />
                </div>

                {/* Group Selector */}
                <div className="space-y-3">
                    <h3 className="text-[10px] font-black tracking-[0.2em] text-gray-500 uppercase">Grupo</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={() => setGroup('box')}
                            className={`p-6 rounded-[2rem] flex flex-col items-center gap-3 transition-all relative ${group === 'box'
                                    ? 'bg-[#FF1F40]/5 border-2 border-[#FF1F40] shadow-[0_10px_30px_rgba(255,31,64,0.1)]'
                                    : (isDarkMode ? 'bg-[#2A2D3A] border-2 border-transparent' : 'bg-white border-2 border-gray-50 shadow-sm')
                                }`}
                        >
                            {group === 'box' && (
                                <div className="absolute top-3 right-3 w-5 h-5 bg-[#FF1F40] rounded-full flex items-center justify-center text-white scale-110">
                                    <Check size={12} strokeWidth={4} />
                                </div>
                            )}
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${group === 'box' ? 'text-[#FF1F40]' : 'text-gray-500'}`}>
                                <Users size={28} />
                            </div>
                            <span className={`text-sm font-black ${group === 'box' ? (isDarkMode ? 'text-white' : 'text-gray-900') : 'text-gray-500'}`}>AlmodovarBox</span>
                        </button>

                        <button
                            onClick={() => setGroup('fit')}
                            className={`p-6 rounded-[2rem] flex flex-col items-center gap-3 transition-all relative ${group === 'fit'
                                    ? 'bg-[#FF1F40]/5 border-2 border-[#FF1F40] shadow-[0_10px_30px_rgba(255,31,64,0.1)]'
                                    : (isDarkMode ? 'bg-[#2A2D3A] border-2 border-transparent' : 'bg-white border-2 border-gray-50 shadow-sm')
                                }`}
                        >
                            {group === 'fit' && (
                                <div className="absolute top-3 right-3 w-5 h-5 bg-[#FF1F40] rounded-full flex items-center justify-center text-white scale-110">
                                    <Check size={12} strokeWidth={4} />
                                </div>
                            )}
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${group === 'fit' ? 'text-[#FF1F40]' : 'text-gray-500'}`}>
                                <UserIcon size={28} />
                            </div>
                            <span className={`text-sm font-black ${group === 'fit' ? (isDarkMode ? 'text-white' : 'text-gray-900') : 'text-gray-500'}`}>AlmodovarFit</span>
                        </button>
                    </div>
                </div>

                {/* Date Selection */}
                <div className="space-y-3">
                    <h3 className="text-[10px] font-black tracking-[0.2em] text-gray-500 uppercase">Fecha de Inicio</h3>
                    <div className={`relative group ${isDarkMode ? 'bg-[#2A2D3A]' : 'bg-white shadow-sm'} rounded-2xl`}>
                        <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none text-gray-500">
                            <Calendar size={20} />
                        </div>
                        <input
                            type="text"
                            defaultValue="10/24/2023"
                            className={`w-full py-5 pl-14 pr-14 rounded-2xl bg-transparent outline-none font-bold text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                        />
                        <div className="absolute inset-y-0 right-6 flex items-center pointer-events-none text-gray-400">
                            <Calendar size={18} />
                        </div>
                    </div>
                </div>

                {/* Time Selection */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-3">
                        <h3 className="text-[10px] font-black tracking-[0.2em] text-gray-500 uppercase">Inicio</h3>
                        <div className={`relative ${isDarkMode ? 'bg-[#2A2D3A]' : 'bg-white shadow-sm'} rounded-2xl`}>
                            <input
                                type="text"
                                defaultValue="09:00 AM"
                                className={`w-full py-5 px-6 rounded-2xl bg-transparent outline-none font-bold text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                            />
                            <div className="absolute inset-y-0 right-6 flex items-center pointer-events-none text-gray-400">
                                <Clock size={16} />
                            </div>
                        </div>
                    </div>
                    <div className="space-y-3">
                        <h3 className="text-[10px] font-black tracking-[0.2em] text-gray-500 uppercase">Fin</h3>
                        <div className={`relative ${isDarkMode ? 'bg-[#2A2D3A]' : 'bg-white shadow-sm'} rounded-2xl`}>
                            <input
                                type="text"
                                defaultValue="10:00 AM"
                                className={`w-full py-5 px-6 rounded-2xl bg-transparent outline-none font-bold text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                            />
                            <div className="absolute inset-y-0 right-6 flex items-center pointer-events-none text-gray-400">
                                <Clock size={16} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Publish Button Section */}
                <div className="pt-4">
                    <button className="w-full bg-[#FF1F40] py-6 rounded-[2rem] flex items-center justify-center gap-3 text-white font-black uppercase tracking-widest shadow-[0_15px_35px_rgba(255,31,64,0.4)] hover:scale-[1.02] active:scale-[0.98] transition-all">
                        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                            <Plus size={20} strokeWidth={4} />
                        </div>
                        Publicar Clase
                    </button>

                    {/* Week Days Selection Below Button */}
                    <div className="mt-8 space-y-4">
                        <div className="flex justify-between items-center px-2">
                            {days.map(d => (
                                <button
                                    key={d}
                                    onClick={() => toggleDay(d)}
                                    className={`w-11 h-11 rounded-full flex items-center justify-center font-black text-xs transition-all ${selectedDays.includes(d)
                                            ? 'bg-[#FF1F40] text-white shadow-[0_5px_15px_rgba(255,31,64,0.3)]'
                                            : (isDarkMode ? 'bg-[#2A2D3A] text-gray-500 hover:text-white' : 'bg-white text-gray-400 shadow-sm border border-gray-100')
                                        }`}
                                >
                                    {d}
                                </button>
                            ))}
                        </div>
                        <label className={`flex items-start gap-4 p-6 rounded-[2rem] cursor-pointer transition-all ${isDarkMode ? 'bg-[#2A2D3A]/50' : 'bg-white shadow-sm'}`}>
                            <div className="relative flex items-center pt-1">
                                <input
                                    type="checkbox"
                                    className="sr-only"
                                    checked={repeatAllYear}
                                    onChange={() => setRepeatAllYear(!repeatAllYear)}
                                />
                                <div className={`w-6 h-6 rounded-lg border-2 transition-all flex items-center justify-center ${repeatAllYear
                                        ? 'bg-[#FF1F40] border-[#FF1F40]'
                                        : (isDarkMode ? 'border-gray-700' : 'border-gray-200')
                                    }`}>
                                    {repeatAllYear && <Check size={14} className="text-white" strokeWidth={4} />}
                                </div>
                            </div>
                            <div className="flex-1">
                                <h4 className={`text-sm font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Repetir todo el año</h4>
                                <p className="text-[10px] text-gray-500 font-medium mt-0.5">La clase se crea para todos los martes</p>
                            </div>
                        </label>
                    </div>
                </div>

                {/* Trainer & Capacity */}
                <div className="grid grid-cols-5 gap-4">
                    <div className="col-span-3 space-y-3">
                        <h3 className="text-[10px] font-black tracking-[0.2em] text-gray-500 uppercase">Entrenador</h3>
                        <div className={`relative ${isDarkMode ? 'bg-[#2A2D3A]' : 'bg-white shadow-sm'} rounded-2xl`}>
                            <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-gray-500">
                                <User size={18} />
                            </div>
                            <select className={`w-full py-5 pl-12 pr-10 rounded-2xl bg-transparent outline-none font-bold text-sm appearance-none ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                <option>Ana González (Cros:</option>
                            </select>
                            <div className="absolute inset-y-0 right-5 flex items-center pointer-events-none text-gray-400">
                                <ChevronLeft className="rotate-[-90deg]" size={16} />
                            </div>
                        </div>
                    </div>
                    <div className="col-span-2 space-y-3">
                        <h3 className="text-[10px] font-black tracking-[0.2em] text-gray-500 uppercase">Aforo</h3>
                        <div className={`flex items-center justify-between w-full h-[60px] px-2 rounded-2xl ${isDarkMode ? 'bg-[#2A2D3A]' : 'bg-white shadow-sm'}`}>
                            <button
                                onClick={() => setCapacity(Math.max(1, capacity - 1))}
                                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${isDarkMode ? 'hover:bg-white/5 text-gray-500' : 'hover:bg-gray-50 text-gray-400'}`}
                            >
                                <Minus size={18} />
                            </button>
                            <span className={`text-base font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{capacity}</span>
                            <button
                                onClick={() => setCapacity(capacity + 1)}
                                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${isDarkMode ? 'hover:bg-white/5 text-gray-500' : 'hover:bg-gray-50 text-gray-400'}`}
                            >
                                <Plus size={18} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Description */}
                <div className="space-y-3">
                    <h3 className="text-[10px] font-black tracking-[0.2em] text-gray-500 uppercase">Descripción</h3>
                    <textarea
                        placeholder="Añade detalles sobre la clase, equipamiento necesario, etc..."
                        className={`w-full py-5 px-6 rounded-[2rem] outline-none font-medium text-sm transition-all h-32 resize-none ${isDarkMode
                                ? 'bg-[#2A2D3A] text-white border border-transparent focus:border-[#FF1F40]/30'
                                : 'bg-white text-gray-900 border border-gray-100 shadow-sm focus:border-[#FF1F40]/30'
                            }`}
                    />
                </div>

                {/* Notify Toggle */}
                <div className={`p-6 rounded-[2rem] flex items-center justify-between ${isDarkMode ? 'bg-[#2A2D3A]/30 border border-white/5' : 'bg-white shadow-sm border border-gray-50'}`}>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center text-[#FF1F40]">
                            <Bell size={22} />
                        </div>
                        <div>
                            <h4 className={`text-sm font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Notificar a usuarios</h4>
                            <p className="text-[10px] text-gray-500 font-medium">Enviar push al publicar</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setNotifyUsers(!notifyUsers)}
                        className={`w-12 h-6 rounded-full transition-all duration-300 relative ${notifyUsers ? 'bg-[#FF1F40]' : 'bg-gray-300 dark:bg-[#323645]'}`}
                    >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${notifyUsers ? 'left-7' : 'left-1'}`}></div>
                    </button>
                </div>
            </div>
        </div>
    );
};

// Helper Icon
const UserIcon = ({ size, className }: { size: number, className?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M12 2c-3 0-5 2-5 5s2 5 5 5 5-2 5-5-2-5-5-5z" />
        <path d="M12 14c-4 0-7 2-7 5v3h14v-3c0-3-3-5-7-5z" />
        <path d="M12 21c-2 0-3-1-3-1" />
    </svg>
);

export default CreateClass;
