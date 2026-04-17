import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Navbar from './components/Navbar';
import AnimatedBackground from './components/AnimatedBackground';
import Home from './pages/Home';
import ReportForm from './pages/ReportForm';
import AIAdvisor from './pages/AIAdvisor';
import TrackReport from './pages/TrackReport';
import PublicMap from './pages/PublicMap';
import PublicFeed from './pages/PublicFeed';
import Scoreboard from './pages/Scoreboard';
import MyComplaints from './pages/MyComplaints';
import CitizenDashboard from './pages/CitizenDashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import NGOPortal from './pages/NGOPortal';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import useStore from './store/useStore';
import { AnimatePresence, motion } from 'framer-motion';

const PageWrapper = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, x: 10 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -10 }}
    transition={{ duration: 0.3, ease: "easeOut" }}
  >
    {children}
  </motion.div>
);

// Guard: must be logged in (any role)
const ProtectedRoute = ({ children }) => {
  const { user } = useStore();
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

// Guard: must be Admin
const AdminRoute = ({ children }) => {
  const { user } = useStore();
  if (!user) return <Navigate to="/admin/login" replace />;
  if (user.role !== 'Admin') return <Navigate to="/" replace />;
  return children;
};

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageWrapper><Home /></PageWrapper>} />
        <Route path="/report" element={<PageWrapper><ReportForm /></PageWrapper>} />
        <Route path="/ai-advisor" element={<PageWrapper><AIAdvisor /></PageWrapper>} />
        <Route path="/track" element={<PageWrapper><TrackReport /></PageWrapper>} />
        <Route path="/my-complaints" element={<PageWrapper><MyComplaints /></PageWrapper>} />
        <Route path="/map" element={<PageWrapper><PublicMap /></PageWrapper>} />
        <Route path="/feed" element={<PageWrapper><PublicFeed /></PageWrapper>} />
        <Route path="/scoreboard" element={<PageWrapper><Scoreboard /></PageWrapper>} />
        <Route path="/login" element={<PageWrapper><Login /></PageWrapper>} />
        <Route path="/register" element={<PageWrapper><Register /></PageWrapper>} />
        <Route path="/dashboard" element={<ProtectedRoute><PageWrapper><CitizenDashboard /></PageWrapper></ProtectedRoute>} />
        <Route path="/ngo-portal" element={<ProtectedRoute><PageWrapper><NGOPortal /></PageWrapper></ProtectedRoute>} />
        <Route path="/admin/login" element={<PageWrapper><AdminLogin /></PageWrapper>} />
        <Route path="/admin/dashboard" element={<AdminRoute><PageWrapper><AdminDashboard /></PageWrapper></AdminRoute>} />
      </Routes>
    </AnimatePresence>
  );
};

function App() {
  const { theme } = useStore();

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return (
    <Router>
      <div className="min-h-screen flex flex-col font-sans transition-colors duration-300">
        <AnimatedBackground />
        <Navbar />
        <main className="flex-grow">
          <AnimatedRoutes />
        </main>
      </div>
    </Router>
  );
}

export default App;