import { useState } from 'react';
import { LayoutDashboard, Settings, Plus, Users, Calendar, Bell } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const AdminNavBar = () => {
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

            {/* Floating Action Menu (Half Moon) - 5 Items */}
            <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[45] pointer-events-none w-full max-w-[480px]">
                <div className="relative w-full h-full flex justify-center items-end">
                    
                    {/* Botón 1: Usuarios */}
                    <div className={`absolute bottom-8 transition-all duration-300 ease-out flex flex-col items-center gap-2 ${isOpen ? 'translate-x-[-100px] -translate-y-[50px] scale-100 opacity-100 pointer-events-auto' : 'translate-x-0 translate-y-0 scale-50 opacity-0'}`}>
                        <Link 
                            to="/admin/users" 
                            onClick={() => setIsOpen(false)}
                            className="w-14 h-14 bg-[#1A1A1A] border border-[#333] rounded-full flex items-center justify-center text-white shadow-lg active:scale-90 hover:border-[#E13038] group"
                        >
                            <Users size={24} className="group-hover:text-[#E13038] transition-colors" />
                        </Link>
                        <span className="text-[10px] font-black uppercase tracking-widest text-white drop-shadow-md">Usuarios</span>
                    </div>

                    {/* Botón 2: Clases */}
                    <div className={`absolute bottom-8 transition-all duration-300 delay-[50ms] ease-out flex flex-col items-center gap-2 ${isOpen ? 'translate-x-[-40px] -translate-y-[110px] scale-100 opacity-100 pointer-events-auto' : 'translate-x-0 translate-y-0 scale-50 opacity-0'}`}>
                        <Link 
                            to="/admin/classes"
                            onClick={() => setIsOpen(false)}
                            className="w-14 h-14 bg-[#1A1A1A] border border-[#333] rounded-full flex items-center justify-center text-white shadow-lg active:scale-90 hover:border-[#E13038] group"
                        >
                            <Calendar size={24} className="group-hover:text-[#E13038] transition-colors" />
                        </Link>
                        <span className="text-[10px] font-black uppercase tracking-widest text-white drop-shadow-md">Clases</span>
                    </div>

                    {/* Botón 3: Modos */}
                    <div className={`absolute bottom-8 transition-all duration-300 delay-[100ms] ease-out flex flex-col items-center gap-2 ${isOpen ? 'translate-x-[40px] -translate-y-[110px] scale-100 opacity-100 pointer-events-auto' : 'translate-x-0 translate-y-0 scale-50 opacity-0'}`}>
                        <Link 
                            to="/admin/modes"
                            onClick={() => setIsOpen(false)}
                            className="w-14 h-14 bg-[#1A1A1A] border border-[#333] rounded-full flex items-center justify-center text-white shadow-lg active:scale-90 hover:border-[#E13038] group"
                        >
                            <Settings size={24} className="group-hover:text-[#E13038] transition-colors" />
                        </Link>
                        <span className="text-[10px] font-black uppercase tracking-widest text-white drop-shadow-md">Modos</span>
                    </div>

                    {/* Botón 4: Avisos */}
                    <div className={`absolute bottom-8 transition-all duration-300 delay-[150ms] ease-out flex flex-col items-center gap-2 ${isOpen ? 'translate-x-[100px] -translate-y-[50px] scale-100 opacity-100 pointer-events-auto' : 'translate-x-0 translate-y-0 scale-50 opacity-0'}`}>
                        <Link 
                            to="/notificaciones"
                            onClick={() => setIsOpen(false)}
                            className="w-14 h-14 bg-[#1A1A1A] border border-[#333] rounded-full flex items-center justify-center text-white shadow-lg active:scale-90 hover:border-[#E13038] group"
                        >
                            <Bell size={24} className="group-hover:text-[#E13038] transition-colors" />
                        </Link>
                        <span className="text-[10px] font-black uppercase tracking-widest text-white drop-shadow-md">Avisos</span>
                    </div>

                </div>
            </div>

            {/* BottomNavBar Base */}
            <nav className="fixed bottom-0 w-full max-w-[480px] left-1/2 -translate-x-1/2 rounded-t-xl z-50 bg-[#131313]/95 backdrop-blur-xl border-t border-white/5 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
                <div className="flex justify-between items-center h-20 pb-safe px-8 relative">
                    
                    {/* Left: Resumen */}
                    <Link to="/admin" className={`flex flex-col items-center justify-center transition-all active:scale-90 duration-200 relative ${isActive('/admin') ? 'text-[#E13038]' : 'text-gray-500 hover:text-white'}`}>
                        <LayoutDashboard size={24} />
                        <span className="font-medium text-[10px] tracking-widest uppercase mt-1">RESUMEN</span>
                        {isActive('/admin') && <span className="absolute -bottom-1 w-1 h-1 bg-[#E13038] rounded-full"></span>}
                    </Link>
                    
                    {/* Center: FAB (Floating Action Button) */}
                    <div className="absolute left-1/2 -translate-x-1/2 -top-6">
                        <button 
                            onClick={() => setIsOpen(!isOpen)}
                            className={`w-14 h-14 rounded-full flex items-center justify-center text-white shadow-[0_0_20px_rgba(225,48,56,0.4)] transition-all duration-300 active:scale-90 ${isOpen ? 'bg-[#333] rotate-45' : 'bg-[#E13038] rotate-0'}`}
                        >
                            <Plus size={32} />
                        </button>
                    </div>
                    
                    {/* Right: Ajustes */}
                    <Link to="/admin/settings" className={`flex flex-col items-center justify-center transition-all active:scale-90 duration-200 relative ${isActive('/admin/settings') ? 'text-[#E13038]' : 'text-gray-500 hover:text-white'}`}>
                        <Settings size={24} />
                        <span className="font-medium text-[10px] tracking-widest uppercase mt-1">AJUSTES</span>
                        {isActive('/admin/settings') && <span className="absolute -bottom-1 w-1 h-1 bg-[#E13038] rounded-full"></span>}
                    </Link>
                </div>
            </nav>
        </>
    );
};

export default AdminNavBar;
