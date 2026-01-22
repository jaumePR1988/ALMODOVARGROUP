import { useNavigate } from 'react-router-dom';
import {
    ChevronLeft,
    CheckCircle2,
    Bell,
    Settings2,
    Info,
    AlertTriangle,
    Megaphone
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { collection, query, where, orderBy, onSnapshot, updateDoc, doc, writeBatch } from 'firebase/firestore';

const Notifications = () => {
    const navigate = useNavigate();
    const [isDarkMode] = useState(() => document.documentElement.classList.contains('dark'));
    const [notifications, setNotifications] = useState<any[]>([]);

    useEffect(() => {
        if (!auth.currentUser) return;

        const q = query(
            collection(db, 'user_notifications'),
            where('userId', '==', auth.currentUser.uid),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate() || new Date()
            }));
            setNotifications(data);
        });

        return () => unsubscribe();
    }, []);

    const markAsRead = async (id: string) => {
        try {
            const ref = doc(db, 'user_notifications', id);
            await updateDoc(ref, { read: true });
        } catch (error) {
            console.error("Error marking as read", error);
        }
    };

    const markAllAsRead = async () => {
        try {
            const unread = notifications.filter(n => !n.read);
            if (unread.length === 0) return;

            const batch = writeBatch(db);
            unread.forEach(n => {
                const ref = doc(db, 'user_notifications', n.id);
                batch.update(ref, { read: true });
            });
            await batch.commit();
        } catch (error) {
            console.error("Error marking all as read", error);
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'waitlist_success': return <CheckCircle2 size={20} className="text-green-500" />;
            case 'class_cancelled': return <AlertTriangle size={20} className="text-red-500" />;
            case 'new_news': return <Megaphone size={20} className="text-blue-500" />;
            case 'message': return <Bell size={20} className="text-purple-500" />;
            default: return <Info size={20} className="text-gray-500" />;
        }
    };

    const getBg = (type: string) => {
        switch (type) {
            case 'waitlist_success': return 'bg-green-500/10';
            case 'class_cancelled': return 'bg-red-500/10';
            case 'new_news': return 'bg-blue-500/10';
            case 'message': return 'bg-purple-500/10';
            default: return 'bg-gray-500/10';
        }
    };

    // Grouping Logic (Today, Yesterday, etc)
    const groupedNotifications = notifications.reduce((acc: any, notif) => {
        const date = notif.createdAt;
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

        let group = 'ANTIGUO';
        if (diffDays === 0) group = 'HOY';
        else if (diffDays === 1) group = 'AYER';
        else if (diffDays < 7) group = 'ESTA SEMANA';

        if (!acc[group]) acc[group] = [];
        acc[group].push(notif);
        return acc;
    }, {});

    const groupsOrder = ['HOY', 'AYER', 'ESTA SEMANA', 'ANTIGUO'];
    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <div className={`min-h-screen transition-colors duration-500 ${isDarkMode ? 'bg-[#1F2128] text-white' : 'bg-[#F3F4F6]'}`}>
            {/* Header */}
            <header className={`sticky top-0 z-[200] px-6 py-5 flex items-center justify-between backdrop-blur-md ${isDarkMode ? 'bg-[#1F2128]/80' : 'bg-white/80'}`}>
                <button
                    onClick={() => navigate(-1)}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isDarkMode ? 'hover:bg-white/5' : 'hover:bg-gray-100'}`}
                >
                    <ChevronLeft size={24} className={isDarkMode ? 'text-white' : 'text-gray-900'} />
                </button>
                <h1 className={`text-sm font-black uppercase tracking-widest ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Bandeja de Entrada
                </h1>
                <div className="relative">
                    <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-[#FF1F40]/50 shadow-[0_0_15px_rgba(255,31,64,0.3)]">
                        <img
                            src={auth.currentUser?.photoURL || "https://ui-avatars.com/api/?name=User&background=FF1F40&color=fff"}
                            alt="User"
                            className="w-full h-full object-cover"
                        />
                    </div>
                </div>
            </header>

            <div className="max-w-md mx-auto px-6 pt-8 space-y-8">
                {/* Title Section */}
                <div className="flex justify-between items-end">
                    <div>
                        <h2 className={`text-2xl font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Mis Mensajes</h2>
                        <p className="text-gray-500 text-sm font-medium mt-1">
                            Tienes <span className="text-[#FF1F40] font-bold">{unreadCount} nuevos</span> mensajes.
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={markAllAsRead}
                            className="text-[10px] font-black text-[#FF1F40] uppercase tracking-wider hover:underline"
                        >
                            Marcar todo leído
                        </button>
                        <button
                            onClick={() => navigate('/notification-settings')}
                            className={`p-2 rounded-xl transition-colors ${isDarkMode ? 'bg-white/5 text-gray-400 hover:text-white' : 'bg-gray-100 text-gray-500'}`}
                        >
                            <Settings2 size={18} />
                        </button>
                    </div>
                </div>

                {/* Notifications List */}
                <div className="space-y-8 pb-32">
                    {Object.keys(groupedNotifications).length === 0 ? (
                        <div className="text-center py-10 opacity-50">
                            <Bell size={48} className="mx-auto mb-4 text-gray-400" />
                            <p className="text-sm font-bold">No tienes notificaciones</p>
                        </div>
                    ) : (
                        groupsOrder.map((group) => {
                            if (!groupedNotifications[group]) return null;
                            return (
                                <div key={group} className="space-y-4">
                                    <h3 className="text-[10px] font-black tracking-[0.2em] text-gray-500 uppercase">{group}</h3>
                                    <div className={`rounded-[2rem] overflow-hidden ${isDarkMode ? 'bg-[#2A2D3A]' : 'bg-white shadow-xl shadow-gray-300/30 border border-gray-100'}`}>
                                        {groupedNotifications[group].map((notif: any, idx: number) => (
                                            <div
                                                key={notif.id}
                                                onClick={() => markAsRead(notif.id)}
                                                className={`relative p-5 flex items-start gap-4 transition-all active:scale-[0.98] cursor-pointer ${idx !== groupedNotifications[group].length - 1 ? (isDarkMode ? 'border-b border-white/5' : 'border-b border-gray-100') : ''
                                                    } ${!notif.read ? '' : 'opacity-60'}`}
                                            >
                                                {/* Unread Indicator Line */}
                                                {!notif.read && (
                                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#FF1F40]"></div>
                                                )}

                                                {/* Icon Container */}
                                                <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${getBg(notif.type)}`}>
                                                    {getIcon(notif.type)}
                                                </div>

                                                {/* Content */}
                                                <div className="flex-1 min-w-0 pr-4">
                                                    <div className="flex justify-between items-start mb-1">
                                                        <h4 className={`text-sm font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{notif.title}</h4>
                                                        <span className={`text-[10px] font-bold ${!notif.read ? 'text-[#FF1F40]' : 'text-gray-500'}`}>
                                                            {notif.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                    <p className={`text-xs font-bold mb-1 truncate ${isDarkMode ? 'text-gray-300' : 'text-gray-800'}`}>{notif.message}</p>
                                                    {/* <p className="text-[11px] text-gray-500 font-medium line-clamp-2 leading-relaxed">{notif.msg}</p> */}
                                                </div>

                                                {/* Chevron */}
                                                <div className="mt-1">
                                                    <ChevronLeft size={16} className="rotate-180 text-gray-300 transition-transform group-hover:translate-x-0.5" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};

export default Notifications;
