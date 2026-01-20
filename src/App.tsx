import { Component, useState, useEffect } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import UserDashboard from './UserDashboard';
import AdminDashboard from './AdminDashboard';
import CoachDashboard from './CoachDashboard';
import SplashScreen from './components/SplashScreen';
import { auth, db } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

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
        <div className="min-h-screen bg-red-900 text-white flex items-center justify-center p-8 font-mono text-center">
          <div className="max-w-xl">
            <h1 className="text-3xl font-bold mb-4">¡Oups! Algo salió mal</h1>
            <pre className="bg-red-950 p-4 rounded-xl overflow-auto text-sm mb-6">{this.state.error?.message}</pre>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-white text-red-900 font-bold rounded-xl"
            >
              Recargar App
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
import ManageCoaches from './components/ManageCoaches';
import CreateCoach from './components/CreateCoach';
import AdminUsersList from './components/AdminUsersList';
import AdminGroupsList from './components/AdminGroupsList';
import AttendanceList from './components/AttendanceList';
import Agenda from './components/Agenda';

const AppContent = () => {
  const navigate = useNavigate();
  const [isSplashScreen, setIsSplashScreen] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        // Fetch profile
        const profileRef = doc(db, 'users', firebaseUser.uid);
        const profileSnap = await getDoc(profileRef);

        if (profileSnap.exists()) {
          const profileData = profileSnap.data();
          setUserProfile(profileData);

          // Redirect based on role only if at root path
          if (profileData.isApproved && (window.location.pathname === '/' || window.location.pathname === '')) {
            if (profileData.role === 'admin') navigate('/admin');
            else if (profileData.role === 'coach') navigate('/coach');
            else navigate('/');
          }
        } else {
          setUserProfile(null);
        }
      } else {
        setUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  if (isSplashScreen) {
    return <SplashScreen onFinish={() => setIsSplashScreen(false)} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1F2128] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#FF1F40] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  // If not logged in
  if (!user) {
    return <Login onLogin={() => { }} />;
  }

  // If logged in but pending approval
  if (userProfile && !userProfile.isApproved) {
    return (
      <div className="min-h-screen bg-[#1F2128] text-white flex flex-col items-center justify-center p-8 text-center">
        <div className="w-24 h-24 bg-[#FF1F40]/10 rounded-full flex items-center justify-center mb-8 animate-pulse text-[#FF1F40]">
          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-3xl font-black italic uppercase italic mb-4">Acceso <span className="text-[#FF1F40]">Pendiente</span></h1>
        <p className="text-gray-400 max-w-xs mb-10 font-medium">Hola <span className="text-white">{userProfile.name}</span>, tu cuenta está siendo revisada por nuestro equipo. Te avisaremos cuando puedas acceder.</p>
        <button
          onClick={handleLogout}
          className="px-10 py-4 border-2 border-white/10 rounded-2xl font-bold hover:bg-white/5 transition-colors uppercase tracking-widest text-[10px]"
        >
          Cerrar Sesión
        </button>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<UserDashboard />} />
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/coach" element={<CoachDashboard />} />
      <Route path="/notifications" element={<Notifications />} />
      <Route path="/notification-settings" element={<NotificationSettings />} />
      <Route path="/manage-classes" element={<ClassManagement />} />
      <Route path="/create-class" element={<CreateClass />} />
      <Route path="/edit-class/:classId" element={<CreateClass />} />
      <Route path="/manage-coaches" element={<ManageCoaches />} />
      <Route path="/create-coach" element={<CreateCoach />} />
      <Route path="/edit-coach/:coachId" element={<CreateCoach />} />
      <Route path="/manage-attendance/:classId" element={<AttendanceList />} />
      <Route path="/manage-users" element={<AdminUsersList />} />
      <Route path="/manage-groups" element={<AdminGroupsList />} />
      <Route path="/agenda" element={<Agenda />} />
      {/* Dev Switch */}
      <Route path="/switch" element={<DevSwitch onLogout={handleLogout} />} />
    </Routes>
  );
};

const DevSwitch = ({ onLogout }: { onLogout: () => void }) => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-[#1F2128] text-white flex flex-col items-center justify-center gap-6 p-10 font-sans">
      <h2 className="text-2xl font-bold italic uppercase italic">Vista <span className="text-[#FF1F40]">Dev</span></h2>
      <div className="flex flex-col gap-4 w-full max-w-xs">
        <button onClick={() => navigate('/')} className="p-4 bg-[#2A2D3A] hover:bg-[#FF1F40] rounded-2xl text-center font-bold transition-all">Usuario</button>
        <button onClick={() => navigate('/coach')} className="p-4 bg-[#2A2D3A] hover:bg-[#FF1F40] rounded-2xl text-center font-bold transition-all">Coach</button>
        <button onClick={() => navigate('/admin')} className="p-4 bg-[#2A2D3A] hover:bg-[#FF1F40] rounded-2xl text-center font-bold transition-all">Administrador</button>
        <button onClick={onLogout} className="p-4 border-2 border-red-500/30 text-red-500 rounded-2xl text-center font-bold transition-all mt-4">Cerrar Sesión</button>
      </div>
    </div>
  );
};

const App = () => {
  // Ensure theme is dark
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  return (
    <Router>
      <ErrorBoundary>
        <AppContent />
      </ErrorBoundary>
    </Router>
  );
};

export default App;
