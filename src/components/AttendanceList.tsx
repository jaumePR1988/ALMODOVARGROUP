import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ChevronLeft,
    Search,
    User,
    CheckCircle2,
    Circle,
    Plus,
    Loader2,
    Calendar,
    Clock,
    Users,
    Activity
} from 'lucide-react';
import { db } from '../firebase';
import {
    doc,
    getDoc,
    collection,
    query,
    where,
    onSnapshot,
    updateDoc,
    addDoc,
    serverTimestamp,
    getDocs
} from 'firebase/firestore';
import TopHeader from './TopHeader';

interface Attendee {
    id: string; // reservationId
    userId: string;
    userName: string;
    userPhoto?: string;
    status: string;
    attended: boolean;
}

const AttendanceList = () => {
    const { classId } = useParams();
    const navigate = useNavigate();
    const [isDarkMode, setIsDarkMode] = useState(document.documentElement.classList.contains('dark'));
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [classData, setClassData] = useState<any>(null);
    const [attendees, setAttendees] = useState<Attendee[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    // Walk-in search
    const [userSearch, setUserSearch] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearchingUsers, setIsSearchingUsers] = useState(false);

    useEffect(() => {
        const observer = new MutationObserver(() => {
            setIsDarkMode(document.documentElement.classList.contains('dark'));
        });
        observer.observe(document.documentElement, { attributes: true });
        return () => observer.disconnect();
    }, []);

    // Fetch Class Details
    useEffect(() => {
        if (!classId) return;
        const fetchClass = async () => {
            const docRef = doc(db, 'classes', classId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                setClassData(docSnap.data());
            }
        };
        fetchClass();
    }, [classId]);

    // Fetch Reservations & User Details
    useEffect(() => {
        if (!classId) return;

        const q = query(collection(db, 'reservations'), where('classId', '==', classId));
        const unsubscribe = onSnapshot(q, async (snapshot) => {
            const attendeeData: Attendee[] = [];

            for (const resDoc of snapshot.docs) {
                const res = resDoc.data();
                // Fetch user data for each reservation
                const userRef = doc(db, 'users', res.userId);
                const userSnap = await getDoc(userRef);
                const userData = userSnap.data();

                attendeeData.push({
                    id: resDoc.id,
                    userId: res.userId,
                    userName: userData?.name || 'Usuario desconocido',
                    userPhoto: userData?.photoURL,
                    status: res.status,
                    attended: res.attended || false
                });
            }

            setAttendees(attendeeData.sort((a, b) => a.userName.localeCompare(b.userName)));
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [classId]);

    const handleToggleAttendance = async (attendee: Attendee) => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            const resRef = doc(db, 'reservations', attendee.id);
            await updateDoc(resRef, {
                attended: !attendee.attended
            });
        } catch (error) {
            console.error("Error updating attendance:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUserSearch = async (val: string) => {
        setUserSearch(val);
        if (val.length < 3) {
            setSearchResults([]);
            return;
        }
        setIsSearchingUsers(true);
        try {
            const q = query(collection(db, 'users'), where('status', '==', 'active'), limit(5));
            const snap = await getDocs(q);
            const rawResults = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            // Manual filter for search as Firestore doesn't support easy text search
            const filtered = rawResults.filter((u: any) =>
                u.name?.toLowerCase().includes(val.toLowerCase()) ||
                u.email?.toLowerCase().includes(val.toLowerCase())
            );
            setSearchResults(filtered);
        } catch (error) {
            console.error("Search error:", error);
        } finally {
            setIsSearchingUsers(false);
        }
    };

    const handleAddWalkIn = async (user: any) => {
        if (!classId || isSubmitting) return;

        // Check if already in list
        if (attendees.some(a => a.userId === user.id)) {
            alert("Este alumno ya está en la lista");
            return;
        }

        setIsSubmitting(true);
        try {
            await addDoc(collection(db, 'reservations'), {
                classId,
                userId: user.id,
                status: 'confirmed',
                attended: true,
                isWalkIn: true,
                createdAt: serverTimestamp()
            });
            // Update class capacity
            const classRef = doc(db, 'classes', classId);
            await updateDoc(classRef, {
                currentCapacity: (classData?.currentCapacity || 0) + 1
            });
            setUserSearch('');
            setSearchResults([]);
        } catch (error) {
            console.error("Error adding walk-in:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredAttendees = attendees.filter(a =>
        a.userName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (isLoading) {
        return (
            <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-[#1F2128]' : 'bg-[#F3F4F6]'}`}>
                <Loader2 size={40} className="animate-spin text-[#FF1F40]" />
            </div>
        );
    }

    return (
        <div className={`min-h-screen transition-colors duration-500 pb-20 ${isDarkMode ? 'bg-[#1F2128] text-white' : 'bg-[#F3F4F6]'}`}>
            <div className="max-w-md mx-auto px-6 pt-6">
                <TopHeader
                    title="Asistencia"
                    subtitle={classData?.name || "Cargando clase..."}
                    onBack={() => navigate('/coach')}
                />
            </div>

            <div className="max-w-md mx-auto px-6 mt-8 space-y-6">
                {/* Class Stats Summary */}
                <div className={`${isDarkMode ? 'bg-[#2A2D3A]' : 'bg-white shadow-xl shadow-gray-200/50'} rounded-[2.5rem] p-6 flex items-center justify-between`}>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-[#FF1F40]/10 flex items-center justify-center text-[#FF1F40]">
                            <Activity size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Presentes</p>
                            <h3 className="text-xl font-black italic uppercase">
                                {attendees.filter(a => a.attended).length} / {attendees.length}
                            </h3>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Capacidad</p>
                        <p className="text-sm font-bold">{classData?.currentCapacity} / {classData?.maxCapacity}</p>
                    </div>
                </div>

                {/* Walk-in Search Section */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between ml-2">
                        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#FF1F40]">Añadir Walk-in</h2>
                    </div>
                    <div className="relative">
                        <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            value={userSearch}
                            onChange={(e) => handleUserSearch(e.target.value)}
                            placeholder="Buscar alumno por nombre..."
                            className={`w-full py-4 pl-14 pr-6 rounded-3xl outline-none font-bold text-sm ${isDarkMode ? 'bg-[#2A2D3A] text-white' : 'bg-white shadow-sm text-gray-900 border border-gray-100'}`}
                        />
                        {isSearchingUsers && (
                            <Loader2 size={16} className="absolute right-5 top-1/2 -translate-y-1/2 animate-spin text-[#FF1F40]" />
                        )}
                    </div>

                    {searchResults.length > 0 && (
                        <div className={`mt-2 rounded-[2rem] overflow-hidden border ${isDarkMode ? 'bg-[#2A2D3A] border-white/5' : 'bg-white shadow-xl border-gray-100'}`}>
                            {searchResults.map((user) => (
                                <button
                                    key={user.id}
                                    onClick={() => handleAddWalkIn(user)}
                                    className={`w-full flex items-center gap-4 p-4 hover:bg-[#FF1F40]/5 transition-colors border-b last:border-b-0 ${isDarkMode ? 'border-white/5' : 'border-gray-50'}`}
                                >
                                    <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden">
                                        {user.photoURL ? <img src={user.photoURL} className="w-full h-full object-cover" /> : <User size={20} className="m-auto text-gray-400 h-full" />}
                                    </div>
                                    <div className="flex-1 text-left">
                                        <p className="text-xs font-black uppercase italic">{user.name}</p>
                                        <p className="text-[10px] font-medium text-gray-500">{user.email}</p>
                                    </div>
                                    <Plus size={16} className="text-[#FF1F40]" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Attendee List */}
                <div className="space-y-4 pt-4">
                    <div className="flex items-center justify-between ml-2">
                        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#FF1F40]">Lista de Asistencia</h2>
                        <div className="relative w-32">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Filtrar..."
                                className={`w-full py-2 pl-8 pr-3 rounded-xl outline-none font-bold text-[10px] ${isDarkMode ? 'bg-[#2A2D3A] text-white' : 'bg-white shadow-sm text-gray-900 border border-gray-100'}`}
                            />
                        </div>
                    </div>

                    <div className="space-y-3">
                        {filteredAttendees.length === 0 ? (
                            <div className="py-20 text-center opacity-40">
                                <Users size={48} className="mx-auto mb-4" />
                                <p className="text-xs font-black uppercase tracking-widest">No hay alumnos registrados</p>
                            </div>
                        ) : (
                            filteredAttendees.map((attendee) => (
                                <div
                                    key={attendee.id}
                                    className={`p-4 rounded-[2rem] flex items-center gap-4 transition-all ${attendee.attended ? 'bg-green-500/5 border-green-500/20' : isDarkMode ? 'bg-[#2A2D3A] border-white/5' : 'bg-white shadow-lg shadow-gray-200/40 border-gray-50'} border`}
                                >
                                    <div className="w-14 h-14 rounded-2xl bg-gray-100 overflow-hidden relative">
                                        {attendee.userPhoto ? (
                                            <img src={attendee.userPhoto} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-50 dark:bg-gray-800">
                                                <User size={24} />
                                            </div>
                                        )}
                                        {attendee.attended && (
                                            <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                                                <CheckCircle2 size={24} className="text-green-500 bg-white dark:bg-[#1F2128] rounded-full shadow-lg" />
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <h3 className={`font-black uppercase italic text-sm truncate ${attendee.attended ? 'text-green-600 dark:text-green-400' : ''}`}>
                                            {attendee.userName}
                                        </h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className={`text-[8px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest ${attendee.status === 'confirmed' ? 'bg-blue-500/10 text-blue-500' : 'bg-orange-500/10 text-orange-500'}`}>
                                                {attendee.status === 'confirmed' ? 'Confirmado' : 'Espera'}
                                            </span>
                                            {attendee.attended && (
                                                <span className="text-[8px] font-black uppercase tracking-widest text-green-500 animate-pulse">Presente</span>
                                            )}
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handleToggleAttendance(attendee)}
                                        disabled={isSubmitting}
                                        className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all active:scale-95 ${attendee.attended ? 'bg-green-500 text-white shadow-lg shadow-green-500/40' : 'bg-gray-200 dark:bg-[#1F2128] text-gray-400'}`}
                                    >
                                        <CheckCircle2 size={24} />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AttendanceList;
