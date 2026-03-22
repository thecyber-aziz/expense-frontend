import { useTheme } from "../auth/ThemeContext";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle() {
  const { dark, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      title={dark ? "Switch to Light Mode" : "Switch to Dark Mode"}
      style={{
        position: "fixed",
        top: 14,
        right: 16,
        zIndex: 99999,
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "6px 12px 6px 8px",
        borderRadius: 999,
        border: dark
          ? "1px solid rgba(139,92,246,0.35)"
          : "1px solid rgba(109,40,217,0.22)",
        background: dark
          ? "linear-gradient(135deg,#1a0a3d,#0d0828)"
          : "linear-gradient(135deg,#ffffff,#ede9fe)",
        boxShadow: dark
          ? "0 2px 16px rgba(88,28,135,0.5)"
          : "0 2px 16px rgba(109,40,217,0.18)",
        cursor: "pointer",
        fontSize: 13,
        fontWeight: 700,
        color: dark ? "#c4b5fd" : "#6d28d9",
        letterSpacing: "0.01em",
        transition: "all 0.25s cubic-bezier(.4,0,.2,1)",
        userSelect: "none",
      }}
    >
      {dark
        ? <Sun size={15} strokeWidth={2.2} />
        : <Moon size={15} strokeWidth={2.2} />
      }
      <span>{dark ? "Light" : "Dark"}</span>
    </button>
  );
}