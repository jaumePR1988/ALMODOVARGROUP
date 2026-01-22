import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ChevronLeft,
    Trophy,
    TrendingUp,
    Plus,
    Search,
    History,
    Trash2,
    Save,
    Dumbbell
} from 'lucide-react';
import TopHeader from './TopHeader';
import PremiumModal from './PremiumModal';
import { db, auth } from '../firebase';
import { collection, query, where, orderBy, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp, getDocs } from 'firebase/firestore';

const PersonalRecords = () => {
    const navigate = useNavigate();
    const [isDarkMode] = useState(() => document.documentElement.classList.contains('dark'));
    const [activeTab, setActiveTab] = useState<'list' | 'history'>('list');

    // Data
    const [records, setRecords] = useState<any[]>([]);
    const [exercises, setExercises] = useState<any[]>([]); // Library
    const [isLoading, setIsLoading] = useState(true);

    // Modal / Form
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedExercise, setSelectedExercise] = useState('');
    const [weight, setWeight] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [notes, setNotes] = useState('');

    // Alert Modal
    const [modalConfig, setModalConfig] = useState<any>({ isOpen: false, type: 'success', title: '', message: '' });

    // 1. Fetch User PRs
    useEffect(() => {
        if (!auth.currentUser) return;

        const q = query(
            collection(db, 'personal_records'),
            where('userId', '==', auth.currentUser.uid)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            // Client side sort by weight desc per exercise or date? 
            // Let's sort by date desc for history, and we'll process 'best' for the list.
            data.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
            setRecords(data);
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, []);

    // 2. Fetch Exercise Library (for dropdown)
    useEffect(() => {
        const q = query(collection(db, 'exercises'), orderBy('name', 'asc'));
        getDocs(q).then(snap => {
            setExercises(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });
    }, []);

    // Calculate Bests
    const bestRecords = records.reduce((acc: any, record) => {
        // If we don't have this exercise yet, or this record is heavier, take it
        const currentBest = acc[record.exerciseName];
        if (!currentBest || parseFloat(record.weight) > parseFloat(currentBest.weight)) {
            acc[record.exerciseName] = record;
        }
        return acc;
    }, {});

    const bestList = Object.values(bestRecords);

    const handleSave = async () => {
        if (!selectedExercise || !weight) return;

        try {
            const exName = exercises.find(e => e.id === selectedExercise)?.name || 'Unknown';

            await addDoc(collection(db, 'personal_records'), {
                userId: auth.currentUser?.uid,
                exerciseId: selectedExercise,
                exerciseName: exName,
                weight: parseFloat(weight),
                date,
                notes,
                createdAt: serverTimestamp()
            });

            setShowAddModal(false);
            setWeight('');
            setNotes('');
            // Feedback
            setModalConfig({
                isOpen: true,
                type: 'success',
                title: '¡Nueva Marca!',
                message: `Has registrado ${weight}kg en ${exName}.`,
                onConfirm: () => setModalConfig({ ...modalConfig, isOpen: false })
            });

        } catch (error) {
            console.error("Error saving PR:", error);
            setModalConfig({
                isOpen: true,
                type: 'danger',
                title: 'Error',
                message: 'No se pudo guardar el registro.',
                onConfirm: () => setModalConfig({ ...modalConfig, isOpen: false })
            });
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm("¿Seguro que quieres borrar esta marca?")) {
            await deleteDoc(doc(db, 'personal_records', id));
        }
    }

    return (
        <div className={`min-h-screen transition-colors duration-500 pb-20 ${isDarkMode ? 'bg-[#1F2128] text-white' : 'bg-[#F3F4F6] text-gray-900'}`}>
            <div className="max-w-md mx-auto px-6 pt-6">
                <TopHeader
                    title="Mis Marcas"
                    subtitle="Historial y Récords Personales"
                    onBack={() => navigate(-1)}
                />

                {/* TABS */}
                <div className="flex bg-gray-200 dark:bg-[#2A2D3A] p-1 rounded-xl mt-6 mb-6">
                    <button
                        onClick={() => setActiveTab('list')}
                        className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${activeTab === 'list'
                                ? 'bg-white dark:bg-[#1F2128] text-[#FF1F40] shadow-sm'
                                : 'text-gray-500'
                            }`}
                    >
                        <Trophy size={16} /> Mis Récords
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${activeTab === 'history'
                                ? 'bg-white dark:bg-[#1F2128] text-[#FF1F40] shadow-sm'
                                : 'text-gray-500'
                            }`}
                    >
                        <History size={16} /> Historial
                    </button>
                </div>

                {/* CONTENT */}
                {activeTab === 'list' ? (
                    <div className="space-y-4">
                        {bestList.length === 0 ? (
                            <div className="text-center py-10 opacity-50">
                                <Trophy size={48} className="mx-auto mb-4 text-gray-400" />
                                <p className="text-sm font-bold uppercase">No tienes marcas registradas</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-4">
                                {bestList.map((record: any) => (
                                    <div key={record.id} className={`p-4 rounded-[2rem] relative overflow-hidden ${isDarkMode ? 'bg-[#2A2D3A]' : 'bg-white shadow-xl shadow-gray-200/50'}`}>
                                        <div className="absolute top-0 right-0 w-16 h-16 bg-[#FF1F40]/5 rounded-bl-[2rem] flex items-center justify-center -mr-2 -mt-2">
                                            <Trophy size={20} className="text-[#FF1F40] opacity-50" />
                                        </div>

                                        <div className="mb-4">
                                            <h3 className="text-[10px] font-black uppercase text-gray-500 tracking-widest mb-1">Ejercicio</h3>
                                            <p className="text-sm font-black italic uppercase leading-tight truncate pr-2">{record.exerciseName}</p>
                                        </div>

                                        <div>
                                            <h3 className="text-[10px] font-black uppercase text-gray-500 tracking-widest mb-1">1RM Max</h3>
                                            <div className="flex items-end gap-1">
                                                <span className="text-3xl font-black text-[#FF1F40]">{record.weight}</span>
                                                <span className="text-xs font-bold text-gray-400 mb-1.5">kg</span>
                                            </div>
                                        </div>
                                        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-white/5 flex justify-between items-center">
                                            <span className="text-[9px] font-bold text-gray-400">{record.date}</span>
                                            {/* Could add a % chart here later */}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {records.length === 0 ? (
                            <div className="text-center py-10 opacity-50">
                                <History size={48} className="mx-auto mb-4 text-gray-400" />
                                <p className="text-sm font-bold uppercase">No hay historial</p>
                            </div>
                        ) : (
                            records.map((record: any) => (
                                <div key={record.id} className={`p-4 rounded-2xl flex items-center justify-between ${isDarkMode ? 'bg-[#2A2D3A]' : 'bg-white shadow-sm border border-gray-100'}`}>
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-500">
                                            <Dumbbell size={18} />
                                        </div>
                                        <div>
                                            <h4 className={`text-xs font-black uppercase ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{record.exerciseName}</h4>
                                            <p className="text-[10px] text-gray-500 font-bold">{record.date}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="text-lg font-black text-[#FF1F40]">{record.weight}<span className="text-xs text-gray-400 ml-0.5">kg</span></span>
                                        <button onClick={() => handleDelete(record.id)} className="text-gray-400 hover:text-red-500">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>

            {/* FAB ADD */}
            <div className="fixed bottom-10 right-6 z-50">
                <button
                    onClick={() => setShowAddModal(true)}
                    className="w-14 h-14 bg-[#FF1F40] rounded-full flex items-center justify-center text-white shadow-xl shadow-red-500/40 active:scale-90 transition-transform"
                >
                    <Plus size={28} strokeWidth={3} />
                </button>
            </div>

            {/* ADD PR MODAL */}
            {showAddModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className={`w-full max-w-sm rounded-[2rem] p-6 shadow-2xl relative ${isDarkMode ? 'bg-[#1F2128]' : 'bg-white'}`}>
                        <button
                            onClick={() => setShowAddModal(false)}
                            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white transition-colors"
                        >
                            <Trash2 className="rotate-45" size={24} /> {/* Actually X icon but using Trash as X for now logic reuse... wait, X icon */}
                        </button>

                        <h2 className="text-2xl font-black italic uppercase mb-6">Nueva Marca</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest pl-1 mb-1 block">Ejercicio</label>
                                <select
                                    value={selectedExercise}
                                    onChange={(e) => setSelectedExercise(e.target.value)}
                                    className={`w-full p-4 rounded-xl outline-none font-bold text-sm bg-gray-100 dark:bg-[#2A2D3A] border-2 border-transparent focus:border-[#FF1F40] ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                                >
                                    <option value="">Selecciona ejercicio...</option>
                                    {exercises.map(ex => (
                                        <option key={ex.id} value={ex.id}>{ex.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest pl-1 mb-1 block">Peso (Kg)</label>
                                    <input
                                        type="number"
                                        value={weight}
                                        onChange={(e) => setWeight(e.target.value)}
                                        placeholder="0.0"
                                        className={`w-full p-4 rounded-xl outline-none font-black text-lg bg-gray-100 dark:bg-[#2A2D3A] border-2 border-transparent focus:border-[#FF1F40] ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest pl-1 mb-1 block">Fecha</label>
                                    <input
                                        type="date"
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        className={`w-full p-4 rounded-xl outline-none font-bold text-sm bg-gray-100 dark:bg-[#2A2D3A] border-2 border-transparent focus:border-[#FF1F40] ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest pl-1 mb-1 block">Notas (Opcional)</label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Sensaciones, equipamiento..."
                                    className={`w-full p-4 rounded-xl outline-none font-medium text-sm bg-gray-100 dark:bg-[#2A2D3A] border-2 border-transparent focus:border-[#FF1F40] ${isDarkMode ? 'text-white' : 'text-gray-900'} resize-none h-24`}
                                />
                            </div>

                            <button
                                onClick={handleSave}
                                disabled={!selectedExercise || !weight}
                                className="w-full py-4 bg-[#FF1F40] text-white rounded-xl font-black uppercase tracking-widest shadow-lg shadow-red-500/30 active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100 mt-2"
                            >
                                Guardar Marca
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <PremiumModal
                isOpen={modalConfig.isOpen}
                type={modalConfig.type}
                title={modalConfig.title}
                message={modalConfig.message}
                onConfirm={modalConfig.onConfirm}
                onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
                confirmText="Aceptar"
                cancelText="" // Hide cancel
            />

        </div>
    );
};

export default PersonalRecords;
