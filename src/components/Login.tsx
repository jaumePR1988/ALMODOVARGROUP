import { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, UserPlus, LogIn, Sun, Moon, Phone, Calendar, MapPin, CheckCircle, User, Chrome } from 'lucide-react';

interface LoginProps {
    onLogin: () => void;
}

const Login = ({ onLogin }: LoginProps) => {
    const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
    const [showPassword, setShowPassword] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(true);
    const [showTerms, setShowTerms] = useState(false);
    const [showHelp, setShowHelp] = useState(false);

    const toggleTheme = () => setIsDarkMode(!isDarkMode);

    return (
        <div className={`min-h-screen flex flex-col items-center justify-center p-6 transition-colors duration-500 ${isDarkMode ? 'bg-[#1F2128]' : 'bg-gray-50'}`}>

            {/* Modal de Términos y Condiciones */}
            {showTerms && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className={`w-full max-w-lg max-h-[80vh] flex flex-col rounded-[2rem] shadow-2xl animate-in zoom-in duration-300 ${isDarkMode ? 'bg-[#2A2D3A] border border-white/10' : 'bg-white border border-gray-100'}`}>
                        <div className="p-8 border-b border-white/5 flex justify-between items-center">
                            <h3 className={`text-xl font-black uppercase tracking-tight italic ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                Términos y <span className="text-[#FF1F40]">Condiciones</span>
                            </h3>
                            <button
                                onClick={() => setShowTerms(false)}
                                className="w-10 h-10 rounded-full bg-red-500/10 text-[#FF1F40] flex items-center justify-center hover:bg-red-500/20 transition-colors"
                            >
                                ✕
                            </button>
                        </div>

                        <div className={`p-8 overflow-y-auto scrollbar-hide text-sm leading-relaxed ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                            <style>{`.scrollbar-hide::-webkit-scrollbar { display: none; }`}</style>
                            <div className="space-y-6">
                                <p className="font-bold text-[#FF1F40]">Almodóvar Group (integrado por Almodóvar Fit y Almodóvar Box)</p>

                                <section>
                                    <h4 className={`font-black uppercase text-xs tracking-widest mb-2 italic ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>1) Información del responsable del tratamiento</h4>
                                    <p>Responsable: Jesús Almodóvar<br />
                                        Domicilio: Av. dels Rabassaires, 30 – 2ª planta, 08100 Mollet del Vallès (Barcelona)<br />
                                        Web: www.almodovargroup.es<br />
                                        Correo de contacto: almodovarbox@gmail.com<br />
                                        Teléfono: 662 086 632</p>
                                    <p className="mt-2 text-xs italic opacity-70">En este documento, “Almodóvar Group” hace referencia al conjunto de servicios ofrecidos bajo las líneas Almodóvar Fit y Almodóvar Box.</p>
                                </section>

                                <section>
                                    <h4 className={`font-black uppercase text-xs tracking-widest mb-2 italic ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>2) Finalidad, legitimación y conservación de los datos</h4>
                                    <p>Finalidad: gestión integral de la relación con clientes y personas interesadas (altas, reservas, facturación, atención al cliente, comunicaciones informativas y operativas). No se toman decisiones automatizadas.</p>
                                    <p className="mt-2 italic">Base jurídica:</p>
                                    <ul className="list-disc pl-4 space-y-1">
                                        <li>Ejecución de contrato/solicitud del cliente (prestación de servicios de salud y bienestar).</li>
                                        <li>Consentimiento expreso del interesado para comunicaciones.</li>
                                    </ul>
                                    <p className="mt-2">Conservación: mientras exista relación comercial y, posteriormente, durante los plazos legalmente establecidos.</p>
                                </section>

                                <section>
                                    <h4 className={`font-black uppercase text-xs tracking-widest mb-2 italic ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>3) Destinatarios y procedencia de los datos</h4>
                                    <p>Cesiones previstas: gestorías, entidades de crédito y organismos públicos cuando resulte necesario para obligaciones contables, fiscales o legales de clientes empresa.</p>
                                    <p className="mt-2">Usuarios de la plataforma/centro: no se realizan cesiones no necesarias para la prestación del servicio.</p>
                                    <p className="mt-2">Procedencia: datos facilitados por el propio interesado.</p>
                                </section>

                                <section>
                                    <h4 className={`font-black uppercase text-xs tracking-widest mb-2 italic ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>4) Derechos de las personas</h4>
                                    <p>Puede ejercer acceso, rectificación, supresión, oposición, limitación y portabilidad, así como retirar el consentimiento, escribiendo a almodovarbox@gmail.com.</p>
                                    <p className="mt-2">Tiene derecho a reclamar ante la autoridad de control competente.</p>
                                </section>

                                <section>
                                    <h4 className={`font-black uppercase text-xs tracking-widest mb-2 italic ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>5) Información sobre el uso de la APP</h4>
                                    <p>El acceso y navegación por la APP Almodóvar Box implican la aceptación de estas condiciones.</p>
                                    <p className={`mt-2 font-bold ${isDarkMode ? 'text-gray-300' : 'text-gray-800'}`}>Requisitos de uso: El usuario declara ser mayor de 18 años o estar supervisado por tutores legales. Deberá custodiar su contraseña y notificar usos no autorizados.</p>
                                </section>

                                <section>
                                    <h4 className={`font-black uppercase text-xs tracking-widest mb-2 italic ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>6) Condiciones comerciales y de suscripción</h4>
                                    <p><span className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Almodóvar Box:</span> Entrenamiento funcional híbrido. 2 sesiones/semana (105€/mes), 3 sesiones/semana (159,90€/mes). Matrícula 59,90€.</p>
                                    <p className="mt-2"><span className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Almodóvar Fit:</span> Sesiones colectivas. 2 sesiones/semana (54,90€/mes), 3 sesiones/semana (74,90€/mes). Matrícula 59,90€.</p>
                                    <p className="mt-2 text-[#FF1F40] font-bold italic underline">Importante: Suscripción mensual no acumulable. Bajas voluntarias requieren 3 meses de espera o matrícula de 150€ para re-alta.</p>
                                </section>

                                <section>
                                    <h4 className={`font-black uppercase text-xs tracking-widest mb-2 italic ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>7) Normas de uso de las instalaciones</h4>
                                    <ul className="list-disc pl-4 space-y-1">
                                        <li>Uso respetuoso y limpieza del material.</li>
                                        <li>Obligatorio toalla, ropa y calzado deportivo adecuado.</li>
                                        <li>Prohibido fumar, alcohol o sustancias estupefacientes.</li>
                                        <li>Conductas agresivas implican expulsión inmediata y baja definitiva.</li>
                                    </ul>
                                </section>

                                <section>
                                    <h4 className={`font-black uppercase text-xs tracking-widest mb-2 italic ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>8) Responsabilidad y garantías – salud</h4>
                                    <p>El usuario es responsable de su estado de salud y del uso adecuado de los servicios. Se recomienda consultar a un especialista en caso de patologías.</p>
                                </section>

                                <section>
                                    <h4 className={`font-black uppercase text-xs tracking-widest mb-2 italic ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>10) Política de cookies (resumen)</h4>
                                    <p>Se emplean cookies técnicas y de terceros para análisis de uso. El usuario puede configurar su navegador para aceptar, rechazar o eliminar cookies.</p>
                                </section>

                                <p className={`text-xs pt-4 border-t italic ${isDarkMode ? 'border-white/5 text-gray-500' : 'border-gray-100 text-gray-400'}`}>Para la resolución de conflictos, las partes se someten a los juzgados y tribunales del domicilio del usuario bajo la ley española.</p>
                            </div>
                        </div>

                        <div className="p-6">
                            <button
                                onClick={() => setShowTerms(false)}
                                className="w-full bg-[#FF1F40] py-4 rounded-2xl text-white font-black uppercase tracking-wider shadow-lg active:scale-95 transition-all"
                            >
                                Entendido
                            </button>
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

            {/* Modal de Centro de Ayuda */}
            {showHelp && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className={`w-full max-w-lg max-h-[85vh] flex flex-col rounded-[2.5rem] shadow-2xl animate-in zoom-in duration-300 ${isDarkMode ? 'bg-[#1a1c22] border border-white/10' : 'bg-white border border-gray-100'}`}>
                        <div className={`p-8 border-b flex justify-between items-center ${isDarkMode ? 'border-white/5' : 'border-gray-100'}`}>
                            <h3 className={`text-1xl font-black uppercase tracking-tight italic ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                Centro de <span className="text-[#FF1F40]">Ayuda</span>
                            </h3>
                            <button
                                onClick={() => setShowHelp(false)}
                                className="w-10 h-10 rounded-full bg-red-500/10 text-[#FF1F40] flex items-center justify-center hover:bg-red-500/20 transition-colors"
                            >
                                ✕
                            </button>
                        </div>

                        <div className={`p-8 overflow-y-auto scrollbar-hide text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                            <div className="space-y-8">
                                <section>
                                    <h4 className="text-[#FF1F40] font-black uppercase text-xs tracking-widest mb-6 italic">Preguntas Frecuentes</h4>

                                    <div className="space-y-6">
                                        <div>
                                            <p className={`font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>¿Cómo reservo una clase?</p>
                                            <p>Una vez autorizado tu perfil por el administrador, podrás ver el calendario y reservar tu plaza en el menú de "WOD / Reservas".</p>
                                        </div>

                                        <div>
                                            <p className={`font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>¿Mi perfil no ha sido autorizado?</p>
                                            <p>La validación suele realizarse en un plazo de 24 horas. Si pasado este tiempo sigues sin acceso, por favor <span className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>comunícate mediante teléfono o WhatsApp.</span></p>
                                        </div>

                                        <div>
                                            <p className={`font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>¿Cómo cambio mi contraseña?</p>
                                            <p>Puedes solicitar un enlace de recuperación en la pantalla de inicio o cambiarla desde tu "Perfil" una vez dentro de la APP.</p>
                                        </div>
                                    </div>
                                </section>

                                <div className={`border-t ${isDarkMode ? 'border-white/5' : 'border-gray-100'}`}></div>

                                <section>
                                    <h4 className="text-[#FF1F40] font-black uppercase text-xs tracking-widest mb-6 italic">Soporte Directo</h4>

                                    <div className="space-y-4">
                                        <div className="flex items-start gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
                                                <Mail className="text-[#FF1F40]" size={20} />
                                            </div>
                                            <div>
                                                <p className={`font-bold text-xs uppercase tracking-wider mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>Teléfono / WhatsApp:</p>
                                                <p className={`text-lg font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>662 086 632</p>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
                                                <Mail className="text-[#FF1F40]" size={20} />
                                            </div>
                                            <div>
                                                <p className={`font-bold text-xs uppercase tracking-wider mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>Email:</p>
                                                <p className={`text-lg font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>almodovarbox@gmail.com</p>
                                            </div>
                                        </div>
                                    </div>

                                    <p className="mt-8 text-xs italic opacity-70 border-t pt-4 border-white/5">Horario de atención: Lunes a Viernes de 09:00 a 21:00.</p>
                                </section>
                            </div>
                        </div>

                        <div className="p-6">
                            <button
                                onClick={() => setShowHelp(false)}
                                className="w-full bg-[#FF1F40] py-4 rounded-2xl text-white font-black uppercase tracking-wider shadow-lg active:scale-95 transition-all"
                            >
                                Cerrar Centro de Ayuda
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Brand Header */}
            <div className="flex flex-col items-center mb-10 text-center animate-in fade-in zoom-in duration-700">
                <div className="relative w-32 h-32 bg-white rounded-full flex items-center justify-center border-2 border-[#FF1F40]/50 shadow-[0_0_50px_rgba(255,31,64,0.3)] overflow-hidden mb-6">
                    <img
                        src="/logo.png"
                        alt="Almodovar Group Logo"
                        className="w-full h-full object-cover scale-[1.02]"
                    />
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
                        Iniciar Sesión
                    </button>
                    <button
                        onClick={() => setActiveTab('register')}
                        className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-sm transition-all ${activeTab === 'register'
                            ? 'bg-[#FF1F40] text-white shadow-lg'
                            : 'text-gray-500 hover:text-gray-300'
                            }`}
                    >
                        <UserPlus size={18} />
                        Registrarse
                    </button>
                </div>

                {/* Form Container */}
                <div className="space-y-6 max-h-[60vh] overflow-y-auto scrollbar-hide pr-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    <style>{`.scrollbar-hide::-webkit-scrollbar { display: none; }`}</style>

                    {activeTab === 'login' ? (
                        <div className="space-y-4">
                            {/* Login Fields */}
                            <div className="relative group">
                                <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${isDarkMode ? 'text-gray-500 group-focus-within:text-[#FF1F40]' : 'text-gray-400'}`}>
                                    <Mail size={18} />
                                </div>
                                <input
                                    type="email"
                                    placeholder="ejemplo@correo.com"
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
                                    placeholder="••••••••"
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

                            <div className="text-right">
                                <button className="text-[11px] font-bold text-[#FF1F40] hover:underline uppercase tracking-tight">
                                    ¿Olvidaste tu contraseña?
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6 animate-in fade-in duration-500">
                            {/* Registration Fields */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Nombre *</label>
                                    <div className="relative group">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#FF1F40]" size={16} />
                                        <input placeholder="Juan" className={`w-full py-4 pl-11 pr-4 rounded-2xl text-sm font-medium outline-none border-2 ${isDarkMode ? 'bg-[#1F2128] border-transparent focus:border-[#FF1F40]/50 text-white' : 'bg-gray-100 border-transparent focus:border-[#FF1F40]/30 text-gray-900'}`} />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Apellidos *</label>
                                    <input placeholder="Pérez" className={`w-full py-4 px-4 rounded-2xl text-sm font-medium outline-none border-2 ${isDarkMode ? 'bg-[#1F2128] border-transparent focus:border-[#FF1F40]/50 text-white' : 'bg-gray-100 border-transparent focus:border-[#FF1F40]/30 text-gray-900'}`} />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Teléfono *</label>
                                    <div className="relative group">
                                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#FF1F40]" size={16} />
                                        <input placeholder="600 000 000" className={`w-full py-4 pl-11 pr-4 rounded-2xl text-sm font-medium outline-none border-2 ${isDarkMode ? 'bg-[#1F2128] border-transparent focus:border-[#FF1F40]/50 text-white' : 'bg-gray-100 border-transparent focus:border-[#FF1F40]/30 text-gray-900'}`} />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>F. Nacimiento</label>
                                    <div className="relative group">
                                        <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#FF1F40] pointer-events-none" size={16} />
                                        <input type="date" className={`w-full py-4 px-4 rounded-2xl text-sm font-medium outline-none border-2 ${isDarkMode ? 'bg-[#1F2128] border-transparent focus:border-[#FF1F40]/50 text-white' : 'bg-gray-100 border-transparent focus:border-[#FF1F40]/30 text-gray-900'}`} />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4 pt-2 border-t border-white/5">
                                <label className={`text-[10px] font-black uppercase tracking-[0.2em] text-[#FF1F40]`}>Dirección Completa *</label>
                                <div className="relative group">
                                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#FF1F40]" size={16} />
                                    <input placeholder="Calle / Avenida" className={`w-full py-4 pl-11 pr-4 rounded-2xl text-sm font-medium outline-none border-2 ${isDarkMode ? 'bg-[#1F2128] border-transparent focus:border-[#FF1F40]/50 text-white' : 'bg-gray-100 border-transparent focus:border-[#FF1F40]/30 text-gray-900'}`} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <input placeholder="Nº" className={`w-full py-4 px-4 rounded-2xl text-sm font-medium outline-none border-2 ${isDarkMode ? 'bg-[#1F2128] border-transparent focus:border-[#FF1F40]/50 text-white' : 'bg-gray-100 border-transparent focus:border-[#FF1F40]/30 text-gray-900'}`} />
                                    <input placeholder="Código Postal" className={`w-full py-4 px-4 rounded-2xl text-sm font-medium outline-none border-2 ${isDarkMode ? 'bg-[#1F2128] border-transparent focus:border-[#FF1F40]/50 text-white' : 'bg-gray-100 border-transparent focus:border-[#FF1F40]/30 text-gray-900'}`} />
                                </div>
                                <input placeholder="Ciudad" className={`w-full py-4 px-4 rounded-2xl text-sm font-medium outline-none border-2 ${isDarkMode ? 'bg-[#1F2128] border-transparent focus:border-[#FF1F40]/50 text-white' : 'bg-gray-100 border-transparent focus:border-[#FF1F40]/30 text-gray-900'}`} />
                            </div>

                            <div className="space-y-2 pt-2 border-t border-white/5">
                                <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Correo Electrónico *</label>
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#FF1F40]" size={16} />
                                    <input placeholder="ejemplo@correo.com" className={`w-full py-4 pl-11 pr-4 rounded-2xl text-sm font-medium outline-none border-2 ${isDarkMode ? 'bg-[#1F2128] border-transparent focus:border-[#FF1F40]/50 text-white' : 'bg-gray-100 border-transparent focus:border-[#FF1F40]/30 text-gray-900'}`} />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Contraseña *</label>
                                    <div className="relative group">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#FF1F40]" size={16} />
                                        <input type="password" placeholder="••••••••" className={`w-full py-4 pl-11 pr-4 rounded-2xl text-sm font-medium outline-none border-2 ${isDarkMode ? 'bg-[#1F2128] border-transparent focus:border-[#FF1F40]/50 text-white' : 'bg-gray-100 border-transparent focus:border-[#FF1F40]/30 text-gray-900'}`} />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Confirmar *</label>
                                    <div className="relative group">
                                        <CheckCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#FF1F40]" size={16} />
                                        <input type="password" placeholder="••••••••" className={`w-full py-4 pl-11 pr-4 rounded-2xl text-sm font-medium outline-none border-2 ${isDarkMode ? 'bg-[#1F2128] border-transparent focus:border-[#FF1F40]/50 text-white' : 'bg-gray-100 border-transparent focus:border-[#FF1F40]/30 text-gray-900'}`} />
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 py-2">
                                <input type="checkbox" className="w-5 h-5 accent-[#FF1F40]" />
                                <p className={`text-[11px] font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                    Acepto los <button onClick={() => setShowTerms(true)} className="text-[#FF1F40] hover:underline">términos</button> y la <button className="text-[#FF1F40] hover:underline">política de privacidad</button>
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Action Button */}
                <button
                    onClick={onLogin}
                    className="w-full bg-[#FF1F40] py-5 rounded-2xl text-white font-black uppercase tracking-wider shadow-xl shadow-red-900/20 active:scale-95 transition-all mt-8"
                >
                    {activeTab === 'login' ? 'Acceso Clientes' : 'Crear Cuenta'}
                </button>

            </div>

            {/* Footer Links */}
            <div className="mt-12 flex gap-6 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                <button
                    onClick={() => setShowTerms(true)}
                    className="hover:text-[#FF1F40] transition-colors"
                >
                    Términos y Privacidad
                </button>
                <span className="opacity-30">|</span>
                <button
                    onClick={() => setShowHelp(true)}
                    className="hover:text-[#FF1F40] transition-colors"
                >
                    Ayuda
                </button>
            </div>

            <div className="mt-8 italic opacity-40">
                <span className="text-[9px] text-gray-700 font-bold">© 2025 Almodovar Group Fitness • v2.0 STRICT</span>
            </div>

        </div>
    );
};

export default Login;
