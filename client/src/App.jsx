import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AnimatePresence } from 'framer-motion';
import { useAuth } from './store/AuthContext.jsx';
import SplashScreen from './components/SplashScreen.jsx';
import AppLayout from './layouts/AppLayout.jsx';
import Dashboard from './pages/Dashboard.jsx';
import AllProblems from './pages/AllProblems.jsx';
import MyProblems from './pages/MyProblems.jsx';
import TopicBoard from './pages/TopicBoard.jsx';
import NeedsRevision from './pages/NeedsRevision.jsx';
import TodayDSA from './pages/TodayDSA.jsx';
import SolvedCalendar from './pages/SolvedCalendar.jsx';
import Community from './pages/Community.jsx';
import Profile from './pages/Profile.jsx';
import FriendProfile from './pages/FriendProfile.jsx';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

// Protected Route Wrapper
function ProtectedRoutes() {
  const { authUser } = useAuth();
  if (!authUser) return <Navigate to="/login" replace />;
  return <AppLayout />;
}

// Public Route Wrapper (redirects to dashboard if already logged in)
function PublicRoutes() {
  const { authUser } = useAuth();
  if (authUser) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}

export default function App() {
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    // Artificial delay to ensure the beautiful logo animation plays out
    const timer = setTimeout(() => {
      setIsInitializing(false);
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <AnimatePresence mode="wait">
        {isInitializing && <SplashScreen />}
      </AnimatePresence>
      <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 2500,
          style: {
            background: 'rgba(8, 12, 20, 0.95)',
            color: '#e2e8f0',
            border: '1px solid rgba(255,255,255,0.08)',
            fontSize: '14px',
            backdropFilter: 'blur(12px)',
            borderRadius: '12px',
            fontFamily: 'Outfit, Inter, system-ui, sans-serif',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          },
          success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
          error:   { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
        }}
      />
      <Routes>
        {/* Public Auth Routes */}
        <Route element={<PublicRoutes />}>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
        </Route>

        {/* Protected App Routes */}
        <Route path="/" element={<ProtectedRoutes />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="all"       element={<AllProblems />} />
          <Route path="mine"      element={<MyProblems />} />
          <Route path="topics"    element={<TopicBoard />} />
          <Route path="revision"  element={<NeedsRevision />} />
          <Route path="today"     element={<TodayDSA />} />
          <Route path="calendar"  element={<SolvedCalendar />} />
          <Route path="/community" element={<ProtectedRoute><Community /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/profile/:id" element={<ProtectedRoute><FriendProfile /></ProtectedRoute>} />
        </Route>
      </Routes>
    </BrowserRouter>
    </>
  );
}
