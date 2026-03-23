import { useState, useEffect } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Loader2, LogIn, Phone, Mail } from 'lucide-react';
const Login = () => {
    const [isLogin, setIsLogin] = useState(true);
    
    // Form fields
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    
    // Extra Register fields
    const [nombre, setNombre] = useState('');
    const [apellidos, setApellidos] = useState('');
    const [telefono, setTelefono] = useState('');
    const [fechaNacimiento, setFechaNacimiento] = useState('');
    const [ciudad, setCiudad] = useState('');
    const [provincia, setProvincia] = useState('');
    const [genero, setGenero] = useState('');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showTerms, setShowTerms] = useState(false);
    const [showHelp, setShowHelp] = useState(false);
    const navigate = useNavigate();
    const { currentUser } = useAuth();

    useEffect(() => {
        if (currentUser) {
            navigate('/dashboard');
        }
    }, [currentUser, navigate]);

    if (currentUser) {
        return (
            <div className="min-h-screen bg-[#111111] flex items-center justify-center">
                <Loader2 className="animate-spin text-[#E13038]" size={40} />
            </div>
        );
    }

    const handleEmailAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!isLogin && password !== confirmPassword) {
            setError('Las contraseñas no coinciden. Inténtalo de nuevo.');
            return;
        }

        if (!isLogin && !genero) {
            setError('Por favor, selecciona tu género (Hombre o Mujer).');
            return;
        }

        setLoading(true);
        setError('');
        try {
            if (isLogin) {
                await signInWithEmailAndPassword(auth, email, password);
            } else {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                
                // Save extended profile data
                await setDoc(doc(db, 'users', userCredential.user.uid), {
                    nombre,
                    apellidos,
                    displayName: `${nombre} ${apellidos}`.trim() || 'Socio',
                    telefono,
                    fechaNacimiento,
                    ciudad,
                    provincia,
                    genero,
                    email,
                    role: 'user',
                    workspace: 'None',
                    credits: 0,
                    createdAt: new Date().toISOString()
                }, { merge: true });
            }
            navigate('/dashboard');
        } catch (err: any) {
            setError(err.message || 'Error en la autenticación');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleAuth = async () => {
        setLoading(true);
        setError('');
        try {
            const provider = new GoogleAuthProvider();
            await signInWithPopup(auth, provider);
            navigate('/dashboard');
        } catch (err: any) {
            setError(err.message || 'Error con Google Auth');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#111111] text-white flex flex-col items-center justify-between p-6 font-sans selection:bg-[#E13038] selection:text-white pb-8">
            
            {/* Modal de Términos */}
            {showTerms && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="w-full max-w-2xl flex flex-col rounded-[2.5rem] shadow-2xl animate-in zoom-in duration-300 overflow-hidden bg-[#2A2D3A] border border-white/10 text-white">
                        <div className="p-8 border-b border-white/5 flex justify-between items-center">
                            <h3 className="text-xl font-black uppercase italic tracking-tight">Términos y <span className="text-[#E13038]">Condiciones</span></h3>
                            <button onClick={() => setShowTerms(false)} className="text-gray-500 hover:text-[#E13038] transition-colors">
                                <LogIn size={20} className="rotate-45" />
                            </button>
                        </div>
                        <div className="p-8 overflow-y-auto max-h-[60vh] text-sm space-y-6 leading-relaxed opacity-90 scrollbar-hide pr-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                            <section>
                                <h4 className="font-black text-[#E13038] uppercase mb-2">1) Responsable del tratamiento</h4>
                                <p><strong>Responsable:</strong> Jesús Almodóvar<br />
                                    <strong>Domicilio:</strong> Av. dels Rabassaires, 30 – 2ª planta, 08100 Mollet del Vallès (Barcelona)<br />
                                    <strong>Web:</strong> www.almodovargroup.es<br />
                                    <strong>Correo:</strong> almodovarbox@gmail.com<br />
                                    <strong>Teléfono:</strong> 662 086 632</p>
                                <p className="mt-2 text-xs">“Almodóvar Group” hace referencia al conjunto de servicios ofrecidos bajo las líneas Almodóvar Fit y Almodóvar Box.</p>
                            </section>

                            <section>
                                <h4 className="font-black text-[#E13038] uppercase mb-2">2) Finalidad y Conservación</h4>
                                <p>Gestión integral de la relación con clientes (altas, reservas, facturación, atención al cliente, comunicaciones). No se toman decisiones automatizadas. Los datos se conservarán mientras exista relación comercial y por los plazos legales establecidos.</p>
                            </section>

                            <section>
                                <h4 className="font-black text-[#E13038] uppercase mb-2">3) Destinatarios y Derechos</h4>
                                <p>No se realizan cesiones no necesarias para el servicio, salvo obligaciones legales. Puede ejercer sus derechos de acceso, rectificación, supresión y otros en almodovarbox@gmail.com.</p>
                            </section>

                            <section>
                                <h4 className="font-black text-[#E13038] uppercase mb-2">4) Uso de la APP</h4>
                                <p>El acceso implica la aceptación de estas condiciones. Usuario declara ser mayor de 18 años o estar bajo supervisión legal. Debe custodiar su contraseña.</p>
                            </section>

                            <section>
                                <h4 className="font-black text-[#E13038] uppercase mb-2">5) Condiciones Comerciales</h4>
                                <ul className="list-disc pl-5 space-y-1">
                                    <li><strong>Almodóvar Box:</strong> 2 ses/sem (105€/mes), 3 ses/sem (159,90€/mes). Matrícula 59,90€.</li>
                                    <li><strong>Almodóvar Fit:</strong> 2 ses/sem (54,90€/mes), 3 ses/sem (74,90€/mes). Matrícula 59,90€.</li>
                                </ul>
                                <p className="mt-2 text-xs font-bold text-yellow-500">Importante: Suscripción mensual no acumulable. Bajas requieren 3 meses de espera o matrícula de 150€ para re-alta.</p>
                            </section>

                            <section>
                                <h4 className="font-black text-[#E13038] uppercase mb-2">6) Normas de Instalaciones</h4>
                                <p>Uso respetuoso, limpieza del material, toalla y calzado adecuado obligatorio. Prohibido fumar o sustancias. Conductas agresivas implican expulsión inmediata.</p>
                            </section>
                        </div>
                        <div className="p-6 bg-black/10 flex justify-center w-full">
                            <button onClick={() => setShowTerms(false)} className="w-full bg-[#E13038] py-4 rounded-2xl text-white font-black uppercase tracking-widest shadow-[0_10px_30px_rgba(225,48,56,0.3)] hover:shadow-[0_10px_40px_rgba(225,48,56,0.5)] active:scale-95 transition-all">Aceptar y Continuar</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Ayuda / FAQ */}
            {showHelp && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="w-full max-w-lg flex flex-col rounded-[2.5rem] shadow-2xl animate-in zoom-in duration-300 overflow-hidden bg-[#2A2D3A] border border-white/10 text-white">
                        {/* Header Ayuda */}
                        <div className="p-8 border-b border-white/5 bg-[#E13038]/5 flex justify-between items-center shrink-0">
                            <div>
                                <h3 className="text-xl font-black uppercase italic tracking-tight">Preguntas <span className="text-[#E13038]">Frecuentes</span></h3>
                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Centro de ayuda Almodóvar Group</p>
                            </div>
                            <button onClick={() => setShowHelp(false)} className="text-gray-500 hover:text-[#E13038] transition-colors">
                                <LogIn size={20} className="rotate-45" />
                            </button>
                        </div>

                        {/* Contenido Ayuda */}
                        <div className="p-8 overflow-y-auto max-h-[60vh] space-y-6 scrollbar-hide pr-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                            {/* FAQs */}
                            <div className="space-y-4">
                                <div className="p-4 rounded-2xl border bg-[#1A1A1A] border-white/5">
                                    <h4 className="font-black text-xs uppercase text-[#E13038] mb-2 tracking-tight">¿Cómo reservo una clase?</h4>
                                    <p className="text-xs leading-relaxed opacity-70 font-medium">Una vez autorizado tu perfil por el administrador, podrás ver el calendario y reservar tu plaza en el menú de "WOD / Reservas".</p>
                                </div>
                                <div className="p-4 rounded-2xl border bg-[#1A1A1A] border-white/5">
                                    <h4 className="font-black text-xs uppercase text-[#E13038] mb-2 tracking-tight">¿Mi perfil no ha sido autorizado?</h4>
                                    <p className="text-xs leading-relaxed opacity-70 font-medium">La validación suele realizarse en un plazo de 24 horas. Si pasado este tiempo sigues sin acceso, por favor comunícate mediante teléfono o WhatsApp.</p>
                                </div>
                                <div className="p-4 rounded-2xl border bg-[#1A1A1A] border-white/5">
                                    <h4 className="font-black text-xs uppercase text-[#E13038] mb-2 tracking-tight">¿Cómo cambio mi contraseña?</h4>
                                    <p className="text-xs leading-relaxed opacity-70 font-medium">Puedes solicitar un enlace de recuperación en la pantalla de inicio o cambiarla desde tu "Perfil" una vez dentro de la APP.</p>
                                </div>
                            </div>

                            {/* Soporte Directo */}
                            <div>
                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-4 text-center">Soporte Directo</h4>
                                <div className="grid grid-cols-2 gap-3 mb-6">
                                    <a href="https://wa.me/34662086632" target="_blank" rel="noreferrer" className="flex flex-col items-center gap-3 p-4 rounded-2xl border transition-all bg-[#1A1A1A] border-white/5 hover:border-green-500/50 group">
                                        <div className="w-10 h-10 bg-[#111111] group-hover:bg-green-500 rounded-xl flex items-center justify-center text-green-500 group-hover:text-white transition-all shadow-lg"><Phone size={18} /></div>
                                        <div className="text-center">
                                            <p className="text-[9px] font-black uppercase tracking-widest opacity-40 mb-0.5">WhatsApp</p>
                                            <p className="font-bold text-xs italic">662 086 632</p>
                                        </div>
                                    </a>
                                    <a href="mailto:almodovarbox@gmail.com" className="flex flex-col items-center gap-3 p-4 rounded-2xl border transition-all bg-[#1A1A1A] border-white/5 hover:border-[#E13038]/50 group">
                                        <div className="w-10 h-10 bg-[#111111] group-hover:bg-[#E13038] rounded-xl flex items-center justify-center text-[#E13038] group-hover:text-white transition-all shadow-lg"><Mail size={18} /></div>
                                        <div className="text-center">
                                            <p className="text-[9px] font-black uppercase tracking-widest opacity-40 mb-0.5">Email</p>
                                            <p className="font-bold text-xs italic">Soporte App</p>
                                        </div>
                                    </a>
                                </div>
                                <div className="p-4 rounded-2xl text-center border border-dashed border-white/10">
                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest leading-relaxed">
                                        Horario de atención:<br />
                                        <span className="text-white">Lunes a Viernes de 09:00 a 21:00</span>
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 bg-black/10 shrink-0">
                            <button onClick={() => setShowHelp(false)} className="w-full py-4 rounded-2xl font-black uppercase tracking-widest transition-all shadow-[0_10px_30px_rgba(225,48,56,0.3)] hover:shadow-[0_10px_40px_rgba(225,48,56,0.5)] active:scale-95 bg-[#E13038] hover:bg-[#D41C2B] text-white">Cerrar Centro de Ayuda</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="w-full max-w-sm flex-1 flex flex-col justify-center">
                
                {/* Logo Central */}
                <div className="flex justify-center mb-6">
                    <img
                        src="/logo.jpeg"
                        alt="Almodovar Group Logo"
                        className="w-32 h-32 md:w-40 md:h-40 object-contain rounded-full border-4 border-[#333333] shadow-[0_0_30px_rgba(225,48,56,0.15)]"
                    />
                </div>

                <h1 className="text-3xl md:text-4xl font-black uppercase tracking-widest text-[#E13038] text-center mb-8 drop-shadow-md">
                    ¡BIENVENIDO/A!
                </h1>

                {error && (
                    <div className="w-full bg-[#E13038]/10 border border-[#E13038]/50 text-[#DDABA5] p-3 rounded-lg mb-6 text-xs text-center font-medium">
                        {error}
                    </div>
                )}

                <form onSubmit={handleEmailAuth} className="w-full space-y-4">
                    {/* Campos Extendidos (Solo en Registro) */}
                    {!isLogin && (
                        <>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#DDABA5] ml-1">NOMBRE</label>
                                    <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} required className="w-full bg-[#1A1A1A] border border-[#333] text-gray-200 p-3 rounded-md focus:outline-none focus:border-[#E13038] focus:ring-1 focus:ring-[#E13038] transition-all text-sm font-medium" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#DDABA5] ml-1">APELLIDOS</label>
                                    <input type="text" value={apellidos} onChange={(e) => setApellidos(e.target.value)} required className="w-full bg-[#1A1A1A] border border-[#333] text-gray-200 p-3 rounded-md focus:outline-none focus:border-[#E13038] focus:ring-1 focus:ring-[#E13038] transition-all text-sm font-medium" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#DDABA5] ml-1">TELÉFONO</label>
                                    <input type="tel" value={telefono} onChange={(e) => setTelefono(e.target.value)} required className="w-full bg-[#1A1A1A] border border-[#333] text-gray-200 p-3 rounded-md focus:outline-none focus:border-[#E13038] focus:ring-1 focus:ring-[#E13038] transition-all text-sm font-medium" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#DDABA5] ml-1">F. NACIMIENTO</label>
                                    <input type="date" value={fechaNacimiento} onChange={(e) => setFechaNacimiento(e.target.value)} required className="w-full bg-[#1A1A1A] border border-[#333] text-gray-200 p-3 rounded-md focus:outline-none focus:border-[#E13038] focus:ring-1 focus:ring-[#E13038] transition-all text-sm font-medium [color-scheme:dark]" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#DDABA5] ml-1">CIUDAD</label>
                                    <input type="text" value={ciudad} onChange={(e) => setCiudad(e.target.value)} required className="w-full bg-[#1A1A1A] border border-[#333] text-gray-200 p-3 rounded-md focus:outline-none focus:border-[#E13038] focus:ring-1 focus:ring-[#E13038] transition-all text-sm font-medium" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#DDABA5] ml-1">PROVINCIA</label>
                                    <input type="text" value={provincia} onChange={(e) => setProvincia(e.target.value)} required className="w-full bg-[#1A1A1A] border border-[#333] text-gray-200 p-3 rounded-md focus:outline-none focus:border-[#E13038] focus:ring-1 focus:ring-[#E13038] transition-all text-sm font-medium" />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-[#DDABA5] ml-1">GÉNERO</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button 
                                        type="button"
                                        onClick={() => setGenero('HOMBRE')}
                                        className={`w-full p-3 rounded-md border text-sm font-bold transition-all uppercase ${genero === 'HOMBRE' ? 'bg-[#E13038] text-white border-[#E13038]' : 'bg-[#1A1A1A] text-gray-400 border-[#333] hover:border-[#666]'}`}
                                    >
                                        HOMBRE
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={() => setGenero('MUJER')}
                                        className={`w-full p-3 rounded-md border text-sm font-bold transition-all uppercase ${genero === 'MUJER' ? 'bg-[#E13038] text-white border-[#E13038]' : 'bg-[#1A1A1A] text-gray-400 border-[#333] hover:border-[#666]'}`}
                                    >
                                        MUJER
                                    </button>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Input Email */}
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-[#DDABA5] ml-1">
                            IDENTIDAD / EMAIL
                        </label>
                        <input 
                            type="email" 
                            placeholder="user@kinetic.fit"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full bg-[#1A1A1A] border border-[#333333] text-gray-200 p-3 rounded-md focus:outline-none focus:border-[#E13038] focus:ring-1 focus:ring-[#E13038] transition-all placeholder-[#444444] font-medium text-sm"
                        />
                    </div>
                    
                    {/* Input Password */}
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-[#DDABA5] ml-1">
                            SEGURIDAD / CONTRASEÑA
                        </label>
                        <input 
                            type="password" 
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full bg-[#1A1A1A] border border-[#333333] text-gray-200 p-3 rounded-md focus:outline-none focus:border-[#E13038] focus:ring-1 focus:ring-[#E13038] transition-all placeholder-[#444444] tracking-[0.2em] font-medium text-sm"
                        />
                    </div>
                    
                    {/* Input Confirm Password (Solo en Registro) */}
                    {!isLogin && (
                        <>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-[#DDABA5] ml-1">
                                    CONFIRMAR CONTRASEÑA
                                </label>
                                <input 
                                    type="password" 
                                    placeholder="••••••••"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    className="w-full bg-[#1A1A1A] border border-[#333333] text-gray-200 p-3 rounded-md focus:outline-none focus:border-[#E13038] focus:ring-1 focus:ring-[#E13038] transition-all placeholder-[#444444] tracking-[0.2em] font-medium text-sm"
                                />
                            </div>

                            <div className="flex items-start gap-3 py-2 px-1 mt-2">
                                <input type="checkbox" required className="w-4 h-4 accent-[#E13038] mt-0.5" />
                                <p className="text-[10px] font-medium leading-tight text-gray-400">
                                    Acepto los <button type="button" onClick={() => setShowTerms(true)} className="text-[#DDABA5] hover:text-white font-bold transition-colors">términos y condiciones</button> y la política de privacidad de Almodóvar Group.
                                </p>
                            </div>
                        </>
                    )}

                    {/* Botón Principal */}
                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-[#FF5362] to-[#D41C2B] text-black p-4 rounded-xl font-black text-lg uppercase tracking-wider shadow-[0_10px_30px_rgba(225,48,56,0.4)] hover:shadow-[0_10px_40px_rgba(225,48,56,0.6)] hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 mt-8 disabled:opacity-50 disabled:transform-none"
                    >
                        {loading ? <Loader2 className="w-6 h-6 animate-spin text-black/80" /> : null}
                        {isLogin ? 'INICIAR SESIÓN' : 'REGISTRARSE'}
                        {!loading && <ArrowRight className="w-6 h-6 stroke-[3px]" />}
                    </button>
                    
                    {/* Social Logins - Blancos con branding oficial */}
                    {isLogin && (
                        <div className="pt-2 transition-opacity">
                            <button type="button" onClick={handleGoogleAuth} className="w-full text-[12px] font-black tracking-wider bg-white rounded-lg p-3 hover:bg-gray-200 transition-all flex justify-center items-center gap-2 shadow-[0_4px_10px_rgba(0,0,0,0.5)]">
                                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                                <span className="text-[#4285F4]">GOOGLE</span>
                            </button>
                        </div>
                    )}
                </form>

                {/* Footer del Formulario */}
                <div className="flex justify-between items-center w-full mt-8 px-1">
                    <button 
                        type="button"
                        onClick={() => navigate('/forgot-password')}
                        className="text-[11px] font-medium text-[#DDABA5] hover:text-white transition-colors"
                    >
                        ¿OLVIDASTE TU ACCESO?
                    </button>
                    <button 
                        onClick={() => { setIsLogin(!isLogin); setError(''); setConfirmPassword(''); }}
                        className="text-[11px] font-bold text-[#DDABA5] hover:text-white transition-colors uppercase tracking-wider"
                    >
                        {isLogin ? 'CREAR CUENTA' : 'INICIAR SESIÓN'}
                    </button>
                </div>
            </div>

            {/* Bottom Branding & Legal */}
            <div className="w-full max-w-sm mt-8 pt-8 pb-2">
                <div className="flex flex-col items-center justify-center gap-4 w-full px-1">
                    <div className="flex items-center justify-center gap-6">
                        <button 
                            onClick={() => setShowTerms(true)}
                            className="text-[10px] font-black uppercase tracking-[0.2em] text-[#A69795] hover:text-white transition-colors"
                        >
                            Términos y Condiciones
                        </button>
                        <div className="w-1 h-1 bg-[#A69795]/30 rounded-full"></div>
                        <button 
                            onClick={() => setShowHelp(true)}
                            className="text-[10px] font-black uppercase tracking-[0.2em] text-[#A69795] hover:text-white transition-colors"
                        >
                            Ayuda
                        </button>
                    </div>
                    <span className="text-[10px] font-bold text-[#333333] uppercase tracking-wider">
                        © ALMODÓVAR GROUP 2026
                    </span>
                </div>
            </div>

        </div>
    );
};

export default Login;
