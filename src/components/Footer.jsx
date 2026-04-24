import { DollarSign, Lock, TrendingUp } from "lucide-react";
import { useTheme } from "../auth/ThemeContext";

export default function Footer() {
  const { dark } = useTheme();
  const textMuted = dark ? "#6b7280" : "#9ca3af";

  return (
    <footer className="mt-10 mb-2">
      <div
        className="h-px w-full mb-5"
        style={{ background: "linear-gradient(90deg,transparent,rgba(139,92,246,0.2),transparent)" }}
      />
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-1">

        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded-lg flex items-center justify-center"
            style={{ background: "linear-gradient(135deg,#4c1d95,#312e81)", border: "1px solid rgba(139,92,246,0.2)" }}
          >
            <DollarSign size={12} color="#a78bfa" strokeWidth={2.5} />
          </div>
          <span className="text-xs font-semibold tracking-wide" style={{ color: textMuted }}>
            Expense Tracker
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase"
            style={{
              background: "rgba(139,92,246,0.08)",
              border: "1px solid rgba(139,92,246,0.18)",
              color: "#7c3aed",
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full bg-violet-500 inline-block"
              style={{ boxShadow: "0 0 6px #7c3aed" }}
            />
            v 2.0.3
          </span>
          <span style={{ color: textMuted, fontSize: 10 }}>· Stable</span>
        </div>

        <div className="flex items-center gap-3 text-[10px]" style={{ color: textMuted }}>
         
          <span>·</span>
          <span className="flex items-center gap-1"><TrendingUp size={10} /> No tracking</span>
          <span>·</span>
          <span>© {new Date().getFullYear()}</span>
        </div>

      </div>
    </footer>
  );
}