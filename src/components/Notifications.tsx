import { useNavigate } from 'react-router-dom';
import {
    ChevronLeft,
    CheckCircle2,
    Bell,
    Utensils,
    Tag,
    Settings,
    Trophy,
    Volume2,
    Settings2
} from 'lucide-react';
import { useState } from 'react';

const Notifications = () => {
    const navigate = useNavigate();
    const [isDarkMode] = useState(true); // Sync with app state later

    const notifications = [
        {
            id: 1,
            group: 'HOY',
            type: 'nutrition',
            sender: 'Coach Alex',
            title: '¡Plan de nutrición actualizado!',
            msg: 'Hola, he revisado tus progresos de la semana y he ajustado los macros en...',
            time: '10:30 AM',
            unread: true,
            icon: <Utensils size={20} className="text-blue-500" />,
            iconBg: 'bg-blue-500/10'
        },
        {
            id: 2,
            group: 'HOY',
            type: 'reminder',
            sender: 'Recordatorio de Clase',
            title: 'Tu clase comienza en 1 hora',
            msg: 'No olvides tu toalla y botella de agua para la sesión de HIIT de las 10:00 AM.',
            time: '09:00 AM',
            unread: true,
            icon: <Bell size={20} className="text-red-500" />,
            iconBg: 'bg-red-500/10'
        },
        {
            id: 3,
            group: 'AYER',
            type: 'promo',
            sender: 'Promo Suplementos',
            title: 'Solo por esta semana, disfruta de un',
            msg: '20% de descuento en toda la gama de...',
            time: '16:45 PM',
            unread: false,
            icon: <Tag size={20} className="text-purple-500" />,
            iconBg: 'bg-purple-500/10'
        },
        {
            id: 4,
            group: 'AYER',
            type: 'maintenance',
            sender: 'Mantenimiento Sauna',
            title: 'Informamos que la sauna masculina',
            msg: 'estará fuera de servicio por...',
            time: '11:20 AM',
            unread: false,
            icon: <Volume2 size={20} className="text-gray-500" />,
            iconBg: 'bg-gray-500/10'
        },
        {
            id: 5,
            group: 'SEMANA PASADA',
            type: 'trophy',
            sender: '¡Reto Completado!',
            title: '¡Felicidades! Has completado el reto',
            msg: '"Guerrero de Invierno" asistiendo a 12...',
            time: 'Lun',
            unread: false,
            icon: <Trophy size={20} className="text-yellow-500" />,
            iconBg: 'bg-yellow-500/10'
        }
    ];

    const groupedNotifications = notifications.reduce((acc: any, notif) => {
        if (!acc[notif.group]) acc[notif.group] = [];
        acc[notif.group].push(notif);
        return acc;
    }, {});

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
                    Bandeja de Entrada
                </h1>
                <div className="relative">
                    <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-[#FF1F40]/50 shadow-[0_0_15px_rgba(255,31,64,0.3)]">
                        <img src="https://i.pravatar.cc/150?u=jaume" alt="User" className="w-full h-full object-cover" />
                    </div>
                </div>
            </header>

            <div className="max-w-md mx-auto px-6 pt-8 space-y-8">
                {/* Title Section */}
                <div className="flex justify-between items-end">
                    <div>
                        <h2 className={`text-2xl font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Mis Mensajes</h2>
                        <p className="text-gray-500 text-sm font-medium mt-1">
                            Tienes <span className="text-[#FF1F40] font-bold">2 nuevos</span> mensajes.
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <button className="text-[10px] font-black text-[#FF1F40] uppercase tracking-wider hover:underline">
                            Marcar todo leído
                        </button>
                        <button
                            onClick={() => navigate('/notification-settings')}
                            className={`p-2 rounded-xl transition-colors ${isDarkMode ? 'bg-white/5 text-gray-400 hover:text-white' : 'bg-gray-100 text-gray-500'}`}
                        >
                            <Settings2 size={18} />
                        </button>
                    </div>
                </div>

                {/* Notifications List */}
                <div className="space-y-8 pb-32">
                    {Object.keys(groupedNotifications).map((group) => (
                        <div key={group} className="space-y-4">
                            <h3 className="text-[10px] font-black tracking-[0.2em] text-gray-500 uppercase">{group}</h3>
                            <div className={`rounded-[2rem] overflow-hidden ${isDarkMode ? 'bg-[#2A2D3A]' : 'bg-white shadow-xl shadow-gray-200/50'}`}>
                                {groupedNotifications[group].map((notif: any, idx: number) => (
                                    <div
                                        key={notif.id}
                                        className={`relative p-5 flex items-start gap-4 transition-all active:scale-[0.98] cursor-pointer ${idx !== groupedNotifications[group].length - 1 ? (isDarkMode ? 'border-b border-white/5' : 'border-b border-gray-100') : ''
                                            } ${notif.unread ? '' : 'opacity-80'}`}
                                    >
                                        {/* Unread Indicator Line */}
                                        {notif.unread && (
                                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#FF1F40]"></div>
                                        )}

                                        {/* Icon Container */}
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${notif.iconBg}`}>
                                            {notif.icon}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0 pr-4">
                                            <div className="flex justify-between items-start mb-1">
                                                <h4 className={`text-sm font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{notif.sender}</h4>
                                                <span className={`text-[10px] font-bold ${notif.unread ? 'text-[#FF1F40]' : 'text-gray-500'}`}>{notif.time}</span>
                                            </div>
                                            <p className={`text-xs font-bold mb-1 truncate ${isDarkMode ? 'text-gray-300' : 'text-gray-800'}`}>{notif.title}</p>
                                            <p className="text-[11px] text-gray-500 font-medium line-clamp-2 leading-relaxed">{notif.msg}</p>
                                        </div>

                                        {/* Chevron */}
                                        <div className="mt-1">
                                            <ChevronLeft size={16} className="rotate-180 text-gray-300 transition-transform group-hover:translate-x-0.5" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Notifications;
