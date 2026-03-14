// ── AuthPage.jsx ─────────────────────────────────────────────────────────────
import { useState, useEffect } from "react";
import { logIn, signUp } from "./auth";

/* ── Ambient background ───────────────────────────────────────────────────── */
function Background() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {/* Deep atmospheric orbs */}
      <div style={{
        position: "absolute", top: "-20%", left: "-10%",
        width: 700, height: 700, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(88,28,135,0.18) 0%, transparent 70%)",
        filter: "blur(40px)",
      }} />
      <div style={{
        position: "absolute", bottom: "-20%", right: "-10%",
        width: 600, height: 600, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(30,27,75,0.25) 0%, transparent 70%)",
        filter: "blur(40px)",
      }} />
      <div style={{
        position: "absolute", top: "40%", right: "20%",
        width: 300, height: 300, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(67,56,202,0.10) 0%, transparent 70%)",
        filter: "blur(60px)",
      }} />

      {/* Fine dot matrix */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)",
        backgroundSize: "28px 28px",
        opacity: 0.6,
      }} />

      {/* Top edge glow line */}
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
      <div style={{
        width: "100%", height: 3, borderRadius: 99,
        background: "rgba(255,255,255,0.05)", overflow: "hidden",
      }}>
        <div style={{
          height: "100%", width: `${pct}%`, borderRadius: 99,
          background: lvl.gradient,
          transition: "width 0.4s ease, background 0.4s ease",
        }} />
      </div>
      <p style={{ fontSize: 10, marginTop: 5, color: lvl.text, fontWeight: 600 }}>{lvl.label}</p>
    </div>
  );
}

/* ── Styled input ─────────────────────────────────────────────────────────── */
function InputField({ label, type, placeholder, value, onChange, onKeyDown, icon, right }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{
        fontSize: 10, fontWeight: 700, letterSpacing: "0.1em",
        textTransform: "uppercase", color: focused ? "#a78bfa" : "#4b5563",
        transition: "color 0.2s",
      }}>
        {label}
      </label>
      <div style={{ position: "relative" }}>
        {/* Icon */}
        <span style={{
          position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
          fontSize: 14, color: focused ? "#8b5cf6" : "#374151",
          transition: "color 0.2s", pointerEvents: "none", userSelect: "none",
        }}>
          {icon}
        </span>
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onKeyDown={onKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            width: "100%", boxSizing: "border-box",
            background: focused ? "rgba(0,0,0,0.55)" : "rgba(0,0,0,0.35)",
            border: focused
              ? "1px solid rgba(139,92,246,0.45)"
              : "1px solid rgba(255,255,255,0.06)",
            borderRadius: 12,
            paddingLeft: 42, paddingRight: right ? 44 : 14,
            paddingTop: 12, paddingBottom: 12,
            fontSize: 14, color: "#fff",
            outline: "none", transition: "all 0.2s",
            boxShadow: focused ? "0 0 0 3px rgba(139,92,246,0.08), inset 0 1px 0 rgba(255,255,255,0.03)" : "inset 0 1px 0 rgba(255,255,255,0.02)",
          }}
          placeholder-color="#374151"
        />
        {right}
      </div>
    </div>
  );
}

/* ── Main component ───────────────────────────────────────────────────────── */
export default function AuthPage({ onAuth }) {
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

  const handleSubmit = () => {
    setError(""); setSuccess("");
    const em = email.trim().toLowerCase();
    if (mode === "signup" && !name.trim()) return setError("Please enter your full name.");
    if (!em || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) return setError("Enter a valid email address.");
    if (!password || password.length < 6) return setError("Password must be at least 6 characters.");
    setLoading(true);
    setTimeout(() => {
      const result = mode === "login" ? logIn(em, password) : signUp(em, password, name);
      setLoading(false);
      if (!result.ok) return setError(result.error);
      if (mode === "signup") {
        setSuccess("Account created! Signing you in…");
        setTimeout(() => onAuth(result.user), 900);
      } else {
        onAuth(result.user);
      }
    }, 550);
  };

  const switchMode = () => {
    setMode((m) => (m === "login" ? "signup" : "login"));
    setError(""); setSuccess(""); setName(""); setEmail(""); setPassword("");
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(145deg, #030308 0%, #06060f 35%, #080814 65%, #050510 100%)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "32px 16px",
      fontFamily: "'Segoe UI', -apple-system, system-ui, sans-serif",
      color: "#fff",
    }}>
      <Background />

      {/* Fade-in wrapper */}
      <div style={{
        position: "relative", width: "100%", maxWidth: 400,
        opacity: mounted ? 1 : 0,
        transform: mounted ? "translateY(0)" : "translateY(28px)",
        transition: "opacity 0.65s cubic-bezier(.4,0,.2,1), transform 0.65s cubic-bezier(.4,0,.2,1)",
      }}>

        {/* ── Logo + Title ── */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          {/* Logo badge */}
          <div style={{ display: "inline-flex", position: "relative", marginBottom: 16 }}>
            {/* Outer glow ring */}
            <div style={{
              position: "absolute", inset: -8, borderRadius: 28,
              background: "radial-gradient(circle, rgba(109,40,217,0.2) 0%, transparent 70%)",
              filter: "blur(8px)",
            }} />
            {/* Icon box */}
            <div style={{
              position: "relative", width: 60, height: 60, borderRadius: 20,
              background: "linear-gradient(145deg, #1a0a3d 0%, #0d0828 50%, #130a2e 100%)",
              border: "1px solid rgba(139,92,246,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 26,
              boxShadow: "0 8px 32px rgba(88,28,135,0.25), inset 0 1px 0 rgba(255,255,255,0.06)",
            }}>
              💸
            </div>
          </div>

          <h1 style={{
            fontSize: "clamp(22px, 5vw, 30px)", fontWeight: 900,
            letterSpacing: "-0.03em", lineHeight: 1.1, margin: "0 0 6px",
          }}>
            Expense{" "}
            <span style={{
              background: "linear-gradient(90deg, #a78bfa 0%, #818cf8 50%, #c4b5fd 100%)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>
              Tracker
            </span>
          </h1>
          <p style={{ color: "#374151", fontSize: 13, margin: 0 }}>
            {mode === "login" ? "Welcome back — sign in to continue" : "Create your account, it's free"}
          </p>
        </div>

        {/* ── Mode switcher ── */}
        <div style={{
          display: "flex", gap: 4, padding: 4, borderRadius: 14, marginBottom: 16,
          background: "rgba(0,0,0,0.5)",
          border: "1px solid rgba(255,255,255,0.04)",
        }}>
          {["login", "signup"].map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(""); setSuccess(""); setName(""); setEmail(""); setPassword(""); }}
              style={{
                flex: 1, padding: "10px 0", borderRadius: 10,
                fontSize: 13, fontWeight: 600, cursor: "pointer",
                transition: "all 0.25s cubic-bezier(.4,0,.2,1)",
                border: mode === m ? "1px solid rgba(139,92,246,0.18)" : "1px solid transparent",
                background: mode === m
                  ? "linear-gradient(135deg, rgba(76,29,149,0.8) 0%, rgba(67,56,202,0.7) 100%)"
                  : "transparent",
                color: mode === m ? "#e9d5ff" : "#4b5563",
                boxShadow: mode === m ? "0 4px 16px rgba(88,28,135,0.2)" : "none",
              }}
            >
              {m === "login" ? "🔐 Sign In" : "✨ Sign Up"}
            </button>
          ))}
        </div>

        {/* ── Form card ── */}
        <div style={{
          borderRadius: 20, padding: "24px 24px 20px",
          background: "linear-gradient(160deg, rgba(12,8,28,0.97) 0%, rgba(6,6,18,0.99) 100%)",
          border: "1px solid rgba(255,255,255,0.055)",
          boxShadow: "0 32px 80px rgba(0,0,0,0.75), 0 0 0 1px rgba(139,92,246,0.03) inset, 0 1px 0 rgba(255,255,255,0.04) inset",
        }}>

          {/* Error */}
          {error && (
            <div style={{
              display: "flex", alignItems: "flex-start", gap: 10,
              background: "rgba(120,20,20,0.18)",
              border: "1px solid rgba(220,38,38,0.18)",
              borderRadius: 12, padding: "10px 14px", marginBottom: 16,
              color: "#fca5a5", fontSize: 13,
            }}>
              <span style={{ flexShrink: 0 }}>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Success */}
          {success && (
            <div style={{
              display: "flex", alignItems: "center", gap: 10,
              background: "rgba(6,60,45,0.22)",
              border: "1px solid rgba(52,211,153,0.18)",
              borderRadius: 12, padding: "10px 14px", marginBottom: 16,
              color: "#6ee7b7", fontSize: 13,
            }}>
              <span>✅</span>
              <span>{success}</span>
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

            {/* Name */}
            {mode === "signup" && (
              <InputField
                label="Full Name" type="text" placeholder="e.g. Rahul Sharma"
                value={name} onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                icon="👤"
              />
            )}

            {/* Email */}
            <InputField
              label="Email Address" type="email" placeholder="you@example.com"
              value={email} onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              icon="📧"
            />

            {/* Password */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <PasswordInputField
                value={password}
                showPass={showPass}
                setShowPass={setShowPass}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              />
              {mode === "signup" && <PasswordStrength password={password} />}
            </div>

            {/* Submit */}
            <SubmitButton loading={loading} mode={mode} onClick={handleSubmit} />
          </div>

          {/* Divider */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "16px 0" }}>
            <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.04)" }} />
            <span style={{ fontSize: 10, color: "#1f2937", letterSpacing: "0.1em", textTransform: "uppercase" }}>or</span>
            <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.04)" }} />
          </div>

          {/* Switch */}
          <p style={{ textAlign: "center", fontSize: 12, color: "#374151", margin: 0 }}>
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
        <p style={{ textAlign: "center", fontSize: 10, color: "rgba(255,255,255,0.1)", marginTop: 20, lineHeight: 1.6 }}>
          🔒 All data is stored locally on your device only.<br />No server. No tracking. 100% private.
        </p>
      </div>
    </div>
  );
}

/* ── Password field (separate for cleanliness) ────────────────────────────── */
function PasswordInputField({ value, showPass, setShowPass, onChange, onKeyDown }) {
  const [focused, setFocused] = useState(false);
  return (
    <>
      <label style={{
        fontSize: 10, fontWeight: 700, letterSpacing: "0.1em",
        textTransform: "uppercase", color: focused ? "#a78bfa" : "#4b5563",
        transition: "color 0.2s",
      }}>
        Password
      </label>
      <div style={{ position: "relative" }}>
        <span style={{
          position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
          fontSize: 14, color: focused ? "#8b5cf6" : "#374151",
          transition: "color 0.2s", pointerEvents: "none", userSelect: "none",
        }}>🔑</span>
        <input
          type={showPass ? "text" : "password"}
          placeholder="Min. 6 characters"
          value={value}
          onChange={onChange}
          onKeyDown={onKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            width: "100%", boxSizing: "border-box",
            background: focused ? "rgba(0,0,0,0.55)" : "rgba(0,0,0,0.35)",
            border: focused ? "1px solid rgba(139,92,246,0.45)" : "1px solid rgba(255,255,255,0.06)",
            borderRadius: 12,
            paddingLeft: 42, paddingRight: 44, paddingTop: 12, paddingBottom: 12,
            fontSize: 14, color: "#fff", outline: "none", transition: "all 0.2s",
            boxShadow: focused ? "0 0 0 3px rgba(139,92,246,0.08)" : "none",
          }}
        />
        <button
          type="button"
          onClick={() => setShowPass((s) => !s)}
          style={{
            position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
            width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center",
            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 8, cursor: "pointer", fontSize: 12, color: "#4b5563", transition: "all 0.15s",
          }}
          onMouseOver={e => e.currentTarget.style.color = "#9ca3af"}
          onMouseOut={e => e.currentTarget.style.color = "#4b5563"}
        >
          {showPass ? "🙈" : "👁️"}
        </button>
      </div>
    </>
  );
}

/* ── Submit button ────────────────────────────────────────────────────────── */
function SubmitButton({ loading, mode, onClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      disabled={loading}
      onMouseOver={() => setHovered(true)}
      onMouseOut={() => setHovered(false)}
      style={{
        marginTop: 4, width: "100%", padding: "13px 0",
        borderRadius: 12, fontSize: 14, fontWeight: 700,
        cursor: loading ? "not-allowed" : "pointer",
        opacity: loading ? 0.55 : 1,
        color: "#fff", border: "1px solid rgba(139,92,246,0.25)",
        background: hovered && !loading
          ? "linear-gradient(135deg, #6d28d9 0%, #4f46e5 50%, #7c3aed 100%)"
          : "linear-gradient(135deg, #5b21b6 0%, #4338ca 50%, #6d28d9 100%)",
        boxShadow: hovered && !loading
          ? "0 6px 28px rgba(109,40,217,0.45), 0 0 0 1px rgba(167,139,250,0.1)"
          : "0 4px 16px rgba(88,28,135,0.3)",
        transform: hovered && !loading ? "translateY(-1px)" : "translateY(0)",
        transition: "all 0.2s cubic-bezier(.4,0,.2,1)",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
      }}
    >
      {loading ? (
        <>
          <span style={{
            width: 14, height: 14, border: "2px solid rgba(255,255,255,0.2)",
            borderTopColor: "rgba(255,255,255,0.85)", borderRadius: "50%",
            display: "inline-block", animation: "spin 0.7s linear infinite",
          }} />
          <span style={{ color: "rgba(255,255,255,0.7)" }}>Please wait…</span>
        </>
      ) : (
        <span>{mode === "login" ? "Sign In →" : "Create Account →"}</span>
      )}
    </button>
  );
}