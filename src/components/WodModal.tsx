import React, { useState, useEffect } from 'react';
import { X, Clock, User, Dumbbell, AlignLeft, Users, FileDown } from 'lucide-react';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { generateWodPdf } from '../utils/generateWodPdf';

interface WodModalProps {
    isOpen: boolean;
    onClose: () => void;
    classData: any;
}

const WodModal: React.FC<WodModalProps> = ({ isOpen, onClose, classData }) => {
    if (!isOpen || !classData) return null;

    const isDarkMode = document.documentElement.classList.contains('dark');

    // Coach Name & Attendees State
    const [coachName, setCoachName] = useState('Coach');
    const [attendees, setAttendees] = useState<any[]>([]);
    const [exerciseImages, setExerciseImages] = useState<{ [key: string]: string }>({});

    useEffect(() => {
        if (!classData) return;

        // 1. Fetch Coach
        if (classData.coachId) {
            getDoc(doc(db, 'coaches', classData.coachId)).then(snap => {
                if (snap.exists()) setCoachName(snap.data().name);
                else {
                    getDoc(doc(db, 'users', classData.coachId)).then(uSnap => {
                        if (uSnap.exists()) setCoachName(uSnap.data().displayName);
                    });
                }
            });
        }

        // 2. Fetch Attendees
        const fetchAttendees = async () => {
            const q = query(collection(db, 'reservations'), where('classId', '==', classData.id), where('status', 'in', ['confirmed', 'pending_confirmation']));
            const snap = await getDocs(q);
            const userPromises = snap.docs.map(async (rDoc) => {
                const rData = rDoc.data();
                const uSnap = await getDoc(doc(db, 'users', rData.userId));
                return {
                    id: rData.userId,
                    name: uSnap.exists() ? uSnap.data().displayName : 'Usuario',
                    photo: uSnap.exists() ? uSnap.data().photoURL : null,
                    status: rData.status
                };
            });
            const users = await Promise.all(userPromises);
            setAttendees(users);
        };
        fetchAttendees();

        // 3. Fetch Exercise Images
        const fetchImages = async () => {
            if (!classData.wod || !Array.isArray(classData.wod)) return;
            const images: { [key: string]: string } = {};

            for (const item of classData.wod) {
                if (item.exerciseId) {
                    try {
                        // Check if we already have it (though locally not persistent)
                        const exDoc = await getDoc(doc(db, 'exercises', item.exerciseId));
                        if (exDoc.exists() && exDoc.data().imageUrl) {
                            images[item.exerciseId] = exDoc.data().imageUrl;
                        }
                    } catch (e) {
                        console.error("Error fetching exercise image:", e);
                    }
                }
            }
            setExerciseImages(images);
        };
        fetchImages();

    }, [classData?.id, classData?.coachId]);

    const wodItems = Array.isArray(classData.wod) ? classData.wod : [];

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
            <div className={`w-full max-w-md h-[85vh] rounded-[2.5rem] relative overflow-hidden flex flex-col shadow-2xl ${isDarkMode ? 'bg-[#1F2128]' : 'bg-white'}`}>

                {/* 1. Header Image & Close */}
                <div className="relative h-48 shrink-0">
                    <img
                        src={classData.imageUrl || "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80"}
                        className="w-full h-full object-cover"
                        alt="Class Cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-transparent"></div>
                    <button
                        onClick={onClose}
                        className="absolute top-6 right-6 w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white active:scale-95 transition-all outline-none"
                    >
                        <X size={20} />
                    </button>
                    <div className="absolute bottom-4 left-6 right-6">
                        <span className="px-2 py-1 rounded-md bg-[#FF1F40] text-white text-[10px] font-black uppercase tracking-widest mb-2 inline-block shadow-lg shadow-red-500/30">
                            {classData.group?.toUpperCase() || 'BOX'}
                        </span>
                        <h2 className="text-2xl font-black text-white italic uppercase leading-none text-shadow-sm">
                            {classData.name}
                        </h2>
                    </div>
                </div>

                {/* 2. Content */}
                <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 custom-scrollbar">

                    {/* Info Pills */}
                    <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
                        <div className={`shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl border ${isDarkMode ? 'border-white/10 bg-white/5' : 'border-gray-100 bg-gray-50'}`}>
                            <Clock size={16} className="text-[#FF1F40]" />
                            <div>
                                <p className="text-[9px] font-bold text-gray-500 uppercase">Horario</p>
                                <p className={`text-xs font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{classData.startTime} - {classData.endTime}</p>
                            </div>
                        </div>
                        <div className={`shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl border ${isDarkMode ? 'border-white/10 bg-white/5' : 'border-gray-100 bg-gray-50'}`}>
                            <User size={16} className="text-[#FF1F40]" />
                            <div>
                                <p className="text-[9px] font-bold text-gray-500 uppercase">Coach</p>
                                <p className={`text-xs font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                    {coachName || 'Staff'}
                                </p>
                            </div>
                        </div>
                        <div className={`shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl border ${isDarkMode ? 'border-white/10 bg-white/5' : 'border-gray-100 bg-gray-50'}`}>
                            <Users size={16} className="text-[#FF1F40]" />
                            <div>
                                <p className="text-[9px] font-bold text-gray-500 uppercase">Estado</p>
                                <p className={`text-xs font-black ${classData.currentCapacity >= classData.maxCapacity ? 'text-red-500' : 'text-green-500'} uppercase`}>
                                    {classData.currentCapacity >= classData.maxCapacity
                                        ? "Completo (Cola)"
                                        : `${classData.maxCapacity - classData.currentCapacity} Libres`}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    {classData.description && (
                        <div className="space-y-2">
                            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <AlignLeft size={14} /> Description
                            </h3>
                            <p className={`text-sm font-medium leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                {classData.description}
                            </p>
                        </div>
                    )}

                    {/* Attendees Section */}
                    <div className="space-y-2">
                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                            <Users size={14} /> Asistentes ({attendees.length})
                        </h3>
                        {attendees.length === 0 ? (
                            <p className="text-xs text-gray-400 italic">Sé el primero en apuntarte.</p>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {attendees.map((u, i) => (
                                    <div key={i} className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${isDarkMode ? 'bg-[#2A2D3A] border-white/5' : 'bg-gray-50 border-gray-100'}`}>
                                        {u.photo ? (
                                            <img src={u.photo} className="w-4 h-4 rounded-full object-cover" />
                                        ) : (
                                            <div className="w-4 h-4 rounded-full bg-gray-200 flex items-center justify-center text-[8px] font-bold text-gray-500">
                                                {u.name.charAt(0)}
                                            </div>
                                        )}
                                        <span className={`text-[10px] font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} truncate max-w-[80px]`}>
                                            {u.name.split(' ')[0]}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* WOD Section */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <Dumbbell size={14} /> Workout of the Day
                            </h3>
                            <button
                                onClick={() => generateWodPdf(classData, coachName)}
                                className="bg-[#FF1F40] text-white text-[9px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest flex items-center gap-1.5 active:scale-95 transition-transform"
                            >
                                <FileDown size={12} />
                                PDF
                            </button>
                        </div>


                        {wodItems.length === 0 ? (
                            <div className="py-8 text-center border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl opacity-50">
                                <p className="text-xs font-bold text-gray-400 uppercase">WOD Sorpresa o No publicado</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {wodItems.map((item: any, idx: number) => (
                                    <div key={idx} className={`p-4 rounded-2xl border flex gap-4 ${isDarkMode ? 'bg-[#2A2D3A] border-white/5' : 'bg-gray-50 border-gray-100'}`}>
                                        <div className="w-16 h-16 rounded-xl bg-gray-200 shrink-0 overflow-hidden relative">
                                            {item.exerciseId && exerciseImages[item.exerciseId] ? (
                                                <img
                                                    src={exerciseImages[item.exerciseId]}
                                                    alt={item.exerciseName}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-[#FF1F40]/10 text-[#FF1F40] font-black text-sm">
                                                    {idx + 1}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <h4 className={`text-sm font-black uppercase italic ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                                {item.exerciseName}
                                            </h4>
                                            <div className="mt-2 flex gap-4">
                                                {item.sets && (
                                                    <div>
                                                        <span className="text-[9px] font-black text-gray-400 uppercase block">Sets</span>
                                                        <span className={`text-xs font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>{item.sets}</span>
                                                    </div>
                                                )}
                                                {item.reps && (
                                                    <div>
                                                        <span className="text-[9px] font-black text-gray-400 uppercase block">Reps</span>
                                                        <span className={`text-xs font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>{item.reps}</span>
                                                    </div>
                                                )}
                                            </div>
                                            {item.notes && (
                                                <p className="mt-2 text-[11px] text-gray-500 font-medium italic border-l-2 border-gray-300 pl-2">
                                                    "{item.notes}"
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
};

export default WodModal;
