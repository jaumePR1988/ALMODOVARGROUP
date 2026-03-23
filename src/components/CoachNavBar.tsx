import { useState } from 'react';
import { Calendar, User, Plus, Dumbbell, Bell, Library } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const CoachNavBar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const location = useLocation();

    const isActive = (path: string) => location.pathname === path;

    return (
        <>
            {/* Overlay for Half Moon Menu */}
            {isOpen && (
                <div 
                    className="fixed inset-0 z-[40] bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Floating Action Menu (Half Moon) - 3 Items */}
            <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[45] pointer-events-none w-full max-w-[480px]">
                <div className="relative w-full h-full flex justify-center items-end">
                    
                    {/* Botón 2: Creador WOD (Top Centro) */}
                    <div className={`absolute bottom-8 transition-all duration-300 delay-[50ms] ease-out flex flex-col items-center gap-2 ${isOpen ? '-translate-y-[100px] scale-100 opacity-100 pointer-events-auto' : 'translate-y-0 scale-50 opacity-0'}`}>
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#E13038] drop-shadow-md pb-1">Creador WOD</span>
                        <Link 
                            to="/coach/wod-builder"
                            onClick={() => setIsOpen(false)}
                            className="w-16 h-16 bg-[#E13038] border border-[#E13038]/50 rounded-full flex items-center justify-center text-white shadow-[0_0_20px_rgba(225,48,56,0.5)] active:scale-90 hover:bg-[#c2242a] group"
                        >
                            <Dumbbell size={28} className="transition-colors" />
                        </Link>
                    </div>

                    {/* Botón 3: Avisos / Notificaciones */}
                    <div className={`absolute bottom-8 transition-all duration-300 delay-[100ms] ease-out flex flex-col items-center gap-2 ${isOpen ? 'translate-x-[75px] -translate-y-[60px] scale-100 opacity-100 pointer-events-auto' : 'translate-x-0 translate-y-0 scale-50 opacity-0'}`}>
                        <span className="text-[10px] font-black uppercase tracking-widest text-white drop-shadow-md text-center leading-none pb-1">Avisos</span>
                        <Link 
                            to="/notificaciones"
                            onClick={() => setIsOpen(false)}
                            className="w-14 h-14 bg-[#1A1A1A] border border-[#333] rounded-full flex items-center justify-center text-white shadow-lg active:scale-90 hover:border-[#E13038] group"
                        >
                            <Bell size={24} className="group-hover:text-[#E13038] transition-colors" />
                        </Link>
                    </div>

                    {/* Botón 1: Biblioteca Ejercicios (Izquierda) */}
                    <div className={`absolute bottom-8 transition-all duration-300 ease-out flex flex-col items-center gap-2 ${isOpen ? 'translate-x-[-75px] -translate-y-[60px] scale-100 opacity-100 pointer-events-auto' : 'translate-x-0 translate-y-0 scale-50 opacity-0'}`}>
                        <span className="text-[10px] font-black uppercase tracking-widest text-white drop-shadow-md text-center leading-none pb-1">Biblioteca<br/>Ejercicios</span>
                        <Link 
                            to="/coach/exercises"
                            onClick={() => setIsOpen(false)}
                            className="w-14 h-14 bg-[#1A1A1A] border border-[#333] rounded-full flex items-center justify-center text-white shadow-lg active:scale-90 hover:border-[#E13038] group"
                        >
                            <Library size={24} className="group-hover:text-[#E13038] transition-colors" />
                        </Link>
                    </div>
                </div>
            </div>

            {/* BottomNavBar Base */}
            <nav className="fixed bottom-0 w-full max-w-[480px] left-1/2 -translate-x-1/2 rounded-t-xl z-50 bg-[#131313]/95 backdrop-blur-xl border-t border-white/5 shadow-[0_-10px_30px_rgba(0,0,0,0.5)] pb-safe">
                <div className="flex justify-between items-center h-20 px-10 relative">
                    
                    {/* Left: Mis Clases */}
                    <Link to="/coach" className={`flex flex-col items-center justify-center transition-all active:scale-90 duration-200 relative ${isActive('/coach') ? 'text-[#E13038]' : 'text-gray-500 hover:text-white'}`}>
                        <Calendar size={24} />
                        <span className="font-medium text-[10px] tracking-widest uppercase mt-1">Mis Clases</span>
                        {isActive('/coach') && <span className="absolute -bottom-1 w-1 h-1 bg-[#E13038] rounded-full"></span>}
                    </Link>
                    
                    {/* Center: FAB (Floating Action Button) */}
                    <div className="absolute left-1/2 -translate-x-1/2 -top-6">
                        <button 
                            onClick={() => setIsOpen(!isOpen)}
                            className={`w-14 h-14 rounded-full flex items-center justify-center text-white shadow-[0_0_20px_rgba(225,48,56,0.4)] transition-all duration-300 active:scale-90 ${isOpen ? 'bg-[#333] rotate-45 border border-[#444]' : 'bg-[#E13038] rotate-0'}`}
                        >
                            <Plus size={32} />
                        </button>
                    </div>
                    
                    {/* Right: Perfil */}
                    <Link to="/profile" className={`flex flex-col items-center justify-center transition-all active:scale-90 duration-200 relative ${isActive('/profile') ? 'text-[#E13038]' : 'text-gray-500 hover:text-white'}`}>
                        <User size={24} />
                        <span className="font-medium text-[10px] tracking-widest uppercase mt-1">Perfil</span>
                        {isActive('/profile') && <span className="absolute -bottom-1 w-1 h-1 bg-[#E13038] rounded-full"></span>}
                    </Link>
                </div>
            </nav>
        </>
    );
};

export default CoachNavBar;
