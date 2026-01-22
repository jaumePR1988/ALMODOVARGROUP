import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Home,
    Calendar,
    Plus,
    MessageSquare,
    Settings,
    User,
    Activity,
    Users,
    Zap,
    Newspaper
} from 'lucide-react';

interface BottomNavigationProps {
    role: 'admin' | 'coach' | 'user' | string;
    activeTab: 'home' | 'agenda' | 'notifications' | 'settings' | 'profile' | 'users' | 'inbox' | 'messages' | 'news';
}

const BottomNavigation: React.FC<BottomNavigationProps> = ({ role, activeTab }) => {
    const navigate = useNavigate();
    const [showMenu, setShowMenu] = useState(false);
    const isDarkMode = document.documentElement.classList.contains('dark');

    // Menu Items per Role
    const menuItems: any = {
        admin: [
            { icon: <Calendar size={20} />, label: 'Sesión', path: '/manage-classes' },
            { icon: <Users size={20} />, label: 'Usuarios', path: '/manage-users' },
            { icon: <Activity size={20} />, label: 'Reports', path: '/reports' },
            { icon: <Zap size={20} />, label: 'Ejercicios', path: '/exercise-library' },
            { icon: <Settings size={20} />, label: 'Accesos', path: '/notification-settings' },
            { icon: <MessageSquare size={20} />, label: 'Enviar', path: '/send-notification' },
        ],
        coach: [
            { icon: <Calendar size={22} />, label: 'Agenda', path: '/agenda' },
            { icon: <Zap size={22} />, label: 'WOD', path: '#' },
            { icon: <Activity size={22} />, label: '+Ejercicio', path: '#' },
            { icon: <MessageSquare size={22} />, label: 'Enviar', path: '/send-notification' },
            { icon: <User size={22} />, label: 'Perfil', path: '#' },
        ],
        user: [
            { icon: <Zap size={22} />, label: 'WOD', path: '#' },
            { icon: <Activity size={22} />, label: 'Stats', path: '#' },
            { icon: <MessageSquare size={22} />, label: 'Chat', path: '#' },
            { icon: <Settings size={22} />, label: 'Ajustes', path: '/notification-settings' },
        ]
    };

    // Normalize role and fallback to user
    const normalizedRole = (role === 'cliente' ? 'user' : role) as string;
    const currentMenuItems = menuItems[normalizedRole] || menuItems.user;

    // Helper for button classes
    const getButtonClass = (tabName: string) => {
        const isActive = activeTab === tabName;
        if (isActive) {
            return "flex flex-col items-center gap-1.5 text-[#FF1F40] w-12 transition-transform active:scale-90 scale-110";
        }
        return `flex flex-col items-center gap-1.5 w-12 transition-all active:scale-90 ${isDarkMode ? 'text-gray-500 hover:text-white' : 'text-gray-400 hover:text-gray-900'}`;
    };

    return (
        <>
            {/* Medialuna Menu Overlay */}
            {showMenu && (
                <div
                    className="fixed inset-0 bg-black/40 backdrop-blur-md z-[105] transition-all duration-500"
                    onClick={() => setShowMenu(false)}
                >
                    <div className="absolute bottom-40 left-1/2 -translate-x-1/2 w-full max-w-[440px] pointer-events-none">
                        {currentMenuItems.map((item: any, i: number) => {
                            // Symmetrical ark centered at 90 degrees
                            const totalItems = currentMenuItems.length;
                            const angleRange = totalItems > 3 ? 160 : 120; // Wider for more items
                            const startAngle = 90 + (angleRange / 2);
                            const angle = startAngle - (i * (angleRange / (totalItems - 1)));

                            const radius = 110;
                            const x = radius * Math.cos((angle * Math.PI) / 180);
                            const y = radius * Math.sin((angle * Math.PI) / 180);

                            return (
                                <button
                                    key={i}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (item.path !== '#') navigate(item.path);
                                        setShowMenu(false);
                                    }}
                                    className="absolute left-1/2 bottom-0 -translate-x-1/2 w-16 h-16 bg-white dark:bg-[#2A2D3A] rounded-full shadow-[0_0_15px_rgba(255,31,64,0.3)] flex flex-col items-center justify-center gap-0.5 pointer-events-auto active:scale-90 transition-all duration-300 ease-out border-[2px] border-[#FF1F40] group"
                                    style={{
                                        transform: `translate(calc(-50% + ${x}px), -${y}px)`,
                                        opacity: showMenu ? 1 : 0,
                                        transitionDelay: `${i * 50}ms`
                                    }}
                                >
                                    <div className="text-[#FF1F40] transition-colors duration-300">
                                        {item.icon}
                                    </div>
                                    <span className="text-[7px] font-black uppercase tracking-tighter text-[#FF1F40]">
                                        {item.label}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            <nav className={`fixed bottom-0 left-0 right-0 z-[110] border-t px-6 pb-6 pt-3 transition-colors duration-300 ${isDarkMode ? 'bg-[#1F2128]/95 backdrop-blur-md border-gray-800/60' : 'bg-white/95 backdrop-blur-md border-gray-200/60'}`}>
                <div className="max-w-[440px] mx-auto flex justify-between items-end px-4 relative">

                    {/* 1. HOME BUTTON */}
                    <button
                        onClick={() => navigate(normalizedRole === 'admin' ? '/admin' : normalizedRole === 'coach' ? '/coach' : '/')}
                        className={getButtonClass('home')}
                    >
                        <Home size={26} strokeWidth={activeTab === 'home' ? 2.5 : 2} />
                        <span className="text-[10px] font-bold tracking-wide">
                            {normalizedRole === 'user' ? 'Inicio' : 'Inicio'}
                        </span>
                    </button>

                    {/* 2. AGENDA BUTTON */}
                    <button
                        onClick={() => navigate('/agenda')}
                        className={getButtonClass('agenda')}
                    >
                        <Calendar size={26} strokeWidth={activeTab === 'agenda' ? 2.5 : 2} />
                        <span className="text-[10px] font-bold tracking-wide">Agenda</span>
                    </button>

                    {/* 3. CENTER FAB (Floating Action Button) */}
                    <div className="relative -top-8">
                        <button
                            onClick={() => setShowMenu(!showMenu)}
                            className={`w-16 h-16 bg-[#FF1F40] rounded-full flex items-center justify-center text-white border-[6px] shadow-2xl shadow-red-900/50 active:scale-95 transition-all group ${isDarkMode ? 'border-[#1F2128]' : 'border-gray-100'} ${showMenu ? 'rotate-45' : 'rotate-0'}`}
                        >
                            <Plus size={36} strokeWidth={4} />
                        </button>
                    </div>

                    {/* 4. NEWS BUTTON (Replaces Messages/Inbox/Profile duplication) */}
                    <button
                        onClick={() => navigate('/news')}
                        className={getButtonClass('news')}
                    >
                        <Newspaper size={26} strokeWidth={activeTab === 'news' ? 2.5 : 2} />
                        <span className="text-[10px] font-bold tracking-wide">Noticias</span>
                    </button>

                    {/* 5. PROFILE BUTTON (Always visible) */}
                    <button
                        onClick={() => navigate('/profile')}
                        className={getButtonClass('profile')}
                    >
                        <User size={26} strokeWidth={activeTab === 'profile' ? 2.5 : 2} />
                        <span className="text-[10px] font-bold tracking-wide">Perfil</span>
                    </button>

                </div>
            </nav>
        </>
    );
};

export default BottomNavigation;

