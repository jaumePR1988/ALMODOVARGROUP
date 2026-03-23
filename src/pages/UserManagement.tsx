import { useState, useEffect } from 'react';
import { Search, History, ChevronRight, Minus, Plus, Zap, LogOut, Euro, Pause, Play, Trash2 } from 'lucide-react';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import AdminNavBar from '../components/AdminNavBar';
import PremiumAlert from '../components/PremiumAlert';

interface UserData {
    id: string;
    nombre?: string;
    apellidos?: string;
    email: string;
    role?: string;
    limiteSemanal?: number;
    saldoExtra?: number;
    modos?: string[];
    cuotaMensual?: number;
    pausado?: boolean;
}

interface Mode {
    id: string;
    name: string;
}

const UserManagement = () => {
    const { signOut } = useAuth();
    const [users, setUsers] = useState<UserData[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [availableModes, setAvailableModes] = useState<Mode[]>([]);
    
    // Popup state
    const [alertConfig, setAlertConfig] = useState<{ isOpen: boolean; title: string; message: string; type: 'success' | 'error' }>({ isOpen: false, title: '', message: '', type: 'success' });
    const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

    const showAlert = (title: string, message: string, type: 'success' | 'error' = 'success') => {
        setAlertConfig({ isOpen: true, title, message, type });
    };

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const usersCollection = collection(db, 'users');
                const userSnapshot = await getDocs(usersCollection);
                const userList = userSnapshot.docs.map(doc => {
                    const data = doc.data();
                    // Migrate legacy 'grupos' to 'modos' array if needed
                    let defaultModos: string[] = [];
                    if (data.grupos) {
                        if (data.grupos.almodovarBox) defaultModos.push('ALMODÓVAR BOX');
                        if (data.grupos.almodovarFit) defaultModos.push('ALMODÓVAR FIT');
                        if (data.grupos.virtualSessions) defaultModos.push('VIRTUAL BOX');
                    }
                    return {
                        id: doc.id,
                        ...data,
                        limiteSemanal: data.limiteSemanal || 3,
                        saldoExtra: data.saldoExtra || 0,
                        modos: data.modos || defaultModos,
                        cuotaMensual: data.cuotaMensual || 0
                    };
                }) as UserData[];
                setUsers(userList);
                
                // Fetch modes
                const modesCollection = collection(db, 'modes');
                const modesSnapshot = await getDocs(modesCollection);
                setAvailableModes(modesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Mode).sort((a,b) => a.name.localeCompare(b.name)));
            } catch (error) {
                console.error("Error al obtener datos:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();
    }, []);

    const filteredUsers = users.filter(user => {
        const fullName = `${user.nombre || ''} ${user.apellidos || ''}`.toLowerCase();
        return fullName.includes(searchTerm.toLowerCase()) || user.email.toLowerCase().includes(searchTerm.toLowerCase());
    });

    const handleSave = async () => {
        if (!selectedUser) return;
        setSaving(true);
        try {
            const userRef = doc(db, 'users', selectedUser.id);
            await updateDoc(userRef, {
                limiteSemanal: selectedUser.limiteSemanal,
                saldoExtra: selectedUser.saldoExtra,
                modos: selectedUser.modos || [],
                role: selectedUser.role || 'user',
                cuotaMensual: selectedUser.cuotaMensual || 0
            });
            
            // Actualizar estado local
            setUsers(users.map(u => u.id === selectedUser.id ? selectedUser : u));
            showAlert('Éxito', 'Cambios guardados correctamente.', 'success');
            setSelectedUser(null); // Volver a la lista
        } catch (error) {
            console.error("Error guardando el usuario:", error);
            showAlert('Error', 'Error al guardar los cambios.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleTogglePause = async (user: UserData, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            const newPausado = !user.pausado;
            await updateDoc(doc(db, 'users', user.id), { pausado: newPausado });
            setUsers(users.map(u => u.id === user.id ? { ...u, pausado: newPausado } : u));
            showAlert('Éxito', newPausado ? 'Usuario pausado. No se sumará su cuota.' : 'Usuario reactivado.', 'success');
        } catch (error) {
            console.error('Error al pausar usuario:', error);
            showAlert('Error', 'No se pudo cambiar el estado.', 'error');
        }
    };

    const handleDeleteUser = async (userId: string) => {
        try {
            await deleteDoc(doc(db, 'users', userId));
            setUsers(users.filter(u => u.id !== userId));
            setConfirmDelete(null);
            showAlert('Eliminado', 'Usuario eliminado correctamente.', 'success');
        } catch (error) {
            console.error('Error al eliminar usuario:', error);
            showAlert('Error', 'No se pudo eliminar el usuario.', 'error');
        }
    };

    return (
        <div className="bg-[#111111] text-gray-200 min-h-screen selection:bg-[#E13038] selection:text-white pb-safe">
            
            {/* TopAppBar */}
            <header className="fixed top-0 left-1/2 -translate-x-1/2 w-full z-50 flex justify-between items-center px-6 h-20 max-w-[480px] bg-[#111111]/80 backdrop-blur-xl">
                <div className="flex items-center gap-4">
            
                    <h1 className="text-2xl font-black tracking-tighter text-[#E13038] font-sans uppercase">
                        ALMODÓVAR
                    </h1>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={signOut} className="text-gray-400 hover:text-white transition-colors active:scale-95 p-2 rounded-full bg-white/5">
                        <LogOut size={20} />
                    </button>
                    <button className="w-10 h-10 rounded-full border border-[#333] overflow-hidden active:scale-95 duration-100">
                        <img 
                            alt="Profile Avatar" 
                            className="w-full h-full object-cover" 
                            src="https://ui-avatars.com/api/?name=Admin&background=1A1A1A&color=E13038&bold=true"
                        />
                    </button>
                </div>
            </header>

            <main className="pt-24 pb-32 px-4 max-w-[480px] mx-auto">
                {!selectedUser ? (
                    // VISTA: LISTA DE BUSQUEDA
                    <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <h2 className="text-3xl font-black tracking-tighter mb-6 ml-2 uppercase text-white">GESTIÓN DE USUARIOS</h2>
                        <div className="relative mb-8">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                            <input 
                                type="text" 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-[#1c1b1b] border-none rounded-xl py-4 pl-12 pr-4 text-white focus:ring-1 focus:ring-[#E13038] transition-all placeholder:text-gray-600 outline-none" 
                                placeholder="Buscar usuario..." 
                            />
                        </div>

                        {loading ? (
                            <div className="text-center py-10 text-gray-500">Cargando socios...</div>
                        ) : (
                            <div className="space-y-2">
                                {filteredUsers.length === 0 && (
                                    <div className="text-center py-10 text-gray-500">No hay resultados.</div>
                                )}
                                {filteredUsers.map(user => (
                                    <div 
                                        key={user.id} 
                                        className={`p-4 bg-[#1c1b1b] rounded-xl transition-all ${user.pausado ? 'opacity-60 border border-yellow-500/30' : 'border border-transparent'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            {/* Avatar + info — clickable */}
                                            <div 
                                                className="flex gap-3 items-center flex-1 min-w-0 cursor-pointer hover:opacity-80 active:scale-[0.98] transition-all"
                                                onClick={() => setSelectedUser(user)}
                                            >
                                                <div className="w-11 h-11 rounded-lg bg-[#333] flex items-center justify-center overflow-hidden shrink-0">
                                                    <img 
                                                        src={`https://ui-avatars.com/api/?name=${user.nombre || 'N'}+${user.apellidos || 'E'}&background=1A1A1A&color=E13038`} 
                                                        alt="User" 
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-bold text-sm text-white uppercase truncate">{user.nombre || 'Sin nombre'} {user.apellidos || ''}</p>
                                                        {user.pausado && (
                                                            <span className="text-[8px] font-black uppercase bg-yellow-500/15 text-yellow-500 px-1.5 py-0.5 rounded shrink-0">PAUSADO</span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                                                </div>
                                            </div>

                                            {/* Action buttons */}
                                            <div className="flex items-center gap-1.5 shrink-0">
                                                <button
                                                    onClick={(e) => handleTogglePause(user, e)}
                                                    title={user.pausado ? 'Reactivar' : 'Pausar'}
                                                    className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all active:scale-90 ${
                                                        user.pausado
                                                            ? 'bg-[#34A853]/15 text-[#34A853] hover:bg-[#34A853]/25'
                                                            : 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20'
                                                    }`}
                                                >
                                                    {user.pausado ? <Play size={16} /> : <Pause size={16} />}
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setConfirmDelete(user.id); }}
                                                    title="Eliminar"
                                                    className="w-9 h-9 rounded-lg flex items-center justify-center bg-[#E13038]/10 text-[#E13038] hover:bg-[#E13038]/20 transition-all active:scale-90"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                                <ChevronRight size={16} className="text-gray-600 cursor-pointer" onClick={() => setSelectedUser(user)} />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                ) : (
                    // VISTA: EDICIÓN DE USUARIO
                    <section className="animate-in fade-in slide-in-from-right-8 duration-300">
                        <button 
                            onClick={() => setSelectedUser(null)}
                            className="text-[#E13038] font-bold text-xs uppercase cursor-pointer mb-4 flex items-center gap-1 hover:text-white transition-colors"
                        >
                            <ChevronRight className="rotate-180" size={16}/> VOLVER A BUSCAR
                        </button>
                        
                        <div className="bg-[#1c1b1b] rounded-xl overflow-hidden shadow-[0_20px_40px_rgba(0,0,0,0.5)]">
                            <div className="p-6 flex items-center gap-4 bg-gradient-to-r from-[#2a2a2a] to-transparent">
                                <div className="relative">
                                    <img 
                                        alt="Profile" 
                                        className="w-16 h-16 rounded-lg object-cover" 
                                        src={`https://ui-avatars.com/api/?name=${selectedUser.nombre || 'N'}+${selectedUser.apellidos || 'E'}&background=1A1A1A&color=E13038&bold=true`}
                                    />
                                    <div className="absolute -bottom-1 -right-1 bg-[#E13038] w-4 h-4 rounded-full border-2 border-[#1c1b1b]"></div>
                                </div>
                                <div className="overflow-hidden">
                                    <h3 className="font-black text-xl uppercase tracking-tight text-white truncate max-w-[200px]">{selectedUser.nombre || 'Nuevo Socio'} {selectedUser.apellidos || ''}</h3>
                                    <p className="text-xs text-gray-500 uppercase tracking-widest truncate">{selectedUser.email}</p>
                                </div>
                            </div>

                            <div className="p-6 space-y-8">
                                {/* Role Selection */}
                                <div>
                                    <label className="font-black text-sm tracking-widest uppercase text-[#E13038] mb-4 block">ROL DEL USUARIO</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {[
                                            { id: 'user', label: 'USER' },
                                            { id: 'coach', label: 'COACH' },
                                            { id: 'admin', label: 'ADMIN' }
                                        ].map((r) => (
                                            <button 
                                                key={r.id}
                                                onClick={() => setSelectedUser({...selectedUser, role: r.id})}
                                                className={`h-12 rounded-lg flex items-center justify-center transition-all ${selectedUser.role === r.id || (!selectedUser.role && r.id === 'user') ? 'bg-[#E13038] shadow-[0_0_15px_rgba(225,48,56,0.3)] text-white' : 'bg-[#353534] hover:bg-[#393939] text-gray-400'}`}
                                            >
                                                <span className="font-black text-xs tracking-widest uppercase">{r.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Weekly Limit */}
                                <div>
                                    <div className="flex justify-between items-end mb-4">
                                        <label className="font-black text-sm tracking-widest uppercase text-[#E13038]">LÍMITE SEMANAL</label>
                                        <span className="text-2xl font-black text-white">0{selectedUser.limiteSemanal || 3}</span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                        {[1, 2, 3].map((limit) => (
                                            <button 
                                                key={limit}
                                                onClick={() => setSelectedUser({...selectedUser, limiteSemanal: limit})}
                                                className={`h-16 rounded-md flex items-center justify-center transition-all ${selectedUser.limiteSemanal === limit ? 'bg-[#E13038] shadow-[0_0_15px_rgba(225,48,56,0.3)]' : 'bg-[#353534] hover:bg-[#393939]'}`}
                                            >
                                                <span className={`font-black text-xl ${selectedUser.limiteSemanal === limit ? 'text-white' : 'text-gray-500'}`}>{limit}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Extra Credits Balance */}
                                <div>
                                    <label className="font-black text-sm tracking-widest uppercase text-[#E13038] mb-4 block">CRÉDITOS</label>
                                    <div className="bg-[#2a2a2a] rounded-xl p-4 flex items-center justify-between">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">SALDO EXTRA</span>
                                            <span className="text-3xl font-black text-white">{selectedUser.saldoExtra?.toString().padStart(2, '0') || '00'}</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => setSelectedUser({...selectedUser, saldoExtra: Math.max(0, (selectedUser.saldoExtra || 0) - 1)})}
                                                className="w-12 h-12 rounded-lg bg-[#353534] flex items-center justify-center hover:bg-[#393939] active:scale-95 transition-all text-white"
                                            >
                                                <Minus size={20} />
                                            </button>
                                            <button 
                                                onClick={() => setSelectedUser({...selectedUser, saldoExtra: (selectedUser.saldoExtra || 0) + 1})}
                                                className="w-12 h-12 rounded-lg bg-[#353534] flex items-center justify-center hover:bg-[#393939] active:scale-95 transition-all text-white"
                                            >
                                                <Plus size={20} />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Groups Selection */}
                                <div>
                                    <label className="font-black text-sm tracking-widest uppercase text-[#E13038] mb-4 block">MODOS PERMITIDOS</label>
                                    <div className="space-y-3">
                                        {availableModes.map((mode) => {
                                            const isChecked = selectedUser.modos?.includes(mode.name.toUpperCase()) || false;
                                            return (
                                                <label key={mode.id} className={`flex items-center justify-between p-4 rounded-lg cursor-pointer transition-colors border ${isChecked ? 'bg-[#E13038]/10 border-[#E13038]' : 'bg-[#2a2a2a] border-transparent hover:bg-[#393939]'}`}>
                                                    <span className="font-bold text-sm tracking-tight text-white uppercase">{mode.name}</span>
                                                    <input 
                                                        type="checkbox"
                                                        checked={isChecked}
                                                        onChange={(e) => {
                                                            const currentModos = selectedUser.modos || [];
                                                            const newModos = e.target.checked 
                                                                ? [...currentModos, mode.name.toUpperCase()] 
                                                                : currentModos.filter(m => m !== mode.name.toUpperCase());
                                                            setSelectedUser({
                                                                ...selectedUser,
                                                                modos: newModos
                                                            });
                                                        }}
                                                        className="rounded border-[#353534] bg-[#353534] text-[#E13038] focus:ring-0 focus:ring-offset-0 w-6 h-6 border-transparent"
                                                    />
                                                </label>
                                            );
                                        })}
                                        {availableModes.length === 0 && (
                                            <div className="text-gray-500 text-xs italic">No hay modos configurados en el sistema. Puedes crearlos desde la pestaña Modos.</div>
                                        )}
                                    </div>
                                </div>

                                {/* Cuota Mensual */}
                                <div>
                                    <label className="font-black text-sm tracking-widest uppercase text-[#E13038] mb-4 block">CUOTA MENSUAL</label>
                                    <div className="grid grid-cols-2 gap-2 mb-3">
                                        {[
                                            { price: 54.90, label: 'FIT · 2 ses' },
                                            { price: 74.90, label: 'FIT · 3 ses' },
                                            { price: 105, label: 'BOX · 2 ses' },
                                            { price: 159.90, label: 'BOX · 3 ses' },
                                        ].map(({ price, label }) => (
                                            <button
                                                key={price}
                                                onClick={() => setSelectedUser({...selectedUser, cuotaMensual: price})}
                                                className={`h-14 rounded-lg flex flex-col items-center justify-center gap-0.5 transition-all ${selectedUser.cuotaMensual === price ? 'bg-[#E13038] shadow-[0_0_15px_rgba(225,48,56,0.3)] text-white' : 'bg-[#353534] hover:bg-[#393939] text-gray-400'}`}
                                            >
                                                <span className="font-black text-sm flex items-center gap-1"><Euro size={12} />{price.toFixed(2)}</span>
                                                <span className={`text-[9px] font-bold uppercase tracking-wider ${selectedUser.cuotaMensual === price ? 'text-white/70' : 'text-gray-600'}`}>{label}</span>
                                            </button>
                                        ))}
                                    </div>
                                    <div className="bg-[#2a2a2a] rounded-xl p-4 flex items-center gap-3">
                                        <Euro size={18} className="text-gray-500 shrink-0" />
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={selectedUser.cuotaMensual || ''}
                                            onChange={(e) => setSelectedUser({...selectedUser, cuotaMensual: parseFloat(e.target.value) || 0})}
                                            className="flex-1 bg-transparent text-white text-xl font-black outline-none placeholder:text-gray-600"
                                            placeholder="Importe manual"
                                        />
                                        <span className="text-xs text-gray-500 font-bold uppercase">€/mes</span>
                                    </div>
                                </div>

                                {/* CTA */}
                                <button 
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="w-full h-16 bg-gradient-to-r from-[#E13038] to-[#ff535b] rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all shadow-[0_20px_40px_rgba(0,0,0,0.5)] group disabled:opacity-50"
                                >
                                    <span className="font-black tracking-widest uppercase text-white">{saving ? 'GUARDANDO...' : 'GUARDAR CAMBIOS'}</span>
                                    <Zap size={20} className="text-white group-hover:translate-x-1 transition-transform" />
                                </button>
                            </div>
                        </div>

                        {/* Recent Activity Mini Section */}
                        <section className="mt-12 mb-8">
                            <h4 className="font-bold text-xs tracking-[0.2em] text-gray-500 uppercase mb-4 ml-2">CONFIGURACIÓN DE PLAN RECIENTE</h4>
                            <div className="space-y-1">
                                <div className="flex items-center justify-between p-4 rounded-lg bg-[#111111] hover:bg-[#1c1b1b] transition-all group">
                                    <div className="flex gap-4 items-center">
                                        <div className="w-10 h-10 bg-[#1A1A1A] rounded flex items-center justify-center">
                                            <History size={20} className="text-[#E13038]" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-white">Cambio pendiente</p>
                                            <p className="text-xs text-gray-500">Historial en desarrollo</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </section>
                )}
            </main>

            <AdminNavBar />

            <PremiumAlert
                isOpen={alertConfig.isOpen}
                onClose={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))}
                title={alertConfig.title}
                message={alertConfig.message}
                type={alertConfig.type}
            />

            {/* Confirm Delete Modal */}
            {confirmDelete && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center" onClick={() => setConfirmDelete(null)}>
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm"></div>
                    <div className="relative bg-[#1A1A1A] rounded-2xl p-6 mx-6 w-full max-w-[340px] border border-[#E13038]/30" onClick={e => e.stopPropagation()}>
                        <div className="flex flex-col items-center text-center">
                            <div className="w-14 h-14 rounded-full bg-[#E13038]/15 flex items-center justify-center mb-4">
                                <Trash2 size={28} className="text-[#E13038]" />
                            </div>
                            <h3 className="text-lg font-black text-white uppercase mb-2">¿Eliminar usuario?</h3>
                            <p className="text-sm text-gray-400 mb-6">Esta acción es permanente y no se puede deshacer.</p>
                            <div className="flex gap-3 w-full">
                                <button
                                    onClick={() => setConfirmDelete(null)}
                                    className="flex-1 h-12 rounded-xl bg-[#2a2a2a] text-white font-bold uppercase tracking-widest text-xs hover:bg-[#333] transition-all active:scale-95"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={() => handleDeleteUser(confirmDelete)}
                                    className="flex-1 h-12 rounded-xl bg-[#E13038] text-white font-bold uppercase tracking-widest text-xs hover:bg-[#c52930] transition-all active:scale-95 shadow-lg shadow-[#E13038]/20"
                                >
                                    Eliminar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagement;
