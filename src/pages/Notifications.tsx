import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { ArrowLeft, Bell, CheckCircle2, Clock, XCircle, Flame, UserCheck, CalendarCheck } from 'lucide-react';

interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: any;
  actionUrl?: string;
  type?: 'info' | 'waitlist' | 'alert';
  notificationType?: string;
}

const Notifications = () => {
  const { userData } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userData?.uid) return;

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userData.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs: AppNotification[] = [];
      snapshot.forEach((docSnap) => {
        notifs.push({ id: docSnap.id, ...docSnap.data() } as AppNotification);
      });
      setNotifications(notifs);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching notifications:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userData?.uid]);

  const markAsRead = async (notification: AppNotification) => {
    if (notification.read) return;
    try {
      await updateDoc(doc(db, 'notifications', notification.id), { read: true });
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const handleNotificationClick = (notification: AppNotification) => {
    markAsRead(notification);
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    }
  };

  const markAllAsRead = async () => {
    if (!userData?.uid) return;
    
    const unread = notifications.filter(n => !n.read);
    if (unread.length === 0) return;

    try {
      const batch = writeBatch(db);
      unread.forEach(n => {
        const ref = doc(db, 'notifications', n.id);
        batch.update(ref, { read: true });
      });
      await batch.commit();
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    const today = new Date();
    const isToday = date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
    
    if (isToday) {
      return `Hoy, ${date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
    }
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute:'2-digit' });
  };

  return (
    <div className="min-h-screen bg-[#121212] pb-24 font-montserrat">
      {/* HEADER */}
      <header className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-[#111111]/90 backdrop-blur-xl border-b border-white/5 z-50">
        <div className="flex items-center justify-between px-6 h-20">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-white/10 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-black tracking-tighter text-white uppercase flex items-center gap-2">
              <Bell className="w-5 h-5 text-[#E13038]" />
              Notificaciones
            </h1>
          </div>
          {notifications.some(n => !n.read) && (
            <button 
              onClick={markAllAsRead}
              className="text-[#E13038] text-xs font-bold uppercase tracking-wider bg-[#E13038]/10 px-3 py-1.5 rounded-full hover:bg-[#E13038]/20 transition-colors"
            >
              Marcar Leídas
            </button>
          )}
        </div>
      </header>

      {/* CONTENT */}
      <main className="pt-24 px-4 max-w-[480px] mx-auto min-h-screen">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-[50vh] text-white/50 space-y-4">
            <div className="w-8 h-8 rounded-full border-2 border-[#E13038] border-t-transparent animate-spin"></div>
            <p className="font-medium text-sm animate-pulse">Cargando...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center">
              <Bell className="w-10 h-10 text-white/20" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white mb-2">Todo al día</h2>
              <p className="text-white/50 text-sm max-w-[250px]">
                No tienes notificaciones pendientes. Aquí aparecerán tus avisos de listas de espera y más.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notif) => (
              <div 
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className={`
                  relative overflow-hidden p-4 rounded-2xl transition-all cursor-pointer border
                  ${!notif.read 
                    ? 'bg-gradient-to-br from-[#E13038]/10 to-transparent border-[#E13038]/30 shadow-lg shadow-[#E13038]/5' 
                    : 'bg-[#1A1A1A] border-white/5 hover:border-white/10'
                  }
                `}
              >
                {!notif.read && (
                  <div className="absolute top-0 left-0 w-1 h-full bg-[#E13038]" />
                )}
                
                <div className="flex gap-4">
                  <div className={`
                    mt-1 w-10 h-10 rounded-full flex items-center justify-center shrink-0
                    ${notif.type === 'waitlist' ? 'bg-orange-500/20 text-orange-400' : 
                      notif.type === 'alert' ? 'bg-red-500/20 text-red-400' : 
                      'bg-blue-500/20 text-blue-400'}
                  `}>
                    {notif.notificationType === 'class_full' ? <Flame className="w-5 h-5" /> :
                     notif.notificationType === 'booking_cancelled' || notif.notificationType === 'class_vacancy' ? <XCircle className="w-5 h-5" /> :
                     notif.notificationType === 'waitlist_confirmed' ? <UserCheck className="w-5 h-5" /> :
                     notif.notificationType === 'booking_confirmed' ? <CalendarCheck className="w-5 h-5" /> :
                     notif.type === 'waitlist' ? <Clock className="w-5 h-5" /> : 
                     notif.type === 'alert' ? <Bell className="w-5 h-5" /> : 
                     <CheckCircle2 className="w-5 h-5" />}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className={`font-bold text-sm ${!notif.read ? 'text-white' : 'text-gray-300'}`}>
                        {notif.title}
                      </h3>
                      <span className="text-[10px] text-gray-500 whitespace-nowrap mt-0.5 font-medium">
                        {formatDate(notif.createdAt)}
                      </span>
                    </div>
                    <p className={`text-xs leading-relaxed ${!notif.read ? 'text-gray-300' : 'text-gray-500'}`}>
                      {notif.message}
                    </p>
                    
                    {notif.actionUrl && (
                      <div className="mt-3">
                        <span className="inline-block px-3 py-1.5 bg-white/5 text-white/80 text-[10px] font-bold uppercase tracking-wider rounded-lg border border-white/10">
                          Ver detalles →
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Notifications;
