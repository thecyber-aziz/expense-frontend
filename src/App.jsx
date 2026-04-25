import { useState, useEffect } from "react";
import { getSession, logoutUser } from "./api/authApi";
import { ThemeProvider } from "./auth/ThemeContext";
import AuthPage from "./pages/AuthPage";
import ExpenseTracker from "./pages/ExpenseTracker";
import SettingsPage from "./pages/SettingPage";
import BottomNav from "./components/BottomNav";

export default function App() {
  const [user, setUser] = useState(null);
  const [activePage, setActivePage] = useState("home");
  const [loading, setLoading] = useState(true);

  // ✅ Check session on app mount
  useEffect(() => {
    try {
      const session = getSession();
      if (session && session.email) {
        setUser(session);
        console.log('✅ User session restored:', session.email);
      } else {
        console.log('❌ No session found');
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
      logoutUser(); // Clear localStorage
      setUser(null);
      setActivePage("home");
      console.log('✅ User logged out successfully');
    } catch (error) {
      console.error('❌ Logout error:', error);
    }
  };

  // Loading state dikhao jab session check ho raha ho
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
        // ✅ LOGGED IN - Show App Pages
        <>
          <div style={{ paddingBottom: 60 }}>
            {activePage === "home" && (
              <ExpenseTracker user={user} onLogout={handleLogout} />
            )}
            {activePage === "settings" && (
              <SettingsPage
                user={user}
                onLogout={handleLogout}
                onNavigate={setActivePage}
              />
            )}
          </div>
          <BottomNav activePage={activePage} onNavigate={setActivePage} />
        </>
      )}
    </ThemeProvider>
  );
}