// frontend/src/App.jsx
// ✅ FIXED - Proper token restoration on app load

import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { getSession, logoutUser, getAuthToken } from "./api/authApi";
import { setAuthToken } from "./api/config.js";
import { ThemeProvider } from "./auth/ThemeContext";
import AuthPage from "./pages/AuthPage";
import ExpenseTracker from "./pages/ExpenseTracker";
import SettingsPage from "./pages/SettingPage";
import HistoryPage from "./pages/HistoryPage";
import BottomNav from "./components/BottomNav";

/* ── App Layout Component (with routing) ── */
function AppLayout({ user, onLogout }) {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Extract page from URL path
  const getPageFromPath = (path) => {
    if (path === "/history") return "history";
    if (path === "/settings") return "settings";
    return "home"; // default
  };
  
  const activePage = getPageFromPath(location.pathname);

  return (
    <>
      <div style={{ paddingBottom: 60 }}>
        <Routes>
          <Route path="/home" element={<ExpenseTracker user={user} onLogout={onLogout} />} />
          <Route path="/history" element={<HistoryPage user={user} onNavigate={navigate} />} />
          <Route path="/settings" element={<SettingsPage user={user} onLogout={onLogout} onNavigate={navigate} />} />
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
      </div>
      <BottomNav activePage={activePage} onNavigate={(page) => {
        navigate(`/${page === "home" ? "home" : page}`);
      }} />
    </>
  );
}

/* ── Main App Component ── */
export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ FIXED - Check session and restore token on app mount
  useEffect(() => {
    try {
      console.log('🔍 Checking session on app load...');
      
      const session = getSession();
      const token = getAuthToken();
      
      console.log(`Session found: ${session ? '✅ Yes' : '❌ No'}`);
      console.log(`Token found: ${token ? '✅ Yes' : '❌ No'}`);
      
      if (session && session.email) {
        setUser(session);
        console.log('✅ User session restored:', session.email);
        
        // ✅ CRITICAL - Restore token in API config for all subsequent requests
        if (token) {
          setAuthToken(token);
          console.log('✅ Auth token restored from localStorage');
        } else {
          console.warn('⚠️  Session exists but token is missing!');
        }
      } else {
        console.log('❌ No session found - user needs to login');
        setUser(null);
      }
    } catch (error) {
      console.error('❌ Error restoring session:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleLogout = () => {
    try {
      logoutUser(); // Clear localStorage and auth token
      setUser(null);
      console.log('✅ User logged out successfully');
    } catch (error) {
      console.error('❌ Logout error:', error);
    }
  };

  // Loading state
  if (loading) {
    return (
      <ThemeProvider>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100vh",
            fontSize: "18px",
            fontWeight: "500",
          }}
        >
          ⏳ Loading...
        </div>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      {!user ? (
        // ❌ NOT LOGGED IN - Show Auth Page
        <AuthPage onAuth={(u) => {
          setUser(u);
          console.log('✅ User logged in:', u.email);
        }} />
      ) : (
        // ✅ LOGGED IN - Show App with Router
        <Router>
          <AppLayout user={user} onLogout={handleLogout} />
        </Router>
      )}
    </ThemeProvider>
  );
}