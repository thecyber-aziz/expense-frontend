import { Home, Settings, History } from "lucide-react";
import { useTheme } from "../auth/ThemeContext";

export default function BottomNav({ activePage, onNavigate }) {
  const { dark } = useTheme();

  const bg     = dark ? "#0e0c1a" : "#ffffff";
  const border = dark ? "rgba(139,92,246,0.15)" : "rgba(109,40,217,0.12)";

  const tabs = [
    { id: "home",     label: "Home",     Icon: Home     },
    { id: "history",  label: "History",  Icon: History  },
    { id: "settings", label: "Settings", Icon: Settings },
  ];

  return (
    <div style={{
  position: "fixed", bottom: 0, left: 0, right: 0,
  zIndex: 9998,
  background: bg,
  borderTop: `1px solid ${border}`,
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  display: "flex",
  justifyContent: "center",
  paddingBottom: "max(env(safe-area-inset-bottom, 0px), 0px)",
  margin: 0,
  boxShadow: dark
    ? "0 -4px 24px rgba(0,0,0,0.4)"
    : "0 -4px 24px rgba(109,40,217,0.08)",
}}>
      <div style={{
        display: "flex", width: "100%", maxWidth: 500,
        padding: "6px 24px",
        gap: 8,
      }}>
        {tabs.map(({ id, label, Icon }) => {
          const active = activePage === id;
          return (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              style={{
                flex: 1,
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
                gap: 3, padding: "8px 0",
                borderRadius: 14,
                border: "none",
                background: active
                  ? dark ? "rgba(139,92,246,0.14)" : "rgba(109,40,217,0.08)"
                  : "transparent",
                cursor: "pointer",
                transition: "all 0.2s cubic-bezier(.4,0,.2,1)",
              }}
            >
              {/* Icon with active indicator dot */}
              <div style={{ position: "relative" }}>
                <Icon
                  size={22}
                  strokeWidth={active ? 2.5 : 1.8}
                  color={active ? "#8b5cf6" : dark ? "#4b5563" : "#9ca3af"}
                  style={{ transition: "all 0.2s ease" }}
                />
                {active && (
                  <span style={{
                    position: "absolute", bottom: -4, left: "50%",
                    transform: "translateX(-50%)",
                    width: 4, height: 4, borderRadius: "50%",
                    background: "#8b5cf6",
                    boxShadow: "0 0 6px #8b5cf6",
                  }} />
                )}
              </div>
              <span style={{
                fontSize: 10, fontWeight: active ? 700 : 500,
                color: active ? "#8b5cf6" : dark ? "#4b5563" : "#9ca3af",
                letterSpacing: "0.02em",
                transition: "all 0.2s ease",
                marginTop: 2,
              }}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}