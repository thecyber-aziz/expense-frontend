import { useState, useRef, useEffect } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  ArrowLeftRight, UtensilsCrossed, ShoppingBag, Car, HeartPulse,
  Gamepad2, Briefcase, FileDown, FileText,
  Pencil, Trash2, FolderOpen, Plus, X, Check, TrendingUp,
  Wallet, PiggyBank, ChevronRight, AlertCircle,
} from "lucide-react";
import { CATEGORIES } from "../auth/constants";
import { formatCurrency, loadTabData, saveTabExpenses, saveTabBalance } from "../auth/utils";
import { userKey } from "../auth/auth";
import { useTheme } from "../auth/ThemeContext";
import TextSummaryModal from "./TextSummaryModal";

export default function TabPanel({ email, tabId, tabName, dark }) {
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

  const card      = dark ? "#141420" : "#ffffff";
  const card2     = dark ? "#1a1a24" : "#f9f7ff";
  const border    = dark ? "rgba(255,255,255,0.08)" : "rgba(109,40,217,0.12)";
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
          className="flex-1 sm:flex-none flex items-center justify-center gap-2 active:scale-95 transition-all rounded-xl px-4 sm:px-5 py-2.5 text-sm sm:text-base font-bold shadow-lg"
          style={{ background: "linear-gradient(135deg,#059669,#047857)", color: "#ffffff" }}
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
          <p className="text-sm sm:text-lg md:text-xl font-black leading-tight" style={{ color: "#ffffff" }}>
            {formatCurrency(total)}
          </p>
          <p className="text-violet-400 text-[9px] sm:text-xs mt-1">{expenses.length} items</p>
        </div>

        {/* Balance */}
        <div className="col-span-1 rounded-xl sm:rounded-2xl p-3 sm:p-4" style={{ background: card2, border: `1px solid ${border}` }}>
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
              <button onClick={saveBalance} className="bg-green-600 hover:bg-green-500 px-1.5 sm:px-2 rounded-lg text-white">
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
            <p className="text-[9px] sm:text-xs uppercase tracking-widest" style={{ color: remaining < 0 ? "#f87171" : "#60a5fa" }}>Left</p>
          </div>
          <p className="text-sm sm:text-lg md:text-xl font-black" style={{ color: remaining < 0 ? "#f87171" : "#60a5fa" }}>
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
      <div className="rounded-xl sm:rounded-2xl p-4 sm:p-5 mb-4 sm:mb-5 shadow-xl" style={{ background: card, border: `1px solid ${border}` }}>
        <h2 className="text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-3 sm:mb-4 flex items-center gap-1.5" style={{ color: textMuted }}>
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
              {CATEGORIES.map(c => <option key={c.label} value={c.label}>{c.label}</option>)}
            </select>
          </div>
          <div className="flex gap-2 sm:gap-3">
            <button
              onClick={handleSubmit}
              className="flex-1 bg-violet-600 hover:bg-violet-500 active:scale-95 transition-all rounded-xl py-2.5 sm:py-3 text-sm sm:text-base font-bold flex items-center justify-center gap-2"
              style={{ color: "#ffffff" }}
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
                : <>{Icon && <Icon size={11} strokeWidth={2} />} {f}</>}
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
                  <p className="font-semibold text-sm sm:text-base truncate" style={{ color: textMain }}>{expense.name}</p>
                  <p className="text-[10px] sm:text-xs truncate flex items-center gap-1" style={{ color: textMuted }}>
                    <Icon size={9} strokeWidth={2} /> {expense.category} · {expense.date}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
                <p className="font-black text-sm sm:text-lg" style={{ color: textMain }}>{formatCurrency(expense.amount)}</p>
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
                      <button onClick={() => handleDelete(expense.id)}
                        className="px-1.5 sm:px-2 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white text-[10px] sm:text-xs font-bold flex items-center gap-1">
                        <Check size={10} /> Del
                      </button>
                      <button onClick={() => setShowConfirm(null)}
                        className="px-1.5 sm:px-2 py-1 rounded-lg text-[10px] sm:text-xs flex items-center gap-1"
                        style={{ background: dark ? "rgba(255,255,255,0.08)" : "rgba(109,40,217,0.06)", color: textMuted }}>
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