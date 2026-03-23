import { useState, useEffect } from 'react';

import { Lock, Calendar, MapPin, FileText, Info } from 'lucide-react';
import { collection, getDocs, doc, getDoc, updateDoc, addDoc, query, where, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import UserNavBar from '../components/UserNavBar';
import ClassDetailModal from '../components/ClassDetailModal';
import UserTopBar from '../components/UserTopBar';
import {
    notifyBookingConfirmed,
    notifyBookingCancelled,
    notifyCoachCancellation,
    notifyAdminCancellation,
    notifyClassFull,
    notifyWaitlistJoined,
    notifyWaitlistConfirmed,
    getClassAttendeeCount,
    getCoachIdForClass,
    sendNotification
} from '../utils/notificationService';

interface ClassData {
    id: string;
    title: string;
    description?: string;
    imageUrl?: string;
    coachName: string;
    coachId?: string;
    category: string;
    startTime: string;
    capacity: number;
    isRecurring?: boolean;
    recurringDays?: number[];
    specificDate?: string;
    wodUrl?: string;
    wodName?: string;
}

const Booking = () => {
    const { userData } = useAuth();
    const [classes, setClasses] = useState<ClassData[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Configuración The Saturday Drop
    const [isNextWeekUnlocked, setIsNextWeekUnlocked] = useState(false);
    
    // UI State
    const [selectedWeek, setSelectedWeek] = useState<'current' | 'next'>('current');
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [unlockConfig, setUnlockConfig] = useState({ dayName: 'Sábado', time: '10:00' });
    
    // Booking State
    const [userReservations, setUserReservations] = useState<any[]>([]);
    const [selectedClassForBooking, setSelectedClassForBooking] = useState<ClassData | null>(null);
    const [bookingLoading, setBookingLoading] = useState(false);
    const [bookingSuccess, setBookingSuccess] = useState(false);
    const [bookingError, setBookingError] = useState('');
    
    // Waitlist State
    const [userWaitlists, setUserWaitlists] = useState<any[]>([]);
    const [waitlistLoading, setWaitlistLoading] = useState(false);
    const [selectedClassAttendees, setSelectedClassAttendees] = useState<any[]>([]);
    const [lockedSpots, setLockedSpots] = useState<number>(0);
    const [isWaitlistInvited, setIsWaitlistInvited] = useState<boolean>(false);
    const [currentInviteId, setCurrentInviteId] = useState<string | null>(null);
    const [waitlistPosition, setWaitlistPosition] = useState<number | null>(null);
    
    // Cancellation State
    const [selectedClassForCancel, setSelectedClassForCancel] = useState<{classData: ClassData, reservationId: string} | null>(null);
    const [cancelLoading, setCancelLoading] = useState(false);
    const [cancelSuccess, setCancelSuccess] = useState(false);
    const [cancelError, setCancelError] = useState('');

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                // 1. Obtener Reglas
                const rulesSnap = await getDoc(doc(db, 'settings', 'reservationRules'));
                let currentUnlockDay = 6;
                let currentUnlockTime = '10:00';
                
                if (rulesSnap.exists()) {
                    currentUnlockDay = rulesSnap.data().unlockDayIndex ?? 6;
                    currentUnlockTime = rulesSnap.data().unlockTime ?? '10:00';
                }

                const dayNamesList = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
                setUnlockConfig({
                    dayName: dayNamesList[currentUnlockDay],
                    time: currentUnlockTime
                });

                // 2. Calcular si la próxima semana está desbloqueada
                const now = new Date();
                const currentJSday = now.getDay();
                const [unlockHour, unlockMinute] = currentUnlockTime.split(':').map(Number);
                
                const dropDate = new Date(now);
                const currentDayFixed = currentJSday === 0 ? 7 : currentJSday;
                const unlockDayFixed = currentUnlockDay === 0 ? 7 : currentUnlockDay;
                
                const diffDays = unlockDayFixed - currentDayFixed;
                dropDate.setDate(now.getDate() + diffDays);
                dropDate.setHours(unlockHour, unlockMinute, 0, 0);

                let isUnlocked = false;
                if (diffDays < 0) {
                    isUnlocked = true;
                } else if (diffDays === 0) {
                    if (now >= dropDate) {
                        isUnlocked = true;
                    }
                }
                setIsNextWeekUnlocked(isUnlocked);

                // 3. Obtener Clases
                const classesSnap = await getDocs(collection(db, 'classes'));
                const classList = classesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ClassData[];
                setClasses(classList);
                
                // 4. Obtener Reservas del Usuario
                if (userData?.uid) {
                    const resSnap = await getDocs(query(collection(db, 'reservations'), where('userId', '==', userData.uid), where('status', '==', 'active')));
                    setUserReservations(resSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

                    const wlSnap = await getDocs(query(collection(db, 'waitlist'), where('userId', '==', userData.uid)));
                    setUserWaitlists(wlSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
                }

            } catch (error) {
                console.error("Error cargando dashboard:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [userData?.uid]);

    useEffect(() => {
        const fetchAttendees = async () => {
            if (!selectedClassForBooking) {
                setSelectedClassAttendees([]);
                setLockedSpots(0);
                setIsWaitlistInvited(false);
                setCurrentInviteId(null);
                return;
            }
            const dateStr = new Date(selectedDate.getTime() - (selectedDate.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
            const resSnap = await getDocs(query(
                collection(db, 'reservations'),
                where('classId', '==', selectedClassForBooking.id),
                where('classDate', '==', dateStr),
                where('status', '==', 'active')
            ));
            const attendeesList = resSnap.docs.map(doc => doc.data());
            setSelectedClassAttendees(attendeesList);

            const waitlistSnap = await getDocs(query(
                collection(db, 'waitlist'),
                where('classId', '==', selectedClassForBooking.id),
                where('classDate', '==', dateStr)
            ));
            
            const waitlistDocs = waitlistSnap.docs.map(d => ({id: d.id, ...d.data()}));
            waitlistDocs.sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
            
            const now = Date.now();
            let validInvitesCount = 0;
            let userIsInvited = false;
            let inviteId: string | null = null;
            let position = null;
            
            const waitingList = waitlistDocs.filter((d: any) => d.status === 'waiting');
            const userWaitlistIndex = waitingList.findIndex((d: any) => d.userId === userData?.uid);
            if (userWaitlistIndex !== -1) {
                position = userWaitlistIndex + 1;
            }

            for (const data of waitlistDocs) {
                const d = data as any;
                if (d.status === 'invited' && d.expiresAt && new Date(d.expiresAt).getTime() > now) {
                    validInvitesCount++;
                    if (d.userId === userData?.uid) {
                        userIsInvited = true;
                        inviteId = d.id;
                    }
                }
            }

            setLockedSpots(attendeesList.length + validInvitesCount);
            setIsWaitlistInvited(userIsInvited);
            setCurrentInviteId(inviteId);
            setWaitlistPosition(position);
        };
        fetchAttendees();
    }, [selectedClassForBooking, selectedDate, userData?.uid]);

    const getDaysForSlider = () => {
        const days = [];
        const baseDate = new Date();
        const currentJSday = baseDate.getDay() === 0 ? 7 : baseDate.getDay();
        baseDate.setDate(baseDate.getDate() - currentJSday + 1);

        if (selectedWeek === 'next') {
            baseDate.setDate(baseDate.getDate() + 7);
        }

        for (let i = 0; i < 7; i++) {
            const date = new Date(baseDate);
            date.setDate(baseDate.getDate() + i);
            days.push(date);
        }
        return days;
    };

    const weekDays = getDaysForSlider();

    const classesForSelectedDate = classes.filter(c => {
        const dayOfWeek = selectedDate.getDay();
        if (c.isRecurring) {
            return c.recurringDays?.includes(dayOfWeek);
        } else {
            const selectedStr = selectedDate.toISOString().split('T')[0];
            return c.specificDate === selectedStr;
        }
        // Then filter mode/group based on user in a real app, here we show all or those matching condition
    }).sort((a, b) => a.startTime.localeCompare(b.startTime));

    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const formatDay = (date: Date) => date.getDate().toString().padStart(2, '0');

    return (
        <div className="bg-[#111111] text-gray-200 min-h-screen pb-safe font-sans selection:bg-[#E13038] selection:text-white">
            
            <UserTopBar />

            <main className="pt-24 pb-32 px-6 max-w-[480px] mx-auto min-h-screen">
                
                {/* Week Selector */}
                <div className="bg-[#1c1b1b] p-1.5 rounded-xl border border-[#333] flex relative mb-6">
                    <div 
                        className="absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-[#E13038] rounded-lg transition-transform duration-300 ease-out shadow-[0_0_15px_rgba(225,48,56,0.3)]"
                        style={{ transform: selectedWeek === 'current' ? 'translateX(0)' : 'translateX(100%)' }}
                    />
                    
                    <button 
                        onClick={() => setSelectedWeek('current')}
                        className={`flex-1 relative z-10 py-3 text-xs font-black uppercase tracking-widest transition-colors ${selectedWeek === 'current' ? 'text-white' : 'text-gray-500'}`}
                    >
                        Esta Semana
                    </button>
                    
                    <button 
                        onClick={() => setSelectedWeek('next')}
                        className={`flex-1 relative z-10 py-3 text-xs font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-2 ${selectedWeek === 'next' ? 'text-white' : 'text-gray-500'}`}
                    >
                        {!isNextWeekUnlocked && <Lock size={12} className="mb-0.5 text-[#E13038]" />}
                        Próxima Semana
                    </button>
                </div>

                {/* Day Slider */}
                <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-6 snap-x">
                    {weekDays.map((date, idx) => {
                        const isSelected = selectedDate.getDate() === date.getDate() && selectedDate.getMonth() === date.getMonth();
                        const isToday = new Date().getDate() === date.getDate() && new Date().getMonth() === date.getMonth();
                        const isPast = new Date(new Date().setHours(0,0,0,0)) > date;

                        return (
                            <button
                                key={idx}
                                disabled={isPast}
                                onClick={() => setSelectedDate(date)}
                                className={`snap-center flex-shrink-0 w-16 h-20 rounded-2xl flex flex-col items-center justify-center transition-all ${isPast ? 'opacity-30 cursor-not-allowed bg-[#1c1b1b]' : isSelected ? 'bg-[#E13038] text-white shadow-[0_10px_20px_rgba(225,48,56,0.3)] scale-105' : 'bg-[#1c1b1b] hover:bg-[#2a2a2a] text-gray-400'}`}
                            >
                                <span className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${isSelected ? 'text-white/80' : isToday ? 'text-[#E13038]' : 'text-gray-500'}`}>
                                    {dayNames[date.getDay()]}
                                </span>
                                <span className={`text-2xl font-black ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                                    {formatDay(date)}
                                </span>
                                {isToday && !isSelected && <div className="w-1 h-1 rounded-full bg-[#E13038] mt-1" />}
                            </button>
                        );
                    })}
                </div>

                {/* Classes List */}
                <div className="space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4 flex items-center gap-2">
                        <Calendar size={14} /> 
                        Sesiones Disponibles
                    </h3>

                    {selectedWeek === 'next' && !isNextWeekUnlocked ? (
                        <div className="bg-[#1c1b1b] border border-[#333] rounded-2xl p-8 text-center flex flex-col items-center justify-center mt-4">
                            <Lock size={48} className="text-[#E13038] mb-4" />
                            <h3 className="text-xl font-black uppercase text-white tracking-widest mb-2">Semana Oculta</h3>
                            <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] leading-relaxed">
                                Las clases para la próxima semana se habilitarán el {unlockConfig.dayName.toLowerCase()} a las {unlockConfig.time}
                            </p>
                        </div>
                    ) : loading ? (
                        <div className="flex justify-center py-10">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#E13038]"></div>
                        </div>
                    ) : classesForSelectedDate.length === 0 ? (
                        <div className="bg-[#1c1b1b] border border-[#333] rounded-2xl p-8 text-center flex flex-col items-center justify-center opacity-70">
                            <Info size={32} className="text-gray-600 mb-3" />
                            <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No hay clases programadas</p>
                        </div>
                    ) : (
                        classesForSelectedDate.map(c => {
                            const dateStr = new Date(selectedDate.getTime() - (selectedDate.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
                            const isBooked = userReservations.some(r => r.classId === c.id && r.classDate === dateStr);

                            return (
                                <div 
                                    key={c.id} 
                                    onClick={() => setSelectedClassForBooking(c)}
                                    className={`bg-[#1c1b1b] border border-[#333] rounded-2xl overflow-hidden transition-all ${isBooked ? 'border-[#E13038]/50 cursor-pointer group hover:border-[#E13038]' : 'hover:border-[#E13038]/50 cursor-pointer group active:scale-[0.98]'}`}
                                >
                                    {c.imageUrl ? (
                                        <div className="w-full h-32 relative">
                                            {isBooked && (
                                                <div className="absolute inset-0 bg-black/60 z-30 flex items-center justify-center backdrop-blur-[2px]">
                                                    <div className="bg-[#E13038] text-white px-4 py-2 rounded-full font-black uppercase tracking-widest text-xs shadow-lg shadow-[#E13038]/20 text-center">
                                                        Reservado
                                                    </div>
                                                </div>
                                            )}
                                            <div className="absolute inset-0 bg-gradient-to-t from-[#1c1b1b] to-transparent z-10" />
                                            <img src={c.imageUrl} alt={c.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                            <div className="absolute top-3 right-3 z-20 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 flex items-center gap-2">
                                                {!isBooked && <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />}
                                                <span className="text-[10px] font-bold text-white uppercase tracking-widest">{c.capacity} Plazas</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="w-full bg-[#2a2a2a] p-3 flex justify-between items-center border-b border-[#333] relative">
                                            {isBooked && (
                                                <div className="absolute inset-0 bg-black/60 z-30 flex items-center justify-center">
                                                    <span className="bg-[#E13038] text-white px-3 py-1 rounded font-black uppercase tracking-widest text-[10px] shadow-lg shadow-[#E13038]/20 text-center">Reservado</span>
                                                </div>
                                            )}
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-black/50 px-2 py-1 rounded">{c.category}</span>
                                            <span className="text-[10px] font-bold text-[#E13038] uppercase tracking-widest">{isBooked ? 'Ocupado' : `${c.capacity} Plazas`}</span>
                                        </div>
                                    )}

                                <div className="p-5">
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="text-xl font-black uppercase tracking-tight text-white leading-tight pr-4">{c.title}</h4>
                                        <div className="flex flex-col items-end">
                                            <span className="text-2xl font-black text-[#E13038] tracking-tighter">{c.startTime}</span>
                                        </div>
                                    </div>
                                    
                                    {c.description && (
                                        <p className="text-xs text-gray-500 font-medium mb-4 line-clamp-2 leading-relaxed">{c.description}</p>
                                    )}

                                    <div className="flex items-center justify-between pt-4 border-t border-[#333]">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded bg-[#2a2a2a] flex items-center justify-center">
                                                <MapPin size={12} className="text-[#E13038]" />
                                            </div>
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Coach: {c.coachName}</span>
                                        </div>
                                        {isBooked && c.wodUrl && (
                                            <a 
                                                href={c.wodUrl}
                                                target="_blank"
                                                rel="noreferrer"
                                                onClick={(e) => e.stopPropagation()}
                                                className="flex items-center gap-1.5 bg-[#E13038]/10 text-[#E13038] px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-[#E13038]/20 transition-colors"
                                            >
                                                <FileText size={12} />
                                                Ver WOD
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>
                            );
                        })
                    )}
                </div>
            </main>

            <ClassDetailModal
                isOpen={!!selectedClassForBooking}
                onClose={() => !bookingLoading && setSelectedClassForBooking(null)}
                classData={selectedClassForBooking || null}
                selectedDate={selectedDate}
                role="user"
                isBooked={selectedClassForBooking ? userReservations.some(r => r.classId === selectedClassForBooking.id && r.classDate === new Date(selectedDate.getTime() - (selectedDate.getTimezoneOffset() * 60000)).toISOString().split('T')[0]) : false}
                bookingLoading={bookingLoading}
                bookingError={bookingError}
                bookingSuccess={bookingSuccess}
                onReserve={async (c) => {
                    if (!userData) return;
                    setBookingLoading(true);
                    setBookingError('');
                    try {
                        if (((userData.credits || 0) + (userData.saldoExtra || 0)) <= 0) {
                            setBookingError('No tienes créditos suficientes');
                            setBookingLoading(false);
                            return;
                        }

                        const userRef = doc(db, 'users', userData.uid);
                        const userSnap = await getDoc(userRef);
                        const dbData = userSnap.data();
                        if (!userSnap.exists() || ((dbData?.credits || 0) + (dbData?.saldoExtra || 0)) <= 0) {
                            setBookingError('No tienes suficientes créditos');
                            setBookingLoading(false);
                            return;
                        }

                        const dateStr = new Date(selectedDate.getTime() - (selectedDate.getTimezoneOffset() * 60000)).toISOString().split('T')[0];

                        const resRef = await addDoc(collection(db, 'reservations'), {
                            userId: userData.uid,
                            classId: c.id,
                            classDate: dateStr,
                            userName: userData.displayName || 'Unknown',
                            userPhoto: userData.photoURL || '',
                            className: c.title,
                            status: 'active',
                            createdAt: new Date().toISOString()
                        });

                        const currentCredits = dbData?.credits || 0;
                        const currentExtra = dbData?.saldoExtra || 0;
                        
                        if (currentCredits > 0) {
                            await updateDoc(userRef, { credits: currentCredits - 1 });
                        } else {
                            await updateDoc(userRef, { saldoExtra: currentExtra - 1 });
                        }

                        if (currentInviteId) {
                            await updateDoc(doc(db, 'waitlist', currentInviteId), {
                                status: 'confirmed'
                            });
                            // Notify coach + admin that waitlist user confirmed
                            notifyWaitlistConfirmed(c.id, userData.displayName || 'Usuario', c.title, dateStr);
                        }

                        // ── Notifications ──
                        // 1. Notify user: booking confirmed
                        notifyBookingConfirmed(userData.uid, c.title, dateStr, c.startTime);

                        // 2. Check if class is now full → notify coach + admin
                        const attendeeCount = await getClassAttendeeCount(c.id, dateStr);
                        if (attendeeCount >= c.capacity) {
                            notifyClassFull(c.id, c.title, dateStr, c.capacity, c.category);
                        }

                        if (navigator.vibrate) navigator.vibrate([20, 50, 20]);
                        setBookingSuccess(true);
                        
                        setUserReservations(prev => [...prev, {
                            id: resRef.id,
                            classId: c.id,
                            classDate: dateStr,
                            status: 'active'
                        } as any]);

                        setTimeout(() => {
                            setBookingSuccess(false);
                            setSelectedClassForBooking(null);
                        }, 2000);
                    } catch (e) {
                        console.error(e);
                        setBookingError('Error al realizar reserva.');
                        setBookingLoading(false);
                    }
                }}
                onCancelReservation={(c) => {
                    const dateStr = new Date(selectedDate.getTime() - (selectedDate.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
                    const booking = userReservations.find(r => r.classId === c.id && r.classDate === dateStr);
                    if (booking) {
                        setSelectedClassForBooking(null);
                        setSelectedClassForCancel({ classData: c, reservationId: booking.id });
                    }
                }}
                isWaitlisted={selectedClassForBooking ? userWaitlists.some(w => w.classId === selectedClassForBooking.id && w.classDate === new Date(selectedDate.getTime() - (selectedDate.getTimezoneOffset() * 60000)).toISOString().split('T')[0] && w.status === 'waiting') : false}
                waitlistLoading={waitlistLoading}
                lockedSpots={lockedSpots}
                isWaitlistInvited={isWaitlistInvited}
                waitlistPosition={waitlistPosition}
                onJoinWaitlist={async (c) => {
                    if (!userData) return;
                    setWaitlistLoading(true);
                    try {
                        const dateStr = new Date(selectedDate.getTime() - (selectedDate.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
                        const wlRef = await addDoc(collection(db, 'waitlist'), {
                            userId: userData.uid,
                            classId: c.id,
                            classDate: dateStr,
                            userName: userData.displayName || 'Unknown',
                            status: 'waiting',
                            createdAt: new Date().toISOString()
                        });
                        if (navigator.vibrate) navigator.vibrate([20]);
                        setUserWaitlists(prev => [...prev, {
                            id: wlRef.id,
                            classId: c.id,
                            classDate: dateStr,
                            status: 'waiting'
                        }]);

                        // Fetch real position
                        const wlDocsSnap = await getDocs(query(collection(db, 'waitlist'), where('classId', '==', c.id), where('classDate', '==', dateStr)));
                        const wlDocs = wlDocsSnap.docs.map(d => ({id: d.id, ...d.data()}) as any);
                        wlDocs.sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());
                        const userIndex = wlDocs.findIndex((w: any) => w.userId === userData.uid);
                        const pos = userIndex !== -1 ? userIndex + 1 : wlDocs.length;

                        // Notify user: you're on the waitlist with position
                        notifyWaitlistJoined(userData.uid, c.title, dateStr, pos);
                    } catch (e) {
                        console.error(e);
                    } finally {
                        setWaitlistLoading(false);
                    }
                }}
                attendees={selectedClassAttendees}
            />

            {selectedClassForCancel && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex flex-col justify-end">
                    <div 
                        className="bg-[#111] rounded-t-3xl p-6 pb-32 w-full animate-slide-up"
                        style={{ animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}
                    >
                        <div className="w-12 h-1 bg-[#333] rounded-full mx-auto mb-6" />
                        
                        {(() => {
                            const classDate = new Date(selectedDate);
                            const [hours, minutes] = selectedClassForCancel.classData.startTime.split(':').map(Number);
                            classDate.setHours(hours, minutes, 0, 0);

                            const now = new Date();
                            const timeDiffHours = (classDate.getTime() - now.getTime()) / (1000 * 60 * 60);
                            const canRefund = timeDiffHours >= 1;

                            return (
                                <>
                                    <h2 className="text-xl font-black uppercase text-white tracking-widest mb-1">
                                        Cancelar Reserva
                                    </h2>
                                    <p className="text-[#E13038] font-bold text-xs uppercase tracking-widest mb-6">
                                        {selectedClassForCancel.classData.title} • {selectedClassForCancel.classData.startTime}
                                    </p>

                                    {cancelSuccess ? (
                                        <div className="bg-green-500/10 border-2 border-green-500 rounded-2xl p-8 flex flex-col items-center justify-center min-h-[200px]">
                                            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(34,197,94,0.3)]">
                                                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                </svg>
                                            </div>
                                            <h3 className="text-white text-xl font-black uppercase tracking-widest">Cancelada</h3>
                                            <p className="text-green-500 font-bold text-xs mt-2 uppercase tracking-widest">
                                                {canRefund ? 'Crédito devuelto con éxito' : 'Reserva cancelada (sin devolución)'}
                                            </p>
                                        </div>
                                    ) : (
                                        <>
                                            <div className={`mb-8 p-5 border rounded-2xl ${canRefund ? 'bg-white/5 border-white/10' : 'bg-[#E13038]/10 border-[#E13038]/30'}`}>
                                                {canRefund ? (
                                                    <p className="text-gray-300 text-xs leading-relaxed">
                                                        Al cancelar con <strong>más de 1 hora de antelación</strong>, tu crédito te será devuelto íntegramente de forma automática y pasará a tu saldo disponible.
                                                    </p>
                                                ) : (
                                                    <p className="text-[#E13038] text-xs leading-relaxed font-bold">
                                                        PELIGRO: Queda menos de 1 hora para el evento. Al cancelar ahora, PERDERÁS este crédito. 
                                                    </p>
                                                )}
                                            </div>

                                            {cancelError && (
                                                <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-xl mb-6 text-xs text-center font-bold">
                                                    {cancelError}
                                                </div>
                                            )}

                                            <button
                                                disabled={cancelLoading}
                                                onClick={async () => {
                                                    setCancelLoading(true);
                                                    setCancelError('');
                                                    try {
                                                        const resId = selectedClassForCancel.reservationId;
                                                        await deleteDoc(doc(db, 'reservations', resId));

                                                        if (canRefund && userData?.uid) {
                                                            const userRef = doc(db, 'users', userData.uid);
                                                            const userSnap = await getDoc(userRef);
                                                            const dbData = userSnap.data();
                                                            if (dbData) {
                                                                await updateDoc(userRef, { credits: (dbData.credits || 0) + 1 });
                                                            }
                                                        }

                                                        const dateStrForCancel = new Date(selectedDate.getTime() - (selectedDate.getTimezoneOffset() * 60000)).toISOString().split('T')[0];

                                                        // ── Notifications on cancel ──
                                                        // 1. Notify user
                                                        if (userData?.uid) {
                                                            notifyBookingCancelled(userData.uid, selectedClassForCancel.classData.title, dateStrForCancel, canRefund);
                                                        }

                                                        // 2. Notify coach of this class
                                                        const cancelCoachId = await getCoachIdForClass(selectedClassForCancel.classData.id);
                                                        if (cancelCoachId) {
                                                            notifyCoachCancellation(cancelCoachId, userData?.displayName || 'Usuario', selectedClassForCancel.classData.title, dateStrForCancel);
                                                        }

                                                        // 3. Notify admin with updated seat count
                                                        const seatsAfterCancel = await getClassAttendeeCount(selectedClassForCancel.classData.id, dateStrForCancel);
                                                        notifyAdminCancellation(
                                                            userData?.displayName || 'Usuario',
                                                            selectedClassForCancel.classData.title,
                                                            dateStrForCancel,
                                                            seatsAfterCancel,
                                                            selectedClassForCancel.classData.capacity
                                                        );

                                                        // 4. Waitlist: invite next person
                                                        const wlSnap = await getDocs(query(
                                                            collection(db, 'waitlist'), 
                                                            where('classId', '==', selectedClassForCancel.classData.id),
                                                            where('classDate', '==', dateStrForCancel),
                                                            where('status', '==', 'waiting')
                                                        ));
                                                        
                                                        if (!wlSnap.empty) {
                                                            const waitlistedUsers = wlSnap.docs.map(d => ({id: d.id, ...(d.data() as any)})).sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
                                                            const nextUser = waitlistedUsers[0];
                                                            
                                                            await updateDoc(doc(db, 'waitlist', nextUser.id), {
                                                                status: 'invited',
                                                                invitedAt: new Date().toISOString(),
                                                                expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString()
                                                            });
                                                            
                                                            // Notify waitlisted user: plaza available
                                                            sendNotification(
                                                                nextUser.userId,
                                                                'waitlist_invited',
                                                                '🎉 ¡Plaza Disponible!',
                                                                `¡Se ha liberado una plaza en ${selectedClassForCancel.classData.title}! Tienes 15 minutos para aceptarla o la perderás.`,
                                                                '/reservar'
                                                            );
                                                        }

                                                        setUserReservations(prev => prev.filter(r => r.id !== resId));
                                                        setCancelSuccess(true);
                                                        setTimeout(() => {
                                                            setSelectedClassForCancel(null);
                                                            setCancelSuccess(false);
                                                        }, 2500);
                                                    } catch (e) {
                                                        console.error(e);
                                                        setCancelError('Error al cancelar reserva.');
                                                        setCancelLoading(false);
                                                    }
                                                }}
                                                className={`w-full py-4 rounded-xl text-sm font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all outline-none disabled:opacity-50 flex items-center justify-center gap-2 ${canRefund ? 'bg-white text-black hover:bg-gray-200' : 'bg-[#E13038] text-white hover:bg-[#ff3b44]'}`}
                                            >
                                                {cancelLoading ? (
                                                    <div className={`animate-spin rounded-full h-5 w-5 border-t-2 ${canRefund ? 'border-black' : 'border-white'}`}></div>
                                                ) : (
                                                    <>CONFIRMAR CANCELACIÓN</>
                                                )}
                                            </button>

                                            {!cancelLoading && (
                                                <button
                                                    onClick={() => {
                                                        setSelectedClassForBooking(selectedClassForCancel.classData);
                                                        setSelectedClassForCancel(null);
                                                    }}
                                                    className="w-full text-center py-4 mt-2 text-gray-400 hover:text-white text-xs font-bold uppercase tracking-widest transition-colors mb-4"
                                                >
                                                    Volver a la clase / No cancelar
                                                </button>
                                            )}
                                        </>
                                    )}
                                </>
                            );
                        })()}
                    </div>
                </div>
            )}

            <UserNavBar />
        </div>
    );
};

export default Booking;
