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
    Edit
} from 'lucide-react';
import { db } from '../firebase';
import { collection, onSnapshot, query, orderBy, deleteDoc, doc } from 'firebase/firestore';

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
        if (confirm('¿Estás seguro de eliminar este coach?')) {
            await deleteDoc(doc(db, 'coaches', id));
        }
    };

    const filteredCoaches = coaches.filter(c =>
        (c.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.email || '').toLowerCase().includes(searchTerm.toLowerCase())
    );


    return (
        <div className={`min-h-screen transition-colors duration-500 pb-20 ${isDarkMode ? 'bg-[#1F2128] text-white' : 'bg-[#F3F4F6]'}`}>
            {/* Header */}
            <header className={`sticky top-0 z-[50] px-6 py-5 flex items-center justify-between backdrop-blur-md ${isDarkMode ? 'bg-[#1F2128]/80' : 'bg-white/80'}`}>
                <button
                    onClick={() => navigate('/admin')}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isDarkMode ? 'hover:bg-white/5' : 'hover:bg-gray-100'}`}
                >
                    <ChevronLeft size={24} className={isDarkMode ? 'text-white' : 'text-gray-900'} />
                </button>
                <h1 className={`text-sm font-black uppercase tracking-widest ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Gestión de Coaches
                </h1>
                <button
                    onClick={() => navigate('/create-coach')}
                    className="w-10 h-10 rounded-full bg-[#FF1F40] text-white flex items-center justify-center shadow-lg shadow-red-500/30 hover:scale-105 transition-transform"
                >
                    <Plus size={20} strokeWidth={3} />
                </button>
            </header>

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
                <div className="space-y-4">
                    {filteredCoaches.length === 0 ? (
                        <div className="text-center py-10 opacity-50 space-y-2">
                            <div className="w-16 h-16 bg-gray-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                <User size={32} />
                            </div>
                            <p className="font-bold">No hay coaches</p>
                            <p className="text-xs">Crea el primero pulsando el +</p>
                        </div>
                    ) : (
                        filteredCoaches.map((coach) => (
                            <div key={coach.id} className={`p-4 rounded-3xl flex items-center gap-4 transition-all ${isDarkMode ? 'bg-[#2A2D3A]' : 'bg-white shadow-md border border-gray-100'}`}>
                                <div className="w-14 h-14 rounded-2xl bg-gray-200 overflow-hidden flex-shrink-0">
                                    {coach.photoUrl ? (
                                        <img src={coach.photoUrl} alt={coach.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-[#FF1F40]/10 text-[#FF1F40]">
                                            <User size={24} />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className={`font-black text-sm truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{coach.name}</h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider ${isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                                            {coach.speciality || 'General'}
                                        </span>
                                    </div>
                                </div>

                                <button
                                    onClick={() => handleDelete(coach.id)}
                                    className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:bg-red-500/10 hover:text-red-500 transition-colors"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default ManageCoaches;
