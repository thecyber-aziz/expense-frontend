import { DollarSign } from "lucide-react";
import { useTheme } from "../auth/ThemeContext";

export default function Header() {
  const { dark } = useTheme();
  const textMuted = dark ? "#6b7280" : "#9ca3af";

  return (
    <div className="mb-5 sm:mb-6 text-center">
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight flex items-center justify-center gap-2">
        <DollarSign size={28} color="#8b5cf6" strokeWidth={2.5} />
        Expense <span className="text-violet-400">Tracker</span>
      </h1>
      <p className="mt-1 text-xs sm:text-sm" style={{ color: textMuted }}>
        Track every rupee you spend
      </p>
    </div>
  );
}