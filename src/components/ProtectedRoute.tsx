import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import SplashScreen from './SplashScreen';
import { Pause, LogOut } from 'lucide-react';

interface ProtectedRouteProps {
    allowedRoles?: string[];
}

export const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
    const { currentUser, userData, loading, signOut } = useAuth();

    if (loading) {
        return <SplashScreen onFinish={() => {}} />;
    }

    if (!currentUser) {
        return <Navigate to="/login" replace />;
    }

    // Block paused users (only user/coach — admins are never paused)
    if (userData && userData.pausado && userData.role !== 'admin') {
        return (
            <div className="bg-[#111111] text-gray-200 min-h-screen flex items-center justify-center selection:bg-[#E13038] selection:text-white">
                <div className="max-w-[400px] mx-6 text-center flex flex-col items-center">
                    <div className="w-20 h-20 rounded-full bg-yellow-500/15 flex items-center justify-center mb-6">
                        <Pause size={40} className="text-yellow-500" />
                    </div>
                    <h1 className="text-2xl font-black uppercase text-white tracking-tight mb-3">
                        Cuenta Pausada
                    </h1>
                    <p className="text-sm text-gray-400 leading-relaxed mb-8">
                        Tu cuenta ha sido pausada temporalmente. 
                        Para más información, ponte en contacto con el administrador.
                    </p>
                    <button
                        onClick={signOut}
                        className="flex items-center gap-2 bg-[#E13038] text-white font-bold uppercase tracking-widest text-xs px-8 py-4 rounded-xl hover:bg-[#c52930] transition-all active:scale-95 shadow-lg shadow-[#E13038]/20"
                    >
                        <LogOut size={16} />
                        Cerrar Sesión
                    </button>
                </div>
            </div>
        );
    }

    if (allowedRoles && userData && !allowedRoles.includes(userData.role)) {
        return <Navigate to="/dashboard" replace />;
    }

    return <Outlet />;
};
