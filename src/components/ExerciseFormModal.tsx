import { useState, useEffect } from 'react';
import { Camera, Loader2, Check } from 'lucide-react';
import { db, storage } from '../firebase';
import { collection, addDoc, updateDoc, doc } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';

interface Exercise {
    id: string;
    name: string;
    description: string;
    category: string;
    targetMuscle?: string;
    imageUrl?: string;
}

interface ExerciseFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    editingExercise?: Exercise | null;
    onSuccess?: () => void;
}

const ExerciseFormModal = ({ isOpen, onClose, editingExercise, onSuccess }: ExerciseFormModalProps) => {
    const isDarkMode = document.documentElement.classList.contains('dark');

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('Fuerza');
    const [targetMuscle, setTargetMuscle] = useState('');
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (editingExercise) {
            setName(editingExercise.name);
            setDescription(editingExercise.description);
            setCategory(editingExercise.category);
            setTargetMuscle(editingExercise.targetMuscle || '');
            setImagePreview(editingExercise.imageUrl || null);
        } else {
            resetForm();
        }
    }, [editingExercise, isOpen]);

    const resetForm = () => {
        setName('');
        setDescription('');
        setCategory('Fuerza');
        setTargetMuscle('');
        setImagePreview(null);
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result as string);
            reader.readAsDataURL(file);
        }
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
                reject(new Error("Failed to load image for resizing"));
            };
        });
    };

    // Helper: Timeout wrapper
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
                    // Resize with timeout
                    const resized = await withTimeout(resizeImage(imagePreview), 6000, "Image Resizing");
                    const storageRef = ref(storage, `exercises/${Date.now()}_${name.replace(/\s+/g, '_')}.jpg`);
                    // Upload with timeout
                    await withTimeout(uploadString(storageRef, resized, 'data_url'), 15000, "Image Upload");
                    // Get URL with timeout
                    finalImageUrl = await withTimeout(getDownloadURL(storageRef), 5000, "Getting Image URL");
                } catch (imgError: any) {
                    console.error("Image processing failed:", imgError);
                    alert(`AVISO: Error con la imagen (${imgError.message || 'Desconocido'}). Se guardará el ejercicio SIN foto.`);
                    finalImageUrl = "";
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
            resetForm();
            if (onSuccess) onSuccess();
            onClose();
        } catch (dbError: any) {
            console.error("Database error:", dbError);
            alert(`ERROR CRÍTICO: No se pudo guardar en la base de datos. ${dbError.message || ''}`);
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
            <div className={`relative w-full max-w-sm ${isDarkMode ? 'bg-[#262932]' : 'bg-white'} rounded-[3rem] p-8 shadow-2xl animate-in zoom-in-95 duration-200`}>
                <h3 className="text-xl font-black italic uppercase mb-6">{editingExercise ? 'Editar' : 'Nuevo'} Ejercicio</h3>
                <form onSubmit={handleSave} className="space-y-4">
                    <div>
                        <label className="text-[10px] font-black text-gray-500 uppercase ml-1 mb-2 block">Nombre</label>
                        <input
                            required value={name} onChange={e => setName(e.target.value)}
                            className={`w-full ${isDarkMode ? 'bg-[#1F2128] border-white/5' : 'bg-gray-100 border-gray-200'} rounded-2xl px-5 py-4 outline-none border focus:border-[#FF1F40] font-bold`}
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-gray-500 uppercase ml-1 mb-2 block">Categoría</label>
                        <select
                            value={category} onChange={e => setCategory(e.target.value)}
                            className={`w-full ${isDarkMode ? 'bg-[#1F2128] border-white/5' : 'bg-gray-100 border-gray-200'} rounded-2xl px-5 py-4 outline-none border focus:border-[#FF1F40] font-bold`}
                        >
                            <option>Fuerza</option>
                            <option>Endurance</option>
                            <option>Gymnastics</option>
                            <option>WOD</option>
                            <option>Movilidad</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-gray-500 uppercase ml-1 mb-2 block">Músculo Objetivo</label>
                        <input
                            value={targetMuscle} onChange={e => setTargetMuscle(e.target.value)}
                            className={`w-full ${isDarkMode ? 'bg-[#1F2128] border-white/5' : 'bg-gray-100 border-gray-200'} rounded-2xl px-5 py-4 outline-none border focus:border-[#FF1F40] font-bold`}
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-gray-500 uppercase ml-1 mb-2 block">Imagen (Opcional)</label>
                        <label className={`aspect-video rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 cursor-pointer overflow-hidden relative ${isDarkMode ? 'border-gray-700 bg-black/20' : 'bg-gray-50 border-gray-200'}`}>
                            <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                            {imagePreview ? (
                                <img src={imagePreview} className="absolute inset-0 w-full h-full object-cover" alt="Preview" />
                            ) : (
                                <>
                                    <Camera size={24} className="text-gray-400" />
                                    <span className="text-[8px] font-black uppercase text-gray-500">Subir Demo</span>
                                </>
                            )}
                        </label>
                    </div>
                    <button type="submit" disabled={isSaving} className="w-full bg-[#FF1F40] py-4 rounded-2xl text-white font-black uppercase tracking-widest shadow-lg shadow-red-900/30 flex items-center justify-center gap-2">
                        {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Check size={20} />}
                        Guardar Ejercicio
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ExerciseFormModal;
