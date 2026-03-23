import { useState, useEffect } from 'react';
import { Info, Navigation, Calendar } from 'lucide-react';
import { collection, getDocs, doc, getDoc, updateDoc, query, where, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import UserNavBar from '../components/UserNavBar';
import UserTopBar from '../components/UserTopBar';

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

const UserDashboard = () => {
    const { userData } = useAuth();
    const [classes, setClasses] = useState<ClassData[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Configuración The Saturday Drop
    
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [unlockConfig, setUnlockConfig] = useState({ dayName: 'Sábado', time: '10:00' });
    
    // Booking State
    const [userReservations, setUserReservations] = useState<any[]>([]);
    
    // Cancellation State
    const [selectedClassForCancel, setSelectedClassForCancel] = useState<{classData: ClassData, reservationId: string} | null>(null);
    const [cancelLoading, setCancelLoading] = useState(false);
    const [cancelSuccess, setCancelSuccess] = useState(false);
    const [cancelError, setCancelError] = useState('');
    
    // Obtener las reglas del "Saturday Drop" y las clases
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
                // This logic is no longer needed for the dashboard display,
                // but kept for context if it were to be used elsewhere.
                const now = new Date();
                const currentJSday = now.getDay(); // 0=Domingo, 1=Lunes, 6=Sábado
                const [unlockHour, unlockMinute] = currentUnlockTime.split(':').map(Number);
                
                const dropDate = new Date(now);
                // Si hoy es Martes (2) y el unlock es Sábado (6), faltan 4 días.
                // En JS, ajustamos si el current day es domingo (0)
                const currentDayFixed = currentJSday === 0 ? 7 : currentJSday;
                const unlockDayFixed = currentUnlockDay === 0 ? 7 : currentUnlockDay;
                
                const diffDays = unlockDayFixed - currentDayFixed;
                dropDate.setDate(now.getDate() + diffDays);
                dropDate.setHours(unlockHour, unlockMinute, 0, 0);

                // Si `now` >= `dropDate`, entonces ya ocurrió la caída semanal
                // PERO, la caída sólo importa si se refiere a la ESTA semana.
                // Si diffDays es positivo, significa que el Unlock de la semana actual AÚN no ha pasado (Ej: hoy es Jueves, el unlock es el Sábado).
                // Si diffDays es negativo o 0 (ya pasó Sábado y estamos a Domingo, o es el propio Sábado después de la hora), ya se desbloqueó la siguiente.
                
                

                // 3. Obtener Clases (todas las activas, en un entorno real filtraríamos por rango)
                const classesSnap = await getDocs(collection(db, 'classes'));
                const classList = classesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ClassData[];
                setClasses(classList);
                
                // 4. Obtener Reservas del Usuario
                if (userData?.uid) {
                    const resSnap = await getDocs(query(collection(db, 'reservations'), where('userId', '==', userData.uid), where('status', '==', 'active')));
                    setUserReservations(resSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
                }

            } catch (error) {
                console.error("Error cargando dashboard:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [userData?.uid]);





    // Calcular Tu Próxima Clase y el resto
    const getFutureReservations = () => {
        if (!userReservations.length || !classes.length) return [];
        
        const now = new Date();
        const upcoming = userReservations.map(r => {
            const classInfo = classes.find(c => c.id === r.classId);
            if (!classInfo) return null;
            
            const [hours, minutes] = classInfo.startTime.split(':').map(Number);
            const [y, m, d] = r.classDate.split('-').map(Number);
            const exactDate = new Date(y, m - 1, d, hours, minutes);
            
            return { ...r, classInfo, exactDate };
        }).filter(c => c && c.exactDate >= now).sort((a, b) => a.exactDate.getTime() - b.exactDate.getTime());

        return upcoming;
    };

    const futureReservations = getFutureReservations();
    const nextClassData = futureReservations.length > 0 ? futureReservations[0] : null;
    const restOfReservations = futureReservations.slice(1);

    return (
        <div className="bg-[#111111] text-gray-200 min-h-screen pb-safe font-sans selection:bg-[#E13038] selection:text-white">
            
            {/* Nav Header */}
            <UserTopBar />

            <main className="pt-28 pb-32 px-6 max-w-[480px] mx-auto min-h-screen">
                
                {/* Saludo Premium y Foto */}
                <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center gap-8">
                        <h2 className="text-4xl font-black leading-none tracking-tighter uppercase text-white shrink-0">
                            HOLA,<br/>
                            <span className="text-[#E13038]">{userData?.displayName?.split(' ')[0] || 'Socio'}</span> <span className="text-3xl ml-1">👋</span>
                        </h2>
                        
                        <div className="w-20 h-20 rounded-full border-[3px] border-[#E13038]/40 overflow-hidden bg-[#111111] flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(225,48,56,0.2)]">
                            {userData?.photoURL ? (
                                <img src={userData.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-3xl font-black text-gray-500">
                                    {userData?.displayName?.charAt(0).toUpperCase() || 'S'}
                                </span>
                            )}
                        </div>
                    </div>
                    
                    <div className="mt-6 bg-[#1A1A1A] border border-[#333] rounded-2xl p-4 flex flex-col gap-2">
                        <div className="flex justify-between items-center">
                            <div className="flex flex-col">
                                <span className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Créditos Semanales</span>
                                <span className="text-white font-black text-xl">{userData?.credits || 0} <span className="text-gray-500 text-sm font-bold">/ {userData?.limiteSemanal || 0}</span></span>
                            </div>
                            <div className="text-right flex flex-col">
                                <span className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Créditos Extra</span>
                                <span className="text-[#E13038] font-black text-xl">+{userData?.saldoExtra || 0}</span>
                            </div>
                        </div>
                        <div className="w-full bg-[#111] h-2 rounded-full overflow-hidden mt-1">
                            <div className="bg-[#E13038] h-full" style={{ width: `${Math.min(((userData?.credits || 0) / (userData?.limiteSemanal || 1)) * 100, 100)}%` }} />
                        </div>
                        <div className="flex justify-between items-center mt-1">
                            <span className="text-gray-500 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1"><Info size={10} /> Total: {(userData?.credits || 0) + (userData?.saldoExtra || 0)} CR</span>
                            <span className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">
                                ↺ Reset: {unlockConfig.dayName} {unlockConfig.time}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Tu Próxima Clase */}
                {nextClassData && (
                    <div className="mb-8 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-[#E13038] mb-4 flex items-center gap-2">
                            <Navigation size={14} className="animate-pulse" /> 
                            Tu Próxima Clase
                        </h3>
                        <div 
                            onClick={() => {
                                const classDateForCancel = new Date(nextClassData.exactDate);
                                setSelectedDate(classDateForCancel);
                                setSelectedClassForCancel({ classData: nextClassData.classInfo, reservationId: nextClassData.id });
                            }}
                            className="bg-gradient-to-br from-[#1c1b1b] to-[#111] border border-[#E13038]/30 rounded-2xl p-5 relative overflow-hidden group cursor-pointer hover:border-[#E13038] transition-all"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-[#E13038]/5 rounded-full blur-2xl group-hover:bg-[#E13038]/10 transition-colors" />
                            <div className="relative z-10">
                                <span className="text-white font-black text-2xl uppercase tracking-tight block mb-1">
                                    {nextClassData.classInfo.title}
                                </span>
                                <div className="flex items-center justify-between mt-4">
                                    <div className="flex flex-col">
                                        <span className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">Mañana a las</span>
                                        <span className="text-[#E13038] text-xl font-black">{nextClassData.classInfo.startTime}</span>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">Coach</span>
                                        <span className="text-white text-sm font-bold">{nextClassData.classInfo.coachName}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Mis Próximas Clases */}
                {restOfReservations.length > 0 ? (
                    <div className="space-y-4">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-[#E13038] mb-4 flex items-center gap-2">
                            <Calendar size={14} /> 
                            El resto de tu semana
                        </h3>
                        {restOfReservations.map((res: any) => (
                            <div 
                                key={res.id}
                                onClick={() => {
                                    const classDateForCancel = new Date(res.exactDate);
                                    setSelectedDate(classDateForCancel);
                                    setSelectedClassForCancel({ classData: res.classInfo, reservationId: res.id });
                                }}
                                className="bg-[#1A1A1A] border border-[#333] rounded-2xl p-4 flex items-center justify-between cursor-pointer hover:border-[#E13038]/50 transition-colors"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="flex flex-col items-center justify-center w-12 h-12 bg-[#111] border border-[#333] rounded-xl text-white">
                                        <span className="text-[10px] font-bold uppercase text-gray-400">{new Date(res.exactDate).toLocaleDateString('es-ES', { weekday: 'short' })}</span>
                                        <span className="text-lg font-black leading-none">{new Date(res.exactDate).getDate()}</span>
                                    </div>
                                    <div>
                                        <h4 className="text-white font-black uppercase text-sm tracking-tight">{res.classInfo.title}</h4>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[#E13038] font-bold text-xs">{res.classInfo.startTime}</span>
                                            <span className="text-gray-500 text-[10px] uppercase tracking-widest font-bold">Coach: {res.classInfo.coachName}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-2 bg-white/5 rounded-full text-gray-400">
                                    <Info size={16} />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : futureReservations.length === 0 && !loading && (
                    <div className="bg-[#1c1b1b] border border-[#333] rounded-2xl p-8 text-center flex flex-col items-center justify-center opacity-70 mt-8">
                        <Info size={32} className="text-gray-600 mb-3" />
                        <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Aún no tienes clases reservadas</p>
                    </div>
                )}
            </main>

            {/* Modal de Cancelación */}
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

                                                        // Refresh UI
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
                                                        setSelectedClassForCancel(null);
                                                    }}
                                                    className="w-full text-center py-4 mt-2 text-gray-400 hover:text-white text-xs font-bold uppercase tracking-widest transition-colors mb-4"
                                                >
                                                    Volver a mis clases / No cancelar
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

export default UserDashboard;
