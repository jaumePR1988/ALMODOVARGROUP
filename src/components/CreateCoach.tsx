import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ChevronLeft,
    Camera,
    User,
    Save,
    Loader2,
    Check
} from 'lucide-react';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot } from 'firebase/firestore';

const CreateCoach = () => {
    const navigate = useNavigate();
    const [isDarkMode, setIsDarkMode] = useState(document.documentElement.classList.contains('dark'));
    const [isLoading, setIsLoading] = useState(false);

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [speciality, setSpeciality] = useState('Crossfit');

    // Default group set to 'AlmodovarBOX' but will be updated with real data
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

    // Fetch Groups
    useEffect(() => {
        const q = query(collection(db, 'groups'), orderBy('name', 'asc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const groupsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            if (groupsData.length > 0) {
                setAvailableGroups(groupsData);
                // Ensure the currently selected group is valid, or set to first available
                // Only set default if group is still initial default and available groups doesn't contain it
                if (!group) setGroup(groupsData[0].name);
            } else {
                // Default groups if collection is empty
                setAvailableGroups([
                    { id: 'box', name: 'AlmodovarBOX' },
                    { id: 'fit', name: 'AlmodovarFIT' }
                ]);
            }
        });
        return () => unsubscribe();
    }, []);

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
                const MAX_WIDTH = 400; // Smaller for avatars
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
            let photoUrl = null;
            if (imagePreview) {
                photoUrl = await resizeImage(imagePreview);
            }

            await addDoc(collection(db, 'coaches'), {
                name,
                email,
                speciality,
                group,
                photoUrl,
                createdAt: serverTimestamp()
            });

            setShowSuccess(true);

            // Delay navigation slightly
            setTimeout(() => {
                navigate('/manage-coaches');
            }, 2000);

        } catch (err) {
            console.error(err);
            setError('Ha ocurrido un error al guardar. Inténtalo de nuevo.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={`min-h-screen transition-colors duration-500 pb-20 ${isDarkMode ? 'bg-[#1F2128] text-white' : 'bg-[#F3F4F6]'}`}>
            {/* Header */}
            <header className={`sticky top-0 z-[50] px-6 py-5 flex items-center justify-between backdrop-blur-md ${isDarkMode ? 'bg-[#1F2128]/80' : 'bg-white/80'}`}>
                <button
                    onClick={() => navigate('/manage-coaches')}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isDarkMode ? 'hover:bg-white/5' : 'hover:bg-gray-100'}`}
                >
                    <ChevronLeft size={24} className={isDarkMode ? 'text-white' : 'text-gray-900'} />
                </button>
                <h1 className={`text-sm font-black uppercase tracking-widest ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Nuevo Coach
                </h1>
                <div className="w-10" />
            </header>

            {/* Success Modal */}
            {showSuccess && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className={`w-full max-w-sm p-8 rounded-[2.5rem] text-center shadow-2xl scale-100 animate-in zoom-in-95 duration-300 ${isDarkMode ? 'bg-[#2A2D3A]' : 'bg-white'}`}>
                        <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-green-500">
                            <Check size={40} strokeWidth={3} />
                        </div>
                        <h2 className={`text-2xl font-black mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>¡Coach Creado!</h2>
                        <p className="text-gray-500 text-sm font-medium mb-8">El coach se ha añadido correctamente a la base de datos.</p>
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
                        <div className={`w-32 h-32 rounded-full flex items-center justify-center overflow-hidden border-4 transition-all ${isDarkMode ? 'bg-[#2A2D3A] border-[#2A2D3A]' : 'bg-white border-white shadow-xl'}`}>
                            {imagePreview ? (
                                <img src={imagePreview} className="w-full h-full object-cover" />
                            ) : (
                                <User size={40} className="text-gray-400" />
                            )}
                        </div>
                        <div className="absolute bottom-0 right-0 w-10 h-10 bg-[#FF1F40] rounded-full flex items-center justify-center text-white shadow-lg border-4 border-[#1F2128]">
                            <Camera size={18} />
                        </div>
                        <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                    </label>
                </div>

                {/* Form */}
                <div className="space-y-5">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Nombre Completo</label>
                        <input
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="Ej. Ana González"
                            className={`w-full py-4 px-6 rounded-2xl outline-none font-bold ${isDarkMode ? 'bg-[#2A2D3A] text-white' : 'bg-white shadow-sm text-gray-900'}`}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Email (Obligatorio)</label>
                        <input
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="coach@almodovar.com"
                            className={`w-full py-4 px-6 rounded-2xl outline-none font-bold ${isDarkMode ? 'bg-[#2A2D3A] text-white' : 'bg-white shadow-sm text-gray-900'}`}
                        />
                    </div>

                    {/* Group Selection */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Grupo</label>
                        <select
                            value={group}
                            onChange={e => setGroup(e.target.value)}
                            className={`w-full py-4 px-6 rounded-2xl outline-none font-bold appearance-none ${isDarkMode ? 'bg-[#2A2D3A] text-white' : 'bg-white shadow-sm text-gray-900'}`}
                        >
                            {availableGroups.map((grp) => (
                                <option key={grp.id} value={grp.name}>
                                    {grp.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Especialidad</label>
                        <select
                            value={speciality}
                            onChange={e => setSpeciality(e.target.value)}
                            className={`w-full py-4 px-6 rounded-2xl outline-none font-bold appearance-none ${isDarkMode ? 'bg-[#2A2D3A] text-white' : 'bg-white shadow-sm text-gray-900'}`}
                        >
                            <option value="Crossfit">Crossfit</option>
                            <option value="Boxeo">Boxeo</option>
                            <option value="Yoga">Yoga</option>
                            <option value="Halterofilia">Halterofilia</option>
                            <option value="Funcional">Funcional</option>
                        </select>
                    </div>
                </div>

                <button
                    onClick={handleSave}
                    disabled={isLoading}
                    className="w-full bg-[#FF1F40] py-5 rounded-2xl text-white font-black uppercase tracking-widest shadow-xl shadow-red-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 mt-8"
                >
                    {isLoading ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                    Guardar Coach
                </button>

            </div>
        </div>
    );
};

export default CreateCoach;
