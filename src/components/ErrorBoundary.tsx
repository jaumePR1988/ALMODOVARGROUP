import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
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
        <div className="flex min-h-screen items-center justify-center bg-[#1A1A1A] text-white p-6">
          <div className="bg-[#2A2D3A] p-8 rounded-2xl w-full max-w-2xl border border-red-500/30">
            <h1 className="text-2xl font-black text-red-500 mb-4 uppercase">Aplicación Craseada</h1>
            <p className="text-gray-300 mb-4 text-sm">Hay un error en el código que está provocando que la pantalla se quede en blanco. Por favor, toma una captura de este error para Jaume/IA:</p>
            <pre className="p-4 bg-black/50 rounded-lg text-red-400 font-mono text-xs overflow-auto max-h-[50vh]">
              {this.state.error?.message}
              {'\n'}
              {this.state.error?.stack}
            </pre>
            <button 
              onClick={() => window.location.replace('/login')}
              className="mt-6 px-6 py-3 bg-red-500 text-white rounded-lg font-bold uppercase tracking-widest text-sm hover:bg-red-600 transition-colors w-full"
            >
              Volver al Login
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
