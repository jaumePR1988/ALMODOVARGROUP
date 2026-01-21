import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Search,
    Plus,
    Users,
    Layers,
    MoreVertical,
    Edit2,
    Filter,
    X,
    Loader2,
    Image,
    Camera,
    AlertCircle,
    CheckCircle2
} from 'lucide-react';
import { db } from '../firebase';
import { collection, onSnapshot, query, orderBy, doc, updateDoc, writeBatch, addDoc, serverTimestamp } from 'firebase/firestore';
import TopHeader from './TopHeader';

interface GroupCard {
    id: string;
    name: string;
    category: string;
    description: string;
    tags: string[];
    memberCount: number;
    image: string;
    members: string[];
}

interface User {
    id: string;
    name: string;
    email: string;
    role?: string;
    group?: string; // Legacy
    groups?: string[]; // Multiple groups support
    status?: string;
    photoURL?: string;
}

const AdminGroupsList = ({ onLogout }: { onLogout: () => void }) => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [groups, setGroups] = useState<GroupCard[]>([]);
    const [stats, setStats] = useState({ activeGroups: 0, totalMembers: 0 });
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState<GroupCard | null>(null);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [userSearch, setUserSearch] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Group Creation/Edit State
    const [newGroupName, setNewGroupName] = useState('');
    const [newGroupCategory, setNewGroupCategory] = useState('Entrenamiento Funcional');
    const [newGroupDescription, setNewGroupDescription] = useState('');
    const [newGroupImage, setNewGroupImage] = useState('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80');

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [groupToEdit, setGroupToEdit] = useState<GroupCard | null>(null);
    const [userToConfirm, setUserToConfirm] = useState<{ user: User, targetGroup: GroupCard } | null>(null);
    const [isDarkMode, setIsDarkMode] = useState(() => document.documentElement.classList.contains('dark'));

    useEffect(() => {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'class') {
                    setIsDarkMode(document.documentElement.classList.contains('dark'));
                }
            });
        });
        observer.observe(document.documentElement, { attributes: true });

        const q = query(collection(db, 'groups'), orderBy('name', 'asc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const groupsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...(doc.data() as any)
            })) as GroupCard[];
            setGroups(groupsData);

            const total = groupsData.reduce((acc, g) => acc + (g.memberCount || 0), 0);
            setStats({
                activeGroups: snapshot.size,
                totalMembers: total
            });
        });

        // Fetch users for assignment
        const usersUnsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
            const usersData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as User[];
            setAllUsers(usersData);
        });

        return () => {
            observer.disconnect();
            unsubscribe();
            usersUnsubscribe();
        };
    }, []);

    const filteredGroups = groups.filter(g =>
        g.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const compressImage = (file: File): Promise<string> => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new window.Image();
                img.src = event.target?.result as string;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 800;
                    const MAX_HEIGHT = 800;
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width;
                            width = MAX_WIDTH;
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height;
                            height = MAX_HEIGHT;
                        }
                    }
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0, width, height);
                    resolve(canvas.toDataURL('image/jpeg', 0.7));
                };
            };
        });
    };

    const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const compressed = await compressImage(file);
        setNewGroupImage(compressed);
    };

    const filteredUsers = allUsers.filter(u =>
        (u.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
            u.email?.toLowerCase().includes(userSearch.toLowerCase())) &&
        u.status !== 'pending'
    );

    const handleAssignUser = async (user: User) => {
        if (!selectedGroup || isSubmitting) return;
        setIsSubmitting(true);

        try {
            const batch = writeBatch(db);
            const userRef = doc(db, 'users', user.id);

            // Normalize groups to array
            const currentGroups = Array.isArray(user.groups)
                ? user.groups
                : (user.group ? [user.group] : []);

            if (currentGroups.includes(selectedGroup.name)) {
                setIsSubmitting(false);
                return;
            }

            const isRestricted = user.role !== 'admin' && user.role !== 'coach';

            // Reassignment Warning for Clients
            if (isRestricted && currentGroups.length > 0 && !userToConfirm) {
                setUserToConfirm({ user, targetGroup: selectedGroup });
                setIsSubmitting(false);
                return;
            }

            let newGroups;

            if (isRestricted) {
                // Clients only in one group
                const oldGroupName = currentGroups[0];
                newGroups = [selectedGroup.name];

                if (oldGroupName) {
                    const oldGroup = groups.find(g => g.name === oldGroupName);
                    if (oldGroup && oldGroup.id !== selectedGroup.id) {
                        const oldGroupRef = doc(db, 'groups', oldGroup.id);
                        batch.update(oldGroupRef, { memberCount: Math.max(0, (oldGroup.memberCount || 0) - 1) });
                    }
                }
            } else {
                // Admins/Coaches can be in multiple
                newGroups = [...currentGroups, selectedGroup.name];
            }

            batch.update(userRef, {
                groups: newGroups,
                group: newGroups[0] // Fallback for legacy code
            });

            // Increment new group memberCount
            const newGroupRef = doc(db, 'groups', selectedGroup.id);
            batch.update(newGroupRef, { memberCount: (selectedGroup.memberCount || 0) + 1 });

            await batch.commit();
            setUserSearch('');
            setUserToConfirm(null);
        } catch (error) {
            console.error("Error assigning user:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUnassignUser = async (user: User, currentGroup: GroupCard) => {
        if (isSubmitting) return;
        setIsSubmitting(true);

        try {
            const batch = writeBatch(db);
            const userRef = doc(db, 'users', user.id);

            const currentGroups = Array.isArray(user.groups)
                ? user.groups
                : (user.group ? [user.group] : []);

            const newGroups = currentGroups.filter(g => g !== currentGroup.name);

            batch.update(userRef, {
                groups: newGroups,
                group: newGroups.length > 0 ? newGroups[0] : null
            });

            const groupRef = doc(db, 'groups', currentGroup.id);
            batch.update(groupRef, { memberCount: Math.max(0, (currentGroup.memberCount || 0) - 1) });

            await batch.commit();
        } catch (error) {
            console.error("Error unassigning user:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const openEditModal = (group: GroupCard) => {
        setGroupToEdit(group);
        setNewGroupName(group.name || '');
        setNewGroupCategory(group.category || 'Entrenamiento Funcional');
        setNewGroupDescription(group.description || '');
        setNewGroupImage(group.image || 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80');
        setIsEditModalOpen(true);
    };

    const handleUpdateGroup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmitting || !groupToEdit || !newGroupName) return;
        setIsSubmitting(true);

        try {
            const groupRef = doc(db, 'groups', groupToEdit.id);
            await updateDoc(groupRef, {
                name: newGroupName,
                category: newGroupCategory || 'Entrenamiento Funcional',
                description: newGroupDescription || '',
                image: newGroupImage || 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80',
                updatedAt: serverTimestamp()
            });

            setIsEditModalOpen(false);
            setGroupToEdit(null);
            setNewGroupName('');
            setNewGroupDescription('');
            alert('¡Grupo actualizado con éxito!');
        } catch (error) {
            console.error("Error updating group:", error);
            alert('Error al actualizar el grupo. Reclama a soporte.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCreateGroup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmitting || !newGroupName) return;
        setIsSubmitting(true);

        try {
            await addDoc(collection(db, 'groups'), {
                name: newGroupName,
                category: newGroupCategory || 'Entrenamiento Funcional',
                description: newGroupDescription || '',
                image: newGroupImage || 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80',
                memberCount: 0,
                tags: ['NUEVO'],
                createdAt: serverTimestamp()
            });

            setIsCreateModalOpen(false);
            setNewGroupName('');
            setNewGroupDescription('');
            alert('¡Grupo creado con éxito!');
        } catch (error) {
            console.error("Error creating group:", error);
            alert('Error al crear el grupo.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-[#1F2128] text-white' : 'bg-[#F3F4F6] text-gray-900'} font-sans pb-32`}>
            <div className="max-w-md mx-auto px-6 pt-6 space-y-6">

                {/* Header */}
                <TopHeader
                    title="Gestión de Grupos"
                    subtitle="Organización del Box"
                    onBack={() => navigate('/admin')}
                    onLogout={onLogout}
                />

                {/* Search Bar */}
                <div className="flex gap-3">
                    <div className={`${isDarkMode ? 'bg-[#262932]' : 'bg-white shadow-sm'} flex-1 rounded-2xl flex items-center px-4 py-3 border ${isDarkMode ? 'border-white/5' : 'border-gray-200'} shadow-inner`}>
                        <Search size={20} className="text-gray-500 mr-3" />
                        <input
                            type="text"
                            placeholder="Buscar grupo..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-transparent border-none outline-none text-sm w-full font-medium"
                        />
                    </div>
                    <button className={`${isDarkMode ? 'bg-[#262932]' : 'bg-white shadow-sm'} p-3 rounded-2xl border ${isDarkMode ? 'border-white/5' : 'border-gray-200'} flex items-center justify-center`}>
                        <Filter size={20} className="text-gray-400" />
                    </button>
                </div>

                {/* Create Button */}
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="w-full bg-[#FF1F40] py-5 rounded-[1.5rem] flex items-center justify-center gap-3 shadow-[0_10px_30px_rgba(255,31,64,0.3)] active:scale-95 transition-all"
                >
                    <Plus size={24} strokeWidth={3} />
                    <span className="font-black uppercase tracking-widest text-sm">Crear Nuevo Grupo</span>
                </button>

                {/* Stats cards */}
                <div className="grid grid-cols-2 gap-4">
                    <div className={`${isDarkMode ? 'bg-[#262932]' : 'bg-white'} p-6 rounded-[2rem] border ${isDarkMode ? 'border-white/5' : 'border-gray-200'} flex flex-col justify-between h-36 relative overflow-hidden shadow-sm`}>
                        <div className="z-10">
                            <span className="text-4xl font-black block tracking-tighter">{stats.activeGroups}</span>
                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-1 block">Grupos Activos</span>
                        </div>
                        <div className="absolute right-4 bottom-4 w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400">
                            <Layers size={20} />
                        </div>
                    </div>
                    <div className={`${isDarkMode ? 'bg-[#262932]' : 'bg-white'} p-6 rounded-[2rem] border ${isDarkMode ? 'border-white/5' : 'border-gray-200'} flex flex-col justify-between h-36 relative overflow-hidden shadow-sm`}>
                        <div className="z-10">
                            <span className="text-4xl font-black block tracking-tighter">{stats.totalMembers}</span>
                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-1 block">Miembros Totales</span>
                        </div>
                        <div className="absolute right-4 bottom-4 w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center text-green-400">
                            <Users size={20} />
                        </div>
                    </div>
                </div>

                {/* List Title */}
                <div>
                    <h2 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 mb-6">Mis Grupos de Trabajo</h2>

                    <div className="space-y-6">
                        {filteredGroups.map(group => (
                            <div key={group.id} className={`${isDarkMode ? 'bg-[#262932] border-white/5' : 'bg-white border-gray-100 shadow-xl shadow-gray-200/50'} rounded-[2.5rem] p-6 border relative transition-all`}>
                                <div className="flex items-start gap-4 mb-4">
                                    <div className={`w-16 h-16 rounded-[1.25rem] overflow-hidden ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'} shadow-lg shrink-0`}>
                                        <img src={group.image || 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&q=80'} alt={group.name} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start">
                                            <h3 className="font-black text-lg italic uppercase tracking-tight truncate">{group.name}</h3>
                                            <button className="text-gray-500 p-1">
                                                <MoreVertical size={20} />
                                            </button>
                                        </div>
                                        <p className="text-[#FF1F40] text-xs font-black uppercase tracking-wider">{group.category}</p>
                                        <p className="text-[10px] text-gray-400 font-medium leading-relaxed mt-2 line-clamp-2">
                                            {group.description}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-2 mb-6">
                                    {group.tags?.map((tag: any) => (
                                        <span key={tag} className={`${isDarkMode ? 'bg-[#1F2128] border-white/5 text-gray-400' : 'bg-gray-100 border-gray-200 text-gray-500'} text-[9px] font-black px-3 py-1.5 rounded-lg border uppercase tracking-widest`}>
                                            {tag}
                                        </span>
                                    ))}
                                </div>

                                <div className={`flex items-center justify-between border-t ${isDarkMode ? 'border-white/5' : 'border-gray-100'} pt-5`}>
                                    <div className="flex items-center gap-2">
                                        <div className="flex -space-x-2">
                                            {/* Find members of this group */}
                                            {allUsers.filter(u =>
                                                (u.groups?.includes(group.name)) || (u.group === group.name)
                                            ).slice(0, 3).map((user, idx) => (
                                                <div key={idx} className={`w-8 h-8 rounded-full border-2 ${isDarkMode ? 'border-[#262932]' : 'border-white'} overflow-hidden bg-[#FF1F40] flex items-center justify-center text-[10px] font-black text-white shrink-0 shadow-sm`}>
                                                    {user.photoURL ? (
                                                        <img src={user.photoURL} className="w-full h-full object-cover" alt="" />
                                                    ) : (
                                                        user.name?.charAt(0)
                                                    )}
                                                </div>
                                            ))}
                                            {allUsers.filter(u =>
                                                (u.groups?.includes(group.name)) || (u.group === group.name)
                                            ).length > 3 && (
                                                    <div className="w-8 h-8 rounded-full border-2 border-[#262932] bg-[#3A3F4B] flex items-center justify-center text-[10px] font-black italic">
                                                        +{allUsers.filter(u => (u.groups?.includes(group.name)) || (u.group === group.name)).length - 3}
                                                    </div>
                                                )}
                                        </div>
                                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                                            {allUsers.filter(u => (u.groups?.includes(group.name)) || (u.group === group.name)).length} Miembros
                                        </span>
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => {
                                                setSelectedGroup(group);
                                                setIsAssignModalOpen(true);
                                            }}
                                            className={`${isDarkMode ? 'bg-[#1F2128] border-white/5' : 'bg-gray-50 border-gray-200'} px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border hover:bg-[#FF1F40]/10 hover:text-[#FF1F40] transition-all`}
                                        >
                                            <Users size={12} />
                                            Asignar
                                        </button>
                                        <button
                                            onClick={() => openEditModal(group)}
                                            className="w-10 h-10 bg-blue-500/10 text-blue-500 rounded-xl flex items-center justify-center border border-blue-500/10 active:scale-90 transition-all hover:bg-blue-500 hover:text-white"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>

            {/* Assignment Modal */}
            {isAssignModalOpen && selectedGroup && (
                <div className="fixed inset-0 z-[1000] flex items-end justify-center px-4 pb-10">
                    <div className={`absolute inset-0 ${isDarkMode ? 'bg-[#1F2128]/95' : 'bg-[#1F2128]/40'} backdrop-blur-xl`} onClick={() => setIsAssignModalOpen(false)}></div>
                    <div className={`relative w-full max-w-md ${isDarkMode ? 'bg-[#262932] border-white/10' : 'bg-white border-gray-200'} rounded-[3rem] border shadow-2xl p-8 flex flex-col max-h-[85vh] animate-in slide-in-from-bottom-10 h-[80vh]`}>
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className={`text-xl font-black italic uppercase leading-none ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{selectedGroup.name}</h3>
                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-1">Asignar Usuarios</p>
                            </div>
                            <button onClick={() => setIsAssignModalOpen(false)} className={`w-10 h-10 ${isDarkMode ? 'bg-white/5 text-white' : 'bg-gray-100 text-gray-500'} rounded-full flex items-center justify-center`}>
                                <X size={20} />
                            </button>
                        </div>

                        <div className={`${isDarkMode ? 'bg-[#1F2128] border-white/5' : 'bg-gray-50 border-gray-200 shadow-inner'} rounded-2xl flex items-center px-4 py-3 border mb-6`}>
                            <Search size={18} className="text-gray-500 mr-3" />
                            <input
                                type="text"
                                placeholder="Buscar usuario..."
                                value={userSearch}
                                onChange={(e) => setUserSearch(e.target.value)}
                                className={`bg-transparent border-none outline-none text-sm w-full font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                            />
                        </div>

                        <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                            {filteredUsers.map(user => {
                                const userGroups = Array.isArray(user.groups) ? user.groups : (user.group ? [user.group] : []);
                                const isInThisGroup = userGroups.includes(selectedGroup.name);

                                return (
                                    <div key={user.id} className={`${isDarkMode ? 'bg-[#1F2128] border-white/5' : 'bg-white border-gray-100 shadow-sm'} p-4 rounded-2xl flex items-center justify-between border`}>
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm uppercase overflow-hidden shrink-0 ${isInThisGroup ? 'bg-[#FF1F40] text-white shadow-[0_0_15px_rgba(255,31,64,0.3)]' : isDarkMode ? 'bg-[#3A3F4B] text-gray-400' : 'bg-gray-100 text-gray-400'}`}>
                                                {user.photoURL ? (
                                                    <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    user.name?.charAt(0)
                                                )}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className={`text-sm font-black uppercase italic leading-none ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{user.name}</p>
                                                    {isInThisGroup && (
                                                        <span className="bg-green-500/20 text-green-500 text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter border border-green-500/20">MIEMBRO</span>
                                                    )}
                                                </div>
                                                <p className="text-[10px] text-gray-500 font-medium lowercase tracking-tight">{user.email}</p>
                                                {userGroups.length > 0 && !isInThisGroup && (
                                                    <p className="text-[8px] text-orange-500 font-black uppercase mt-1">
                                                        Grupos: {userGroups.join(', ')}
                                                    </p>
                                                )}
                                                {user.role && (
                                                    <p className="text-[8px] text-blue-500 font-black uppercase mt-0.5 opacity-60 font-sans">
                                                        {user.role}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        {isInThisGroup ? (
                                            <button
                                                onClick={() => handleUnassignUser(user, selectedGroup)}
                                                disabled={isSubmitting}
                                                className="w-8 h-8 bg-red-500 text-white rounded-lg flex items-center justify-center shadow-lg active:scale-95 transition-all"
                                                title="Quitar del grupo"
                                            >
                                                <X size={16} strokeWidth={3} />
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleAssignUser(user)}
                                                disabled={isSubmitting}
                                                className="w-8 h-8 bg-green-500 text-white rounded-lg flex items-center justify-center shadow-lg active:scale-95 transition-all"
                                                title="Agregar al grupo"
                                            >
                                                <Plus size={16} strokeWidth={3} />
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* Create Group Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center px-4">
                    <div className={`absolute inset-0 ${isDarkMode ? 'bg-[#1F2128]/95' : 'bg-[#1F2128]/40'} backdrop-blur-xl`} onClick={() => setIsCreateModalOpen(false)}></div>
                    <form onSubmit={handleCreateGroup} className={`relative w-full max-w-md ${isDarkMode ? 'bg-[#262932] border-white/10' : 'bg-white border-gray-200'} rounded-[3rem] border shadow-2xl p-8 space-y-6 animate-in zoom-in-95`}>
                        <div className="flex justify-between items-center">
                            <h3 className={`text-2xl font-black italic uppercase italic ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Nuevo Grupo</h3>
                            <button type="button" onClick={() => setIsCreateModalOpen(false)} className={`w-10 h-10 ${isDarkMode ? 'bg-white/5 text-white' : 'bg-gray-100 text-gray-500'} rounded-full flex items-center justify-center`}>
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-2 block">Nombre del Grupo</label>
                                <input
                                    type="text"
                                    required
                                    value={newGroupName}
                                    onChange={(e) => setNewGroupName(e.target.value)}
                                    placeholder="Ej. Almodovar Elite"
                                    className={`w-full ${isDarkMode ? 'bg-[#1F2128] border-white/5 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'} border rounded-2xl px-5 py-4 outline-none focus:border-[#FF1F40]/50 transition-all font-bold`}
                                />
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-2 block">Categoría</label>
                                <select
                                    value={newGroupCategory}
                                    onChange={(e) => setNewGroupCategory(e.target.value)}
                                    className={`w-full ${isDarkMode ? 'bg-[#1F2128] border-white/5 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'} border rounded-2xl px-5 py-4 outline-none focus:border-[#FF1F40]/50 transition-all font-bold`}
                                >
                                    <option value="Entrenamiento Funcional">Entrenamiento Funcional</option>
                                    <option value="Fitness & Salud">Fitness & Salud</option>
                                    <option value="Competición">Competición</option>
                                    <option value="Iniciación">Iniciación</option>
                                </select>
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-2 block">Descripción</label>
                                <textarea
                                    value={newGroupDescription}
                                    onChange={(e) => setNewGroupDescription(e.target.value)}
                                    placeholder="Describe el propósito del grupo..."
                                    rows={3}
                                    className={`w-full ${isDarkMode ? 'bg-[#1F2128] border-white/5 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'} border rounded-2xl px-5 py-4 outline-none focus:border-[#FF1F40]/50 transition-all font-medium text-sm`}
                                />
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-2 block">Foto del Grupo</label>
                                <div className="flex items-center gap-4">
                                    <div className={`w-20 h-20 rounded-2xl ${isDarkMode ? 'bg-[#1F2128] border-white/5' : 'bg-gray-100 border-gray-200'} border overflow-hidden flex items-center justify-center shadow-inner relative group/img`}>
                                        <img src={newGroupImage} alt="Preview" className="w-full h-full object-cover opacity-60" />
                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity bg-black/40">
                                            <Camera size={20} className="text-white" />
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <label className={`inline-flex items-center gap-2 ${isDarkMode ? 'bg-blue-500/10 text-blue-500' : 'bg-blue-50 text-blue-600'} px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer hover:bg-blue-500 hover:text-white transition-all border border-blue-500/10`}>
                                            <Image size={14} />
                                            Seleccionar Foto
                                            <input type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
                                        </label>
                                        <p className="text-[8px] text-gray-500 mt-2 font-medium">Se comprimirá automáticamente para mayor velocidad.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-[#FF1F40] py-5 rounded-2xl flex items-center justify-center gap-3 shadow-[0_10px_30px_rgba(255,31,64,0.3)] font-black uppercase italic tracking-widest text-white"
                        >
                            {isSubmitting ? <Loader2 className="animate-spin" size={24} /> : 'Guardar Grupo'}
                        </button>
                    </form>
                </div>
            )}

            {/* Edit Group Modal */}
            {isEditModalOpen && groupToEdit && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center px-4">
                    <div className={`absolute inset-0 ${isDarkMode ? 'bg-[#1F2128]/95' : 'bg-[#1F2128]/40'} backdrop-blur-xl`} onClick={() => setIsEditModalOpen(false)}></div>
                    <form onSubmit={handleUpdateGroup} className={`relative w-full max-w-md ${isDarkMode ? 'bg-[#262932] border-white/10' : 'bg-white border-gray-200'} rounded-[3rem] border shadow-2xl p-8 space-y-6 animate-in zoom-in-95`}>
                        <div className="flex justify-between items-center">
                            <div>
                                <h3 className={`text-2xl font-black italic uppercase italic ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Editar Grupo</h3>
                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-1">ID: {groupToEdit.id}</p>
                            </div>
                            <button type="button" onClick={() => setIsEditModalOpen(false)} className={`w-10 h-10 ${isDarkMode ? 'bg-white/5 text-white' : 'bg-gray-100 text-gray-500'} rounded-full flex items-center justify-center`}>
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-2 block">Nombre del Grupo</label>
                                <input
                                    type="text"
                                    required
                                    value={newGroupName}
                                    onChange={(e) => setNewGroupName(e.target.value)}
                                    className={`w-full ${isDarkMode ? 'bg-[#1F2128] border-white/5 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'} border rounded-2xl px-5 py-4 outline-none focus:border-blue-500/50 transition-all font-bold`}
                                />
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-2 block">Categoría</label>
                                <select
                                    value={newGroupCategory}
                                    onChange={(e) => setNewGroupCategory(e.target.value)}
                                    className={`w-full ${isDarkMode ? 'bg-[#1F2128] border-white/5 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'} border rounded-2xl px-5 py-4 outline-none focus:border-blue-500/50 transition-all font-bold`}
                                >
                                    <option value="Entrenamiento Funcional">Entrenamiento Funcional</option>
                                    <option value="Fitness & Salud">Fitness & Salud</option>
                                    <option value="Competición">Competición</option>
                                    <option value="Iniciación">Iniciación</option>
                                </select>
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-2 block">Descripción</label>
                                <textarea
                                    value={newGroupDescription}
                                    onChange={(e) => setNewGroupDescription(e.target.value)}
                                    rows={3}
                                    className={`w-full ${isDarkMode ? 'bg-[#1F2128] border-white/5 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'} border rounded-2xl px-5 py-4 outline-none focus:border-blue-500/50 transition-all font-medium text-sm`}
                                />
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-2 block">Foto del Grupo</label>
                                <div className="flex items-center gap-4">
                                    <div className={`w-20 h-20 rounded-2xl ${isDarkMode ? 'bg-[#1F2128] border-white/5' : 'bg-gray-100 border-gray-200'} border overflow-hidden flex items-center justify-center shadow-inner relative group/img`}>
                                        <img src={newGroupImage} alt="Preview" className="w-full h-full object-cover opacity-60" />
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                                            <Edit2 size={20} className="text-white" />
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <label className={`inline-flex items-center gap-2 ${isDarkMode ? 'bg-[#FF1F40]/10 text-[#FF1F40]' : 'bg-[#FF1F40]/5 text-[#FF1F40]'} px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer hover:bg-[#FF1F40] hover:text-white transition-all border border-[#FF1F40]/10`}>
                                            <Camera size={14} />
                                            Cambiar Foto
                                            <input type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-blue-600 py-5 rounded-2xl flex items-center justify-center gap-3 shadow-[0_10px_30px_rgba(37,99,235,0.3)] font-black uppercase italic tracking-widest text-white"
                        >
                            {isSubmitting ? <Loader2 className="animate-spin" size={24} /> : 'Actualizar Cambios'}
                        </button>
                    </form>
                </div>
            )}

            {/* Confirmation Reassignment Modal */}
            {userToConfirm && (
                <div className="fixed inset-0 z-[2000] flex items-center justify-center px-6">
                    <div className={`absolute inset-0 ${isDarkMode ? 'bg-[#1F2128]/95' : 'bg-[#1F2128]/40'} backdrop-blur-2xl`}></div>
                    <div className={`relative w-full max-w-sm ${isDarkMode ? 'bg-[#262932] border-white/10' : 'bg-white border-gray-200'} rounded-[3rem] border border-white/10 shadow-3xl p-8 text-center animate-in zoom-in-95`}>
                        <div className="w-20 h-20 bg-orange-500/20 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-orange-500/10">
                            <AlertCircle size={40} strokeWidth={2.5} />
                        </div>

                        <h3 className={`text-xl font-black italic uppercase italic mb-2 tracking-tight ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>¡Usuario Asignado!</h3>
                        <p className="text-xs text-gray-400 font-medium leading-relaxed mb-8">
                            <span className={`${isDarkMode ? 'text-white' : 'text-gray-900'} font-black italic uppercase`}>{userToConfirm.user.name}</span> ya pertenece a <span className="text-orange-500 font-black italic uppercase">{userToConfirm.user.groups?.[0] || userToConfirm.user.group}</span>.
                            <br /><br />
                            Si continúas, será eliminado de su grupo actual y movido a <span className="text-green-500 font-black italic uppercase">{userToConfirm.targetGroup.name}</span>.
                        </p>

                        <div className="space-y-3">
                            <button
                                onClick={() => handleAssignUser(userToConfirm.user)}
                                className="w-full bg-[#FF1F40] py-4 rounded-2xl font-black uppercase italic tracking-widest text-sm shadow-xl shadow-red-900/20 active:scale-95 transition-all flex items-center justify-center gap-2 text-white"
                            >
                                <CheckCircle2 size={18} />
                                Confirmar Cambio
                            </button>
                            <button
                                onClick={() => setUserToConfirm(null)}
                                className={`w-full ${isDarkMode ? 'bg-white/5 text-gray-400 hover:bg-white/10' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'} py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all`}
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminGroupsList;
