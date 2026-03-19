import { useState } from "react";
import { getSession } from "./auth";
import AuthPage from "./AuthPage";
import ExpenseTracker from "./ExpenseTracker";
import SettingsPage from "./SettingPage";
import BottomNav from "./BottomNav";
import { ThemeProvider } from "./ThemeContext";

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
          <div style={{ paddingBottom: 72 }}>
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