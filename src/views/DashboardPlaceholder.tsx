import { useAuth } from '../contexts/AuthContext';
import { LogOut } from 'lucide-react';

const DashboardPlaceholder = () => {
    const { userData, signOut } = useAuth();

    return (
        <div className="min-h-screen bg-[#1F2128] text-white p-6 flex flex-col items-center">
            
            <header className="w-full flex justify-between items-center mb-10 pt-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full border-2 border-[#FF1F40] overflow-hidden flex items-center justify-center bg-white">
                        <img src="/logo.jpeg" alt="Logo" className="w-[120%] h-[120%] object-cover" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black italic tracking-tighter uppercase leading-none">Almodovar</h2>
                        <p className="text-[#FF1F40] text-xs font-bold uppercase tracking-widest">Dashboard</p>
                    </div>
                </div>
                <button 
                    onClick={signOut}
                    className="p-2 bg-gray-800 rounded-full text-gray-400 hover:text-white hover:bg-[#FF1F40]/20 transition-all"
                >
                    <LogOut className="w-5 h-5" />
                </button>
            </header>

            <div className="w-full bg-gray-800/50 border border-gray-700 p-6 rounded-2xl md:max-w-xl text-center">
                <h1 className="text-2xl font-bold mb-2">Bienvenido, {userData?.displayName || 'Socio'}</h1>
                <div className="mt-4 inline-block px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#FF1F40]/20 text-[#FF1F40] border border-[#FF1F40]/50 mb-6">
                    Rol Mapeado: {userData?.role}
                </div>

                <div className="grid grid-cols-2 gap-4 mt-6">
                    <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-700/50">
                        <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Créditos</p>
                        <p className="text-3xl font-black italic">{userData?.credits || 0}</p>
                    </div>
                    <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-700/50">
                        <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Tu UID</p>
                        <p className="text-xs text-gray-500 font-mono truncate">{userData?.uid}</p>
                    </div>
                </div>
            </div>

            <p className="text-gray-500 text-sm mt-10 text-center max-w-sm">
                Fase 3 Completada. El sistema de Autenticación, Roles y Base de Datos inicial está conectado.
            </p>

        </div>
    );
};

export default DashboardPlaceholder;
