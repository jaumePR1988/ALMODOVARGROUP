import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Calendar, Plus, MessageSquare, Settings, User, Bell, Activity } from 'lucide-react';

interface BottomNavigationProps {
    role: 'admin' | 'coach' | 'user';
    activeTab: 'home' | 'agenda' | 'notifications' | 'settings' | 'profile' | 'users' | 'inbox';
    onFabClick?: () => void;
    showMenu?: boolean; // To rotate the FAB
}

const BottomNavigation: React.FC<BottomNavigationProps> = ({ role, activeTab, onFabClick, showMenu }) => {
    const navigate = useNavigate();
    const isDarkMode = document.documentElement.classList.contains('dark');

    // Helper for button classes
    const getButtonClass = (tabName: string) => {
        const isActive = activeTab === tabName;
        // Active color: Red (#FF1F40)
        // Inactive: Gray
        if (isActive) {
            return "flex flex-col items-center gap-1.5 text-[#FF1F40] w-12 transition-transform active:scale-90 scale-110";
        }
        return `flex flex-col items-center gap-1.5 w-12 transition-all active:scale-90 ${isDarkMode ? 'text-gray-500 hover:text-white' : 'text-gray-400 hover:text-gray-900'}`;
    };

    return (
        <nav className={`fixed bottom-0 left-0 right-0 z-[110] border-t px-6 pb-6 pt-3 transition-colors duration-300 ${isDarkMode ? 'bg-[#1F2128]/95 backdrop-blur-md border-gray-800/60' : 'bg-white/95 backdrop-blur-md border-gray-200/60'}`}>
            <div className="max-w-[440px] mx-auto flex justify-between items-end px-4 relative">

                {/* 1. HOME BUTTON */}
                <button
                    onClick={() => navigate(role === 'admin' ? '/admin' : role === 'coach' ? '/coach' : '/')}
                    className={getButtonClass('home')}
                >
                    <Home size={26} strokeWidth={activeTab === 'home' ? 2.5 : 2} />
                    <span className="text-[10px] font-bold tracking-wide">
                        {role === 'user' ? 'Box' : 'Inicio'}
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
                        onClick={onFabClick}
                        className={`w-16 h-16 bg-[#FF1F40] rounded-full flex items-center justify-center text-white border-[6px] shadow-2xl shadow-red-900/50 active:scale-95 transition-all group ${isDarkMode ? 'border-[#1F2128]' : 'border-gray-100'} ${showMenu ? 'rotate-45' : 'rotate-0'}`}
                    >
                        <Plus size={36} strokeWidth={4} />
                    </button>
                </div>

                {/* 4. FOURTH BUTTON (Role specific) */}
                {role === 'admin' ? (
                    <button className={getButtonClass('messages')}> {/* Placeholder for Admin Messages */}
                        <MessageSquare size={26} strokeWidth={2} />
                        <span className="text-[10px] font-bold tracking-wide">Mensajes</span>
                    </button>
                ) : role === 'coach' ? (
                    <button className={getButtonClass('inbox')}> {/* Coach Inbox */}
                        <MessageSquare size={26} strokeWidth={2} />
                        <span className="text-[10px] font-bold tracking-wide">Inbox</span>
                    </button>
                ) : (
                    <button className={getButtonClass('profile')}> {/* User Profile */}
                        <Activity size={26} strokeWidth={2} />
                        <span className="text-[10px] font-bold tracking-wide">Perfil</span>
                    </button>
                )}

                {/* 5. FIFTH BUTTON (Role specific) */}
                {role === 'admin' ? (
                    <button className={getButtonClass('settings')}>
                        <Settings size={26} strokeWidth={2} />
                        <span className="text-[10px] font-bold tracking-wide">Ajustes</span>
                    </button>
                ) : role === 'coach' ? (
                    <button className={getButtonClass('settings')}>
                        <Settings size={26} strokeWidth={2} />
                        <span className="text-[10px] font-bold tracking-wide">Ajustes</span>
                    </button>
                ) : (
                    <button
                        onClick={() => navigate('/notifications')} // Users have Account/Notifications here in original? No, it was "Cuenta" with User icon.
                        className={getButtonClass('notifications')}
                    >
                        <User size={26} strokeWidth={2} />
                        <span className="text-[10px] font-bold tracking-wide">Cuenta</span>
                    </button>
                )}

            </div>
        </nav>
    );
};

export default BottomNavigation;
