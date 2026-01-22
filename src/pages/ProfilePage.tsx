import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import {
    User,
    Settings,
    Bell,
    Lock,
    FileText,
    LogOut,
    ChevronRight,
    Camera,
    ChevronLeft
} from 'lucide-react';
import BottomNavigation from '../components/BottomNavigation';
import EditProfileModal from '../components/EditProfileModal';

const ProfilePage = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState<any>(null);
    const [userData, setUserData] = useState<any>(null);
    const [role, setRole] = useState<string>('user');
    const [isDarkMode, setIsDarkMode] = useState(() => document.documentElement.classList.contains('dark'));
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    useEffect(() => {
        const currentUser = auth.currentUser;
        if (currentUser) {
            setUser(currentUser);
            fetchUserData(currentUser.uid);
        } else {
            navigate('/');
        }
    }, []);

    useEffect(() => {
        // Sync initial state in case it changed before mount
        setIsDarkMode(document.documentElement.classList.contains('dark'));

        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'class') {
                    setIsDarkMode(document.documentElement.classList.contains('dark'));
                }
            });
        });
        observer.observe(document.documentElement, { attributes: true });
        return () => observer.disconnect();
    }, []);

    const fetchUserData = async (uid: string) => {
        try {
            // Try to find user in 'users' collection first
            let userDoc = await getDoc(doc(db, 'users', uid));
            let roleFound = 'user';

            if (!userDoc.exists()) {
                // Try 'coaches'
                userDoc = await getDoc(doc(db, 'coaches', uid));
                if (userDoc.exists()) roleFound = 'coach';
                else {
                    // Try 'admins' (if exists) or just assume admin based on custom claims if we had them, 
                    // but for now let's check a specialized admin doc or just use basic auth info
                    // creating a fallback
                    roleFound = 'user';
                }
            }

            if (userDoc.exists()) {
                setUserData({ ...userDoc.data(), role: roleFound });
                setRole(roleFound); // Update state role
            } else {
                // If no doc, use Auth data
                setUserData({
                    displayName: auth.currentUser?.displayName,
                    email: auth.currentUser?.email,
                    photoURL: auth.currentUser?.photoURL
                });
            }
        } catch (error) {
            console.error("Error fetching user data:", error);
        }
    };

    const handleLogout = async () => {
        if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
            await signOut(auth);
            navigate('/');
        }
    };

    const MenuItem = ({ icon: Icon, label, subtitle, onClick, isDestructive = false }: any) => (
        <button
            onClick={onClick}
            className={`w-full flex items-center justify-between p-4 rounded-3xl mb-3 transition-all active:scale-[0.98] ${isDarkMode
                ? 'bg-[#2A2D3A] hover:bg-[#323644]'
                : 'bg-white hover:bg-gray-50 shadow-sm border border-gray-100'
                }`}
        >
            <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isDestructive
                    ? 'bg-red-50 text-red-500 dark:bg-red-900/20'
                    : isDarkMode ? 'bg-[#1F2128] text-white' : 'bg-gray-100 text-gray-600'
                    }`}>
                    <Icon size={22} strokeWidth={2} />
                </div>
                <div className="text-left">
                    <span className={`block font-bold text-sm ${isDestructive ? 'text-red-500' : isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {label}
                    </span>
                    {subtitle && (
                        <span className="text-xs text-gray-400 font-medium">{subtitle}</span>
                    )}
                </div>
            </div>
            <ChevronRight size={18} className="text-gray-400" />
        </button>
    );

    return (
        <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-[#1F2128] text-white' : 'bg-[#F3F4F6] text-gray-900'} font-sans pb-32`}>

            {/* Header */}
            <div className={`sticky top-0 z-50 px-6 py-4 flex items-center gap-4 ${isDarkMode ? 'bg-[#1F2128]/80' : 'bg-[#F3F4F6]/80'} backdrop-blur-md`}>
                <button onClick={() => navigate(-1)} className={`p-2 rounded-full ${isDarkMode ? 'hover:bg-white/10' : 'hover:bg-gray-200'} transition-colors`}>
                    <ChevronLeft size={24} />
                </button>
                <h1 className="text-xl font-black uppercase tracking-tight">Ajustes</h1>
            </div>

            <div className="max-w-md mx-auto px-6 pt-4">

                {/* Hero Profile */}
                <div className="flex flex-col items-center mb-10">
                    <div className="relative mb-4">
                        <div className="w-28 h-28 rounded-full border-4 border-[#FF1F40] p-1 overflow-hidden">
                            <img
                                src={userData?.photoURL || user?.photoURL || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400"}
                                alt="Profile"
                                className="w-full h-full rounded-full object-cover"
                            />
                        </div>
                    </div>
                    <h2 className="text-2xl font-black text-center">{userData?.displayName || user?.displayName || 'Usuario'}</h2>
                    <p className="text-gray-500 font-medium text-sm">{user?.email}</p>
                    {userData?.role === 'coach' && (
                        <span className="mt-2 px-3 py-1 bg-[#FF1F40] text-white text-[10px] font-black uppercase rounded-full">
                            Coach
                        </span>
                    )}
                    {userData?.role === 'admin' && (
                        <span className="mt-2 px-3 py-1 bg-black text-white text-[10px] font-black uppercase rounded-full">
                            Admin
                        </span>
                    )}
                </div>

                {/* GESTION DE CUENTA */}
                <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-4 ml-2">Gestión de Cuenta</h3>

                <div className={`${isDarkMode ? 'bg-[#262932]' : 'bg-white'} rounded-[2.5rem] p-4 shadow-xl shadow-gray-200/50 dark:shadow-none mb-8`}>
                    <MenuItem
                        icon={User}
                        label="Editar Perfil"
                        subtitle="Nombre, email, teléfono"
                        onClick={() => setIsEditModalOpen(true)}
                    />
                    <MenuItem
                        icon={Lock}
                        label="Cambiar Contraseña"
                        onClick={() => { }} // Placeholder
                    />
                    <MenuItem
                        icon={Bell}
                        label="Gestión de Notificaciones"
                        onClick={() => navigate('/notification-settings')}
                    />
                </div>

                {/* LEGAL */}
                <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-4 ml-2">Legal</h3>

                <div className={`${isDarkMode ? 'bg-[#262932]' : 'bg-white'} rounded-[2.5rem] p-4 shadow-xl shadow-gray-200/50 dark:shadow-none mb-10`}>
                    <MenuItem
                        icon={FileText}
                        label="Legal y Privacidad"
                        onClick={() => navigate('/legal')}
                    />
                </div>

                {/* LOGOUT */}
                <button
                    onClick={handleLogout}
                    className="w-full bg-white border-2 border-red-50 text-red-500 font-black uppercase tracking-widest py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-red-50 transition-colors mb-8 shadow-lg shadow-red-100/50"
                >
                    <LogOut size={20} />
                    Cerrar Sesión
                </button>

                <p className="text-center text-xs text-gray-400 font-medium pb-8">
                    Almodovar Group App v2.4.1
                </p>

            </div>

            <BottomNavigation role={userData?.role || 'user'} activeTab="profile" />

            <EditProfileModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                userData={userData}
                onUpdate={(newData: any) => setUserData({ ...userData, ...newData })}
            />
        </div>
    );
};

export default ProfilePage;
