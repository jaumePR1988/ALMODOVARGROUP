import { Link, useLocation } from 'react-router-dom';
import { Home, Calendar, User } from 'lucide-react';

const UserNavBar = () => {
    const location = useLocation();

    return (
        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-[#111111]/90 backdrop-blur-xl border-t border-[#333] z-50 pb-safe">
            <div className="flex justify-around items-center h-20 px-6">
                <Link to="/dashboard" className={`flex flex-col items-center gap-1.5 transition-colors active:scale-95 duration-100 ${location.pathname === '/dashboard' ? 'text-[#E13038]' : 'text-gray-500 hover:text-gray-300'}`}>
                    <Home size={24} className={location.pathname === '/dashboard' ? 'fill-current' : ''} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Inicio</span>
                </Link>
                
                {/* Botón de Reservar */}
                <Link to="/reservar" className={`flex flex-col items-center gap-1.5 transition-colors active:scale-95 duration-100 ${location.pathname === '/reservar' ? 'text-[#E13038]' : 'text-gray-500 hover:text-gray-300'}`}>
                    <Calendar size={24} className={location.pathname === '/reservar' ? 'fill-[#E13038]/20' : ''} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Reservar</span>
                </Link>

                {/* Botón de Perfil */}
                <Link to="/profile" className={`flex flex-col items-center gap-1.5 transition-colors active:scale-95 duration-100 ${location.pathname === '/profile' ? 'text-[#E13038]' : 'text-gray-500 hover:text-gray-300'}`}>
                    <User size={24} className={location.pathname === '/profile' ? 'fill-[#E13038]/20' : ''} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Perfil</span>
                </Link>
            </div>
        </nav>
    );
};

export default UserNavBar;
