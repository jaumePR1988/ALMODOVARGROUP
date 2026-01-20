import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Bell,
    Sun,
    Moon,
    Calendar,
    Settings,
    ClipboardList,
    User,
    Zap,
    MapPin,
    Activity,
    Home,
    Plus,
    Users,
    MessageSquare,
    Settings // Changed from LogOut to Settings as per instruction's snippet
} from 'lucide-react';
import BottomNavigation from './components/BottomNavigation';
import { collection, onSnapshot, query, where, orderBy, limit } from 'firebase/firestore';
import { auth, db } from './firebase'; // Ensure db is imported if needed, otherwise just auth
import { onAuthStateChanged, signOut } from 'firebase/auth';

const CoachDashboard = () => {
    const [isDarkMode, setIsDarkMode] = useState(() => document.documentElement.classList.contains('dark'));
    const [showMenu, setShowMenu] = useState(false);
    const [assignedClasses, setAssignedClasses] = useState<any[]>([]);
    const [stats, setStats] = useState({ totalClasses: 0, totalStudents: 0 });
    const navigate = useNavigate();
    const [user, setUser] = useState<any>(null);
    const [coachProfileId, setCoachProfileId] = useState<string | null>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
            } else {
                navigate('/'); // Redirect if not logged in
            }
        });
        return () => unsubscribe();
    }, [navigate]);

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

    // Find Coach Profile ID by Email
    useEffect(() => {
        if (!user || !user.email) return;

        const q = query(collection(db, 'coaches'), where('email', '==', user.email));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            if (!snapshot.empty) {
                // Assuming one profile per email
                setCoachProfileId(snapshot.docs[0].id);
            } else {
                console.warn("No coach profile found for email:", user.email);
                // Fallback to uid if no profile found, though likely won't match if using generated IDs
                setCoachProfileId(user.uid);
            }
        });
        return () => unsubscribe();
    }, [user]);

    // Fetch assigned classes using Coach Profile ID
    useEffect(() => {
        if (!coachProfileId) return;

        const today = new Date().toISOString().split('T')[0];
        const q = query(
            collection(db, 'classes'),
            where('coachId', '==', coachProfileId),
            where('date', '==', today)
            // orderBy removed to avoid Index issues. Sorting client-side.
        );

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            let classesData: any[] = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Client-side sort
            classesData.sort((a, b) => a.startTime.localeCompare(b.startTime));

            setAssignedClasses(classesData);

            // Calculate stats
            const totalStudents = classesData.reduce((sum, cls) => sum + (cls.currentCapacity || 0), 0);
            setStats({
                totalClasses: classesData.length,
                totalStudents
            });
        });

        return () => unsubscribe();
    }, [coachProfileId]);

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

    // Menu Items for Coach
    const menuItems = [
        { icon: <ClipboardList size={22} />, label: 'Asistencia' },
        { icon: <Zap size={22} />, label: 'WOD' },
        { icon: <Activity size={22} />, label: '+Ejercicio' },
        { icon: <User size={22} />, label: 'Perfil' },
    ];

    return (
        <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-[#1F2128] text-white' : 'bg-[#F3F4F6] text-gray-900'} font-sans pb-32 overflow-x-hidden`}>
            <div className="max-w-md mx-auto px-6 pt-6 space-y-8">

                {/* Header */}
                <header className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-[#FF1F40] flex items-center justify-center font-bold text-lg text-white shadow-lg shadow-red-600/20">
                            AG
                        </div>
                        <div>
                            <h1 className="text-xl font-bold leading-tight">Coach Panel</h1>
                            <p className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Hola, {user?.displayName || 'Coach'} 👋</p>
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

                {/* Removed Debug Panel */}

                {/* Coach Stats Grid */}
                <section className="grid grid-cols-2 gap-4">
                    <div className={`${isDarkMode ? 'bg-[#2A2D3A]' : 'bg-white shadow-xl shadow-gray-300/30'} p-5 rounded-3xl flex flex-col justify-between h-36 border border-transparent dark:border-gray-800/50`}>
                        <div className="flex justify-between items-start">
                            <div className={`p-2.5 rounded-xl text-orange-400 ${isDarkMode ? 'bg-[#1F2128]' : 'bg-orange-50'}`}>
                                <Activity size={22} strokeWidth={2.5} />
                            </div>
                            <span className="text-[10px] font-black text-white bg-[#FF1F40] px-2 py-1 rounded-lg">HOY</span>
                        </div>
                        <div>
                            <span className="text-3xl font-black block leading-none">{stats.totalClasses}</span>
                            <span className={`text-[10px] font-bold uppercase tracking-widest ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Clases Programadas</span>
                        </div>
                    </div>
                    <div className={`${isDarkMode ? 'bg-[#2A2D3A]' : 'bg-white shadow-xl shadow-gray-300/30'} p-5 rounded-3xl flex flex-col justify-between h-36 border border-transparent dark:border-gray-800/50`}>
                        <div className="flex justify-between items-start">
                            <div className={`p-2.5 rounded-xl text-blue-400 ${isDarkMode ? 'bg-[#1F2128]' : 'bg-blue-50'}`}>
                                <Users size={22} strokeWidth={2.5} />
                            </div>
                        </div>
                        <div>
                            <span className="text-3xl font-black block leading-none">{stats.totalStudents}</span>
                            <span className={`text-[10px] font-bold uppercase tracking-widest ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Alumnos Totales</span>
                        </div>
                    </div>
                </section>

                {/* Agenda Section */}
                <section className="space-y-4">
                    <div className="flex items-end mb-2">
                        <h2 className="text-xl font-bold dark:text-white italic uppercase tracking-tighter">Agenda de hoy</h2>
                    </div>

                    {assignedClasses.length === 0 ? (
                        <div className={`p-10 rounded-[2.5rem] border-2 border-dashed flex flex-col items-center justify-center text-center ${isDarkMode ? 'border-gray-800 bg-[#2A2D3A]/20' : 'border-gray-200 bg-white shadow-sm'}`}>
                            <Calendar size={32} className="text-gray-400 mb-3" />
                            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">No tienes clases asignadas hoy</p>
                        </div>
                    ) : (
                        assignedClasses.map((item) => (
                            <div
                                key={item.id}
                                className={`relative rounded-[2.5rem] overflow-hidden group transition-all active:scale-[0.98] ${isDarkMode ? 'bg-[#2A2D3A]' : 'bg-white shadow-xl shadow-gray-300/30 border border-gray-100'}`}
                            >
                                {/* Background Image with Overlay */}
                                <div className="absolute inset-0 z-0">
                                    <img
                                        src={item.imageUrl || "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80"}
                                        alt={item.name}
                                        className="w-full h-full object-cover opacity-70"
                                    />
                                    {/* Gradient overlay to ensure text readability but show more image */}
                                    <div className={`absolute inset-0 ${isDarkMode ? 'bg-gradient-to-r from-[#2A2D3A] via-[#2A2D3A]/80 to-transparent' : 'bg-gradient-to-r from-white via-white/80 to-transparent'}`} />
                                </div>

                                <div className="p-6 space-y-4 relative z-10">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-2xl bg-[#FF1F40] flex flex-col items-center justify-center text-white shadow-lg shadow-red-600/20">
                                                <span className="text-xs font-black leading-none">{item.startTime}</span>
                                                <span className="text-[8px] font-black uppercase opacity-60">AM</span>
                                            </div>
                                            <div>
                                                <h3 className="text-base font-black italic uppercase leading-tight">{item.name}</h3>
                                                <div className="flex items-center gap-2 mt-0.5 text-gray-500">
                                                    <MapPin size={12} />
                                                    <span className="text-[10px] font-bold uppercase">{item.group === 'box' ? 'BOX' : 'FIT'} • Sala Principal</span>
                                                </div>
                                            </div>
                                        </div>
                                        <button className={`p-2 rounded-xl h-10 w-10 flex items-center justify-center transition-colors ${isDarkMode ? 'bg-[#1F2128] text-gray-500 hover:text-white' : 'bg-gray-100 text-gray-400 hover:text-gray-600'}`}>
                                            <Settings size={18} />
                                        </button>
                                    </div>

                                    <div className="flex items-center justify-between pt-2 border-t border-gray-100/10 dark:border-white/5">
                                        <div className="flex items-center gap-4">
                                            <div className="flex -space-x-2">
                                                {[1, 2, 3].map(i => (
                                                    <div key={i} className="w-6 h-6 rounded-full border-2 border-white dark:border-[#2A2D3A] overflow-hidden">
                                                        <img src={`https://i.pravatar.cc/150?u=${i + item.id}`} alt="user" className="w-full h-full object-cover" />
                                                    </div>
                                                ))}
                                                <div className="w-6 h-6 rounded-full border-2 border-white dark:border-[#2A2D3A] bg-gray-100 dark:bg-[#1F2128] flex items-center justify-center text-[8px] font-bold text-gray-500">
                                                    +{item.currentCapacity > 3 ? item.currentCapacity - 3 : 0}
                                                </div>
                                            </div>
                                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{item.currentCapacity} Registrados</span>
                                        </div>
                                        <button
                                            onClick={() => navigate(`/manage-attendance/${item.id}`)}
                                            className="bg-[#FF1F40] text-white text-[10px] font-black px-4 py-2 rounded-xl shadow-lg shadow-red-900/20 active:scale-95 transition-all hover:brightness-110 uppercase tracking-widest"
                                        >
                                            Ver Lista
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
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

            <BottomNavigation
                role="coach"
                activeTab="home"
                onFabClick={() => setShowMenu(!showMenu)}
                showMenu={showMenu}
            />
        </div>
    );
};

export default CoachDashboard;
