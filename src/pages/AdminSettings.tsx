import { useState, useEffect } from 'react';
import { LogOut, Save, Clock, CalendarDays, Settings, User, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import AdminNavBar from '../components/AdminNavBar';
import PremiumAlert from '../components/PremiumAlert';

const AdminSettings = () => {
    const { signOut } = useAuth();
    const [unlockDay, setUnlockDay] = useState(6); // 6 = Sábado
    const [unlockTime, setUnlockTime] = useState('10:00');
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);

    // Popup state
    const [alertConfig, setAlertConfig] = useState<{ isOpen: boolean; title: string; message: string; type: 'success' | 'error' }>({ isOpen: false, title: '', message: '', type: 'success' });

    const showAlert = (title: string, message: string, type: 'success' | 'error' = 'success') => {
        setAlertConfig({ isOpen: true, title, message, type });
    };

    const daysOfWeek = [
        { id: 1, label: 'Lunes' },
        { id: 2, label: 'Martes' },
        { id: 3, label: 'Miércoles' },
        { id: 4, label: 'Jueves' },
        { id: 5, label: 'Viernes' },
        { id: 6, label: 'Sábado' },
        { id: 0, label: 'Domingo' }
    ];

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const docRef = doc(db, 'settings', 'reservationRules');
                const docSnap = await getDoc(docRef);
                
                if (docSnap.exists()) {
                    setUnlockDay(docSnap.data().unlockDayIndex ?? 6);
                    setUnlockTime(docSnap.data().unlockTime ?? '10:00');
                }
            } catch (error) {
                console.error("Error fetching reservation rules:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchSettings();
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        
        try {
            await setDoc(doc(db, 'settings', 'reservationRules'), {
                unlockDayIndex: unlockDay,
                unlockTime: unlockTime,
                updatedAt: new Date()
            }, { merge: true });
            
            showAlert('Éxito', 'Ajustes guardados correctamente.', 'success');
        } catch (error) {
            console.error("Error saving reservation rules:", error);
            showAlert('Error', 'Hubo un error al guardar los ajustes.', 'error');
        } finally {
            setSaving(false);
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
                </div>
            </header>

            <main className="pt-24 pb-32 px-6 max-w-[480px] mx-auto min-h-screen">
                {/* Section Header */}
                <div className="mb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <span className="text-[#E13038] text-[10px] tracking-[0.3em] font-black uppercase">Sistema</span>
                    <h2 className="text-4xl font-black leading-none tracking-tighter mt-2 uppercase text-white flex items-center gap-3">
                        <Settings size={36} className="text-[#E13038]" /> AJUSTES
                    </h2>
                </div>

                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                    {/* Mi Perfil Personal */}
                    <div className="bg-[#1c1b1b] border border-[#333] rounded-2xl p-6 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-[#1A1A1A] rounded-xl text-[#E13038]">
                                <User size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-black tracking-tight uppercase text-white">Mi Perfil</h2>
                                <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mt-1">Avatar y Contraseña</p>
                            </div>
                        </div>

                        <Link to="/profile" className="w-full flex justify-between items-center bg-[#2a2a2a] hover:bg-[#333] border border-[#333] text-white p-4 rounded-xl transition-colors active:scale-95">
                            <span className="font-bold text-sm tracking-widest uppercase">Configurar Cuenta</span>
                            <ArrowRight size={20} className="text-[#E13038]" />
                        </Link>
                    </div>

                    {!loading ? (
                        <form onSubmit={handleSave} className="space-y-8">
                            
                            {/* THE SATURDAY DROP SETTINGS */}
                            <div className="bg-[#1c1b1b] p-6 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] border border-[#333]">
                                <div className="mb-6 border-b border-[#333] pb-4">
                                <h3 className="text-xl font-black text-white uppercase tracking-tight">The Saturday Drop</h3>
                                <p className="text-xs text-gray-500 mt-1 uppercase font-bold tracking-widest">Apertura Semanal de Reservas</p>
                            </div>

                            <div className="space-y-6">
                                {/* Día de Desbloqueo */}
                                <div className="space-y-3">
                                    <label className="text-[10px] font-bold tracking-widest text-[#E13038] uppercase flex items-center gap-2">
                                        <CalendarDays size={14} /> Día de Apertura
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {daysOfWeek.map(day => (
                                            <button
                                                key={day.id}
                                                type="button"
                                                onClick={() => setUnlockDay(day.id)}
                                                className={`py-3 px-4 rounded-lg font-black text-xs uppercase transition-all ${unlockDay === day.id ? 'bg-[#E13038] text-white shadow-[0_0_15px_rgba(225,48,56,0.4)]' : 'bg-[#2a2a2a] text-gray-400 hover:bg-[#333]'}`}
                                            >
                                                {day.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Hora de Desbloqueo */}
                                <div className="space-y-3 pt-4 border-t border-[#333]">
                                    <label className="text-[10px] font-bold tracking-widest text-[#E13038] uppercase flex items-center gap-2">
                                        <Clock size={14} /> Hora Exacta
                                    </label>
                                    <div className="flex items-center gap-4 bg-[#2a2a2a] p-4 rounded-xl">
                                        <input 
                                            type="time" 
                                            value={unlockTime}
                                            onChange={(e) => setUnlockTime(e.target.value)}
                                            className="bg-transparent border-none text-4xl font-black p-0 focus:ring-0 text-white outline-none w-full"
                                            required
                                        />
                                    </div>
                                    <p className="text-[10px] text-gray-500 uppercase font-bold">A partir de esta hora, los usuarios podrán ver y reservar las clases de la PRÓXIMA semana.</p>
                                </div>
                            </div>
                        </div>

                        {/* Submit Action */}
                        <div className="pt-6">
                            <button 
                                type="submit"
                                disabled={saving}
                                className="w-full h-16 bg-gradient-to-r from-[#E13038] to-[#ff535b] rounded-lg font-black text-white tracking-[0.2em] uppercase active:scale-95 transition-all flex items-center justify-center gap-3 shadow-[0_15px_30px_rgba(225,48,56,0.3)] disabled:opacity-50"
                            >
                                <span>{saving ? 'GUARDANDO...' : 'GUARDAR AJUSTES'}</span>
                                <Save size={24} className="text-white" />
                            </button>
                        </div>
                        </form>
                    ) : (
                        <div className="w-full py-12 flex justify-center">
                            <div className="w-8 h-8 rounded-full border-4 border-[#333] border-t-[#E13038] animate-spin"></div>
                        </div>
                    )}
                </div>
            </main>

            <AdminNavBar />

            <PremiumAlert
                isOpen={alertConfig.isOpen}
                onClose={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))}
                title={alertConfig.title}
                message={alertConfig.message}
                type={alertConfig.type}
            />
        </div>
    );
};

export default AdminSettings;
