import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Bell,
    Sun,
    Moon,
    Calendar,
    Settings,
    User,
    MapPin,
    Activity,
    Home
} from 'lucide-react';
import BottomNavigation from './components/BottomNavigation';
import TopHeader from './components/TopHeader';
import { collection, onSnapshot, query, where, orderBy, limit, getDocs, getDoc, doc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';

const CoachDashboard = () => {
    const [isDarkMode, setIsDarkMode] = useState(() => document.documentElement.classList.contains('dark'));
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

    const [classAttendees, setClassAttendees] = useState<{ [key: string]: string[] }>({});

    // Fetch assigned classes using Coach Profile ID
    useEffect(() => {
        if (!coachProfileId) return;

        const today = new Date().toISOString().split('T')[0];
        const q = query(
            collection(db, 'classes'),
            where('coachId', '==', coachProfileId),
            where('date', '==', today)
        );

        const unsubscribe = onSnapshot(q, async (querySnapshot) => {
            const classesData: any[] = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            classesData.sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));
            setAssignedClasses(classesData);

            // Calculate stats
            const totalStudents = classesData.reduce((sum, cls) => sum + (cls.currentCapacity || 0), 0);
            setStats({
                totalClasses: classesData.length,
                totalStudents
            });

            // Fetch top avatars for each class
            const attendeesMap: { [key: string]: string[] } = {};
            for (const cls of classesData) {
                const resQ = query(
                    collection(db, 'reservations'),
                    where('classId', '==', cls.id),
                    limit(3)
                );
                const resSnap = await getDocs(resQ);
                const avatars: string[] = [];
                for (const resDoc of resSnap.docs) {
                    const resData = resDoc.data();
                    const userSnap = await getDoc(doc(db, 'users', resData.userId));
                    if (userSnap.exists()) {
                        avatars.push(userSnap.data().photoURL || '');
                    }
                }
                attendeesMap[cls.id] = avatars;
            }
            setClassAttendees(attendeesMap);
        });

        return () => unsubscribe();
    }, [coachProfileId]);

    // Redundant theme/logout removed (now in TopHeader)



    return (
        <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-[#1F2128] text-white' : 'bg-[#F3F4F6] text-gray-900'} font-sans pb-32 overflow-x-hidden`}>
            <div className="max-w-md mx-auto px-6 pt-6 space-y-8">

                {/* Header Unificado */}
                <TopHeader
                    title="Coach Panel"
                    subtitle={`Hola, ${user?.displayName || 'Coach'} 👋`}
                    showNotificationDot={false}
                />

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
                                                {(classAttendees[item.id] || []).map((url, i) => (
                                                    <div key={i} className="w-6 h-6 rounded-full border-2 border-white dark:border-[#2A2D3A] overflow-hidden bg-gray-100">
                                                        {url ? (
                                                            <img src={url} alt="user" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center bg-gray-200">
                                                                <User size={10} className="text-gray-400" />
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                                {item.currentCapacity > (classAttendees[item.id]?.length || 0) && (
                                                    <div className="w-6 h-6 rounded-full border-2 border-white dark:border-[#2A2D3A] bg-gray-100 dark:bg-[#1F2128] flex items-center justify-center text-[8px] font-bold text-gray-500">
                                                        +{item.currentCapacity - (classAttendees[item.id]?.length || 0)}
                                                    </div>
                                                )}
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



            <BottomNavigation
                role="coach"
                activeTab="home"
            />
        </div>
    );
};

export default CoachDashboard;
