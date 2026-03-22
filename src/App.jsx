import { useState } from "react";
import { getSession }    from "./auth/auth";
import { ThemeProvider } from "./auth/ThemeContext";
import AuthPage          from "./pages/AuthPage";
import ExpenseTracker    from "./pages/ExpenseTracker";
import SettingsPage      from "./pages/SettingPage";
import BottomNav         from "./components/BottomNav";

export default function App() {
  const [user, setUser]             = useState(() => getSession());
  const [activePage, setActivePage] = useState("home");

  const handleLogout = () => {
    setUser(null);
    setActivePage("home");
  };

  return (
    <ThemeProvider>
      {!user ? (
        <AuthPage onAuth={(u) => setUser(u)} />
      ) : (
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