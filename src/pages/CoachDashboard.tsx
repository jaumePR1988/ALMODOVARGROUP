import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';

import { Calendar, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import CoachNavBar from '../components/CoachNavBar';
import UserTopBar from '../components/UserTopBar';
import ClassDetailModal from '../components/ClassDetailModal';

interface ClassData {
    id: string;
    title: string;
    description: string;
    imageUrl: string;
    coachId: string;
    coachName: string;
    category: string;
    startTime: string;
    capacity: number;
    isRecurring: boolean;
    recurringDays: number[];
    specificDate: string;
}

interface Reservation {
    id: string;
    userId: string;
    classId: string;
    classDate: string;
    userName: string;
    status: string;
}

const CoachDashboard = () => {
    const { userData } = useAuth();

    // UI State
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [weekOffset, setWeekOffset] = useState(0);
    const [classes, setClasses] = useState<ClassData[]>([]);
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [allUsers, setAllUsers] = useState<any[]>([]); // New state for users
    const [loading, setLoading] = useState(true);

    // Modal State
    const [selectedClass, setSelectedClass] = useState<ClassData | null>(null);
    const [uploadingWod, setUploadingWod] = useState(false);

    // Slide variables
    const [days, setDays] = useState<{ date: Date, id: number, label: string, num: string }[]>([]);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Generate week days
        const generateDays = () => {
            const today = new Date();
            const currentDay = today.getDay();
            const diffToMonday = currentDay === 0 ? -6 : 1 - currentDay;
            const monday = new Date(today);
            monday.setDate(today.getDate() + diffToMonday + (weekOffset * 7));

            const dayNames = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];
            const newDays = [];

            for (let i = 0; i < 7; i++) {
                const date = new Date(monday);
                date.setDate(monday.getDate() + i);
                newDays.push({
                    date: date,
                    id: date.getDay(),
                    label: dayNames[date.getDay()],
                    num: date.getDate().toString()
                });
            }
            setDays(newDays);
            
            // Auto-seleccionar Lunes al cambiar de semana
            if (weekOffset !== 0) {
                setSelectedDate(newDays[0].date);
            } else {
                setSelectedDate(new Date());
            }
        };
        generateDays();
    }, [weekOffset]);

    useEffect(() => {
        if (!userData) return;
        const fetchDashboardData = async () => {
            setLoading(true);
            try {
                // Fetch classes (we load all and filter by coachName locally as it's easier, or by query if index exists, but local filter is fine for a small gym)
                // Filter by name because coach.id might not match the auth uid
                const classesSnap = await getDocs(collection(db, 'classes'));
                const classesList = classesSnap.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as ClassData[];
                let myCoachId = userData.uid;

                // Keep only classes for this coach
                const coachClasses = classesList.filter(c => c.coachId === myCoachId || c.coachName === userData.displayName);
                setClasses(coachClasses);

                // Fetch reservations for this coach's classes
                if (coachClasses.length > 0) {
                    const classIds = coachClasses.map(c => c.id);
                    // Firestore 'in' query supports max 10, so let's do local filter for safety
                    const resSnap = await getDocs(collection(db, 'reservations'));
                    const resList = resSnap.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    })) as Reservation[];
                    setReservations(resList.filter(r => classIds.includes(r.classId) && r.status === 'active'));
                }
                // Fetch All Users to pass to ClassDetailModal for manual addition
                const usersSnap = await getDocs(collection(db, 'users'));
                setAllUsers(usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

            } catch (error) {
                console.error("Error loaded coach data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, [userData]);


    // Filter classes for selected date
    const dateStr = new Date(selectedDate.getTime() - (selectedDate.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
    const todaysClasses = classes.filter(c => {
        if (c.isRecurring) {
            return c.recurringDays.includes(selectedDate.getDay());
        }
        return c.specificDate === dateStr;
    });

    const getAttendeesForClass = (classId: string) => {
        return reservations.filter(r => r.classId === classId && r.classDate === dateStr);
    };

    return (
        <div className="bg-[#111111] text-gray-200 min-h-screen pb-safe font-sans selection:bg-[#E13038] selection:text-white relative overflow-x-hidden">
            <UserTopBar />

            {/* Main Content */}
            <main className="pt-28 pb-32 px-6 max-w-[480px] mx-auto min-h-screen">
                
                {/* Saludo Premium y Foto */}
                <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center gap-8">
                        <h2 className="text-4xl font-black leading-none tracking-tighter uppercase text-white shrink-0">
                            HOLA COACH,<br/>
                            <span className="text-[#E13038]">{userData?.displayName?.split(' ')[0] || 'Tú'}</span> <span className="text-3xl ml-1">👋</span>
                        </h2>
                        
                        <div className="w-20 h-20 rounded-full border-[3px] border-[#E13038]/40 overflow-hidden bg-[#111111] flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(225,48,56,0.2)]">
                            {userData?.photoURL ? (
                                <img src={userData.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-3xl font-black text-gray-500">
                                    {userData?.displayName?.charAt(0).toUpperCase() || 'C'}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Week Navigation */}
                <div className="flex justify-between items-center mb-4">
                    <button 
                        onClick={() => setWeekOffset(prev => prev - 1)}
                        disabled={weekOffset <= 0}
                        className={`p-2 rounded-full border transition-all active:scale-95 ${weekOffset <= 0 ? 'bg-transparent border-transparent opacity-0 cursor-default' : 'bg-[#1c1b1b] border-[#333] hover:border-[#E13038]/50 text-gray-400 hover:text-white'}`}
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <span className="text-xs font-black uppercase tracking-widest text-[#E13038]">
                        {weekOffset === 0 ? "Esta Semana" : "Próxima Semana"}
                    </span>
                    <button 
                        onClick={() => setWeekOffset(prev => prev + 1)}
                        disabled={weekOffset >= 1}
                        className={`p-2 rounded-full border transition-all active:scale-95 ${weekOffset >= 1 ? 'bg-transparent border-transparent opacity-0 cursor-default' : 'bg-[#1c1b1b] border-[#333] hover:border-[#E13038]/50 text-gray-400 hover:text-white'}`}
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>

                {/* Date Slider */}
                <div className="mb-6 -mx-6 px-6">
                    <div className="flex gap-2 overflow-x-auto hide-scrollbar snap-x py-2" ref={scrollRef}>
                        {days.map((day, idx) => {
                            const isSelected = selectedDate.getDate() === day.date.getDate() && selectedDate.getMonth() === day.date.getMonth();
                            const isToday = new Date().getDate() === day.date.getDate() && new Date().getMonth() === day.date.getMonth();
                            
                            return (
                                <div 
                                    key={idx}
                                    onClick={() => setSelectedDate(day.date)}
                                    className={`snap-center flex-shrink-0 w-[52px] h-[72px] rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all duration-300 ${isSelected ? 'bg-[#E13038] shadow-[0_4px_15px_rgba(225,48,56,0.4)] scale-110' : 'bg-[#1c1b1b] border border-[#333] hover:border-[#E13038]/50 text-gray-400'} ${isToday && !isSelected ? 'border-[#E13038]' : ''}`}
                                >
                                    <span className={`text-[10px] font-black uppercase tracking-widest mb-1 ${isSelected ? 'text-white' : 'text-gray-500'}`}>{day.label}</span>
                                    <span className={`text-xl font-black ${isSelected ? 'text-white' : 'text-white'}`}>{day.num}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-black uppercase tracking-widest text-white flex items-center gap-2">
                        <Calendar size={20} className="text-[#E13038]" />
                        Tus Clases
                    </h2>
                </div>



                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="w-12 h-12 border-4 border-[#333] border-t-[#E13038] rounded-full animate-spin"></div>
                        <p className="text-gray-500 font-bold tracking-widest text-xs mt-4 uppercase animate-pulse">Cargando...</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {todaysClasses.length === 0 ? (
                            <div className="bg-[#1c1b1b] border border-[#333] border-dashed rounded-3xl p-10 flex flex-col items-center text-center">
                                <div className="w-16 h-16 bg-[#2a2a2a] rounded-full flex items-center justify-center mb-4">
                                    <Calendar className="text-gray-500" size={24} />
                                </div>
                                <h3 className="font-black text-white text-lg uppercase tracking-widest">Sin Clases</h3>
                                <p className="text-xs text-gray-500 font-medium">No tienes clases asignadas para este día.</p>
                            </div>
                        ) : (
                            todaysClasses.map(c => {
                                const classAttendees = getAttendeesForClass(c.id);
                                return (
                                    <div 
                                        key={c.id} 
                                        onClick={() => setSelectedClass(c)}
                                        className="bg-[#1c1b1b] border border-[#333] rounded-2xl overflow-hidden hover:border-[#E13038]/50 cursor-pointer transition-all active:scale-[0.98] group"
                                    >
                                        <div className="h-32 relative">
                                            {c.imageUrl ? (
                                                <img src={c.imageUrl} alt={c.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                            ) : (
                                                <div className="w-full h-full bg-[#2a2a2a] flex items-center justify-center">
                                                    <span className="text-[#E13038] font-black text-xl tracking-widest opacity-20">{c.category}</span>
                                                </div>
                                            )}
                                            <div className="absolute inset-0 bg-gradient-to-t from-[#1c1b1b] via-[#1c1b1b]/50 to-transparent"></div>
                                            <div className="absolute top-3 left-3 bg-[#E13038] text-white text-[10px] px-3 py-1.5 rounded-lg font-black uppercase tracking-widest shadow-lg">
                                                {c.startTime}
                                            </div>
                                            <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end">
                                                <div>
                                                    <p className="text-[10px] text-[#E13038] font-black uppercase tracking-widest mb-1">{c.category}</p>
                                                    <h3 className="font-black text-lg text-white leading-tight">{c.title}</h3>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="p-4 flex items-center justify-between border-t border-[#333] bg-[#1a1a1a]">
                                            <div className="flex items-center gap-2">
                                                <Users size={16} className="text-gray-400" />
                                                <span className="text-sm font-bold text-white">{classAttendees.length} <span className="text-gray-500 text-xs">/ {c.capacity} Ocupadas</span></span>
                                            </div>
                                            <div className="text-[10px] text-[#E13038] font-black uppercase tracking-widest px-3 py-1.5 bg-[#E13038]/10 rounded-lg">
                                                Ver Asistentes
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}
            </main>

            {/* Modal de Detalle de Clase para Coach */}
            <ClassDetailModal
                isOpen={!!selectedClass}
                onClose={() => !uploadingWod && setSelectedClass(null)}
                classData={selectedClass || null}
                selectedDate={selectedDate}
                role="coach"
                attendees={selectedClass ? getAttendeesForClass(selectedClass.id) : []}
                uploadingWod={uploadingWod}
                onToggleAttendance={async (reservationId, status) => {
                    try {
                        const { doc, updateDoc } = await import('firebase/firestore');
                        const resRef = doc(db, 'reservations', reservationId);
                        await updateDoc(resRef, { status });
                        setReservations(prev => prev.map(r => r.id === reservationId ? { ...r, status } : r));
                    } catch (e) {
                        console.error("Error toggling attendance:", e);
                    }
                }}
                availableUsers={allUsers.filter(u => u.modos?.includes(selectedClass?.category))}
                onAddAttendee={async (userId, userName, userPhoto) => {
                    if (!selectedClass) return;
                    try {
                        const { collection, addDoc, doc, updateDoc, getDoc } = await import('firebase/firestore');
                        // 1. Verificar créditos del usuario
                        const userRef = doc(db, 'users', userId);
                        const userSnap = await getDoc(userRef);
                        if (!userSnap.exists()) {
                            alert('El usuario no existe.');
                            return;
                        }
                        const uData = userSnap.data();
                        const credits = uData.credits || uData.limiteSemanal || 0;
                        const extra = uData.saldoExtra || 0;
                        
                        if (credits <= 0 && extra <= 0) {
                            alert('⚠️ El alumno no tiene saldo suficiente (Créditos ni Saldo Extra). Por favor, contacte con el Administrador.');
                            return;
                        }
                        
                        // 2. Descontar crédito
                        let newCredits = credits;
                        let newExtra = extra;
                        if (newCredits > 0) {
                            newCredits -= 1;
                        } else {
                            newExtra -= 1;
                        }
                        await updateDoc(userRef, { credits: newCredits, saldoExtra: newExtra });

                        // 3. Crear reserva
                        const classDateStr = new Date(selectedDate.getTime() - (selectedDate.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
                        const resRef = await addDoc(collection(db, 'reservations'), {
                            classId: selectedClass.id,
                            userId: userId,
                            userName: userName,
                            userPhoto: userPhoto,
                            classDate: classDateStr,
                            status: 'active'
                        });

                        // 4. Update local state
                        setReservations(prev => [...prev, {
                            id: resRef.id,
                            classId: selectedClass.id,
                            userId: userId,
                            userName: userName,
                            classDate: classDateStr,
                            status: 'active'
                        } as any]);
                        
                        alert(`Alumno ${userName} añadido exitosamente.`);
                    } catch (error) {
                        console.error("Error adding attendee:", error);
                        alert("Hubo un error al añadir al alumno.");
                    }
                }}
                onUploadWod={async (file: File) => {
                    if (!selectedClass) return;
                    setUploadingWod(true);
                    try {
                        const fileExt = file.name.split('.').pop() || '';
                        const timeStamp = new Date().getTime();
                        const fileName = `wods/${selectedClass.id}_${timeStamp}.${fileExt}`;
                        
                        const storageRef = ref(storage, fileName);
                        await uploadBytes(storageRef, file);
                        const downloadUrl = await getDownloadURL(storageRef);

                        // Actualizar en Firestore la clase
                        const classRef = doc(db, 'classes', selectedClass.id);
                        await updateDoc(classRef, {
                            wodUrl: downloadUrl,
                            wodName: file.name
                        });

                        // Actualizar estado local
                        const updatedClass = { ...selectedClass, wodUrl: downloadUrl, wodName: file.name };
                        setSelectedClass(updatedClass);
                        setClasses(prev => prev.map(c => c.id === selectedClass.id ? updatedClass : c));

                    } catch (error) {
                        console.error("Error upload WOD:", error);
                        alert("Hubo un error al subir el archivo.");
                    } finally {
                        setUploadingWod(false);
                    }
                }}
            />

            <CoachNavBar />
        </div>
    );
};

export default CoachDashboard;
