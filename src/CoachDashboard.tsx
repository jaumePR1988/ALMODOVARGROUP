import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Bell,
    Sun,
    Moon,
    Calendar,
    Settings,
    User,
    Users,
    MapPin,
    Activity,
    Home,
    FileDown,
    Dumbbell,
    X,
    ChevronRight,
    Check
} from 'lucide-react';
// @ts-ignore
import { jsPDF } from 'jspdf';
import BottomNavigation from './components/BottomNavigation';
import TopHeader from './components/TopHeader';
import { collection, onSnapshot, query, where, orderBy, limit, getDocs, getDoc, doc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';

const CoachDashboard = ({ onLogout }: { onLogout: () => void }) => {
    const [isDarkMode, setIsDarkMode] = useState(() => document.documentElement.classList.contains('dark'));
    const [assignedClasses, setAssignedClasses] = useState<any[]>([]);
    const [stats, setStats] = useState({ totalClasses: 0, totalStudents: 0 });
    const navigate = useNavigate();
    const [user, setUser] = useState<any>(null);
    const [coachProfileId, setCoachProfileId] = useState<string | null>(null);
    const [selectedClassForWod, setSelectedClassForWod] = useState<any>(null); // For WOD Modal

    useEffect(() => {
        // Rely on App.tsx for auth state and redirection
        if (auth.currentUser) {
            setUser(auth.currentUser);
        }
    }, []);

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

    // Find Coach Profile ID by Email
    useEffect(() => {
        if (!user || !user.email) return;

        const q = query(collection(db, 'coaches'), where('email', '==', user.email));
        const unsubscribe = onSnapshot(q, {
            next: (snapshot) => {
                if (!snapshot.empty) {
                    setCoachProfileId(snapshot.docs[0].id);
                } else {
                    console.warn("No coach profile found for email:", user.email);
                    setCoachProfileId(user.uid);
                }
            },
            error: (err) => {
                console.error("Coach profile permission error:", err);
                setCoachProfileId(user.uid); // Fallback
            }
        });
        return () => unsubscribe();
    }, [user]);

    const [classAttendees, setClassAttendees] = useState<{ [key: string]: string[] }>({});

    // Fetch assigned classes using Coach Profile ID
    useEffect(() => {
        if (!coachProfileId) return;

        const today = new Date().toISOString().split('T')[0];
        const q = query(
            collection(db, 'classes'),
            where('coachId', '==', coachProfileId),
            where('date', '==', today)
        );

        const unsubscribe = onSnapshot(q, async (querySnapshot) => {
            let classesData: any[] = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));



            classesData.sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));
            setAssignedClasses(classesData);

            // Calculate stats
            const totalStudents = classesData.reduce((sum, cls) => sum + (cls.currentCapacity || 0), 0);
            setStats({
                totalClasses: classesData.length,
                totalStudents
            });

            // Fetch top avatars 
            if (classesData.length > 0) {
                const attendeesMap: { [key: string]: string[] } = {};
                for (const cls of classesData) {
                    const resQ = query(
                        collection(db, 'reservations'),
                        where('classId', '==', cls.id),
                        limit(3)
                    );
                    const resSnap = await getDocs(resQ);
                    const avatars: string[] = [];
                    for (const resDoc of resSnap.docs) {
                        const resData = resDoc.data();
                        const userSnap = await getDoc(doc(db, 'users', resData.userId));
                        if (userSnap.exists()) {
                            avatars.push(userSnap.data().photoURL || '');
                        }
                    }
                    attendeesMap[cls.id] = avatars;
                }
                setClassAttendees(attendeesMap);
            }
        });

        return () => unsubscribe();
    }, [coachProfileId]);

    const urlToBase64 = async (url: string): Promise<string> => {
        try {
            const response = await fetch(url, { mode: 'cors' });
            const blob = await response.blob();
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        } catch (error) {
            console.warn("Image fetch failed, falling back to canvas method:", error);
            // Fallback to Canvas method if fetch fails (e.g. strict CORS but allowing loading in img tag)
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.crossOrigin = 'Anonymous';
                img.src = url;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0);
                    resolve(canvas.toDataURL('image/jpeg'));
                };
                img.onerror = () => reject(new Error('Canvas image load failed'));
            });
        }
    };

    const handleExportPDF = async (classData: any) => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.width;
        const pageHeight = doc.internal.pageSize.height;

        // --- 1. HEADER (Black) ---
        doc.setFillColor(12, 12, 12);
        doc.rect(0, 0, pageWidth, 40, 'F');

        // Logo
        try {
            // Load local logo from public folder
            const logoImg = new Image();
            logoImg.src = '/logo_almodovar.png';
            await new Promise((resolve) => {
                logoImg.onload = resolve;
                logoImg.onerror = resolve; // Continue even if fails
            });
            doc.addImage(logoImg, 'PNG', 15, 8, 24, 24);
        } catch (e) {
            // Fallback Circle 'A'
            doc.setFillColor(255, 31, 64);
            doc.circle(25, 20, 12, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(30);
            doc.setFont("helvetica", "bold");
            doc.text("A", 25, 29, { align: "center", baseline: "bottom" });
        }

        // Brand Name
        doc.setFontSize(22);
        doc.text("ALMODOVAR BOX", 45, 20);

        // Subtitle (Red)
        doc.setTextColor(255, 31, 64);
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text("TRAINING SESSION REPORT", 45, 27, { charSpace: 1.5 });

        // --- 2. INFO BAR (Darker Strip) ---
        doc.setFillColor(20, 20, 20);
        doc.rect(0, 40, pageWidth, 12, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.text(classData.name.toUpperCase(), 15, 47);

        // Date & Coach
        const dateStr = classData.date ? new Date(classData.date).toLocaleDateString() : 'HOY';
        doc.text(`${dateStr}   |   ${classData.startTime} - ${classData.endTime}   |   Coach ${(user?.displayName || 'Coach').split(' ')[0]}`, pageWidth - 15, 47, { align: 'right' });

        // --- 3. SECTION TITLE ---
        const startY = 65;
        // Red Lines
        doc.setDrawColor(220, 0, 0);
        doc.setLineWidth(0.5);
        doc.line(15, startY, 70, startY);
        doc.line(140, startY, pageWidth - 15, startY);

        doc.setTextColor(12, 12, 12);
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("PROGRAMACIÓN WOD", pageWidth / 2, startY + 2, { align: "center" });

        // --- 4. WOD CARDS ---
        let yPos = startY + 15;
        const wodItems = classData.wod || [];

        for (let i = 0; i < wodItems.length; i++) {
            const item = wodItems[i];

            // Fetch Image
            let imgData = null;
            if (item.exerciseId) {
                try {
                    const exDoc = await getDoc(doc(db, 'exercises', item.exerciseId));
                    if (exDoc.exists() && exDoc.data().imageUrl) {
                        imgData = await urlToBase64(exDoc.data().imageUrl);
                    }
                } catch (e) { }
            }

            // Card Container (White with Shadow/Border)
            doc.setDrawColor(230, 230, 230);
            doc.setFillColor(255, 255, 255);
            doc.roundedRect(15, yPos, pageWidth - 30, 24, 3, 3, 'FD');

            // Image Thumbnail
            if (imgData) {
                try {
                    doc.addImage(imgData, 'JPEG', 18, yPos + 3, 18, 18, undefined, 'FAST');
                } catch (err) { }
            } else {
                doc.setFillColor(240, 240, 240);
                doc.roundedRect(18, yPos + 3, 18, 18, 2, 2, 'F');
            }

            // Exercise Name
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(12);
            doc.setFont("helvetica", "bold");
            doc.text(item.exerciseName, 42, yPos + 10);

            // Badges (Simulated)
            const typeText = (item.exerciseName.match(/run|rem|bici|jump|box|burpee/i)) ? "CARDIO" : "FUERZA";
            const badgeColor = typeText === "CARDIO" ? [255, 235, 235] : [235, 240, 255];
            const textColor = typeText === "CARDIO" ? [255, 50, 50] : [50, 50, 200];

            doc.setFillColor(badgeColor[0], badgeColor[1], badgeColor[2]);
            doc.roundedRect(pageWidth - 35, yPos + 4, 16, 6, 1, 1, 'F');
            doc.setFontSize(6);
            doc.setTextColor(textColor[0], textColor[1], textColor[2]);
            doc.text(typeText, pageWidth - 27, yPos + 8, { align: "center" });

            // Stat Pills
            let pillX = 42;
            const drawPill = (label: string, value: string) => {
                const text = `${value} ${label}`;
                doc.setFillColor(255, 245, 235); // Light Orange
                doc.roundedRect(pillX, yPos + 13, 20, 6, 1, 1, 'F');
                doc.setTextColor(200, 100, 0); // Dark Orange
                doc.setFontSize(7);
                doc.setFont("helvetica", "bold");
                doc.text(text, pillX + 10, yPos + 17, { align: "center" });
                pillX += 24;
            };

            if (item.sets) drawPill("SER.", item.sets);
            if (item.reps) drawPill("REPS", item.reps);

            yPos += 30; // Gap + Height

            if (yPos > pageHeight - 40) {
                doc.addPage();
                yPos = 20;
            }
        }

        // --- 5. FOOTER ---
        const footerY = pageHeight - 30;
        doc.setDrawColor(240, 240, 240);
        doc.setLineWidth(0.5);
        doc.setLineDashPattern([2, 2], 0);
        doc.roundedRect(15, footerY, pageWidth - 30, 15, 2, 2, 'S');
        doc.setLineDashPattern([], 0);

        doc.setFontSize(10);
        doc.setTextColor(150, 150, 150);
        doc.setFont("helvetica", "italic");
        doc.text('"No pain, no gain. Let\'s crush this session!"', pageWidth / 2, footerY + 6, { align: "center" });

        doc.setFont("helvetica", "bold");
        doc.setTextColor(255, 31, 64);
        doc.text("• ALMODOVAR BOX •", pageWidth / 2, footerY + 11, { align: "center" });

        doc.save(`WOD_${classData.name.replace(/\s+/g, '_')}.pdf`);
    };

    // Redundant theme/logout removed (now in TopHeader)



    return (
        <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-[#1F2128] text-white' : 'bg-[#F3F4F6] text-gray-900'} font-sans pb-32 overflow-x-hidden`}>
            <div className="max-w-md mx-auto px-6 pt-6 space-y-8">

                {/* Header Unificado */}
                <TopHeader
                    title={`Hola, ${user?.displayName ? user.displayName.split(' ')[0] : 'Coach'} 👋`}
                    subtitle="Panel de Entrenador"
                    profileImage={user?.photoURL}
                    showNotificationDot={false}
                    onLogout={onLogout}
                />

                {/* Removed Debug Panel */}

                {/* Coach Stats Grid */}
                <section className="grid grid-cols-2 gap-4">
                    <div className={`${isDarkMode ? 'bg-[#2A2D3A]' : 'bg-white shadow-xl shadow-gray-300/30'} p-5 rounded-3xl flex flex-col justify-between h-36 border border-transparent dark:border-gray-800/50`}>
                        <div className="flex justify-between items-start">
                            <div className={`p-2.5 rounded-xl text-orange-400 ${isDarkMode ? 'bg-[#1F2128]' : 'bg-orange-50'}`}>
                                <Activity size={22} strokeWidth={2.5} />
                            </div>
                            <span className="text-[10px] font-black text-white bg-[#FF1F40] px-2 py-1 rounded-lg">HOY</span>
                        </div>
                        <div>
                            <span className="text-3xl font-black block leading-none">{stats.totalClasses}</span>
                            <span className={`text-[10px] font-bold uppercase tracking-widest ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Clases Programadas</span>
                        </div>
                    </div>
                    <div className={`${isDarkMode ? 'bg-[#2A2D3A]' : 'bg-white shadow-xl shadow-gray-300/30'} p-5 rounded-3xl flex flex-col justify-between h-36 border border-transparent dark:border-gray-800/50`}>
                        <div className="flex justify-between items-start">
                            <div className={`p-2.5 rounded-xl text-blue-400 ${isDarkMode ? 'bg-[#1F2128]' : 'bg-blue-50'}`}>
                                <Users size={22} strokeWidth={2.5} />
                            </div>
                        </div>
                        <div>
                            <span className="text-3xl font-black block leading-none">{stats.totalStudents}</span>
                            <span className={`text-[10px] font-bold uppercase tracking-widest ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Alumnos Totales</span>
                        </div>
                    </div>
                </section>

                {/* Agenda Section */}
                <section className="space-y-4">
                    <div className="flex items-end mb-2">
                        <h2 className="text-xl font-bold dark:text-white italic uppercase tracking-tighter">Agenda de hoy</h2>
                    </div>

                    {assignedClasses.length === 0 ? (
                        <div className={`p-10 rounded-[2.5rem] border-2 border-dashed flex flex-col items-center justify-center text-center ${isDarkMode ? 'border-gray-800 bg-[#2A2D3A]/20' : 'border-gray-200 bg-white shadow-sm'}`}>
                            <Calendar size={32} className="text-gray-400 mb-3" />
                            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">No tienes clases asignadas hoy</p>
                        </div>
                    ) : (
                        assignedClasses.map((item) => (
                            <div
                                key={item.id}
                                onClick={() => setSelectedClassForWod(item)}
                                className={`relative rounded-[2.5rem] overflow-hidden group transition-all active:scale-[0.98] cursor-pointer ${isDarkMode ? 'bg-[#2A2D3A]' : 'bg-white shadow-xl shadow-gray-300/30 border border-gray-100'}`}
                            >
                                {/* Background Image with Overlay */}
                                <div className="absolute inset-0 z-0">
                                    <img
                                        src={item.imageUrl || "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80"}
                                        alt={item.name}
                                        className="w-full h-full object-cover opacity-70"
                                    />
                                    {/* Gradient overlay to ensure text readability but show more image */}
                                    <div className={`absolute inset-0 ${isDarkMode ? 'bg-gradient-to-r from-[#2A2D3A] via-[#2A2D3A]/80 to-transparent' : 'bg-gradient-to-r from-white via-white/80 to-transparent'}`} />
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
                                                    <span className="text-[10px] font-bold uppercase">{item.group || 'Clase'} • Sala Principal</span>
                                                </div>
                                            </div>
                                        </div>
                                        <button className={`p-2 rounded-xl h-10 w-10 flex items-center justify-center transition-colors ${isDarkMode ? 'bg-[#1F2128] text-gray-500 hover:text-white' : 'bg-gray-100 text-gray-400 hover:text-gray-600'}`}>
                                            <Settings size={18} />
                                        </button>
                                    </div>

                                    <div className="flex items-center justify-between pt-2 border-t border-gray-100/10 dark:border-white/5">
                                        <div className="flex items-center gap-4">
                                            <div className="flex -space-x-2">
                                                {(classAttendees[item.id] || []).map((url, i) => (
                                                    <div key={i} className="w-6 h-6 rounded-full border-2 border-white dark:border-[#2A2D3A] overflow-hidden bg-gray-100">
                                                        {url ? (
                                                            <img src={url} alt="user" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center bg-gray-200">
                                                                <User size={10} className="text-gray-400" />
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                                {item.currentCapacity > (classAttendees[item.id]?.length || 0) && (
                                                    <div className="w-6 h-6 rounded-full border-2 border-white dark:border-[#2A2D3A] bg-gray-100 dark:bg-[#1F2128] flex items-center justify-center text-[8px] font-bold text-gray-500">
                                                        +{item.currentCapacity - (classAttendees[item.id]?.length || 0)}
                                                    </div>
                                                )}
                                            </div>
                                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{item.currentCapacity} Registrados</span>
                                        </div>
                                        <button
                                            onClick={() => navigate(`/manage-attendance/${item.id}`)}
                                            className="bg-[#FF1F40] text-white text-[10px] font-black px-4 py-2 rounded-xl shadow-lg shadow-red-900/20 active:scale-95 transition-all hover:brightness-110 uppercase tracking-widest"
                                        >
                                            Ver Lista
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </section>

            </div>



            <BottomNavigation
                role="coach"
                activeTab="home"
            />

            {/* WOD DETAIL MODAL */}
            {selectedClassForWod && (
                <div className="fixed inset-0 z-[300] flex items-end justify-center sm:items-center p-0 sm:p-6 translate-y-0 transition-transform">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setSelectedClassForWod(null)}></div>
                    <div className={`relative w-full max-w-md ${isDarkMode ? 'bg-[#1F2128]' : 'bg-[#F3F4F6]'} rounded-t-[3rem] sm:rounded-[3rem] overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-300`}>
                        <div className="relative h-48">
                            <img
                                src={selectedClassForWod.imageUrl || "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80"}
                                className="w-full h-full object-cover"
                                alt=""
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#1F2128] via-[#1F2128]/40 to-transparent"></div>
                            <button
                                onClick={() => setSelectedClassForWod(null)}
                                className="absolute top-6 right-6 w-10 h-10 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/20 active:scale-95"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="px-8 pb-10 -mt-8 relative z-10">
                            <div className="flex items-center gap-2 mb-4">
                                <span className="bg-[#FF1F40] text-white text-[8px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest">WOD DEL DÍA</span>
                                <span className="bg-white/10 backdrop-blur-md text-white text-[8px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest">
                                    {selectedClassForWod.startTime} - {selectedClassForWod.endTime}
                                </span>
                            </div>
                            <h3 className="text-3xl font-black italic uppercase italic text-white mb-2 leading-none">{selectedClassForWod.name}</h3>
                            <p className="text-xs text-gray-400 font-medium mb-8">Coach {user?.displayName || 'Coach'} • Sala Principal</p>

                            <div className="space-y-3 mb-8">
                                {selectedClassForWod.wod && selectedClassForWod.wod.length > 0 ? (
                                    selectedClassForWod.wod.map((exercise: any, i: number) => (
                                        <div key={i} className={`p-5 rounded-[1.5rem] flex items-center justify-between ${isDarkMode ? 'bg-[#2A2D3A]' : 'bg-white shadow-sm border border-gray-100'}`}>
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-[#FF1F40]/10 rounded-xl flex items-center justify-center text-[#FF1F40]">
                                                    <Dumbbell size={20} />
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-black uppercase italic leading-tight">{exercise.exerciseName}</h4>
                                                    <p className="text-[10px] text-gray-500 font-bold uppercase">{exercise.sets} Sets • {exercise.reps} Reps</p>
                                                </div>
                                            </div>
                                            <ChevronRight size={16} className="text-gray-600" />
                                        </div>
                                    ))
                                ) : (
                                    <div className="py-10 text-center opacity-30 border-2 border-dashed border-gray-700 rounded-[2rem]">
                                        <Activity size={32} className="mx-auto mb-3" />
                                        <p className="text-xs font-black uppercase tracking-widest text-white">Sin WOD para esta sesión</p>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => handleExportPDF(selectedClassForWod)}
                                    className="bg-white text-black py-4 rounded-2xl flex items-center justify-center gap-2 font-black uppercase tracking-widest text-[10px] shadow-xl hover:scale-105 transition-all"
                                >
                                    <FileDown size={16} />
                                    PDF WOD
                                </button>
                                <button
                                    onClick={() => navigate(`/edit-class/${selectedClassForWod.id}`)}
                                    className="bg-[#FF1F40] text-white py-4 rounded-2xl flex items-center justify-center gap-2 font-black uppercase tracking-widest text-[10px] shadow-xl hover:scale-105 transition-all shadow-red-900/40"
                                >
                                    <Dumbbell size={16} strokeWidth={3} />
                                    EDITAR WOD
                                </button>
                                <button
                                    onClick={() => navigate(`/manage-attendance/${selectedClassForWod.id}`)}
                                    className="col-span-2 bg-gray-900 text-white py-4 rounded-2xl flex items-center justify-center gap-2 font-black uppercase tracking-widest text-[10px] shadow-xl hover:scale-105 transition-all"
                                >
                                    <Check size={16} strokeWidth={3} />
                                    CONTROL DE ASISTENCIA
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CoachDashboard;
