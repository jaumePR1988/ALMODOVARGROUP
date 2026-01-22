import React, { useState, useEffect } from 'react';
import { X, Camera, Save, Loader2 } from 'lucide-react';
import { auth, db, storage } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { updateProfile } from 'firebase/auth';

const EditProfileModal = ({ isOpen, onClose, userData, onUpdate }: any) => {
    const [formData, setFormData] = useState({
        displayName: '',
        phoneNumber: '',
        weight: '',
        height: '',
        photoURL: ''
    });
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (userData) {
            setFormData({
                displayName: userData.displayName || '',
                phoneNumber: userData.phoneNumber || '',
                weight: userData.weight || '',
                height: userData.height || '',
                photoURL: userData.photoURL || ''
            });
            setPreviewUrl(userData.photoURL || '');
        }
    }, [userData]);

    const compressImage = (file: File): Promise<File> => {
        return new Promise((resolve, reject) => {
            const maxWidth = 800; // Resize to reasonable max width
            const maxHeight = 800;
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target?.result as string;
                img.onload = () => {
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > maxWidth) {
                            height *= maxWidth / width;
                            width = maxWidth;
                        }
                    } else {
                        if (height > maxHeight) {
                            width *= maxHeight / height;
                            height = maxHeight;
                        }
                    }

                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0, width, height);

                    canvas.toBlob((blob) => {
                        if (blob) {
                            const compressedFile = new File([blob], file.name, {
                                type: 'image/jpeg',
                                lastModified: Date.now(),
                            });
                            resolve(compressedFile);
                        } else {
                            reject(new Error("Compression failed"));
                        }
                    }, 'image/jpeg', 0.7); // 70% quality
                };
            };
            reader.onerror = (error) => reject(error);
        });
    };

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            try {
                // Show preview immediately
                setPreviewUrl(URL.createObjectURL(file));

                // Compress in background
                const compressed = await compressImage(file);
                setImageFile(compressed);
            } catch (err) {
                console.error("Compression error:", err);
                // Fallback to original
                setImageFile(file);
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const user = auth.currentUser;
            if (!user) return;

            let newPhotoURL = formData.photoURL;

            // 1. Upload new image if exists
            if (imageFile) {
                const storageRef = ref(storage, `profile_photos/${user.uid}_${Date.now()}`);
                await uploadBytes(storageRef, imageFile);
                newPhotoURL = await getDownloadURL(storageRef);
            }

            // 2. Update Auth Profile
            if (user.displayName !== formData.displayName || newPhotoURL !== user.photoURL) {
                await updateProfile(user, {
                    displayName: formData.displayName,
                    photoURL: newPhotoURL
                });
            }

            // 3. Update Firestore (users or coaches collection)
            const collectionName = userData.role === 'coach' ? 'coaches' : 'users';
            const userRef = doc(db, collectionName, user.uid);

            const updateData = {
                displayName: formData.displayName,
                phoneNumber: formData.phoneNumber,
                weight: formData.weight, // "Ficha inicial" data
                height: formData.height,
                photoURL: newPhotoURL
            };

            await updateDoc(userRef, updateData);

            // Notify parent
            onUpdate({ ...userData, ...updateData });
            onClose();
        } catch (error) {
            console.error("Error updating profile:", error);
            alert("Error al actualizar el perfil. Inténtalo de nuevo.");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-[#1F2128] w-full max-w-md rounded-[2rem] overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-white/5">
                    <h2 className="text-xl font-black italic uppercase tracking-tight dark:text-white">Editar Perfil</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors">
                        <X size={20} className="dark:text-white" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">

                    {/* Photo Upload */}
                    <div className="flex flex-col items-center gap-4">
                        <div className="relative group cursor-pointer">
                            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-gray-100 dark:border-white/10 group-hover:border-[#FF1F40] transition-colors">
                                <img src={previewUrl || "https://via.placeholder.com/150"} alt="Preview" className="w-full h-full object-cover" />
                            </div>
                            <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-full cursor-pointer text-white">
                                <Camera size={24} />
                                <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                            </label>
                            <div className="absolute bottom-0 right-0 bg-[#FF1F40] rounded-full p-2 text-white shadow-lg pointer-events-none">
                                <Camera size={12} />
                            </div>
                        </div>
                        <p className="text-xs text-gray-400 font-medium">Toca para cambiar foto</p>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-black uppercase tracking-wider text-gray-400 mb-1 ml-1">Nombre Completo</label>
                            <input
                                type="text"
                                value={formData.displayName}
                                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                                className="w-full bg-gray-50 dark:bg-[#2A2D3A] rounded-xl px-4 py-3 font-bold dark:text-white border-2 border-transparent focus:border-[#FF1F40] focus:outline-none transition-all"
                                placeholder="Tu Nombre"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-black uppercase tracking-wider text-gray-400 mb-1 ml-1">Teléfono</label>
                            <input
                                type="tel"
                                value={formData.phoneNumber}
                                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                                className="w-full bg-gray-50 dark:bg-[#2A2D3A] rounded-xl px-4 py-3 font-bold dark:text-white border-2 border-transparent focus:border-[#FF1F40] focus:outline-none transition-all"
                                placeholder="+34 600 000 000"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-black uppercase tracking-wider text-gray-400 mb-1 ml-1">Peso (kg)</label>
                                <input
                                    type="text"
                                    value={formData.weight}
                                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                                    className="w-full bg-gray-50 dark:bg-[#2A2D3A] rounded-xl px-4 py-3 font-bold dark:text-white border-2 border-transparent focus:border-[#FF1F40] focus:outline-none transition-all"
                                    placeholder="Ej: 75"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black uppercase tracking-wider text-gray-400 mb-1 ml-1">Altura (cm)</label>
                                <input
                                    type="text"
                                    value={formData.height}
                                    onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                                    className="w-full bg-gray-50 dark:bg-[#2A2D3A] rounded-xl px-4 py-3 font-bold dark:text-white border-2 border-transparent focus:border-[#FF1F40] focus:outline-none transition-all"
                                    placeholder="Ej: 180"
                                />
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#FF1F40] hover:bg-[#d91230] text-white py-4 rounded-xl font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-red-500/30 transition-all active:scale-95 disabled:opacity-70 disabled:active:scale-100"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                        {loading ? 'Guardando...' : 'Guardar Cambios'}
                    </button>

                </form>
            </div>
        </div>
    );
};

export default EditProfileModal;
