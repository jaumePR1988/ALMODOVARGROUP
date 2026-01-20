import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Bell,
    Settings,
    MessageSquare,
    Calendar,
    Home,
    Users,
    Upload,
    Plus,
    LayoutGrid,
    Sun,
    Moon,
    Activity,
    User,
    LogOut
} from 'lucide-react';

import { db, auth } from './firebase';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { signOut } from 'firebase/auth';

const AdminDashboard = () => {
    const [isDarkMode, setIsDarkMode] = useState(() => document.documentElement.classList.contains('dark'));
    const [showMenu, setShowMenu] = useState(false);
    const [stats, setStats] = useState({ activeUsers: 142, todayClasses: 0, pendingUsers: 0 });
    const navigate = useNavigate();

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

    // Fetch Stats
    useEffect(() => {
        const today = new Date().toISOString().split('T')[0];
        const classesQuery = query(collection(db, 'classes'), where('date', '==', today));

        const unsubscribeClasses = onSnapshot(classesQuery, (snapshot) => {
            setStats(prev => ({ ...prev, todayClasses: snapshot.size }));
        });

        // Real-time Users Count
        const unsubscribeUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
            const allUsers = snapshot.docs.map(doc => doc.data());
            const active = allUsers.filter((u: any) => u.isApproved).length;
            const pending = allUsers.filter((u: any) => !u.isApproved).length;
            setStats(prev => ({
                ...prev,
                activeUsers: active,
                pendingUsers: pending
            }));
        });

        return () => {
            unsubscribeClasses();
            unsubscribeUsers();
        };
    }, []);

    const toggleTheme = () => {
        const newDarkMode = !isDarkMode;
        setIsDarkMode(newDarkMode);
        if (newDarkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    };

    const handleLogout = async () => {
        try {
            await signOut(auth);
            navigate('/');
        } catch (error) {
            console.error("Error signing out:", error);
        }
    };

    // Menu Items for Admin
    const menuItems = [
        { icon: <Calendar size={20} />, label: 'Sesión' },
        { icon: <Users size={20} />, label: 'Grupos' },
        { icon: <User size={20} />, label: 'Coach' },
        { icon: <Activity size={20} />, label: 'Ejercicios' },
        { icon: <Settings size={20} />, label: 'Accesos' },
    ];

    return (
        <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-[#1F2128] text-white' : 'bg-[#F3F4F6] text-gray-900'} font-sans pb-32 overflow-x-hidden`}>
            <div className="max-w-md mx-auto px-6 pt-6 space-y-8">

                {/* Header */}
                <header className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-[#FF1F40] flex items-center justify-center font-bold text-lg text-white">
                            AG
                        </div>
                        <div>
                            <h1 className="text-xl font-bold leading-tight">Admin Dashboard</h1>
                            <p className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Almodovar Group</p>
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
                            onClick={handleLogout}
                            className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm transition-colors ${isDarkMode ? 'bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white' : 'bg-red-50 text-red-500 hover:bg-red-500 hover:text-white'}`}
                        >
                            <LogOut size={20} />
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

                {/* Stats Grid */}
                <section className="grid grid-cols-2 gap-4">
                    <div className={`${isDarkMode ? 'bg-[#2A2D3A]' : 'bg-white shadow-xl shadow-gray-300/30'} p-5 rounded-3xl flex flex-col justify-between h-36 border border-transparent dark:border-gray-800/50`}>
                        <div className="flex justify-between items-start">
                            <div className={`p-2 rounded-xl text-pink-400 ${isDarkMode ? 'bg-[#1F2128]' : 'bg-pink-50'}`}>
                                <Users size={20} />
                            </div>
                            <span className="text-[10px] font-bold text-green-400 bg-green-400/10 px-2 py-1 rounded-lg">+12%</span>
                        </div>
                        <div>
                            <span className="text-3xl font-black block">{stats.activeUsers}</span>
                            <span className={`text-[10px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Usuarios Activos</span>
                        </div>
                    </div>
                    <div className={`${isDarkMode ? 'bg-[#2A2D3A]' : 'bg-white shadow-xl shadow-gray-300/30'} p-5 rounded-3xl flex flex-col justify-between h-36 border border-transparent dark:border-gray-800/50`}>
                        <div className="flex justify-between items-start">
                            <div className={`p-2 rounded-xl text-blue-400 ${isDarkMode ? 'bg-[#1F2128]' : 'bg-blue-50'}`}>
                                <LayoutGrid size={20} />
                            </div>
                            <span className={`text-[10px] font-bold bg-gray-400/10 px-2 py-1 rounded-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Hoy</span>
                        </div>
                        <div>
                            <span className="text-3xl font-black block">{stats.todayClasses}</span>
                            <span className={`text-[10px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Clases Programadas</span>
                        </div>
                    </div>
                </section>

                {/* Quick Actions (Gestión Rápida) */}
                <section>
                    <h2 className={`text-xs font-bold uppercase tracking-[0.2em] mb-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Gestión Rápida</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={() => navigate('/manage-classes')}
                            className={`${isDarkMode ? 'bg-[#2A2D3A]' : 'bg-white shadow-xl shadow-gray-300/30'} p-6 rounded-3xl flex flex-col items-center justify-center gap-3 group active:scale-95 transition-all border border-transparent dark:border-gray-800/50`}
                        >
                            <div className="w-14 h-14 bg-[#FF1F40] rounded-full flex items-center justify-center text-white shadow-lg shadow-red-500/30">
                                <Calendar size={28} />
                            </div>
                            <span className={`font-bold text-sm text-center ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Gestionar Clases</span>
                        </button>

                        <button
                            onClick={() => navigate('/manage-users')}
                            className={`${isDarkMode ? 'bg-[#2A2D3A]' : 'bg-white shadow-xl shadow-gray-300/30'} p-6 rounded-3xl flex flex-col items-center justify-center gap-3 group active:scale-95 transition-all border border-transparent dark:border-gray-800/50 relative overflow-hidden`}
                        >
                            {stats.pendingUsers > 0 && (
                                <div className="absolute top-4 right-4 bg-[#FF1F40] text-white text-[8px] font-black px-2 py-0.5 rounded-full animate-bounce z-10">
                                    {stats.pendingUsers}
                                </div>
                            )}
                            <div className="w-14 h-14 bg-[#FF1F40] rounded-full flex items-center justify-center text-white shadow-lg shadow-red-500/30">
                                <Users size={28} />
                            </div>
                            <span className={`font-bold text-sm text-center ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Usuarios</span>
                        </button>

                        <button
                            onClick={() => navigate('/notifications')}
                            className={`${isDarkMode ? 'bg-[#2A2D3A]' : 'bg-white shadow-xl shadow-gray-300/30'} p-6 rounded-3xl flex flex-col items-center justify-center gap-3 group active:scale-95 transition-all border border-transparent dark:border-gray-800/50`}
                        >
                            <div className="w-14 h-14 bg-[#FF1F40] rounded-full flex items-center justify-center text-white shadow-lg shadow-red-500/30">
                                <Bell size={28} />
                            </div>
                            <span className={`font-bold text-sm text-center ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Notificaciones</span>
                        </button>

                        <button
                            onClick={() => navigate('/manage-groups')} // Placeholder
                            className={`${isDarkMode ? 'bg-[#2A2D3A]' : 'bg-white shadow-xl shadow-gray-300/30'} p-6 rounded-3xl flex flex-col items-center justify-center gap-3 group active:scale-95 transition-all border border-transparent dark:border-gray-800/50`}
                        >
                            <div className="w-14 h-14 bg-[#FF1F40] rounded-full flex items-center justify-center text-white shadow-lg shadow-red-500/30">
                                <Activity size={28} />
                            </div>
                            <span className={`font-bold text-sm text-center ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Gestión Grupos</span>
                        </button>

                        <button
                            onClick={() => navigate('/manage-coaches')}
                            className={`${isDarkMode ? 'bg-[#2A2D3A]' : 'bg-white shadow-xl shadow-gray-300/30'} p-6 rounded-3xl flex flex-col items-center justify-center gap-3 group active:scale-95 transition-all border border-transparent dark:border-gray-800/50`}
                        >
                            <div className="w-14 h-14 bg-[#FF1F40] rounded-full flex items-center justify-center text-white shadow-lg shadow-red-500/30">
                                <User size={28} />
                            </div>
                            <span className={`font-bold text-sm text-center ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Gestión Coach</span>
                        </button>

                        <button
                            onClick={() => navigate('/content')} // Placeholder
                            className={`${isDarkMode ? 'bg-[#2A2D3A]' : 'bg-white shadow-xl shadow-gray-300/30'} p-6 rounded-3xl flex flex-col items-center justify-center gap-3 group active:scale-95 transition-all border border-transparent dark:border-gray-800/50`}
                        >
                            <div className="w-14 h-14 bg-[#FF1F40] rounded-full flex items-center justify-center text-white shadow-lg shadow-red-500/30">
                                <Upload size={28} />
                            </div>
                            <span className={`font-bold text-sm text-center ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Subir Contenido</span>
                        </button>
                    </div>
                </section>

                <div className="h-10"></div>

            </div>

            {/* Action Menu (Medialuna) Overlay */}
            {showMenu && (
                <div
                    className="fixed inset-0 bg-black/40 backdrop-blur-md z-[100] transition-all duration-500"
                    onClick={() => setShowMenu(false)}
                >
                    <div className="absolute bottom-32 left-1/2 -translate-x-1/2 w-full max-w-md pointer-events-none">
                        {menuItems.map((item, i) => {
                            // Calculate angles for half-moon (from 190 to -10 degrees for better spread)
                            const totalItems = menuItems.length;
                            const angleRange = 160; // Spread over 160 degrees
                            const startAngle = 170; // Start almost at 180
                            const angle = startAngle - (i * (angleRange / (totalItems - 1)));

                            const radius = 110; // Slightly larger for better spacing
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

                    <button className="flex flex-col items-center gap-1.5 text-[#FF1F40] w-12 transition-transform active:scale-90">
                        <Home size={26} strokeWidth={2.5} />
                        <span className="text-[10px] font-bold tracking-wide">Inicio</span>
                    </button>

                    <button
                        onClick={() => navigate('/agenda')}
                        className={`flex flex-col items-center gap-1.5 w-12 transition-all active:scale-90 ${isDarkMode ? 'text-gray-500 hover:text-white' : 'text-gray-400 hover:text-gray-900'}`}
                    >
                        <Calendar size={26} strokeWidth={2} />
                        <span className="text-[10px] font-bold tracking-wide">Agenda</span>
                    </button>

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

                    <button className={`flex flex-col items-center gap-1.5 w-12 transition-all active:scale-90 ${isDarkMode ? 'text-gray-500 hover:text-white' : 'text-gray-400 hover:text-gray-900'}`}>
                        <MessageSquare size={26} strokeWidth={2} />
                        <span className="text-[10px] font-bold tracking-wide">Mensajes</span>
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

export default AdminDashboard;
