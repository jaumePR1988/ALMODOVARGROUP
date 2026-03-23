import { useState, useEffect } from 'react';
import { Plus, Trash2, Settings2, ArrowLeft, Edit2, Check, X } from 'lucide-react';
import { collection, getDocs, addDoc, deleteDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { Link } from 'react-router-dom';
import AdminNavBar from '../components/AdminNavBar';
import ConfirmModal from '../components/ConfirmModal';

interface Mode {
    id: string;
    name: string;
}

const AdminModes = () => {
    const [modes, setModes] = useState<Mode[]>([]);
    const [loading, setLoading] = useState(true);
    const [newModeName, setNewModeName] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    
    // Edición
    const [editingModeId, setEditingModeId] = useState<string | null>(null);
    const [editingModeName, setEditingModeName] = useState('');
    const [confirmDelete, setConfirmDelete] = useState<{ isOpen: boolean; id: string | null }>({ isOpen: false, id: null });

    useEffect(() => {
        fetchModes();
    }, []);

    const fetchModes = async () => {
        try {
            const snap = await getDocs(collection(db, 'modes'));
            const data = snap.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Mode[];
            setModes(data.sort((a, b) => a.name.localeCompare(b.name)));
        } catch (error) {
            console.error('Error fetching modes:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddMode = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newModeName.trim()) return;

        setIsSaving(true);
        try {
            await addDoc(collection(db, 'modes'), {
                name: newModeName.trim()
            });
            setNewModeName('');
            await fetchModes();
        } catch (error) {
            console.error('Error adding mode:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteMode = async (id: string) => {
        setConfirmDelete({ isOpen: true, id });
    };

    const executeDeleteMode = async () => {
        if (!confirmDelete.id) return;
        try {
            await deleteDoc(doc(db, 'modes', confirmDelete.id));
            await fetchModes();
        } catch (error) {
            console.error('Error deleting mode:', error);
        } finally {
            setConfirmDelete({ isOpen: false, id: null });
        }
    };

    const handleStartEdit = (mode: Mode) => {
        setEditingModeId(mode.id);
        setEditingModeName(mode.name);
    };

    const handleCancelEdit = () => {
        setEditingModeId(null);
        setEditingModeName('');
    };

    const handleUpdateMode = async (id: string) => {
        if (!editingModeName.trim()) {
            handleCancelEdit();
            return;
        }

        setIsSaving(true);
        try {
            await updateDoc(doc(db, 'modes', id), {
                name: editingModeName.trim()
            });
            setEditingModeId(null);
            await fetchModes();
        } catch (error) {
            console.error('Error updating mode:', error);
        } finally {
            setIsSaving(false);
        }
    };


    return (
        <div className="min-h-screen bg-[#131313] text-white pb-24">
            {/* Header */}
            <div className="bg-[#1A1A1A] border-b border-[#333] sticky top-0 z-30 pt-safe">
                <div className="flex items-center p-4">
                    <Link to="/admin" className="p-2 -ml-2 text-white/70 hover:text-white transition-colors">
                        <ArrowLeft size={24} />
                    </Link>
                    <div className="ml-2 flex-1">
                        <h1 className="text-xl font-black uppercase tracking-widest text-white">Modos</h1>
                        <p className="text-xs font-medium text-gray-500 tracking-wider">Gestión de modos de clase</p>
                    </div>
                </div>
            </div>

            <div className="p-4 space-y-6">
                {/* Formulario de Añadir Modo */}
                <div className="bg-[#1A1A1A] border border-[#333] rounded-3xl p-6 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#E13038]/5 rounded-bl-full blur-2xl pointer-events-none"></div>
                    
                    <h2 className="text-sm font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                        <Plus size={16} className="text-[#E13038]" />
                        Nuevo Modo
                    </h2>

                    <form onSubmit={handleAddMode} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                                Nombre del Modo *
                            </label>
                            <input
                                type="text"
                                value={newModeName}
                                onChange={(e) => setNewModeName(e.target.value)}
                                className="w-full bg-[#131313] border border-[#333] rounded-2xl p-4 text-white focus:outline-none focus:border-[#E13038] transition-colors"
                                placeholder="Ej: ALMODÓVAR BOX..."
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isSaving || !newModeName.trim()}
                            className="w-full bg-[#E13038] text-white rounded-2xl py-4 font-black uppercase tracking-widest text-sm hover:bg-red-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:active:scale-100 mt-2"
                        >
                            {isSaving ? 'Guardando...' : 'Añadir Modo'}
                        </button>
                    </form>
                </div>

                {/* Lista de Modos */}
                <div>
                    <h2 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-4 pl-2">
                        Modos Registrados ({modes.length})
                    </h2>

                    {loading ? (
                        <div className="flex justify-center py-10">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#E13038]"></div>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {modes.map(mode => (
                                <div key={mode.id} className="bg-[#1A1A1A] border border-[#333] rounded-2xl p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-[#131313] border border-[#333] flex items-center justify-center">
                                            <Settings2 size={16} className="text-[#E13038]" />
                                        </div>
                                        <div className="flex-1">
                                            {editingModeId === mode.id ? (
                                                <input
                                                    type="text"
                                                    value={editingModeName}
                                                    onChange={(e) => setEditingModeName(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') handleUpdateMode(mode.id);
                                                        if (e.key === 'Escape') handleCancelEdit();
                                                    }}
                                                    autoFocus
                                                    className="w-full bg-[#131313] border border-[#E13038] rounded-xl px-3 py-2 text-white focus:outline-none text-sm uppercase font-bold tracking-widest"
                                                />
                                            ) : (
                                                <h3 className="font-bold text-white text-sm uppercase tracking-widest">{mode.name}</h3>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        {editingModeId === mode.id ? (
                                            <>
                                                <button
                                                    onClick={() => handleUpdateMode(mode.id)}
                                                    className="p-2 text-green-500 hover:text-green-400 transition-colors active:scale-90"
                                                >
                                                    <Check size={20} />
                                                </button>
                                                <button
                                                    onClick={handleCancelEdit}
                                                    className="p-2 text-gray-500 hover:text-white transition-colors active:scale-90"
                                                >
                                                    <X size={20} />
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <button
                                                    onClick={() => handleStartEdit(mode)}
                                                    className="p-3 text-gray-400 hover:text-white transition-colors active:scale-90"
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteMode(mode.id)}
                                                    className="p-3 text-gray-500 hover:text-[#E13038] transition-colors active:scale-90"
                                                >
                                                    <Trash2 size={20} />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))}

                            {modes.length === 0 && (
                                <div className="text-center py-10 text-gray-500 text-sm italic border border-dashed border-[#333] rounded-3xl">
                                    No hay modos registrados aún
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <AdminNavBar />

            <ConfirmModal 
                isOpen={confirmDelete.isOpen}
                onClose={() => setConfirmDelete({ isOpen: false, id: null })}
                onConfirm={executeDeleteMode}
                title="Eliminar Modo"
                message="¿Estás seguro de que quieres eliminar este Modo? Esto podría afectar a clases que ya tengan este modo asignado."
                confirmText="Eliminar"
            />
        </div>
    );
};

export default AdminModes;
