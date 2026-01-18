import { Component, useState } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import UserDashboard from './UserDashboard';
import AdminDashboard from './AdminDashboard';
import CoachDashboard from './CoachDashboard';
import SplashScreen from './components/SplashScreen';

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-red-900 text-white flex items-center justify-center p-8 font-mono">
          <div className="max-w-xl">
            <h1 className="text-3xl font-bold mb-4">Runtime Error</h1>
            <pre className="bg-red-950 p-4 rounded-xl overflow-auto text-sm">{this.state.error?.message}</pre>
            <button
              onClick={() => window.location.reload()}
              className="mt-6 px-6 py-3 bg-white text-red-900 font-bold rounded-xl"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

import Login from './components/Login';
import Notifications from './components/Notifications';
import NotificationSettings from './components/NotificationSettings';
import ClassManagement from './components/ClassManagement';
import CreateClass from './components/CreateClass';

const App = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Default theme is Dark Mode
  useState(() => {
    if (!document.documentElement.classList.contains('dark')) {
      document.documentElement.classList.add('dark');
    }
  });

  return (
    <Router>
      <ErrorBoundary>
        {isLoading && <SplashScreen onFinish={() => setIsLoading(false)} />}
        {!isLoading && !isAuthenticated && (
          <Login onLogin={() => setIsAuthenticated(true)} />
        )}
        {isAuthenticated && (
          <Routes>
            <Route path="/" element={<UserDashboard />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/coach" element={<CoachDashboard />} />
            <Route
              path="/switch"
              element={
                <div className="min-h-screen bg-[#1F2128] text-white flex flex-col items-center justify-center gap-6 p-10 font-sans">
                  <h2 className="text-2xl font-bold italic">Seleccionar Vista <span className="text-[#FF1F40]">Dev</span></h2>
                  <div className="flex flex-col gap-4 w-full max-w-xs">
                    <Link to="/" className="p-4 bg-[#2A2D3A] hover:bg-[#FF1F40] rounded-2xl text-center font-bold transition-all">Usuario</Link>
                    <Link to="/coach" className="p-4 bg-[#2A2D3A] hover:bg-[#FF1F40] rounded-2xl text-center font-bold transition-all">Coach</Link>
                    <Link to="/admin" className="p-4 bg-[#2A2D3A] hover:bg-[#FF1F40] rounded-2xl text-center font-bold transition-all">Administrador</Link>
                    <button onClick={() => setIsAuthenticated(false)} className="p-4 border-2 border-red-500/30 text-red-500 rounded-2xl text-center font-bold transition-all">Cerrar Sesión</button>
                  </div>
                </div>
              }
            />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/notification-settings" element={<NotificationSettings />} />
            <Route path="/manage-classes" element={<ClassManagement />} />
            <Route path="/create-class" element={<CreateClass />} />
          </Routes>
        )}
      </ErrorBoundary>
    </Router>
  );
};

export default App;
