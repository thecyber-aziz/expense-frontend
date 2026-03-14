// ── App.jsx ──────────────────────────────────────────────────────────────────
import { useState } from "react";
import { getSession } from "./auth";
import AuthPage from "./AuthPage";
import ExpenseTracker from "./ExpenseTracker";

export default function App() {
  const [user, setUser] = useState(() => getSession());

  if (!user) {
    return <AuthPage onAuth={(u) => setUser(u)} />;
  }

  return (
    <ExpenseTracker
      user={user}
      onLogout={() => setUser(null)}
    />
  );
}
