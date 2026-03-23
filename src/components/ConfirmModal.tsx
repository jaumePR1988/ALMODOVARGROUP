import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
}

const ConfirmModal = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    title, 
    message, 
    confirmText = "Confirmar", 
    cancelText = "Cancelar" 
}: ConfirmModalProps) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#1c1b1b] border border-[#333] rounded-3xl p-6 shadow-2xl w-full max-w-sm relative overflow-hidden animate-in zoom-in-95 duration-300">
                {/* Background glow effect */}
                <div className="absolute top-0 right-0 w-32 h-32 rounded-bl-full bg-[#E13038] blur-2xl pointer-events-none opacity-20"></div>
                
                <div className="flex justify-between items-start mb-4 relative z-10">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-[#E13038]/10 text-[#E13038] border border-[#E13038]/20">
                        <AlertTriangle size={24} />
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-500 hover:text-white transition-colors active:scale-95">
                        <X size={20} />
                    </button>
                </div>
                
                <h3 className="text-xl font-black text-white uppercase tracking-widest mb-2 relative z-10">{title}</h3>
                <p className="text-sm font-medium text-gray-400 mb-6 relative z-10">{message}</p>
                
                <div className="flex gap-3 relative z-10">
                    <button 
                        onClick={onClose}
                        className="flex-1 py-4 rounded-xl font-bold uppercase tracking-widest text-sm text-gray-400 bg-[#2a2a2a] hover:bg-[#333] hover:text-white transition-colors active:scale-95"
                    >
                        {cancelText}
                    </button>
                    <button 
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                        className="flex-1 py-4 rounded-xl font-black uppercase tracking-widest text-sm text-white bg-[#E13038] hover:bg-red-500 shadow-[0_4px_20px_rgba(225,48,56,0.3)] transition-all active:scale-95"
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
