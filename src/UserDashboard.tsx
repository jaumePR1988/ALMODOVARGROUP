import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  MapPin,
  Clock,
  Calendar,
  Check,
  Users,
  X
} from 'lucide-react';
// @ts-ignore
import { jsPDF } from 'jspdf';
import BottomNavigation from './components/BottomNavigation';
import PremiumModal from './components/PremiumModal';
import TopHeader from './components/TopHeader';
import WodModal from './components/WodModal';
import ClassReviewModal from './components/ClassReviewModal';
import { db, auth } from './firebase';
import { collection, onSnapshot, query, orderBy, getDoc, doc, updateDoc, increment, where, limit, deleteDoc, getDocs } from 'firebase/firestore';


const UserDashboard = ({ onLogout }: { onLogout: () => void }) => {
  const navigate = useNavigate();
  // 1. Configuración General: Dark Mode by default
  const [isDarkMode, setIsDarkMode] = useState(() => document.documentElement.classList.contains('dark'));
  const [weekDays, setWeekDays] = useState<{ day: string; date: string; active: boolean }[]>([]);

  // State
  const [userReservations, setUserReservations] = useState<{ id: string; data: any; classData?: any }[]>([]);
  const [currentUserData, setCurrentUserData] = useState<any>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [pendingPromotion, setPendingPromotion] = useState<any>(null);

  // MODAL STATE
  const [modalConfig, setModalConfig] = useState<any>({ isOpen: false, type: 'info', title: '', message: '' });
  const [selectedWod, setSelectedWod] = useState<any>(null);
  const [isWodModalOpen, setIsWodModalOpen] = useState(false);
  const [selectedReviewClass, setSelectedReviewClass] = useState<any>(null); // { classData, reservationId }
  const [userReviews, setUserReviews] = useState<{ [key: string]: any }>({}); // Map by reservationId

  useEffect(() => {
    if (!userId) return;
    const q = query(collection(db, 'reviews'), where('userId', '==', userId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const map: any = {};
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        map[data.reservationId] = data; // Map using reservationId as key
      });
      setUserReviews(map);
    });
    return () => unsubscribe();
  }, [userId]);


  useEffect(() => {
    const un = auth.onAuthStateChanged((user) => {
      if (user) setUserId(user.uid);
    });
    return () => un();
  }, []);

  useEffect(() => {
    if (!userId) return;
    const unsubscribe = onSnapshot(doc(db, 'users', userId), (doc) => {
      if (doc.exists()) setCurrentUserData(doc.data());
    });
    return () => unsubscribe();
  }, [userId]);

  // Dark Mode Observer
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

  // --- LAZY CREDIT RESET LOGIC (SAT 09:00 AM) ---
  useEffect(() => {
    if (!userId || !currentUserData) return;

    const checkCreditReset = async () => {
      const now = new Date();
      const lastReset = currentUserData.lastResetDate ? new Date(currentUserData.lastResetDate) : null;

      // Calculate Target: Last Saturday at 09:00 AM
      const target = new Date(now);
      const day = target.getDay(); // 0=Sun, 6=Sat
      const diff = (day + 1) % 7; // Distance from Sat (Sat=0, Sun=1, Fri=6)
      // Wait, correct math:
      // If today is Sat (6) and hour >= 9: target is today 9am.
      // If today is Sat (6) and hour < 9: target is prev Sat 9am.
      // If today is Fri (5): target is last Sat.

      // Let's normalize to "Most recent Saturday 09:00"
      // Move back to Saturday
      const daysSinceSat = (day + 1) % 7; // Sat=0, Sun=1, Mon=2...
      // Actually simpler: 
      // Sat is 6. 
      // If today is 0 (Sun), last sat was 1 day ago.
      // If today is 1 (Mon), last sat was 2 days ago.
      // If today is 6 (Sat), last sat was 0 days ago (potential match).

      const dist = (day + 7 - 6) % 7; // Sun(0)->1, Sat(6)->0, Fri(5)->6
      target.setDate(now.getDate() - dist);
      target.setHours(9, 0, 0, 0);

      // If 'now' is before 'target' (i.e. we are on Saturday morning before 9am), 
      // then the *valid* reset target was actually a week ago.
      if (now < target) {
        target.setDate(target.getDate() - 7);
      }

      // Logic
      if (!lastReset || lastReset < target) {
        console.log("🔄 Resetting Credits...");
        const planCredits = currentUserData.planCredits || 2; // Default 2

        try {
          await updateDoc(doc(db, 'users', userId), {
            credits: planCredits,
            lastResetDate: new Date().toISOString()
          });
          // Small notification?
          setModalConfig({
            isOpen: true,
            type: 'success',
            title: '¡Semana Nueva!',
            message: `Tus créditos se han restablecido a ${planCredits}.`,
            onConfirm: () => setModalConfig((prev: any) => ({ ...prev, isOpen: false }))
          });
        } catch (e) {
          console.error("Error resting credits", e);
        }
      }
    };

    checkCreditReset();
  }, [userId, currentUserData?.lastResetDate]); // Depend on lastResetDate to avoid loop? No, Firestore update triggers generic snapshot.
  // currentUserData changes on snapshot. logic must be idempotent-ish or check strict date.
  // 'lastReset < target' prevents checking again if we just updated it to 'now' (which is > target).
  // Perfect.

  // Generate Fixed Week Strip (Visual Only)
  useEffect(() => {
    const days = ['DOM', 'LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB'];
    const today = new Date();
    // Monday-Sunday fixed view? Or rolling? User said "fijo solo para saber en que dia estamos".
    // Let's do current week Monday - Sunday
    const d = new Date(today);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));

    const generated = Array.from({ length: 7 }, (_, i) => {
      const current = new Date(monday);
      current.setDate(monday.getDate() + i);
      const isToday = current.getDate() === today.getDate() && current.getMonth() === today.getMonth();

      return {
        day: days[current.getDay()],
        date: current.getDate().toString(),
        active: isToday
      };
    });
    setWeekDays(generated);
  }, []);

  // Fetch "Mis Reservas" (Reservations Joined with Classes)
  useEffect(() => {
    if (!userId) return;
    const q = query(collection(db, 'reservations'), where('userId', '==', userId));
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      // 1. Get all reservation docs
      const resDocs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // 2. Fetch associated class data
      const fullData = await Promise.all(resDocs.map(async (res: any) => {
        const classSnap = await getDoc(doc(db, 'classes', res.classId));
        return {
          id: res.id,
          data: res,
          classData: classSnap.exists() ? { id: classSnap.id, ...classSnap.data() } : null
        };
      }));

      // Filter out invalid/past classes if needed, or keep all. 
      // User said "ves las clases de la semana".
      // Let's sort by date/time
      const validClasses = fullData
        .filter(item => item.classData) // Ensure class exists
        .sort((a, b) => {
          // Compare dates: item.classData.date + item.classData.startTime
          const dateA = new Date(`${a.classData.date}T${a.classData.startTime}`);
          const dateB = new Date(`${b.classData.date}T${b.classData.startTime}`);
          return dateA.getTime() - dateB.getTime();
        });

      console.log("UserDashboard: Fetched Reservations", validClasses.length, validClasses);

      setUserReservations(validClasses as any);

      // Check pending promotion logic
      const pending = validClasses.find((r: any) => r.data.status === 'pending_confirmation');
      setPendingPromotion(pending ? pending.data : null);
    });
    return () => unsubscribe();
  }, [userId]);


  // Clean handlers for cancel/accept from generic list
  const handleCancelReservation = async (resId: string, classId: string) => {
    // 0. Fetch class details for time check
    const classSnap = await getDoc(doc(db, 'classes', classId));
    if (!classSnap.exists()) return;
    const classData = classSnap.data();

    // 1. Calculate time difference
    const classDate = new Date(`${classData.date}T${classData.startTime}`);
    const now = new Date();
    const diffMs = classDate.getTime() - now.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    // 2. Define Action
    const executeCancel = async () => {
      try {
        const resRef = doc(db, 'reservations', resId);
        const resSnap = await getDoc(resRef);
        const status = resSnap.data()?.status;

        await deleteDoc(resRef);

        if (status === 'confirmed') {
          if (diffHours >= 1) {
            await updateDoc(doc(db, 'users', userId!), { credits: increment(1) });
            setModalConfig({ isOpen: true, type: 'success', title: 'Cancelación Exitosa', message: 'Se ha devuelto 1 crédito a tu cuenta.', onConfirm: () => setModalConfig((prev: any) => ({ ...prev, isOpen: false })) });
          } else {
            setModalConfig({ isOpen: true, type: 'warning', title: 'Cancelación Tardía', message: 'Reserva cancelada sin devolución de crédito (<1h).', onConfirm: () => setModalConfig((prev: any) => ({ ...prev, isOpen: false })) });
          }

          const wq = query(collection(db, 'reservations'), where('classId', '==', classId), where('status', '==', 'waitlist'), limit(1));
          const wSnap = await getDocs(wq);
          if (!wSnap.empty) {
            await updateDoc(wSnap.docs[0].ref, { status: 'pending_confirmation', promotedAt: new Date().toISOString() });
          } else {
            await updateDoc(doc(db, 'classes', classId), { currentCapacity: increment(-1) });
          }
        }
      } catch (e) {
        console.error(e);
      }
    };

    // 3. Trigger Modal
    if (diffHours < 1) {
      setModalConfig({
        isOpen: true,
        type: 'danger',
        title: '¿Cancelar Ahora?',
        message: '⚠️ Queda MENOS DE 1 HORA para la clase.\n\nSi cancelas ahora, NO SE TE DEVOLVERÁ el crédito.',
        confirmText: 'Sí, Cancelar y Perder Crédito',
        cancelText: 'No, Mantener',
        onConfirm: executeCancel
      });
    } else {
      setModalConfig({
        isOpen: true,
        type: 'info',
        title: 'Confirmar Cancelación',
        message: '¿Seguro que quieres cancelar?\nSe te devolverá 1 Crédito.',
        confirmText: 'Sí, Cancelar',
        cancelText: 'No',
        onConfirm: executeCancel
      });
    }
  };


  // --- DEV TOOLS: GENERATE EXAMPLES ---
  const generateExamples = async () => {
    if (!confirm("⚠️ Se borrarán tus reservas actuales y se crearán 4 ejemplos probeta. ¿Continuar?")) return;
    if (!userId) return;

    try {
      // 1. Clear current reservations
      const q = query(collection(db, 'reservations'), where('userId', '==', userId));
      const snap = await getDocs(q);
      for (const d of snap.docs) await deleteDoc(d.ref);

      const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = tomorrow.toISOString().split('T')[0];

      // 2. Class A: Normal Confirmation (>1h)
      const classARef = await addDoc(collection(db, 'classes'), {
        name: "WOD Probeta (Normal)",
        date: dateStr,
        startTime: "10:00",
        group: "box",
        coachId: "test-coach",
        maxCapacity: 12,
        currentCapacity: 5
      });
      await addDoc(collection(db, 'reservations'), { userId, classId: classARef.id, status: 'confirmed', reservedAt: new Date().toISOString() });

      // 3. Class B: Late Cancel (<1h)
      const now = new Date();
      now.setMinutes(now.getMinutes() + 45); // Starts in 45 mins
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      const todayStr = new Date().toISOString().split('T')[0];

      const classBRef = await addDoc(collection(db, 'classes'), {
        name: "WOD Late Cancel (<1h)",
        date: todayStr,
        startTime: timeStr,
        group: "box",
        coachId: "test-coach",
        maxCapacity: 12,
        currentCapacity: 10
      });
      await addDoc(collection(db, 'reservations'), { userId, classId: classBRef.id, status: 'confirmed', reservedAt: new Date().toISOString() });

      // 4. Class C: Waitlist
      const classCRef = await addDoc(collection(db, 'classes'), {
        name: "WOD Full (Waitlist)",
        date: dateStr,
        startTime: "12:00",
        group: "box",
        coachId: "test-coach",
        maxCapacity: 12,
        currentCapacity: 12 // Full
      });
      await addDoc(collection(db, 'reservations'), { userId, classId: classCRef.id, status: 'waitlist', reservedAt: new Date().toISOString() });


      // 5. Class D: Pending Confirmation (Promoted)
      const classDRef = await addDoc(collection(db, 'classes'), {
        name: "WOD Promocionado",
        date: dateStr,
        startTime: "18:00",
        group: "box",
        coachId: "test-coach",
        maxCapacity: 12,
        currentCapacity: 11 // Spot held
      });
      await addDoc(collection(db, 'reservations'), { userId, classId: classDRef.id, status: 'pending_confirmation', reservedAt: new Date().toISOString(), promotedAt: new Date().toISOString() });

      setModalConfig({ isOpen: true, type: 'success', title: 'Ejemplos Generados', message: 'Revisa "Mis Reservas" para probar los flujos.', onConfirm: () => setModalConfig((prev: any) => ({ ...prev, isOpen: false })) });

    } catch (e) {
      console.error(e);
      setModalConfig({ isOpen: true, type: 'danger', title: 'Error', message: 'Error generando ejemplos.', onConfirm: () => setModalConfig((prev: any) => ({ ...prev, isOpen: false })) });
    }
  };

  const resetAccount = async () => {
    if (!confirm("⚠️ SE BORRARÁN TODAS TUS RESERVAS Y SE PONDRÁN LOS CRÉDITOS A 2. ¿Confirmar?")) return;
    if (!userId) return;

    try {
      const q = query(collection(db, 'reservations'), where('userId', '==', userId));
      const snap = await getDocs(q);
      for (const d of snap.docs) await deleteDoc(d.ref);

      await updateDoc(doc(db, 'users', userId), {
        credits: 2,
        planCredits: 2,
        lastResetDate: new Date().toISOString()
      });

      setModalConfig({ isOpen: true, type: 'success', title: 'Cuenta Reseteada', message: 'Tus reservas se han borrado y tienes 2 créditos.', onConfirm: () => setModalConfig((prev: any) => ({ ...prev, isOpen: false })) });

    } catch (e) {
      console.error(e);
      alert("Error al resetear cuenta.");
    }
  };


  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-[#1F2128] text-white' : 'bg-[#F3F4F6] text-gray-900'} font-sans pb-32 overflow-x-hidden`}>
      <PremiumModal
        isOpen={modalConfig.isOpen}
        type={modalConfig.type}
        title={modalConfig.title}
        message={modalConfig.message}
        confirmText={modalConfig.confirmText}
        cancelText={modalConfig.cancelText}
        onConfirm={modalConfig.onConfirm}
        onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
      />
      <WodModal
        isOpen={isWodModalOpen}
        onClose={() => setIsWodModalOpen(false)}
        classData={selectedWod}
      />
      <ClassReviewModal
        isOpen={!!selectedReviewClass}
        onClose={() => setSelectedReviewClass(null)}
        classData={selectedReviewClass?.classData}
        reservationId={selectedReviewClass?.reservationId}
        onSuccess={() => {
          // Optional: Show success toast
          setModalConfig({ isOpen: true, type: 'success', title: '¡Gracias!', message: 'Tu valoración ha sido enviada.', onConfirm: () => setModalConfig((p: any) => ({ ...p, isOpen: false })) });
        }}
      />
      <div className="max-w-[440px] mx-auto p-4 sm:p-6 space-y-6">

        {/* Global Notification */}
        {pendingPromotion && (
          <div
            onClick={() => handleAcceptPromotion(userReservations.find((r: any) => r.data.status === 'pending_confirmation')?.id || "")}
            className="bg-[#FF1F40] text-white p-4 rounded-2xl shadow-xl animate-pulse cursor-pointer hover:scale-105 transition-transform"
          >
            <div className="flex items-center gap-3">
              <Bell size={24} className="animate-bounce" />
              <div>
                <h3 className="font-black text-xs uppercase tracking-widest">¡Plaza Disponible!</h3>
                <p className="text-xs font-medium">Revisa tu agenda para confirmar.</p>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <TopHeader
          title={`Hola, ${currentUserData?.displayName ? currentUserData.displayName.split(' ')[0] : 'Atleta'} 👋`}
          subtitle="Panel Principal"
          avatarText={currentUserData?.displayName ? currentUserData.displayName.charAt(0) : "U"}
          profileImage={currentUserData?.photoURL}
          showNotificationDot={!!pendingPromotion}
          onLogout={onLogout}
        />

        {/* 3. Créditos (Grid 2 col) */}
        <section className="grid grid-cols-2 gap-4">
          <div className="bg-white dark:bg-[#2A2D3A] p-5 rounded-3xl shadow-sm flex flex-col justify-between h-32">
            <span className="text-4xl font-black text-[#FF1F40]">{currentUserData?.credits || 0}</span>
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Créditos Disponibles</span>
          </div>
          <div className="bg-white dark:bg-[#2A2D3A] p-5 rounded-3xl shadow-sm flex flex-col justify-between h-32">
            <span className="text-4xl font-black text-gray-900 dark:text-white">{userReservations.length}</span>
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Reservas Activas</span>
          </div>
        </section>

        {/* 1. Calendar Fixed Strip + Group Badge */}
        <section className="flex flex-col gap-4">
          {/* Read-Only Calendar */}
          <div className="bg-white dark:bg-[#2A2D3A] p-4 rounded-[2rem] shadow-sm flex justify-between items-center relative overflow-hidden">
            {weekDays.map((d, i) => (
              <div key={i} className={`flex flex-col items-center justify-center w-8 z-10 ${d.active ? 'scale-110' : 'opacity-40'}`}>
                <span className={`text-[8px] font-black uppercase mb-1 ${d.active ? 'text-[#FF1F40]' : ''}`}>{d.day}</span>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${d.active ? 'bg-[#FF1F40] text-white shadow-lg shadow-red-500/30' : ''}`}>
                  {d.date}
                </div>
              </div>
            ))}
          </div>

          {/* Large Group Badge */}
          {currentUserData?.group && (
            <div className="w-full">
              <div className="bg-[#FF1F40] text-white p-6 rounded-[2rem] shadow-xl shadow-red-500/20 relative overflow-hidden flex items-center justify-between">
                <div className="relative z-10">
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1 block">Tu Grupo Asignado</span>
                  <div className="flex items-center gap-3">
                    <Users size={24} />
                    <span className="text-2xl font-black uppercase italic">{currentUserData.group}</span>
                  </div>
                </div>
                <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-black/20 to-transparent"></div>
                <Users size={80} className="absolute -right-4 -bottom-4 text-black/10 transform -rotate-12" />
              </div>
            </div>
          )}
        </section>

        {/* 2. Mis Reservas */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Check size={20} className="text-[#FF1F40]" />
            <h2 className="text-xl font-black italic uppercase dark:text-white">Mis Reservas</h2>
          </div>

          {userReservations.length === 0 ? (
            <div className="py-12 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-[2rem] flex flex-col items-center justify-center text-center opacity-50">
              <Calendar size={48} className="mb-4 text-gray-400" />
              <p className="text-sm font-bold uppercase tracking-widest">No tienes clases reservadas</p>
              <p className="text-[10px] text-gray-400 mt-2 max-w-[200px]">Ve a la pestaña Agenda para reservar tus sesiones de la semana.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {userReservations.map((res: any) => {
                const classDate = new Date(`${res.classData.date}T${res.classData.startTime}`);
                const now = new Date();
                const isPast = classDate < now;
                const isAttended = res.data.attended === true;
                const isMissed = isPast && !isAttended; // Missed if past and not marked attended

                // Check if already reviewed
                const existingReview = userReviews[res.id]; // Map by reservationId

                return (
                  <div key={res.id}
                    onClick={() => { setSelectedWod(res.classData); setIsWodModalOpen(true); }}
                    className={`bg-white dark:bg-[#2A2D3A] rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-800 relative overflow-hidden group cursor-pointer hover:shadow-md transition-all`}
                  >
                    {/* Status Color Bar (Left Edge) */}
                    <div className={`absolute left-0 top-0 bottom-0 w-2 z-10 
                                  ${res.data.status === 'confirmed' ? 'bg-[#FF1F40]' :
                        res.data.status === 'waitlist' ? 'bg-orange-500' : 'bg-green-500'}`}
                    />

                    {/* ATTENDANCE STAMPS */}
                    {isAttended && (
                      <div className="absolute top-2 right-2 z-20 bg-green-500 text-white text-[8px] font-black uppercase px-2 py-1 rounded-lg shadow-lg rotate-12 border-2 border-white dashed-border">
                        COMPLETADA
                      </div>
                    )}
                    {isMissed && res.data.status === 'confirmed' && (
                      <div className="absolute top-4 right-4 z-20 bg-red-600 text-white text-[10px] font-black uppercase px-3 py-1.5 rounded-lg shadow-xl -rotate-12 border-2 border-white tracking-widest">
                        NO REALIZADA
                      </div>
                    )}

                    <div className={`flex ${isMissed ? 'grayscale opacity-60' : ''}`}>
                      {/* Hero Image (Left 35%) */}
                      <div className="w-[35%] min-h-[140px] relative">
                        <img
                          src={res.classData.imageUrl || "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80"}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white backdrop-blur-[1px]">
                          <span className="text-3xl font-black leading-none shadow-black drop-shadow-md">{new Date(res.classData.date).getDate()}</span>
                          <span className="text-[10px] font-bold uppercase opacity-90 shadow-black drop-shadow-md">
                            {new Date(res.classData.date).toLocaleDateString('es-ES', { month: 'short' })}
                          </span>
                        </div>
                      </div>

                      {/* Details (Right 65%) */}
                      <div className="flex-1 p-4 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-black uppercase italic text-lg leading-tight dark:text-white line-clamp-2">
                              {res.classData.name}
                            </h3>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center gap-3 text-sm text-gray-500 font-medium">
                              <span className="flex items-center gap-1"><Clock size={14} /> {res.classData.startTime}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {/* Capacity Indicator */}
                              <div className="flex-1 h-1.5 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-[#FF1F40] rounded-full"
                                  style={{ width: `${Math.min(100, (res.classData.currentCapacity / res.classData.maxCapacity) * 100)}%` }}
                                ></div>
                              </div>
                              <span className="text-[10px] font-bold text-gray-400">
                                {res.classData.currentCapacity}/{res.classData.maxCapacity}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="mt-4 flex justify-end gap-2">
                          {/* REVIEW BUTTON */}
                          {isAttended && !existingReview && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedReviewClass({ classData: res.classData, reservationId: res.id });
                              }}
                              className="px-4 py-2 rounded-xl bg-yellow-400 text-black text-xs font-black uppercase text-center hover:scale-105 transition-all shadow-sm animate-pulse"
                            >
                              ⭐ Evaluar
                            </button>
                          )}

                          {/* SHOW STARS IF REVIEWED */}
                          {isAttended && existingReview && (
                            <div className="flex flex-col items-end">
                              <div className="flex text-yellow-500">
                                {[1, 2, 3, 4, 5].map(s => (
                                  <svg key={s} width="12" height="12" viewBox="0 0 24 24" fill={existingReview.ratings.general >= s ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                                ))}
                              </div>
                              <span className="text-[8px] font-black uppercase text-gray-400">Valorado</span>
                            </div>
                          )}

                          {!isPast && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCancelReservation(res.id, res.classData.id);
                              }}
                              className="px-4 py-2 rounded-xl bg-red-50 dark:bg-red-900/20 text-[#FF1F40] text-xs font-black uppercase text-center border border-red-100 dark:border-red-900/50 hover:bg-[#FF1F40] hover:text-white transition-all shadow-sm"
                            >
                              Cancelar
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>



      </div>
      <BottomNavigation role="user" activeTab="home" />
    </div>
  );
};

export default UserDashboard;
