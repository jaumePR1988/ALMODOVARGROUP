import { useState, useEffect } from 'react';
import { Plus, Search, Calendar as CalendarIcon, Clock, Users, Edit2, Trash2, ChevronRight, MapPin, X, Target, Info, CheckCircle2, ShieldAlert, Zap, LogOut, Upload, UserIcon, Repeat } from 'lucide-react';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import AdminNavBar from '../components/AdminNavBar';
import PremiumAlert from '../components/PremiumAlert';

interface CoachData {
    id: string;
    nombre: string;
    apellidos: string;
}

const ClassManagement = () => {
    const { signOut } = useAuth();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [category, setCategory] = useState('');
    const [startTime, setStartTime] = useState('18:30');
    const [capacity, setCapacity] = useState(24);
    const [coaches, setCoaches] = useState<CoachData[]>([]);
    const [modes, setModes] = useState<any[]>([]);
    const [selectedCoach, setSelectedCoach] = useState<CoachData | null>(null);
    const [saving, setSaving] = useState(false);
    const [showCoachSelector, setShowCoachSelector] = useState(false);
    
    // Popup state
    const [alertConfig, setAlertConfig] = useState<{ isOpen: boolean; title: string; message: string; type: 'success' | 'error' }>({ isOpen: false, title: '', message: '', type: 'success' });

    const showAlert = (title: string, message: string, type: 'success' | 'error' = 'success') => {
        setAlertConfig({ isOpen: true, title, message, type });
    };
    
    // Configuración de periodicidad
    const [isRecurring, setIsRecurring] = useState(true);
    const [selectedDays, setSelectedDays] = useState<number[]>([1]); // 1=Lunes, 2=Martes... etc.
    const [specificDate, setSpecificDate] = useState('');

    const toggleDay = (day: number) => {
        if (selectedDays.includes(day)) {
            setSelectedDays(selectedDays.filter(d => d !== day));
        } else {
            setSelectedDays([...selectedDays, day]);
        }
    };
    
    const daysOfWeek = [
        { id: 1, label: 'L' },
        { id: 2, label: 'M' },
        { id: 3, label: 'X' },
        { id: 4, label: 'J' },
        { id: 5, label: 'V' }
    ];

    // Obtener la fecha de hoy en formato YYYY-MM-DD para bloquear fechas pasadas
    const todayStr = new Date().toISOString().split('T')[0];

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Cargar Coaches
                const qCoaches = query(collection(db, 'users'), where('role', '==', 'coach'));
                const coachesSnap = await getDocs(qCoaches);
                const coachesList = coachesSnap.docs.map(doc => {
                    const data = doc.data() as any;
                    return {
                        id: doc.id,
                        nombre: data.displayName || data.nombre || 'Coach',
                        apellidos: data.apellidos || ''
                    };
                }) as CoachData[];
                setCoaches(coachesList.sort((a,b) => a.nombre.localeCompare(b.nombre)));
                if (coachesList.length > 0) {
                    setSelectedCoach(coachesList[0]);
                }

                // Cargar Modos
                const modesSnap = await getDocs(collection(db, 'modes'));
                const modesList = modesSnap.docs.map(doc => ({
                    id: doc.id,
                    name: doc.data().name
                }));
                const sortedModes = modesList.sort((a,b) => a.name.localeCompare(b.name));
                setModes(sortedModes);
                if (sortedModes.length > 0) {
                    setCategory(sortedModes[0].name.toUpperCase());
                }
            } catch (error) {
                console.error("Error al obtener datos:", error);
            }
        };
        fetchData();
    }, []);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleCreateClass = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !description.trim() || !selectedCoach) {
            showAlert("Faltan Datos", "Por favor, rellena el título, la descripción y selecciona un coach.", "error");
            return;
        }

        if (!isRecurring && !specificDate) {
            showAlert("Faltan Datos", "Por favor, selecciona una fecha para la clase puntual.", "error");
            return;
        }
        if (isRecurring && selectedDays.length === 0) {
            showAlert("Faltan Datos", "Por favor, selecciona al menos un día de la semana.", "error");
            return;
        }

        setSaving(true);
        try {
            let imageUrl = '';
            if (imageFile) {
                const imageRef = ref(storage, `class_images/${Date.now()}_${imageFile.name}`);
                const uploadResult = await uploadBytes(imageRef, imageFile);
                imageUrl = await getDownloadURL(uploadResult.ref);
            }

            await addDoc(collection(db, 'classes'), {
                title,
                description,
                imageUrl,
                coachId: selectedCoach.id,
                coachName: `${selectedCoach.nombre} ${selectedCoach.apellidos}`,
                category,
                startTime,
                capacity,
                isRecurring,
                recurringDays: isRecurring ? selectedDays : null,
                specificDate: !isRecurring ? specificDate : null,
                createdAt: new Date(),
                status: 'active'
            });
            showAlert("Excelente", "¡Clase creada correctamente!", "success");
            setTitle('');
            setDescription('');
            setImageFile(null);
            setImagePreview(null);
        } catch (error) {
            console.error("Error al crear clase:", error);
            showAlert("Error", "Error al crear la clase.", "error");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="bg-[#111111] text-gray-200 min-h-screen selection:bg-[#E13038] selection:text-white pb-safe">
            
            {/* TopAppBar */}
            <header className="fixed top-0 left-1/2 -translate-x-1/2 w-full z-50 flex justify-between items-center px-6 h-20 max-w-[480px] bg-[#111111]/80 backdrop-blur-xl">
                <div className="flex items-center gap-4">
            
                    <h1 className="text-2xl font-black tracking-tighter text-[#E13038] font-sans uppercase">
                        ALMODÓVAR
                    </h1>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={signOut} className="text-gray-400 hover:text-white transition-colors active:scale-95 p-2 rounded-full bg-white/5">
                        <LogOut size={20} />
                    </button>
                    <button className="w-10 h-10 rounded-full border border-[#333] overflow-hidden active:scale-95 duration-100">
                        <img 
                            alt="Profile Avatar" 
                            className="w-full h-full object-cover" 
                            src="https://ui-avatars.com/api/?name=Admin&background=1A1A1A&color=E13038&bold=true"
                        />
                    </button>
                </div>
            </header>

            <main className="pt-24 pb-32 px-6 max-w-[480px] mx-auto min-h-screen">
                {/* Section Header */}
                <div className="mb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <span className="text-[#E13038] text-[10px] tracking-[0.3em] font-black uppercase">Admin Dashboard</span>
                    <h2 className="text-4xl font-black leading-none tracking-tighter mt-2 uppercase text-white">CREAR<br/>CLASE</h2>
                </div>

                {/* Form Canvas */}
                <form onSubmit={handleCreateClass} className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                    
                    {/* Class Name Input */}
                    <div className="group border-b border-[#353534] focus-within:border-[#E13038] transition-colors py-2">
                        <label className="text-[10px] font-bold tracking-widest text-gray-500 uppercase block mb-1">Título de la Sesión</label>
                        <input 
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full bg-transparent border-none p-0 text-xl font-bold text-white placeholder:text-[#353534] focus:ring-0 outline-none" 
                            placeholder="Ej. HIGH INTENSITY BOXING" 
                            type="text"
                            required
                        />
                    </div>

                    {/* Class Description */}
                    <div className="group border-b border-[#353534] focus-within:border-[#E13038] transition-colors py-2">
                        <label className="text-[10px] font-bold tracking-widest text-gray-500 uppercase block mb-1">Descripción</label>
                        <textarea 
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full bg-transparent border-none p-0 text-sm font-medium text-white placeholder:text-[#353534] focus:ring-0 outline-none resize-none hide-scrollbar" 
                            placeholder="Añade detalles sobre la sesión, intensidad, material, etc." 
                            rows={3}
                            required
                        />
                    </div>

                    {/* Class Image */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-bold tracking-widest text-gray-500 uppercase block">Imagen Hero</label>
                        <label className="relative flex flex-col items-center justify-center w-full h-40 bg-[#1c1b1b] border-2 border-dashed border-[#353534] rounded-xl hover:border-[#E13038] hover:bg-[#2a2a2a] transition-all cursor-pointer overflow-hidden group">
                            {imagePreview ? (
                                <>
                                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <p className="text-white text-xs font-bold uppercase tracking-widest">Cambiar Imagen</p>
                                    </div>
                                </>
                            ) : (
                                <div className="flex flex-col items-center justify-center gap-2">
                                    <Upload size={24} className="text-[#E13038]" />
                                    <p className="text-xs text-gray-500 font-bold uppercase tracking-widest text-center px-4">Subir foto para la clase</p>
                                </div>
                            )}
                            <input 
                                type="file" 
                                accept="image/*"
                                onChange={handleImageChange}
                                className="hidden"
                            />
                        </label>
                    </div>

                    {/* Coach Selection */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-bold tracking-widest text-gray-500 uppercase block">Asignar Coach</label>
                        {showCoachSelector ? (
                            <div className="bg-[#1c1b1b] p-4 rounded-xl border border-[#333] space-y-2">
                                {coaches.length === 0 ? (
                                    <p className="text-xs text-gray-500">No hay coaches registrados. Cambia el rol de un usuario a 'coach'.</p>
                                ) : (
                                    coaches.map(coach => (
                                        <div 
                                            key={coach.id}
                                            onClick={() => { setSelectedCoach(coach); setShowCoachSelector(false); }}
                                            className="flex items-center gap-3 p-2 bg-[#2a2a2a] rounded-lg cursor-pointer hover:bg-[#393939] transition-all"
                                        >
                                            <div className="w-8 h-8 rounded bg-[#1A1A1A] flex items-center justify-center">
                                                <UserIcon size={16} className="text-[#E13038]" />
                                            </div>
                                            <span className="text-sm font-bold text-white uppercase">{coach.nombre} {coach.apellidos}</span>
                                        </div>
                                    ))
                                )}
                                <button type="button" onClick={() => setShowCoachSelector(false)} className="text-xs text-gray-500 mt-2 hover:text-white uppercase font-bold">Cancelar</button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-3">
                                {selectedCoach ? (
                                    <div className="bg-[#1c1b1b] p-4 rounded-xl border border-transparent hover:border-[#E13038]/50 transition-all cursor-pointer group" onClick={() => setShowCoachSelector(true)}>
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-[#353534] flex-shrink-0 flex items-center justify-center overflow-hidden">
                                                <img 
                                                    alt="Coach" 
                                                    src={`https://ui-avatars.com/api/?name=${selectedCoach.nombre}+${selectedCoach.apellidos}&background=1A1A1A&color=E13038&bold=true`}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            <div className="overflow-hidden">
                                                <p className="text-sm font-bold uppercase leading-tight text-white truncate">{selectedCoach.nombre}</p>
                                                <p className="text-[10px] text-gray-500 uppercase truncate">Coach Asignado</p>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-[#1c1b1b] p-4 rounded-xl border border-[#E13038]/50 flex items-center justify-center">
                                        <p className="text-xs text-gray-500 uppercase">Sin Coach</p>
                                    </div>
                                )}
                                
                                <div 
                                    onClick={() => setShowCoachSelector(!showCoachSelector)}
                                    className="bg-[#2a2a2a] p-4 rounded-xl border border-[#E13038] transition-all cursor-pointer flex items-center gap-3"
                                >
                                    <div className="w-10 h-10 rounded-lg bg-[#E13038]/20 flex-shrink-0 flex items-center justify-center">
                                        <Search size={20} className="text-[#E13038]" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold uppercase leading-tight text-[#E13038]">Buscar</p>
                                        <p className="text-[10px] text-[#E13038]/70 uppercase">Directorio</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Session Type Chips */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-bold tracking-widest text-gray-500 uppercase block">Categoría</label>
                        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2">
                            {modes.map(mode => (
                                <button 
                                    key={mode.id}
                                    type="button"
                                    onClick={() => setCategory(mode.name.toUpperCase())}
                                    className={`px-8 py-3 rounded-md font-black text-xs tracking-widest uppercase flex-shrink-0 transition-colors ${category === mode.name.toUpperCase() ? 'bg-[#E13038] text-white shadow-[0_0_15px_rgba(225,48,56,0.3)]' : 'bg-[#2a2a2a] text-gray-400 hover:text-white'}`}
                                >
                                    {mode.name}
                                </button>
                            ))}
                            {modes.length === 0 && (
                                <p className="text-gray-500 text-xs italic py-2">No hay modos registrados.</p>
                            )}
                        </div>
                    </div>

                    {/* Scheduling Section */}
                    <div className="space-y-4">
                        <label className="text-[10px] font-bold tracking-widest text-gray-500 uppercase block">Programación</label>
                        
                        <div className="flex bg-[#1c1b1b] p-1 rounded-lg border border-[#333]">
                            <button 
                                type="button"
                                onClick={() => setIsRecurring(true)}
                                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-md font-bold text-xs uppercase transition-all ${isRecurring ? 'bg-[#333] text-white shadow-md' : 'text-gray-500 hover:text-white'}`}
                            >
                                <Repeat size={16} /> Fija Semanal
                            </button>
                            <button 
                                type="button"
                                onClick={() => setIsRecurring(false)}
                                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-md font-bold text-xs uppercase transition-all ${!isRecurring ? 'bg-[#333] text-white shadow-md' : 'text-gray-500 hover:text-white'}`}
                            >
                                <CalendarIcon size={16} /> Puntual
                            </button>
                        </div>
                        
                        <div className="bg-[#1c1b1b] p-5 rounded-xl border border-[#333] min-h-[100px] flex flex-col justify-center shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
                            {isRecurring ? (
                                <div className="space-y-3 animate-in fade-in zoom-in duration-300">
                                    <p className="text-xs text-gray-500 text-center uppercase tracking-widest font-bold">Días de la semana</p>
                                    <div className="flex justify-between items-center gap-1">
                                        {daysOfWeek.map(day => (
                                            <button
                                                key={day.id}
                                                type="button"
                                                onClick={() => toggleDay(day.id)}
                                                className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm transition-all ${selectedDays.includes(day.id) ? 'bg-[#E13038] text-white shadow-[0_0_15px_rgba(225,48,56,0.4)]' : 'bg-[#2a2a2a] text-gray-400 hover:bg-[#333]'}`}
                                            >
                                                {day.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-3 animate-in fade-in zoom-in duration-300">
                                     <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold text-center block mb-1">Fecha Específica</p>
                                     <input 
                                        type="date" 
                                        min={todayStr}
                                        value={specificDate}
                                        onChange={(e) => setSpecificDate(e.target.value)}
                                        className="w-full bg-[#2a2a2a] border border-[#333] rounded-lg p-3 text-white focus:border-[#E13038] focus:ring-0 outline-none uppercase font-bold text-center"
                                     />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Schedule & Specs Bento */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-[#1c1b1b] p-5 rounded-xl space-y-2 col-span-2 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
                            <label className="text-[10px] font-bold tracking-widest text-gray-500 uppercase">Hora de Inicio</label>
                            <div className="flex items-center gap-4">
                                <Clock size={24} className="text-[#E13038]" />
                                <input 
                                    className="bg-transparent border-none text-4xl font-black p-0 focus:ring-0 text-white outline-none w-full" 
                                    type="time" 
                                    value={startTime}
                                    onChange={(e) => setStartTime(e.target.value)}
                                />
                            </div>
                        </div>
                        
                        <div className="bg-[#1c1b1b] p-5 rounded-xl space-y-2 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
                            <label className="text-[10px] font-bold tracking-widest text-gray-500 uppercase">Aforo</label>
                            <div className="flex items-center gap-3">
                                <input 
                                    type="number" 
                                    value={capacity}
                                    onChange={(e) => setCapacity(Number(e.target.value))}
                                    className="text-3xl font-black text-white bg-transparent border-none p-0 w-24 focus:ring-0 outline-none"
                                />
                                <span className="text-[10px] font-bold text-gray-500 uppercase">Plazas</span>
                            </div>
                        </div>
                        
                        <div className="bg-[#1c1b1b] p-5 rounded-xl space-y-2 flex flex-col justify-center shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
                            <label className="text-[10px] font-bold tracking-widest text-gray-500 uppercase text-center block">Sala Asignada</label>
                            <div className="flex items-center justify-center w-full">
                                <span className="text-md font-black text-white uppercase text-center">PRINCIPAL</span>
                            </div>
                        </div>
                    </div>

                    {/* Submit Action */}
                    <div className="pt-6">
                        <button 
                            type="submit"
                            disabled={saving}
                            className="w-full h-16 bg-gradient-to-r from-[#E13038] to-[#ff535b] rounded-lg font-black text-white tracking-[0.2em] uppercase active:scale-95 transition-all flex items-center justify-center gap-3 shadow-[0_15px_30px_rgba(225,48,56,0.3)] disabled:opacity-50"
                        >
                            <span>{saving ? 'CREANDO...' : 'CREAR SESIÓN'}</span>
                            <Zap size={24} className="text-white" />
                        </button>
                        <p className="text-center text-[10px] text-gray-600 mt-4 tracking-widest uppercase font-bold">Esta acción será registrada en Firestore</p>
                    </div>
                </form>
            </main>

            <AdminNavBar />
            
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

export default ClassManagement;
