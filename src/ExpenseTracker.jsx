// ── ExpenseTracker.jsx ───────────────────────────────────────────────────────
import { useState, useRef, useEffect } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { logOut, userKey } from "./auth";

const CATEGORIES = [
  { label: "Money Transfer", emoji: "💸", color: "bg-red-500" },
  { label: "Food", emoji: "🍔", color: "bg-orange-500" },
  { label: "Shopping", emoji: "🛍️", color: "bg-pink-500" },
  { label: "Transport", emoji: "🚗", color: "bg-blue-500" },
  { label: "Health", emoji: "💊", color: "bg-green-500" },
  { label: "Entertainment", emoji: "🎮", color: "bg-purple-500" },
  { label: "Other", emoji: "💼", color: "bg-gray-500" },
];

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);
}

// ── localStorage helpers — all keys scoped to user's email ──────────────────
function loadTabMeta(email) {
  try {
    const saved = localStorage.getItem(userKey(email, "tabs_meta"));
    return saved ? JSON.parse(saved) : [{ id: "tab_1", name: "Personal" }];
  } catch { return [{ id: "tab_1", name: "Personal" }]; }
}

function loadTabData(email, tabId) {
  try {
    const expenses = localStorage.getItem(userKey(email, `expenses_${tabId}`));
    const balance  = localStorage.getItem(userKey(email, `balance_${tabId}`));
    return {
      expenses: expenses ? JSON.parse(expenses) : [],
      balance:  balance  ? Number(balance) : 0,
    };
  } catch { return { expenses: [], balance: 0 }; }
}

function saveTabExpenses(email, tabId, expenses) {
  localStorage.setItem(userKey(email, `expenses_${tabId}`), JSON.stringify(expenses));
}
function saveTabBalance(email, tabId, balance) {
  localStorage.setItem(userKey(email, `balance_${tabId}`), balance);
}
function deleteTabStorage(email, tabId) {
  localStorage.removeItem(userKey(email, `expenses_${tabId}`));
  localStorage.removeItem(userKey(email, `balance_${tabId}`));
}

// ── Text Summary Modal ────────────────────────────────────────────────────────
function TextSummaryModal({ expenses, balance, total, remaining, tabName, onClose }) {
  const [copied, setCopied] = useState(false);

  const generateText = () => {
    const line = "─".repeat(36);
    const date = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

    const catGroups = {};
    expenses.forEach((e) => {
      if (!catGroups[e.category]) catGroups[e.category] = 0;
      catGroups[e.category] += e.amount;
    });

    const catLines = Object.entries(catGroups)
      .map(([cat, amt]) => `  ${cat.padEnd(18)} ${formatCurrency(amt)}`)
      .join("\n");

    const expLines = expenses
      .map((e, i) => `  ${String(i + 1).padStart(2, "0")}. ${e.name.padEnd(18)} ${formatCurrency(e.amount).padStart(12)}  [${e.category}]  ${e.date}`)
      .join("\n");

    return [
      `💸 EXPENSE REPORT — ${tabName.toUpperCase()}`,
      `📅 Generated: ${date}`,
      line,
      `💰 Wallet Balance : ${formatCurrency(balance)}`,
      `🛒 Total Spent    : ${formatCurrency(total)}`,
      `✅ Remaining      : ${formatCurrency(remaining)}`,
      line,
      `📊 BY CATEGORY`,
      catLines || "  No expenses yet.",
      line,
      `📋 ALL EXPENSES (${expenses.length} items)`,
      expLines || "  No expenses yet.",
      line,
      `GRAND TOTAL: ${formatCurrency(total)}`,
    ].join("\n");
  };

  const text = generateText();

  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleDownload = () => {
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
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
          background: "linear-gradient(160deg, #0e0b1e 0%, #07070f 100%)",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 32px 80px rgba(0,0,0,0.8)",
          maxHeight: "88vh",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-4 border-b border-white/[0.06]">
          <div>
            <h3 className="font-black text-white text-sm sm:text-base">📋 Text Summary</h3>
            <p className="text-gray-600 text-[10px] sm:text-xs mt-0.5">{tabName} · {expenses.length} expenses</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/10 transition text-sm"
          >✕</button>
        </div>

        {/* Text area */}
        <div className="flex-1 overflow-auto px-4 sm:px-5 py-4">
          <pre
            className="text-xs sm:text-sm font-mono text-gray-300 leading-relaxed whitespace-pre-wrap break-words"
            style={{ fontFamily: "'Courier New', 'Consolas', monospace" }}
          >
            {text}
          </pre>
        </div>

        {/* Actions */}
        <div className="px-4 sm:px-5 py-4 border-t border-white/[0.06] flex flex-col sm:flex-row gap-2">
          <button
            onClick={handleCopy}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition-all active:scale-95"
            style={{
              background: copied ? "rgba(5,150,105,0.2)" : "rgba(139,92,246,0.15)",
              border: copied ? "1px solid rgba(52,211,153,0.3)" : "1px solid rgba(139,92,246,0.25)",
              color: copied ? "#34d399" : "#a78bfa",
            }}
          >
            {copied ? "✅ Copied!" : "📋 Copy to Clipboard"}
          </button>

          <button
            onClick={handleDownload}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition-all active:scale-95"
            style={{
              background: "rgba(5,150,105,0.15)",
              border: "1px solid rgba(52,211,153,0.2)",
              color: "#6ee7b7",
            }}
          >
            💾 Download .txt
          </button>

          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({ title: `Expense Report — ${tabName}`, text });
              } else {
                handleCopy();
              }
            }}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition-all active:scale-95"
            style={{
              background: "rgba(37,99,235,0.12)",
              border: "1px solid rgba(96,165,250,0.2)",
              color: "#93c5fd",
            }}
          >
            📤 Share
          </button>
        </div>
      </div>
    </div>
  );
}

// ── TabPanel ─────────────────────────────────────────────────────────────────
function TabPanel({ email, tabId, tabName }) {
  const [balance, setBalance]           = useState(() => loadTabData(email, tabId).balance);
  const [editBalance, setEditBalance]   = useState(false);
  const [balanceInput, setBalanceInput] = useState("");
  const [expenses, setExpenses]         = useState(() => loadTabData(email, tabId).expenses);
  const [name, setName]                 = useState("");
  const [amount, setAmount]             = useState("");
  const [category, setCategory]         = useState("Food");
  const [filter, setFilter]             = useState("All");
  const [editId, setEditId]             = useState(null);
  const [error, setError]               = useState("");
  const [animateTotal, setAnimateTotal] = useState(false);
  const [showConfirm, setShowConfirm]   = useState(null);
  const [showTextModal, setShowTextModal] = useState(false);
  const nameRef = useRef(null);

  useEffect(() => { saveTabExpenses(email, tabId, expenses); }, [email, tabId, expenses]);
  useEffect(() => { saveTabBalance(email, tabId, balance);   }, [email, tabId, balance]);

  useEffect(() => {
    const data = loadTabData(email, tabId);
    setExpenses(data.expenses);
    setBalance(data.balance);
    setName(""); setAmount(""); setCategory("Food");
    setFilter("All"); setEditId(null); setError("");
  }, [email, tabId]);

  const today     = new Date().toISOString().split("T")[0];
  const total     = expenses.reduce((sum, e) => sum + e.amount, 0);
  const remaining = balance - total;
  const filtered  = filter === "All" ? expenses : expenses.filter((e) => e.category === filter);

  const handleSubmit = () => {
    if (!name.trim()) return setError("Please enter a name.");
    if (!amount || isNaN(amount) || Number(amount) <= 0) return setError("Enter a valid amount.");
    setError("");
    if (editId !== null) {
      setExpenses((prev) =>
        prev.map((e) => e.id === editId ? { ...e, name: name.trim(), amount: parseFloat(amount), category } : e)
      );
      setEditId(null);
    } else {
      setExpenses((prev) => [
        { id: Date.now(), name: name.trim(), amount: parseFloat(amount), category, date: today },
        ...prev,
      ]);
    }
    setName(""); setAmount(""); setCategory("Food");
    setAnimateTotal(true);
    setTimeout(() => setAnimateTotal(false), 600);
    nameRef.current?.focus();
  };

  const handleEdit = (expense) => {
    setEditId(expense.id); setName(expense.name);
    setAmount(String(expense.amount)); setCategory(expense.category);
    nameRef.current?.focus();
  };

  const handleDelete = (id) => { setExpenses((prev) => prev.filter((e) => e.id !== id)); setShowConfirm(null); };
  const getCategoryInfo = (label) => CATEGORIES.find((c) => c.label === label) || CATEGORIES[6];
  const saveBalance = () => {
    const val = Number(balanceInput);
    if (!isNaN(val) && val >= 0) { setBalance(val); setEditBalance(false); }
  };

  const categoryTotals = CATEGORIES.map((cat) => ({
    ...cat,
    total: expenses.filter((e) => e.category === cat.label).reduce((s, e) => s + e.amount, 0),
  })).filter((c) => c.total > 0);

  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.setFillColor(88, 28, 135);
    doc.rect(0, 0, 210, 30, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.text(`Expense Report — ${tabName}`, 14, 18);
    doc.setFontSize(10);
    doc.text(`Date: ${new Date().toLocaleDateString("en-IN")}`, 150, 18);
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.text(`Total Spent:    ${formatCurrency(total)}`,     14, 42);
    doc.text(`Wallet Balance: ${formatCurrency(balance)}`,   14, 51);
    doc.text(`Remaining:      ${formatCurrency(remaining)}`, 14, 60);
    autoTable(doc, {
      startY: 68,
      head: [["#", "Name", "Category", "Date", "Amount"]],
      body: expenses.map((e, i) => [i + 1, e.name, e.category, e.date, formatCurrency(e.amount)]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [88, 28, 135] },
      alternateRowStyles: { fillColor: [245, 245, 255] },
      columnStyles: { 4: { halign: "right" } },
    });
    const finalY = doc.lastAutoTable.finalY + 8;
    doc.setFontSize(11);
    doc.setFont(undefined, "bold");
    doc.text(`Grand Total: ${formatCurrency(total)}`, 14, finalY);
    doc.save(`expense-report-${tabName.toLowerCase().replace(/\s+/g, "-")}.pdf`);
  };

  return (
    <div>
      {/* Modal */}
      {showTextModal && (
        <TextSummaryModal
          expenses={expenses}
          balance={balance}
          total={total}
          remaining={remaining}
          tabName={tabName}
          onClose={() => setShowTextModal(false)}
        />
      )}

      {/* Action Buttons Row */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-4 sm:mb-5">
        {/* PDF Button */}
        <button onClick={downloadPDF}
          className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-green-700 hover:bg-green-600 active:scale-95 transition-all rounded-xl px-4 sm:px-5 py-2.5 text-sm sm:text-base font-bold text-white shadow-lg">
          <span>📄</span> Download PDF
        </button>

        {/* Text Version Button */}
        <button onClick={() => setShowTextModal(true)}
          className="flex-1 sm:flex-none flex items-center justify-center gap-2 active:scale-95 transition-all rounded-xl px-4 sm:px-5 py-2.5 text-sm sm:text-base font-bold shadow-lg"
          style={{
            background: "rgba(139,92,246,0.12)",
            border: "1px solid rgba(139,92,246,0.25)",
            color: "#a78bfa",
          }}>
          <span>📋</span> Text Version
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4 sm:mb-5">
        <div className={`col-span-1 rounded-xl sm:rounded-2xl bg-gradient-to-br from-violet-700 to-indigo-800 p-3 sm:p-4 shadow-xl transition-all duration-300 ${animateTotal ? "scale-105" : "scale-100"}`}>
          <p className="text-violet-300 text-[9px] sm:text-xs uppercase tracking-widest mb-1">Spent</p>
          <p className="text-sm sm:text-lg md:text-xl font-black leading-tight">{formatCurrency(total)}</p>
          <p className="text-violet-400 text-[9px] sm:text-xs mt-1">{expenses.length} items</p>
        </div>

        <div className="col-span-1 rounded-xl sm:rounded-2xl bg-[#1a1a24] border border-white/10 p-3 sm:p-4">
          <p className="text-green-400 text-[9px] sm:text-xs uppercase tracking-widest mb-1">Balance</p>
          {editBalance ? (
            <div className="flex gap-1 mt-1">
              <input type="number" value={balanceInput}
                onChange={(e) => setBalanceInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && saveBalance()}
                className="w-full bg-[#2a2a38] rounded-lg px-2 py-1 text-white text-xs focus:outline-none focus:ring-1 focus:ring-green-500" />
              <button onClick={saveBalance} className="bg-green-600 hover:bg-green-500 px-1.5 sm:px-2 rounded-lg text-[10px] sm:text-xs font-bold">✓</button>
            </div>
          ) : (
            <>
              <p className="text-sm sm:text-lg md:text-xl font-black text-green-300">{formatCurrency(balance)}</p>
              <button onClick={() => { setEditBalance(true); setBalanceInput(balance); }}
                className="text-[9px] sm:text-xs text-green-500 hover:text-green-300 underline mt-1">Edit</button>
            </>
          )}
        </div>

        <div className={`col-span-1 rounded-xl sm:rounded-2xl border p-3 sm:p-4 ${remaining < 0 ? "bg-red-900/30 border-red-500/30" : "bg-[#1a1a24] border-white/10"}`}>
          <p className={`text-[9px] sm:text-xs uppercase tracking-widest mb-1 ${remaining < 0 ? "text-red-400" : "text-sky-400"}`}>Left</p>
          <p className={`text-sm sm:text-lg md:text-xl font-black ${remaining < 0 ? "text-red-400" : "text-sky-300"}`}>
            {formatCurrency(remaining)}
          </p>
          {remaining < 0 && <p className="text-red-500 text-[9px] sm:text-xs mt-1">Over budget!</p>}
        </div>
      </div>

      {/* Category Chips */}
      {categoryTotals.length > 0 && (
        <div className="flex gap-1.5 sm:gap-2 flex-wrap mb-4 sm:mb-5">
          {categoryTotals.map((cat) => (
            <div key={cat.label} className="flex items-center gap-1 sm:gap-1.5 bg-white/5 border border-white/10 rounded-full px-2 sm:px-3 py-1 text-[10px] sm:text-xs">
              <span>{cat.emoji}</span>
              <span className="text-gray-300 font-semibold">{formatCurrency(cat.total)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Form */}
      <div className="bg-[#141420] border border-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-5 mb-4 sm:mb-5 shadow-xl">
        <h2 className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-gray-500 mb-3 sm:mb-4">
          {editId ? "✏️ Editing Expense" : "➕ New Expense"}
        </h2>
        {error && (
          <div className="bg-red-500/15 border border-red-500/30 text-red-300 text-xs sm:text-sm rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 mb-3 sm:mb-4">
            ⚠️ {error}
          </div>
        )}
        <div className="flex flex-col gap-2 sm:gap-3">
          <input ref={nameRef} type="text" placeholder="Expense name (e.g. Pizza, Rent...)"
            value={name} onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            className="bg-[#1e1e2e] border border-white/10 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-violet-500 transition w-full" />
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <input type="number" placeholder="Amount (₹)" value={amount}
              onChange={(e) => setAmount(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              className="flex-1 bg-[#1e1e2e] border border-white/10 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-violet-500 transition w-full" />
            <select value={category} onChange={(e) => setCategory(e.target.value)}
              className="flex-1 bg-[#1e1e2e] border border-white/10 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition w-full">
              {CATEGORIES.map((c) => (
                <option key={c.label} value={c.label}>{c.emoji} {c.label}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2 sm:gap-3">
            <button onClick={handleSubmit}
              className="flex-1 bg-violet-600 hover:bg-violet-500 active:scale-95 transition-all rounded-xl py-2.5 sm:py-3 text-sm sm:text-base font-bold">
              {editId ? "Update Expense" : "Add Expense"}
            </button>
            {editId && (
              <button onClick={() => { setEditId(null); setName(""); setAmount(""); setCategory("Food"); setError(""); }}
                className="px-4 sm:px-5 bg-white/8 hover:bg-white/15 border border-white/10 transition rounded-xl font-medium text-gray-400 text-sm">
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex gap-1.5 sm:gap-2 flex-nowrap sm:flex-wrap overflow-x-auto pb-2 sm:pb-0 mb-4 scrollbar-hide">
        {["All", ...CATEGORIES.map((c) => c.label)].map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-2.5 sm:px-3 py-1.5 rounded-full text-[10px] sm:text-xs font-semibold transition-all border whitespace-nowrap flex-shrink-0 ${
              filter === f
                ? "bg-violet-600 border-violet-500 text-white"
                : "bg-transparent border-white/10 text-gray-500 hover:border-white/25 hover:text-gray-300"
            }`}>
            {f === "All" ? "🗂 All" : `${getCategoryInfo(f).emoji} ${f}`}
          </button>
        ))}
      </div>

      {/* Expense List */}
      <div className="flex flex-col gap-2">
        {filtered.length === 0 && (
          <div className="text-center py-12 sm:py-16 text-gray-700">
            <p className="text-4xl sm:text-5xl mb-3">🪹</p>
            <p className="text-xs sm:text-sm">No expenses yet. Add one above!</p>
          </div>
        )}
        {filtered.map((expense) => {
          const cat = getCategoryInfo(expense.category);
          return (
            <div key={expense.id}
              className="group bg-[#141420] border border-white/8 hover:border-violet-500/30 rounded-xl sm:rounded-2xl px-3 sm:px-5 py-3 sm:py-4 flex items-center justify-between transition-all gap-2">
              <div className="flex items-center gap-2 sm:gap-4 min-w-0">
                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl ${cat.color} flex items-center justify-center text-base sm:text-lg shrink-0`}>
                  {cat.emoji}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-white text-sm sm:text-base truncate">{expense.name}</p>
                  <p className="text-[10px] sm:text-xs text-gray-600 truncate">{expense.category} · {expense.date}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
                <p className="font-black text-sm sm:text-lg">{formatCurrency(expense.amount)}</p>
                <div className="flex gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleEdit(expense)}
                    className="p-1 sm:p-1.5 rounded-lg hover:bg-white/10 text-gray-500 hover:text-white transition text-xs sm:text-sm">✏️</button>
                  {showConfirm === expense.id ? (
                    <div className="flex gap-1">
                      <button onClick={() => handleDelete(expense.id)}
                        className="px-1.5 sm:px-2 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white text-[10px] sm:text-xs font-bold">Del</button>
                      <button onClick={() => setShowConfirm(null)}
                        className="px-1.5 sm:px-2 py-1 rounded-lg bg-white/10 text-gray-400 text-[10px] sm:text-xs">No</button>
                    </div>
                  ) : (
                    <button onClick={() => setShowConfirm(expense.id)}
                      className="p-1 sm:p-1.5 rounded-lg hover:bg-red-500/20 text-gray-500 hover:text-red-400 transition text-xs sm:text-sm">🗑️</button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom total bar */}
      {filtered.length > 0 && (
        <div className="mt-4 sm:mt-5 rounded-xl sm:rounded-2xl bg-[#141420] border border-white/10 px-4 sm:px-5 py-3 sm:py-4 flex justify-between items-center">
          <span className="text-gray-500 text-xs sm:text-sm">
            {filter === "All" ? "Grand Total" : `${filter} Total`} · {filtered.length} item{filtered.length !== 1 ? "s" : ""}
          </span>
          <span className="text-lg sm:text-2xl font-black text-violet-400">
            {formatCurrency(filtered.reduce((s, e) => s + e.amount, 0))}
          </span>
        </div>
      )}
    </div>
  );
}

// ── Root: manages tabs + receives user prop ───────────────────────────────────
export default function ExpenseTracker({ user, onLogout }) {
  const { email, name } = user;

  const [tabs, setTabs]               = useState(() => loadTabMeta(email));
  const [activeTab, setActiveTab]     = useState(() => loadTabMeta(email)[0].id);
  const [renamingId, setRenamingId]   = useState(null);
  const [renameValue, setRenameValue] = useState("");
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    localStorage.setItem(userKey(email, "tabs_meta"), JSON.stringify(tabs));
  }, [email, tabs]);

  const allTotal = tabs.reduce((sum, tab) => {
    const data = loadTabData(email, tab.id);
    return sum + data.expenses.reduce((s, e) => s + e.amount, 0);
  }, 0);

  const addTab = () => {
    const newId   = `tab_${Date.now()}`;
    const newName = `Tab ${tabs.length + 1}`;
    setTabs((prev) => [...prev, { id: newId, name: newName }]);
    setActiveTab(newId);
  };

  const deleteTab = (tabId) => {
    if (tabs.length === 1) return;
    deleteTabStorage(email, tabId);
    const rest = tabs.filter((t) => t.id !== tabId);
    setTabs(rest);
    if (activeTab === tabId) setActiveTab(rest[0].id);
  };

  const startRename = (tab) => { setRenamingId(tab.id); setRenameValue(tab.name); };
  const saveRename  = () => {
    if (!renameValue.trim()) return;
    setTabs((prev) => prev.map((t) => t.id === renamingId ? { ...t, name: renameValue.trim() } : t));
    setRenamingId(null);
  };

  const handleLogout = () => { logOut(); onLogout(); };
  const activeTabName = tabs.find((t) => t.id === activeTab)?.name || "";

  return (
    <div className="min-h-screen bg-[#0a0a10] text-white" style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      {/* Glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-48 h-48 sm:w-72 sm:h-72 md:w-96 md:h-96 bg-violet-800 opacity-10 rounded-full blur-[100px] md:blur-[140px]" />
        <div className="absolute bottom-0 right-1/4 w-48 h-48 sm:w-72 sm:h-72 md:w-96 md:h-96 bg-cyan-700 opacity-10 rounded-full blur-[100px] md:blur-[140px]" />
      </div>

      <div className="relative w-full max-w-xl lg:max-w-2xl mx-auto px-3 sm:px-5 py-5 sm:py-8">

        {/* ── Header with user info + logout ── */}
        <div className="mb-5 sm:mb-6">
          <div className="flex items-center justify-between">
            <div className="text-center flex-1">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight">
                💸 Expense <span className="text-violet-400">Tracker</span>
              </h1>
              <p className="text-gray-500 mt-1 text-xs sm:text-sm">Track every rupee you spend</p>
            </div>
          </div>

          {/* User pill + logout */}
          <div className="mt-3 flex items-center justify-between bg-[#141420] border border-white/10 rounded-xl px-3 sm:px-4 py-2 sm:py-2.5">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              {/* Avatar circle */}
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-violet-600 to-indigo-700 flex items-center justify-center text-xs font-black shrink-0">
                {name ? name[0].toUpperCase() : email[0].toUpperCase()}
              </div>
              <div className="min-w-0">
                {name && <p className="text-xs sm:text-sm font-semibold text-white truncate">{name}</p>}
                <p className="text-[10px] sm:text-xs text-gray-500 truncate">{email}</p>
              </div>
            </div>

            {/* Logout */}
            {showLogoutConfirm ? (
              <div className="flex items-center gap-1.5 shrink-0 ml-2">
                <span className="text-[10px] sm:text-xs text-gray-400">Sure?</span>
                <button onClick={handleLogout}
                  className="px-2 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white text-[10px] sm:text-xs font-bold transition">
                  Yes
                </button>
                <button onClick={() => setShowLogoutConfirm(false)}
                  className="px-2 py-1 rounded-lg bg-white/10 text-gray-400 text-[10px] sm:text-xs transition">
                  No
                </button>
              </div>
            ) : (
              <button onClick={() => setShowLogoutConfirm(true)}
                className="shrink-0 ml-2 flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-white/5 hover:bg-red-500/15 border border-white/10 hover:border-red-500/30 text-gray-500 hover:text-red-400 text-[10px] sm:text-xs font-semibold transition-all">
                {/* Logout SVG icon */}
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                <span className="hidden sm:inline">Logout</span>
              </button>
            )}
          </div>
        </div>

        {/* Combined total banner */}
        {tabs.length > 1 && (
          <div className="mb-4 rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 flex justify-between items-center">
            <span className="text-gray-400 text-xs sm:text-sm">🌐 Combined Total ({tabs.length} tabs)</span>
            <span className="text-base sm:text-lg font-black text-violet-300">{formatCurrency(allTotal)}</span>
          </div>
        )}

        {/* ── Tab Bar ── */}
        <div className="flex items-center gap-1.5 flex-nowrap overflow-x-auto pb-2 mb-5 scrollbar-hide">
          {tabs.map((tab) => (
            <div key={tab.id} className="flex-shrink-0">
              {renamingId === tab.id ? (
                <div className="flex items-center gap-1 bg-[#1e1e2e] border border-violet-500 rounded-xl px-2.5 py-1.5">
                  <input autoFocus value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") saveRename(); if (e.key === "Escape") setRenamingId(null); }}
                    className="bg-transparent text-white text-xs sm:text-sm w-20 sm:w-24 focus:outline-none" />
                  <button onClick={saveRename} className="text-green-400 text-xs font-bold">✓</button>
                  <button onClick={() => setRenamingId(null)} className="text-gray-500 text-xs">✕</button>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setActiveTab(tab.id)}
                    onDoubleClick={() => startRename(tab)}
                    className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all border whitespace-nowrap ${
                      activeTab === tab.id
                        ? "bg-violet-600 border-violet-500 text-white shadow-lg"
                        : "bg-[#1a1a24] border-white/10 text-gray-400 hover:text-white hover:border-white/25"
                    }`}
                  >
                    📁 {tab.name}
                  </button>
                  {activeTab === tab.id && (
                    <button onClick={() => startRename(tab)} title="Rename tab"
                      className="p-1 sm:p-1.5 rounded-lg bg-white/5 hover:bg-violet-500/30 text-gray-500 hover:text-violet-300 border border-white/10 hover:border-violet-500/40 transition text-[11px] sm:text-xs">✏️</button>
                  )}
                  {tabs.length > 1 && (
                    <button onClick={(e) => { e.stopPropagation(); deleteTab(tab.id); }} title="Delete tab"
                      className="p-1 sm:p-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 text-gray-500 hover:text-red-400 border border-white/10 hover:border-red-500/30 transition text-[11px] sm:text-xs">✕</button>
                  )}
                </div>
              )}
            </div>
          ))}
          <button onClick={addTab}
            className="flex-shrink-0 flex items-center gap-1 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold border border-dashed border-white/20 text-gray-500 hover:border-violet-500 hover:text-violet-400 transition-all whitespace-nowrap">
            ＋ New Tab
          </button>
        </div>

        {/* ── Active Tab Content ── */}
        <TabPanel key={activeTab} email={email} tabId={activeTab} tabName={activeTabName} />

        {/* ── Footer ── */}
        <footer className="mt-10 mb-2">
          {/* Divider line */}
          <div className="h-px w-full mb-5" style={{ background: "linear-gradient(90deg, transparent, rgba(139,92,246,0.2), transparent)" }} />

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-1">
            {/* Left — branding */}
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center text-xs"
                style={{ background: "linear-gradient(135deg,#4c1d95,#312e81)", border: "1px solid rgba(139,92,246,0.2)" }}>
                💸
              </div>
              <span className="text-gray-600 text-xs font-semibold tracking-wide">Expense Tracker</span>
            </div>

            {/* Center — version badge */}
            <div className="flex items-center gap-2">
              <span
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase"
                style={{
                  background: "rgba(139,92,246,0.08)",
                  border: "1px solid rgba(139,92,246,0.18)",
                  color: "#7c3aed",
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-violet-500 inline-block" style={{ boxShadow: "0 0 6px #7c3aed" }} />
                v 2.0.0
              </span>
              <span className="text-gray-700 text-[10px]">·</span>
              <span className="text-gray-700 text-[10px]">Stable</span>
            </div>

            {/* Right — meta info */}
            <div className="flex items-center gap-3 text-[10px] text-gray-700">
              <span className="flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                Local only
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                </svg>
                No tracking
              </span>
              <span>·</span>
              <span>© {new Date().getFullYear()}</span>
            </div>
          </div>
        </footer>

      </div>
    </div>
  );
}