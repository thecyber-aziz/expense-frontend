import { userKey }  from "../auth/auth";
import { useTheme } from "../auth/ThemeContext";
import { formatCurrency, loadTabData } from "../auth/utils";
import { 
  updateUserNotifications, 
  changeUserPassword,
  updateAppLockSettings,
  update2FASettings 
} from "../api/authApi";
import {
  Settings, Moon, Sun, Shield, Database,
  Trash2, LogOut, Check, X, Info,
  ChevronRight, Lock, Smartphone, Camera, Pencil,
  Bell, BellOff, Download, FileText, FileJson,
  DollarSign, Calendar, Key, RefreshCw, Globe,
  Eye, EyeOff, AlertTriangle, Wifi, WifiOff,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { logOut } from "../auth/auth";

// ── Small reusable toggle ──
function ToggleSwitch({ on, onToggle, dark, border }) {
  return (
    <button
      onClick={onToggle}
      style={{
        width: 44, height: 24, borderRadius: 99,
        background: on ? "#7c3aed" : "rgba(109,40,217,0.15)",
        border: on ? "1px solid #7c3aed" : `1px solid ${border}`,
        position: "relative", cursor: "pointer",
        transition: "all 0.3s cubic-bezier(.4,0,.2,1)",
        flexShrink: 0,
      }}
    >
      <span style={{
        position: "absolute", top: 3,
        left: on ? 22 : 3,
        width: 16, height: 16, borderRadius: "50%",
        background: on ? "#fff" : "#9ca3af",
        transition: "left 0.3s cubic-bezier(.4,0,.2,1)",
      }} />
    </button>
  );
}

// ── Section header label ──
function SectionLabel({ label, textMuted }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-widest px-4 sm:px-5 pt-4 pb-2" style={{ color: textMuted }}>
      {label}
    </p>
  );
}

export default function SettingsPage({ user, onLogout, onNavigate }) {
  const { dark, toggle } = useTheme();

  // ── Confirm modals ──
  const [showClearConfirm, setShowClearConfirm]   = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [cleared, setCleared]                     = useState(false);

  // ── Profile picture ──
  const fileInputRef = useRef(null);
  const dpKey = `dp_${user.email.replace(/[@.]/g, "_")}`;
  const [dp, setDp]           = useState(() => localStorage.getItem(dpKey) || null);
  const [dpSaved, setDpSaved] = useState(false);

  const handleDpChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target.result;
      localStorage.setItem(dpKey, base64);
      setDp(base64);
      setDpSaved(true);
      setTimeout(() => setDpSaved(false), 2000);
    };
    reader.readAsDataURL(file);
  };

  // ── Display name ──
  const nameKey = `name_${user.email.replace(/[@.]/g, "_")}`;
  const [displayName, setDisplayName] = useState(() => localStorage.getItem(nameKey) || user.name || user.email.split("@")[0]);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput]     = useState("");
  const [nameSaved, setNameSaved]     = useState(false);

  const saveRename = () => {
    if (!nameInput.trim()) return;
    localStorage.setItem(nameKey, nameInput.trim());
    setDisplayName(nameInput.trim());
    setEditingName(false);
    setNameSaved(true);
    setTimeout(() => setNameSaved(false), 2000);
  };

  // ── Notifications ──
  const [notifExpense,  setNotifExpense]  = useState(() => user?.notifications?.expenseAlerts ?? true);
  const [notifWeekly,   setNotifWeekly]   = useState(() => user?.notifications?.weeklySummary ?? false);
  const [notifBudget,   setNotifBudget]   = useState(() => user?.notifications?.budgetWarnings ?? true);
  const [notifLoading,  setNotifLoading]  = useState(false);
  const [notifSaved,    setNotifSaved]    = useState(false);
  const [notifError,    setNotifError]    = useState("");

  // Load notifications when user changes
  useEffect(() => {
    if (user?.notifications) {
      setNotifExpense(user.notifications.expenseAlerts ?? true);
      setNotifWeekly(user.notifications.weeklySummary ?? false);
      setNotifBudget(user.notifications.budgetWarnings ?? true);
    }
  }, [user?.notifications?.expenseAlerts, user?.notifications?.weeklySummary, user?.notifications?.budgetWarnings]);

  // Handle notification toggle
  const handleNotificationToggle = async (notificationType, newValue) => {
    try {
      setNotifLoading(true);
      setNotifError("");

      const updates = {
        expenseAlerts: notificationType === 'expense' ? newValue : notifExpense,
        weeklySummary: notificationType === 'weekly' ? newValue : notifWeekly,
        budgetWarnings: notificationType === 'budget' ? newValue : notifBudget,
      };

      await updateUserNotifications(
        updates.expenseAlerts,
        updates.weeklySummary,
        updates.budgetWarnings
      );

      // Update local state
      if (notificationType === 'expense') setNotifExpense(newValue);
      if (notificationType === 'weekly') setNotifWeekly(newValue);
      if (notificationType === 'budget') setNotifBudget(newValue);

      setNotifSaved(true);
      setTimeout(() => setNotifSaved(false), 2000);
    } catch (error) {
      console.error('❌ Failed to update notifications:', error.message);
      setNotifError(error.message || 'Failed to save notifications');
      setTimeout(() => setNotifError(""), 3000);
    } finally {
      setNotifLoading(false);
    }
  };

  // ── Currency & Format ──
  const currencies = ["₹ INR", "$ USD", "€ EUR", "£ GBP", "¥ JPY", "A$ AUD"];
  const [currency,    setCurrency]    = useState("₹ INR");
  const [dateFormat,  setDateFormat]  = useState("DD/MM/YYYY");
  const dateFormats = ["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"];
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
  const [showDateDropdown,     setShowDateDropdown]     = useState(false);

  // ── Security ──
  const [showPwModal,      setShowPwModal]      = useState(false);
  const [currentPw,        setCurrentPw]        = useState("");
  const [newPw,            setNewPw]            = useState("");
  const [confirmPw,        setConfirmPw]        = useState("");
  const [showCurrentPw,    setShowCurrentPw]    = useState(false);
  const [showNewPw,        setShowNewPw]        = useState(false);
  const [pwChanged,        setPwChanged]        = useState(false);
  const [pwError,          setPwError]          = useState("");
  const [pwLoading,        setPwLoading]        = useState(false);
  
  // App lock state
  const [appLock,          setAppLock]          = useState(() => user?.appLock?.enabled ?? false);
  const [appLockPin,       setAppLockPin]       = useState("");
  const [confirmAppLockPin, setConfirmAppLockPin] = useState("");
  const [showAppLockModal, setShowAppLockModal] = useState(false);
  const [appLockError,     setAppLockError]     = useState("");
  const [appLockSaved,     setAppLockSaved]     = useState(false);
  const [appLockLoading,   setAppLockLoading]   = useState(false);
  
  // 2FA state
  const [twoFA,            setTwoFA]            = useState(() => user?.twoFA?.enabled ?? false);
  const [twoFAError,       setTwoFAError]       = useState("");
  const [twoFASaved,       setTwoFASaved]       = useState(false);
  const [twoFALoading,     setTwoFALoading]     = useState(false);

  // Load security settings when user changes
  useEffect(() => {
    if (user?.appLock) {
      setAppLock(user.appLock.enabled ?? false);
    }
    if (user?.twoFA) {
      setTwoFA(user.twoFA.enabled ?? false);
    }
  }, [user?.appLock?.enabled, user?.twoFA?.enabled]);

  const handleChangePw = async () => {
    if (!currentPw || !newPw || !confirmPw) { setPwError("All fields required."); return; }
    if (newPw !== confirmPw)                { setPwError("Passwords don't match."); return; }
    if (newPw.length < 6)                   { setPwError("Min 6 characters."); return; }
    
    try {
      setPwLoading(true);
      setPwError("");
      
      await changeUserPassword(currentPw, newPw, confirmPw);
      
      setPwChanged(true);
      setShowPwModal(false);
      setCurrentPw(""); 
      setNewPw(""); 
      setConfirmPw("");
      setTimeout(() => setPwChanged(false), 2500);
    } catch (error) {
      setPwError(error.message || "Failed to change password");
    } finally {
      setPwLoading(false);
    }
  };

  // Handle app lock toggle
  const handleAppLockToggle = async (newValue) => {
    if (newValue) {
      // Show modal to set PIN
      setShowAppLockModal(true);
    } else {
      // Disable app lock
      try {
        setAppLockLoading(true);
        setAppLockError("");
        
        await updateAppLockSettings(false, null);
        
        setAppLock(false);
        setAppLockSaved(true);
        setTimeout(() => setAppLockSaved(false), 2000);
      } catch (error) {
        console.error('❌ Failed to disable app lock:', error.message);
        setAppLockError(error.message || 'Failed to disable app lock');
        setTimeout(() => setAppLockError(""), 3000);
      } finally {
        setAppLockLoading(false);
      }
    }
  };

  // Handle app lock PIN setup
  const handleAppLockSetup = async () => {
    if (!appLockPin || !confirmAppLockPin) {
      setAppLockError("Please enter PIN in both fields");
      return;
    }
    
    if (appLockPin !== confirmAppLockPin) {
      setAppLockError("PINs do not match");
      return;
    }
    
    if (appLockPin.length < 4 || appLockPin.length > 6) {
      setAppLockError("PIN must be between 4 and 6 digits");
      return;
    }
    
    if (!/^\d+$/.test(appLockPin)) {
      setAppLockError("PIN must contain only digits");
      return;
    }
    
    try {
      setAppLockLoading(true);
      setAppLockError("");
      
      await updateAppLockSettings(true, appLockPin);
      
      setAppLock(true);
      setAppLockPin("");
      setConfirmAppLockPin("");
      setShowAppLockModal(false);
      setAppLockSaved(true);
      setTimeout(() => setAppLockSaved(false), 2000);
    } catch (error) {
      console.error('❌ Failed to enable app lock:', error.message);
      setAppLockError(error.message || 'Failed to enable app lock');
    } finally {
      setAppLockLoading(false);
    }
  };

  // Handle 2FA toggle
  const handleTwoFAToggle = async (newValue) => {
    try {
      setTwoFALoading(true);
      setTwoFAError("");
      
      await update2FASettings(newValue);
      
      setTwoFA(newValue);
      setTwoFASaved(true);
      setTimeout(() => setTwoFASaved(false), 2000);
    } catch (error) {
      console.error('❌ Failed to update 2FA:', error.message);
      setTwoFAError(error.message || 'Failed to update 2FA');
      setTimeout(() => setTwoFAError(""), 3000);
    } finally {
      setTwoFALoading(false);
    }
  };

  // ── Export ──
  const [exportedCsv,  setExportedCsv]  = useState(false);
  const [exportedJson, setExportedJson] = useState(false);

  const handleExportCSV = () => {
    const data = Object.keys(localStorage)
      .filter(k => k.startsWith(`et_${user.email.replace(/[@.]/g, "_")}`))
      .map(k => ({ key: k, value: localStorage.getItem(k) }));
    const csv = ["Key,Value", ...data.map(d => `"${d.key}","${d.value}"`)].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = "expenses.csv"; a.click();
    URL.revokeObjectURL(url);
    setExportedCsv(true);
    setTimeout(() => setExportedCsv(false), 2500);
  };

  const handleExportJSON = () => {
    const data = {};
    Object.keys(localStorage)
      .filter(k => k.startsWith(`et_${user.email.replace(/[@.]/g, "_")}`))
      .forEach(k => { data[k] = localStorage.getItem(k); });
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = "expenses.json"; a.click();
    URL.revokeObjectURL(url);
    setExportedJson(true);
    setTimeout(() => setExportedJson(false), 2500);
  };

  // ── Theme tokens ──
  const card      = dark ? "#141420" : "#ffffff";
  const border    = dark ? "rgba(255,255,255,0.08)" : "rgba(109,40,217,0.12)";
  const textMain  = dark ? "#ffffff" : "#1a1a2e";
  const textMuted = dark ? "#6b7280" : "#9ca3af";
  const pageBg    = dark ? "#0a0a10" : "#f0ecff";
  const inputBg   = dark ? "#1e1e2e" : "#f5f3ff";

  // ── Handlers ──
  const handleClearData = () => {
    Object.keys(localStorage)
      .filter(k => k.startsWith(`et_${user.email.replace(/[@.]/g, "_")}`))
      .forEach(k => localStorage.removeItem(k));
    setCleared(true);
    setShowClearConfirm(false);
    setTimeout(() => setCleared(false), 2500);
  };

  const handleLogout = () => { logOut(); onLogout(); };

  // ── Shared row styles ──
  const rowBorder = { borderTop: `1px solid ${border}` };

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
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="relative shrink-0 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <div className="w-16 h-16 rounded-full overflow-hidden flex items-center justify-center text-xl font-black text-white"
                style={{ background: dp ? "transparent" : "linear-gradient(135deg,#7c3aed,#4338ca)", border: `2px solid ${border}` }}>
                {dp
                  ? <img src={dp} alt="Profile" className="w-full h-full object-cover" />
                  : (displayName ? displayName[0].toUpperCase() : user.email[0].toUpperCase())}
              </div>
              <div className="absolute inset-0 rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                style={{ background: "rgba(0,0,0,0.45)" }}>
                <Camera size={18} color="#fff" strokeWidth={2} />
              </div>
              <div className="absolute bottom-0 right-0 w-5 h-5 rounded-full flex items-center justify-center pointer-events-none"
                style={{ background: "linear-gradient(135deg,#7c3aed,#4338ca)", border: `2px solid ${dark ? "#141420" : "#ffffff"}` }}>
                <Camera size={9} color="#fff" strokeWidth={2.5} />
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleDpChange} />
            </div>

            {/* Name / email */}
            <div className="flex-1 min-w-0">
              {editingName ? (
                <div className="flex items-center gap-1.5 mb-1">
                  <input autoFocus value={nameInput} onChange={e => setNameInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") saveRename(); if (e.key === "Escape") setEditingName(false); }}
                    className="flex-1 rounded-lg px-2 py-1 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-violet-500"
                    style={{ background: inputBg, border: `1px solid ${border}`, color: textMain, minWidth: 0 }} />
                  <button onClick={saveRename} className="w-6 h-6 rounded-lg flex items-center justify-center bg-violet-600 hover:bg-violet-500 transition shrink-0">
                    <Check size={11} color="#fff" />
                  </button>
                  <button onClick={() => setEditingName(false)} className="w-6 h-6 rounded-lg flex items-center justify-center transition shrink-0"
                    style={{ background: dark ? "rgba(255,255,255,0.08)" : "rgba(109,40,217,0.08)", color: textMuted }}>
                    <X size={11} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 mb-0.5">
                  <p className="font-bold text-sm sm:text-base truncate" style={{ color: textMain }}>{displayName}</p>
                  <button onClick={() => { setNameInput(displayName); setEditingName(true); }}
                    className="shrink-0 p-0.5 rounded transition opacity-60 hover:opacity-100" style={{ color: "#a78bfa" }}>
                    <Pencil size={11} strokeWidth={2.5} />
                  </button>
                </div>
              )}
              <p className="text-xs truncate" style={{ color: textMuted }}>{user.email}</p>
              {(dpSaved || nameSaved) && (
                <span className="flex items-center gap-1 text-[10px] font-bold mt-1" style={{ color: "#34d399" }}>
                  <Check size={10} /> {nameSaved ? "Name saved!" : "Photo saved!"}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── Appearance ── */}
        <div className="rounded-2xl mb-4 overflow-hidden" style={{ background: card, border: `1px solid ${border}` }}>
          <SectionLabel label="Appearance" textMuted={textMuted} />

          <div className="flex items-center justify-between px-4 sm:px-5 py-3" style={rowBorder}>
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
            <ToggleSwitch on={dark} onToggle={toggle} dark={dark} border={border} />
          </div>
        </div>

        {/* ── Notifications ── */}
        <div className="rounded-2xl mb-4 overflow-hidden" style={{ background: card, border: `1px solid ${border}` }}>
          <SectionLabel label="Notifications" textMuted={textMuted} />

          {notifError && (
            <div className="px-4 sm:px-5 py-2" style={{ background: "rgba(239,68,68,0.08)" }}>
              <p className="text-[10px] font-semibold" style={{ color: "#f87171" }}>
                {notifError}
              </p>
            </div>
          )}

          {notifSaved && (
            <div className="px-4 sm:px-5 py-2" style={{ background: "rgba(52,211,153,0.08)" }}>
              <span className="flex items-center gap-1 text-[10px] font-bold" style={{ color: "#34d399" }}>
                <Check size={10} /> Notifications saved!
              </span>
            </div>
          )}

          {[
            {
              icon: <Bell size={15} color="#a78bfa" />,
              iconBg: "rgba(139,92,246,0.12)",
              title: "Expense Alerts",
              sub: "Notify when an expense is added",
              val: notifExpense, 
              type: 'expense',
            },
            {
              icon: <Calendar size={15} color="#34d399" />,
              iconBg: "rgba(52,211,153,0.1)",
              title: "Weekly Summary",
              sub: "Get a recap every Sunday",
              val: notifWeekly, 
              type: 'weekly',
            },
            {
              icon: <AlertTriangle size={15} color="#fbbf24" />,
              iconBg: "rgba(251,191,36,0.1)",
              title: "Budget Warnings",
              sub: "Alert when nearing monthly limit",
              val: notifBudget, 
              type: 'budget',
            },
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between px-4 sm:px-5 py-3" style={rowBorder}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: item.iconBg }}>
                  {item.icon}
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: textMain }}>{item.title}</p>
                  <p className="text-[10px]" style={{ color: textMuted }}>{item.sub}</p>
                </div>
              </div>
              <ToggleSwitch 
                on={item.val} 
                onToggle={() => handleNotificationToggle(item.type, !item.val)}
                dark={dark} 
                border={border}
              />
            </div>
          ))}
        </div>

        

        {/* ── Security ── */}
        <div className="rounded-2xl mb-4 overflow-hidden" style={{ background: card, border: `1px solid ${border}` }}>
          <SectionLabel label="Security" textMuted={textMuted} />

          {/* Change password */}
          <div className="px-4 sm:px-5 py-3" style={rowBorder}>
            {pwChanged ? (
              <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: "#34d399" }}>
                <Check size={15} /> Password changed successfully
              </div>
            ) : showPwModal ? (
              <div>
                <p className="text-xs font-bold mb-2" style={{ color: textMain }}>Change Password</p>
                {pwError && (
                  <p className="text-[10px] mb-2 font-semibold" style={{ color: "#f87171" }}>{pwError}</p>
                )}
                {[
                  { label: "Current Password", val: currentPw, setVal: setCurrentPw, show: showCurrentPw, setShow: setShowCurrentPw },
                  { label: "New Password",     val: newPw,     setVal: setNewPw,     show: showNewPw,     setShow: setShowNewPw },
                  { label: "Confirm Password", val: confirmPw, setVal: setConfirmPw, show: showNewPw,     setShow: setShowNewPw },
                ].map((f, i) => (
                  <div key={i} className="relative mb-2">
                    <input
                      type={f.show ? "text" : "password"}
                      placeholder={f.label}
                      value={f.val}
                      onChange={e => f.setVal(e.target.value)}
                      className="w-full rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500 pr-8"
                      style={{ background: inputBg, border: `1px solid ${border}`, color: textMain }}
                    />
                    <button onClick={() => f.setShow(v => !v)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100 transition"
                      style={{ color: textMuted }}>
                      {f.show ? <EyeOff size={12} /> : <Eye size={12} />}
                    </button>
                  </div>
                ))}
                <div className="flex gap-2 mt-2">
                  <button onClick={handleChangePw} disabled={pwLoading}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition disabled:opacity-50"
                    style={{ opacity: pwLoading ? 0.5 : 1 }}>
                    <Check size={12} /> {pwLoading ? "Saving..." : "Save"}
                  </button>
                  <button onClick={() => { setShowPwModal(false); setPwError(""); }} disabled={pwLoading}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition"
                    style={{ background: dark ? "rgba(255,255,255,0.06)" : "rgba(109,40,217,0.06)", color: textMuted, border: `1px solid ${border}`, opacity: pwLoading ? 0.5 : 1 }}>
                    <X size={12} /> Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={() => setShowPwModal(true)} className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(139,92,246,0.12)" }}>
                    <Key size={15} color="#a78bfa" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold" style={{ color: textMain }}>Change Password</p>
                    <p className="text-[10px]" style={{ color: textMuted }}>Update your account password</p>
                  </div>
                </div>
                <ChevronRight size={14} color={textMuted} />
              </button>
            )}
          </div>

          {/* App lock */}
          <div className="flex items-center justify-between px-4 sm:px-5 py-3" style={rowBorder}>
            <div className="flex items-center gap-3 flex-1">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(251,191,36,0.1)" }}>
                <Lock size={15} color="#fbbf24" />
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: textMain }}>App Lock</p>
                <p className="text-[10px]" style={{ color: textMuted }}>Require PIN on app open</p>
              </div>
            </div>
            <ToggleSwitch on={appLock} onToggle={() => handleAppLockToggle(!appLock)} dark={dark} border={border} />
          </div>

          {appLockError && (
            <div className="px-4 sm:px-5 py-2" style={{ background: "rgba(239,68,68,0.08)" }}>
              <p className="text-[10px] font-semibold" style={{ color: "#f87171" }}>{appLockError}</p>
            </div>
          )}

          {appLockSaved && (
            <div className="px-4 sm:px-5 py-2" style={{ background: "rgba(52,211,153,0.08)" }}>
              <span className="flex items-center gap-1 text-[10px] font-bold" style={{ color: "#34d399" }}>
                <Check size={10} /> App lock {appLock ? "enabled" : "disabled"}!
              </span>
            </div>
          )}

          {/* 2FA */}
          <div className="flex items-center justify-between px-4 sm:px-5 py-3" style={rowBorder}>
            <div className="flex items-center gap-3 flex-1">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(96,165,250,0.1)" }}>
                <Shield size={15} color="#60a5fa" />
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: textMain }}>Two-Factor Auth</p>
                <p className="text-[10px]" style={{ color: textMuted }}>Extra layer of account security</p>
              </div>
            </div>
            <ToggleSwitch on={twoFA} onToggle={() => handleTwoFAToggle(!twoFA)} dark={dark} border={border} />
          </div>

          {twoFAError && (
            <div className="px-4 sm:px-5 py-2" style={{ background: "rgba(239,68,68,0.08)" }}>
              <p className="text-[10px] font-semibold" style={{ color: "#f87171" }}>{twoFAError}</p>
            </div>
          )}

          {twoFASaved && (
            <div className="px-4 sm:px-5 py-2" style={{ background: "rgba(52,211,153,0.08)" }}>
              <span className="flex items-center gap-1 text-[10px] font-bold" style={{ color: "#34d399" }}>
                <Check size={10} /> 2FA {twoFA ? "enabled" : "disabled"}!
              </span>
            </div>
          )}
        </div>

        {/* ── App Lock PIN Modal ── */}
        {showAppLockModal && (
          <div
            className="fixed inset-0 flex items-center justify-center p-4 z-50"
            style={{ background: "rgba(0,0,0,0.5)" }}
            onClick={() => setShowAppLockModal(false)}
          >
            <div
              className="rounded-2xl p-5 sm:p-6 max-w-sm w-full shadow-2xl"
              style={{ background: card, border: `1px solid ${border}` }}
              onClick={e => e.stopPropagation()}
            >
              <h2 className="text-lg sm:text-xl font-bold mb-2" style={{ color: textMain }}>
                Set App Lock PIN
              </h2>
              <p className="text-sm mb-4" style={{ color: textMuted }}>
                Create a 4-6 digit PIN to lock your app
              </p>
              
              {appLockError && (
                <p className="text-[10px] mb-3 font-semibold" style={{ color: "#f87171" }}>{appLockError}</p>
              )}

              <div className="relative mb-3">
                <input
                  type="password"
                  placeholder="Enter PIN (4-6 digits)"
                  value={appLockPin}
                  onChange={e => setAppLockPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  style={{ background: inputBg, border: `1px solid ${border}`, color: textMain }}
                />
              </div>

              <div className="relative mb-4">
                <input
                  type="password"
                  placeholder="Confirm PIN"
                  value={confirmAppLockPin}
                  onChange={e => setConfirmAppLockPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  style={{ background: inputBg, border: `1px solid ${border}`, color: textMain }}
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleAppLockSetup}
                  disabled={appLockLoading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold transition disabled:opacity-50"
                  style={{ opacity: appLockLoading ? 0.5 : 1 }}
                >
                  <Lock size={14} /> {appLockLoading ? "Setting up..." : "Enable"}
                </button>
                <button
                  onClick={() => {
                    setShowAppLockModal(false);
                    setAppLockPin("");
                    setConfirmAppLockPin("");
                    setAppLockError("");
                  }}
                  disabled={appLockLoading}
                  className="flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold transition"
                  style={{ background: dark ? "rgba(255,255,255,0.06)" : "rgba(109,40,217,0.06)", color: textMain, border: `1px solid ${border}`, opacity: appLockLoading ? 0.5 : 1 }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

       

        {/* ── Privacy & Data ── */}
        <div className="rounded-2xl mb-4 overflow-hidden" style={{ background: card, border: `1px solid ${border}` }}>
          <SectionLabel label="Privacy & Data" textMuted={textMuted} />

          <div className="flex items-center gap-3 px-4 sm:px-5 py-3" style={rowBorder}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(96,165,250,0.1)" }}>
              <Shield size={15} color="#60a5fa" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold" style={{ color: textMain }}>Zero Tracking</p>
              <p className="text-[10px]" style={{ color: textMuted }}>No analytics, no ads, no data collection.</p>
            </div>
            <Check size={13} color="#34d399" />
          </div>

          <div className="px-4 sm:px-5 py-3" style={rowBorder}>
            {cleared ? (
              <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: "#34d399" }}>
                <Check size={15} /> Data cleared successfully
              </div>
            ) : (
              <button onClick={() => setShowClearConfirm(true)} className="flex items-center justify-between w-full group">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(239,68,68,0.1)" }}>
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

        {/* ── Clear Data Modal ── */}
        {showClearConfirm && !cleared && (
          <div
            className="fixed inset-0 flex items-center justify-center p-4 z-50"
            style={{ background: "rgba(0,0,0,0.5)" }}
            onClick={() => setShowClearConfirm(false)}
          >
            <div
              className="rounded-2xl p-5 sm:p-6 max-w-sm w-full shadow-2xl"
              style={{ background: card, border: `1px solid ${border}` }}
              onClick={e => e.stopPropagation()}
            >
              <h2 className="text-lg sm:text-xl font-bold mb-2" style={{ color: textMain }}>
                Clear My Data?
              </h2>
              <p className="text-sm mb-6" style={{ color: textMuted }}>
                This will delete all your expenses and tabs. This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleClearData}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-bold transition"
                >
                  <Trash2 size={14} /> Clear All
                </button>
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold transition"
                  style={{ background: dark ? "rgba(255,255,255,0.06)" : "rgba(109,40,217,0.06)", color: textMain, border: `1px solid ${border}` }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── About ── */}
        <div className="rounded-2xl mb-4 overflow-hidden" style={{ background: card, border: `1px solid ${border}` }}>
          <SectionLabel label="About" textMuted={textMuted} />
           <div className="flex items-center gap-3 px-4 sm:px-5 py-3" style={rowBorder}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(96,165,250,0.1)" }}>
              <Smartphone size={15} color="#60a5fa" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold" style={{ color: textMain }}>Platform</p>
              <p className="text-[10px]" style={{ color: textMuted }}>Web · Works offline · No install needed</p>
            </div>
          </div>

          <div className="flex items-center gap-3 px-4 sm:px-5 py-3" style={rowBorder}>
            
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.2)" }}>
              <Info size={15} color="#a78bfa" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold" style={{ color: textMain }}>Expense Tracker</p>
              <p className="text-[10px]" style={{ color: textMuted }}>Version 2.0.3 · Stable</p>
            </div>
          </div>

         

         
        </div>

        {/* ── Logout ── */}
        <div className="rounded-2xl overflow-hidden" style={{ background: card, border: `1px solid ${border}` }}>
          <div className="px-4 sm:px-5 py-3">
            <button onClick={() => setShowLogoutConfirm(true)} className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(239,68,68,0.1)" }}>
                  <LogOut size={15} color="#f87171" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold" style={{ color: "#f87171" }}>Sign Out</p>
                  <p className="text-[10px]" style={{ color: textMuted }}>You can sign back in anytime</p>
                </div>
              </div>
              <ChevronRight size={14} color={textMuted} />
            </button>
          </div>
        </div>

        {/* ── Logout Modal ── */}
        {showLogoutConfirm && (
          <div
            className="fixed inset-0 flex items-center justify-center p-4 z-50"
            style={{ background: "rgba(0,0,0,0.5)" }}
            onClick={() => setShowLogoutConfirm(false)}
          >
            <div
              className="rounded-2xl p-5 sm:p-6 max-w-sm w-full shadow-2xl"
              style={{ background: card, border: `1px solid ${border}` }}
              onClick={e => e.stopPropagation()}
            >
              <h2 className="text-lg sm:text-xl font-bold mb-2" style={{ color: textMain }}>
                Sign Out?
              </h2>
              <p className="text-sm mb-6" style={{ color: textMuted }}>
                Are you sure you want to sign out? You can sign back in anytime.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleLogout}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-bold transition"
                >
                  <LogOut size={14} /> Sign Out
                </button>
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold transition"
                  style={{ background: dark ? "rgba(255,255,255,0.06)" : "rgba(109,40,217,0.06)", color: textMain, border: `1px solid ${border}` }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}