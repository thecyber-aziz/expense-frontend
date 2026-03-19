import { useTheme } from "./ThemeContext";
import {
  Settings, Moon, Sun, Shield, Database,
  Trash2, LogOut, Check, X, Info,
  ChevronRight, Lock, Smartphone,
} from "lucide-react";
import { useState } from "react";
import { logOut } from "./auth";

export default function SettingsPage({ user, onLogout, onNavigate }) {
  const { dark, toggle } = useTheme();
  const [showClearConfirm, setShowClearConfirm]   = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [cleared, setCleared]                     = useState(false);

  const card    = dark ? "#141420" : "#ffffff";
  const card2   = dark ? "#1a1a24" : "#f9f7ff";
  const border  = dark ? "rgba(255,255,255,0.08)" : "rgba(109,40,217,0.12)";
  const textMain  = dark ? "#ffffff" : "#1a1a2e";
  const textMuted = dark ? "#6b7280" : "#9ca3af";
  const pageBg  = dark ? "#0a0a10" : "#f0ecff";

  const handleClearData = () => {
    // clears only this user's data keys
    Object.keys(localStorage)
      .filter(k => k.startsWith(`et_${user.email.replace(/[@.]/g, "_")}`))
      .forEach(k => localStorage.removeItem(k));
    setCleared(true);
    setShowClearConfirm(false);
    setTimeout(() => setCleared(false), 2500);
  };

  const handleLogout = () => { logOut(); onLogout(); };

  return (
    <div className="min-h-screen pb-24" style={{
      background: pageBg, color: textMain,
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      transition: "background 0.4s ease",
    }}>
      {/* Glow orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-48 h-48 sm:w-72 sm:h-72 rounded-full blur-[100px]"
          style={{ background: dark ? "rgba(109,40,217,0.1)" : "rgba(109,40,217,0.05)" }} />
        <div className="absolute bottom-0 right-1/4 w-48 h-48 sm:w-72 sm:h-72 rounded-full blur-[100px]"
          style={{ background: dark ? "rgba(8,145,178,0.07)" : "rgba(139,92,246,0.04)" }} />
      </div>

      <div className="relative w-full max-w-xl lg:max-w-2xl mx-auto px-3 sm:px-5 py-5 sm:py-8">

        {/* Page Title */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2">
            <Settings size={26} color="#8b5cf6" strokeWidth={2.5} />
            Settings
          </h1>
          <p className="text-xs sm:text-sm mt-1" style={{ color: textMuted }}>
            Manage your preferences and account
          </p>
        </div>

        {/* ── Profile Card ── */}
        <div className="rounded-2xl p-4 sm:p-5 mb-4"
          style={{ background: card, border: `1px solid ${border}` }}>
          <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: textMuted }}>
            Account
          </p>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-600 to-indigo-700 flex items-center justify-center text-lg font-black text-white shrink-0">
              {user.name ? user.name[0].toUpperCase() : user.email[0].toUpperCase()}
            </div>
            <div className="min-w-0">
              {user.name && (
                <p className="font-bold text-sm sm:text-base truncate" style={{ color: textMain }}>{user.name}</p>
              )}
              <p className="text-xs truncate" style={{ color: textMuted }}>{user.email}</p>
            </div>
          </div>
        </div>

        {/* ── Appearance ── */}
        <div className="rounded-2xl mb-4 overflow-hidden"
          style={{ background: card, border: `1px solid ${border}` }}>
          <p className="text-[10px] font-bold uppercase tracking-widest px-4 sm:px-5 pt-4 pb-2" style={{ color: textMuted }}>
            Appearance
          </p>

          {/* Dark mode toggle row */}
          <div className="flex items-center justify-between px-4 sm:px-5 py-3"
            style={{ borderTop: `1px solid ${border}` }}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: dark ? "rgba(139,92,246,0.15)" : "rgba(109,40,217,0.08)" }}>
                {dark ? <Moon size={15} color="#a78bfa" /> : <Sun size={15} color="#7c3aed" />}
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: textMain }}>Dark Mode</p>
                <p className="text-[10px]" style={{ color: textMuted }}>
                  {dark ? "Currently using dark theme" : "Currently using light theme"}
                </p>
              </div>
            </div>
            {/* Toggle switch */}
            <button onClick={toggle}
              style={{
                width: 44, height: 24, borderRadius: 99,
                background: dark ? "#7c3aed" : "rgba(109,40,217,0.15)",
                border: dark ? "1px solid #7c3aed" : `1px solid ${border}`,
                position: "relative", cursor: "pointer",
                transition: "all 0.3s cubic-bezier(.4,0,.2,1)",
                flexShrink: 0,
              }}>
              <span style={{
                position: "absolute", top: 3,
                left: dark ? 22 : 3,
                width: 16, height: 16, borderRadius: "50%",
                background: dark ? "#fff" : "#9ca3af",
                transition: "left 0.3s cubic-bezier(.4,0,.2,1)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }} />
            </button>
          </div>
        </div>

        {/* ── Privacy & Data ── */}
        <div className="rounded-2xl mb-4 overflow-hidden"
          style={{ background: card, border: `1px solid ${border}` }}>
          <p className="text-[10px] font-bold uppercase tracking-widest px-4 sm:px-5 pt-4 pb-2" style={{ color: textMuted }}>
            Privacy & Data
          </p>

          {/* Local storage info */}
          <div className="flex items-center gap-3 px-4 sm:px-5 py-3"
            style={{ borderTop: `1px solid ${border}` }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "rgba(52,211,153,0.1)" }}>
              <Database size={15} color="#34d399" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold" style={{ color: textMain }}>Local Storage Only</p>
              <p className="text-[10px]" style={{ color: textMuted }}>All data stays on your device. No servers.</p>
            </div>
            <Lock size={13} color={textMuted} />
          </div>

          {/* No tracking */}
          <div className="flex items-center gap-3 px-4 sm:px-5 py-3"
            style={{ borderTop: `1px solid ${border}` }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "rgba(96,165,250,0.1)" }}>
              <Shield size={15} color="#60a5fa" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold" style={{ color: textMain }}>Zero Tracking</p>
              <p className="text-[10px]" style={{ color: textMuted }}>No analytics, no ads, no data collection.</p>
            </div>
            <Check size={13} color="#34d399" />
          </div>

          {/* Clear data */}
          <div className="px-4 sm:px-5 py-3" style={{ borderTop: `1px solid ${border}` }}>
            {cleared ? (
              <div className="flex items-center gap-2 text-sm font-semibold"
                style={{ color: "#34d399" }}>
                <Check size={15} /> Data cleared successfully
              </div>
            ) : showClearConfirm ? (
              <div>
                <p className="text-xs mb-2" style={{ color: textMuted }}>
                  This will delete all your expenses and tabs. Cannot be undone.
                </p>
                <div className="flex gap-2">
                  <button onClick={handleClearData}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition">
                    <Trash2 size={12} /> Yes, Clear All
                  </button>
                  <button onClick={() => setShowClearConfirm(false)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition"
                    style={{ background: dark ? "rgba(255,255,255,0.06)" : "rgba(109,40,217,0.06)", color: textMuted, border: `1px solid ${border}` }}>
                    <X size={12} /> Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={() => setShowClearConfirm(true)}
                className="flex items-center justify-between w-full group">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: "rgba(239,68,68,0.1)" }}>
                    <Trash2 size={15} color="#f87171" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold" style={{ color: "#f87171" }}>Clear My Data</p>
                    <p className="text-[10px]" style={{ color: textMuted }}>Delete all expenses and tabs</p>
                  </div>
                </div>
                <ChevronRight size={14} color={textMuted} />
              </button>
            )}
          </div>
        </div>

        {/* ── About ── */}
        <div className="rounded-2xl mb-4 overflow-hidden"
          style={{ background: card, border: `1px solid ${border}` }}>
          <p className="text-[10px] font-bold uppercase tracking-widest px-4 sm:px-5 pt-4 pb-2" style={{ color: textMuted }}>
            About
          </p>

          <div className="flex items-center gap-3 px-4 sm:px-5 py-3"
            style={{ borderTop: `1px solid ${border}` }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.2)" }}>
              <Info size={15} color="#a78bfa" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold" style={{ color: textMain }}>Expense Tracker</p>
              <p className="text-[10px]" style={{ color: textMuted }}>Version 2.0.1 · Stable</p>
            </div>
          </div>

          <div className="flex items-center gap-3 px-4 sm:px-5 py-3"
            style={{ borderTop: `1px solid ${border}` }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "rgba(96,165,250,0.1)" }}>
              <Smartphone size={15} color="#60a5fa" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold" style={{ color: textMain }}>Platform</p>
              <p className="text-[10px]" style={{ color: textMuted }}>Web · Works offline · No install needed</p>
            </div>
          </div>
        </div>

        {/* ── Logout ── */}
        <div className="rounded-2xl overflow-hidden"
          style={{ background: card, border: `1px solid ${border}` }}>
          <div className="px-4 sm:px-5 py-3">
            {showLogoutConfirm ? (
              <div>
                <p className="text-xs mb-2" style={{ color: textMuted }}>Are you sure you want to sign out?</p>
                <div className="flex gap-2">
                  <button onClick={handleLogout}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition">
                    <LogOut size={12} /> Yes, Sign Out
                  </button>
                  <button onClick={() => setShowLogoutConfirm(false)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition"
                    style={{ background: dark ? "rgba(255,255,255,0.06)" : "rgba(109,40,217,0.06)", color: textMuted, border: `1px solid ${border}` }}>
                    <X size={12} /> Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={() => setShowLogoutConfirm(true)}
                className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: "rgba(239,68,68,0.1)" }}>
                    <LogOut size={15} color="#f87171" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold" style={{ color: "#f87171" }}>Sign Out</p>
                    <p className="text-[10px]" style={{ color: textMuted }}>You can sign back in anytime</p>
                  </div>
                </div>
                <ChevronRight size={14} color={textMuted} />
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}