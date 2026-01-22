import { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, UserPlus, LogIn, Sun, Moon, Loader2, Phone, Calendar } from 'lucide-react';
import { auth, db } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

interface LoginProps {
    onLogin: () => void;
}

const Login = ({ onLogin }: LoginProps) => {
    const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
    const [showPassword, setShowPassword] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(() => document.documentElement.classList.contains('dark'));
    const [showTerms, setShowTerms] = useState(false);
    const [showHelp, setShowHelp] = useState(false);

    // Auth State
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [lastName, setLastName] = useState('');
    const [phone, setPhone] = useState('');
    const [birthDate, setBirthDate] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const toggleTheme = () => {
        const newMode = !isDarkMode;
        setIsDarkMode(newMode);
        if (newMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    };

    const handleAuth = async () => {
        if (!email || !password) {
            setError('Por favor, rellena todos los campos.');
            return;
        }

        setError(null);
        setIsLoading(true);

        try {
            if (activeTab === 'login') {
                await signInWithEmailAndPassword(auth, email, password);
                onLogin();
            } else {
                if (!name || !lastName) {
                    setError('Nombre y apellidos son obligatorios.');
                    setIsLoading(false);
                    return;
                }

                const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
                const user = userCredential.user;

                // Bootstrap Admin Logic
                const isBootstrapAdmin = email.toLowerCase() === 'admin@almodovar.com';

                // Create Firestore Document
                await setDoc(doc(db, 'users', user.uid), {
                    uid: user.uid,
                    name: `${name} ${lastName}`,
                    email: email.toLowerCase(),
                    phone: phone,
                    birthDate: birthDate,
                    role: isBootstrapAdmin ? 'admin' : 'client',
                    status: isBootstrapAdmin ? 'active' : 'pending',
                    isApproved: isBootstrapAdmin,
                    plan: null,
                    credits: 2,
                    planCredits: 2,
                    group: null,
                    createdAt: serverTimestamp()
                });

                await updateProfile(user, {
                    displayName: `${name} ${lastName}`
                });

                onLogin();
            }
        } catch (err: any) {
            console.error(err);
            let msg = 'Error de autenticación.';
            if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
                msg = 'Usuario o contraseña incorrectos.';
            } else if (err.code === 'auth/email-already-in-use') {
                msg = 'Este correo ya está registrado.';
            } else if (err.code === 'auth/weak-password') {
                msg = 'La contraseña debe tener al menos 6 caracteres.';
            } else if (err.code === 'auth/invalid-email') {
                msg = 'El formato del email no es válido.';
            }
            setError(msg);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={`min-h-screen flex flex-col items-center justify-center p-6 transition-colors duration-500 ${isDarkMode ? 'bg-[#1F2128]' : 'bg-gray-50'}`}>

            {/* Modal de Términos */}
            {showTerms && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
                    <div className={`w-full max-w-2xl flex flex-col rounded-[2.5rem] shadow-2xl animate-in zoom-in duration-300 overflow-hidden ${isDarkMode ? 'bg-[#2A2D3A] border border-white/10 text-white' : 'bg-white border border-gray-100 text-gray-900'}`}>
                        <div className="p-8 border-b border-white/5 flex justify-between items-center">
                            <h3 className="text-xl font-black uppercase italic tracking-tight">Términos y <span className="text-[#FF1F40]">Condiciones</span></h3>
                            <button onClick={() => setShowTerms(false)} className="text-gray-500 hover:text-[#FF1F40] transition-colors">
                                <LogIn size={20} className="rotate-45" />
                            </button>
                        </div>
                        <div className="p-8 overflow-y-auto max-h-[60vh] custom-scrollbar text-sm space-y-6 leading-relaxed opacity-90">
                            <section>
                                <h4 className="font-black text-[#FF1F40] uppercase mb-2">1) Responsable del tratamiento</h4>
                                <p><strong>Responsable:</strong> Jesús Almodóvar<br />
                                    <strong>Domicilio:</strong> Av. dels Rabassaires, 30 – 2ª planta, 08100 Mollet del Vallès (Barcelona)<br />
                                    <strong>Web:</strong> www.almodovargroup.es<br />
                                    <strong>Correo:</strong> almodovarbox@gmail.com<br />
                                    <strong>Teléfono:</strong> 662 086 632</p>
                                <p className="mt-2 text-xs">“Almodóvar Group” hace referencia al conjunto de servicios ofrecidos bajo las líneas Almodóvar Fit y Almodóvar Box.</p>
                            </section>

                            <section>
                                <h4 className="font-black text-[#FF1F40] uppercase mb-2">2) Finalidad y Conservación</h4>
                                <p>Gestión integral de la relación con clientes (altas, reservas, facturación, atención al cliente, comunicaciones). No se toman decisiones automatizadas. Los datos se conservarán mientras exista relación comercial y por los plazos legales establecidos.</p>
                            </section>

                            <section>
                                <h4 className="font-black text-[#FF1F40] uppercase mb-2">3) Destinatarios y Derechos</h4>
                                <p>No se realizan cesiones no necesarias para el servicio, salvo obligaciones legales. Puede ejercer sus derechos de acceso, rectificación, supresión y otros en almodovarbox@gmail.com.</p>
                            </section>

                            <section>
                                <h4 className="font-black text-[#FF1F40] uppercase mb-2">4) Uso de la APP</h4>
                                <p>El acceso implica la aceptación de estas condiciones. Usuario declara ser mayor de 18 años o estar bajo supervisión legal. Debe custodiar su contraseña.</p>
                            </section>

                            <section>
                                <h4 className="font-black text-[#FF1F40] uppercase mb-2">5) Condiciones Comerciales</h4>
                                <ul className="list-disc pl-5 space-y-1">
                                    <li><strong>Almodóvar Box:</strong> 2 ses/sem (105€/mes), 3 ses/sem (159,90€/mes). Matrícula 59,90€.</li>
                                    <li><strong>Almodóvar Fit:</strong> 2 ses/sem (54,90€/mes), 3 ses/sem (74,90€/mes). Matrícula 59,90€.</li>
                                </ul>
                                <p className={`mt-2 text-xs font-bold ${isDarkMode ? 'text-yellow-500' : 'text-red-600'}`}>Importante: Suscripción mensual no acumulable. Bajas requieren 3 meses de espera o matrícula de 150€ para re-alta.</p>
                            </section>

                            <section>
                                <h4 className="font-black text-[#FF1F40] uppercase mb-2">6) Normas de Instalaciones</h4>
                                <p>Uso respetuoso, limpieza del material, toalla y calzado adecuado obligatorio. Prohibido fumar o sustancias. Conductas agresivas implican expulsión inmediata.</p>
                            </section>
                        </div>
                        <div className="p-6 bg-black/10">
                            <button onClick={() => setShowTerms(false)} className="w-full bg-[#FF1F40] py-4 rounded-2xl text-white font-black uppercase tracking-widest shadow-xl shadow-red-900/20 active:scale-95 transition-all">Aceptar y Continuar</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Ayuda / FAQ */}
            {showHelp && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
                    <div className={`w-full max-w-lg flex flex-col rounded-[2.5rem] shadow-2xl animate-in zoom-in duration-300 overflow-hidden ${isDarkMode ? 'bg-[#2A2D3A] border border-white/10 text-white' : 'bg-white border border-gray-100 text-gray-900'}`}>
                        {/* Header Ayuda */}
                        <div className="p-8 border-b border-white/5 bg-[#FF1F40]/5 flex justify-between items-center shrink-0">
                            <div>
                                <h3 className="text-xl font-black uppercase italic tracking-tight">Preguntas <span className="text-[#FF1F40]">Frecuentes</span></h3>
                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Centro de ayuda Almodóvar Group</p>
                            </div>
                            <button onClick={() => setShowHelp(false)} className="text-gray-500 hover:text-[#FF1F40] transition-colors">
                                <LogIn size={20} className="rotate-45" />
                            </button>
                        </div>

                        {/* Contenido Ayuda */}
                        <div className="p-8 overflow-y-auto max-h-[60vh] custom-scrollbar space-y-6">
                            {/* FAQs */}
                            <div className="space-y-4">
                                <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-[#1F2128] border-white/5' : 'bg-gray-50 border-gray-100'}`}>
                                    <h4 className="font-black text-xs uppercase text-[#FF1F40] mb-2 tracking-tight">¿Cómo reservo una clase?</h4>
                                    <p className="text-xs leading-relaxed opacity-70 font-medium">Una vez autorizado tu perfil por el administrador, podrás ver el calendario y reservar tu plaza en el menú de "WOD / Reservas".</p>
                                </div>
                                <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-[#1F2128] border-white/5' : 'bg-gray-50 border-gray-100'}`}>
                                    <h4 className="font-black text-xs uppercase text-[#FF1F40] mb-2 tracking-tight">¿Mi perfil no ha sido autorizado?</h4>
                                    <p className="text-xs leading-relaxed opacity-70 font-medium">La validación suele realizarse en un plazo de 24 horas. Si pasado este tiempo sigues sin acceso, por favor comunícate mediante teléfono o WhatsApp.</p>
                                </div>
                                <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-[#1F2128] border-white/5' : 'bg-gray-50 border-gray-100'}`}>
                                    <h4 className="font-black text-xs uppercase text-[#FF1F40] mb-2 tracking-tight">¿Cómo cambio mi contraseña?</h4>
                                    <p className="text-xs leading-relaxed opacity-70 font-medium">Puedes solicitar un enlace de recuperación en la pantalla de inicio o cambiarla desde tu "Perfil" una vez dentro de la APP.</p>
                                </div>
                            </div>

                            {/* Soporte Directo */}
                            <div>
                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-4 text-center">Soporte Directo</h4>
                                <div className="grid grid-cols-2 gap-3 mb-6">
                                    <a href="https://wa.me/34662086632" target="_blank" rel="noreferrer" className={`flex flex-col items-center gap-3 p-4 rounded-2xl border transition-all ${isDarkMode ? 'bg-[#1F2128] border-white/5 hover:border-green-500/50' : 'bg-gray-50 border-gray-100 hover:border-green-500/30'}`}>
                                        <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-green-900/20"><Phone size={18} /></div>
                                        <div className="text-center">
                                            <p className="text-[9px] font-black uppercase tracking-widest opacity-40 mb-0.5">WhatsApp</p>
                                            <p className="font-bold text-xs italic">662 086 632</p>
                                        </div>
                                    </a>
                                    <a href="mailto:almodovarbox@gmail.com" className={`flex flex-col items-center gap-3 p-4 rounded-2xl border transition-all ${isDarkMode ? 'bg-[#1F2128] border-white/5 hover:border-[#FF1F40]/50' : 'bg-gray-50 border-gray-100 hover:border-[#FF1F40]/30'}`}>
                                        <div className="w-10 h-10 bg-[#FF1F40] rounded-xl flex items-center justify-center text-white shadow-lg shadow-red-900/20"><Mail size={18} /></div>
                                        <div className="text-center">
                                            <p className="text-[9px] font-black uppercase tracking-widest opacity-40 mb-0.5">Email</p>
                                            <p className="font-bold text-xs italic">Soporte App</p>
                                        </div>
                                    </a>
                                </div>
                                <div className={`p-4 rounded-2xl text-center border border-dashed ${isDarkMode ? 'border-white/10' : 'border-gray-200'}`}>
                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest leading-relaxed">
                                        Horario de atención:<br />
                                        <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>Lunes a Viernes de 09:00 a 21:00</span>
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 bg-black/10 shrink-0">
                            <button onClick={() => setShowHelp(false)} className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest transition-all active:scale-95 ${isDarkMode ? 'bg-white/5 hover:bg-white/10 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-900'}`}>Cerrar Centro de Ayuda</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Theme Toggle */}
            <div className="absolute top-6 right-6">
                <button
                    onClick={toggleTheme}
                    className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm transition-colors ${isDarkMode ? 'bg-[#2A2D3A] text-white' : 'bg-white text-gray-600'}`}
                >
                    {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                </button>
            </div>

            {/* Brand Header */}
            <div className="flex flex-col items-center mb-10 text-center animate-in fade-in zoom-in duration-700">
                <div className="relative w-32 h-32 bg-white rounded-full flex items-center justify-center border-2 border-[#FF1F40]/50 shadow-[0_0_50px_rgba(255,31,64,0.3)] overflow-hidden mb-6">
                    <img src="/logo.png" alt="Almodovar Group Logo" className="w-full h-full object-cover scale-[1.02]" />
                </div>
                <h1 className={`text-3xl font-black tracking-tighter uppercase italic ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Almodovar <span className="text-[#FF1F40]">Group</span>
                </h1>
                <p className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.3em] mt-2 opacity-80">
                    Transforma tu vida
                </p>
            </div>

            {/* Login/Register Card */}
            <div className={`w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl animate-in slide-in-from-bottom duration-700 delay-150 ${isDarkMode ? 'bg-[#2A2D3A] border border-white/5' : 'bg-white border border-gray-100'}`}>

                {/* Tabs */}
                <div className={`flex p-1.5 rounded-2xl mb-8 ${isDarkMode ? 'bg-[#1F2128]' : 'bg-gray-100'}`}>
                    <button
                        onClick={() => setActiveTab('login')}
                        className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-sm transition-all ${activeTab === 'login'
                            ? 'bg-[#FF1F40] text-white shadow-lg'
                            : 'text-gray-500 hover:text-gray-300'
                            }`}
                    >
                        <LogIn size={18} />
                        Acceder
                    </button>
                    <button
                        onClick={() => setActiveTab('register')}
                        className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-sm transition-all ${activeTab === 'register'
                            ? 'bg-[#FF1F40] text-white shadow-lg'
                            : 'text-gray-500 hover:text-gray-300'
                            }`}
                    >
                        <UserPlus size={18} />
                        Unirse
                    </button>
                </div>

                {/* Form Container */}
                <div className="space-y-6 max-h-[60vh] overflow-y-auto scrollbar-hide pr-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-center gap-3 animate-in slide-in-from-top">
                            <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center text-white shrink-0 font-bold text-[10px]">!</div>
                            <p className="text-red-500 text-xs font-bold leading-tight">{error}</p>
                        </div>
                    )}

                    {activeTab === 'login' ? (
                        <div className="space-y-4">
                            {/* Login Fields */}
                            <div className="relative group">
                                <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${isDarkMode ? 'text-gray-500 group-focus-within:text-[#FF1F40]' : 'text-gray-400'}`}>
                                    <Mail size={18} />
                                </div>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Email"
                                    className={`w-full py-4 pl-12 pr-4 rounded-2xl font-medium outline-none transition-all border-2 ${isDarkMode
                                        ? 'bg-[#1F2128] border-transparent focus:border-[#FF1F40]/50 text-white'
                                        : 'bg-gray-100 border-transparent focus:border-[#FF1F40]/30 text-gray-900'
                                        }`}
                                />
                            </div>

                            <div className="relative group">
                                <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${isDarkMode ? 'text-gray-500 group-focus-within:text-[#FF1F40]' : 'text-gray-400'}`}>
                                    <Lock size={18} />
                                </div>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Password"
                                    className={`w-full py-4 pl-12 pr-12 rounded-2xl font-medium outline-none transition-all border-2 ${isDarkMode
                                        ? 'bg-[#1F2128] border-transparent focus:border-[#FF1F40]/50 text-white'
                                        : 'bg-gray-100 border-transparent focus:border-[#FF1F40]/30 text-gray-900'
                                        }`}
                                />
                                <button
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#FF1F40] transition-colors"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4 animate-in fade-in duration-500">
                            {/* Registration Fields */}
                            <div className="grid grid-cols-2 gap-3">
                                <input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Nombre"
                                    className={`w-full py-4 px-4 rounded-2xl text-sm font-medium outline-none border-2 ${isDarkMode ? 'bg-[#1F2128] border-transparent focus:border-[#FF1F40]/50 text-white' : 'bg-gray-100 border-transparent focus:border-[#FF1F40]/30 text-gray-900'}`}
                                />
                                <input
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    placeholder="Apellidos"
                                    className={`w-full py-4 px-4 rounded-2xl text-sm font-medium outline-none border-2 ${isDarkMode ? 'bg-[#1F2128] border-transparent focus:border-[#FF1F40]/50 text-white' : 'bg-gray-100 border-transparent focus:border-[#FF1F40]/30 text-gray-900'}`}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="relative group">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#FF1F40]" size={16} />
                                    <input
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        placeholder="Teléfono"
                                        className={`w-full py-4 pl-10 pr-4 rounded-2xl text-sm font-medium outline-none border-2 ${isDarkMode ? 'bg-[#1F2128] border-transparent focus:border-[#FF1F40]/50 text-white' : 'bg-gray-100 border-transparent focus:border-[#FF1F40]/30 text-gray-900'}`}
                                    />
                                </div>
                                <div className="relative group">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#FF1F40]" size={16} />
                                    <input
                                        type="date"
                                        value={birthDate}
                                        onChange={(e) => setBirthDate(e.target.value)}
                                        className={`w-full py-4 pl-10 pr-4 rounded-2xl text-sm font-medium outline-none border-2 ${isDarkMode ? 'bg-[#1F2128] border-transparent focus:border-[#FF1F40]/50 text-white' : 'bg-gray-100 border-transparent focus:border-[#FF1F40]/30 text-gray-900'}`}
                                    />
                                </div>
                            </div>

                            {/* Email and Password for Register */}
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Email"
                                className={`w-full py-4 px-4 rounded-2xl text-sm font-medium outline-none border-2 ${isDarkMode ? 'bg-[#1F2128] border-transparent focus:border-[#FF1F40]/50 text-white' : 'bg-gray-100 border-transparent focus:border-[#FF1F40]/30 text-gray-900'}`}
                            />

                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Contraseña (mín. 6 car.)"
                                className={`w-full py-4 px-4 rounded-2xl text-sm font-medium outline-none border-2 ${isDarkMode ? 'bg-[#1F2128] border-transparent focus:border-[#FF1F40]/50 text-white' : 'bg-gray-100 border-transparent focus:border-[#FF1F40]/30 text-gray-900'}`}
                            />

                            <div className="flex items-center gap-3 py-2 px-1">
                                <input type="checkbox" className="w-5 h-5 accent-[#FF1F40]" />
                                <p className={`text-[10px] font-medium leading-tight ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                    Acepto los <button onClick={() => setShowTerms(true)} className="text-[#FF1F40] font-bold">términos</button> y la <button className="text-[#FF1F40] font-bold">política de privacidad</button>
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Action Button */}
                <button
                    onClick={handleAuth}
                    disabled={isLoading}
                    className="w-full bg-[#FF1F40] py-5 rounded-2xl text-white font-black uppercase tracking-widest shadow-xl shadow-red-900/20 active:scale-95 transition-all mt-8 flex items-center justify-center gap-2"
                >
                    {isLoading ? <Loader2 className="animate-spin" /> : (activeTab === 'login' ? 'Iniciar Sesión' : 'Registrarse Ahora')}
                </button>

            </div>

            {/* Footer Links */}
            <div className="mt-8 flex items-center justify-center gap-6 animate-in fade-in slide-in-from-bottom duration-1000 delay-500">
                <button
                    onClick={() => setShowTerms(true)}
                    className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 hover:text-[#FF1F40] transition-colors"
                >
                    Términos y Condiciones
                </button>
                <div className="w-1 h-1 bg-gray-500/20 rounded-full"></div>
                <button
                    onClick={() => setShowHelp(true)}
                    className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 hover:text-[#FF1F40] transition-colors"
                >
                    Ayuda
                </button>
            </div>

        </div>
    );
};

export default Login;
