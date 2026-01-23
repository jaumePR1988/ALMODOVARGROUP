import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Calendar,
    User,
    ArrowLeft,
    ChevronRight,
    Lock,
    Info,
    AlertTriangle
} from 'lucide-react';
import BottomNavigation from './BottomNavigation';
import PremiumModal from './PremiumModal';
import TopHeader from './TopHeader';
import WodModal from './WodModal';
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
    const [selectedGroup, setSelectedGroup] = useState<string>('');
    const [availableGroups, setAvailableGroups] = useState<any[]>([]);
    const [classList, setClassList] = useState<any[]>([]);
    const [userProfile, setUserProfile] = useState<any>(null);
    const [reservations, setReservations] = useState<{ [key: string]: string }>({});

    // Fetch User Profile locally since this component is a page
    useEffect(() => {
        const unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
            if (user) {
                const userRef = doc(db, 'users', user.uid);
                const userSnap = await getDoc(userRef);
                if (userSnap.exists()) {
                    setUserProfile(userSnap.data());
                } else {
                    // Fallback if doc doesn't exist (rare)
                    setUserProfile({});
                }
            } else {
                setUserProfile(null);
            }
        });
        return () => unsubscribeAuth();
    }, []);

    // MODAL STATE
    const [modalConfig, setModalConfig] = useState<any>({ isOpen: false, type: 'info', title: '', message: '' });
    const [selectedClassForWod, setSelectedClassForWod] = useState<any>(null);

    // Week Control Logic
    const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
        const d = new Date();
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
        return new Date(d.setDate(diff));
    });
    const [viewingNextWeek, setViewingNextWeek] = useState(false);
    const [showAlert, setShowAlert] = useState(false);

    const monthNames = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];

    const handleNextWeekToggle = () => {
        if (viewingNextWeek) {
            // Go back to current week
            const d = new Date(); // Today
            const day = d.getDay();
            const diff = d.getDate() - day + (day === 0 ? -6 : 1);
            setCurrentWeekStart(new Date(d.setDate(diff)));
            setViewingNextWeek(false);
            // Default selected date to today when returning
            setSelectedDate(new Date().getDate().toString());
        } else {
            // Try to go to next week
            const now = new Date();
            const isSaturdayPast10 = now.getDay() === 6 && now.getHours() >= 10;
            const isSunday = now.getDay() === 0;

            if (isSaturdayPast10 || isSunday) {
                // Allowed
                const nextMonday = new Date(currentWeekStart);
                nextMonday.setDate(currentWeekStart.getDate() + 7);
                setCurrentWeekStart(nextMonday);
                setViewingNextWeek(true);
                // Default select Monday of next week
                setSelectedDate(nextMonday.getDate().toString());
            } else {
                // Locked
                setShowAlert(true);
            }
        }
    };

    // 1. Fetch Groups
    useEffect(() => {
        const q = query(collection(db, 'groups'), orderBy('name', 'asc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const groupsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setAvailableGroups(groupsData);
        });
        return () => unsubscribe();
    }, []);

    // 2. Auto-Select Group based on Profile or Default
    useEffect(() => {
        // Wait for availableGroups to be loaded
        if (availableGroups.length > 0) {

            // If already selected, do nothing (unless we want to force re-select on profile change?)
            // But we specifically need to handle the initial load or "no selection yet"
            if (!selectedGroup) {

                // CRITICAL: Check if we are still waiting for user profile potentially?
                // Depending on App structure, userProfile might be null initially.
                // However, we can try to best-effort match if userProfile exists.

                if (userProfile) {
                    console.log("[Agenda Debug] UserProfile loaded:", userProfile);
                    // Prioritize 'groups' array, then fallback to 'group'
                    let userGroups = userProfile.groups || [];
                    if (userProfile.group && !userGroups.includes(userProfile.group)) {
                        userGroups = [userProfile.group, ...userGroups];
                    }
                    console.log("[Agenda Debug] Calculated User Groups:", userGroups);

                    if (userGroups.length > 0) {
                        // Try to find a match for ANY of the user's groups in availableGroups
                        // ensuring we use the capitalized name from availableGroups
                        console.log("[Agenda Debug] Available Groups:", availableGroups.map(g => g.name));
                        const match = availableGroups.find(g =>
                            userGroups.some((ug: string) => ug.toLowerCase() === g.name.toLowerCase())
                        );

                        if (match) {
                            console.log("[Agenda Debug] Match Found:", match.name);
                            setSelectedGroup(match.name);
                        } else {
                            console.log("[Agenda Debug] No match found. Fallback to:", availableGroups[0].name);
                            // Fallback only if NO match found
                            setSelectedGroup(availableGroups[0].name);
                        }
                    } else {
                        console.log("[Agenda Debug] User has no groups. Fallback to:", availableGroups[0].name);
                        // User loaded but has no groups? Fallback default
                        setSelectedGroup(availableGroups[0].name);
                    }
                } else {
                    console.log("[Agenda Debug] UserProfile is falsey. Waiting...");
                    // Accessing agenda without profile loaded OR guest? 
                    // To prevent flashing wrong group, maybe we don't default yet?
                    // But if it's admin/coach they might rely on default.
                    // Let's safe fallback only if we are sure keys are stable.
                    // setSelectedGroup(availableGroups[0].name); 
                }
            }
        }
    }, [userProfile, availableGroups, selectedGroup]);

    // 3. Generate Week Days
    useEffect(() => {
        const days = ['DOM', 'LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB'];
        const generated = Array.from({ length: 7 }, (_, i) => {
            const d = new Date(currentWeekStart);
            d.setDate(currentWeekStart.getDate() + i);
            return {
                day: days[d.getDay()],
                date: d.getDate().toString(),
                fullDate: d.toISOString().split('T')[0],
                active: d.getDate().toString() === selectedDate
            };
        });
        setWeekDays(generated);
    }, [selectedDate, currentWeekStart]);

    // 4. Fetch Classes
    useEffect(() => {
        if (!selectedGroup) return;

        console.log("Agenda: Fetching classes...", selectedGroup);
        const q = query(
            collection(db, 'classes'),
            where('group', '==', selectedGroup)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            let data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // Client-side date filter
            // 1. Find the expected Full Date for the selected day number
            let targetFullDate = "";

            // Loop through the *current view's* week to find the matching date
            for (let i = 0; i < 7; i++) {
                const d = new Date(currentWeekStart);
                d.setDate(currentWeekStart.getDate() + i);
                if (d.getDate().toString() === selectedDate) {
                    targetFullDate = d.toISOString().split('T')[0];
                    break;
                }
            }

            if (targetFullDate) {
                data = data.filter((c: any) => c.date === targetFullDate);
            } else {
                // Should not happen, but safe fallback
                data = [];
            }

            // Sort by time
            data.sort((a: any, b: any) => a.startTime.localeCompare(b.startTime));

            console.log("Agenda: Classes found", data.length);
            setClassList(data);
        });
        return () => unsubscribe();
    }, [selectedGroup, selectedDate, currentWeekStart]);

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

        // 1. Check Credits
        if (userProfile?.credits <= 0) {
            setModalConfig({ isOpen: true, type: 'danger', title: 'Sin Créditos', message: '❌ No tienes créditos suficientes para reservar.', onConfirm: () => setModalConfig((prev: any) => ({ ...prev, isOpen: false })) });
            return;
        }

        // 2. Weekly Limit Check (Only for Confirmed Reservations, Waitlist is exempt)
        const isWaitlist = current >= max;
        if (!isWaitlist) {
            try {
                // Fetch target class date
                const targetClassSnap = await getDoc(doc(db, 'classes', classId));
                if (targetClassSnap.exists()) {
                    const targetDateStr = targetClassSnap.data().date; // YYYY-MM-DD
                    const targetDate = new Date(targetDateStr);

                    // Determine Week Range of the Target Class
                    const day = targetDate.getDay();
                    const diff = targetDate.getDate() - day + (day === 0 ? -6 : 1); // Monday
                    const monday = new Date(targetDate);
                    monday.setDate(diff);
                    monday.setHours(0, 0, 0, 0);

                    const nextMonday = new Date(monday);
                    nextMonday.setDate(monday.getDate() + 7);

                    // Fetch user's confirmed reservations
                    const q = query(collection(db, 'reservations'), where('userId', '==', auth.currentUser.uid), where('status', '==', 'confirmed'));
                    const snap = await getDocs(q);

                    // Filter for same week
                    let weeklyCount = 0;

                    const checks = snap.docs.map(async (r) => {
                        const cSnap = await getDoc(doc(db, 'classes', r.data().classId));
                        if (cSnap.exists()) {
                            const cDate = new Date(cSnap.data().date);
                            return cDate >= monday && cDate < nextMonday;
                        }
                        return false;
                    });

                    const results = await Promise.all(checks);
                    weeklyCount = results.filter(Boolean).length;

                    const WEEKLY_LIMIT = userProfile?.weeklyLimit || 2; // Default 2

                    if (weeklyCount >= WEEKLY_LIMIT) {
                        setModalConfig({
                            isOpen: true,
                            type: 'warning',
                            title: 'Límite Semanal',
                            message: `Has alcanzado tu límite de ${WEEKLY_LIMIT} reservas para esta semana.\n\nSolo puedes apuntarte a la Lista de Espera.`,
                            onConfirm: () => setModalConfig((prev: any) => ({ ...prev, isOpen: false }))
                        });
                        return; // Block
                    }
                }
            } catch (e) {
                console.error("Error checking limits", e);
            }
        }

        const executeReserve = async () => {
            try {
                if (current >= max) {
                    await addDoc(collection(db, 'reservations'), {
                        userId: auth.currentUser.uid,
                        classId,
                        reservedAt: new Date().toISOString(),
                        status: 'waitlist'
                    });
                    setModalConfig({ isOpen: true, type: 'warning', title: 'En Cola', message: 'Te has unido a la lista de espera.\nNo se te ha descontado ningún crédito.', onConfirm: () => setModalConfig((prev: any) => ({ ...prev, isOpen: false })) });
                } else {
                    await addDoc(collection(db, 'reservations'), {
                        userId: auth.currentUser.uid,
                        classId,
                        reservedAt: new Date().toISOString(),
                        status: 'confirmed'
                    });
                    await updateDoc(doc(db, 'classes', classId), { currentCapacity: increment(1) });
                    await updateDoc(doc(db, 'users', auth.currentUser.uid), { credits: increment(-1) });

                    setModalConfig({ isOpen: true, type: 'success', title: '¡Reserva Confirmada!', message: 'Se ha descontado 1 crédito de tu cuenta.\n¡Te esperamos en el Box!', onConfirm: () => setModalConfig((prev: any) => ({ ...prev, isOpen: false })) });
                }
            } catch (e) {
                console.error(e);
                setModalConfig({ isOpen: true, type: 'danger', title: 'Error', message: 'Ha ocurrido un error al reservar.', onConfirm: () => setModalConfig((prev: any) => ({ ...prev, isOpen: false })) });
            }
        };

        // Confirm Action Modal
        if (current >= max) {
            setModalConfig({
                isOpen: true,
                type: 'warning',
                title: 'Clase Llena',
                message: '¿Quieres unirte a la lista de espera?\nSi se libera una plaza, te avisaremos.',
                confirmText: 'Sí, unirme a la cola',
                onConfirm: executeReserve
            });
        } else {
            setModalConfig({
                isOpen: true,
                type: 'info',
                title: 'Confirmar Reserva',
                message: '¿Quieres reservar plaza en esta clase?\nSe te descontará 1 crédito.',
                confirmText: 'Sí, Reservar',
                onConfirm: executeReserve
            });
        }
    };

    const handleCancel = async (classId: string) => {
        if (!auth.currentUser) return;

        // 0. Fetch class details for time check
        const classSnap = await getDoc(doc(db, 'classes', classId));
        if (!classSnap.exists()) return;
        const classData = classSnap.data();

        // 1. Calculate time difference
        const classDate = new Date(`${classData.date}T${classData.startTime}`);
        const now = new Date();
        const diffMs = classDate.getTime() - now.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);

        // 2. Define Action
        const executeCancel = async () => {
            const q = query(collection(db, 'reservations'), where('userId', '==', auth.currentUser!.uid), where('classId', '==', classId));
            const snap = await getDocs(q);
            if (!snap.empty) {
                const resDoc = snap.docs[0];
                const status = resDoc.data().status;
                await deleteDoc(resDoc.ref);

                if (status === 'confirmed') {
                    if (diffHours >= 1) {
                        await updateDoc(doc(db, 'users', auth.currentUser!.uid), { credits: increment(1) });
                        setModalConfig({ isOpen: true, type: 'success', title: 'Cancelación Exitosa', message: 'Se ha devuelto 1 crédito a tu cuenta.', onConfirm: () => setModalConfig((prev: any) => ({ ...prev, isOpen: false })) });
                    } else {
                        setModalConfig({ isOpen: true, type: 'warning', title: 'Cancelación Tardía', message: 'Reserva cancelada sin devolución de crédito (<1h).', onConfirm: () => setModalConfig((prev: any) => ({ ...prev, isOpen: false })) });
                    }

                    const wq = query(collection(db, 'reservations'), where('classId', '==', classId), where('status', '==', 'waitlist'), limit(1));
                    const wSnap = await getDocs(wq);
                    if (!wSnap.empty) {
                        await updateDoc(wSnap.docs[0].ref, { status: 'pending_confirmation', promotedAt: new Date().toISOString() });
                    } else {
                        await updateDoc(doc(db, 'classes', classId), { currentCapacity: increment(-1) });
                    }
                } else if (status === 'pending_confirmation') {
                    // Check waitlist for other users
                    const wq = query(collection(db, 'reservations'), where('classId', '==', classId), where('status', '==', 'waitlist'), limit(1));
                    const wSnap = await getDocs(wq);
                    if (!wSnap.empty) {
                        await updateDoc(wSnap.docs[0].ref, { status: 'pending_confirmation', promotedAt: new Date().toISOString() });
                    } else {
                        await updateDoc(doc(db, 'classes', classId), { currentCapacity: increment(-1) });
                    }
                    setModalConfig({ isOpen: true, type: 'info', title: 'Reserva Rechazada', message: 'Has liberado tu plaza pendiente.', onConfirm: () => setModalConfig((prev: any) => ({ ...prev, isOpen: false })) });
                }
            }
        };

        // 3. Trigger Modal
        if (diffHours < 1) {
            setModalConfig({
                isOpen: true,
                type: 'danger',
                title: '¿Cancelar Ahora?',
                message: '⚠️ Queda MENOS DE 1 HORA para la clase.\n\nSi cancelas ahora, NO SE TE DEVOLVERÁ el crédito.',
                confirmText: 'Sí, Cancelar y Perder Crédito',
                cancelText: 'No, Mantener',
                onConfirm: executeCancel
            });
        } else {
            setModalConfig({
                isOpen: true,
                type: 'info',
                title: 'Confirmar Cancelación',
                message: '¿Seguro que quieres cancelar?\nSe te devolverá 1 Crédito.',
                confirmText: 'Sí, Cancelar',
                cancelText: 'No',
                onConfirm: executeCancel
            });
        }
    };


    return (
        <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-[#1F2128] text-white' : 'bg-[#F3F4F6] text-gray-900'} font-sans pb-32`}>
            <PremiumModal
                isOpen={modalConfig.isOpen}
                type={modalConfig.type}
                title={modalConfig.title}
                message={modalConfig.message}
                confirmText={modalConfig.confirmText}
                cancelText={modalConfig.cancelText}
                onConfirm={modalConfig.onConfirm}
                onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
            />
            <div className="max-w-[440px] mx-auto p-4 sm:p-6 space-y-6">

                {/* Header Unificado */}
                <TopHeader
                    title="Agenda"
                    subtitle="Sesiones del Box"
                    onBack={() => navigate(-1)}
                    showNotificationDot={false}
                    onLogout={onLogout}
                />

                {/* 1. Week Selector with Week Control */}
                <section>
                    <div className="flex items-center justify-between mb-4 px-1">
                        <h2 className="text-xs font-bold uppercase text-gray-500 tracking-widest">
                            {currentWeekStart.getDate()} {monthNames[currentWeekStart.getMonth()]} -
                            {new Date(currentWeekStart.getTime() + 6 * 24 * 60 * 60 * 1000).getDate()} {monthNames[new Date(currentWeekStart.getTime() + 6 * 24 * 60 * 60 * 1000).getMonth()]}
                        </h2>
                        <button
                            onClick={handleNextWeekToggle}
                            className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-widest py-1.5 px-3 rounded-lg transition-all
                                ${viewingNextWeek
                                    ? 'bg-[#FF1F40] text-white shadow-lg shadow-red-500/30'
                                    : 'bg-white dark:bg-[#2A2D3A] text-gray-500 border border-gray-100 dark:border-gray-800'
                                }`}
                        >
                            {viewingNextWeek ? 'Volver a esta semana' : 'Ver Siguiente Semana'}
                            {!viewingNextWeek && <ChevronRight size={14} />}
                        </button>
                    </div>

                    <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar" style={{ scrollbarWidth: 'none' }}>
                        {weekDays.map((day, idx) => (
                            <div
                                key={idx}
                                onClick={() => setSelectedDate(day.date)}
                                className={`flex-shrink-0 flex flex-col items-center justify-center w-14 h-20 rounded-2xl transition-all cursor-pointer 
                                    ${day.active
                                        ? 'bg-[#FF1F40] text-white shadow-lg shadow-red-900/30 scale-105'
                                        : 'bg-white dark:bg-[#2A2D3A] text-gray-400 border border-gray-100 dark:border-gray-800'
                                    }`}
                            >
                                <span className="text-[10px] font-bold uppercase mb-1 opacity-80">{day.day}</span>
                                <span className="text-xl font-black">{day.date}</span>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Group Selector Removed - Auto Assigned */}

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
                                <div key={item.id} className="relative bg-white dark:bg-[#2A2D3A] p-4 rounded-3xl flex items-center justify-between shadow-sm border border-gray-100 dark:border-gray-800">
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

                                    {/* Invisible Overlay for click entire card */}
                                    <div
                                        className="absolute inset-0 z-0"
                                        onClick={() => setSelectedClassForWod(item)}
                                    ></div>

                                    {/* Button */}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation(); // Prevent opening WOD modal
                                            isReserved ? handleCancel(item.id) : handleReserve(item.id, item.currentCapacity, item.maxCapacity);
                                        }}
                                        className={`
                                        relative z-10 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all
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

            </div >

            {/* ALERT MODAL */}
            {
                showAlert && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-white dark:bg-[#1F2128] w-full max-w-sm rounded-[2rem] p-6 shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <Lock size={120} className="transform rotate-12 -translate-y-8 translate-x-8 text-red-500" />
                            </div>

                            <div className="relative z-10">
                                <div className="w-16 h-16 bg-red-100 dark:bg-red-500/10 rounded-full flex items-center justify-center text-red-500 mb-6 mx-auto">
                                    <Lock size={32} />
                                </div>

                                <h3 className="text-xl font-black text-center mb-2 uppercase italic">Acceso Restringido</h3>

                                <p className="text-center text-gray-500 dark:text-gray-400 text-sm font-medium leading-relaxed mb-8">
                                    Las reservas para la próxima semana se abrirán el <span className="text-red-500 font-bold">Sábado a las 10:00 AM</span>.
                                    <br /><br />
                                    ¡Prepárate para reservar tu plaza!
                                </p>

                                <button
                                    onClick={() => setShowAlert(false)}
                                    className="w-full bg-[#FF1F40] text-white font-black uppercase tracking-widest py-4 rounded-xl shadow-lg shadow-red-500/30 active:scale-95 transition-transform"
                                >
                                    Entendido
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Reusable Bottom Navigation */}
            <BottomNavigation
                role={userProfile?.role || 'user'}
                activeTab="agenda"
            />

            {/* WOD Detail Modal */}
            <WodModal
                isOpen={!!selectedClassForWod}
                onClose={() => setSelectedClassForWod(null)}
                classData={selectedClassForWod}
            />

        </div >
    );
};

export default Agenda;
