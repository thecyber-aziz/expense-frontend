import { useState } from "react";
import { X, Wallet, ArrowLeftRight } from "lucide-react";
import { useTheme } from "../auth/ThemeContext";

export default function AddBalanceModal({ isOpen, onClose, onSaveBalance }) {
  const { dark } = useTheme();
  const [cashAmount, setCashAmount]     = useState("");
  const [onlineAmount, setOnlineAmount] = useState("");
  const [note, setNote]                 = useState("");

  const textMain  = dark ? "#fff"                   : "#1a1a2e";
  const textMuted = dark ? "#6b7280"                : "#9ca3af";
  const inputBg   = dark ? "#1e1e2e"                : "#f5f3ff";
  const border    = dark ? "rgba(255,255,255,0.08)" : "rgba(109,40,217,0.12)";
  const modalBg   = dark ? "#141420"                : "#ffffff";

  const handleSave = () => {
    const cash   = parseFloat(cashAmount)   || 0;
    const online = parseFloat(onlineAmount) || 0;
    if (cash === 0 && online === 0) {
      alert("Please enter at least one amount");
      return;
    }
    onSaveBalance({ cashAmount: cash, onlineAmount: online, note, createdAt: new Date().toISOString() });
    setCashAmount("");
    setOnlineAmount("");
    setNote("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60" style={{ zIndex: 9998 }} onClick={onClose} />

      {/* Modal */}
      <div
        className="fixed bottom-0 left-0 right-0 rounded-t-3xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto transition-transform duration-300"
        style={{
          zIndex: 9999,
          background: modalBg,
          borderTop: `1px solid ${border}`,
          transform: isOpen ? "translateY(0)" : "translateY(100%)",
        }}
      >
        {/* Drag handle */}
        <div className="w-10 h-1 rounded-full mx-auto mb-6"
          style={{ background: dark ? "rgba(255,255,255,0.15)" : "rgba(109,40,217,0.2)" }} />

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl sm:text-2xl font-black" style={{ color: textMain }}>Add Balance</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl transition"
            style={{ background: dark ? "rgba(255,255,255,0.06)" : "rgba(109,40,217,0.06)", border: `1px solid ${border}` }}
          >
            <X size={18} color={textMuted} />
          </button>
        </div>

        <div className="space-y-4">
          {/* Cash */}
          <div>
            <label className="text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5" style={{ color: "#34d399" }}>
              <Wallet size={11} /> Cash Amount
            </label>
            <input
              type="number" placeholder="₹0" value={cashAmount}
              onChange={(e) => setCashAmount(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              className="w-full px-4 py-3 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-green-500 transition"
              style={{ background: inputBg, border: `1px solid ${border}`, color: textMain }}
            />
          </div>

          {/* Online */}
          <div>
            <label className="text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5" style={{ color: "#3b82f6" }}>
              <ArrowLeftRight size={11} /> Online Amount
            </label>
            <input
              type="number" placeholder="₹0" value={onlineAmount}
              onChange={(e) => setOnlineAmount(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              className="w-full px-4 py-3 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              style={{ background: inputBg, border: `1px solid ${border}`, color: textMain }}
            />
          </div>

          {/* Note */}
          <div>
            <label className="text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-2 block" style={{ color: textMuted }}>
              Note (optional)
            </label>
            <textarea
              placeholder="Salary, Added Cash, Bank Transfer..."
              value={note} onChange={(e) => setNote(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition resize-none"
              style={{ background: inputBg, border: `1px solid ${border}`, color: textMain }}
            />
          </div>

          {/* Save */}
          <button
            onClick={handleSave}
            className="w-full py-3.5 mt-2 rounded-xl font-bold text-base transition-all active:scale-95"
            style={{
              background: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
              color: "#ffffff",
              boxShadow: "0 4px 12px rgba(139,92,246,0.25)",
              border: "1px solid rgba(139,92,246,0.3)",
            }}
            onMouseOver={(e) => { e.currentTarget.style.boxShadow = "0 8px 20px rgba(139,92,246,0.35)"; }}
            onMouseOut={(e)  => { e.currentTarget.style.boxShadow = "0 4px 12px rgba(139,92,246,0.25)"; }}
          >
            Save Balance
          </button>
        </div>
      </div>
    </>
  );
}