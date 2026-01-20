import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Sun,
  Moon,
  MapPin,
  Clock,
  Activity,
  Calendar,
  Home,
  Plus,
  User,
  Check,
  LogOut
} from 'lucide-react';
import { db, auth } from './firebase';
import { collection, onSnapshot, query, orderBy, addDoc, doc, updateDoc, increment, where, limit, deleteDoc, getDocs, getDoc, setDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';

const UserDashboard = () => {
  const navigate = useNavigate();
  // 1. Configuración General: Dark Mode by default
  const [isDarkMode, setIsDarkMode] = useState(() => document.documentElement.classList.contains('dark'));
  const [showMenu, setShowMenu] = useState(false);
  const [weekDays, setWeekDays] = useState<{ day: string; date: string; fullDate: string; active: boolean }[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<'box' | 'fit'>('box');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().getDate().toString());
  const [classList, setClassList] = useState<any[]>([]);
  const [nextClass, setNextClass] = useState<any>(null);
  const [userReservations, setUserReservations] = useState<{ [key: string]: string }>({}); // classId -> status
  const [pendingPromotion, setPendingPromotion] = useState<any>(null);

  // Fake User ID for demo
  const userId = "current-user-123";

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
    // Filter by group in query
    const q = query(
      collection(db, 'classes'),
      where('group', '==', selectedGroup),
      orderBy('startTime', 'asc')
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

      // Fallback to mock data if empty (just to show something)
      if (classesData.length === 0) {
        classesData = [
          {
            id: 'mock-1',
            name: 'Cross Training WOD',
            startTime: '09:00',
            group: 'fit',
            date: new Date().toISOString().split('T')[0],
            currentCapacity: 7,
            maxCapacity: 15,
            coachId: 'coach-marc'
          },
          {
            id: 'mock-2',
            name: 'Open Box Free',
            startTime: '11:30',
            group: 'box',
            date: new Date().toISOString().split('T')[0],
            currentCapacity: 3,
            maxCapacity: 20,
            coachId: 'coach-marc'
          }
        ];

        // Filter mock data by selected group and date
        classesData = classesData.filter(c =>
          c.group === selectedGroup &&
          (!activeDay || c.date === activeDay.fullDate)
        );
      }

      setClassList(classesData);
    }, (error) => {
      console.error("Firestore error in UserDashboard:", error);
      // If index is missing, it will log here
    });
    return () => unsubscribe();
  }, [selectedGroup, selectedDate, weekDays]);

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
  const handleReserve = async (classId: string, current: number, max: number, currentStatus?: string) => {
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
  const handleAcceptPromotion = async (reservationId: string, classId: string) => {
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

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  // Placeholder Menu Items for User
  const menuItems = [
    { icon: <Activity size={20} />, label: 'Entrenar' },
    { icon: <Plus size={20} />, label: 'Peso' },
    { icon: <User size={20} />, label: 'Perfil' },
  ];

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


        {/* 2. Header */}
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#FF1F40] rounded-full flex items-center justify-center font-bold text-lg text-white shadow-lg shadow-red-600/20">
              AG
            </div>
            <div>
              <h1 className="text-xl font-bold leading-tight tracking-tight">Almodovar <span className="text-[#FF1F40]">Group</span> <span className="text-[10px] opacity-30">v2.1</span></h1>
              <p className="text-xs font-semibold text-gray-500/80 dark:text-gray-400/80">Hola, Jaume 👋</p>
            </div>
          </div>
          <div className="flex gap-2.5">
            <button
              onClick={toggleTheme}
              className={`w-11 h-11 rounded-full flex items-center justify-center shadow-sm transition-all active:scale-90 ${isDarkMode ? 'bg-[#2A2D3A] text-white' : 'bg-white text-gray-600 border border-gray-100'}`}
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button
              onClick={handleLogout}
              className={`w-11 h-11 rounded-full flex items-center justify-center shadow-sm transition-all active:scale-90 ${isDarkMode ? 'bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white' : 'bg-red-50 text-red-500 hover:bg-red-500 hover:text-white border border-red-100'}`}
            >
              <LogOut size={20} />
            </button>
            <button
              onClick={() => navigate('/notifications')}
              className={`w-11 h-11 rounded-full flex items-center justify-center relative shadow-sm transition-all active:scale-90 ${isDarkMode ? 'bg-[#2A2D3A] text-white' : 'bg-white text-gray-600 border border-gray-100'}`}
            >
              <Bell size={20} />
              <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-[#FF1F40] rounded-full border-2 border-white dark:border-[#2A2D3A]"></span>
            </button>
          </div>
        </div>

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

        {/* 6. Acciones Rápidas (Grid 2 col) */}
        <section>
          <h2 className="text-xl font-bold mb-4 dark:text-white">Reservar nueva sesión</h2>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setSelectedGroup('box')}
              className={`relative h-32 rounded-3xl overflow-hidden shadow-md group transition-all ${selectedGroup === 'box' ? 'ring-4 ring-[#FF1F40]' : ''}`}
            >
              <img
                src="https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?q=80&w=400&auto=format&fit=crop"
                className="absolute inset-0 w-full h-full object-cover brightness-[0.4] group-hover:scale-110 transition-transform duration-500"
                alt="Box"
              />
              <div className="relative z-10 flex flex-col items-center justify-center h-full">
                <span className="text-white text-xs font-bold uppercase tracking-widest opacity-80 mb-1">Almodovar</span>
                <span className="text-white text-3xl font-black italic bg-[#FF1F40] px-2 -rotate-2">BOX</span>
              </div>
            </button>

            <button
              onClick={() => setSelectedGroup('fit')}
              className={`relative h-32 rounded-3xl overflow-hidden shadow-md group border border-gray-200 dark:border-gray-700 transition-all ${selectedGroup === 'fit' ? 'ring-4 ring-[#FF1F40]' : ''}`}
            >
              <img
                src="https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=400&auto=format&fit=crop"
                className="absolute inset-0 w-full h-full object-cover brightness-[0.4] group-hover:scale-110 transition-transform duration-500"
                alt="Fit"
              />
              <div className="relative z-10 flex flex-col items-center justify-center h-full">
                <span className="text-white text-xs font-bold uppercase tracking-widest opacity-80 mb-1">Almodovar</span>
                <span className="text-[#FF1F40] bg-white text-3xl font-black px-2 rotate-2">FIT</span>
              </div>
            </button>
          </div>
        </section>

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

      {/* Action Menu (Medialuna) Overlay */}
      {showMenu && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-md z-[100] transition-all duration-500"
          onClick={() => setShowMenu(false)}
        >
          <div className="absolute bottom-32 left-1/2 -translate-x-1/2 w-full max-w-md pointer-events-none">
            {menuItems.map((item, i) => {
              const totalItems = menuItems.length;
              const angleRange = 120;
              const startAngle = 150;
              const angle = startAngle - (i * (angleRange / (totalItems - 1)));

              const radius = 110;
              const x = radius * Math.cos((angle * Math.PI) / 180);
              const y = radius * Math.sin((angle * Math.PI) / 180);

              return (
                <button
                  key={i}
                  className="absolute left-1/2 bottom-0 -translate-x-1/2 w-16 h-16 bg-white dark:bg-[#2A2D3A] rounded-full shadow-xl flex flex-col items-center justify-center gap-0.5 pointer-events-auto active:scale-90 transition-all duration-300 ease-out border border-gray-100 dark:border-gray-700/50 group hover:shadow-[0_0_20px_rgba(255,31,64,0.4)] hover:border-[#FF1F40] hover:scale-110"
                  style={{
                    transform: `translate(calc(-50% + ${x}px), -${y}px)`,
                    opacity: showMenu ? 1 : 0,
                    transitionDelay: `${i * 50}ms`
                  }}
                >
                  <div className="text-gray-400 dark:text-gray-500 group-hover:text-[#FF1F40] transition-colors duration-300">
                    {item.icon}
                  </div>
                  <span className="text-[7px] font-black uppercase tracking-tighter text-gray-500 dark:text-gray-400 group-hover:text-[#FF1F40] transition-colors duration-300">
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Navigation (Fixed Bottom) */}
      <nav className={`fixed bottom-0 left-0 right-0 z-[110] border-t px-6 pb-6 pt-3 ${isDarkMode ? 'bg-[#1F2128]/95 backdrop-blur-md border-gray-800/60' : 'bg-white/95 backdrop-blur-md border-gray-200/60'}`}>
        <div className="max-w-[440px] mx-auto flex justify-between items-end px-4 relative">

          <a href="#" className="flex flex-col items-center gap-1.5 text-[#FF1F40] w-12 transition-transform active:scale-90">
            <Home size={26} strokeWidth={2.5} />
            <span className="text-[10px] font-bold tracking-wide">Box</span>
          </a>

          <a href="#" className={`flex flex-col items-center gap-1.5 w-12 transition-all active:scale-90 ${isDarkMode ? 'text-gray-500 hover:text-white' : 'text-gray-400 hover:text-gray-900'}`}>
            <Calendar size={26} strokeWidth={2} />
            <span className="text-[10px] font-bold tracking-wide">Agenda</span>
          </a>

          {/* Central Plus Button - PERFECTLY CENTERED */}
          <div className="relative -top-8">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className={`w-16 h-16 bg-[#FF1F40] rounded-full flex items-center justify-center text-white border-[6px] shadow-2xl shadow-red-900/50 active:scale-95 transition-all group ${isDarkMode ? 'border-[#1F2128]' : 'border-gray-100'
                } ${showMenu ? 'rotate-45' : 'rotate-0'}`}
            >
              <Plus size={36} strokeWidth={4} />
            </button>
          </div>

          <a href="#" className={`flex flex-col items-center gap-1.5 w-12 transition-all active:scale-90 ${isDarkMode ? 'text-gray-500 hover:text-white' : 'text-gray-400 hover:text-gray-900'}`}>
            <Activity size={26} strokeWidth={2} />
            <span className="text-[10px] font-bold tracking-wide">Perfil</span>
          </a>

          <a href="#" className={`flex flex-col items-center gap-1.5 w-12 transition-all active:scale-90 ${isDarkMode ? 'text-gray-500 hover:text-white' : 'text-gray-400 hover:text-gray-900'}`}>
            <User size={26} strokeWidth={2} />
            <span className="text-[10px] font-bold tracking-wide">Cuenta</span>
          </a>

        </div>
      </nav>
    </div>
  );
};

export default UserDashboard;
