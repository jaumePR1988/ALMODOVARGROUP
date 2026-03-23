import { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import SplashScreen from './components/SplashScreen';
import Login from './components/Login';
import { ProtectedRoute } from './components/ProtectedRoute';
import UserDashboard from './pages/UserDashboard';
import AdminDashboard from './pages/AdminDashboard';
import UserManagement from './pages/UserManagement';
import ClassManagement from './pages/ClassManagement';
import AdminSettings from './pages/AdminSettings';
import AdminModes from './pages/AdminModes';
import CoachDashboard from './pages/CoachDashboard';
import CoachAttendance from './pages/CoachAttendance';
import CoachWodBuilder from './pages/CoachWodBuilder';
import CoachAddExercise from './pages/CoachAddExercise';
import CoachExerciseLibrary from './pages/CoachExerciseLibrary';
import Profile from './pages/Profile';
import Booking from './pages/Booking';
import Notifications from './pages/Notifications';
import { useAuth } from './contexts/AuthContext';
import TermsAcceptanceModal from './components/TermsAcceptanceModal';
import { ErrorBoundary } from './components/ErrorBoundary';

function RoleBasedRedirect() {
    const { userData, loading } = useAuth();
    if (loading) return null;
    
    // Redirect logic based on role
    if (userData?.role === 'admin') return <Navigate to="/admin" replace />;
    if (userData?.role === 'coach') return <Navigate to="/coach" replace />;
    
    // Default user dashboard
    return <UserDashboard />;
}

function App() {
  const { userData } = useAuth();
  const [loading, setLoading] = useState(true);

  if (loading) {
    return <SplashScreen onFinish={() => setLoading(false)} />;
  }

  return (
    <ErrorBoundary>
    <Routes>
      <Route path="/login" element={<Login />} />
      
      {/* Rutas protegidas genéricas y redirección según rol */}
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<RoleBasedRedirect />} />
        <Route path="/reservar" element={<Booking />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/notificaciones" element={<Notifications />} />
      </Route>

      {/* Rutas exclusivas de Coach */}
      <Route element={<ProtectedRoute allowedRoles={['admin', 'coach']} />}>
        <Route path="/coach" element={<CoachDashboard />} />
        <Route path="/coach/attendance" element={<CoachAttendance />} />
        <Route path="/coach/wod-builder" element={<CoachWodBuilder />} />
        <Route path="/coach/add-exercise" element={<CoachAddExercise />} />
        <Route path="/coach/exercises" element={<CoachExerciseLibrary />} />
        <Route path="/coach/exercises/:id/edit" element={<CoachAddExercise />} />
      </Route>

      {/* Rutas exclusivas de Admin */}
      <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<UserManagement />} />
        <Route path="/admin/classes" element={<ClassManagement />} />
        <Route path="/admin/settings" element={<AdminSettings />} />
        <Route path="/admin/modes" element={<AdminModes />} />
      </Route>

      {/* Redirección Catch-All */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>

    {/* Modal Obligatorio de Aceptación de Términos (Primera Vez) */}
    {userData && 
     (!userData.termsAccepted || !userData.imageRightsAccepted) && 
     ['user', 'coach'].includes(userData.role) && (
      <TermsAcceptanceModal userData={userData} />
    )}
    </ErrorBoundary>
  );
}

export default App;
