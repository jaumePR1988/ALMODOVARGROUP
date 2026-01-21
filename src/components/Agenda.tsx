import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Calendar,
    User,
    ArrowLeft
} from 'lucide-react';
import BottomNavigation from './BottomNavigation';
import TopHeader from './TopHeader';
import { db, auth } from '../firebase';
import { collection, onSnapshot, query, orderBy, where, doc, getDoc, addDoc, updateDoc, increment, deleteDoc, getDocs, limit } from 'firebase/firestore';

const Agenda = ({ onLogout }: { onLogout?: () => void }) => {
    const navigate = useNavigate();
    const [isDarkMode, setIsDarkMode] = useState(() => document.documentElement.classList.contains('dark'));

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

    // State
    const [weekDays, setWeekDays] = useState<{ day: string; date: string; fullDate: string; active: boolean }[]>([]);
    const [selectedDate, setSelectedDate] = useState<string>(new Date().getDate().toString());
    const [selectedGroup, setSelectedGroup] = useState<string>('box');
    const [availableGroups, setAvailableGroups] = useState<any[]>([]);
    const [classList, setClassList] = useState<any[]>([]);
    const [userProfile, setUserProfile] = useState<any>(null);
    const [reservations, setReservations] = useState<{ [key: string]: string }>({});

    // 1. Fetch Groups
    useEffect(() => {
        const q = query(collection(db, 'groups'), orderBy('name', 'asc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const groupsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setAvailableGroups(groupsData);

            // Set initial selected group if not set
            if (groupsData.length > 0 && !selectedGroup) {
                // If coach, try to find an allowed group
                if (userProfile && userProfile.role === 'coach') {
                    const allowedGroups = (userProfile.groups || []).map((g: string) => g.toLowerCase());
                    const legacyGroup = userProfile.group?.toLowerCase();
                    const groupToSelect = groupsData.find(g =>
                        allowedGroups.includes(g.name.toLowerCase()) ||
                        legacyGroup === g.name.toLowerCase()
                    );
                    if (groupToSelect) setSelectedGroup(groupToSelect.name.toLowerCase());
                    else setSelectedGroup(groupsData[0].name.toLowerCase());
                } else {
                    setSelectedGroup(groupsData[0].name.toLowerCase());
                }
            }
        });
        return () => unsubscribe();
    }, [userProfile, selectedGroup]);

    // 2. Fetch User Profile to Lock Groups
    useEffect(() => {
        const fetchProfile = async () => {
            if (!auth.currentUser) return;
            const docRef = doc(db, 'users', auth.currentUser.uid);
            const snap = await getDoc(docRef);
            if (snap.exists()) {
                const data = snap.data();
                setUserProfile(data);

                // Auto-select their group if not admin
                if (data.role !== 'admin') {
                    const userGroups = Array.isArray(data.groups) ? data.groups : (data.group ? [data.group] : []);
                    if (userGroups.length > 0) {
                        // Priority: if already 'box' or 'fit' set, keep it if allowed, else select first
                        const possibleGroup = userGroups[0].toLowerCase() as 'box' | 'fit';
                        if (possibleGroup === 'box' || possibleGroup === 'fit') {
                            setSelectedGroup(possibleGroup);
                        }
                    }
                }
            }
        };
        fetchProfile();
    }, []);

    // 2. Generate Week Days
    useEffect(() => {
        const days = ['DOM', 'LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB'];
        const today = new Date();
        const generated = Array.from({ length: 7 }, (_, i) => {
            const d = new Date(today);
            d.setDate(today.getDate() + i);
            return {
                day: days[d.getDay()],
                date: d.getDate().toString(),
                fullDate: d.toISOString().split('T')[0],
                active: d.getDate().toString() === selectedDate
            };
        });
        setWeekDays(generated);
    }, [selectedDate]);

    // 3. Fetch Classes
    useEffect(() => {
        console.log("Agenda: Fetching classes...", selectedGroup, selectedDate);
        const q = query(
            collection(db, 'classes'),
            where('group', '==', selectedGroup)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            let data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // Client-side date filter (Firestore string filtering can be tricky with ISO)
            // Just filter by the string match we generated
            // Re-calculating activeDay here to avoid 'weekDays' dependency if possible, or just strict filter
            // Ideally 'selectedDate' (string 10, 11) is enough if we know the current month/ISO
            // But let's keep it simple: MATCH FULL DATE from the weekDays object logic

            // We need to match 'selectedDate' (e.g. "24") to the actual fullDate
            // Let's re-derive it to be safe and avoid 'weekDays' dependency causing loops
            const today = new Date();
            // This logic must match the week generation exactly
            // Find which day offset matches the selectedDate
            let targetFullDate = "";
            for (let i = 0; i < 7; i++) {
                const d = new Date();
                d.setDate(today.getDate() + i);
                if (d.getDate().toString() === selectedDate) {
                    targetFullDate = d.toISOString().split('T')[0];
                    break;
                }
            }

            if (targetFullDate) {
                data = data.filter((c: any) => c.date === targetFullDate);
            }

            // Client-side Sort
            data.sort((a: any, b: any) => a.startTime.localeCompare(b.startTime));

            console.log("Agenda: Classes found", data.length);
            setClassList(data);
        });
        return () => unsubscribe();
    }, [selectedGroup, selectedDate]); // Removed weekDays from dependency to prevent loops

    // 4. Fetch Reservations (for button status)
    useEffect(() => {
        if (!auth.currentUser) return;
        const q = query(collection(db, 'reservations'), where('userId', '==', auth.currentUser.uid));
        const unsubscribe = onSnapshot(q, (snap) => {
            const map: any = {};
            snap.docs.forEach(d => map[d.data().classId] = d.data().status || 'confirmed');
            setReservations(map);
        });
        return () => unsubscribe();
    }, []);

    // --- Handlers (Reuse logic from UserDashboard) ---
    const handleReserve = async (classId: string, current: number, max: number) => {
        if (!auth.currentUser) return;
        try {
            if (current >= max) {
                await addDoc(collection(db, 'reservations'), {
                    userId: auth.currentUser.uid,
                    classId,
                    reservedAt: new Date().toISOString(),
                    status: 'waitlist'
                });
                alert("Unido a lista de espera");
            } else {
                await addDoc(collection(db, 'reservations'), {
                    userId: auth.currentUser.uid,
                    classId,
                    reservedAt: new Date().toISOString(),
                    status: 'confirmed'
                });
                await updateDoc(doc(db, 'classes', classId), { currentCapacity: increment(1) });
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleCancel = async (classId: string) => {
        if (!confirm("¿Cancelar reserva?")) return;
        if (!auth.currentUser) return;

        const q = query(collection(db, 'reservations'), where('userId', '==', auth.currentUser.uid), where('classId', '==', classId));
        const snap = await getDocs(q);
        if (!snap.empty) {
            const resDoc = snap.docs[0];
            const status = resDoc.data().status;
            await deleteDoc(resDoc.ref);

            if (status === 'confirmed') {
                // Check Waitlist Logic
                const wq = query(collection(db, 'reservations'), where('classId', '==', classId), where('status', '==', 'waitlist'), limit(1));
                const wSnap = await getDocs(wq);
                if (!wSnap.empty) {
                    await updateDoc(wSnap.docs[0].ref, { status: 'pending_confirmation', promotedAt: new Date().toISOString() });
                } else {
                    await updateDoc(doc(db, 'classes', classId), { currentCapacity: increment(-1) });
                }
            } else if (status === 'pending_confirmation') {
                const wq = query(collection(db, 'reservations'), where('classId', '==', classId), where('status', '==', 'waitlist'), limit(1));
                const wSnap = await getDocs(wq);
                if (!wSnap.empty) {
                    await updateDoc(wSnap.docs[0].ref, { status: 'pending_confirmation', promotedAt: new Date().toISOString() });
                } else {
                    await updateDoc(doc(db, 'classes', classId), { currentCapacity: increment(-1) });
                }
            }
        }
    };


    return (
        <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-[#1F2128] text-white' : 'bg-[#F3F4F6] text-gray-900'} font-sans pb-32`}>
            <div className="max-w-[440px] mx-auto p-4 sm:p-6 space-y-6">

                {/* Header Unificado */}
                <TopHeader
                    title="Agenda"
                    subtitle="Sesiones del Box"
                    onBack={() => navigate(-1)}
                    showNotificationDot={false}
                    onLogout={onLogout}
                />

                {/* 1. Week Selector */}
                <section>
                    <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar" style={{ scrollbarWidth: 'none' }}>
                        {weekDays.map((day, idx) => (
                            <div
                                key={idx}
                                onClick={() => setSelectedDate(day.date)}
                                className={`flex-shrink-0 flex flex-col items-center justify-center w-14 h-20 rounded-2xl transition-all cursor-pointer ${day.active ? 'bg-[#FF1F40] text-white shadow-lg shadow-red-900/30' : 'bg-white dark:bg-[#2A2D3A] opacity-60'}`}
                            >
                                <span className="text-[10px] font-bold uppercase mb-1">{day.day}</span>
                                <span className="text-xl font-bold">{day.date}</span>
                            </div>
                        ))}
                    </div>
                </section>

                {/* 2. Group Selector (Cards) */}
                <section>
                    <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar" style={{ scrollbarWidth: 'none' }}>
                        {availableGroups.map((g) => {
                            const isSelected = selectedGroup.toLowerCase() === g.name.toLowerCase();
                            const isAllowed = userProfile?.role === 'admin' ||
                                (userProfile?.groups || []).map((ug: string) => ug.toLowerCase()).includes(g.name.toLowerCase()) ||
                                userProfile?.group?.toLowerCase() === g.name.toLowerCase();

                            return (
                                <button
                                    key={g.id}
                                    onClick={() => setSelectedGroup(g.name.toLowerCase())}
                                    disabled={!isAllowed}
                                    className={`relative flex-shrink-0 w-36 h-24 rounded-3xl overflow-hidden shadow-md group transition-all 
                                        ${isSelected ? 'ring-4 ring-[#FF1F40]' : ''}
                                        ${!isAllowed ? 'opacity-40 grayscale cursor-not-allowed' : ''}
                                    `}
                                >
                                    <img
                                        src={g.imageUrl || "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?q=80&w=400&fit=crop"}
                                        className="absolute inset-0 w-full h-full object-cover brightness-[0.4]"
                                    />
                                    <div className="relative z-10 flex flex-col items-center justify-center h-full px-2">
                                        <span className={`text-white text-[10px] font-black italic px-2 py-1 -rotate-2 break-all text-center leading-tight ${isSelected ? 'bg-[#FF1F40]' : 'bg-black/40'}`}>
                                            {g.name.toUpperCase()}
                                        </span>
                                    </div>
                                </button>
                            );
                        })}
                        {availableGroups.length === 0 && (
                            <div className="w-full text-center py-8 opacity-40 text-[10px] font-black uppercase tracking-widest">
                                No hay grupos configurados
                            </div>
                        )}
                    </div>
                </section>

                {/* 3. Class List */}
                <section className="space-y-4">
                    <h2 className="text-xs font-bold uppercase text-gray-500 tracking-widest">Sesiones Disponibles ({classList.length})</h2>

                    {classList.length === 0 ? (
                        <div className="py-12 text-center opacity-40">
                            <Calendar size={48} className="mx-auto mb-4 text-gray-400" />
                            <p className="font-bold">No hay clases programadas</p>
                        </div>
                    ) : (
                        classList.map((item) => {
                            const status = reservations[item.id];
                            const isReserved = !!status;
                            const isFull = item.currentCapacity >= item.maxCapacity;

                            return (
                                <div key={item.id} className="bg-white dark:bg-[#2A2D3A] p-4 rounded-3xl flex items-center justify-between shadow-sm border border-gray-100 dark:border-gray-800">
                                    <div className="flex items-center gap-4">
                                        {/* Time Column */}
                                        <div className="flex flex-col items-center w-12">
                                            <span className="text-lg font-black">{item.startTime}</span>
                                            <span className="text-[9px] font-bold text-gray-400 uppercase">Coach</span>
                                        </div>
                                        <div className="w-px h-10 bg-gray-200 dark:bg-gray-700"></div>

                                        {/* Info */}
                                        <div>
                                            <h3 className="font-black italic uppercase text-sm leading-tight">{item.name}</h3>
                                            <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                                                <User size={12} />
                                                <span>{item.coachId?.split('-')[1]} • {item.currentCapacity}/{item.maxCapacity}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Button */}
                                    <button
                                        onClick={() => isReserved ? handleCancel(item.id) : handleReserve(item.id, item.currentCapacity, item.maxCapacity)}
                                        className={`
                                    px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all
                                    ${status === 'confirmed' ? 'bg-red-500 text-white' :
                                                status === 'waitlist' ? 'bg-orange-500 text-white' :
                                                    isFull ? 'bg-yellow-500 text-white' : 'bg-green-500 text-white'}
                                `}
                                    >
                                        {status === 'confirmed' ? 'CANCELAR' :
                                            status === 'waitlist' ? 'EN COLA' :
                                                isFull ? 'COLA' : 'RESERVAR'}
                                    </button>
                                </div>
                            );
                        })
                    )}
                </section>

            </div>

            {/* Reusable Bottom Navigation */}
            <BottomNavigation
                role={userProfile?.role || 'user'}
                activeTab="agenda"
            />

        </div>
    );
};

export default Agenda;
