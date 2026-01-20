import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, updateDoc, deleteDoc, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import {
    Users, UserCheck, Trash2, Search,
    ChevronRight, LayoutGrid, List, Phone, Calendar, Mail, Loader2, ArrowLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import TopHeader from './TopHeader';

const AdminUsersList = () => {
    const navigate = useNavigate();
    const [users, setUsers] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState<'all' | 'pending' | 'active' | 'new'>('all');
    const [isLoading, setIsLoading] = useState(true);
    const [isDarkMode, setIsDarkMode] = useState(() => document.documentElement.classList.contains('dark'));
    const [userToDelete, setUserToDelete] = useState<string | null>(null);

    useEffect(() => {
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

    useEffect(() => {
        const q = query(collection(db, 'users'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const usersData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setUsers(usersData);
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleApprove = async (userId: string) => {
        try {
            await updateDoc(doc(db, 'users', userId), {
                isApproved: true,
                status: 'active'
            });
        } catch (error) {
            console.error("Error approving user:", error);
        }
    };

    const handleUpdateRole = async (userId: string, role: string) => {
        try {
            const updates: any = { role };
            // Admins don't have plan or group
            if (role === 'admin') {
                updates.plan = null;
                updates.group = null;
            }
            await updateDoc(doc(db, 'users', userId), updates);
        } catch (error) {
            console.error("Error updating role:", error);
        }
    };

    const handleUpdatePlan = async (userId: string, plan: string) => {
        try {
            await updateDoc(doc(db, 'users', userId), { plan });
        } catch (error) {
            console.error("Error updating plan:", error);
        }
    };

    const handleUpdateGroup = async (userId: string, group: string) => {
        try {
            await updateDoc(doc(db, 'users', userId), { group });
        } catch (error) {
            console.error("Error updating group:", error);
        }
    };

    const handleDeleteUser = async (userId: string) => {
        try {
            await deleteDoc(doc(db, 'users', userId));
            console.log("User deleted successfully");
        } catch (error) {
            console.error("Error deleting user:", error);
            alert("Error al eliminar: " + (error as Error).message);
        }
    };

    const filteredUsers = users.filter(u => {
        const matchesSearch = u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.email?.toLowerCase().includes(searchTerm.toLowerCase());

        let matchesFilter = filter === 'all' ||
            (filter === 'pending' && !u.isApproved) ||
            (filter === 'active' && u.isApproved);

        if (filter === 'new') {
            const oneDayAgo = new Date();
            oneDayAgo.setDate(oneDayAgo.getDate() - 1);
            const createdAt = u.createdAt?.toDate ? u.createdAt.toDate() : (u.createdAt ? new Date(u.createdAt) : new Date());
            matchesFilter = createdAt > oneDayAgo;
        }

        return matchesSearch && matchesFilter;
    });

    const pendingCount = users.filter(u => !u.isApproved).length;

    return (
        <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-[#1F2128] text-white' : 'bg-[#F3F4F6] text-gray-900'} font-sans pb-32`}>
            {/* Header Unificado */}
            <div className="max-w-7xl mx-auto">
                <TopHeader
                    title="Usuarios"
                    subtitle={`${users.length} Registrados • Gestión Administrativa`}
                    onBack={() => navigate('/admin')}
                    showNotificationDot={pendingCount > 0}
                />
            </div>

            {/* Stats / Quick Filters */}
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <button
                    onClick={() => setFilter('all')}
                    className={`p-6 rounded-[2rem] border-2 transition-all text-left ${filter === 'all' ? 'border-[#FF1F40] bg-[#FF1F40]/5' : isDarkMode ? 'border-white/5 bg-[#2A2D3A]' : 'border-gray-200 bg-white shadow-sm'}`}
                >
                    <div className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">Total Usuarios</div>
                    <div className="text-2xl font-black">{users.length}</div>
                </button>
                <button
                    onClick={() => setFilter('pending')}
                    className={`p-6 rounded-[2rem] border-2 transition-all text-left relative overflow-hidden ${filter === 'pending' ? 'border-yellow-500 bg-yellow-500/5' : isDarkMode ? 'border-white/5 bg-[#2A2D3A]' : 'border-gray-200 bg-white shadow-sm'}`}
                >
                    {pendingCount > 0 && (
                        <div className="absolute top-4 right-4 bg-yellow-500 text-black text-[10px] font-black px-2 py-1 rounded-full animate-pulse">
                            {pendingCount} PENDIENTES
                        </div>
                    )}
                    <div className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">Esperando Aprobación</div>
                    <div className="text-2xl font-black text-yellow-500">{pendingCount}</div>
                </button>
                <button
                    onClick={() => setFilter('active')}
                    className={`p-6 rounded-[2rem] border-2 transition-all text-left ${filter === 'active' ? 'border-green-500 bg-green-500/5' : isDarkMode ? 'border-white/5 bg-[#2A2D3A]' : 'border-gray-200 bg-white shadow-sm'}`}
                >
                    <div className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">Usuarios Activos</div>
                    <div className="text-2xl font-black text-green-500">{users.filter(u => u.isApproved).length}</div>
                </button>
            </div>

            {/* Search and Filters Bar */}
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-4 mb-8">
                <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar por nombre o email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={`w-full ${isDarkMode ? 'bg-[#2A2D3A] border-white/5' : 'bg-white border-gray-200 shadow-sm'} py-4 pl-12 pr-4 rounded-2xl outline-none focus:border-[#FF1F40]/50 transition-all font-medium`}
                    />
                </div>
            </div>

            {/* Users List/Grid */}
            <div className="max-w-7xl mx-auto">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 opacity-50">
                        <Loader2 className="animate-spin mb-4" size={40} />
                        <p className="font-bold uppercase tracking-widest text-xs">Cargando usuarios...</p>
                    </div>
                ) : filteredUsers.length === 0 ? (
                    <div className={`text-center py-20 ${isDarkMode ? 'bg-[#2A2D3A]' : 'bg-white'} rounded-[2.5rem] border border-dashed ${isDarkMode ? 'border-white/10' : 'border-gray-200'}`}>
                        <Users size={48} className="mx-auto text-gray-600 mb-4" />
                        <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">No se encontraron usuarios</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredUsers.map((user) => (
                            <UserCard
                                key={user.id}
                                user={user}
                                isList={false}
                                onApprove={() => handleApprove(user.id)}
                                onUpdateRole={(role: string) => handleUpdateRole(user.id, role)}
                                onUpdatePlan={(plan: string) => handleUpdatePlan(user.id, plan)}
                                onUpdateGroup={(group: string) => handleUpdateGroup(user.id, group)}
                                onDelete={() => setUserToDelete(user.id)}
                                isDeleting={userToDelete === user.id}
                                onCancelDelete={() => setUserToDelete(null)}
                                onConfirmDelete={() => {
                                    handleDeleteUser(user.id);
                                    setUserToDelete(null);
                                }}
                                isDarkMode={isDarkMode}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Bottom Actions Floating (Mobile) */}
            <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 ${isDarkMode ? 'bg-[#2A2D3A]/80' : 'bg-white/80'} backdrop-blur-xl p-2 rounded-full border ${isDarkMode ? 'border-white/10' : 'border-gray-200'} shadow-2xl z-[100] md:hidden`}>
                <button
                    onClick={() => navigate('/admin')}
                    className="w-12 h-12 rounded-full bg-[#FF1F40] text-white flex items-center justify-center shadow-lg"
                >
                    <ArrowLeft size={20} className="rotate-0" />
                </button>
            </div>
        </div>
    );
};

const UserCard = ({ user, isList, onApprove, onUpdateRole, onUpdatePlan, onUpdateGroup, onDelete, isDeleting, onCancelDelete, onConfirmDelete, isDarkMode }: any) => {
    return (
        <div className={`${isDarkMode ? 'bg-[#2A2D3A] border-white/5' : 'bg-white border-gray-100 shadow-sm'} rounded-[2rem] border overflow-hidden transition-all hover:border-[#FF1F40]/30 group ${isList ? 'flex items-center p-4' : 'flex flex-col p-6'}`}>

            {/* User Info */}
            <div className={`flex items-center gap-4 ${isList ? 'flex-1' : 'mb-6'}`}>
                <div className="relative">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black italic uppercase italic shadow-lg ${user.isApproved ? 'bg-[#FF1F40] text-white' : 'bg-yellow-500 text-black'}`}>
                        {user.name?.charAt(0) || '?'}
                    </div>
                    {!user.isApproved && (
                        <div className={`absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 border-2 ${isDarkMode ? 'border-[#1F2128]' : 'border-white'} rounded-full`}></div>
                    )}
                </div>
                <div>
                    <h3 className="font-black uppercase italic text-lg leading-none mb-1 group-hover:text-[#FF1F40] transition-colors">{user.name}</h3>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <p className="text-gray-500 text-[10px] font-bold lowercase tracking-tight flex items-center gap-1">
                            <Mail size={10} /> {user.email}
                        </p>
                        {user.phone && (
                            <p className="text-gray-500 text-[10px] font-bold uppercase tracking-tight flex items-center gap-1">
                                <Phone size={10} /> {user.phone}
                            </p>
                        )}
                        {user.birthDate && (
                            <p className="text-gray-500 text-[10px] font-bold uppercase tracking-tight flex items-center gap-1">
                                <Calendar size={10} /> {user.birthDate}
                            </p>
                        )}
                    </div>
                    {isList && (
                        <div className="flex items-center gap-2 mt-2">
                            <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${user.role === 'admin' ? 'bg-purple-500/10 text-purple-500' : user.role === 'coach' ? 'bg-blue-500/10 text-blue-500' : 'bg-white/10 text-gray-400'}`}>
                                {user.role === 'admin' ? 'ADMIN' : user.role === 'coach' ? 'COACH' : 'CLIENTE'}
                            </span>
                            {user.role !== 'admin' && user.plan && (
                                <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-[#FF1F40]/10 text-[#FF1F40]">
                                    {user.plan}
                                </span>
                            )}
                            {user.role !== 'admin' && user.group && (
                                <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500">
                                    {user.group}
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Details (Grid Only) */}
            {!isList && (
                <div className="space-y-4 mb-6">
                    <div className="grid grid-cols-2 gap-2">
                        <div className={`${isDarkMode ? 'bg-[#1F2128] border-white/5' : 'bg-gray-50 border-gray-100'} p-3 rounded-xl border`}>
                            <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-1">Rol</p>
                            <select
                                value={user.role || 'client'}
                                onChange={(e) => onUpdateRole(e.target.value)}
                                className={`w-full bg-transparent text-xs font-bold uppercase italic outline-none text-[#FF1F40] ${isDarkMode ? '' : '[&>option]:text-gray-900'}`}
                            >
                                <option value="client">Cliente</option>
                                <option value="coach">Coach</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>
                        {user.role !== 'admin' && (
                            <div className={`${isDarkMode ? 'bg-[#1F2128] border-white/5' : 'bg-gray-50 border-gray-100'} p-3 rounded-xl border`}>
                                <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-1">Plan</p>
                                <select
                                    value={user.plan || ''}
                                    onChange={(e) => onUpdatePlan(e.target.value)}
                                    className={`w-full bg-transparent text-xs font-bold uppercase italic outline-none text-[#FF1F40] ${isDarkMode ? '' : '[&>option]:text-gray-900'}`}
                                >
                                    <option value="">Sin Plan</option>
                                    <option value="Mancuerna">Mancuerna (2)</option>
                                    <option value="Burpees">Burpees (3)</option>
                                </select>
                            </div>
                        )}
                    </div>
                    {user.role !== 'admin' && (
                        <div className={`${isDarkMode ? 'bg-[#1F2128] border-white/5' : 'bg-gray-50 border-gray-100'} p-3 rounded-xl border`}>
                            <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-1">Grupo</p>
                            <select
                                value={user.group || ''}
                                onChange={(e) => onUpdateGroup(e.target.value)}
                                className={`w-full bg-transparent text-xs font-bold uppercase italic outline-none text-[#FF1F40] ${isDarkMode ? '' : '[&>option]:text-gray-900'}`}
                            >
                                <option value="">Sin Grupo</option>
                                <option value="AlmodovarBOX">Almodóvar BOX</option>
                                <option value="AlmodovarFIT">Almodóvar FIT</option>
                            </select>
                        </div>
                    )}
                </div>
            )}

            {/* Actions */}
            <div className={`flex items-center gap-2 ${isList ? '' : 'mt-auto'}`}>
                {isDeleting ? (
                    <div className="flex-1 flex items-center gap-2 animate-in slide-in-from-right-4 duration-300">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onConfirmDelete();
                            }}
                            className="flex-1 bg-red-500 text-white py-4 rounded-2xl font-black uppercase italic text-[10px] tracking-widest shadow-lg shadow-red-900/20 hover:bg-red-400 transition-all active:scale-95"
                        >
                            Confirmar Borrado
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onCancelDelete();
                            }}
                            className="px-4 py-4 bg-white/5 text-gray-400 rounded-2xl font-bold uppercase text-[10px] hover:bg-white/10 transition-all"
                        >
                            no
                        </button>
                    </div>
                ) : (
                    <>
                        {!user.isApproved ? (
                            <button
                                onClick={onApprove}
                                className="flex-1 flex items-center justify-center gap-2 bg-yellow-500 text-black py-4 rounded-2xl font-black uppercase italic text-xs tracking-widest shadow-lg shadow-yellow-900/10 hover:bg-yellow-400 transition-all active:scale-95"
                            >
                                <UserCheck size={16} />
                                Aprobar
                            </button>
                        ) : isList ? (
                            <div className="flex items-center gap-2">
                                <div className={`${isDarkMode ? 'bg-[#1F2128] border-white/5' : 'bg-gray-50 border-gray-100'} px-3 py-2 rounded-xl border`}>
                                    <select
                                        value={user.role || 'client'}
                                        onChange={(e) => onUpdateRole(e.target.value)}
                                        className={`bg-transparent text-[10px] font-black uppercase italic outline-none text-[#FF1F40] ${isDarkMode ? '' : '[&>option]:text-gray-900'}`}
                                    >
                                        <option value="client">Cliente</option>
                                        <option value="coach">Coach</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>
                                {user.role !== 'admin' && (
                                    <>
                                        <div className={`${isDarkMode ? 'bg-[#1F2128] border-white/5' : 'bg-gray-50 border-gray-100'} px-3 py-2 rounded-xl border`}>
                                            <select
                                                value={user.plan || ''}
                                                onChange={(e) => onUpdatePlan(e.target.value)}
                                                className={`bg-transparent text-[10px] font-black uppercase italic outline-none text-[#FF1F40] ${isDarkMode ? '' : '[&>option]:text-gray-900'}`}
                                            >
                                                <option value="">Sin Plan</option>
                                                <option value="Mancuerna">Mancuerna</option>
                                                <option value="Burpees">Burpees</option>
                                            </select>
                                        </div>
                                        <div className={`${isDarkMode ? 'bg-[#1F2128] border-white/5' : 'bg-gray-50 border-gray-100'} px-3 py-2 rounded-xl border`}>
                                            <select
                                                value={user.group || ''}
                                                onChange={(e) => onUpdateGroup(e.target.value)}
                                                className={`bg-transparent text-[10px] font-black uppercase italic outline-none text-[#FF1F40] ${isDarkMode ? '' : '[&>option]:text-gray-900'}`}
                                            >
                                                <option value="">Sin Grupo</option>
                                                <option value="AlmodovarBOX">BOX</option>
                                                <option value="AlmodovarFIT">FIT</option>
                                            </select>
                                        </div>
                                    </>
                                )}
                            </div>
                        ) : null}

                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete();
                            }}
                            className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all active:scale-95 border border-red-500/20"
                        >
                            <Trash2 size={18} />
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default AdminUsersList;
