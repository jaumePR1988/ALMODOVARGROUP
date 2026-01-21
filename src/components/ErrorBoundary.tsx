import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-[#1F2128] flex flex-col items-center justify-center p-6 text-center">
                    <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6 border border-red-500/20">
                        <span className="text-4xl">⚠️</span>
                    </div>
                    <h1 className="text-2xl font-black text-white italic uppercase mb-2 leading-tight">Vaya, algo ha salido mal</h1>
                    <p className="text-gray-400 text-sm max-w-xs mb-8">
                        La aplicación ha encontrado un error inesperado al cargar esta sección.
                    </p>
                    <div className="bg-black/20 p-4 rounded-2xl w-full max-w-md text-left mb-8 border border-white/5 overflow-auto max-h-40">
                        <code className="text-red-400 text-[10px] break-all">
                            {this.state.error?.toString()}
                        </code>
                    </div>
                    <button
                        onClick={() => window.location.href = '/'}
                        className="bg-[#FF1F40] text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-red-900/40 active:scale-95 transition-all"
                    >
                        Volver al inicio
                    </button>
                </div>
            );
        }

        return this.children;
    }
}

export default ErrorBoundary;
