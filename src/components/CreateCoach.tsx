import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    ChevronLeft,
    Camera,
    User,
    Save,
    Check,
    Loader2,
    Phone,
    FileText,
    Activity
} from 'lucide-react';
import TopHeader from './TopHeader';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, doc, getDoc, updateDoc } from 'firebase/firestore';

const CreateCoach = () => {
    const navigate = useNavigate();
    const { coachId } = useParams();
    const isEditMode = !!coachId;

    const [isDarkMode, setIsDarkMode] = useState(document.documentElement.classList.contains('dark'));
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(isEditMode);

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [speciality, setSpeciality] = useState('Crossfit');
    const [phone, setPhone] = useState('');
    const [bio, setBio] = useState('');
    const [status, setStatus] = useState('active');

    // Default group set to 'AlmodovarBOX'
    const [group, setGroup] = useState('AlmodovarBOX');
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [availableGroups, setAvailableGroups] = useState<any[]>([]);

    const [showSuccess, setShowSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const observer = new MutationObserver(() => {
            setIsDarkMode(document.documentElement.classList.contains('dark'));
        });
        observer.observe(document.documentElement, { attributes: true });
        return () => observer.disconnect();
    }, []);

    // Fetch existing coach if in edit mode
    useEffect(() => {
        if (!isEditMode || !coachId) return;

        const fetchCoach = async () => {
            try {
                const docRef = doc(db, 'coaches', coachId);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setName(data.name || '');
                    setEmail(data.email || '');
                    setSpeciality(data.speciality || 'Crossfit');
                    setGroup(data.group || 'AlmodovarBOX');
                    setPhone(data.phone || '');
                    setBio(data.bio || '');
                    setStatus(data.status || 'active');
                    setImagePreview(data.photoUrl || null);
                }
            } catch (err) {
                console.error("Error fetching coach:", err);
                setError("No se pudo cargar la información del coach");
            } finally {
                setIsFetching(false);
            }
        };

        fetchCoach();
    }, [isEditMode, coachId]);

    // Fetch Groups
    useEffect(() => {
        const q = query(collection(db, 'groups'), orderBy('name', 'asc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const groupsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            if (groupsData.length > 0) {
                setAvailableGroups(groupsData);
                if (!group) setGroup(groupsData[0].name);
            } else {
                setAvailableGroups([
                    { id: 'box', name: 'AlmodovarBOX' },
                    { id: 'fit', name: 'AlmodovarFIT' }
                ]);
            }
        });
        return () => unsubscribe();
    }, [group]);

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

    const resizeImage = (base64Str: string): Promise<string> => {
        return new Promise((resolve) => {
            const img = new Image();
            img.src = base64Str;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 400;
                const MAX_HEIGHT = 400;
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
                resolve(canvas.toDataURL('image/jpeg', 0.8));
            };
        });
    };

    const handleSave = async () => {
        if (!name) {
            setError('El nombre del coach es obligatorio');
            return;
        }

        if (!email) {
            setError('El email es obligatorio para vincular con su cuenta');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            let photoUrl = imagePreview;
            // Only resize if it's a new base64 string (starts with data:image)
            if (imagePreview && imagePreview.startsWith('data:image')) {
                photoUrl = await resizeImage(imagePreview);
            }

            const coachData = {
                name,
                email,
                speciality,
                group,
                phone,
                bio,
                status,
                photoUrl,
                updatedAt: serverTimestamp(),
                ...(!isEditMode && { createdAt: serverTimestamp() })
            };

            if (isEditMode && coachId) {
                await updateDoc(doc(db, 'coaches', coachId), coachData);
            } else {
                await addDoc(collection(db, 'coaches'), coachData);
            }

            setShowSuccess(true);
            setTimeout(() => {
                navigate('/manage-coaches');
            }, 1500);

        } catch (err) {
            console.error(err);
            setError('Ha ocurrido un error al guardar. Inténtalo de nuevo.');
        } finally {
            setIsLoading(false);
        }
    };

    if (isFetching) {
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
                    title={isEditMode ? "Editar Coach" : "Nuevo Coach"}
                    subtitle={isEditMode ? "Actualiza los datos del equipo" : "Añade un nuevo profesional"}
                    onBack={() => navigate(-1)}
                />
            </div>

            {/* Success Modal */}
            {showSuccess && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className={`w-full max-w-sm p-8 rounded-[2.5rem] text-center shadow-2xl scale-100 animate-in zoom-in-95 duration-300 ${isDarkMode ? 'bg-[#2A2D3A]' : 'bg-white'}`}>
                        <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-green-500">
                            <Check size={40} strokeWidth={3} />
                        </div>
                        <h2 className={`text-2xl font-black mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{isEditMode ? '¡Actualizado!' : '¡Creado!'}</h2>
                        <p className="text-gray-500 text-sm font-medium mb-8">La información se ha guardado correctamente.</p>
                        <button
                            onClick={() => navigate('/manage-coaches')}
                            className="w-full bg-green-500 py-4 rounded-2xl text-white font-black uppercase tracking-widest shadow-lg shadow-green-500/30 active:scale-95 transition-all"
                        >
                            Continuar
                        </button>
                    </div>
                </div>
            )}

            {/* Error Modal */}
            {error && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className={`w-full max-w-sm p-8 rounded-[2.5rem] text-center shadow-2xl scale-100 animate-in zoom-in-95 duration-300 ${isDarkMode ? 'bg-[#2A2D3A]' : 'bg-white'}`}>
                        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500">
                            <span className="text-4xl font-black">!</span>
                        </div>
                        <h2 className={`text-2xl font-black mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Oups...</h2>
                        <p className="text-gray-500 text-sm font-medium mb-8">{error}</p>
                        <button
                            onClick={() => setError(null)}
                            className="w-full bg-[#FF1F40] py-4 rounded-2xl text-white font-black uppercase tracking-widest shadow-lg shadow-red-500/30 active:scale-95 transition-all"
                        >
                            Entendido
                        </button>
                    </div>
                </div>
            )}

            <div className="max-w-md mx-auto px-6 pt-6 space-y-8">
                {/* Photo Upload */}
                <div className="flex justify-center">
                    <label className="relative cursor-pointer group">
                        <div className={`w-32 h-32 rounded-[2rem] flex items-center justify-center overflow-hidden border-4 transition-all shadow-2xl ${isDarkMode ? 'bg-[#2A2D3A] border-white/5' : 'bg-white border-white'}`}>
                            {imagePreview ? (
                                <img src={imagePreview} className="w-full h-full object-cover" alt="Preview" />
                            ) : (
                                <User size={40} className="text-gray-400" />
                            )}
                        </div>
                        <div className="absolute -bottom-2 -right-2 w-11 h-11 bg-[#FF1F40] rounded-2xl flex items-center justify-center text-white shadow-lg border-4 border-[#F3F4F6] dark:border-[#1F2128] group-hover:scale-110 transition-transform">
                            <Camera size={20} strokeWidth={2.5} />
                        </div>
                        <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                    </label>
                </div>

                {/* Form */}
                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-[#FF1F40] ml-2">Datos Personales</label>
                        <div className="space-y-3">
                            <div className="relative">
                                <User size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    placeholder="Nombre Completo"
                                    className={`w-full py-5 pl-14 pr-6 rounded-3xl outline-none font-bold text-sm ${isDarkMode ? 'bg-[#2A2D3A] text-white focus:ring-2 ring-[#FF1F40]/20' : 'bg-white shadow-sm text-gray-900 focus:ring-2 ring-red-100'}`}
                                />
                            </div>
                            <div className="relative">
                                <Phone size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    value={phone}
                                    onChange={e => setPhone(e.target.value)}
                                    placeholder="Teléfono móvil"
                                    className={`w-full py-5 pl-14 pr-6 rounded-3xl outline-none font-bold text-sm ${isDarkMode ? 'bg-[#2A2D3A] text-white focus:ring-2 ring-[#FF1F40]/20' : 'bg-white shadow-sm text-gray-900 focus:ring-2 ring-red-100'}`}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-[#FF1F40] ml-2">Vinculación</label>
                        <div className="relative">
                            <Activity size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="coach@almodovar.com"
                                className={`w-full py-5 pl-14 pr-6 rounded-3xl outline-none font-bold text-sm ${isDarkMode ? 'bg-[#2A2D3A] text-white focus:ring-2 ring-[#FF1F40]/20' : 'bg-white shadow-sm text-gray-900 focus:ring-2 ring-red-100'}`}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-2">Sede/Grupo</label>
                            <select
                                value={group}
                                onChange={e => setGroup(e.target.value)}
                                className={`w-full py-5 px-6 rounded-3xl outline-none font-bold text-sm appearance-none ${isDarkMode ? 'bg-[#2A2D3A] text-white focus:ring-2 ring-[#FF1F40]/20' : 'bg-white shadow-sm text-gray-900 focus:ring-2 ring-red-100'}`}
                            >
                                {availableGroups.map((grp) => (
                                    <option key={grp.id} value={grp.name}>{grp.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-2">Especialidad</label>
                            <select
                                value={speciality}
                                onChange={e => setSpeciality(e.target.value)}
                                className={`w-full py-5 px-6 rounded-3xl outline-none font-bold text-sm appearance-none ${isDarkMode ? 'bg-[#2A2D3A] text-white focus:ring-2 ring-[#FF1F40]/20' : 'bg-white shadow-sm text-gray-900 focus:ring-2 ring-red-100'}`}
                            >
                                <option value="Crossfit">Crossfit</option>
                                <option value="Boxeo">Boxeo</option>
                                <option value="Yoga">Yoga</option>
                                <option value="Halterofilia">Halterofilia</option>
                                <option value="Funcional">Funcional</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-2">Bio / Descripción Corta</label>
                        <div className="relative">
                            <FileText size={18} className="absolute left-5 top-6 text-gray-400" />
                            <textarea
                                value={bio}
                                onChange={e => setBio(e.target.value)}
                                placeholder="Breve historia o especialización del coach..."
                                rows={4}
                                className={`w-full py-5 pl-14 pr-6 rounded-[2rem] outline-none font-bold text-sm resize-none ${isDarkMode ? 'bg-[#2A2D3A] text-white focus:ring-2 ring-[#FF1F40]/20' : 'bg-white shadow-sm text-gray-900 focus:ring-2 ring-red-100'}`}
                            />
                        </div>
                    </div>
                </div>

                <button
                    onClick={handleSave}
                    disabled={isLoading}
                    className="w-full bg-[#FF1F40] py-5 rounded-[2rem] text-white font-black uppercase tracking-[0.2em] italic shadow-2xl shadow-red-500/30 active:scale-[0.98] transition-all flex items-center justify-center gap-3 mt-8"
                >
                    {isLoading ? <Loader2 className="animate-spin" /> : <Save size={20} strokeWidth={3} />}
                    {isEditMode ? 'Actualizar Cambios' : 'Guardar Coach'}
                </button>
            </div>
        </div>
    );
};

export default CreateCoach;
