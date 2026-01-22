import React, { useEffect, useState } from 'react';
import { X, Check, AlertTriangle, Info } from 'lucide-react';

interface PremiumModalProps {
    isOpen: boolean;
    type: 'success' | 'danger' | 'warning' | 'info';
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm?: () => void;
    onClose: () => void;
}

const PremiumModal: React.FC<PremiumModalProps> = ({
    isOpen,
    type,
    title,
    message,
    confirmText = "Aceptar",
    cancelText = "Cancelar",
    onConfirm,
    onClose
}) => {
    const [animate, setAnimate] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setAnimate(true);
        } else {
            setTimeout(() => setAnimate(false), 200);
        }
    }, [isOpen]);

    if (!isOpen && !animate) return null;

    const colors = {
        success: 'text-green-500 bg-green-500/10 border-green-500/20',
        danger: 'text-[#FF1F40] bg-[#FF1F40]/10 border-[#FF1F40]/20',
        warning: 'text-orange-500 bg-orange-500/10 border-orange-500/20',
        info: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
    };

    const icons = {
        success: <Check size={32} />,
        danger: <AlertTriangle size={32} />,
        warning: <AlertTriangle size={32} />,
        info: <Info size={32} />,
    };

    return (
        <div className={`fixed inset-0 z-[150] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
            <div
                className={`bg-white dark:bg-[#1F2128] w-full max-w-sm rounded-[2rem] p-6 shadow-2xl relative overflow-hidden transition-all duration-300 transform border border-white/5 ${isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}`}
            >
                {/* Decorative Background Blur */}
                <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-[60px] opacity-20 pointer-events-none -mr-10 -mt-10 ${type === 'danger' ? 'bg-red-500' : type === 'success' ? 'bg-green-500' : 'bg-blue-500'}`}></div>

                <div className="relative z-10 flex flex-col items-center text-center">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-5 ${colors[type]}`}>
                        {icons[type]}
                    </div>

                    <h3 className="text-xl font-black uppercase italic mb-2 dark:text-white">{title}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium leading-relaxed mb-8 whitespace-pre-wrap">
                        {message}
                    </p>

                    <div className="flex w-full gap-3">
                        {onConfirm && (
                            <button
                                onClick={onClose}
                                className="flex-1 py-4 rounded-xl font-bold uppercase tracking-wide text-xs bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 hover:bg-gray-200 transition-colors"
                            >
                                {cancelText}
                            </button>
                        )}
                        <button
                            onClick={() => {
                                if (onConfirm) onConfirm();
                                onClose();
                            }}
                            className={`flex-1 py-4 rounded-xl font-bold uppercase tracking-wide text-xs text-white shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2
                                ${type === 'danger' ? 'bg-[#FF1F40] shadow-red-500/30' :
                                    type === 'success' ? 'bg-green-500 shadow-green-500/30' :
                                        type === 'warning' ? 'bg-orange-500 shadow-orange-500/30' : 'bg-blue-500 shadow-blue-500/30'}
                            `}
                        >
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PremiumModal;
