import { useNavigate } from 'react-router-dom';
import {
    ChevronLeft,
    Trophy,
    Volume2,
    Tag,
    Info,
    Calendar
} from 'lucide-react';
import { useState } from 'react';

const NotificationSettings = () => {
    const navigate = useNavigate();
    const [isDarkMode] = useState(true);

    const [settings, setSettings] = useState({
        clases: true,
        retos: true,
        comunicados: true,
        ofertas: false
    });

    const toggleSetting = (key: keyof typeof settings) => {
        setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <div className={`min-h-screen transition-colors duration-500 ${isDarkMode ? 'bg-[#1F2128] text-white' : 'bg-gray-50'}`}>
            {/* Header */}
            <header className={`sticky top-0 z-[200] px-6 py-5 flex items-center justify-between backdrop-blur-md ${isDarkMode ? 'bg-[#1F2128]/80' : 'bg-white/80'}`}>
                <button
                    onClick={() => navigate(-1)}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isDarkMode ? 'hover:bg-white/5' : 'hover:bg-gray-100'}`}
                >
                    <ChevronLeft size={24} className={isDarkMode ? 'text-white' : 'text-gray-900'} />
                </button>
                <h1 className={`text-sm font-black uppercase tracking-widest ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Notificaciones
                </h1>
                <div className="relative">
                    <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-[#FF1F40]/50 shadow-[0_0_15px_rgba(255,31,64,0.3)]">
                        <img src="https://i.pravatar.cc/150?u=jaume" alt="User" className="w-full h-full object-cover" />
                    </div>
                </div>
            </header>

            <div className="max-w-md mx-auto px-6 pt-8 space-y-8 pb-20">
                {/* Title Section */}
                <div>
                    <h2 className={`text-2xl font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Personaliza tus alertas</h2>
                    <p className="text-gray-500 text-sm font-medium mt-2 leading-relaxed">
                        Gestiona qué notificaciones push quieres recibir en tu dispositivo para estar al día con tu entrenamiento en Almodovar Group.
                    </p>
                </div>

                {/* Section: Mis Entrenamientos */}
                <div className="space-y-4">
                    <h3 className="text-[10px] font-black tracking-[0.2em] text-gray-500 uppercase">Mis Entrenamientos</h3>
                    <div className={`rounded-[2rem] overflow-hidden ${isDarkMode ? 'bg-[#2A2D3A]' : 'bg-white shadow-xl shadow-gray-200/50'}`}>
                        {/* Clases Reservadas */}
                        <div className={`p-5 flex items-center justify-between border-b ${isDarkMode ? 'border-white/5' : 'border-gray-100'}`}>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500">
                                    <Calendar size={22} />
                                </div>
                                <div>
                                    <h4 className={`text-sm font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Clases Reservadas</h4>
                                    <p className="text-[11px] text-gray-500 font-medium">Recordatorios 1h antes</p>
                                </div>
                            </div>
                            <button
                                onClick={() => toggleSetting('clases')}
                                className={`w-12 h-6 rounded-full transition-all duration-300 relative ${settings.clases ? 'bg-[#FF1F40]' : 'bg-gray-300 dark:bg-gray-600'}`}
                            >
                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${settings.clases ? 'left-7' : 'left-1'}`}></div>
                            </button>
                        </div>

                        {/* Recordatorios de Retos */}
                        <div className="p-5 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-yellow-500/10 flex items-center justify-center text-yellow-500">
                                    <Trophy size={22} />
                                </div>
                                <div>
                                    <h4 className={`text-sm font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Recordatorios de Retos</h4>
                                    <p className="text-[11px] text-gray-500 font-medium">Progreso y nuevas medallas</p>
                                </div>
                            </div>
                            <button
                                onClick={() => toggleSetting('retos')}
                                className={`w-12 h-6 rounded-full transition-all duration-300 relative ${settings.retos ? 'bg-[#FF1F40]' : 'bg-gray-300 dark:bg-gray-600'}`}
                            >
                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${settings.retos ? 'left-7' : 'left-1'}`}></div>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Section: Novedades del Centro */}
                <div className="space-y-4">
                    <h3 className="text-[10px] font-black tracking-[0.2em] text-gray-500 uppercase">Novedades del Centro</h3>
                    <div className={`rounded-[2rem] overflow-hidden ${isDarkMode ? 'bg-[#2A2D3A]' : 'bg-white shadow-xl shadow-gray-200/50'}`}>
                        {/* Comunicados Generales */}
                        <div className={`p-5 flex items-center justify-between border-b ${isDarkMode ? 'border-white/5' : 'border-gray-100'}`}>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                                    <Volume2 size={22} />
                                </div>
                                <div>
                                    <h4 className={`text-sm font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Comunicados Generales</h4>
                                    <p className="text-[11px] text-gray-500 font-medium">Horarios, festivos y eventos</p>
                                </div>
                            </div>
                            <button
                                onClick={() => toggleSetting('comunicados')}
                                className={`w-12 h-6 rounded-full transition-all duration-300 relative ${settings.comunicados ? 'bg-[#FF1F40]' : 'bg-gray-300 dark:bg-gray-600'}`}
                            >
                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${settings.comunicados ? 'left-7' : 'left-1'}`}></div>
                            </button>
                        </div>

                        {/* Ofertas y Promociones */}
                        <div className="p-5 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-500">
                                    <Tag size={22} />
                                </div>
                                <div>
                                    <h4 className={`text-sm font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Ofertas y Promociones</h4>
                                    <p className="text-[11px] text-gray-500 font-medium">Descuentos exclusivos para ti</p>
                                </div>
                            </div>
                            <button
                                onClick={() => toggleSetting('ofertas')}
                                className={`w-12 h-6 rounded-full transition-all duration-300 relative ${settings.ofertas ? 'bg-[#FF1F40]' : 'bg-gray-300 dark:bg-gray-600'}`}
                            >
                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${settings.ofertas ? 'left-7' : 'left-1'}`}></div>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Info Box */}
                <div className={`p-6 rounded-[2rem] flex gap-4 ${isDarkMode ? 'bg-[#2A2D3A]/50 border border-white/5' : 'bg-gray-200/50'}`}>
                    <div className="shrink-0 mt-1">
                        <div className={`p-1.5 rounded-full ${isDarkMode ? 'bg-gray-400/20 text-gray-400' : 'bg-gray-500/10 text-gray-500'}`}>
                            <Info size={16} />
                        </div>
                    </div>
                    <p className="text-xs font-medium text-gray-500 mt-1 leading-relaxed">
                        Las notificaciones de cambios urgentes de sala o cancelaciones de última hora siempre se enviarán para garantizar tu asistencia.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default NotificationSettings;
