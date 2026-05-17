import { DollarSign, Plus, Eye, EyeOff, History } from "lucide-react";
import { useTheme } from "../auth/ThemeContext";

export default function Header({ onAddBalance, showBalances, onToggleBalances, onShowHistory }) {
  const { dark } = useTheme();
  const textMuted = dark ? "#6b7280" : "#9ca3af";

  const iconBtnStyle = {
    background: dark ? "rgba(139,92,246,0.2)" : "rgba(139,92,246,0.1)",
    border: "1px solid rgba(139,92,246,0.3)",
    color: "#8b5cf6",
  };
  const hoverIn  = (e) => {
    e.currentTarget.style.background  = dark ? "rgba(139,92,246,0.3)" : "rgba(139,92,246,0.15)";
    e.currentTarget.style.boxShadow   = "0 4px 12px rgba(139,92,246,0.2)";
  };
  const hoverOut = (e) => {
    e.currentTarget.style.background  = dark ? "rgba(139,92,246,0.2)" : "rgba(139,92,246,0.1)";
    e.currentTarget.style.boxShadow   = "none";
  };

  return (
    <div className="mb-5 sm:mb-6 flex items-start justify-between">
      {/* Left Side */}
      <div className="text-left flex-1">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight flex items-center justify-start gap-2">
          <DollarSign size={28} color="#8b5cf6" strokeWidth={2.5} />
          Expense <span className="text-violet-400"></span>
        </h1>
        <p className="mt-1 text-xs sm:text-sm" style={{ color: textMuted }}>
          {new Date().toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-2 flex-shrink-0">

        {/* Eye Toggle */}
        <button
          onClick={onToggleBalances}
          className="flex items-center justify-center w-10 h-10 rounded-full transition-all active:scale-90"
          style={iconBtnStyle}
          onMouseOver={hoverIn} onMouseOut={hoverOut}
          title={showBalances ? "Hide balances" : "Show balances"}
        >
          {showBalances ? <Eye size={18} strokeWidth={2} /> : <EyeOff size={18} strokeWidth={2} />}
        </button>

        {/* History Button */}
        <button
          onClick={onShowHistory}
          className="flex items-center justify-center w-10 h-10 rounded-full transition-all active:scale-90"
          style={iconBtnStyle}
          onMouseOver={hoverIn} onMouseOut={hoverOut}
          title="Balance History"
        >
          <History size={18} strokeWidth={2} />
        </button>

        {/* Add Balance */}
        <button
          onClick={onAddBalance}
          className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl font-semibold text-sm transition-all active:scale-95"
          style={{
            background: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
            color: "#ffffff",
            border: "1px solid rgba(139,92,246,0.3)",
            boxShadow: "0 4px 12px rgba(139,92,246,0.2)",
          }}
          onMouseOver={(e) => { e.currentTarget.style.boxShadow = "0 6px 16px rgba(139,92,246,0.3)"; }}
          onMouseOut={(e)  => { e.currentTarget.style.boxShadow = "0 4px 12px rgba(139,92,246,0.2)"; }}
        >
          <Plus size={16} strokeWidth={2.5} />
          <span className="sm:inline">Add Balance</span>
        </button>
      </div>
    </div>
  );
}