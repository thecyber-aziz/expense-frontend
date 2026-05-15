import { useState, useEffect } from "react";
import { useTheme } from "../auth/ThemeContext";
import { googleSignIn, loginUser, registerUser } from "../api/authApi";
import { setAuthToken } from "../api/config.js";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../auth/firebase";
import {
  User, Mail, Lock, Eye, EyeOff,
  LogIn, UserPlus, Loader2, DollarSign,
  ShieldCheck,
} from "lucide-react";

/* ── Ambient background ───────────────────────────────────────────────────── */
function Background({ dark }) {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      <div style={{
        position: "absolute", top: "-20%", left: "-10%",
        width: 700, height: 700, borderRadius: "50%",
        background: dark
          ? "radial-gradient(circle, rgba(88,28,135,0.18) 0%, transparent 70%)"
          : "radial-gradient(circle, rgba(109,40,217,0.10) 0%, transparent 70%)",
        filter: "blur(40px)",
      }} />
      <div style={{
        position: "absolute", bottom: "-20%", right: "-10%",
        width: 600, height: 600, borderRadius: "50%",
        background: dark
          ? "radial-gradient(circle, rgba(30,27,75,0.25) 0%, transparent 70%)"
          : "radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)",
        filter: "blur(40px)",
      }} />
      <div style={{
        position: "absolute", top: "40%", right: "20%",
        width: 300, height: 300, borderRadius: "50%",
        background: dark
          ? "radial-gradient(circle, rgba(67,56,202,0.10) 0%, transparent 70%)"
          : "radial-gradient(circle, rgba(167,139,250,0.07) 0%, transparent 70%)",
        filter: "blur(60px)",
      }} />
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: dark
          ? "radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)"
          : "radial-gradient(circle, rgba(109,40,217,0.07) 1px, transparent 1px)",
        backgroundSize: "28px 28px", opacity: 0.6,
      }} />
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 1,
        background: "linear-gradient(90deg, transparent 0%, rgba(139,92,246,0.4) 40%, rgba(99,102,241,0.4) 60%, transparent 100%)",
      }} />
    </div>
  );
}

/* ── Password strength ────────────────────────────────────────────────────── */
function PasswordStrength({ password }) {
  if (!password) return null;
  const score =
    (password.length >= 6 ? 1 : 0) +
    (password.length >= 10 ? 1 : 0) +
    (/[A-Z]/.test(password) ? 1 : 0) +
    (/[0-9]/.test(password) ? 1 : 0) +
    (/[^A-Za-z0-9]/.test(password) ? 1 : 0);
  const levels = [
    { label: "Too short",  gradient: "linear-gradient(90deg,#7f1d1d,#991b1b)", text: "#f87171" },
    { label: "Weak",       gradient: "linear-gradient(90deg,#78350f,#b45309)", text: "#fb923c" },
    { label: "Fair",       gradient: "linear-gradient(90deg,#713f12,#ca8a04)", text: "#facc15" },
    { label: "Good",       gradient: "linear-gradient(90deg,#1e3a5f,#2563eb)", text: "#60a5fa" },
    { label: "Strong",     gradient: "linear-gradient(90deg,#064e3b,#059669)", text: "#34d399" },
  ];
  const lvl = levels[Math.min(score, 4)];
  const pct = ((score + 1) / 5) * 100;
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ width: "100%", height: 3, borderRadius: 99, background: "rgba(255,255,255,0.05)", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, borderRadius: 99, background: lvl.gradient, transition: "width 0.4s ease, background 0.4s ease" }} />
      </div>
      <p style={{ fontSize: 10, marginTop: 5, color: lvl.text, fontWeight: 600 }}>{lvl.label}</p>
    </div>
  );
}

/* ── Styled input ─────────────────────────────────────────────────────────── */
function InputField({ label, type, placeholder, value, onChange, onKeyDown, icon, right, dark }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{
        fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
        color: focused ? "#a78bfa" : dark ? "#4b5563" : "#7c3aed", transition: "color 0.2s",
      }}>
        {label}
      </label>
      <div style={{ position: "relative" }}>
        <span style={{
          position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)",
          color: focused ? "#8b5cf6" : dark ? "#4b5563" : "#9ca3af",
          transition: "color 0.2s", pointerEvents: "none", display: "flex",
        }}>
          {icon}
        </span>
        <input
          type={type} placeholder={placeholder} value={value}
          onChange={onChange} onKeyDown={onKeyDown}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          style={{
            width: "100%", boxSizing: "border-box",
            background: focused
              ? dark ? "rgba(0,0,0,0.55)" : "rgba(237,233,254,0.9)"
              : dark ? "rgba(0,0,0,0.35)" : "rgba(245,243,255,0.8)",
            border: focused
              ? "1px solid rgba(139,92,246,0.55)"
              : dark ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(109,40,217,0.18)",
            borderRadius: 12, paddingLeft: 40, paddingRight: right ? 44 : 14,
            paddingTop: 12, paddingBottom: 12, fontSize: 14,
            color: dark ? "#fff" : "#1a1a2e", outline: "none", transition: "all 0.2s",
            boxShadow: focused ? "0 0 0 3px rgba(139,92,246,0.12)" : "none",
          }}
        />
        {right}
      </div>
    </div>
  );
}

/* ── Main component ───────────────────────────────────────────────────────── */
export default function AuthPage({ onAuth }) {
  const { dark } = useTheme();
  const [mode, setMode]         = useState("login");
  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError]       = useState("");
  const [success, setSuccess]   = useState("");
  const [loading, setLoading]   = useState(false);
  const [mounted, setMounted]   = useState(false);

  useEffect(() => { const t = setTimeout(() => setMounted(true), 60); return () => clearTimeout(t); }, []);

  const handleSubmit = async () => {
    setError(""); 
    setSuccess("");
    const em = email.trim().toLowerCase();
    if (mode === "signup" && !name.trim()) return setError("Please enter your full name.");
    if (!em || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) return setError("Enter a valid email address.");
    if (!password || password.length < 6) return setError("Password must be at least 6 characters.");
    
    setLoading(true);
    try {
      let result;
      if (mode === "login") {
        result = await loginUser(em, password);
      } else {
        result = await registerUser(name, em, password);
      }
      
      setLoading(false);
      
      if (!result.success) {
        return setError(result.message || "Authentication failed");
      }
      
      // ✅ CRITICAL - Explicitly restore token from localStorage before navigating
      // This ensures the token is available in memory for immediate API calls
      const storedToken = localStorage.getItem("et_auth_token");
      if (storedToken) {
        setAuthToken(storedToken);
        console.log('✅ Token explicitly restored from localStorage for immediate API calls');
      } else {
        console.warn('⚠️  No token found in localStorage after login');
      }
      
      if (mode === "signup") {
        setSuccess("Account created! Signing you in…");
        setTimeout(() => onAuth(result.data), 900);
      } else {
        setSuccess("Signed in successfully!");
        setTimeout(() => onAuth(result.data), 600);
      }
    } catch (err) {
      setLoading(false);
      setError(err.message || "Authentication failed. Please try again.");
      console.error('Auth error:', err);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setLoading(true);

    console.log('🔐 Starting Google Sign-In...');

    if (!auth) {
      console.error('❌ Firebase auth is not initialized');
      setError("Firebase is not configured. Check your .env.local file.");
      setLoading(false);
      return;
    }

    try {
      console.log('📱 Opening Google popup...');
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      console.log('✅ Google popup successful');
      console.log('🔓 Extracting ID token...');
      const firebaseToken = await user.getIdToken();
      console.log('📋 ID Token obtained');

      console.log('🔄 Sending to backend...');
      // Send Firebase token and user info to backend
      const response = await googleSignIn({
        idToken: firebaseToken,
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || user.email?.split('@')[0] || 'User',
      });
      
      if (response.success) {
        console.log('✅ Backend verified Google token:', response.data.email);
        
        // ✅ CRITICAL - Explicitly restore token from localStorage before navigating
        const storedToken = localStorage.getItem("et_auth_token");
        if (storedToken) {
          setAuthToken(storedToken);
          console.log('✅ Token explicitly restored from localStorage for immediate API calls');
        } else {
          console.warn('⚠️  No token found in localStorage after Google sign-in');
        }
        
        setSuccess("Signed in successfully!");
        setTimeout(() => onAuth(response.data), 600);
      } else {
        console.error('❌ Backend rejected token:', response.message);
        setError(response.message || "Google sign-in failed");
      }
    } catch (error) {
      // Handle Firebase-specific errors
      if (error?.code === 'auth/popup-blocked') {
        console.error('❌ Popup blocked:', error.message);
        setError("Google popup was blocked. Please allow popups in browser settings.");
      } else if (error?.code === 'auth/popup-closed-by-user') {
        console.error('❌ Popup closed by user:', error.message);
        setError("You closed the Google sign-in popup. Please try again.");
      } else if (error?.message?.includes('window.closed')) {
        // ⚠️ COOP/COEP warning from Firefox/Chrome - Firebase internally checks popup.window.closed
        // This is a browser security policy check and doesn't affect functionality. Suppress silently.
        console.warn('⚠️ Browser popup policy check (doesn\'t affect auth)');
        return;
      } else {
        console.error('❌ Google Sign-In Error:', error);
        setError(error.message || "Failed to sign in with Google");
      }
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setMode(m => m === "login" ? "signup" : "login");
    setError(""); setSuccess(""); setName(""); setEmail(""); setPassword("");
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: dark
        ? "linear-gradient(145deg, #030308 0%, #06060f 35%, #080814 65%, #050510 100%)"
        : "linear-gradient(145deg, #f5f3ff 0%, #ede9fe 35%, #e8e0ff 65%, #f0ecff 100%)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "32px 16px",
      fontFamily: "'Segoe UI', -apple-system, system-ui, sans-serif",
      color: dark ? "#fff" : "#1a1a2e",
      transition: "background 0.4s ease",
    }}>
      <Background dark={dark} />

      <div style={{
        position: "relative", width: "100%", maxWidth: 400,
        opacity: mounted ? 1 : 0,
        transform: mounted ? "translateY(0)" : "translateY(28px)",
        transition: "opacity 0.65s cubic-bezier(.4,0,.2,1), transform 0.65s cubic-bezier(.4,0,.2,1)",
      }}>

        {/* ── Logo + Title ── */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ display: "inline-flex", position: "relative", marginBottom: 16 }}>
            <div style={{
              position: "absolute", inset: -8, borderRadius: 28,
              background: "radial-gradient(circle, rgba(109,40,217,0.2) 0%, transparent 70%)",
              filter: "blur(8px)",
            }} />
            <div style={{
              position: "relative", width: 60, height: 60, borderRadius: 20,
              background: dark
                ? "linear-gradient(145deg, #1a0a3d 0%, #0d0828 50%, #130a2e 100%)"
                : "linear-gradient(145deg, #ede9fe 0%, #ddd6fe 50%, #c4b5fd 100%)",
              border: dark ? "1px solid rgba(139,92,246,0.2)" : "1px solid rgba(109,40,217,0.25)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: dark
                ? "0 8px 32px rgba(88,28,135,0.25), inset 0 1px 0 rgba(255,255,255,0.06)"
                : "0 8px 32px rgba(109,40,217,0.15)",
            }}>
              <DollarSign size={26} color={dark ? "#a78bfa" : "#7c3aed"} strokeWidth={2.5} />
            </div>
          </div>

          <h1 style={{
            fontSize: "clamp(22px, 5vw, 30px)", fontWeight: 900,
            letterSpacing: "-0.03em", lineHeight: 1.1, margin: "0 0 6px",
            color: dark ? "#fff" : "#1a1a2e",
          }}>
            Expense{" "}
            <span style={{
              background: "linear-gradient(90deg, #a78bfa 0%, #818cf8 50%, #c4b5fd 100%)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>
              Tracker
            </span>
          </h1>
          <p style={{ color: dark ? "#6b7280" : "#6b7280", fontSize: 13, margin: 0 }}>
            {mode === "login" ? "Welcome back — sign in to continue" : "Create your account, it's free"}
          </p>
        </div>

        {/* ── Mode switcher ── */}
        <div style={{
          display: "flex", gap: 4, padding: 4, borderRadius: 14, marginBottom: 16,
          background: dark ? "rgba(0,0,0,0.5)" : "rgba(109,40,217,0.07)",
          border: dark ? "1px solid rgba(255,255,255,0.04)" : "1px solid rgba(109,40,217,0.12)",
        }}>
          {["login", "signup"].map((m) => (
            <button key={m}
              onClick={() => { setMode(m); setError(""); setSuccess(""); setName(""); setEmail(""); setPassword(""); }}
              style={{
                flex: 1, padding: "10px 0", borderRadius: 10,
                fontSize: 13, fontWeight: 600, cursor: "pointer",
                transition: "all 0.25s cubic-bezier(.4,0,.2,1)",
                border: mode === m ? "1px solid rgba(139,92,246,0.25)" : "1px solid transparent",
                background: mode === m
                  ? dark
                    ? "linear-gradient(135deg, rgba(76,29,149,0.8) 0%, rgba(67,56,202,0.7) 100%)"
                    : "linear-gradient(135deg, rgba(109,40,217,0.15) 0%, rgba(99,102,241,0.12) 100%)"
                  : "transparent",
                color: mode === m ? (dark ? "#e9d5ff" : "#6d28d9") : (dark ? "#4b5563" : "#9ca3af"),
                boxShadow: mode === m ? "0 4px 16px rgba(88,28,135,0.15)" : "none",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              }}
            >
              {m === "login"
                ? <><LogIn size={13} strokeWidth={2.2} /> Sign In</>
                : <><UserPlus size={13} strokeWidth={2.2} /> Sign Up</>
              }
            </button>
          ))}
        </div>

        {/* ── Form card ── */}
        <div style={{
          borderRadius: 20, padding: "24px 24px 20px",
          background: dark
            ? "linear-gradient(160deg, rgba(12,8,28,0.97) 0%, rgba(6,6,18,0.99) 100%)"
            : "#ffffff",
          border: dark ? "1px solid rgba(255,255,255,0.055)" : "1px solid rgba(109,40,217,0.14)",
          boxShadow: dark ? "0 32px 80px rgba(0,0,0,0.75)" : "0 8px 48px rgba(109,40,217,0.1)",
          transition: "background 0.4s ease",
        }}>

          {/* Error */}
          {error && (
            <div style={{
              display: "flex", alignItems: "flex-start", gap: 10,
              background: "rgba(120,20,20,0.12)", border: "1px solid rgba(220,38,38,0.2)",
              borderRadius: 12, padding: "10px 14px", marginBottom: 16,
              color: "#f87171", fontSize: 13,
            }}>
              <ShieldCheck size={15} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>{error}</span>
            </div>
          )}

          {/* Success */}
          {success && (
            <div style={{
              display: "flex", alignItems: "center", gap: 10,
              background: "rgba(6,60,45,0.12)", border: "1px solid rgba(52,211,153,0.2)",
              borderRadius: 12, padding: "10px 14px", marginBottom: 16,
              color: "#059669", fontSize: 13,
            }}>
              <ShieldCheck size={15} />
              <span>{success}</span>
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

            {mode === "signup" && (
              <InputField
                label="Full Name" type="text" placeholder="e.g. Rahul Sharma"
                value={name} onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                icon={<User size={15} strokeWidth={2} />} dark={dark}
              />
            )}

            <InputField
              label="Email Address" type="email" placeholder="you@example.com"
              value={email} onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              icon={<Mail size={15} strokeWidth={2} />} dark={dark}
            />

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <PasswordInputField
                value={password} showPass={showPass} setShowPass={setShowPass}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                dark={dark}
              />
              {mode === "signup" && <PasswordStrength password={password} />}
            </div>

            <SubmitButton loading={loading} mode={mode} onClick={handleSubmit} />

            {/* Google Sign-In Button */}
            <button onClick={handleGoogleSignIn} disabled={loading}
              style={{
                marginTop: 12, width: "100%", padding: "13px 0",
                borderRadius: 12, fontSize: 14, fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.55 : 1,
                border: dark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(109,40,217,0.12)",
                background: dark ? "rgba(0,0,0,0.4)" : "rgba(255,255,255,0.95)",
                color: dark ? "#fff" : "#1a1a2e",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                transition: "all 0.2s",
              }}
              onMouseOver={e => {
                if (!loading) {
                  e.currentTarget.style.background = dark ? "rgba(255,255,255,0.08)" : "rgba(245,243,255,1)";
                  e.currentTarget.style.borderColor = "#8b5cf6";
                }
              }}
              onMouseOut={e => {
                e.currentTarget.style.background = dark ? "rgba(0,0,0,0.4)" : "rgba(255,255,255,0.95)";
                e.currentTarget.style.borderColor = dark ? "rgba(255,255,255,0.08)" : "rgba(109,40,217,0.12)";
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              {loading ? "Signing in..." : "Continue with Google"}
            </button>
          </div>

          {/* Divider */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "16px 0" }}>
            <div style={{ flex: 1, height: 1, background: dark ? "rgba(255,255,255,0.04)" : "rgba(109,40,217,0.08)" }} />
            <span style={{ fontSize: 10, color: dark ? "#374151" : "#a78bfa", letterSpacing: "0.1em", textTransform: "uppercase" }}>or</span>
            <div style={{ flex: 1, height: 1, background: dark ? "rgba(255,255,255,0.04)" : "rgba(109,40,217,0.08)" }} />
          </div>

          <p style={{ textAlign: "center", fontSize: 12, color: dark ? "#374151" : "#6b7280", margin: 0 }}>
            {mode === "login" ? (
              <>Don't have an account?{" "}
                <button onClick={switchMode} style={{ background: "none", border: "none", cursor: "pointer", color: "#8b5cf6", fontWeight: 700, fontSize: 12, padding: 0 }}
                  onMouseOver={e => e.target.style.color = "#a78bfa"}
                  onMouseOut={e => e.target.style.color = "#8b5cf6"}>
                  Sign up free
                </button>
              </>
            ) : (
              <>Already have an account?{" "}
                <button onClick={switchMode} style={{ background: "none", border: "none", cursor: "pointer", color: "#8b5cf6", fontWeight: 700, fontSize: 12, padding: 0 }}
                  onMouseOver={e => e.target.style.color = "#a78bfa"}
                  onMouseOut={e => e.target.style.color = "#8b5cf6"}>
                  Sign in
                </button>
              </>
            )}
          </p>
        </div>

        {/* Footer */}
        <p style={{
          textAlign: "center", fontSize: 10,
          color: dark ? "rgba(255,255,255,0.1)" : "rgba(109,40,217,0.3)",
          marginTop: 20, lineHeight: 1.6,
        }}>
          <ShieldCheck size={10} style={{ display: "inline", marginRight: 4, verticalAlign: "middle" }} />
          All data is stored locally on your device only. No server. No tracking. 100% private.
        </p>
      </div>
    </div>
  );
}

/* ── Password field ───────────────────────────────────────────────────────── */
function PasswordInputField({ value, showPass, setShowPass, onChange, onKeyDown, dark }) {
  const [focused, setFocused] = useState(false);
  return (
    <>
      <label style={{
        fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
        color: focused ? "#a78bfa" : dark ? "#4b5563" : "#7c3aed", transition: "color 0.2s",
      }}>
        Password
      </label>
      <div style={{ position: "relative" }}>
        <span style={{
          position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)",
          color: focused ? "#8b5cf6" : dark ? "#4b5563" : "#9ca3af",
          transition: "color 0.2s", pointerEvents: "none", display: "flex",
        }}>
          <Lock size={15} strokeWidth={2} />
        </span>
        <input
          type={showPass ? "text" : "password"}
          placeholder="Min. 6 characters"
          value={value} onChange={onChange} onKeyDown={onKeyDown}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          style={{
            width: "100%", boxSizing: "border-box",
            background: focused
              ? dark ? "rgba(0,0,0,0.55)" : "rgba(237,233,254,0.9)"
              : dark ? "rgba(0,0,0,0.35)" : "rgba(245,243,255,0.8)",
            border: focused
              ? "1px solid rgba(139,92,246,0.55)"
              : dark ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(109,40,217,0.18)",
            borderRadius: 12, paddingLeft: 40, paddingRight: 44,
            paddingTop: 12, paddingBottom: 12, fontSize: 14,
            color: dark ? "#fff" : "#1a1a2e", outline: "none", transition: "all 0.2s",
            boxShadow: focused ? "0 0 0 3px rgba(139,92,246,0.12)" : "none",
          }}
        />
        <button type="button" onClick={() => setShowPass(s => !s)}
          style={{
            position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
            width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center",
            background: dark ? "rgba(255,255,255,0.04)" : "rgba(109,40,217,0.06)",
            border: dark ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(109,40,217,0.12)",
            borderRadius: 8, cursor: "pointer",
            color: dark ? "#4b5563" : "#9ca3af", transition: "all 0.15s",
          }}
          onMouseOver={e => e.currentTarget.style.color = "#8b5cf6"}
          onMouseOut={e => e.currentTarget.style.color = dark ? "#4b5563" : "#9ca3af"}
        >
          {showPass ? <EyeOff size={13} strokeWidth={2} /> : <Eye size={13} strokeWidth={2} />}
        </button>
      </div>
    </>
  );
}

/* ── Submit button ────────────────────────────────────────────────────────── */
function SubmitButton({ loading, mode, onClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button onClick={onClick} disabled={loading}
      onMouseOver={() => setHovered(true)} onMouseOut={() => setHovered(false)}
      style={{
        marginTop: 4, width: "100%", padding: "13px 0",
        borderRadius: 12, fontSize: 14, fontWeight: 700,
        cursor: loading ? "not-allowed" : "pointer",
        opacity: loading ? 0.55 : 1, color: "#fff",
        border: "1px solid rgba(139,92,246,0.25)",
        background: hovered && !loading
          ? "linear-gradient(135deg, #6d28d9 0%, #4f46e5 50%, #7c3aed 100%)"
          : "linear-gradient(135deg, #5b21b6 0%, #4338ca 50%, #6d28d9 100%)",
        boxShadow: hovered && !loading
          ? "0 6px 28px rgba(109,40,217,0.45)"
          : "0 4px 16px rgba(88,28,135,0.3)",
        transform: hovered && !loading ? "translateY(-1px)" : "translateY(0)",
        transition: "all 0.2s cubic-bezier(.4,0,.2,1)",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
      }}
    >
      {loading ? (
        <>
          <Loader2 size={15} strokeWidth={2.2} style={{ animation: "spin 0.7s linear infinite" }} />
          <span style={{ color: "rgba(255,255,255,0.7)" }}>Please wait…</span>
        </>
      ) : (
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {mode === "login"
            ? <><LogIn size={15} strokeWidth={2.2} /> Sign In</>
            : <><UserPlus size={15} strokeWidth={2.2} /> Create Account</>
          }
        </span>
      )}
    </button>
  );
}