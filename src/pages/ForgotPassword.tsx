import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase';
import { ArrowLeft, Mail, Loader2 } from 'lucide-react';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!email) {
            setStatus('error');
            setMessage('Por favor, introduce tu correo electrónico.');
            return;
        }

        setStatus('loading');
        try {
            await sendPasswordResetEmail(auth, email);
            setStatus('success');
            setMessage('Se han enviado las instrucciones a tu correo.');
        } catch (err: any) {
            setStatus('error');
            setMessage(
                err.code === 'auth/user-not-found' 
                    ? 'No se ha encontrado ninguna cuenta con este correo.'
                    : 'Ha ocurrido un error al intentar enviar el correo. Por favor, inténtalo de nuevo.'
            );
        }
    };

    return (
        <div className="min-h-screen bg-[#131313] font-sans text-white antialiased overflow-x-hidden selection:bg-[#f50a1d] selection:text-white">
            {/* TopAppBar Shell */}
            <header className="bg-[#131313] sticky top-0 z-50 w-full">
                <div className="flex items-center justify-between px-6 py-4 w-full max-w-[480px] mx-auto">
                    <button 
                        onClick={() => navigate('/login')}
                        className="hover:bg-[#1c1b1b] transition-colors duration-200 p-2 rounded-lg active:scale-95"
                    >
                        <ArrowLeft size={24} className="text-white" />
                    </button>
                    <h1 className="font-sans font-black tracking-[0.2em] uppercase text-2xl text-[#f50a1d]">
                        ALMODÓVAR
                    </h1>
                    <div className="w-10"></div> {/* Spacer */}
                </div>
            </header>

            <main className="min-h-[calc(100vh-72px)] w-full max-w-[480px] mx-auto px-8 flex flex-col pt-12 pb-24 relative overflow-hidden">
                {/* Kinetic Noir Backdrop Element */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#f50a1d]/10 rounded-full blur-[120px] -z-10 translate-x-1/2 -translate-y-1/2"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#f50a1d]/10 rounded-full blur-[150px] -z-10 -translate-x-1/2 translate-y-1/2"></div>

                {/* Header Section */}
                <div className="space-y-4 mb-12 relative z-10">
                    <h2 className="font-sans font-bold text-4xl leading-tight tracking-tight uppercase pr-12 flex items-center">
                        ¿OLVIDASTE TU CONTRASEÑA?
                    </h2>
                    <p className="text-[#A69795] text-lg leading-relaxed max-w-[90%] font-medium">
                        Introduce tu correo electrónico y te enviaremos las instrucciones para restablecer tu acceso.
                    </p>
                </div>

                {status === 'success' ? (
                    <div className="bg-[#2A2D3A] rounded-2xl p-8 text-center border border-white/10 shadow-xl space-y-6 relative z-10 animate-in fade-in zoom-in duration-300">
                        <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Mail className="text-green-500 w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-black text-white tracking-widest uppercase">Correo Enviado</h3>
                        <p className="text-sm text-[#A69795] leading-relaxed font-medium">
                            {message}
                        </p>
                        <button 
                            onClick={() => navigate('/login')}
                            className="w-full bg-[#1c1b1b] hover:bg-[#252424] text-white py-4 rounded-xl font-bold tracking-widest uppercase mt-4 transition-colors border border-white/5 active:scale-95"
                        >
                            VOLVER AL INICIO
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleResetPassword} className="space-y-10 relative z-10">
                        {status === 'error' && (
                            <div className="bg-[#f50a1d]/10 border border-[#f50a1d]/20 text-[#DDABA5] p-4 rounded-xl text-sm font-medium animate-in fade-in">
                                {message}
                            </div>
                        )}

                        <div className="group">
                            <label htmlFor="email" className="block text-xs font-black tracking-[0.2em] uppercase mb-3 ml-1 text-[#f50a1d]">
                                EMAIL
                            </label>
                            <div className="relative">
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={status === 'loading'}
                                    className="w-full bg-[#1c1b1b] border border-white/10 rounded-xl px-5 py-5 text-white placeholder:text-white/20 focus:outline-none focus:border-[#f50a1d] focus:ring-1 focus:ring-[#f50a1d] transition-all duration-300 font-medium disabled:opacity-50"
                                    placeholder="nombre@ejemplo.com"
                                />
                                <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none opacity-20 group-focus-within:opacity-60 transition-opacity">
                                    <Mail className="text-white w-5 h-5" />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6 pt-4">
                            <button 
                                type="submit"
                                disabled={status === 'loading'}
                                className="w-full h-16 flex items-center justify-center bg-gradient-to-r from-[#f50a1d] to-[#91090f] text-white font-black text-lg tracking-wider rounded-xl shadow-[0_10px_30px_rgba(245,10,29,0.3)] hover:shadow-[0_15px_40px_rgba(245,10,29,0.4)] active:scale-95 transition-all duration-300 uppercase disabled:opacity-50 disabled:transform-none"
                            >
                                {status === 'loading' ? (
                                    <Loader2 className="w-6 h-6 animate-spin" />
                                ) : (
                                    "ENVIAR INSTRUCCIONES"
                                )}
                            </button>

                            <button 
                                type="button"
                                onClick={() => navigate('/login')}
                                className="flex items-center justify-center gap-2 w-full py-4 text-[#A69795] hover:text-white font-bold text-xs tracking-widest uppercase transition-colors group active:scale-95"
                            >
                                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                                VOLVER AL INICIO DE SESIÓN
                            </button>
                        </div>
                    </form>
                )}

                {/* Technical Footnote */}
                <div className="mt-auto pt-20 flex items-center gap-4 opacity-20 relative z-10 hidden sm:flex">
                    <div className="h-[1px] flex-grow bg-white/20"></div>
                    <span className="text-[10px] tracking-[0.3em] font-black uppercase whitespace-nowrap">AUTHENTICATION MODULE V.01</span>
                    <div className="h-[1px] flex-grow bg-white/20"></div>
                </div>
            </main>
        </div>
    );
};

export default ForgotPassword;
