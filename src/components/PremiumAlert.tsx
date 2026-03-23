import { CheckCircle2, AlertCircle, X } from 'lucide-react';

interface PremiumAlertProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    message: string;
    type?: 'success' | 'error';
}

const PremiumAlert = ({ isOpen, onClose, title, message, type = 'success' }: PremiumAlertProps) => {
    if (!isOpen) return null;

    const isSuccess = type === 'success';

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#1c1b1b] border border-[#333] rounded-3xl p-6 shadow-2xl w-full max-w-sm relative overflow-hidden animate-in zoom-in-95 duration-300">
                {/* Background glow effect */}
                <div className={`absolute top-0 right-0 w-32 h-32 rounded-bl-full blur-2xl pointer-events-none opacity-20 ${isSuccess ? 'bg-green-500' : 'bg-[#E13038]'}`}></div>
                
                <div className="flex justify-between items-start mb-4 relative z-10">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isSuccess ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-[#E13038]/10 text-[#E13038] border border-[#E13038]/20'}`}>
                        {isSuccess ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-500 hover:text-white transition-colors active:scale-95">
                        <X size={20} />
                    </button>
                </div>
                
                <h3 className="text-xl font-black text-white uppercase tracking-widest mb-2 relative z-10">{title}</h3>
                <p className="text-sm font-medium text-gray-400 mb-6 relative z-10">{message}</p>
                
                <button 
                    onClick={onClose}
                    className={`w-full py-4 rounded-xl font-black uppercase tracking-widest text-sm text-white active:scale-[0.98] transition-all relative z-10 
                        ${isSuccess ? 'bg-green-600 hover:bg-green-500 shadow-[0_4px_20px_rgba(22,163,74,0.3)]' : 'bg-[#E13038] hover:bg-red-500 shadow-[0_4px_20px_rgba(225,48,56,0.3)]'}`}
                >
                    Entendido
                </button>
            </div>
        </div>
    );
};

export default PremiumAlert;
