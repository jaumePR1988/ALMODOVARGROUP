import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, Search, CheckCircle2, Circle, AlertCircle, Plus, Users, FileUp, FileText } from 'lucide-react';
import { collection, getDocs, doc, updateDoc, addDoc, getDoc, query, where, increment } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import CoachNavBar from '../components/CoachNavBar';
import PremiumAlert from '../components/PremiumAlert';
import { useNavigate } from 'react-router-dom';

interface ClassData {
    id: string;
    title: string;
    startTime: string;
    endTime: string;
    coachId?: string;
    coachName: string;
    isRecurring: boolean;
    recurringDays: number[];
    specificDate: string;
    capacity: number;
    wodUrl?: string;
}

interface Attendee {
    reservationId?: string; // Optional if manually added and not yet saved
    userId: string;
    userName: string;
    userEmail: string;
    credits: number;
    attended: boolean;
    isManual?: boolean;
}

interface UserData {
    id: string;
    displayName: string;
    email: string;
    credits: number;
}

const CoachAttendance = () => {
    const { userData } = useAuth();
    const navigate = useNavigate();
    
    const [todaysClasses, setTodaysClasses] = useState<ClassData[]>([]);
    const [selectedClass, setSelectedClass] = useState<ClassData | null>(null);
    const [attendees, setAttendees] = useState<Attendee[]>([]);
    const [allUsers, setAllUsers] = useState<UserData[]>([]);
    
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null); // userId of who is being processed
    const [uploadingWod, setUploadingWod] = useState(false);

    // Popup state
    const [alertConfig, setAlertConfig] = useState<{ isOpen: boolean; title: string; message: string; type: 'success' | 'error' }>({ isOpen: false, title: '', message: '', type: 'success' });

    const showAlert = (title: string, message: string, type: 'success' | 'error' = 'success') => {
        setAlertConfig({ isOpen: true, title, message, type });
    };

    // Helpers for Today's date
    const today = new Date();
    const todayStr = new Date(today.getTime() - (today.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
    const todayDayOfWeek = today.getDay();

    if (!userData) return null;

    useEffect(() => {
        if (!userData) return;
        fetchInitialData();
    }, [userData]);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            // Fetch classes for this coach
            const classesSnap = await getDocs(collection(db, 'classes'));
            const classesList = classesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ClassData[];
            
            let myCoachId = userData.uid;

            const coachClasses = classesList.filter(c => c.coachId === myCoachId || c.coachName === userData.displayName);
            const todayFilter = coachClasses.filter(c => {
                if (c.isRecurring) {
                    return c.recurringDays.includes(todayDayOfWeek);
                }
                return c.specificDate === todayStr;
            });
            // Sort by start time
            todayFilter.sort((a, b) => a.startTime.localeCompare(b.startTime));
            setTodaysClasses(todayFilter);

            // Fetch all users for manual adding
            const usersQ = query(collection(db, 'users'), where('role', '==', 'user'));
            const usersSnap = await getDocs(usersQ);
            const usersList = usersSnap.docs.map(u => ({ id: u.id, ...u.data() })) as UserData[];
            setAllUsers(usersList.sort((a,b) => a.displayName.localeCompare(b.displayName)));

        } catch (error) {
            console.error("Error fetching initial data for attendance:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectClass = async (cls: ClassData) => {
        setSelectedClass(cls);
        setLoading(true);
        try {
            // Fetch reservations
            const resQ = query(
                collection(db, 'reservations'), 
                where('classId', '==', cls.id),
                where('classDate', '==', todayStr),
                where('status', '==', 'active')
            );
            const resSnap = await getDocs(resQ);
            
            // Map to Attendees with user data
            const attendeesList: Attendee[] = [];
            for (const rDoc of resSnap.docs) {
                const rData = rDoc.data();
                // Get user explicitly to see fresh credits
                const userDoc = await getDoc(doc(db, 'users', rData.userId));
                const uData = userDoc.data();
                
                if (uData) {
                    attendeesList.push({
                        reservationId: rDoc.id,
                        userId: rData.userId,
                        userName: rData.userName,
                        userEmail: rData.userEmail,
                        credits: uData.credits || 0,
                        attended: rData.attended === true,
                    });
                }
            }
            
            // Sort: not attended first, then alphabetically
            attendeesList.sort((a, b) => {
                if (a.attended === b.attended) return a.userName.localeCompare(b.userName);
                return a.attended ? 1 : -1;
            });

            setAttendees(attendeesList);
            setSearchQuery('');
        } catch (error) {
            console.error("Error fetching class attendees:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAttendance = async (attendee: Attendee) => {
        if (attendee.attended || actionLoading) return; // Already attended or processing
        setActionLoading(attendee.userId);

        try {
            let resIdToUpdate = attendee.reservationId;

            // Scenario A: Manual user without a reservation yet
            if (!resIdToUpdate) {
                const newRes = {
                    classId: selectedClass!.id,
                    className: selectedClass!.title,
                    classDate: todayStr,
                    classTime: `${selectedClass!.startTime} - ${selectedClass!.endTime}`,
                    userId: attendee.userId,
                    userName: attendee.userName,
                    userEmail: attendee.userEmail,
                    status: 'active',
                    createdAt: new Date().toISOString(),
                    attended: true // Start as attended
                };
                const resRef = await addDoc(collection(db, 'reservations'), newRes);
                resIdToUpdate = resRef.id;
            } else {
                // Update existing reservation
                await updateDoc(doc(db, 'reservations', resIdToUpdate), { attended: true });
            }

            // Decrement credit logically (Opción A from plan)
            await updateDoc(doc(db, 'users', attendee.userId), {
                credits: increment(-1)
            });

            // Update local state
            setAttendees(prev => prev.map(a => 
                a.userId === attendee.userId 
                ? { ...a, attended: true, reservationId: resIdToUpdate, credits: a.credits - 1 } 
                : a
            ).sort((a, b) => {
                const aDone = a.userId === attendee.userId ? true : a.attended;
                const bDone = b.userId === attendee.userId ? true : b.attended;
                if (aDone === bDone) return a.userName.localeCompare(b.userName);
                return aDone ? 1 : -1;
            }));

        } catch (error) {
            console.error("Error marking attendance:", error);
            showAlert("Error", "Hubo un error al marcar asistencia.", "error");
        } finally {
            setActionLoading(null);
        }
    };

    const handleAddManualUser = (user: UserData) => {
        if (attendees.some(a => a.userId === user.id)) {
            showAlert("Atención", "Este socio ya está en la lista.", "error");
            return;
        }

        const newAttendee: Attendee = {
            userId: user.id,
            userName: user.displayName || 'Sin nombre',
            userEmail: user.email,
            credits: user.credits || 0,
            attended: false,
            isManual: true
        };

        setAttendees(prev => [newAttendee, ...prev]);
        setSearchQuery(''); // Close/reset search
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !selectedClass) return;

        setUploadingWod(true);
        try {
            const fileRef = ref(storage, `wods/${selectedClass.id}_${Date.now()}_${file.name}`);
            await uploadBytes(fileRef, file);
            const url = await getDownloadURL(fileRef);

            // Update class in firestore
            await updateDoc(doc(db, 'classes', selectedClass.id), {
                wodUrl: url
            });

            // Update local state
            setSelectedClass({ ...selectedClass, wodUrl: url });
            setTodaysClasses(prev => prev.map(c => c.id === selectedClass.id ? { ...c, wodUrl: url } : c));
            
            showAlert('Éxito', 'Entrenamiento (WOD) subido correctamente.', 'success');
        } catch (error) {
            console.error("Error uploading WOD:", error);
            showAlert('Error', 'Hubo un error al subir el WOD.', 'error');
        } finally {
            setUploadingWod(false);
            e.target.value = '';
        }
    };

    const filteredSearchUsers = allUsers.filter(u => 
        u.displayName.toLowerCase().includes(searchQuery.toLowerCase()) || 
        u.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="bg-[#111111] text-gray-200 min-h-screen pb-safe font-sans selection:bg-[#E13038] selection:text-white overflow-x-hidden">
            <header className="fixed top-0 left-1/2 -translate-x-1/2 w-full z-40 bg-[#1A1A1A] border-b border-[#333] pt-safe shadow-md max-w-[480px]">
                <div className="flex justify-between items-center px-6 py-4">
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => selectedClass ? setSelectedClass(null) : navigate('/coach')}
                            className="p-2 bg-[#2a2a2a] text-white rounded-xl hover:bg-[#333] transition-colors active:scale-95"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h1 className="text-xl font-black uppercase tracking-widest text-[#E13038]">
                                {selectedClass ? 'Pasar Lista' : 'Asistencia'}
                            </h1>
                            {selectedClass && (
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-none">
                                    {selectedClass.title} • {selectedClass.startTime}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            <main className="pt-28 pb-32 px-6 max-w-[480px] mx-auto min-h-screen">
                {loading ? (
                    <div className="flex justify-center items-center h-40">
                        <div className="w-8 h-8 rounded-full border-4 border-[#333] border-t-[#E13038] animate-spin"></div>
                    </div>
                ) : !selectedClass ? (
                    /* Vista 1: Selector de Clase de Hoy */
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <h2 className="text-sm font-bold uppercase tracking-widest text-[#E13038] mb-4 flex items-center gap-2">
                            <CalendarDayIcon />
                            Clases de Hoy
                        </h2>

                        {todaysClasses.length === 0 ? (
                            <div className="bg-[#1c1b1b] p-8 rounded-3xl border border-[#333] text-center">
                                <Users size={48} className="mx-auto text-gray-600 mb-4" />
                                <h3 className="text-lg font-black text-white uppercase tracking-widest">Día Libre</h3>
                                <p className="text-sm text-gray-500 mt-2">No tienes clases asignadas para el día de hoy.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {todaysClasses.map(cls => (
                                    <button
                                        key={cls.id}
                                        onClick={() => handleSelectClass(cls)}
                                        className="w-full text-left bg-[#1c1b1b] border border-[#333] hover:border-[#E13038]/50 p-5 rounded-3xl transition-all active:scale-95 group shadow-[0_4px_15px_rgba(0,0,0,0.5)]"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="text-xl font-black text-white group-hover:text-[#E13038] transition-colors">{cls.title}</h3>
                                            <div className="bg-[#2a2a2a] px-3 py-1 rounded-lg text-xs font-bold font-mono tracking-tight text-white border border-[#333]">
                                                {cls.startTime} - {cls.endTime}
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between mt-4">
                                            <span className="text-xs font-bold text-gray-500 tracking-widest uppercase">
                                                Toque para pasar lista
                                            </span>
                                            <div className="w-8 h-8 rounded-full bg-[#E13038]/10 text-[#E13038] flex items-center justify-center">
                                                <Users size={16} />
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    /* Vista 2: Asistencia de la Clase */
                    <div className="animate-in slide-in-from-right-8 duration-300">
                        
                        {/* WOD Upload Section */}
                        <div className="bg-[#1c1b1b] p-4 rounded-2xl border border-[#333] mb-4 shadow-md flex justify-between items-center relative z-20">
                            <div>
                                <h3 className="text-white font-bold text-sm">Entrenamiento (WOD)</h3>
                                <p className="text-gray-500 text-[10px] mt-0.5">Sube la pizarra o PDF de hoy</p>
                            </div>
                            <div className="flex gap-2">
                                {selectedClass.wodUrl && (
                                    <a 
                                        href={selectedClass.wodUrl} 
                                        target="_blank" 
                                        rel="noreferrer"
                                        className="bg-[#2a2a2a] text-[#E13038] px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-widest border border-[#333] hover:border-[#E13038] transition-colors flex items-center gap-2"
                                    >
                                        <FileText size={16} />
                                        Ver
                                    </a>
                                )}
                                <label className="relative cursor-pointer bg-gradient-to-br from-[#E13038] to-[#92001c] text-white px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-transform active:scale-95 flex items-center gap-2 shadow-[0_4px_15px_rgba(225,48,56,0.3)] hover:shadow-[0_6px_20px_rgba(225,48,56,0.5)]">
                                    {uploadingWod ? (
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    ) : (
                                        <>
                                            <FileUp size={16} />
                                            {selectedClass.wodUrl ? 'Reemplazar' : 'Subir'}
                                        </>
                                    )}
                                    <input 
                                        type="file" 
                                        className="hidden" 
                                        accept="image/*,.pdf" 
                                        onChange={handleFileUpload}
                                        disabled={uploadingWod}
                                    />
                                </label>
                            </div>
                        </div>

                        {/* Summary / Search Bar */}
                        <div className="bg-[#1c1b1b] p-4 rounded-2xl border border-[#333] mb-6 shadow-md relative z-20">
                            <div className="flex items-center gap-3 bg-[#2a2a2a] px-4 py-3 rounded-xl border border-[#444] focus-within:border-[#E13038] focus-within:ring-1 focus-within:ring-[#E13038] transition-all">
                                <Search size={20} className="text-gray-400" />
                                <input 
                                    type="text"
                                    placeholder="Buscar y añadir socio..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="bg-transparent border-none outline-none w-full text-sm font-medium text-white placeholder:text-gray-500"
                                />
                            </div>

                            {/* Dropdown de Búsqueda */}
                            {searchQuery.trim().length > 1 && (
                                <div className="absolute top-[100%] left-0 w-full mt-2 bg-[#1c1b1b] border border-[#333] rounded-2xl shadow-2xl max-h-60 overflow-y-auto overflow-x-hidden p-2 z-50">
                                    {filteredSearchUsers.length === 0 ? (
                                        <div className="text-center p-4 text-sm text-gray-400">No hay resultados.</div>
                                    ) : (
                                        filteredSearchUsers.map(u => (
                                            <button 
                                                key={u.id}
                                                onClick={() => handleAddManualUser(u)}
                                                className="w-full flex justify-between items-center p-3 hover:bg-[#2a2a2a] rounded-xl transition-colors text-left"
                                            >
                                                <div>
                                                    <div className="text-sm font-bold text-white">{u.displayName}</div>
                                                    <div className="text-xs text-gray-500">{u.email}</div>
                                                </div>
                                                <div className="bg-[#E13038]/10 text-[#E13038] p-2 rounded-lg">
                                                    <Plus size={16} />
                                                </div>
                                            </button>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Roster List */}
                        <div className="space-y-3 relative z-10">
                            {attendees.length === 0 ? (
                                <div className="text-center p-8 bg-[#1c1b1b] border border-[#333] rounded-3xl">
                                    <p className="text-gray-500 font-medium">Aún no hay reservas para esta clase.</p>
                                </div>
                            ) : (
                                attendees.map(attendee => (
                                    <div 
                                        key={attendee.userId} 
                                        className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                                            attendee.attended 
                                            ? 'bg-[#1c1b1b]/50 border-green-500/20 opacity-70' 
                                            : attendee.isManual
                                                ? 'bg-[#2a2a2a] border-[#E13038]'
                                                : 'bg-[#1c1b1b] border-[#333] shadow-md'
                                        }`}
                                    >
                                        <div className="flex-1 min-w-0 pr-4">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="font-black text-white truncate">{attendee.userName}</h4>
                                                {attendee.isManual && !attendee.attended && (
                                                    <span className="text-[9px] font-black tracking-widest uppercase bg-[#E13038] text-white px-2 py-0.5 rounded-full">
                                                        Nuevo
                                                    </span>
                                                )}
                                            </div>
                                            
                                            <div className="flex items-center gap-2">
                                                {attendee.credits <= 0 ? (
                                                    <div className="flex items-center gap-1 text-xs font-bold text-[#E13038] bg-[#E13038]/10 px-2 py-0.5 rounded-md">
                                                        <AlertCircle size={12} />
                                                        Sin créditos ({attendee.credits})
                                                    </div>
                                                ) : (
                                                    <div className="text-xs font-bold text-gray-500 tracking-widest uppercase">
                                                        Créditos: {attendee.credits}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => handleMarkAttendance(attendee)}
                                            disabled={attendee.attended || actionLoading === attendee.userId}
                                            className={`p-3 rounded-xl transition-all active:scale-90 shadow-sm shrink-0 border 
                                                ${actionLoading === attendee.userId ? 'bg-transparent border-[#333]' : 
                                                attendee.attended 
                                                    ? 'bg-green-500 border-green-500 text-white shadow-[0_0_15px_rgba(34,197,94,0.3)]' 
                                                    : 'bg-[#2a2a2a] border-[#444] text-gray-400 hover:text-white hover:border-gray-300'
                                            }`}
                                        >
                                            {actionLoading === attendee.userId ? (
                                                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            ) : attendee.attended ? (
                                                <CheckCircle2 size={24} />
                                            ) : (
                                                <Circle size={24} />
                                            )}
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>

                    </div>
                )}
            </main>

            <CoachNavBar />

            <PremiumAlert
                isOpen={alertConfig.isOpen}
                onClose={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))}
                title={alertConfig.title}
                message={alertConfig.message}
                type={alertConfig.type}
            />
        </div>
    );
};

// Pequeño helper de icono local si lo necesitamos
function CalendarDayIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
    );
}

export default CoachAttendance;
