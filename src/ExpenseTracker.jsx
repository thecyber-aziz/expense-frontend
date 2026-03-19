import { useState, useRef, useEffect } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { userKey } from "./auth";
import { useTheme } from "./ThemeContext";
import {
  ArrowLeftRight, UtensilsCrossed, ShoppingBag, Car, HeartPulse,
  Gamepad2, Briefcase, FileDown, FileText, Copy, Download, Share2,
  Pencil, Trash2, FolderOpen, Plus, X, Check, TrendingUp,
  Wallet, PiggyBank, ChevronRight, AlertCircle, DollarSign, Lock,
} from "lucide-react";

const CATEGORIES = [
  { label: "Food",           icon: UtensilsCrossed, color: "bg-orange-500" },
  { label: "Money Transfer", icon: ArrowLeftRight,  color: "bg-red-500"    },
  { label: "Shopping",       icon: ShoppingBag,     color: "bg-pink-500"   },
  { label: "Transport",      icon: Car,             color: "bg-blue-500"   },
  { label: "Health",         icon: HeartPulse,      color: "bg-green-500"  },
  { label: "Entertainment",  icon: Gamepad2,        color: "bg-purple-500" },
  { label: "Other",          icon: Briefcase,       color: "bg-gray-500"   },
];

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR", maximumFractionDigits: 2,
  }).format(amount);
}

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
function TextSummaryModal({ expenses, balance, total, remaining, tabName, onClose, dark }) {
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
        {/* Modal header */}
        <div
          className="flex items-center justify-between px-4 sm:px-5 py-4"
          style={{ borderBottom: dark ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(109,40,217,0.08)" }}
        >
          <div>
            <h3 className="font-black text-sm sm:text-base flex items-center gap-2"
              style={{ color: dark ? "#fff" : "#1a1a2e" }}>
              <FileText size={15} color="#8b5cf6" /> Text Summary
            </h3>
            <p className="text-[10px] sm:text-xs mt-0.5" style={{ color: dark ? "#4b5563" : "#9ca3af" }}>
              {tabName} · {expenses.length} expenses
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center transition"
            style={{ color: dark ? "#4b5563" : "#9ca3af", background: dark ? "rgba(255,255,255,0.05)" : "rgba(109,40,217,0.06)" }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Modal body */}
        <div className="flex-1 overflow-auto px-4 sm:px-5 py-4">
          <pre
            className="text-xs sm:text-sm font-mono leading-relaxed whitespace-pre-wrap break-words"
            style={{ color: dark ? "#d1d5db" : "#374151", fontFamily: "'Courier New','Consolas',monospace" }}
          >
            {text}
          </pre>
        </div>

        {/* Modal actions */}
        <div
          className="px-4 sm:px-5 py-4 flex flex-col sm:flex-row gap-2"
          style={{ borderTop: dark ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(109,40,217,0.08)" }}
        >
          <button
            onClick={handleCopy}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition-all active:scale-95"
            style={{
              background: copied ? "rgba(5,150,105,0.15)"    : "rgba(139,92,246,0.12)",
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
            onClick={() => {
              if (navigator.share) {
                navigator.share({ title: `Expense Report — ${tabName}`, text });
              } else {
                handleCopy();
              }
            }}
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

// ── TabPanel ──────────────────────────────────────────────────────────────────
function TabPanel({ email, tabId, tabName, dark }) {
  const [balance, setBalance]             = useState(() => loadTabData(email, tabId).balance);
  const [editBalance, setEditBalance]     = useState(false);
  const [balanceInput, setBalanceInput]   = useState("");
  const [expenses, setExpenses]           = useState(() => loadTabData(email, tabId).expenses);
  const [name, setName]                   = useState("");
  const [amount, setAmount]               = useState("");
  const [category, setCategory]           = useState("Food");
  const [filter, setFilter]               = useState("All");
  const [editId, setEditId]               = useState(null);
  const [error, setError]                 = useState("");
  const [animateTotal, setAnimateTotal]   = useState(false);
  const [showConfirm, setShowConfirm]     = useState(null);
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
  const filtered  = filter === "All" ? expenses : expenses.filter(e => e.category === filter);

  const handleSubmit = () => {
    if (!name.trim()) return setError("Please enter a name.");
    if (!amount || isNaN(amount) || Number(amount) <= 0) return setError("Enter a valid amount.");
    setError("");
    if (editId !== null) {
      setExpenses(prev => prev.map(e =>
        e.id === editId ? { ...e, name: name.trim(), amount: parseFloat(amount), category } : e
      ));
      setEditId(null);
    } else {
      setExpenses(prev => [
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
    setEditId(expense.id);
    setName(expense.name);
    setAmount(String(expense.amount));
    setCategory(expense.category);
    nameRef.current?.focus();
  };

  const handleDelete    = (id) => { setExpenses(prev => prev.filter(e => e.id !== id)); setShowConfirm(null); };
  const getCategoryInfo = (label) => CATEGORIES.find(c => c.label === label) || CATEGORIES[6];

  const saveBalance = () => {
    const val = Number(balanceInput);
    if (!isNaN(val) && val >= 0) { setBalance(val); setEditBalance(false); }
  };

  const categoryTotals = CATEGORIES.map(cat => ({
    ...cat,
    total: expenses.filter(e => e.category === cat.label).reduce((s, e) => s + e.amount, 0),
  })).filter(c => c.total > 0);

  const card     = dark ? "#141420" : "#ffffff";
  const card2    = dark ? "#1a1a24" : "#f9f7ff";
  const border   = dark ? "rgba(255,255,255,0.08)" : "rgba(109,40,217,0.12)";
  const textMain  = dark ? "#fff"    : "#1a1a2e";
  const textMuted = dark ? "#6b7280" : "#9ca3af";
  const inputBg   = dark ? "#1e1e2e" : "#f5f3ff";

  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.setFillColor(88, 28, 135);
    doc.rect(0, 0, 210, 30, "F");
    doc.setTextColor(255, 255, 255); doc.setFontSize(18);
    doc.text(`Expense Report — ${tabName}`, 14, 18);
    doc.setFontSize(10);
    doc.text(`Date: ${new Date().toLocaleDateString("en-IN")}`, 150, 18);
    doc.setTextColor(0, 0, 0); doc.setFontSize(12);
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
    doc.setFontSize(11); doc.setFont(undefined, "bold");
    doc.text(`Grand Total: ${formatCurrency(total)}`, 14, finalY);
    doc.save(`expense-report-${tabName.toLowerCase().replace(/\s+/g, "-")}.pdf`);
  };

  return (
    <div>
      {showTextModal && (
        <TextSummaryModal
          expenses={expenses} balance={balance} total={total}
          remaining={remaining} tabName={tabName} dark={dark}
          onClose={() => setShowTextModal(false)}
        />
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-4 sm:mb-5">
        <button
          onClick={downloadPDF}
          className="flex-1 sm:flex-none flex items-center justify-center gap-2 active:scale-95 transition-all rounded-xl px-4 sm:px-5 py-2.5 text-sm sm:text-base font-bold text-white shadow-lg"
          style={{ background: "linear-gradient(135deg,#059669,#047857)" }}
        >
          <FileDown size={16} strokeWidth={2.2} /> Download PDF
        </button>
        <button
          onClick={() => setShowTextModal(true)}
          className="flex-1 sm:flex-none flex items-center justify-center gap-2 active:scale-95 transition-all rounded-xl px-4 sm:px-5 py-2.5 text-sm sm:text-base font-bold shadow-lg"
          style={{ background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.25)", color: "#a78bfa" }}
        >
          <FileText size={16} strokeWidth={2.2} /> Text Version
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4 sm:mb-5">

        {/* Spent */}
        <div className={`col-span-1 rounded-xl sm:rounded-2xl bg-gradient-to-br from-violet-700 to-indigo-800 p-3 sm:p-4 shadow-xl transition-all duration-300 ${animateTotal ? "scale-105" : "scale-100"}`}>
          <div className="flex items-center gap-1 mb-1">
            <TrendingUp size={10} color="#c4b5fd" />
            <p className="text-violet-300 text-[9px] sm:text-xs uppercase tracking-widest">Spent</p>
          </div>
          <p className="text-sm sm:text-lg md:text-xl font-black leading-tight text-white">{formatCurrency(total)}</p>
          <p className="text-violet-400 text-[9px] sm:text-xs mt-1">{expenses.length} items</p>
        </div>

        {/* Balance */}
        <div className="col-span-1 rounded-xl sm:rounded-2xl p-3 sm:p-4"
          style={{ background: card2, border: `1px solid ${border}` }}>
          <div className="flex items-center gap-1 mb-1">
            <Wallet size={10} color="#34d399" />
            <p className="text-[9px] sm:text-xs uppercase tracking-widest" style={{ color: "#34d399" }}>Balance</p>
          </div>
          {editBalance ? (
            <div className="flex gap-1 mt-1">
              <input
                type="number" value={balanceInput}
                onChange={e => setBalanceInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && saveBalance()}
                className="w-full rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-green-500"
                style={{ background: inputBg, color: textMain, border: `1px solid ${border}` }}
              />
              <button onClick={saveBalance}
                className="bg-green-600 hover:bg-green-500 px-1.5 sm:px-2 rounded-lg text-white">
                <Check size={12} />
              </button>
            </div>
          ) : (
            <>
              <p className="text-sm sm:text-lg md:text-xl font-black text-green-400">{formatCurrency(balance)}</p>
              <button
                onClick={() => { setEditBalance(true); setBalanceInput(balance); }}
                className="text-[9px] sm:text-xs text-green-500 hover:text-green-300 underline mt-1 flex items-center gap-1"
              >
                <Pencil size={9} /> Edit
              </button>
            </>
          )}
        </div>

        {/* Remaining */}
        <div
          className="col-span-1 rounded-xl sm:rounded-2xl p-3 sm:p-4"
          style={{
            background: remaining < 0 ? "rgba(239,68,68,0.1)" : card2,
            border: remaining < 0 ? "1px solid rgba(239,68,68,0.25)" : `1px solid ${border}`,
          }}
        >
          <div className="flex items-center gap-1 mb-1">
            <PiggyBank size={10} color={remaining < 0 ? "#f87171" : "#60a5fa"} />
            <p className="text-[9px] sm:text-xs uppercase tracking-widest"
              style={{ color: remaining < 0 ? "#f87171" : "#60a5fa" }}>Left</p>
          </div>
          <p className="text-sm sm:text-lg md:text-xl font-black"
            style={{ color: remaining < 0 ? "#f87171" : "#60a5fa" }}>
            {formatCurrency(remaining)}
          </p>
          {remaining < 0 && (
            <p className="text-[9px] sm:text-xs mt-1 flex items-center gap-1" style={{ color: "#f87171" }}>
              <AlertCircle size={9} /> Over budget!
            </p>
          )}
        </div>
      </div>

      {/* Category Chips */}
      {categoryTotals.length > 0 && (
        <div className="flex gap-1.5 sm:gap-2 flex-wrap mb-4 sm:mb-5">
          {categoryTotals.map(cat => {
            const Icon = cat.icon;
            return (
              <div key={cat.label}
                className="flex items-center gap-1 sm:gap-1.5 rounded-full px-2 sm:px-3 py-1 text-[10px] sm:text-xs"
                style={{ background: dark ? "rgba(255,255,255,0.05)" : "rgba(109,40,217,0.07)", border: `1px solid ${border}` }}>
                <Icon size={11} color="#8b5cf6" strokeWidth={2} />
                <span className="font-semibold" style={{ color: dark ? "#d1d5db" : "#4b5563" }}>
                  {formatCurrency(cat.total)}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Form */}
      <div className="rounded-xl sm:rounded-2xl p-4 sm:p-5 mb-4 sm:mb-5 shadow-xl"
        style={{ background: card, border: `1px solid ${border}` }}>
        <h2 className="text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-3 sm:mb-4 flex items-center gap-1.5"
          style={{ color: textMuted }}>
          {editId ? <><Pencil size={11} /> Editing Expense</> : <><Plus size={11} /> New Expense</>}
        </h2>

        {error && (
          <div className="rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 mb-3 sm:mb-4 flex items-center gap-2 text-xs sm:text-sm"
            style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }}>
            <AlertCircle size={13} /> {error}
          </div>
        )}

        <div className="flex flex-col gap-2 sm:gap-3">
          <input
            ref={nameRef} type="text" placeholder="Expense name (e.g. Pizza, Rent...)"
            value={name} onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSubmit()}
            className="rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-violet-500 transition w-full"
            style={{ background: inputBg, border: `1px solid ${border}`, color: textMain }}
          />

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <input
              type="number" placeholder="Amount (₹)" value={amount}
              onChange={e => setAmount(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSubmit()}
              className="flex-1 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-violet-500 transition w-full"
              style={{ background: inputBg, border: `1px solid ${border}`, color: textMain }}
            />
            <select
              value={category} onChange={e => setCategory(e.target.value)}
              className="flex-1 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-violet-500 transition w-full"
              style={{ background: inputBg, border: `1px solid ${border}`, color: textMain }}
            >
              {CATEGORIES.map(c => (
                <option key={c.label} value={c.label}>{c.label}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-2 sm:gap-3">
            <button
              onClick={handleSubmit}
              className="flex-1 bg-violet-600 hover:bg-violet-500 active:scale-95 transition-all rounded-xl py-2.5 sm:py-3 text-sm sm:text-base font-bold text-white flex items-center justify-center gap-2"
            >
              {editId ? <><Check size={15} /> Update Expense</> : <><Plus size={15} /> Add Expense</>}
            </button>
            {editId && (
              <button
                onClick={() => { setEditId(null); setName(""); setAmount(""); setCategory("Food"); setError(""); }}
                className="px-4 sm:px-5 rounded-xl font-medium text-sm flex items-center gap-1.5 transition"
                style={{ background: dark ? "rgba(255,255,255,0.06)" : "rgba(109,40,217,0.06)", border: `1px solid ${border}`, color: textMuted }}
              >
                <X size={14} /> Cancel
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex gap-1.5 sm:gap-2 flex-nowrap sm:flex-wrap overflow-x-auto pb-2 sm:pb-0 mb-4 scrollbar-hide">
        {["All", ...CATEGORIES.map(c => c.label)].map(f => {
          const catInfo = CATEGORIES.find(c => c.label === f);
          const Icon    = catInfo?.icon;
          return (
            <button key={f} onClick={() => setFilter(f)}
              className="px-2.5 sm:px-3 py-1.5 rounded-full text-[10px] sm:text-xs font-semibold transition-all border whitespace-nowrap flex-shrink-0 flex items-center gap-1"
              style={{
                background: filter === f ? "#7c3aed" : "transparent",
                border:     filter === f ? "1px solid #7c3aed" : `1px solid ${border}`,
                color:      filter === f ? "#fff" : textMuted,
              }}
            >
              {f === "All"
                ? <><FolderOpen size={11} strokeWidth={2} /> All</>
                : <>{Icon && <Icon size={11} strokeWidth={2} />} {f}</>
              }
            </button>
          );
        })}
      </div>

      {/* Expense List */}
      <div className="flex flex-col gap-2">
        {filtered.length === 0 && (
          <div className="text-center py-12 sm:py-16" style={{ color: textMuted }}>
            <PiggyBank size={48} className="mx-auto mb-3 opacity-20" />
            <p className="text-xs sm:text-sm">No expenses yet. Add one above!</p>
          </div>
        )}
        {filtered.map(expense => {
          const cat  = getCategoryInfo(expense.category);
          const Icon = cat.icon;
          return (
            <div key={expense.id}
              className="group rounded-xl sm:rounded-2xl px-3 sm:px-5 py-3 sm:py-4 flex items-center justify-between transition-all gap-2"
              style={{ background: card, border: `1px solid ${border}` }}>

              <div className="flex items-center gap-2 sm:gap-4 min-w-0">
                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl ${cat.color} flex items-center justify-center shrink-0`}>
                  <Icon size={16} color="#fff" strokeWidth={2} />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm sm:text-base truncate" style={{ color: textMain }}>
                    {expense.name}
                  </p>
                  <p className="text-[10px] sm:text-xs truncate flex items-center gap-1" style={{ color: textMuted }}>
                    <Icon size={9} strokeWidth={2} /> {expense.category} · {expense.date}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
                <p className="font-black text-sm sm:text-lg" style={{ color: textMain }}>
                  {formatCurrency(expense.amount)}
                </p>
                <div className="flex gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleEdit(expense)}
                    className="p-1 sm:p-1.5 rounded-lg transition"
                    style={{ color: textMuted, background: "transparent" }}
                    onMouseOver={e => e.currentTarget.style.background = dark ? "rgba(255,255,255,0.08)" : "rgba(109,40,217,0.08)"}
                    onMouseOut={e => e.currentTarget.style.background = "transparent"}
                  >
                    <Pencil size={13} strokeWidth={2} />
                  </button>

                  {showConfirm === expense.id ? (
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleDelete(expense.id)}
                        className="px-1.5 sm:px-2 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white text-[10px] sm:text-xs font-bold flex items-center gap-1"
                      >
                        <Check size={10} /> Del
                      </button>
                      <button
                        onClick={() => setShowConfirm(null)}
                        className="px-1.5 sm:px-2 py-1 rounded-lg text-[10px] sm:text-xs flex items-center gap-1"
                        style={{ background: dark ? "rgba(255,255,255,0.08)" : "rgba(109,40,217,0.06)", color: textMuted }}
                      >
                        <X size={10} /> No
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowConfirm(expense.id)}
                      className="p-1 sm:p-1.5 rounded-lg transition"
                      style={{ color: textMuted, background: "transparent" }}
                      onMouseOver={e => { e.currentTarget.style.background = "rgba(239,68,68,0.1)"; e.currentTarget.style.color = "#f87171"; }}
                      onMouseOut={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = textMuted; }}
                    >
                      <Trash2 size={13} strokeWidth={2} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom total bar */}
      {filtered.length > 0 && (
        <div
          className="mt-4 sm:mt-5 rounded-xl sm:rounded-2xl px-4 sm:px-5 py-3 sm:py-4 flex justify-between items-center"
          style={{ background: card, border: `1px solid ${border}` }}
        >
          <span className="text-xs sm:text-sm flex items-center gap-1.5" style={{ color: textMuted }}>
            <ChevronRight size={13} />
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

// ── Root ──────────────────────────────────────────────────────────────────────
export default function ExpenseTracker({ user, onLogout }) {
  const { dark } = useTheme();
  const { email } = user;

  const [tabs, setTabs]         = useState(() => loadTabMeta(email));
  const [activeTab, setActiveTab] = useState(() => loadTabMeta(email)[0].id);
  const [renamingId, setRenamingId]   = useState(null);
  const [renameValue, setRenameValue] = useState("");

  const border    = dark ? "rgba(255,255,255,0.08)" : "rgba(109,40,217,0.12)";
  const textMain  = dark ? "#fff"    : "#1a1a2e";
  const textMuted = dark ? "#6b7280" : "#9ca3af";

  useEffect(() => {
    localStorage.setItem(userKey(email, "tabs_meta"), JSON.stringify(tabs));
  }, [email, tabs]);

  const allTotal = tabs.reduce((sum, tab) => {
    const data = loadTabData(email, tab.id);
    return sum + data.expenses.reduce((s, e) => s + e.amount, 0);
  }, 0);

  const addTab = () => {
    const newId = `tab_${Date.now()}`;
    setTabs(prev => [...prev, { id: newId, name: `Tab ${prev.length + 1}` }]);
    setActiveTab(newId);
  };

  const deleteTab = (tabId) => {
    if (tabs.length === 1) return;
    deleteTabStorage(email, tabId);
    const rest = tabs.filter(t => t.id !== tabId);
    setTabs(rest);
    if (activeTab === tabId) setActiveTab(rest[0].id);
  };

  const startRename = (tab) => { setRenamingId(tab.id); setRenameValue(tab.name); };
  const saveRename  = () => {
    if (!renameValue.trim()) return;
    setTabs(prev => prev.map(t => t.id === renamingId ? { ...t, name: renameValue.trim() } : t));
    setRenamingId(null);
  };

  const activeTabName = tabs.find(t => t.id === activeTab)?.name || "";

  return (
    <div className="min-h-screen" style={{
      background: dark ? "#0a0a10" : "#f0ecff",
      color: textMain,
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      transition: "background 0.4s ease",
    }}>
      {/* Glow orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-48 h-48 sm:w-72 sm:h-72 rounded-full blur-[100px]"
          style={{ background: dark ? "rgba(109,40,217,0.12)" : "rgba(109,40,217,0.06)" }} />
        <div className="absolute bottom-0 right-1/4 w-48 h-48 sm:w-72 sm:h-72 rounded-full blur-[100px]"
          style={{ background: dark ? "rgba(8,145,178,0.08)" : "rgba(139,92,246,0.05)" }} />
      </div>

      <div className="relative w-full max-w-xl lg:max-w-2xl mx-auto px-3 sm:px-5 py-5 sm:py-8">

        {/* ── Header ── */}
        <div className="mb-5 sm:mb-6 text-center">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight flex items-center justify-center gap-2">
            <DollarSign size={28} color="#8b5cf6" strokeWidth={2.5} />
            Expense <span className="text-violet-400">Tracker</span>
          </h1>
          <p className="mt-1 text-xs sm:text-sm" style={{ color: textMuted }}>
            Track every rupee you spend
          </p>
        </div>

        {/* Combined total */}
        {tabs.length > 1 && (
          <div className="mb-4 rounded-xl px-4 py-2.5 flex justify-between items-center"
            style={{ background: dark ? "rgba(255,255,255,0.04)" : "rgba(109,40,217,0.06)", border: `1px solid ${border}` }}>
            <span className="text-xs sm:text-sm flex items-center gap-1.5" style={{ color: textMuted }}>
              <TrendingUp size={13} /> Combined Total ({tabs.length} tabs)
            </span>
            <span className="text-base sm:text-lg font-black text-violet-400">{formatCurrency(allTotal)}</span>
          </div>
        )}

        {/* Tab Bar */}
        <div className="flex items-center gap-1.5 flex-nowrap overflow-x-auto pb-2 mb-5 scrollbar-hide">
          {tabs.map(tab => (
            <div key={tab.id} className="flex-shrink-0">
              {renamingId === tab.id ? (
                <div className="flex items-center gap-1 rounded-xl px-2.5 py-1.5"
                  style={{ background: dark ? "#1e1e2e" : "#f5f3ff", border: "1px solid #7c3aed" }}>
                  <input
                    autoFocus value={renameValue}
                    onChange={e => setRenameValue(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") saveRename(); if (e.key === "Escape") setRenamingId(null); }}
                    className="bg-transparent text-xs sm:text-sm w-20 sm:w-24 focus:outline-none"
                    style={{ color: textMain }}
                  />
                  <button onClick={saveRename} className="text-green-400"><Check size={12} /></button>
                  <button onClick={() => setRenamingId(null)} style={{ color: textMuted }}><X size={12} /></button>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setActiveTab(tab.id)}
                    onDoubleClick={() => startRename(tab)}
                    className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all border whitespace-nowrap"
                    style={{
                      background: activeTab === tab.id ? "#7c3aed" : (dark ? "#1a1a24" : "#f5f3ff"),
                      border:     activeTab === tab.id ? "1px solid #7c3aed" : `1px solid ${border}`,
                      color:      activeTab === tab.id ? "#fff" : textMuted,
                    }}
                  >
                    <FolderOpen size={13} strokeWidth={2} /> {tab.name}
                  </button>

                  {activeTab === tab.id && (
                    <button
                      onClick={() => startRename(tab)}
                      className="p-1 sm:p-1.5 rounded-lg transition"
                      style={{ background: dark ? "rgba(255,255,255,0.05)" : "rgba(109,40,217,0.06)", border: `1px solid ${border}`, color: textMuted }}
                    >
                      <Pencil size={11} strokeWidth={2} />
                    </button>
                  )}

                  {tabs.length > 1 && (
                    <button
                      onClick={e => { e.stopPropagation(); deleteTab(tab.id); }}
                      className="p-1 sm:p-1.5 rounded-lg transition"
                      style={{ background: dark ? "rgba(255,255,255,0.05)" : "rgba(109,40,217,0.06)", border: `1px solid ${border}`, color: textMuted }}
                      onMouseOver={e => { e.currentTarget.style.background = "rgba(239,68,68,0.1)"; e.currentTarget.style.color = "#f87171"; }}
                      onMouseOut={e => { e.currentTarget.style.background = dark ? "rgba(255,255,255,0.05)" : "rgba(109,40,217,0.06)"; e.currentTarget.style.color = textMuted; }}
                    >
                      <X size={11} strokeWidth={2} />
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}

          <button
            onClick={addTab}
            className="flex-shrink-0 flex items-center gap-1 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold border border-dashed transition-all whitespace-nowrap"
            style={{ borderColor: dark ? "rgba(255,255,255,0.15)" : "rgba(109,40,217,0.2)", color: textMuted }}
            onMouseOver={e => { e.currentTarget.style.borderColor = "#7c3aed"; e.currentTarget.style.color = "#a78bfa"; }}
            onMouseOut={e => { e.currentTarget.style.borderColor = dark ? "rgba(255,255,255,0.15)" : "rgba(109,40,217,0.2)"; e.currentTarget.style.color = textMuted; }}
          >
            <Plus size={13} strokeWidth={2} /> New Tab
          </button>
        </div>

        {/* Active Tab Content */}
        <TabPanel key={activeTab} email={email} tabId={activeTab} tabName={activeTabName} dark={dark} />

        {/* Footer */}
        <footer className="mt-10 mb-2">
          <div className="h-px w-full mb-5"
            style={{ background: "linear-gradient(90deg,transparent,rgba(139,92,246,0.2),transparent)" }} />
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-1">

            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center"
                style={{ background: "linear-gradient(135deg,#4c1d95,#312e81)", border: "1px solid rgba(139,92,246,0.2)" }}>
                <DollarSign size={12} color="#a78bfa" strokeWidth={2.5} />
              </div>
              <span className="text-xs font-semibold tracking-wide" style={{ color: textMuted }}>Expense Tracker</span>
            </div>

            <div className="flex items-center gap-2">
              <span
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase"
                style={{ background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.18)", color: "#7c3aed" }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-violet-500 inline-block" style={{ boxShadow: "0 0 6px #7c3aed" }} />
                v 2.0.1
              </span>
              <span style={{ color: textMuted, fontSize: 10 }}>· Stable</span>
            </div>

            <div className="flex items-center gap-3 text-[10px]" style={{ color: textMuted }}>
              <span className="flex items-center gap-1"><Lock size={10} /> Local only</span>
              <span>·</span>
              <span className="flex items-center gap-1"><TrendingUp size={10} /> No tracking</span>
              <span>·</span>
              <span>© {new Date().getFullYear()}</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}