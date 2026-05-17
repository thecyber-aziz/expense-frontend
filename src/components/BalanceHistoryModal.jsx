import { X, Wallet, ArrowLeftRight, History } from "lucide-react";
import { useTheme } from "../auth/ThemeContext";

export default function BalanceHistoryModal({ isOpen, onClose, history }) {
  const { dark } = useTheme();

  const textMain  = dark ? "#fff"                        : "#1a1a2e";
  const textMuted = dark ? "#6b7280"                     : "#9ca3af";
  const border    = dark ? "rgba(255,255,255,0.08)"      : "rgba(109,40,217,0.12)";
  const modalBg   = dark ? "#141420"                     : "#ffffff";
  const cardBg    = dark ? "#1a1a24"                     : "#f9f7ff";

  if (!isOpen) return null;

  const formatDate = (iso) => {
    const d = new Date(iso);
    return {
      date: d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "long", year: "numeric" }),
      time: d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false }),
    };
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 transition-opacity"
        style={{ zIndex: 9998 }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="fixed bottom-0 left-0 right-0 rounded-t-3xl max-h-[85vh] flex flex-col transition-transform duration-300"
        style={{
          zIndex: 9999,
          background: modalBg,
          borderTop: `1px solid ${border}`,
          transform: isOpen ? "translateY(0)" : "translateY(100%)",
        }}
      >
        {/* Drag handle */}
        <div className="w-10 h-1 rounded-full mx-auto mt-4 mb-2 flex-shrink-0"
          style={{ background: dark ? "rgba(255,255,255,0.15)" : "rgba(109,40,217,0.2)" }} />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 flex-shrink-0"
          style={{ borderBottom: `1px solid ${border}` }}>
          <div className="flex items-center gap-2">
            <History size={18} color="#8b5cf6" strokeWidth={2} />
            <h2 className="text-lg sm:text-xl font-black" style={{ color: textMain }}>Balance History</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl transition"
            style={{ background: dark ? "rgba(255,255,255,0.06)" : "rgba(109,40,217,0.06)", border: `1px solid ${border}` }}
          >
            <X size={18} color={textMuted} />
          </button>
        </div>

        {/* List */}
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-3">
          {(!history || history.length === 0) ? (
            <div className="text-center py-16">
              <History size={32} className="mx-auto mb-3 opacity-30" color={textMuted} />
              <p className="text-sm" style={{ color: textMuted }}>No balance added yet.</p>
            </div>
          ) : (
            [...history].reverse().map((entry, i) => {
              const { date, time } = formatDate(entry.createdAt);
              return (
                <div key={i}
                  className="rounded-xl p-4"
                  style={{ background: cardBg, border: `1px solid ${border}` }}
                >
                  {/* Date & Time */}
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-xs sm:text-sm font-bold" style={{ color: textMain }}>{date}</p>
                      <p className="text-[10px] sm:text-xs mt-0.5" style={{ color: textMuted }}>{time}</p>
                    </div>
                    {/* Amounts */}
                    <div className="text-right space-y-1">
                      {entry.cashAmount > 0 && (
                        <div className="flex items-center justify-end gap-1">
                          <Wallet size={11} color="#34d399" />
                          <p className="text-xs sm:text-sm font-bold text-green-400">
                            + ₹{entry.cashAmount.toLocaleString("en-IN")} Cash
                          </p>
                        </div>
                      )}
                      {entry.onlineAmount > 0 && (
                        <div className="flex items-center justify-end gap-1">
                          <ArrowLeftRight size={11} color="#3b82f6" />
                          <p className="text-xs sm:text-sm font-bold text-blue-400">
                            + ₹{entry.onlineAmount.toLocaleString("en-IN")} Online
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Note */}
                  {entry.note && (
                    <p className="text-[10px] sm:text-xs mt-2 italic" style={{ color: textMuted }}>
                      {entry.note}
                    </p>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}