import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Bell,
    Calendar,
    Users,
    Upload,
    LayoutGrid,
    Activity,
    Dumbbell
} from 'lucide-react';
import BottomNavigation from './components/BottomNavigation';
import TopHeader from './components/TopHeader';
import { db } from './firebase';
import { collection, onSnapshot, query, where } from 'firebase/firestore';

const AdminDashboard = ({ onLogout }: { onLogout: () => void }) => {
    const [isDarkMode, setIsDarkMode] = useState(() => document.documentElement.classList.contains('dark'));
    const [stats, setStats] = useState({ activeUsers: 142, todayClasses: 0, pendingUsers: 0, currentAttendance: 0 });
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
            const classesData = snapshot.docs.map(doc => doc.data());
            const totalAttendance = classesData.reduce((acc, c: any) => acc + (c.currentCapacity || 0), 0);
            setStats(prev => ({
                ...prev,
                todayClasses: snapshot.size,
                currentAttendance: totalAttendance
            }));
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

    // Redundant theme/logout logic removed (now in TopHeader)



    return (
        <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-[#1F2128] text-white' : 'bg-[#F3F4F6] text-gray-900'} font-sans pb-32 overflow-x-hidden`}>
            <div className="max-w-md mx-auto px-6 pt-6 space-y-8">

                {/* Header Unificado */}
                <TopHeader
                    title={`Hola, Admin 👋`}
                    subtitle="Panel de Gestión"
                    showNotificationDot={stats.pendingUsers > 0}
                    onLogout={onLogout}
                />

                {/* Stats Grid */}
                <section className="grid grid-cols-2 gap-4">
                    <div className={`${isDarkMode ? 'bg-[#2A2D3A]/80 backdrop-blur-xl border-white/5 shadow-2xl shadow-black/20' : 'bg-white/80 backdrop-blur-xl shadow-xl shadow-gray-300/30 border-white'} p-5 rounded-[2.5rem] flex flex-col justify-between h-40 transition-all hover:scale-[1.02] border`}>
                        <div className="flex justify-between items-start">
                            <div className={`p-3 rounded-2xl text-pink-500 ${isDarkMode ? 'bg-[#FF1F40]/10' : 'bg-pink-50'}`}>
                                <Users size={20} />
                            </div>
                            <span className="text-[10px] font-black text-green-500 bg-green-500/10 px-2.5 py-1 rounded-full">+12%</span>
                        </div>
                        <div>
                            <span className="text-4xl font-black block tracking-tighter">{stats.activeUsers}</span>
                            <span className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Usuarios Activos</span>
                        </div>
                    </div>

                    <div className={`${isDarkMode ? 'bg-[#2A2D3A]/80 backdrop-blur-xl border-white/5 shadow-2xl shadow-black/20' : 'bg-white/80 backdrop-blur-xl shadow-xl shadow-gray-300/30 border-white'} p-5 rounded-[2.5rem] flex flex-col justify-between h-40 transition-all hover:scale-[1.02] border`}>
                        <div className="flex justify-between items-start">
                            <div className={`p-3 rounded-2xl text-orange-500 ${isDarkMode ? 'bg-orange-500/10' : 'bg-orange-50'}`}>
                                <Activity size={20} />
                            </div>
                            <span className={`text-[10px] font-black bg-orange-500/10 px-2.5 py-1 rounded-full text-orange-500`}>En Vivo</span>
                        </div>
                        <div>
                            <span className="text-4xl font-black block tracking-tighter">{stats.currentAttendance}</span>
                            <span className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Aforo Actual</span>
                        </div>
                    </div>

                    <div className={`${isDarkMode ? 'bg-[#2A2D3A]/80 backdrop-blur-xl border-white/5 shadow-2xl shadow-black/20' : 'bg-white/80 backdrop-blur-xl shadow-xl shadow-gray-300/30 border-white'} col-span-2 p-6 rounded-[2.5rem] flex items-center justify-between transition-all hover:scale-[1.01] border`}>
                        <div className="flex items-center gap-5">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-blue-500 ${isDarkMode ? 'bg-blue-500/10' : 'bg-blue-50'}`}>
                                <LayoutGrid size={28} />
                            </div>
                            <div>
                                <span className="text-3xl font-black block tracking-tighter">{stats.todayClasses}</span>
                                <span className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Clases para Hoy</span>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="text-[10px] font-black text-blue-500 bg-blue-500/10 px-3 py-1.5 rounded-full uppercase tracking-wider">Ver Agenda</span>
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
                            onClick={() => navigate('/manage-groups')}
                            className={`${isDarkMode ? 'bg-[#2A2D3A]' : 'bg-white shadow-xl shadow-gray-300/30'} p-6 rounded-3xl flex flex-col items-center justify-center gap-3 group active:scale-95 transition-all border border-transparent dark:border-gray-800/50`}
                        >
                            <div className="w-14 h-14 bg-[#FF1F40] rounded-full flex items-center justify-center text-white shadow-lg shadow-red-500/30">
                                <LayoutGrid size={28} />
                            </div>
                            <span className={`font-bold text-sm text-center ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Grupos</span>
                        </button>

                        <button
                            onClick={() => navigate('/exercise-library')}
                            className={`${isDarkMode ? 'bg-[#2A2D3A]' : 'bg-white shadow-xl shadow-gray-300/30'} p-6 rounded-3xl flex flex-col items-center justify-center gap-3 group active:scale-95 transition-all border border-transparent dark:border-gray-800/50`}
                        >
                            <div className="w-14 h-14 bg-[#FF1F40] rounded-full flex items-center justify-center text-white shadow-lg shadow-red-500/30">
                                <Dumbbell size={28} />
                            </div>
                            <span className={`font-bold text-sm text-center ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Biblioteca WOD</span>
                        </button>

                        <button
                            onClick={() => navigate('/reports')}
                            className={`${isDarkMode ? 'bg-[#2A2D3A]' : 'bg-white shadow-xl shadow-gray-300/30'} p-6 rounded-3xl flex flex-col items-center justify-center gap-3 group active:scale-95 transition-all border border-transparent dark:border-gray-800/50`}
                        >
                            <div className="w-14 h-14 bg-[#FF1F40] rounded-full flex items-center justify-center text-white shadow-lg shadow-red-500/30">
                                <Activity size={28} />
                            </div>
                            <span className={`font-bold text-sm text-center ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Reports</span>
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



            <BottomNavigation
                role="admin"
                activeTab="home"
            />
        </div>
    );
};

export default AdminDashboard;
