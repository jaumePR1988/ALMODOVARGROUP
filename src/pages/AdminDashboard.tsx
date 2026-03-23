import { useState, useEffect } from 'react';
import { Users, Euro, CreditCard, BarChart3, FileCheck, Calendar, LogOut, Loader2, ChevronLeft, ChevronRight, X, Clock } from 'lucide-react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import AdminNavBar from '../components/AdminNavBar';

interface DashboardMetrics {
    totalUsers: number;
    byGroup: { box: number; fit: number; virtual: number; sinGrupo: number };
    totalRevenue: number;
    revenueByGroup: { box: number; fit: number; virtual: number };
    totalExtraCredits: number;
    usersWithExtra: number;
    occupancyPercent: number;
    termsAccepted: number;
    termsPending: number;
}

interface WeeklyClassSlot {
    classId: string;
    className: string;
    category: string;
    dayIndex: number;
    dayLabel: string;
    dateStr: string;
    startTime: string;
    capacity: number;
    reserved: number;
    waitlisted: number;
    attendees: { userName: string; userId: string }[];
}

const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

// Get Monday of a given week
const getMonday = (d: Date): Date => {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    date.setDate(diff);
    date.setHours(0, 0, 0, 0);
    return date;
};

const formatDateRange = (monday: Date): string => {
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
    return `${monday.toLocaleDateString('es-ES', opts)} — ${sunday.toLocaleDateString('es-ES', opts)}`;
};

const toDateStr = (d: Date): string => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
};

const AdminDashboard = () => {
    const { signOut } = useAuth();
    const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
    const [loading, setLoading] = useState(true);

    // Weekly occupancy state
    const [weekMonday, setWeekMonday] = useState<Date>(getMonday(new Date()));
    const [weekSlots, setWeekSlots] = useState<WeeklyClassSlot[]>([]);
    const [weekLoading, setWeekLoading] = useState(false);

    // Attendee modal
    const [selectedSlot, setSelectedSlot] = useState<WeeklyClassSlot | null>(null);

    // ─── Fetch global metrics (once) ───
    useEffect(() => {
        const fetchMetrics = async () => {
            try {
                const usersSnap = await getDocs(collection(db, 'users'));
                let totalUsers = 0;
                const byGroup = { box: 0, fit: 0, virtual: 0, sinGrupo: 0 };
                let totalRevenue = 0;
                const revenueByGroup = { box: 0, fit: 0, virtual: 0 };
                let totalExtraCredits = 0;
                let usersWithExtra = 0;
                let termsAccepted = 0;
                let termsPending = 0;

                usersSnap.forEach(docSnap => {
                    const d = docSnap.data();
                    const role = d.role || 'user';

                    // Terms: count user + coach (not admin)
                    if (role === 'user' || role === 'coach') {
                        if (d.termsAccepted && d.imageRightsAccepted) termsAccepted++;
                        else termsPending++;
                    }

                    // Rest of metrics: only users (not coaches/admins)
                    if (role !== 'user') return;

                    totalUsers++;

                    const modos: string[] = d.modos || [];
                    let hasGroup = false;
                    for (const modo of modos) {
                        const upper = modo.toUpperCase();
                        if (upper.includes('BOX') && !upper.includes('VIRTUAL')) { byGroup.box++; hasGroup = true; }
                        else if (upper.includes('FIT')) { byGroup.fit++; hasGroup = true; }
                        else if (upper.includes('VIRTUAL')) { byGroup.virtual++; hasGroup = true; }
                    }
                    if (!hasGroup) byGroup.sinGrupo++;

                    const cuota = d.cuotaMensual || 0;
                    if (!d.pausado) {
                        totalRevenue += cuota;
                        if (cuota > 0 && modos.length > 0) {
                            const primary = modos[0].toUpperCase();
                            if (primary.includes('BOX') && !primary.includes('VIRTUAL')) revenueByGroup.box += cuota;
                            else if (primary.includes('FIT')) revenueByGroup.fit += cuota;
                            else if (primary.includes('VIRTUAL')) revenueByGroup.virtual += cuota;
                        }
                    }

                    const extra = d.saldoExtra || 0;
                    totalExtraCredits += extra;
                    if (extra > 0) usersWithExtra++;
                });

                // Global occupancy (all active reservations vs all class capacity)
                let occupancyPercent = 0;
                try {
                    const classesSnap = await getDocs(collection(db, 'classes'));
                    let totalCapacity = 0;
                    classesSnap.forEach(c => { totalCapacity += c.data().capacity || 0; });

                    const allResSnap = await getDocs(query(collection(db, 'reservations'), where('status', '==', 'active')));
                    occupancyPercent = totalCapacity > 0 ? Math.round((allResSnap.size / totalCapacity) * 100) : 0;
                } catch { occupancyPercent = 0; }

                setMetrics({ totalUsers, byGroup, totalRevenue, revenueByGroup, totalExtraCredits, usersWithExtra, occupancyPercent, termsAccepted, termsPending });
            } catch (error) {
                console.error('Error loading dashboard metrics:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchMetrics();
    }, []);

    // ─── Fetch weekly occupancy (on week change) ───
    useEffect(() => {
        const fetchWeek = async () => {
            setWeekLoading(true);
            try {
                const classesSnap = await getDocs(collection(db, 'classes'));
                const slots: WeeklyClassSlot[] = [];

                // Build date strings for the 7 days of the selected week
                const weekDates: string[] = [];
                for (let i = 0; i < 7; i++) {
                    const d = new Date(weekMonday);
                    d.setDate(weekMonday.getDate() + i);
                    weekDates.push(toDateStr(d));
                }

                // Fetch all active reservations for this week's date range
                const allResSnap = await getDocs(query(
                    collection(db, 'reservations'),
                    where('status', '==', 'active')
                ));
                // Index reservations by classId+date
                const resMap: Record<string, { userName: string; userId: string }[]> = {};
                allResSnap.forEach(resDoc => {
                    const rd = resDoc.data();
                    if (weekDates.includes(rd.classDate)) {
                        const key = `${rd.classId}_${rd.classDate}`;
                        if (!resMap[key]) resMap[key] = [];
                        resMap[key].push({ userName: rd.userName || 'Sin nombre', userId: rd.userId || '' });
                    }
                });

                // Fetch waitlist for the week
                const wlSnap = await getDocs(query(
                    collection(db, 'waitlist'),
                    where('status', '==', 'waiting')
                ));
                const wlMap: Record<string, number> = {};
                wlSnap.forEach(wlDoc => {
                    const wd = wlDoc.data();
                    if (weekDates.includes(wd.classDate)) {
                        const key = `${wd.classId}_${wd.classDate}`;
                        wlMap[key] = (wlMap[key] || 0) + 1;
                    }
                });

                for (const classDoc of classesSnap.docs) {
                    const cd = classDoc.data();
                    const title = cd.title || 'Clase';
                    const capacity = cd.capacity || 0;
                    const startTime = cd.startTime || '';
                    const category = cd.category || '';
                    const recurringDays: number[] = cd.recurringDays || [];
                    const isRecurring = cd.isRecurring === true;

                    console.log('[Admin Dashboard] Class:', title, '| isRecurring:', isRecurring, '| recurringDays:', recurringDays, '| specificDate:', cd.specificDate, '| category:', category);

                    if (isRecurring && recurringDays.length > 0) {
                        for (const dayIdx of recurringDays) {
                            const weekDayOffset = dayIdx === 0 ? 6 : dayIdx - 1;
                            const dateStr = weekDates[weekDayOffset];
                            if (!dateStr) continue;

                            const key = `${classDoc.id}_${dateStr}`;
                            const attendees = resMap[key] || [];
                            slots.push({
                                classId: classDoc.id,
                                className: title,
                                category,
                                dayIndex: dayIdx,
                                dayLabel: DAY_NAMES[dayIdx],
                                dateStr,
                                startTime,
                                capacity,
                                reserved: attendees.length,
                                waitlisted: wlMap[key] || 0,
                                attendees,
                            });
                        }
                    } else if (!isRecurring && cd.specificDate && weekDates.includes(cd.specificDate)) {
                        const dateStr = cd.specificDate;
                        const dayOfWeek = new Date(dateStr + 'T00:00:00').getDay();
                        const key = `${classDoc.id}_${dateStr}`;
                        const attendees = resMap[key] || [];
                        slots.push({
                            classId: classDoc.id,
                            className: title,
                            category,
                            dayIndex: dayOfWeek,
                            dayLabel: DAY_NAMES[dayOfWeek],
                            dateStr,
                            startTime,
                            capacity,
                            reserved: attendees.length,
                            waitlisted: wlMap[key] || 0,
                            attendees,
                        });
                    }
                }

                // Sort by day (Mon first), then by time
                const dayOrder = [1, 2, 3, 4, 5, 6, 0]; // Lun-Sáb-Dom
                slots.sort((a, b) => {
                    const da = dayOrder.indexOf(a.dayIndex);
                    const db2 = dayOrder.indexOf(b.dayIndex);
                    if (da !== db2) return da - db2;
                    return a.startTime.localeCompare(b.startTime);
                });

                setWeekSlots(slots);
            } catch (err) {
                console.error('Error loading weekly occupancy:', err);
                setWeekSlots([]);
            } finally {
                setWeekLoading(false);
            }
        };
        fetchWeek();
    }, [weekMonday]);

    const formatCurrency = (val: number) =>
        val.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';

    // Limit navigation: current week and next week only
    const thisMonday = getMonday(new Date());
    const nextMonday = new Date(thisMonday);
    nextMonday.setDate(thisMonday.getDate() + 7);

    const canGoPrev = weekMonday.getTime() > thisMonday.getTime();
    const canGoNext = weekMonday.getTime() < nextMonday.getTime();

    const prevWeek = () => {
        if (!canGoPrev) return;
        const d = new Date(weekMonday);
        d.setDate(d.getDate() - 7);
        setWeekMonday(d);
    };
    const nextWeek = () => {
        if (!canGoNext) return;
        const d = new Date(weekMonday);
        d.setDate(d.getDate() + 7);
        setWeekMonday(d);
    };
    const goThisWeek = () => setWeekMonday(getMonday(new Date()));

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
                    <button className="w-10 h-10 rounded-full border border-[#333] overflow-hidden active:scale-95 duration-100">
                        <img 
                            alt="Profile Avatar" 
                            className="w-full h-full object-cover" 
                            src="https://ui-avatars.com/api/?name=Admin&background=1A1A1A&color=E13038&bold=true"
                        />
                    </button>
                </div>
            </header>

            <main className="pt-24 pb-32 px-6 max-w-[480px] mx-auto">
                {/* Dashboard Header */}
                <section className="mb-10">
                    <h2 className="text-5xl font-black tracking-tighter text-white leading-none mb-2 uppercase">
                        RESUMEN
                    </h2>
                    <div className="h-1.5 w-24 bg-[#E13038]"></div>
                </section>

                {loading || !metrics ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <Loader2 className="animate-spin text-[#E13038]" size={40} />
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Cargando métricas...</span>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 gap-4 mb-12">

                            {/* 1. Usuarios Totales */}
                            <div className="bg-[#1A1A1A] p-6 rounded-xl flex flex-col group hover:bg-[#222] transition-colors border border-white/5">
                                <div className="flex justify-between items-start">
                                    <span className="text-sm font-bold tracking-widest text-[#DDABA5] uppercase">Usuarios Totales</span>
                                    <Users size={24} className="text-[#E13038]" />
                                </div>
                                <div className="mt-6">
                                    <div className="text-4xl font-black text-white">{metrics.totalUsers}</div>
                                    <div className="text-[10px] text-gray-500 tracking-widest font-bold mt-1 uppercase">Solo socios (sin coaches ni admins)</div>
                                </div>
                                <div className="mt-4 grid grid-cols-4 gap-2">
                                    <div className="bg-black/30 rounded-lg px-2 py-2 text-center">
                                        <div className="text-lg font-black text-[#E13038]">{metrics.byGroup.box}</div>
                                        <div className="text-[8px] font-bold text-gray-500 uppercase tracking-wider">BOX</div>
                                    </div>
                                    <div className="bg-black/30 rounded-lg px-2 py-2 text-center">
                                        <div className="text-lg font-black text-[#E13038]">{metrics.byGroup.fit}</div>
                                        <div className="text-[8px] font-bold text-gray-500 uppercase tracking-wider">FIT</div>
                                    </div>
                                    <div className="bg-black/30 rounded-lg px-2 py-2 text-center">
                                        <div className="text-lg font-black text-[#E13038]">{metrics.byGroup.virtual}</div>
                                        <div className="text-[8px] font-bold text-gray-500 uppercase tracking-wider">VIRTUAL</div>
                                    </div>
                                    <div className="bg-black/30 rounded-lg px-2 py-2 text-center">
                                        <div className="text-lg font-black text-yellow-500">{metrics.byGroup.sinGrupo}</div>
                                        <div className="text-[8px] font-bold text-gray-500 uppercase tracking-wider">SIN GRUPO</div>
                                    </div>
                                </div>
                            </div>

                            {/* 2. Facturación Mensual */}
                            <div className="bg-gradient-to-br from-[#E13038]/15 to-[#1A1A1A] p-6 rounded-xl flex flex-col group hover:from-[#E13038]/20 transition-colors border border-[#E13038]/20 shadow-lg">
                                <div className="flex justify-between items-start">
                                    <span className="text-sm font-bold tracking-widest text-[#E13038] uppercase">Facturación Mensual</span>
                                    <Euro size={24} className="text-[#E13038]" />
                                </div>
                                <div className="mt-6">
                                    <div className="text-3xl font-black text-white">{formatCurrency(metrics.totalRevenue)}</div>
                                    <div className="text-[10px] text-gray-400 tracking-widest font-bold mt-1 uppercase">Suma de cuotas de todos los socios</div>
                                </div>
                                <div className="mt-4 space-y-2">
                                    <div className="flex items-center justify-between bg-black/20 rounded-lg px-3 py-2">
                                        <span className="text-xs font-bold text-gray-300">Almodóvar BOX</span>
                                        <span className="text-sm font-black text-white">{formatCurrency(metrics.revenueByGroup.box)}</span>
                                    </div>
                                    <div className="flex items-center justify-between bg-black/20 rounded-lg px-3 py-2">
                                        <span className="text-xs font-bold text-gray-300">Almodóvar FIT</span>
                                        <span className="text-sm font-black text-white">{formatCurrency(metrics.revenueByGroup.fit)}</span>
                                    </div>
                                    <div className="flex items-center justify-between bg-black/20 rounded-lg px-3 py-2">
                                        <span className="text-xs font-bold text-gray-300">Virtual BOX</span>
                                        <span className="text-sm font-black text-white">{formatCurrency(metrics.revenueByGroup.virtual)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* 3. Créditos Extra */}
                            <div className="bg-[#1A1A1A] p-6 rounded-xl flex flex-col group hover:bg-[#222] transition-colors border border-white/5">
                                <div className="flex justify-between items-start">
                                    <span className="text-sm font-bold tracking-widest text-[#DDABA5] uppercase">Créditos Extra</span>
                                    <CreditCard size={24} className="text-[#E13038]" />
                                </div>
                                <div className="mt-6 flex items-end gap-4">
                                    <div>
                                        <div className="text-4xl font-black text-white">{metrics.totalExtraCredits}</div>
                                        <div className="text-[10px] text-gray-500 tracking-widest font-bold mt-1 uppercase">Créditos en circulación</div>
                                    </div>
                                    <div className="bg-[#E13038]/10 border border-[#E13038]/30 rounded-lg px-3 py-2 text-center">
                                        <div className="text-lg font-black text-[#E13038]">{metrics.usersWithExtra}</div>
                                        <div className="text-[8px] font-bold text-gray-500 uppercase tracking-wider">Usuarios</div>
                                    </div>
                                </div>
                            </div>

                            {/* 4. Tasa de Ocupación */}
                            <div className="bg-[#1A1A1A] p-6 rounded-xl flex flex-col border-l-4 border-[#E13038] group hover:bg-[#222] transition-colors shadow-lg">
                                <div className="flex justify-between items-start">
                                    <span className="text-sm font-bold tracking-widest text-[#E13038] uppercase">Ocupación Media</span>
                                    <BarChart3 size={24} className="text-[#E13038]" />
                                </div>
                                <div className="mt-6">
                                    <div className="text-4xl font-black text-white">{metrics.occupancyPercent}%</div>
                                    <div className="w-full h-2 bg-[#333] mt-3 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-[#E13038] rounded-full transition-all duration-700"
                                            style={{ width: `${Math.min(metrics.occupancyPercent, 100)}%` }}
                                        ></div>
                                    </div>
                                    <div className="text-[10px] text-gray-500 tracking-widest font-bold mt-2 uppercase">Reservas activas / Capacidad total</div>
                                </div>
                            </div>

                            {/* 5. Términos Aceptados */}
                            <div className="bg-[#1A1A1A] p-6 rounded-xl flex flex-col group hover:bg-[#222] transition-colors border border-white/5">
                                <div className="flex justify-between items-start">
                                    <span className="text-sm font-bold tracking-widest text-[#DDABA5] uppercase">Términos Firmados</span>
                                    <FileCheck size={24} className="text-[#E13038]" />
                                </div>
                                <div className="mt-6 flex items-end gap-6">
                                    <div>
                                        <div className="text-4xl font-black text-[#34A853]">{metrics.termsAccepted}</div>
                                        <div className="text-[10px] text-gray-500 tracking-widest font-bold mt-1 uppercase">Aceptados</div>
                                    </div>
                                    <div>
                                        <div className="text-4xl font-black text-[#E13038]">{metrics.termsPending}</div>
                                        <div className="text-[10px] text-gray-500 tracking-widest font-bold mt-1 uppercase">Pendientes</div>
                                    </div>
                                </div>
                                {metrics.totalUsers > 0 && (
                                    <div className="w-full h-2 bg-[#333] mt-4 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-[#34A853] rounded-full transition-all duration-700"
                                            style={{ width: `${Math.round((metrics.termsAccepted / metrics.totalUsers) * 100)}%` }}
                                        ></div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* ─── 6. Ocupación Semanal con Navegación ─── */}
                        <div className="bg-[#1A1A1A] p-6 rounded-xl border border-white/5">
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="text-lg font-bold uppercase text-white flex items-center gap-2">
                                    <Calendar size={18} className="text-[#E13038]" />
                                    Ocupación Semanal
                                </h3>
                            </div>

                            {/* Week Navigator */}
                            <div className="flex items-center justify-between mb-5">
                                <button onClick={prevWeek} disabled={!canGoPrev} className={`w-9 h-9 rounded-lg bg-[#2a2a2a] flex items-center justify-center active:scale-95 hover:bg-[#333] transition-colors ${!canGoPrev ? 'opacity-20 cursor-not-allowed' : ''}`}>
                                    <ChevronLeft size={18} className="text-gray-300" />
                                </button>
                                <button onClick={goThisWeek} className="text-xs font-bold text-gray-300 tracking-wider uppercase hover:text-white transition-colors px-3 py-1.5 rounded-lg bg-[#2a2a2a]">
                                    {formatDateRange(weekMonday)}
                                </button>
                                <button onClick={nextWeek} disabled={!canGoNext} className={`w-9 h-9 rounded-lg bg-[#2a2a2a] flex items-center justify-center active:scale-95 hover:bg-[#333] transition-colors ${!canGoNext ? 'opacity-20 cursor-not-allowed' : ''}`}>
                                    <ChevronRight size={18} className="text-gray-300" />
                                </button>
                            </div>

                            {weekLoading ? (
                                <div className="flex justify-center py-8">
                                    <Loader2 className="animate-spin text-[#E13038]" size={24} />
                                </div>
                            ) : weekSlots.length === 0 ? (
                                <p className="text-sm text-gray-500 text-center py-6">No hay clases esta semana</p>
                            ) : (
                                <div className="space-y-2">
                                    {weekSlots.map((slot, idx) => {
                                        const pct = slot.capacity > 0 ? Math.round((slot.reserved / slot.capacity) * 100) : 0;
                                        const isFull = slot.reserved >= slot.capacity;
                                        const barColor = isFull ? 'bg-[#E13038]' : pct >= 50 ? 'bg-yellow-500' : 'bg-[#34A853]';
                                        const statusLabel = isFull ? 'LLENA' : pct >= 80 ? 'CASI LLENA' : 'PLAZAS LIBRES';
                                        const statusColor = isFull ? 'text-[#E13038]' : pct >= 80 ? 'text-yellow-500' : 'text-[#34A853]';

                                        return (
                                            <button
                                                key={idx}
                                                onClick={() => setSelectedSlot(slot)}
                                                className="w-full text-left bg-[#222] hover:bg-[#2a2a2a] rounded-lg p-3 transition-all active:scale-[0.98] cursor-pointer"
                                            >
                                                <div className="flex items-center gap-3">
                                                    {/* Day badge */}
                                                    <div className="bg-[#E13038]/15 rounded-md w-10 h-10 flex flex-col items-center justify-center shrink-0">
                                                        <span className="text-[9px] font-black text-[#E13038] uppercase leading-none">{slot.dayLabel}</span>
                                                        <span className="text-[8px] text-gray-500 font-bold">{slot.dateStr.slice(8)}</span>
                                                    </div>
                                                    {/* Class info */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex justify-between items-center mb-1">
                                                            <div className="flex items-center gap-1.5 min-w-0">
                                                                <span className="text-xs font-bold text-white truncate">{slot.className}</span>
                                                                {slot.category && (
                                                                    <span className={`text-[7px] font-black uppercase px-1.5 py-0.5 rounded shrink-0 ${
                                                                        slot.category.toUpperCase().includes('BOX') && !slot.category.toUpperCase().includes('VIRTUAL')
                                                                            ? 'bg-[#E13038]/15 text-[#E13038]'
                                                                            : slot.category.toUpperCase().includes('FIT')
                                                                            ? 'bg-blue-500/15 text-blue-400'
                                                                            : slot.category.toUpperCase().includes('VIRTUAL')
                                                                            ? 'bg-purple-500/15 text-purple-400'
                                                                            : 'bg-gray-500/15 text-gray-400'
                                                                    }`}>
                                                                        {slot.category.toUpperCase().includes('BOX') && !slot.category.toUpperCase().includes('VIRTUAL') ? 'BOX'
                                                                            : slot.category.toUpperCase().includes('FIT') ? 'FIT'
                                                                            : slot.category.toUpperCase().includes('VIRTUAL') ? 'VIRTUAL'
                                                                            : slot.category}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-2 shrink-0 ml-2">
                                                                {slot.waitlisted > 0 && (
                                                                    <span className="text-[9px] font-bold text-orange-400 bg-orange-400/10 px-1.5 py-0.5 rounded">
                                                                        {slot.waitlisted} espera
                                                                    </span>
                                                                )}
                                                                <span className="text-[10px] font-black text-gray-400">{slot.reserved}/{slot.capacity}</span>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <div className="flex-1 h-1.5 bg-[#333] rounded-full overflow-hidden">
                                                                <div className={`h-full ${barColor} rounded-full transition-all duration-500`} style={{ width: `${Math.min(pct, 100)}%` }}></div>
                                                            </div>
                                                            <span className={`text-[8px] font-black uppercase ${statusColor} shrink-0`}>{statusLabel}</span>
                                                        </div>
                                                        {slot.startTime && (
                                                            <div className="flex items-center gap-1 mt-1">
                                                                <Clock size={10} className="text-gray-600" />
                                                                <span className="text-[9px] text-gray-600 font-bold">{slot.startTime}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <ChevronRight size={14} className="text-gray-600 shrink-0" />
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </main>

            <AdminNavBar />

            {/* ─── Modal: Attendees ─── */}
            {selectedSlot && (
                <div className="fixed inset-0 z-[100] flex items-end justify-center" onClick={() => setSelectedSlot(null)}>
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm"></div>
                    <div
                        className="relative w-full max-w-[480px] bg-[#1A1A1A] rounded-t-2xl max-h-[70vh] flex flex-col animate-in slide-in-from-bottom-8 duration-300"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Modal header */}
                        <div className="p-5 border-b border-white/10 flex justify-between items-start shrink-0">
                            <div>
                                <h3 className="text-lg font-black uppercase text-white">{selectedSlot.className}</h3>
                                <p className="text-xs text-gray-500 font-bold mt-1">
                                    {selectedSlot.dayLabel} {selectedSlot.dateStr.slice(5).replace('-', '/')} {selectedSlot.startTime && `· ${selectedSlot.startTime}`}
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedSlot(null)}
                                className="w-8 h-8 rounded-full bg-[#E13038] flex items-center justify-center active:scale-90 transition-transform"
                            >
                                <X size={16} className="text-white" />
                            </button>
                        </div>

                        {/* Stats bar */}
                        <div className="px-5 py-3 bg-[#222] flex justify-between items-center shrink-0">
                            <div className="flex gap-4">
                                <div className="text-center">
                                    <div className="text-lg font-black text-white">{selectedSlot.reserved}</div>
                                    <div className="text-[8px] font-bold text-gray-500 uppercase">Reservas</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-lg font-black text-gray-400">{selectedSlot.capacity}</div>
                                    <div className="text-[8px] font-bold text-gray-500 uppercase">Capacidad</div>
                                </div>
                                {selectedSlot.waitlisted > 0 && (
                                    <div className="text-center">
                                        <div className="text-lg font-black text-orange-400">{selectedSlot.waitlisted}</div>
                                        <div className="text-[8px] font-bold text-gray-500 uppercase">Espera</div>
                                    </div>
                                )}
                            </div>
                            <div className={`text-xs font-black uppercase px-3 py-1.5 rounded-lg ${selectedSlot.reserved >= selectedSlot.capacity ? 'bg-[#E13038]/15 text-[#E13038]' : 'bg-[#34A853]/15 text-[#34A853]'}`}>
                                {selectedSlot.reserved >= selectedSlot.capacity ? 'LLENA' : `${selectedSlot.capacity - selectedSlot.reserved} LIBRES`}
                            </div>
                        </div>

                        {/* Attendees list */}
                        <div className="overflow-y-auto flex-1 p-5">
                            {selectedSlot.attendees.length === 0 ? (
                                <p className="text-sm text-gray-500 text-center py-6">No hay reservas para esta clase</p>
                            ) : (
                                <div className="space-y-2">
                                    <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">
                                        Asistentes ({selectedSlot.attendees.length})
                                    </div>
                                    {selectedSlot.attendees.map((att, i) => (
                                        <div key={i} className="flex items-center gap-3 p-3 bg-[#222] rounded-lg">
                                            <div className="w-9 h-9 rounded-lg bg-[#333] overflow-hidden shrink-0">
                                                <img
                                                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(att.userName)}&background=1A1A1A&color=E13038&bold=true&size=36`}
                                                    alt={att.userName}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-bold text-white truncate">{att.userName}</p>
                                            </div>
                                            <div className="ml-auto shrink-0 w-2 h-2 rounded-full bg-[#34A853]"></div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
