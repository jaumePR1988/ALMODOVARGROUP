import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    ChevronLeft,
    Camera,
    Calendar,
    Clock,
    Users,
    Plus,
    Minus,
    Bell,
    Check,
    Loader2,
    Dumbbell,
    Trash2
} from 'lucide-react';
import TopHeader from './TopHeader';
import { db, storage, auth } from '../firebase';
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import ExerciseFormModal from './ExerciseFormModal';

const CreateClass = ({ onLogout }: { onLogout: () => void }) => {
    const navigate = useNavigate();
    const { classId } = useParams();
    const isEditMode = !!classId;

    // Check Role
    const [userRole, setUserRole] = useState<string>('');
    useEffect(() => {
        if (auth.currentUser) {
            getDoc(doc(db, 'users', auth.currentUser.uid)).then(snap => {
                if (snap.exists()) setUserRole(snap.data().role);
            });
        }
    }, []);
    const isCoach = userRole === 'coach';

    const [isDarkMode, setIsDarkMode] = useState(document.documentElement.classList.contains('dark'));
    const [notifyUsers, setNotifyUsers] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Inputs
    const [name, setName] = useState('Nueva Clase de Entrenamiento');
    const [group, setGroup] = useState<string>('');
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [startTime, setStartTime] = useState('09:00');
    const [endTime, setEndTime] = useState('10:00');
    const [selectedDays, setSelectedDays] = useState<string[]>([]);
    const [repeatAllYear, setRepeatAllYear] = useState(false);
    const [coachId, setCoachId] = useState('');
    const [capacity, setCapacity] = useState(15);
    const [description, setDescription] = useState('');
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [wod, setWod] = useState<any[]>([]); // { exerciseId, exerciseName, sets, reps, notes }
    const [isExerciseModalOpen, setIsExerciseModalOpen] = useState(false);

    // Dynamic Data
    const [coaches, setCoaches] = useState<any[]>([]);
    const [availableGroups, setAvailableGroups] = useState<any[]>([]);
    const [libraryExercises, setLibraryExercises] = useState<any[]>([]);

    // Sync theme
    useEffect(() => {
        const observer = new MutationObserver(() => {
            setIsDarkMode(document.documentElement.classList.contains('dark'));
        });
        observer.observe(document.documentElement, { attributes: true });
        return () => observer.disconnect();
    }, []);

    // Fetch Coaches
    useEffect(() => {
        const q = query(collection(db, 'coaches'), orderBy('name', 'asc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const coachesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setCoaches(coachesData);

            if (coachesData.length > 0 && !coachId && !isEditMode) {
                setCoachId(coachesData[0].id);
            }
        });
        return () => unsubscribe();
    }, [coachId, isEditMode]);

    // Fetch Exercises Library
    useEffect(() => {
        const q = query(collection(db, 'exercises'), orderBy('name', 'asc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setLibraryExercises(data);
        });
        return () => unsubscribe();
    }, []);

    // Fetch Groups
    useEffect(() => {
        const q = query(collection(db, 'groups'), orderBy('name', 'asc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const groupsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setAvailableGroups(groupsData);

            if (groupsData.length > 0 && !group && !isEditMode) {
                setGroup(groupsData[0].name);
            }
        });
        return () => unsubscribe();
    }, [group, isEditMode]);

    // Fetch existing class data if editing
    useEffect(() => {
        if (isEditMode && classId) {
            const fetchClass = async () => {
                setIsLoading(true);
                try {
                    const docRef = doc(db, 'classes', classId);
                    const docSnap = await getDoc(docRef);
                    if (docSnap.exists()) {
                        const data = docSnap.data() as any;
                        setName(data.name || '');
                        setGroup(data.group);
                        setStartDate(data.date);
                        setStartTime(data.startTime);
                        setEndTime(data.endTime);
                        setCoachId(data.coachId);
                        setCapacity(data.maxCapacity);
                        setDescription(data.description || '');
                        setImagePreview(data.imageUrl);
                        setWod(data.wod || []);
                    } else {
                        alert("No se encontró la clase.");
                        navigate('/manage-classes');
                    }
                } catch (error) {
                    console.error("Error fetching class:", error);
                    alert("Error al cargar la clase.");
                } finally {
                    setIsLoading(false);
                }
            };
            fetchClass();
        }
    }, [isEditMode, classId, navigate]);

    const days = [
        { key: 'L', label: 'LUN', dayNum: 1 },
        { key: 'M', label: 'MAR', dayNum: 2 },
        { key: 'X', label: 'MIE', dayNum: 3 },
        { key: 'J', label: 'JUE', dayNum: 4 },
        { key: 'V', label: 'VIE', dayNum: 5 },
        { key: 'S', label: 'SAB', dayNum: 6 },
        { key: 'D', label: 'DOM', dayNum: 0 }
    ];

    const toggleDay = (day: string) => {
        if (selectedDays.includes(day)) {
            setSelectedDays(selectedDays.filter(d => d !== day));
        } else {
            setSelectedDays([...selectedDays, day]);
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const addWodItem = (exercise: any) => {
        setWod([...wod, {
            exerciseId: exercise.id,
            exerciseName: exercise.name,
            sets: '3',
            reps: '10',
            notes: ''
        }]);
    };

    const removeWodItem = (index: number) => {
        setWod(wod.filter((_, i) => i !== index));
    };

    const updateWodItem = (index: number, field: string, value: string) => {
        const newWod = [...wod];
        newWod[index][field] = value;
        setWod(newWod);
    };

    const resizeImage = (base64Str: string): Promise<string> => {
        return new Promise((resolve) => {
            const img = new Image();
            img.src = base64Str;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 800;
                const MAX_HEIGHT = 600;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height;
                        height = MAX_HEIGHT;
                    }
                }
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', 0.7));
            };
        });
    };

    const handleSave = async () => {
        if (!name) {
            alert("Por favor, introduce un nombre para la clase.");
            return;
        }

        if (!isEditMode && selectedDays.length === 0 && !repeatAllYear) {
            alert("Por favor, selecciona al menos un día.");
            return;
        }

        if (!coachId && coaches.length > 0) {
            alert("Por favor, selecciona un coach.");
            return;
        }

        setIsLoading(true);
        try {
            let finalImageUrl = "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80";
            if (imagePreview) {
                if (imagePreview.startsWith('http')) {
                    finalImageUrl = imagePreview;
                } else {
                    // Upload to Firebase Storage
                    const resizedBase64 = await resizeImage(imagePreview);
                    const storageRef = ref(storage, `classes/${Date.now()}_${name.replace(/\s+/g, '_')}.jpg`);
                    await uploadString(storageRef, resizedBase64, 'data_url');
                    finalImageUrl = await getDownloadURL(storageRef);
                }
            }

            if (isEditMode && classId) {
                await updateDoc(doc(db, 'classes', classId), {
                    name,
                    group,
                    date: startDate,
                    startTime,
                    endTime,
                    coachId,
                    maxCapacity: capacity,
                    description,
                    imageUrl: finalImageUrl,
                    wod
                });
                alert('¡Clase actualizada correctamente!');
            } else {
                const startDateObj = new Date(startDate);
                const endOfYear = new Date(startDateObj.getFullYear(), 11, 31);
                const dayNumMap = days.reduce((acc, d) => ({ ...acc, [d.key]: d.dayNum }), {} as Record<string, number>);
                const targetDayNums = selectedDays.map(d => dayNumMap[d]);
                const classesToCreate = [];

                if (repeatAllYear) {
                    let current = new Date(startDateObj);
                    while (current <= endOfYear) {
                        if (targetDayNums.includes(current.getDay())) {
                            classesToCreate.push({
                                name,
                                group,
                                date: current.toISOString().split('T')[0],
                                startTime,
                                endTime,
                                coachId,
                                maxCapacity: capacity,
                                currentCapacity: 0,
                                description,
                                imageUrl: finalImageUrl,
                                wod,
                                status: 'Disponible',
                                createdAt: serverTimestamp()
                            });
                        }
                        current.setDate(current.getDate() + 1);
                    }
                } else {
                    classesToCreate.push({
                        name,
                        group,
                        date: startDate,
                        startTime,
                        endTime,
                        coachId,
                        maxCapacity: capacity,
                        currentCapacity: 0,
                        description,
                        imageUrl: finalImageUrl,
                        wod,
                        status: 'Disponible',
                        createdAt: serverTimestamp()
                    });
                }

                const batchSize = 50;
                for (let i = 0; i < classesToCreate.length; i += batchSize) {
                    const chunk = classesToCreate.slice(i, i + batchSize);
                    await Promise.all(chunk.map(classData =>
                        addDoc(collection(db, 'classes'), classData)
                    ));
                }
                alert(`¡Éxito! Se han creado ${classesToCreate.length} clases.`);
            }

            navigate('/manage-classes');
        } catch (error) {
            console.error("Error saving document: ", error);
            alert("Error al guardar: " + (error instanceof Error ? error.message : "Error desconocido"));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={`min-h-screen transition-colors duration-500 pb-20 ${isDarkMode ? 'bg-[#1F2128] text-white' : 'bg-[#F3F4F6]'}`}>
            <div className="max-w-md mx-auto px-6 pt-6">
                <TopHeader
                    title={isEditMode ? 'Editar' : 'Nueva'}
                    subtitle="Sesión de Entrenamiento"
                    onBack={() => navigate(-1)}
                    onLogout={onLogout}
                />
            </div>

            <div className="max-w-md mx-auto px-6 pt-6 space-y-8">
                <div className="space-y-3">
                    <h3 className="text-[10px] font-black tracking-[0.2em] text-gray-500 uppercase">Imagen de Portada</h3>
                    <label className={`aspect-video rounded-[2rem] border-2 border-dashed flex flex-col items-center justify-center gap-3 transition-all cursor-pointer overflow-hidden relative ${isDarkMode ? 'border-gray-800 bg-[#2A2D3A]/30 hover:bg-[#2A2D3A]/50' : 'border-gray-300 bg-white hover:bg-gray-50 shadow-sm'
                        }`}>
                        <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />

                        {imagePreview ? (
                            <img src={imagePreview} className="absolute inset-0 w-full h-full object-cover" alt="Preview" />
                        ) : (
                            <>
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${isDarkMode ? 'bg-[#1F2128] text-gray-500' : 'bg-gray-100 text-gray-400'}`}>
                                    <Camera size={28} />
                                </div>
                                <div className="text-center">
                                    <p className={`text-sm font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Sube una foto</p>
                                    <p className="text-[10px] text-gray-500 font-medium mt-1">Haz clic para seleccionar imagen</p>
                                </div>
                            </>
                        )}
                    </label>
                </div>

                <div className="space-y-3">
                    <h3 className="text-[10px] font-black tracking-[0.2em] text-gray-500 uppercase">Nombre de la clase</h3>
                    <input
                        type="text"
                        value={name}
                        disabled={isCoach}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ej. Fit Boxing WOD"
                        className={`w-full py-5 px-6 rounded-2xl outline-none font-black text-base transition-all ${isDarkMode
                            ? 'bg-[#2A2D3A] text-white border border-transparent focus:border-[#FF1F40]/30'
                            : 'bg-white text-gray-900 border border-gray-200 shadow-sm focus:border-[#FF1F40]/30'
                            } ${isCoach ? 'opacity-50 cursor-not-allowed' : ''}`}
                    />
                </div>

                <div className="space-y-3">
                    <h3 className="text-[10px] font-black tracking-[0.2em] text-gray-500 uppercase">Grupo (Visible para...)</h3>
                    <div className="grid grid-cols-2 gap-4">
                        {availableGroups.map((g: any) => (
                            <button
                                key={g.id}
                                onClick={() => setGroup(g.name)}
                                className={`p-6 rounded-[2rem] flex flex-col items-center gap-3 transition-all relative ${group === g.name
                                    ? 'bg-[#FF1F40]/5 border-2 border-[#FF1F40] shadow-[0_10px_30px_rgba(255,31,64,0.1)]'
                                    : (isDarkMode ? 'bg-[#2A2D3A] border-2 border-transparent' : 'bg-white border-2 border-gray-50 shadow-sm')
                                    } ${isCoach ? 'pointer-events-none opacity-50' : ''}`}
                            >
                                {group === g.name && (
                                    <div className="absolute top-3 right-3 w-5 h-5 bg-[#FF1F40] rounded-full flex items-center justify-center text-white scale-110">
                                        <Check size={12} strokeWidth={4} />
                                    </div>
                                )}
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${group === g.name ? 'text-[#FF1F40]' : 'text-gray-500'}`}>
                                    <Users size={28} />
                                </div>
                                <span className={`text-sm font-black text-center leading-tight ${group === g.name ? (isDarkMode ? 'text-white' : 'text-gray-900') : 'text-gray-500'}`}>
                                    {g.name}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-3">
                    <h3 className="text-[10px] font-black tracking-[0.2em] text-gray-500 uppercase">Fecha de Inicio</h3>
                    <div className={`relative group ${isDarkMode ? 'bg-[#2A2D3A]' : 'bg-white shadow-md border border-gray-100'} rounded-2xl`}>
                        <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none text-gray-500">
                            <Calendar size={20} />
                        </div>
                        <input
                            value={startDate}
                            disabled={isCoach}
                            onChange={(e) => setStartDate(e.target.value)}
                            className={`w-full py-5 pl-14 pr-14 rounded-2xl bg-transparent outline-none font-bold text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'} ${isCoach ? 'opacity-50 cursor-not-allowed' : ''}`}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-3">
                        <h3 className="text-[10px] font-black tracking-[0.2em] text-gray-500 uppercase">Hora Inicio</h3>
                        <div className={`relative ${isDarkMode ? 'bg-[#2A2D3A]' : 'bg-white shadow-sm'} rounded-2xl`}>
                            <input
                                value={startTime}
                                disabled={isCoach}
                                onChange={(e) => setStartTime(e.target.value)}
                                className={`w-full py-5 px-6 rounded-2xl bg-transparent outline-none font-bold text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'} ${isCoach ? 'opacity-50 cursor-not-allowed' : ''}`}
                            />
                            <div className="absolute inset-y-0 right-6 flex items-center pointer-events-none text-gray-400">
                                <Clock size={16} />
                            </div>
                        </div>
                    </div>
                    <div className="space-y-3">
                        <h3 className="text-[10px] font-black tracking-[0.2em] text-gray-500 uppercase">Hora Fin</h3>
                        <div className={`relative ${isDarkMode ? 'bg-[#2A2D3A]' : 'bg-white shadow-sm'} rounded-2xl`}>
                            <input
                                value={endTime}
                                disabled={isCoach}
                                onChange={(e) => setEndTime(e.target.value)}
                                className={`w-full py-5 px-6 rounded-2xl bg-transparent outline-none font-bold text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'} ${isCoach ? 'opacity-50 cursor-not-allowed' : ''}`}
                            />
                            <div className="absolute inset-y-0 right-6 flex items-center pointer-events-none text-gray-400">
                                <Clock size={16} />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="text-[10px] font-black tracking-[0.2em] text-gray-500 uppercase">Días de la semana</h3>
                    <div className={`flex justify-between items-center px-1 ${(isEditMode || isCoach) ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
                        {days.map(d => (
                            <button
                                key={d.key}
                                onClick={() => toggleDay(d.key)}
                                className={`w-11 h-11 rounded-full flex flex-col items-center justify-center transition-all ${selectedDays.includes(d.key)
                                    ? 'bg-[#FF1F40] text-white shadow-[0_5px_15px_rgba(255,31,64,0.3)]'
                                    : (isDarkMode ? 'bg-[#2A2D3A] text-gray-500 hover:text-white' : 'bg-white text-gray-400 shadow-md border border-gray-100')
                                    }`}
                            >
                                <span className="text-[10px] font-black">{d.key}</span>
                            </button>
                        ))}
                    </div>

                    {!isEditMode && (
                        <label className={`flex items-start gap-4 p-6 rounded-[2rem] cursor-pointer transition-all ${isDarkMode ? 'bg-[#2A2D3A]/50' : 'bg-white shadow-md border border-gray-100'}`}>
                            <div className="relative flex items-center pt-1">
                                <input
                                    type="checkbox"
                                    className="sr-only"
                                    checked={repeatAllYear}
                                    onChange={() => setRepeatAllYear(!repeatAllYear)}
                                />
                                <div className={`w-6 h-6 rounded-lg border-2 transition-all flex items-center justify-center ${repeatAllYear
                                    ? 'bg-[#FF1F40] border-[#FF1F40]'
                                    : (isDarkMode ? 'border-gray-700' : 'border-gray-200')
                                    }`}>
                                    {repeatAllYear && <Check size={14} className="text-white" strokeWidth={4} />}
                                </div>
                            </div>
                            <div className="flex-1">
                                <h4 className={`text-sm font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Repetir todo el año</h4>
                                <p className="text-[10px] text-gray-500 font-medium mt-0.5">Crea las clases automáticamente hasta el 31 de Diciembre</p>
                            </div>
                        </label>
                    )}
                </div>

                <div className="grid grid-cols-5 gap-4">
                    <div className="col-span-3 space-y-3">
                        <h3 className="text-[10px] font-black tracking-[0.2em] text-gray-500 uppercase">Entrenador</h3>
                        <div className={`relative ${isDarkMode ? 'bg-[#2A2D3A]' : 'bg-white shadow-sm'} rounded-2xl`}>
                            <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-gray-500">
                                <UserIcon size={18} className="text-gray-500" />
                            </div>
                            <select
                                value={coachId}
                                disabled={isCoach}
                                onChange={(e) => setCoachId(e.target.value)}
                                className={`w-full py-5 pl-12 pr-10 rounded-2xl bg-transparent outline-none font-bold text-sm appearance-none ${isDarkMode ? 'text-white' : 'text-gray-900'} ${isCoach ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                <option value="" disabled>Seleccionar Coach</option>
                                {coaches.map((coach) => (
                                    <option key={coach.id} value={coach.id}>
                                        {coach.name} ({coach.speciality})
                                    </option>
                                ))}
                            </select>
                            <div className="absolute inset-y-0 right-5 flex items-center pointer-events-none text-gray-400 rotate-90">
                                <ChevronLeft size={16} />
                            </div>
                        </div>
                    </div>
                    <div className="col-span-2 space-y-3">
                        <h3 className="text-[10px] font-black tracking-[0.2em] text-gray-500 uppercase">Aforo</h3>
                        <div className={`flex items-center justify-between w-full h-[60px] px-2 rounded-2xl ${isDarkMode ? 'bg-[#2A2D3A]' : 'bg-white shadow-md border border-gray-100'} ${isCoach ? 'opacity-50 pointer-events-none' : ''}`}>
                            <button
                                onClick={() => setCapacity(Math.max(1, capacity - 1))}
                                className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${isDarkMode ? 'hover:bg-white/5 text-gray-500' : 'hover:bg-gray-50 text-gray-400'}`}
                            >
                                <Minus size={16} />
                            </button>
                            <span className={`text-base font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{capacity}</span>
                            <button
                                onClick={() => setCapacity(capacity + 1)}
                                className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${isDarkMode ? 'hover:bg-white/5 text-gray-500' : 'hover:bg-gray-50 text-gray-400'}`}
                            >
                                <Plus size={16} />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex justify-between items-end">
                        <h3 className="text-[10px] font-black tracking-[0.2em] text-gray-500 uppercase italic">WOD / Entrenamiento de Hoy</h3>
                        <span className="text-[8px] font-black text-[#FF1F40] uppercase tracking-widest">{wod.length} EJERCICIOS</span>
                    </div>

                    <div className={`p-6 rounded-[2.5rem] ${isDarkMode ? 'bg-[#2A2D3A]' : 'bg-white shadow-xl shadow-gray-300/30'}`}>
                        <div className="mb-6">
                            <label className="text-[10px] font-black text-gray-400 uppercase ml-1 mb-2 block">Añadir Ejercicio de la biblioteca</label>
                            <div className="flex gap-2">
                                <select
                                    onChange={(e) => {
                                        const ex = libraryExercises.find(x => x.id === e.target.value);
                                        if (ex) addWodItem(ex);
                                        e.target.value = "";
                                    }}
                                    className={`flex-1 ${isDarkMode ? 'bg-[#1F2128]' : 'bg-gray-50'} rounded-2xl px-4 py-3 outline-none border border-transparent focus:border-[#FF1F40] font-bold text-sm`}
                                >
                                    <option value="">Seleccionar Ejercicio...</option>
                                    {libraryExercises.map(ex => (
                                        <option key={ex.id} value={ex.id}>{ex.name}</option>
                                    ))}
                                </select>
                                <button
                                    onClick={() => setIsExerciseModalOpen(true)}
                                    className="w-12 h-12 bg-[#FF1F40] rounded-2xl flex items-center justify-center text-white shadow-lg shadow-red-500/30 active:scale-95 transition-all"
                                >
                                    <Plus size={24} />
                                </button>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {wod.map((item, index) => (
                                <div key={index} className={`p-4 rounded-2xl ${isDarkMode ? 'bg-[#1F2128]/50' : 'bg-gray-50'} border ${isDarkMode ? 'border-white/5' : 'border-gray-100'}`}>
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-lg bg-[#FF1F40]/10 flex items-center justify-center text-[#FF1F40]">
                                                <Dumbbell size={16} />
                                            </div>
                                            <span className="font-black uppercase italic text-xs">{item.exerciseName}</span>
                                        </div>
                                        <button onClick={() => removeWodItem(index)} className="p-1 text-gray-500 hover:text-red-500 transition-colors">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                        <div>
                                            <label className="text-[8px] font-black text-gray-500 uppercase mb-1 block">Sets</label>
                                            <input
                                                value={item.sets}
                                                onChange={e => updateWodItem(index, 'sets', e.target.value)}
                                                className={`w-full ${isDarkMode ? 'bg-[#2A2D3A]' : 'bg-white'} rounded-lg px-2 py-2 text-[10px] font-bold text-center outline-none border border-transparent focus:border-[#FF1F40]`}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[8px] font-black text-gray-500 uppercase mb-1 block">Repes/Min</label>
                                            <input
                                                value={item.reps}
                                                onChange={e => updateWodItem(index, 'reps', e.target.value)}
                                                className={`w-full ${isDarkMode ? 'bg-[#2A2D3A]' : 'bg-white'} rounded-lg px-2 py-2 text-[10px] font-bold text-center outline-none border border-transparent focus:border-[#FF1F40]`}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[8px] font-black text-gray-500 uppercase mb-1 block">Notas</label>
                                            <input
                                                value={item.notes}
                                                onChange={e => updateWodItem(index, 'notes', e.target.value)}
                                                className={`w-full ${isDarkMode ? 'bg-[#2A2D3A]' : 'bg-white'} rounded-lg px-2 py-2 text-[10px] font-bold outline-none border border-transparent focus:border-[#FF1F40]`}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {wod.length === 0 && (
                                <div className="text-center py-6 border-2 border-dashed border-gray-100 rounded-3xl opacity-30">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Sin WOD definido</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="space-y-3">
                    <h3 className="text-[10px] font-black tracking-[0.2em] text-gray-500 uppercase">Descripción opcional</h3>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Equipamiento, nivel, etc..."
                        className={`w-full py-5 px-6 rounded-[2rem] outline-none font-medium text-sm transition-all h-24 resize-none ${isDarkMode
                            ? 'bg-[#2A2D3A] text-white border border-transparent focus:border-[#FF1F40]/30'
                            : 'bg-white text-gray-900 border border-gray-100 shadow-sm focus:border-[#FF1F40]/30'
                            }`}
                    />
                </div>

                <div className={`p-6 rounded-[2rem] flex items-center justify-between ${isDarkMode ? 'bg-[#2A2D3A]/30 border border-white/5' : 'bg-white shadow-md border border-gray-100'}`}>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-[#FF1F40]/10 flex items-center justify-center text-[#FF1F40]">
                            <Bell size={22} />
                        </div>
                        <div>
                            <h4 className={`text-sm font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Notificar a usuarios</h4>
                            <p className="text-[10px] text-gray-500 font-medium">Enviar push al publicar</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setNotifyUsers(!notifyUsers)}
                        className={`w-12 h-6 rounded-full transition-all duration-300 relative ${notifyUsers ? 'bg-[#FF1F40]' : 'bg-gray-300 dark:bg-[#323645]'}`}
                    >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${notifyUsers ? 'left-7' : 'left-1'}`}></div>
                    </button>
                </div>

                <div className="pt-4 pb-12">
                    <button
                        onClick={handleSave}
                        disabled={isLoading}
                        className="w-full bg-[#FF1F40] py-6 rounded-[2rem] flex items-center justify-center gap-3 text-white font-black uppercase tracking-widest shadow-[0_15px_35px_rgba(255,31,64,0.4)] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                            {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Plus size={20} strokeWidth={4} />}
                        </div>
                        {isLoading ? 'Guardando...' : (isEditMode ? (isCoach ? 'Actualizar WOD' : 'Guardar Cambios') : 'Publicar Clase')}
                    </button>
                </div>
            </div>

            <ExerciseFormModal
                isOpen={isExerciseModalOpen}
                onClose={() => setIsExerciseModalOpen(false)}
                onSuccess={() => {
                    setIsExerciseModalOpen(false);
                }}
            />
        </div>
    );
};

const UserIcon = ({ size, className }: { size: number, className?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
    </svg>
);

export default CreateClass;
