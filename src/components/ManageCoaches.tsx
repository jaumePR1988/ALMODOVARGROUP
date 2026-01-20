import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ChevronLeft,
    Plus,
    Search,
    User,
    Mail,
    Phone,
    Trash2,
    Edit,
    Power,
    CheckCircle2,
    XCircle,
    MoreVertical,
    Activity,
    MessageSquare,
    PhoneCall
} from 'lucide-react';
import TopHeader from './TopHeader';
import { db } from '../firebase';
import { collection, onSnapshot, query, orderBy, deleteDoc, doc, updateDoc } from 'firebase/firestore';

const ManageCoaches = () => {
    const navigate = useNavigate();
    const [isDarkMode, setIsDarkMode] = useState(document.documentElement.classList.contains('dark'));
    const [coaches, setCoaches] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const observer = new MutationObserver(() => {
            setIsDarkMode(document.documentElement.classList.contains('dark'));
        });
        observer.observe(document.documentElement, { attributes: true });

        // Fetch Coaches
        const q = query(collection(db, 'coaches'), orderBy('name', 'asc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setCoaches(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        return () => {
            observer.disconnect();
            unsubscribe();
        };
    }, []);

    const handleDelete = async (id: string) => {
        if (window.confirm('¿Estás seguro de eliminar este coach? Esta acción no se puede deshacer.')) {
            try {
                await deleteDoc(doc(db, 'coaches', id));
            } catch (error) {
                console.error("Error deleting coach:", error);
                alert("Error al eliminar coach");
            }
        }
    };

    const handleToggleStatus = async (coach: any) => {
        const newStatus = coach.status === 'inactive' ? 'active' : 'inactive';
        try {
            await updateDoc(doc(db, 'coaches', coach.id), {
                status: newStatus
            });
        } catch (error) {
            console.error("Error toggling status:", error);
        }
    };

    const filteredCoaches = coaches.filter(c =>
        (c.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.email || '').toLowerCase().includes(searchTerm.toLowerCase())
    );


    return (
        <div className={`min-h-screen transition-colors duration-500 pb-20 ${isDarkMode ? 'bg-[#1F2128] text-white' : 'bg-[#F3F4F6]'}`}>
            {/* Header Unificado */}
            <div className="max-w-md mx-auto px-6 pt-6">
                <TopHeader
                    title="Coaches"
                    subtitle={`Equipo Almodóvar • ${coaches.length} Activos`}
                    onBack={() => navigate('/admin')}
                />
            </div>

            <div className="max-w-md mx-auto px-6 pt-2 space-y-6">

                {/* Search */}
                <div className={`relative flex items-center px-4 py-3 rounded-2xl ${isDarkMode ? 'bg-[#2A2D3A]' : 'bg-white shadow-sm'}`}>
                    <Search size={18} className="text-gray-400 mr-3" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={`w-full bg-transparent outline-none font-medium text-sm ${isDarkMode ? 'text-white placeholder-gray-500' : 'text-gray-900 placeholder-gray-400'}`}
                    />
                </div>

                {/* List */}
                <div className="grid grid-cols-1 gap-6">
                    {filteredCoaches.length === 0 ? (
                        <div className={`text-center py-20 rounded-[2.5rem] border-2 border-dashed ${isDarkMode ? 'border-white/5 bg-[#2A2D3A]/50' : 'border-gray-200 bg-white shadow-sm'}`}>
                            <div className="w-20 h-20 bg-gray-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-400">
                                <User size={40} />
                            </div>
                            <p className="font-black uppercase tracking-widest text-sm mb-2">No hay coaches encontrados</p>
                            <p className="text-xs text-gray-500 font-medium">Pulsa el botón superior para añadir uno nuevo</p>
                        </div>
                    ) : (
                        filteredCoaches.map((coach) => (
                            <div key={coach.id} className={`group relative rounded-[2.5rem] transition-all duration-300 ${isDarkMode ? 'bg-[#2A2D3A] border-white/5 hover:bg-[#323645]' : 'bg-white shadow-xl shadow-gray-200/60 border-white hover:shadow-2xl hover:shadow-gray-300/60'} border p-6`}>
                                <div className="flex items-start gap-4">
                                    {/* Photo with status indicator */}
                                    <div className="relative">
                                        <div className={`w-20 h-20 rounded-[1.5rem] overflow-hidden border-2 transition-transform group-hover:scale-105 ${isDarkMode ? 'border-white/10' : 'border-gray-100 shadow-sm'}`}>
                                            {coach.photoUrl ? (
                                                <img src={coach.photoUrl} alt={coach.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-[#FF1F40]/10 text-[#FF1F40]">
                                                    <User size={32} />
                                                </div>
                                            )}
                                        </div>
                                        <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-lg border-2 flex items-center justify-center ${coach.status === 'inactive' ? 'bg-gray-500 border-white dark:border-[#2A2D3A]' : 'bg-green-500 border-white dark:border-[#2A2D3A] shadow-lg shadow-green-500/30'}`}>
                                            {coach.status === 'inactive' ? <XCircle size={12} className="text-white" /> : <CheckCircle2 size={12} className="text-white" />}
                                        </div>
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className={`font-black uppercase italic text-lg leading-tight truncate tracking-tight ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{coach.name}</h3>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest ${isDarkMode ? 'bg-[#FF1F40]/10 text-[#FF1F40]' : 'bg-red-50 text-[#FF1F40]'}`}>
                                                        {coach.speciality || 'General'}
                                                    </span>
                                                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest ${isDarkMode ? 'bg-white/5 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
                                                        {coach.group || 'Sin Grupo'}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => navigate(`/edit-coach/${coach.id}`)}
                                                    className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-90 ${isDarkMode ? 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10' : 'bg-gray-50 text-gray-400 hover:text-gray-900'}`}
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(coach.id)}
                                                    className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-90 ${isDarkMode ? 'bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white' : 'bg-red-50 text-red-500 hover:bg-red-500 hover:text-white'}`}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="mt-4 flex flex-wrap gap-3">
                                            <div className="flex items-center gap-1.5 py-1.5 px-3 rounded-xl bg-gray-500/5 border border-transparent dark:border-white/5">
                                                <Mail size={12} className="text-[#FF1F40]" />
                                                <span className="text-[10px] font-bold text-gray-500 truncate max-w-[120px]">{coach.email}</span>
                                            </div>
                                            {coach.phone && (
                                                <div className="flex items-center gap-1.5 py-1.5 px-3 rounded-xl bg-gray-500/5 border border-transparent dark:border-white/5">
                                                    <Phone size={12} className="text-blue-500" />
                                                    <span className="text-[10px] font-bold text-gray-500">{coach.phone}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6 pt-4 border-t border-gray-100 dark:border-white/5 flex items-center justify-between">
                                    <div className="flex gap-2 font-black text-[10px] italic uppercase tracking-widest text-[#FF1F40]">
                                        <Activity size={14} />
                                        <span>Última clase hoy</span>
                                    </div>
                                    <button
                                        onClick={() => handleToggleStatus(coach)}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 ${coach.status === 'inactive' ? 'bg-green-500 text-white shadow-lg shadow-green-500/30' : 'bg-gray-500/10 text-gray-500 border dark:border-white/5'}`}
                                    >
                                        <Power size={12} />
                                        {coach.status === 'inactive' ? 'Activar' : 'Desactivar'}
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default ManageCoaches;
