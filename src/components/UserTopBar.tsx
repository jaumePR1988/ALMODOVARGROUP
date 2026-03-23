import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, Bell } from 'lucide-react';
import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

const UserTopBar = () => {
    const { signOut, userData } = useAuth();
    const navigate = useNavigate();
    const [hasUnread, setHasUnread] = useState(false);

    useEffect(() => {
        if (!userData?.uid) return;
        
        // Escucha en tiempo real de notificaciones no leídas
        const q = query(
            collection(db, 'notifications'), 
            where('userId', '==', userData.uid), 
            where('read', '==', false)
        );
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setHasUnread(!snapshot.empty);
        }, (error) => {
            console.error("Error cargando notificaciones:", error);
        });
        
        return () => unsubscribe();
    }, [userData?.uid]);

    const handleLogout = async () => {
        try {
            if (signOut) await signOut();
            navigate('/login');
        } catch (error) {
            console.error("Error logging out:", error);
        }
    };

    return (
        <header className="fixed top-0 left-1/2 -translate-x-1/2 w-full z-50 flex justify-between items-center px-6 h-20 max-w-[480px] bg-[#111111]/90 backdrop-blur-xl border-b border-white/5">
            <div className="flex items-center gap-3">
                <img src="/logo.png" alt="Logo" className="w-12 h-12 rounded-lg object-contain" />
                <h1 className="text-xl font-black tracking-tighter text-[#E13038] uppercase">
                    ALMODÓVAR
                </h1>
            </div>
            
            <div className="flex items-center gap-3">
                <button 
                    onClick={() => navigate('/notificaciones')}
                    className="relative w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                    <Bell size={20} />
                    {hasUnread && (
                        <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-[#E13038] rounded-full animate-pulse border-2 border-[#111111]"></span>
                    )}
                </button>
                
                <button 
                    onClick={handleLogout}
                    className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-[#E13038] hover:bg-white/10 transition-colors active:scale-95"
                >
                    <LogOut size={20} />
                </button>
            </div>
        </header>
    );
};

export default UserTopBar;
