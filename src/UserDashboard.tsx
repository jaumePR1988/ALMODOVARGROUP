import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  MapPin,
  Clock,
  Activity,
  Calendar,
  Check,
  Users,
  LogOut
} from 'lucide-react';
import BottomNavigation from './components/BottomNavigation';
import TopHeader from './components/TopHeader';
import { db, auth } from './firebase';
import { collection, onSnapshot, query, orderBy, addDoc, doc, updateDoc, increment, where, limit, deleteDoc, getDocs } from 'firebase/firestore';


const UserDashboard = () => {
  const navigate = useNavigate();
  // 1. Configuración General: Dark Mode by default
  const [isDarkMode, setIsDarkMode] = useState(() => document.documentElement.classList.contains('dark'));
  const [weekDays, setWeekDays] = useState<{ day: string; date: string; fullDate: string; active: boolean }[]>([]);

  const [selectedDate, setSelectedDate] = useState<string>(new Date().getDate().toString());
  const [classList, setClassList] = useState<any[]>([]);
  const [nextClass, setNextClass] = useState<any>(null);
  const [userReservations, setUserReservations] = useState<{ [key: string]: string }>({}); // classId -> status
  const [pendingPromotion, setPendingPromotion] = useState<any>(null);

  // State for user info
  const [currentUserData, setCurrentUserData] = useState<any>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        setUserId(null);
        navigate('/login');
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (!userId) return;
    const unsubscribe = onSnapshot(doc(db, 'users', userId), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setCurrentUserData(data);

      }
    });
    return () => unsubscribe();
  }, [userId]);

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
    // Generate Rolling 7-Day Window starting Today
    const days = ['DOM', 'LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB'];
    const today = new Date();

    const generatedWeek = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const dayName = days[d.getDay()];

      return {
        day: dayName,
        date: d.getDate().toString(),
        fullDate: d.toISOString().split('T')[0],
        active: d.getDate().toString() === selectedDate
      };
    });

    setWeekDays(generatedWeek);
  }, [selectedDate]);

  // Fetch classes for Agenda
  useEffect(() => {
    const userGroups = currentUserData?.groups || (currentUserData?.group ? [currentUserData?.group] : []);
    if (userGroups.length === 0) return;

    // Filter by group in query - Support multiple groups
    const q = query(
      collection(db, 'classes'),
      where('group', 'in', userGroups)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      let classesData: any[] = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Filter real data by selected date
      const activeDay = weekDays.find(d => d.date === selectedDate);
      if (activeDay) {
        classesData = classesData.filter(c => c.date === activeDay.fullDate);
      }

      // Sort by time
      classesData.sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));

      setClassList(classesData);
    }, (error) => {
      console.error("Firestore error in UserDashboard:", error);
    });
    return () => unsubscribe();
  }, [currentUserData?.groups, currentUserData?.group, selectedDate, weekDays]);

  // Fetch user reservations
  useEffect(() => {
    const q = query(collection(db, 'reservations'), where('userId', '==', userId));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const resMap: { [key: string]: string } = {};
      let promotionFound = null;

      querySnapshot.docs.forEach(doc => {
        const data = doc.data();
        resMap[data.classId] = data.status || 'confirmed'; // Default to confirmed for backward compat

        // Check for pending promotion
        if (data.status === 'pending_confirmation') {
          promotionFound = { id: doc.id, ...data };
        }
      });
      setUserReservations(resMap);
      setPendingPromotion(promotionFound); // Set global alert state

      // If there are reservations, fetch the first one for "Next Class"
      const confirmedIds = Object.keys(resMap).filter(id => resMap[id] === 'confirmed');
      if (confirmedIds.length > 0) {
        // Just for demo, take the first one. 
        const firstClassId = confirmedIds[0];
        const classRef = query(collection(db, 'classes'), limit(50)); // Simple fetch
        onSnapshot(classRef, (snap) => {
          const found = snap.docs.find(d => d.id === firstClassId);
          if (found) setNextClass({ id: found.id, ...found.data() });
        });
      } else {
        setNextClass(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // Handle Reservation / Waitlist / Confirmation
  const handleReserve = async (classId: string, current: number, max: number) => {
    // If already confirmed or in queue, this button acts as Cancel (logic handled in UI usually, but double check)
    if (userReservations[classId]) {
      // The UI should call handleCancel, but just in case
      return;
    }

    try {
      if (current >= max) {
        // JOIN WAITLIST
        await addDoc(collection(db, 'reservations'), {
          userId,
          classId,
          reservedAt: new Date().toISOString(),
          status: 'waitlist'
        });
        alert("¡Te has unido a la lista de espera! Te avisaremos si queda un sitio libre.");
      } else {
        // CONFIRM RESERVATION
        await addDoc(collection(db, 'reservations'), {
          userId,
          classId,
          reservedAt: new Date().toISOString(),
          status: 'confirmed'
        });

        // Decrement capacity
        const classRef = doc(db, 'classes', classId);
        await updateDoc(classRef, {
          currentCapacity: increment(1)
        });
      }

    } catch (error) {
      console.error("Error reserving: ", error);
    }
  };

  // Accept Promotion
  const handleAcceptPromotion = async (reservationId: string) => {
    try {
      // 1. Update Reservation Status
      await updateDoc(doc(db, 'reservations', reservationId), {
        status: 'confirmed'
      });

      // 2. DO NOT Increment Class Capacity
      // Logic: The spot was "held" (not decremented) when the previous user canceled.
      // So we just confirm the seat.

      setPendingPromotion(null);
      alert("¡Plaza confirmada! Nos vemos en clase.");

    } catch (error) {
      console.error("Error confirming promotion:", error);
    }
  };


  // Handle Cancel (Complex Logic: Promote next user)
  const handleCancel = async (classId: string) => {
    if (!confirm("¿Seguro que quieres cancelar tu reserva?")) return;

    try {
      // 1. Find the user's reservation doc
      const q = query(collection(db, 'reservations'), where('userId', '==', userId), where('classId', '==', classId));
      const snapshot = await getDocs(q);
      if (snapshot.empty) return;

      const reservationDoc = snapshot.docs[0];
      const status = reservationDoc.data().status || 'confirmed';

      // 2. Delete reservation (FREES THE USER, BUT MAYBE NOT THE SPOT YET)
      await deleteDoc(reservationDoc.ref);

      // 3. Logic: If it was 'confirmed', we opened a spot. Check Waitlist.
      if (status === 'confirmed') {

        // 4. FIND NEXT IN WAITLIST FIRST
        const wq = query(
          collection(db, 'reservations'),
          where('classId', '==', classId),
          where('status', '==', 'waitlist'),
          orderBy('reservedAt', 'asc'),
          limit(1)
        );
        const waitlistSnap = await getDocs(wq);

        if (!waitlistSnap.empty) {
          // STRICT PRIORITY: DO NOT DECREMENT CAPACITY
          // The spot stays "Full" in the counter, preventing snipers.
          // We assign this "ghost spot" to the next user.

          const nextUser = waitlistSnap.docs[0];
          await updateDoc(nextUser.ref, {
            status: 'pending_confirmation',
            promotedAt: new Date().toISOString()
          });
          // Notification: In-App alert will appear for this user.
        } else {
          // NO WAITLIST: FREE THE SPOT GLOBALLY
          const classRef = doc(db, 'classes', classId);
          await updateDoc(classRef, {
            currentCapacity: increment(-1)
          });
        }

      } else {
        // If it was 'waitlist' or 'pending', just removed. No capacity change needed.
        // If 'pending', we might want to trigger next in line? Yes.
        if (status === 'pending_confirmation') {
          // Same logic as above: find next waitlist.
          const wq = query(
            collection(db, 'reservations'),
            where('classId', '==', classId),
            where('status', '==', 'waitlist'),
            orderBy('reservedAt', 'asc'),
            limit(1)
          );
          const waitlistSnap = await getDocs(wq);
          if (!waitlistSnap.empty) {
            await updateDoc(waitlistSnap.docs[0].ref, {
              status: 'pending_confirmation',
              promotedAt: new Date().toISOString()
            });
          } else {
            // If NO ONE else in waitlist, and a PENDING user cancels, 
            // we MUST decrement capacity because that held spot is now truly free.
            const classRef = doc(db, 'classes', classId);
            await updateDoc(classRef, {
              currentCapacity: increment(-1)
            });
          }
        }
      }

    } catch (error) {
      console.error("Error canceling:", error);
    }
  };

  // Redundant theme/logout removed (now in TopHeader)



  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-[#1F2128] text-white' : 'bg-[#F3F4F6] text-gray-900'} font-sans pb-32 overflow-x-hidden`}>
      {/* Mobile Wrapper: max-w-md mx-auto */}
      <div className="max-w-[440px] mx-auto p-4 sm:p-6 space-y-6">

        {/* Global Notification for Pending Promotion */}
        {pendingPromotion && (
          <div className="bg-[#FF1F40] text-white p-4 rounded-2xl shadow-xl animate-pulse cursor-pointer" onClick={() => handleAcceptPromotion(pendingPromotion.id, pendingPromotion.classId)}>
            <div className="flex items-center gap-3">
              <Bell size={24} className="animate-bounce" />
              <div>
                <h3 className="font-black text-xs uppercase tracking-widest">¡Plaza Disponible!</h3>
                <p className="text-xs font-medium">Se ha liberado un hueco en tu clase. Toca para confirmar.</p>
              </div>
            </div>
          </div>
        )}


        {/* Header Unificado */}
        <TopHeader
          title="Almodovar Group"
          subtitle="v2.1 • Hola, Jaume 👋"
          showNotificationDot={!!pendingPromotion}
        />

        {/* 3. Créditos (Grid 2 col) */}
        <section className="grid grid-cols-2 gap-4">
          <div className="bg-white dark:bg-[#2A2D3A] p-5 rounded-3xl shadow-sm flex flex-col justify-between h-32">
            <span className="text-4xl font-black text-[#FF1F40]">12</span>
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Clases este mes</span>
          </div>
          <div className="bg-white dark:bg-[#2A2D3A] p-5 rounded-3xl shadow-sm flex flex-col justify-between h-32">
            <span className="text-4xl font-black text-gray-900 dark:text-white">3</span>
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Clases restantes</span>
          </div>
        </section>

        {/* 4. Calendario Horizontal (Strip) */}
        <section>
          <div className="flex justify-between items-end mb-2">
            <h2 className="text-lg font-bold dark:text-white">Esta semana</h2>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar" style={{ scrollbarWidth: 'none' }}>
            {weekDays.map((day, idx) => (
              <div
                key={idx}
                onClick={() => setSelectedDate(day.date)}
                className={`
                  flex-shrink-0 flex flex-col items-center justify-center w-14 h-20 rounded-2xl transition-all cursor-pointer
                  ${day.active
                    ? 'bg-[#FF1F40] text-white shadow-lg shadow-red-900/30'
                    : `rounded-[2rem] overflow-hidden ${isDarkMode ? 'bg-[#2A2D3A]' : 'bg-white shadow-xl shadow-gray-300/30 border border-gray-100'}`}
                `}
              >
                <span className="text-[10px] font-bold uppercase mb-1">{day.day}</span>
                <span className="text-xl font-bold">{day.date}</span>
              </div>
            ))}
          </div>
        </section>

        {/* 5. Hero Section (Tu próxima clase) */}
        <section>
          <div className="flex justify-between items-end mb-4">
            <h2 className="text-xl font-bold dark:text-white">Tu próxima clase</h2>
            <a href="#" className="text-sm font-black text-[#FF1F40] tracking-wide hover:underline">VER CALENDARIO</a>
          </div>

          {nextClass ? (
            <div className="relative w-full h-56 rounded-3xl overflow-hidden shadow-lg group">
              <img
                src={nextClass.imageUrl || "https://images.unsplash.com/photo-1599058945522-28d584b6f0ff?q=80&w=800&auto=format&fit=crop"}
                className="absolute inset-0 w-full h-full object-cover grayscale-[30%]"
                alt="Next Class"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
              <div className="absolute inset-x-0 bottom-0 p-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="bg-[#FF1F40] text-white text-[10px] font-black px-3 py-1.5 rounded-lg uppercase shadow-lg shadow-red-900/40">PRÓXIMA</span>
                  <div className="flex items-center text-white text-[10px] bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-lg font-bold border border-white/10">
                    <Clock size={12} className="mr-1.5" />
                    {nextClass.startTime} - {nextClass.endTime}
                  </div>
                </div>
                <h3 className="text-3xl text-white font-black italic uppercase mb-1 drop-shadow-md">{nextClass.name}</h3>
                <div className="flex items-center text-gray-200 text-xs font-bold gap-1 uppercase">
                  <MapPin size={14} />
                  <span>{nextClass.group === 'box' ? 'Almodovar Box' : 'Almodovar Fit'}</span>
                  <span className="mx-1">•</span>
                  <span>Coach {nextClass.coachId?.split('-')[1]}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className={`w-full h-56 rounded-3xl flex flex-col items-center justify-center p-8 border-2 border-dashed ${isDarkMode ? 'border-gray-800 bg-[#2A2D3A]/30' : 'border-gray-200 bg-white'}`}>
              <Activity size={32} className="text-gray-400 mb-4" />
              <p className="text-sm font-bold text-gray-500 uppercase tracking-widest text-center">No tienes reservas activas</p>
              <p className="text-[10px] text-gray-400 mt-2">¡Reserva tu próxima sesión abajo!</p>
            </div>
          )}
        </section>

        {/* 6. Acciones Rápidas (Grupo Asignado) */}
        {!currentUserData?.group ? (
          <section className="bg-orange-500/10 border border-orange-500/20 p-6 rounded-[2.5rem] text-center">
            <Users size={32} className="mx-auto text-orange-500 mb-3" />
            <h2 className="text-sm font-black uppercase tracking-widest text-orange-500">Sin Grupo Asignado</h2>
            <p className="text-[10px] text-gray-400 font-medium mt-2 leading-relaxed">
              Contacta con administración para que te asignen a un grupo de entrenamiento.
            </p>
          </section>
        ) : (
          <section>
            <h2 className="text-xl font-bold mb-4 dark:text-white">Tus Grupos</h2>
            <div className="bg-[#FF1F40] p-6 rounded-[2.5rem] shadow-xl shadow-red-900/20 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16 group-hover:scale-110 transition-transform"></div>
              <div className="relative z-10">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 mb-1">Entrenamiento Activo</p>
                <h3 className="text-3xl font-black italic uppercase italic leading-none truncate">
                  {currentUserData?.groups ? currentUserData.groups.join(' & ') : currentUserData?.group}
                </h3>
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-4 text-white/80">
                    <div className="flex items-center gap-1 text-[10px] font-bold">
                      <Check size={12} />
                      ACCESO COMPLETO
                    </div>
                  </div>
                  {currentUserData?.photoURL && (
                    <div className="w-10 h-10 rounded-full border-2 border-white/20 overflow-hidden shadow-lg">
                      <img src={currentUserData.photoURL} alt="" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        <section className="space-y-4 pb-10">
          <div className="flex justify-between items-end mb-4">
            <h2 className="text-xl font-bold dark:text-white">Agenda</h2>
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{classList.length} Disponibles</span>
          </div>

          {classList.length === 0 ? (
            <div className="py-10 text-center opacity-40">
              <Calendar size={40} className="mx-auto mb-3" />
              <p className="text-sm font-bold uppercase tracking-widest">No hay clases hoy</p>
            </div>
          ) : (
            classList.map((item) => {
              const reservationStatus = userReservations[item.id]; // 'confirmed', 'waitlist', 'pending_confirmation', or undefined
              const isReserved = !!reservationStatus;
              const isFull = item.currentCapacity >= item.maxCapacity;

              return (
                <div
                  key={item.id}
                  className={`relative rounded-[2.5rem] overflow-hidden group transition-all active:scale-[0.98] ${isDarkMode ? 'bg-[#2A2D3A]' : 'bg-white shadow-xl shadow-gray-300/30 border border-gray-100'}`}
                >
                  {/* Background Image with Overlay */}
                  <div className="absolute inset-0 z-0">
                    <img
                      src={item.imageUrl || "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80"}
                      alt={item.name}
                      className="w-full h-full object-cover opacity-60"
                    />
                    <div className={`absolute inset-0 ${isDarkMode ? 'bg-gradient-to-r from-[#2A2D3A] via-[#2A2D3A]/90 to-transparent' : 'bg-gradient-to-r from-white via-white/90 to-transparent'}`} />
                  </div>

                  <div className="p-6 space-y-4 relative z-10">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-[#FF1F40] flex flex-col items-center justify-center text-white shadow-lg shadow-red-600/20">
                          <span className="text-xs font-black leading-none">{item.startTime}</span>
                          <span className="text-[8px] font-black uppercase opacity-60">AM</span>
                        </div>
                        <div>
                          <h3 className="text-base font-black italic uppercase leading-tight">{item.name}</h3>
                          <div className="flex items-center gap-2 mt-0.5 text-gray-500">
                            <MapPin size={12} />
                            <span className="text-[10px] font-bold uppercase">{item.group === 'box' ? 'BOX' : 'FIT'} • Sala Principal</span>
                          </div>
                        </div>
                      </div>

                      {/* Capacity Badge */}
                      <div className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${isFull
                        ? 'bg-red-500/10 text-red-500 border-red-500/20'
                        : 'bg-green-500/10 text-green-500 border-green-500/20'
                        }`}>
                        {isFull ? 'COMPLETO' : `${item.currentCapacity}/${item.maxCapacity}`}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-gray-100/10 dark:border-white/5">
                      <div className="flex items-center gap-4">
                        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                          Coach {item.coachId?.split('-')[1] || 'Staff'}
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          if (isReserved && reservationStatus !== 'pending_confirmation') {
                            handleCancel(item.id);
                          } else if (reservationStatus === 'pending_confirmation') {
                            if (pendingPromotion) {
                              handleAcceptPromotion(pendingPromotion.id, item.id);
                            }
                          } else {
                            handleReserve(item.id, item.currentCapacity, item.maxCapacity);
                          }
                        }}
                        className={`
                                  px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg
                                  ${reservationStatus === 'confirmed'
                            ? 'bg-red-500 text-white hover:bg-red-600 shadow-red-900/20' // Botón Cancelar (Rojo)
                            : reservationStatus === 'waitlist'
                              ? 'bg-orange-500 text-white hover:bg-orange-600 shadow-orange-900/20' // Botón Lista Espera (Naranja)
                              : reservationStatus === 'pending_confirmation'
                                ? 'bg-green-500 animate-pulse text-white' // Botón Confirmar (Verde Parpadeante)
                                : isFull
                                  ? 'bg-yellow-500 text-white shadow-yellow-900/20' // Botón Unirse Cola (Amarillo)
                                  : 'bg-green-500 text-white shadow-green-900/20 hover:scale-105 active:scale-95 hover:brightness-110'} // Botón Reservar (Verde)
                                `}
                      >
                        {reservationStatus === 'confirmed' ? (
                          <div className="flex items-center gap-2">
                            <LogOut size={14} strokeWidth={3} />
                            CANCELAR
                          </div>
                        ) : reservationStatus === 'waitlist' ? (
                          <div className="flex items-center gap-2">
                            <Clock size={14} strokeWidth={3} />
                            EN COLA (SALIR)
                          </div>
                        ) : reservationStatus === 'pending_confirmation' ? (
                          <div className="flex items-center gap-2">
                            <Check size={14} strokeWidth={3} />
                            CONFIRMAR PLAZA
                          </div>
                        ) : isFull ? (
                          <div className="flex items-center gap-2">
                            <Activity size={14} strokeWidth={3} />
                            UNIRSE A COLA
                          </div>
                        ) : 'RESERVAR PLAZA'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </section>

      </div>



      <BottomNavigation
        role="user"
        activeTab="home"
      />
    </div>
  );
};

export default UserDashboard;
