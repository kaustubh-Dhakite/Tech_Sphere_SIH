import { HashRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { AppProvider } from "./context/AppContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import AppLayout from "./components/AppLayout";
import Dashboard from "./pages/Dashboard";
import Complaints from "./pages/Complaints";
import ComplaintDetails from "./pages/ComplaintDetails";
import RegisterComplaint from "./pages/RegisterComplaint";
import Analytics from "./pages/Analytics";
import Bureaus from "./pages/Bureaus";
import Notifications from "./pages/Notifications";
import Settings from "./pages/Settings";
import Login from "./pages/Login";

/* ── animated page transitions ── */
function RoutedPages() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6, transition: { duration: 0.14 } }}
        transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
      >
        <Routes location={location}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/complaints" element={<Complaints />} />
          <Route path="/complaints/:id" element={<ComplaintDetails />} />
          <Route path="/register" element={<RegisterComplaint />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/bureaus" element={<Bureaus />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

/* ── protected wrapper ── */
function ProtectedApp() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream">
        <div className="flex flex-col items-center gap-4">
          <img
            src="/aicte-logo.png"
            alt="AICTE"
            className="h-16 w-16 animate-pulse object-contain"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
          />
          <p className="text-sm font-semibold text-slate-500">Loading AICTE Portal…</p>
        </div>
      </div>
    );
  }

  if (!session) return <Login />;

  return (
    <AppProvider>
      <AppLayout>
        <RoutedPages />
      </AppLayout>
    </AppProvider>
  );
}

/* ── root ── */
export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <HashRouter>
        <AuthProvider>
          <ProtectedApp />
        </AuthProvider>
      </HashRouter>
    </MotionConfig>
  );
}
