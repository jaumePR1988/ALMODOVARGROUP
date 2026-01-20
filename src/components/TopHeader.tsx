import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sun, Moon, LogOut, Bell, ArrowLeft } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';

interface TopHeaderProps {
    title?: string;
    subtitle?: string;
    showNotificationDot?: boolean;
    avatarText?: string;
    onBack?: () => void;
}

const TopHeader: React.FC<TopHeaderProps> = ({
    title,
    subtitle,
    showNotificationDot = true,
    avatarText = "AG",
    onBack
}) => {
    const navigate = useNavigate();
    const [isDarkMode, setIsDarkMode] = useState(() => document.documentElement.classList.contains('dark'));

    useEffect(() => {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'class') {
                    setIsDarkMode(document.documentElement.classList.contains('dark'));
                }
            });
        });
        observer.observe(document.documentElement, { attributes: true });
        return () => observer.disconnect();
    }, []);

    const toggleTheme = () => {
        if (document.documentElement.classList.contains('dark')) {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        } else {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        }
    };

    const handleLogout = async () => {
        if (window.confirm('¿Cerrar sesión?')) {
            try {
                await signOut(auth);
                navigate('/');
            } catch (error) {
                console.error("Error signing out:", error);
            }
        }
    };

    return (
        <header className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-3">
                {onBack ? (
                    <button
                        onClick={onBack}
                        className={`w-11 h-11 rounded-full flex items-center justify-center transition-all active:scale-95 shadow-lg border ${isDarkMode
                            ? 'bg-[#2A2D3A] text-white border-white/5 shadow-black/20'
                            : 'bg-white text-gray-600 border-gray-100 shadow-gray-200/50'
                            }`}
                    >
                        <ArrowLeft size={20} />
                    </button>
                ) : (
                    <div className="w-12 h-12 rounded-full bg-[#FF1F40] flex items-center justify-center font-black text-lg text-white shadow-lg shadow-red-600/20 italic">
                        {avatarText}
                    </div>
                )}
                {title && (
                    <div>
                        <h1 className="text-xl font-black italic leading-tight uppercase tracking-tight">{title}</h1>
                        {subtitle && <p className={`text-[10px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>{subtitle}</p>}
                    </div>
                )}
            </div>

            <div className="flex gap-2.5">
                {/* Theme Toggle */}
                <button
                    onClick={toggleTheme}
                    className={`w-11 h-11 rounded-full flex items-center justify-center transition-all active:scale-95 shadow-lg border ${isDarkMode
                        ? 'bg-[#2A2D3A] text-white border-white/5 shadow-black/20'
                        : 'bg-white text-gray-600 border-gray-100 shadow-gray-200/50'
                        }`}
                >
                    {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                </button>

                {/* Logout Button */}
                <button
                    onClick={handleLogout}
                    className={`w-11 h-11 rounded-full flex items-center justify-center transition-all active:scale-95 shadow-lg border ${isDarkMode
                        ? 'bg-red-500/10 text-red-500 border-red-500/10 shadow-red-900/10'
                        : 'bg-red-50 text-red-500 border-red-100 shadow-red-200/20'
                        }`}
                >
                    <LogOut size={20} />
                </button>

                {/* Notifications */}
                <button
                    onClick={() => navigate('/notifications')}
                    className={`w-11 h-11 rounded-full flex items-center justify-center relative transition-all active:scale-95 shadow-lg border ${isDarkMode
                        ? 'bg-[#2A2D3A] text-white border-white/5 shadow-black/20'
                        : 'bg-white text-gray-600 border-gray-100 shadow-gray-200/50'
                        }`}
                >
                    <Bell size={20} />
                    {showNotificationDot && (
                        <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-[#FF1F40] rounded-full border-2 border-[#1F2128]"></span>
                    )}
                </button>
            </div>
        </header>
    );
};

export default TopHeader;
