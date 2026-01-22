import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Users,
    CheckCircle2,
    Search,
    Send
} from 'lucide-react';
import { db, auth } from '../firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { sendNotificationToMultiple } from '../utils/notificationService';
import TopHeader from './TopHeader';

const SendNotification = () => {
    const navigate = useNavigate();
    const [isDarkMode] = useState(() => document.documentElement.classList.contains('dark'));


    // Form Data
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [selectedGroup, setSelectedGroup] = useState<string>('');
    const [recipientMode, setRecipientMode] = useState<'all' | 'select'>('all');
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

    // Data
    const [groups, setGroups] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [sending, setSending] = useState(false);

    // 1. Fetch Auth & Role
    useEffect(() => {
        // Simple role check for now - in prod use context or verify with DB
        const role = localStorage.getItem('role') || 'user';

        // If coach, we should fetch their group
        if (role === 'coach' && auth.currentUser) {
            // Assume we fetch coach profile. For now, let's just default to 'box' or similar if not found, 
            // or fetch from 'coaches' collection if we had the ID. 
            // Simplified: Coach usually has 1 main group or we let them pick from all if they are head coach.
            // Let's assume they can see all for now or we filter later.
        }
    }, []);

    // 2. Fetch Groups
    useEffect(() => {
        const q = query(collection(db, 'groups'), orderBy('name', 'asc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setGroups(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return () => unsubscribe();
    }, []);

    // 3. Fetch Users
    useEffect(() => {
        const q = query(collection(db, 'users'), orderBy('name', 'asc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const allUsers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setUsers(allUsers);
        });
        return () => unsubscribe();
    }, []);

    // 4. Filter Users based on Group
    useEffect(() => {
        let res = users;
        if (selectedGroup) {
            // Check if user.group matches or user.groups array contains it
            // Assuming simpler string match for now based on user profile structure seen in Agenda.tsx
            res = users.filter(u => {
                const g = u.group || (u.groups && u.groups[0]);
                return g && g.toLowerCase() === selectedGroup.toLowerCase();
            });
        }

        if (searchQuery) {
            res = res.filter(u => u.name.toLowerCase().includes(searchQuery.toLowerCase()));
        }
        setFilteredUsers(res);
    }, [users, selectedGroup, searchQuery]);


    const handleToggleUser = (uid: string) => {
        if (selectedUsers.includes(uid)) {
            setSelectedUsers(selectedUsers.filter(id => id !== uid));
        } else {
            setSelectedUsers([...selectedUsers, uid]);
        }
    };

    const handleSend = async () => {
        if (!title || !message) return;
        if (recipientMode === 'select' && selectedUsers.length === 0) return;
        if (recipientMode === 'all' && !selectedGroup && filteredUsers.length === 0) return; // Safety

        setSending(true);
        try {
            // Determine targets
            let targets: string[] = [];
            if (recipientMode === 'select') {
                targets = selectedUsers;
            } else {
                // All in filter
                targets = filteredUsers.map(u => u.id);
            }

            if (targets.length === 0) {
                alert("No hay destinatarios seleccionados");
                setSending(false);
                return;
            }

            await sendNotificationToMultiple(
                targets,
                'message',
                title,
                message
            );

            // Reset
            setTitle('');
            setMessage('');
            setRecipientMode('all');
            setSelectedUsers([]);
            alert(`Mensaje enviado a ${targets.length} usuarios.`);
            navigate(-1);

        } catch (e) {
            console.error(e);
            alert("Error al enviar");
        } finally {
            setSending(false);
        }
    };

    return (
        <div className={`min-h-screen transition-colors duration-500 pb-20 ${isDarkMode ? 'bg-[#1F2128] text-white' : 'bg-[#F3F4F6] text-gray-900'}`}>
            <div className="max-w-md mx-auto px-6 pt-6 space-y-6">
                <TopHeader
                    title="Enviar Mensaje"
                    subtitle="Notificación Push / In-App"
                    onBack={() => navigate(-1)}
                />

                {/* 1. Select Group */}
                <section className="space-y-3">
                    <label className="text-xs font-black uppercase text-gray-400 tracking-wider ml-2">1. Seleccionar Grupo</label>
                    <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                        <button
                            onClick={() => setSelectedGroup('')}
                            className={`px-4 py-2 rounded-xl whitespace-nowrap text-xs font-bold uppercase transition-all ${selectedGroup === ''
                                ? 'bg-[#FF1F40] text-white shadow-lg shadow-red-500/30'
                                : 'bg-white dark:bg-[#2A2D3A] text-gray-500'
                                }`}
                        >
                            Todos (Kibera)
                        </button>
                        {groups.map(g => (
                            <button
                                key={g.id}
                                onClick={() => setSelectedGroup(g.name)}
                                className={`px-4 py-2 rounded-xl whitespace-nowrap text-xs font-bold uppercase transition-all ${selectedGroup === g.name
                                    ? 'bg-[#FF1F40] text-white shadow-lg shadow-red-500/30'
                                    : 'bg-white dark:bg-[#2A2D3A] text-gray-500'
                                    }`}
                            >
                                {g.name}
                            </button>
                        ))}
                    </div>
                </section>

                {/* 2. Content */}
                <section className="space-y-3">
                    <label className="text-xs font-black uppercase text-gray-400 tracking-wider ml-2">2. Contenido</label>
                    <input
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        placeholder="Título (Ej: Cambio de horario)"
                        className="w-full p-4 rounded-2xl bg-white dark:bg-[#2A2D3A] font-bold outline-none ring-2 ring-transparent focus:ring-[#FF1F40] transition-all"
                    />
                    <textarea
                        value={message}
                        onChange={e => setMessage(e.target.value)}
                        placeholder="Escribe tu mensaje aquí..."
                        className="w-full p-4 h-32 rounded-2xl bg-white dark:bg-[#2A2D3A] font-medium outline-none ring-2 ring-transparent focus:ring-[#FF1F40] transition-all resize-none"
                    />
                </section>

                {/* 3. Recipients */}
                <section className="space-y-3">
                    <div className="flex justify-between items-end px-2">
                        <label className="text-xs font-black uppercase text-gray-400 tracking-wider">3. Destinatarios</label>
                        <div className="flex bg-gray-200 dark:bg-[#2A2D3A] rounded-lg p-1">
                            <button
                                onClick={() => setRecipientMode('all')}
                                className={`px-3 py-1 rounded-md text-[10px] font-black uppercase transition-all ${recipientMode === 'all' ? 'bg-white dark:bg-[#1F2128] text-[#FF1F40] shadow-sm' : 'text-gray-500'}`}
                            >
                                Todo el Grupo
                            </button>
                            <button
                                onClick={() => setRecipientMode('select')}
                                className={`px-3 py-1 rounded-md text-[10px] font-black uppercase transition-all ${recipientMode === 'select' ? 'bg-white dark:bg-[#1F2128] text-[#FF1F40] shadow-sm' : 'text-gray-500'}`}
                            >
                                Seleccionar
                            </button>
                        </div>
                    </div>

                    {recipientMode === 'all' ? (
                        <div className="bg-green-500/10 text-green-500 p-4 rounded-2xl flex items-center gap-3">
                            <Users size={20} />
                            <p className="text-xs font-bold">Se enviará a <span className="underline">{filteredUsers.length} usuarios</span></p>
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-[#2A2D3A] rounded-[2rem] p-4 shadow-sm border border-gray-100 dark:border-gray-800">
                            {/* Search */}
                            <div className="relative mb-4">
                                <Search className="absolute left-4 top-3.5 text-gray-400" size={16} />
                                <input
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    placeholder="Buscar usuario..."
                                    className="w-full pl-10 pr-4 py-3 bg-gray-100 dark:bg-[#1F2128] rounded-xl text-xs font-bold outline-none"
                                />
                            </div>

                            <div className="max-h-60 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                                {filteredUsers.map(u => {
                                    const isSelected = selectedUsers.includes(u.id);
                                    return (
                                        <div
                                            key={u.id}
                                            onClick={() => handleToggleUser(u.id)}
                                            className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${isSelected
                                                ? 'bg-[#FF1F40]/10 border border-[#FF1F40]/20'
                                                : 'hover:bg-gray-50 dark:hover:bg-white/5'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                                                    {u.photoURL ? <img src={u.photoURL} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[10px] font-black opacity-50">{u.name?.substring(0, 2) || 'VN'}</div>}
                                                </div>
                                                <span className={`text-xs font-bold ${isSelected ? 'text-[#FF1F40]' : 'text-gray-600 dark:text-gray-300'}`}>{u.name}</span>
                                            </div>
                                            {isSelected && <CheckCircle2 size={16} className="text-[#FF1F40]" />}
                                        </div>
                                    )
                                })}
                            </div>
                            <p className="text-center text-[10px] text-gray-400 mt-2 font-medium">{selectedUsers.length} seleccionados</p>
                        </div>
                    )}
                </section>

                <button
                    onClick={handleSend}
                    disabled={sending || !title || !message}
                    className="w-full py-4 bg-[#FF1F40] disabled:bg-gray-400 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-red-500/30 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                    {sending ? 'Enviando...' : (
                        <>
                            <Send size={18} /> Enviar Mensaje
                        </>
                    )}
                </button>

            </div>
        </div>
    );
};

export default SendNotification;
