import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ChevronLeft,
    Calendar as CalendarIcon,
    Plus,
    User,
    Clock,
    Trash2
} from 'lucide-react';
import { db } from '../firebase';
import { collection, onSnapshot, query, orderBy, deleteDoc, doc } from 'firebase/firestore';

const ClassManagement = () => {
    const navigate = useNavigate();
    const [isDarkMode, setIsDarkMode] = useState(() => document.documentElement.classList.contains('dark'));
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [classList, setClassList] = useState<any[]>([]);
    const [weekDays, setWeekDays] = useState<{ day: string; date: number; fullDate: string; active: boolean }[]>([]);
    const [classToDelete, setClassToDelete] = useState<string | null>(null);
    const [coachesMap, setCoachesMap] = useState<Record<string, string>>({});

    // Sync with global theme
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

    // Generate Rolling 7-Day Window starting Today
    useEffect(() => {
        const days = ['DOM', 'LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB'];
        const today = new Date();

        const generatedWeek = Array.from({ length: 7 }, (_, i) => {
            const d = new Date(today);
            d.setDate(today.getDate() + i);
            return {
                day: days[d.getDay()],
                date: d.getDate(),
                fullDate: d.toISOString().split('T')[0],
                active: i === 0
            };
        });

        setWeekDays(generatedWeek);
        setSelectedDate(today.toISOString().split('T')[0]);
    }, []);

    // Fetch classes from Firestore
    useEffect(() => {
        const q = query(collection(db, 'classes'), orderBy('startTime', 'asc'));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const classesData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setClassList(classesData);
        });
        return () => unsubscribe();
    }, []);

    // Fetch Coaches for lookup
    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, 'coaches'), (snapshot) => {
            const map: Record<string, string> = {};
            snapshot.docs.forEach(doc => {
                map[doc.id] = doc.data().name;
            });
            setCoachesMap(map);
        });
        return () => unsubscribe();
    }, []);

    const handleDeleteClass = async (classId: string) => {
        try {
            await deleteDoc(doc(db, 'classes', classId));
            console.log("Class deleted successfully");
        } catch (error) {
            console.error("Error deleting class:", error);
            alert("Error al eliminar la clase: " + (error instanceof Error ? error.message : "Desconocido"));
        }
    };

    return (
        <div className={`min-h-screen transition-colors duration-500 pb-40 ${isDarkMode ? 'bg-[#1F2128] text-white' : 'bg-[#F3F4F6]'}`}>
            {/* Header */}
            <header className={`sticky top-0 z-[200] px-6 py-5 flex items-center justify-between backdrop-blur-md ${isDarkMode ? 'bg-[#1F2128]/80' : 'bg-white/80'}`}>
                <button
                    onClick={() => navigate(-1)}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isDarkMode ? 'hover:bg-white/5' : 'hover:bg-gray-100'}`}
                >
                    <ChevronLeft size={24} className={isDarkMode ? 'text-white' : 'text-gray-900'} />
                </button>
                <h1 className={`text-sm font-black uppercase tracking-widest ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Gestión de Clases
                </h1>
                <div className="relative">
                    <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-[#FF1F40]/50 shadow-[0_0_15px_rgba(255,31,64,0.3)]">
                        <img src="https://i.pravatar.cc/150?u=jaume" alt="User" className="w-full h-full object-cover" />
                    </div>
                </div>
            </header>

            <div className="max-w-md mx-auto px-6 pt-6 space-y-8">
                {/* Date Picker */}
                <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar" style={{ scrollbarWidth: 'none' }}>
                    {weekDays.map((d, idx) => (
                        <button
                            key={idx}
                            onClick={() => setSelectedDate(d.fullDate)}
                            className="flex-shrink-0 flex flex-col items-center gap-2 transition-all group"
                        >
                            <span className={`text-[10px] font-black tracking-widest ${selectedDate === d.fullDate ? 'text-[#FF1F40]' : 'text-gray-500'}`}>{d.day}</span>
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-lg transition-all ${selectedDate === d.fullDate
                                ? 'bg-[#FF1F40] text-white shadow-[0_8px_20px_rgba(255,31,64,0.4)] scale-110'
                                : (isDarkMode ? 'bg-[#2A2D3A] text-gray-400 hover:bg-[#323645]' : 'bg-white text-gray-600 hover:bg-white shadow-md border border-gray-100')
                                }`}>
                                {d.date}
                            </div>
                        </button>
                    ))}
                </div>

                {/* Section Title */}
                <div className="flex justify-between items-end pt-2">
                    <h2 className={`text-xl font-black uppercase tracking-tight ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Lista de Clases</h2>
                    <span className="text-[10px] font-black text-[#FF1F40] bg-[#FF1F40]/10 px-3 py-1.5 rounded-full uppercase tracking-wider">{classList.filter(c => c.date === selectedDate).length} clases</span>
                </div>

                {/* Classes List */}
                <div className="space-y-4">
                    {classList.filter(c => c.date === selectedDate).length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 opacity-40">
                            <CalendarIcon size={48} className="mb-4" />
                            <p className="text-sm font-bold uppercase tracking-widest text-center">No hay clases programadas</p>
                        </div>
                    ) : (
                        classList.filter(c => c.date === selectedDate).map((clase) => (
                            <div
                                key={clase.id}
                                onClick={() => navigate(`/edit-class/${clase.id}`)}
                                className={`p-5 rounded-[2rem] flex items-center justify-between transition-all active:scale-[0.98] cursor-pointer ${isDarkMode ? 'bg-[#2A2D3A]' : 'bg-white shadow-xl shadow-gray-300/30 border border-gray-100'}`}
                            >
                                <div className="flex items-center gap-5">
                                    {/* Time Column */}
                                    <div className="flex flex-col items-center text-center w-12 shrink-0">
                                        <span className={`text-base font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{clase.startTime}</span>
                                        <span className="text-[10px] font-bold text-gray-500 uppercase">{clase.group === 'box' ? 'BOX' : 'FIT'}</span>
                                    </div>

                                    {/* Divider */}
                                    <div className={`w-1 h-10 rounded-full ${clase.group === 'box' ? 'bg-[#FF1F40]' : 'bg-blue-500'}`}></div>

                                    {/* Info Column */}
                                    <div>
                                        <h3 className={`font-black text-sm uppercase tracking-tight mb-0.5 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{clase.name}</h3>
                                        <div className="flex items-center gap-2">
                                            <div className="flex items-center gap-1">
                                                <div className="w-4 h-4 rounded-full bg-gray-500/20 flex items-center justify-center">
                                                    <User size={10} className="text-gray-500" />
                                                </div>
                                                <span className="text-[10px] font-bold text-gray-500 uppercase">
                                                    {coachesMap[clase.coachId] || 'Coach'}
                                                </span>
                                            </div>
                                            <span className="text-gray-400 text-[10px]">•</span>
                                            <div className="flex items-center gap-1">
                                                <Clock size={10} className="text-gray-500" />
                                                <span className="text-[10px] font-bold text-gray-500">{clase.endTime}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Status/Action Column */}
                                <div className="text-right flex flex-col items-end gap-2">
                                    {classToDelete === clase.id ? (
                                        <div className="flex items-center gap-2 animate-in slide-in-from-right-4">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteClass(clase.id);
                                                    setClassToDelete(null);
                                                }}
                                                className="bg-red-500 text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase shadow-lg shadow-red-500/30"
                                            >
                                                Confirmar
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setClassToDelete(null);
                                                }}
                                                className="bg-gray-200 dark:bg-white/10 text-gray-500 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase"
                                            >
                                                X
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="mb-1">
                                                <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${clase.currentCapacity >= clase.maxCapacity
                                                    ? 'bg-red-500/10 text-red-500'
                                                    : 'bg-green-500/10 text-green-500'
                                                    }`}>
                                                    {clase.currentCapacity}/{clase.maxCapacity}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="w-16 bg-gray-200 dark:bg-gray-800 h-1.5 rounded-full overflow-hidden inline-block text-left">
                                                    <div
                                                        className={`h-full rounded-full ${clase.currentCapacity >= clase.maxCapacity ? 'bg-red-500' : 'bg-[#FF1F40]'}`}
                                                        style={{ width: `${Math.min(100, (clase.currentCapacity / clase.maxCapacity) * 100)}%` }}
                                                    ></div>
                                                </div>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setClassToDelete(clase.id);
                                                    }}
                                                    className="w-8 h-8 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all active:scale-95"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Floating Action Button */}
            <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[300]">
                <button
                    onClick={() => navigate('/create-class')}
                    className="w-16 h-16 bg-[#FF1F40] rounded-full flex items-center justify-center text-white shadow-[0_10px_30px_rgba(255,31,64,0.5)] hover:scale-110 active:scale-95 transition-all outline-none"
                >
                    <Plus size={36} strokeWidth={3} />
                </button>
            </div>
        </div>
    );
};

export default ClassManagement;
