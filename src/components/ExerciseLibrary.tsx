import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Dumbbell, Activity, Info, Loader2, Camera,
    Search, Plus, Trash2, Edit2, Check, X
} from 'lucide-react';
import { db } from '../firebase';
import {
    collection, onSnapshot, deleteDoc, doc, query, orderBy
} from 'firebase/firestore';
import TopHeader from './TopHeader';
import ExerciseFormModal from './ExerciseFormModal';

interface Exercise {
    id: string;
    name: string;
    description: string;
    category: string;
    targetMuscle?: string;
    imageUrl?: string;
}

const ExerciseLibrary = () => {
    const navigate = useNavigate();
    const isDarkMode = document.documentElement.classList.contains('dark');

    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [isFetching, setIsFetching] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);

    // Form state
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('Fuerza');
    const [targetMuscle, setTargetMuscle] = useState('');
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    useEffect(() => {
        const q = query(collection(db, 'exercises'), orderBy('name', 'asc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Exercise[];
            setExercises(data);
            setIsFetching(false);
        }, (error) => {
            console.error("Error fetching exercises:", error);
            setIsFetching(false);
        });
        return () => unsubscribe();
    }, []);

    const resetForm = () => {
        setName('');
        setDescription('');
        setCategory('Fuerza');
        setTargetMuscle('');
        setImagePreview(null);
        setEditingExercise(null);
    };

    const resizeImage = (base64Str: string): Promise<string> => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.src = base64Str;
            const timeoutId = setTimeout(() => {
                reject(new Error("Image processing timed out"));
            }, 5000);

            img.onload = () => {
                clearTimeout(timeoutId);
                try {
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
                    if (!ctx) {
                        reject(new Error("Could not get canvas context"));
                        return;
                    }
                    ctx.drawImage(img, 0, 0, width, height);
                    resolve(canvas.toDataURL('image/jpeg', 0.8));
                } catch (e) {
                    reject(e);
                }
            };
            img.onerror = (err) => {
                clearTimeout(timeoutId);
                console.error("Image load error:", err);
                reject(new Error("Failed to load image for resizing"));
            };
        });
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    // Helper: Timeout wrapper for promises
    const withTimeout = <T,>(promise: Promise<T>, ms: number, label: string): Promise<T> => {
        return Promise.race([
            promise,
            new Promise<T>((_, reject) =>
                setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
            )
        ]);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();

        // 1. Validation
        if (!name.trim()) {
            alert("El nombre es obligatorio");
            return;
        }

        setIsSaving(true);
        let finalImageUrl = "";

        // 2. Image Processing (Optional)
        if (imagePreview) {
            if (imagePreview.startsWith('http')) {
                finalImageUrl = imagePreview;
            } else {
                try {
                    console.log("Starting image resize...");
                    // Resize with timeout
                    const resized = await withTimeout(resizeImage(imagePreview), 6000, "Image Resizing");

                    console.log("Image resized, uploading to Storage...");
                    const storageRef = ref(storage, `exercises/${Date.now()}_${name.replace(/\s+/g, '_')}.jpg`);

                    // Upload with timeout
                    await withTimeout(uploadString(storageRef, resized, 'data_url'), 15000, "Image Upload");

                    // Get URL with timeout
                    finalImageUrl = await withTimeout(getDownloadURL(storageRef), 5000, "Getting Image URL");
                    console.log("Upload successful:", finalImageUrl);
                } catch (imgError: any) {
                    console.error("Image processing failed:", imgError);
                    alert(`AVISO: Error con la imagen (${imgError.message || 'Desconocido'}). Se guardará el ejercicio SIN foto.`);
                    finalImageUrl = "";
                    // Continue execution - do not return
                }
            }
        }

        // 3. Firestore Save
        try {
            const exerciseData = {
                name,
                description: description || '',
                category,
                targetMuscle: targetMuscle || '',
                imageUrl: finalImageUrl
            };

            if (editingExercise) {
                await withTimeout(updateDoc(doc(db, 'exercises', editingExercise.id), exerciseData), 10000, "Updating Database");
            } else {
                await withTimeout(addDoc(collection(db, 'exercises'), exerciseData), 10000, "Saving to Database");
            }

            // Success
            setIsModalOpen(false);
            resetForm();
        } catch (dbError: any) {
            console.error("Database error:", dbError);
            alert(`ERROR CRÍTICO: No se pudo guardar en la base de datos. ${dbError.message || ''}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("¿Seguro que quieres eliminar este ejercicio de la biblioteca?")) return;
        try {
            await deleteDoc(doc(db, 'exercises', id));
        } catch (error) {
            console.error("Error deleting exercise:", error);
        }
    };

    const filteredExercises = exercises.filter(e =>
        e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-[#1F2128] text-white' : 'bg-[#F3F4F6] text-gray-900'} font-sans pb-32`}>
            <div className="max-w-md mx-auto px-6 pt-6 space-y-6">

                <TopHeader
                    title="Biblioteca"
                    subtitle="Ejercicios y Movimientos"
                    onBack={() => navigate(-1)}
                />

                <div className="flex gap-3">
                    <div className={`${isDarkMode ? 'bg-[#2A2D3A]' : 'bg-white shadow-sm'} flex-1 rounded-2xl flex items-center px-4 py-3 border ${isDarkMode ? 'border-white/5' : 'border-gray-200'}`}>
                        <Search size={20} className="text-gray-500 mr-3" />
                        <input
                            type="text"
                            placeholder="Buscar ejercicio..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-transparent border-none outline-none text-sm w-full font-medium"
                        />
                    </div>
                </div>

                <button
                    onClick={() => { setEditingExercise(null); setIsModalOpen(true); }}
                    className="w-full bg-[#FF1F40] py-5 rounded-[1.5rem] flex items-center justify-center gap-3 shadow-[0_10px_30px_rgba(255,31,64,0.3)] active:scale-95 transition-all text-white"
                >
                    <Plus size={24} strokeWidth={3} />
                    <span className="font-black uppercase tracking-widest text-sm text-white">Añadir Ejercicio</span>
                </button>

                <div className="space-y-4">
                    {isFetching ? (
                        <div className="flex justify-center py-10">
                            <Loader2 className="animate-spin text-[#FF1F40]" />
                        </div>
                    ) : filteredExercises.map(ex => (
                        <div key={ex.id} className={`${isDarkMode ? 'bg-[#2A2D3A] border-white/5' : 'bg-white border-gray-100 shadow-sm'} p-5 rounded-[2rem] border transition-all`}>
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500 overflow-hidden">
                                        {ex.imageUrl ? (
                                            <img src={ex.imageUrl} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <Dumbbell size={20} />
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="font-black uppercase italic leading-tight text-sm">{ex.name}</h3>
                                        <span className="text-[9px] font-black text-[#FF1F40] uppercase tracking-widest">{ex.category}</span>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => {
                                            setEditingExercise(ex);
                                            setIsModalOpen(true);
                                        }}
                                        className="p-2 text-gray-500 hover:text-blue-500 transition-colors"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button onClick={() => handleDelete(ex.id)} className="p-2 text-gray-500 hover:text-red-500 transition-colors">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                            <p className="text-[10px] text-gray-400 font-medium leading-relaxed">{ex.description}</p>
                            {ex.targetMuscle && (
                                <div className="mt-3 flex items-center gap-2">
                                    <Activity size={10} className="text-gray-500" />
                                    <span className="text-[9px] font-bold text-gray-500 uppercase">{ex.targetMuscle}</span>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <ExerciseFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                editingExercise={editingExercise}
                onSuccess={() => setIsModalOpen(false)}
            />
        </div>
    );
};

export default ExerciseLibrary;
