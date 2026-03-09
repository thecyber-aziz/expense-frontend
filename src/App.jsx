import { useState, useRef, useEffect } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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

// ── localStorage helpers per tab ──────────────────────────────────────────
function loadTabMeta() {
  try {
    const saved = localStorage.getItem("et_tabs_meta");
    return saved ? JSON.parse(saved) : [{ id: "tab_1", name: "Personal" }];
  } catch { return [{ id: "tab_1", name: "Personal" }]; }
}

function loadTabData(tabId) {
  try {
    const expenses = localStorage.getItem(`et_expenses_${tabId}`);
    const balance  = localStorage.getItem(`et_balance_${tabId}`);
    return {
      expenses: expenses ? JSON.parse(expenses) : [],
      balance:  balance  ? Number(balance) : 0,
    };
  } catch { return { expenses: [], balance: 0 }; }
}

function saveTabExpenses(tabId, expenses) {
  localStorage.setItem(`et_expenses_${tabId}`, JSON.stringify(expenses));
}
function saveTabBalance(tabId, balance) {
  localStorage.setItem(`et_balance_${tabId}`, balance);
}
function deleteTabStorage(tabId) {
  localStorage.removeItem(`et_expenses_${tabId}`);
  localStorage.removeItem(`et_balance_${tabId}`);
}

// ── TabPanel: all original logic, now scoped to a tabId ───────────────────
function TabPanel({ tabId, tabName }) {
  const [balance, setBalance]       = useState(() => loadTabData(tabId).balance);
  const [editBalance, setEditBalance] = useState(false);
  const [balanceInput, setBalanceInput] = useState("");
  const [expenses, setExpenses]     = useState(() => loadTabData(tabId).expenses);
  const [name, setName]             = useState("");
  const [amount, setAmount]         = useState("");
  const [category, setCategory]     = useState("Food");
  const [filter, setFilter]         = useState("All");
  const [editId, setEditId]         = useState(null);
  const [error, setError]           = useState("");
  const [animateTotal, setAnimateTotal] = useState(false);
  const [showConfirm, setShowConfirm]   = useState(null);
  const nameRef = useRef(null);

  // persist on change
  useEffect(() => { saveTabExpenses(tabId, expenses); }, [tabId, expenses]);
  useEffect(() => { saveTabBalance(tabId, balance);   }, [tabId, balance]);

  // reload when switching tab
  useEffect(() => {
    const data = loadTabData(tabId);
    setExpenses(data.expenses);
    setBalance(data.balance);
    setName(""); setAmount(""); setCategory("Food");
    setFilter("All"); setEditId(null); setError("");
  }, [tabId]);

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
      {/* PDF Button */}
      <button onClick={downloadPDF}
        className="w-full sm:w-auto mb-4 sm:mb-5 flex items-center justify-center gap-2 bg-green-700 hover:bg-green-600 active:scale-95 transition-all rounded-xl px-5 py-2.5 text-sm sm:text-base font-bold text-white shadow-lg">
        <span>📄</span> Download PDF
      </button>

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

// ── Root: manages tabs ─────────────────────────────────────────────────────
export default function ExpenseTracker() {
  const [tabs, setTabs]           = useState(loadTabMeta);
  const [activeTab, setActiveTab] = useState(() => loadTabMeta()[0].id);
  const [renamingId, setRenamingId]   = useState(null);
  const [renameValue, setRenameValue] = useState("");

  // persist tab list
  useEffect(() => {
    localStorage.setItem("et_tabs_meta", JSON.stringify(tabs));
  }, [tabs]);

  // combined total across all tabs
  const allTotal = tabs.reduce((sum, tab) => {
    const data = loadTabData(tab.id);
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
    deleteTabStorage(tabId);
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

  const activeTabName = tabs.find((t) => t.id === activeTab)?.name || "";

  return (
    <div className="min-h-screen bg-[#0a0a10] text-white" style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      {/* Glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-48 h-48 sm:w-72 sm:h-72 md:w-96 md:h-96 bg-violet-800 opacity-10 rounded-full blur-[100px] md:blur-[140px]" />
        <div className="absolute bottom-0 right-1/4 w-48 h-48 sm:w-72 sm:h-72 md:w-96 md:h-96 bg-cyan-700 opacity-10 rounded-full blur-[100px] md:blur-[140px]" />
      </div>

      <div className="relative w-full max-w-xl lg:max-w-2xl mx-auto px-3 sm:px-5 py-5 sm:py-8">

        {/* Header */}
        <div className="mb-5 sm:mb-6 text-center">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight">
            💸 Expense <span className="text-violet-400">Tracker</span>
          </h1>
          <p className="text-gray-500 mt-1 text-xs sm:text-sm">Track every rupee you spend</p>
        </div>

        {/* Combined total banner — only shows when 2+ tabs */}
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
                /* inline rename input */
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
                  {/* ✏️ rename — visible on active tab */}
                  {activeTab === tab.id && (
                    <button
                      onClick={() => startRename(tab)}
                      title="Rename tab"
                      className="p-1 sm:p-1.5 rounded-lg bg-white/5 hover:bg-violet-500/30 text-gray-500 hover:text-violet-300 border border-white/10 hover:border-violet-500/40 transition text-[11px] sm:text-xs"
                    >✏️</button>
                  )}
                  {/* ✕ delete */}
                  {tabs.length > 1 && (
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteTab(tab.id); }}
                      title="Delete tab"
                      className="p-1 sm:p-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 text-gray-500 hover:text-red-400 border border-white/10 hover:border-red-500/30 transition text-[11px] sm:text-xs"
                    >✕</button>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* ＋ New Tab */}
          <button onClick={addTab}
            className="flex-shrink-0 flex items-center gap-1 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold border border-dashed border-white/20 text-gray-500 hover:border-violet-500 hover:text-violet-400 transition-all whitespace-nowrap">
            ＋ New Tab
          </button>
        </div>

        {/* ── Active Tab Content ── */}
        <TabPanel key={activeTab} tabId={activeTab} tabName={activeTabName} />

      </div>
    </div>
  );
}
