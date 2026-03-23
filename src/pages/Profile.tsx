import { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { KeyRound, Mail, Camera, Save, Edit2 } from 'lucide-react';
import { sendPasswordResetEmail, updateProfile } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from '../firebase';
import AdminNavBar from '../components/AdminNavBar';
import CoachNavBar from '../components/CoachNavBar';
import UserNavBar from '../components/UserNavBar';
import UserTopBar from '../components/UserTopBar';

const Profile = () => {
    const { userData, currentUser } = useAuth();
    const [isResetting, setIsResetting] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    
    // Edit Profile State
    const [isEditing, setIsEditing] = useState(false);
    const [newName, setNewName] = useState(userData?.displayName || '');
    const [isSaving, setIsSaving] = useState(false);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(userData?.photoURL || null);
    const fileInputRef = useRef<HTMLInputElement>(null);


    const handlePasswordReset = async () => {
        if (!currentUser?.email) return;
        setIsResetting(true);
        setMessage({ type: '', text: '' });
        
        try {
            await sendPasswordResetEmail(auth, currentUser.email);
            setMessage({ type: 'success', text: 'Se ha enviado un enlace a tu correo para restablecer la contraseña.' });
        } catch (error: any) {
            setMessage({ type: 'error', text: 'Vaya, hubo un error al enviar el correo. Inténtalo de nuevo.' });
            console.error("Error sending password reset email", error);
        } finally {
            setIsResetting(false);
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
            setIsEditing(true); // Active save button
        }
    };

    const handleSaveProfile = async () => {
        if (!currentUser || !userData) return;
        setIsSaving(true);
        setMessage({ type: '', text: '' });

        try {
            let finalPhotoURL = userData.photoURL || '';

            // Upload image if a new one is selected
            if (imageFile) {
                const imageRef = ref(storage, `coach_avatars/${currentUser.uid}_${Date.now()}`);
                const uploadResult = await uploadBytes(imageRef, imageFile);
                finalPhotoURL = await getDownloadURL(uploadResult.ref);
            }

            // Update Auth Profile
            await updateProfile(currentUser, { 
                displayName: newName,
                ...(finalPhotoURL && { photoURL: finalPhotoURL })
            });

            // Update Users collection
            const userRef = doc(db, 'users', currentUser.uid);
            await updateDoc(userRef, { 
                displayName: newName,
                photoURL: finalPhotoURL
            });


            setMessage({ type: 'success', text: 'Perfil actualizado correctamente.' });
            setIsEditing(false);
            
            // Reload window to refetch user context simply
            setTimeout(() => window.location.reload(), 1500);

        } catch (error: any) {
            console.error("Error saving profile:", error);
            setMessage({ type: 'error', text: 'Hubo un error al guardar el perfil.' });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="bg-[#111111] text-gray-200 min-h-screen pb-safe font-sans selection:bg-[#E13038] selection:text-white relative overflow-x-hidden">
            {/* Header / Config Bar */}
            <UserTopBar />

            {/* Main Content */}
            <main className="pt-28 pb-32 px-6 max-w-[480px] mx-auto min-h-screen">
                
                {/* Profile Picture */}
                <div className="flex flex-col items-center mb-8 relative">
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleImageChange} 
                        accept="image/*" 
                        className="hidden" 
                    />
                    <div 
                        className="relative group cursor-pointer mb-4"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <div className="w-28 h-28 rounded-full border-4 border-[#333] overflow-hidden bg-[#1A1A1A]">
                            <img 
                                alt="Coach Avatar" 
                                className="w-full h-full object-cover" 
                                src={imagePreview ? imagePreview : `https://ui-avatars.com/api/?name=${userData?.displayName}&background=1A1A1A&color=E13038&bold=true&size=200`}
                            />
                        </div>
                        <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white">
                            <Camera size={24} className="mb-1" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-center leading-tight">Cambiar<br/>Foto</span>
                        </div>
                    </div>
                    
                    {isEditing ? (
                        <input 
                            type="text"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            className="bg-[#1c1b1b] border border-[#333] text-white text-xl font-black text-center rounded-xl px-4 py-2 focus:outline-none focus:border-[#E13038] w-full max-w-[250px] transition-colors"
                        />
                    ) : (
                        <div className="flex items-center gap-2">
                            <h2 className="text-2xl font-black text-white">{userData?.displayName}</h2>
                            <button onClick={() => setIsEditing(true)} className="text-gray-500 hover:text-white transition-colors">
                                <Edit2 size={16} />
                            </button>
                        </div>
                    )}
                    <p className="text-sm font-bold text-[#E13038] uppercase tracking-widest mt-1">
                        {userData?.role === 'admin' ? 'Administrador' : userData?.role === 'coach' ? 'Coach Almodóvar' : 'Socio'}
                    </p>
                    
                    {isEditing && (
                        <button 
                            onClick={handleSaveProfile}
                            disabled={isSaving || !newName.trim()}
                            className="mt-4 flex items-center justify-center gap-2 bg-[#E13038] hover:bg-[#c2242a] text-white px-6 py-2.5 rounded-xl font-bold uppercase tracking-widest transition-all active:scale-95 shadow-[0_4px_15px_rgba(225,48,56,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSaving ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    <Save size={16} />
                                    Guardar
                                </>
                            )}
                        </button>
                    )}
                </div>

                <div className="space-y-6">
                    {/* Data Card */}
                    <div className="bg-[#1c1b1b] border border-[#333] rounded-3xl p-6">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#E13038]"></span>
                            Tus Datos
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 block mb-1">Nombre Completo</label>
                                <div className="bg-[#2a2a2a] text-white px-4 py-3 rounded-xl text-sm font-medium border border-[#333]">
                                    {userData?.displayName}
                                </div>
                            </div>
                            
                            <div>
                                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 block mb-1">Correo Electrónico</label>
                                <div className="bg-[#2a2a2a] text-white px-4 py-3 rounded-xl text-sm font-medium border border-[#333] flex items-center gap-3">
                                    <Mail size={16} className="text-gray-400" />
                                    {currentUser?.email}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Security Card */}
                    <div className="bg-[#1c1b1b] border border-[#333] rounded-3xl p-6">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#E13038]"></span>
                            Seguridad
                        </h3>

                        {message.text && (
                            <div className={`p-4 rounded-xl mb-4 text-sm font-medium ${message.type === 'success' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                                {message.text}
                            </div>
                        )}

                        <p className="text-sm text-gray-400 mb-4">
                            Al solicitar un cambio de contraseña, te enviaremos un correo con un enlace seguro para que puedas establecer una nueva.
                        </p>

                        <button 
                            onClick={handlePasswordReset}
                            disabled={isResetting}
                            className="w-full flex items-center justify-center gap-3 bg-[#E13038]/10 hover:bg-[#E13038]/20 text-[#E13038] py-4 rounded-xl font-bold uppercase tracking-widest border border-[#E13038]/30 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isResetting ? (
                                <div className="w-5 h-5 border-2 border-[#E13038] border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    <KeyRound size={18} />
                                    Cambiar Contraseña
                                </>
                            )}
                        </button>
                    </div>
                </div>

            </main>

            {userData?.role === 'admin' && <AdminNavBar />}
            {userData?.role === 'coach' && <CoachNavBar />}
            {userData?.role === 'user' && <UserNavBar />}
        </div>
    );
};

export default Profile;
