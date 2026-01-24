import { useState } from 'react';
import { X, Star, MessageSquare, Send } from 'lucide-react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebase';

interface ClassReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    classData: any;
    reservationId: string;
    onSuccess: () => void;
}

const ClassReviewModal = ({ isOpen, onClose, classData, reservationId, onSuccess }: ClassReviewModalProps) => {
    const [ratings, setRatings] = useState({
        content: 0,
        coach: 0,
        effort: 0,
        variety: 0,
        general: 0
    });
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen || !classData) return null;

    const handleRating = (category: keyof typeof ratings, value: number) => {
        setRatings(prev => ({ ...prev, [category]: value }));
    };

    const handleSubmit = async () => {
        if (!auth.currentUser) return;

        // Validation: Ensure all categories are rated
        if (Object.values(ratings).some(r => r === 0)) {
            alert("Por favor, puntúa todas las categorías.");
            return;
        }

        setIsSubmitting(true);
        try {
            await addDoc(collection(db, 'reviews'), {
                userId: auth.currentUser.uid,
                reservationId,
                classId: classData.id,
                coachId: classData.coachId,
                ratings,
                comment,
                createdAt: serverTimestamp()
            });
            onSuccess();
            onClose();
        } catch (error) {
            console.error("Error submitting review:", error);
            alert("Error al enviar la valoración.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const categories = [
        { key: 'content', label: 'Contenido' },
        { key: 'coach', label: 'Coach' },
        { key: 'effort', label: 'Esfuerzo' },
        { key: 'variety', label: 'Variedad' },
        { key: 'general', label: 'General' }
    ];

    return (
        <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center p-0 sm:p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>

            <div className="relative w-full max-w-md bg-white dark:bg-[#1F2128] rounded-t-[2.5rem] sm:rounded-[2.5rem] overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-300 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="relative h-24 bg-[#FF1F40] flex items-center justify-center">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-white/80 hover:text-white"
                    >
                        <X size={24} />
                    </button>
                    <div className="text-center text-white pt-4">
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Valorar Clase</p>
                        <h3 className="text-xl font-black italic uppercase">{classData.name}</h3>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    <p className="text-center text-xs text-gray-500 font-medium italic">
                        Tu opinión ayuda a mejorar el Box. <br /> Evalúa tu experiencia:
                    </p>

                    <div className="space-y-4">
                        {categories.map((cat) => (
                            <div key={cat.key} className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 dark:bg-[#2A2D3A]">
                                <span className="text-xs font-black uppercase tracking-wider text-gray-700 dark:text-gray-300 w-24">
                                    {cat.label}
                                </span>
                                <div className="flex gap-2">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            onClick={() => handleRating(cat.key as any, star)}
                                            className="transition-transform active:scale-110 focus:outline-none"
                                        >
                                            <Star
                                                size={20}
                                                fill={ratings[cat.key as keyof typeof ratings] >= star ? "#FFC107" : "none"}
                                                className={ratings[cat.key as keyof typeof ratings] >= star ? "text-[#FFC107]" : "text-gray-300 dark:text-gray-600"}
                                            />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                            <MessageSquare size={12} />
                            Comentario (Opcional)
                        </label>
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="¿Qué te ha parecido el WOD? ¿Alguna sugerencia?"
                            className="w-full h-24 p-4 rounded-2xl bg-gray-50 dark:bg-[#2A2D3A] border-none outline-none text-sm resize-none focus:ring-2 focus:ring-[#FF1F40]/20"
                        />
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="w-full py-4 rounded-2xl bg-[#FF1F40] text-white font-black uppercase tracking-widest shadow-lg shadow-red-500/30 flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? 'Enviando...' : 'Enviar Valoración'}
                        {!isSubmitting && <Send size={16} />}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ClassReviewModal;
