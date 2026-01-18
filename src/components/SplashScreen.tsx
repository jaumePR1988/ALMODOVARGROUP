import { useEffect, useState } from 'react';

interface SplashScreenProps {
    onFinish: () => void;
}

const SplashScreen = ({ onFinish }: SplashScreenProps) => {
    const [showLogo, setShowLogo] = useState(false);
    const [showText, setShowText] = useState(false);
    const [exit, setExit] = useState(false);

    useEffect(() => {
        // Secuencia de entrada
        const logoTimeout = setTimeout(() => setShowLogo(true), 300);
        const textTimeout = setTimeout(() => setShowText(true), 1000);

        // Secuencia de salida
        const exitTimeout = setTimeout(() => setExit(true), 4000);
        const finishTimeout = setTimeout(() => onFinish(), 4700);

        return () => {
            clearTimeout(logoTimeout);
            clearTimeout(textTimeout);
            clearTimeout(exitTimeout);
            clearTimeout(finishTimeout);
        };
    }, [onFinish]);

    return (
        <div className={`fixed inset-0 z-[200] flex flex-col items-center justify-center bg-[#1F2128] transition-all duration-1000 ease-in-out ${exit ? 'opacity-0 scale-110 pointer-events-none' : 'opacity-100'}`}>

            {/* Círculo de fondo con resplandor */}
            <div className={`relative flex items-center justify-center transition-all duration-1000 transform ${showLogo ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`}>
                <div className="absolute w-64 h-64 bg-[#FF1F40]/20 rounded-full blur-3xl animate-pulse"></div>
                <div className="relative w-44 h-44 bg-white rounded-full flex items-center justify-center border-[3px] border-[#FF1F40] shadow-[0_0_60px_rgba(255,31,64,0.4)] overflow-hidden p-0">
                    <img
                        src="/logo.png"
                        alt="Almodovar Group Logo"
                        className={`w-[110%] h-[110%] max-w-none object-cover transition-all duration-1000 ${showLogo ? 'scale-100 rotate-0' : 'scale-0 rotate-180'}`}
                    />
                </div>
            </div>

            {/* Texto de Branding */}
            <div className={`mt-10 text-center transition-all duration-1000 transform ${showText ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
                <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic">
                    Almodovar
                </h1>
                <h2 className="text-5xl font-black text-[#FF1F40] tracking-tighter uppercase italic -mt-2">
                    Group
                </h2>
                <p className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.3em] mt-4 opacity-60">
                    Fit Boxing & WOD
                </p>
            </div>

            {/* Indicador de carga minimalista */}
            <div className="absolute bottom-16 flex flex-col items-center gap-4">
                <div className="w-48 h-[2px] bg-gray-800 rounded-full overflow-hidden">
                    <div className={`h-full bg-[#FF1F40] transition-all duration-[3000ms] ease-out ${showText ? 'w-full' : 'w-0'}`}></div>
                </div>
                <span className="text-[8px] font-black text-gray-600 uppercase tracking-widest animate-pulse">
                    Cargando Experiencia...
                </span>
            </div>

            <div className="absolute bottom-8 italic">
                <span className="text-[9px] text-gray-700 font-bold">v2.0.1 © 2025 Almodovar Group</span>
            </div>

        </div>
    );
};

export default SplashScreen;
