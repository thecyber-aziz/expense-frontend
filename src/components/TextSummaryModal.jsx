import { useState } from "react";
import { FileText, X, Check, Copy, Download, Share2 } from "lucide-react";
import { formatCurrency } from "../auth/utils";

export default function TextSummaryModal({ expenses, balance, total, remaining, tabName, onClose, dark }) {
  const [copied, setCopied] = useState(false);

  const generateText = () => {
    const line = "─".repeat(36);
    const date = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
    const catGroups = {};
    expenses.forEach(e => {
      if (!catGroups[e.category]) catGroups[e.category] = 0;
      catGroups[e.category] += e.amount;
    });
    const catLines = Object.entries(catGroups)
      .map(([cat, amt]) => `  ${cat.padEnd(18)} ${formatCurrency(amt)}`).join("\n");
    const expLines = expenses
      .map((e, i) => `  ${String(i + 1).padStart(2, "0")}. ${e.name.padEnd(18)} ${formatCurrency(e.amount).padStart(12)}  [${e.category}]  ${e.date}`)
      .join("\n");
    return [
      `EXPENSE REPORT — ${tabName.toUpperCase()}`,
      `Generated: ${date}`, line,
      `Wallet Balance : ${formatCurrency(balance)}`,
      `Total Spent    : ${formatCurrency(total)}`,
      `Remaining      : ${formatCurrency(remaining)}`, line,
      `BY CATEGORY`, catLines || "  No expenses yet.", line,
      `ALL EXPENSES (${expenses.length} items)`, expLines || "  No expenses yet.", line,
      `GRAND TOTAL: ${formatCurrency(total)}`,
    ].join("\n");
  };

  const text = generateText();

  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleDownload = () => {
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `expense-report-${tabName.toLowerCase().replace(/\s+/g, "-")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-3 py-6"
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg rounded-2xl flex flex-col"
        style={{
          background: dark ? "linear-gradient(160deg,#0e0b1e 0%,#07070f 100%)" : "#ffffff",
          border: dark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(109,40,217,0.14)",
          boxShadow: "0 32px 80px rgba(0,0,0,0.8)",
          maxHeight: "88vh",
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 sm:px-5 py-4"
          style={{ borderBottom: dark ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(109,40,217,0.08)" }}
        >
          <div>
            <h3
              className="font-black text-sm sm:text-base flex items-center gap-2"
              style={{ color: dark ? "#fff" : "#1a1a2e" }}
            >
              <FileText size={15} color="#8b5cf6" /> Text Summary
            </h3>
            <p className="text-[10px] sm:text-xs mt-0.5" style={{ color: dark ? "#4b5563" : "#9ca3af" }}>
              {tabName} · {expenses.length} expenses
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center transition"
            style={{
              color: dark ? "#4b5563" : "#9ca3af",
              background: dark ? "rgba(255,255,255,0.05)" : "rgba(109,40,217,0.06)",
            }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto px-4 sm:px-5 py-4">
          <pre
            className="text-xs sm:text-sm font-mono leading-relaxed whitespace-pre-wrap break-words"
            style={{ color: dark ? "#d1d5db" : "#374151", fontFamily: "'Courier New','Consolas',monospace" }}
          >
            {text}
          </pre>
        </div>

        {/* Actions */}
        <div
          className="px-4 sm:px-5 py-4 flex flex-col sm:flex-row gap-2"
          style={{ borderTop: dark ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(109,40,217,0.08)" }}
        >
          <button
            onClick={handleCopy}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition-all active:scale-95"
            style={{
              background: copied ? "rgba(5,150,105,0.15)"         : "rgba(139,92,246,0.12)",
              border:     copied ? "1px solid rgba(52,211,153,0.3)" : "1px solid rgba(139,92,246,0.22)",
              color:      copied ? "#34d399" : "#a78bfa",
            }}
          >
            {copied ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy</>}
          </button>

          <button
            onClick={handleDownload}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition-all active:scale-95"
            style={{ background: "rgba(5,150,105,0.12)", border: "1px solid rgba(52,211,153,0.2)", color: "#6ee7b7" }}
          >
            <Download size={14} /> Download
          </button>

          <button
            onClick={() => navigator.share ? navigator.share({ title: `Expense Report — ${tabName}`, text }) : handleCopy()}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition-all active:scale-95"
            style={{ background: "rgba(37,99,235,0.1)", border: "1px solid rgba(96,165,250,0.18)", color: "#93c5fd" }}
          >
            <Share2 size={14} /> Share
          </button>
        </div>
      </div>
    </div>
  );
}