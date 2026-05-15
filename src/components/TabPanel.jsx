import { useState, useRef, useEffect } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  ArrowLeftRight, UtensilsCrossed, ShoppingBag, Car, HeartPulse,
  Gamepad2, Briefcase, FileDown, FileText,
  Pencil, Trash2, FolderOpen, Plus, X, Check, TrendingUp, TrendingDown,
  Wallet, PiggyBank, ChevronRight, AlertCircle, Zap,
} from "lucide-react";
import { CATEGORIES } from "../auth/constants";
import { formatCurrency, loadTabData, saveTabExpenses, saveTabBalance, saveTabOnlineBalance } from "../auth/utils";
import { userKey } from "../auth/auth";
import { useTheme } from "../auth/ThemeContext";
import TextSummaryModal from "./TextSummaryModal";
import { getExpenses, createExpense, updateExpense, deleteExpense } from "../api/expenseApi.js";
import { updateBalance } from "../api/tabApi.js";

export default function TabPanel({ email, tabId, tabName, dark }) {
  const [balance, setBalance]             = useState(() => loadTabData(email, tabId).balance);
  const [onlineBalance, setOnlineBalance] = useState(() => loadTabData(email, tabId).onlineBalance);
  const [editBalance, setEditBalance]     = useState(false);
  const [editOnlineBalance, setEditOnlineBalance] = useState(false);
  const [balanceInput, setBalanceInput]   = useState("");
  const [onlineBalanceInput, setOnlineBalanceInput] = useState("");
  const [expenses, setExpenses]           = useState(() => loadTabData(email, tabId).expenses);
  const [name, setName]                   = useState("");
  const [amount, setAmount]               = useState("");
  const [category, setCategory]           = useState("food");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [editId, setEditId]               = useState(null);
  const [error, setError]                 = useState("");
  const [animateTotal, setAnimateTotal]   = useState(false);
  const [showConfirm, setShowConfirm]     = useState(null);
  const [showTextModal, setShowTextModal] = useState(false);
  const [loading, setLoading]             = useState(false);
  const [syncing, setSyncing]             = useState(false);
  const nameRef = useRef(null);
  const getExpenseSortTime = (expense) => new Date(expense?.createdAt || expense?.date || 0).getTime();

  // Load expenses from backend on tab change
  useEffect(() => {
    const loadExpensesFromBackend = async () => {
      try {
        setLoading(true);
        const response = await getExpenses(tabId);
        if (response.success && response.data) {
          // Transform backend data to local format
          const transformedExpenses = response.data.map(exp => ({
            id: exp._id,
            name: exp.name,
            amount: exp.amount,
            category: exp.category,
            date: new Date(exp.date).toISOString().split("T")[0],
            createdAt: exp.createdAt,
            paymentMethod: exp.paymentMethod || "Cash",
          }));
          // Sort expenses by date (newest first)
          const sortedExpenses = transformedExpenses.sort((a, b) => getExpenseSortTime(b) - getExpenseSortTime(a));
          setExpenses(sortedExpenses);
          saveTabExpenses(email, tabId, sortedExpenses);
        }
      } catch (err) {
        console.error("Failed to load expenses:", err);
        // Fall back to localStorage
        const data = loadTabData(email, tabId);
        // Sort expenses by date (newest first)
        const sortedExpenses = data.expenses.sort((a, b) => getExpenseSortTime(b) - getExpenseSortTime(a));
        setExpenses(sortedExpenses);
      } finally {
        setLoading(false);
      }
    };

    loadExpensesFromBackend();
  }, [email, tabId]);

  // Save expenses to localStorage (local sync)
  useEffect(() => {
    saveTabExpenses(email, tabId, expenses);
  }, [email, tabId, expenses]);

  // Save balances to localStorage (local sync)
  useEffect(() => {
    saveTabBalance(email, tabId, balance);
  }, [email, tabId, balance]);

  useEffect(() => {
    saveTabOnlineBalance(email, tabId, onlineBalance);
  }, [email, tabId, onlineBalance]);

  useEffect(() => {
    const data = loadTabData(email, tabId);
    setBalance(data.balance);
    setOnlineBalance(data.onlineBalance);
    setName("");
    setAmount("");
    setCategory("food");
    setPaymentMethod("Cash");
    setEditId(null);
    setError("");
  }, [email, tabId]);

  const getCategoryInfo = (label) => CATEGORIES.find(c => c.label === label) || CATEGORIES[6];

  const saveBalance = async () => {
    const val = Number(balanceInput);
    if (!isNaN(val) && val >= 0) {
      setBalance(val);
      setEditBalance(false);
      // Sync to backend
      try {
        setSyncing(true);
        await updateBalance(tabId, val, onlineBalance);
      } catch (err) {
        console.error("❌ Failed to update balance:", err);
        setError("Failed to update balance");
      } finally {
        setSyncing(false);
      }
    }
  };

  const saveOnlineBalance = async () => {
    const val = Number(onlineBalanceInput);
    if (!isNaN(val) && val >= 0) {
      setOnlineBalance(val);
      setEditOnlineBalance(false);
      // Sync to backend
      try {
        setSyncing(true);
        await updateBalance(tabId, balance, val);
      } catch (err) {
        console.error("❌ Failed to update online balance:", err);
        setError("Failed to update balance");
      } finally {
        setSyncing(false);
      }
    }
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

  const today     = new Date().toISOString().split("T")[0];
  const total     = expenses.reduce((sum, e) => sum + e.amount, 0);
  const remaining = balance + onlineBalance;

  const handleSubmit = async () => {
    if (!name.trim()) return setError("Please enter a name.");
    if (!amount || isNaN(amount) || Number(amount) <= 0) return setError("Enter a valid amount.");
    
    setError("");
    const expenseAmount = parseFloat(amount);
    
    // Check balance before adding/updating expense
    if (editId !== null) {
      // For editing, check if there's enough balance for the difference
      const oldExpense = expenses.find(e => e.id === editId);
      const amountDiff = expenseAmount - oldExpense.amount;
      
      if (oldExpense.paymentMethod === "Cash" && amountDiff > 0 && balance < amountDiff) {
        return setError("Insufficient balance in Cash");
      }
      if (oldExpense.paymentMethod === "Online" && amountDiff > 0 && onlineBalance < amountDiff) {
        return setError("Insufficient balance in Online");
      }
    } else {
      // For new expense, check if payment method has sufficient balance
      if (paymentMethod === "Cash" && balance < expenseAmount) {
        return setError("Insufficient balance in Cash");
      }
      if (paymentMethod === "Online" && onlineBalance < expenseAmount) {
        return setError("Insufficient balance in Online");
      }
    }
    
    try {
      setSyncing(true);
      
      if (editId !== null) {
        // Update existing expense
        const oldExpense = expenses.find(e => e.id === editId);
        const amountDiff = expenseAmount - oldExpense.amount;
        
        await updateExpense(editId, {
          name: name.trim(),
          amount: expenseAmount,
          category,
          paymentMethod,
          tabId,
        });
        
        // Update local state
        setExpenses(prev => prev.map(e =>
          e.id === editId ? { ...e, name: name.trim(), amount: expenseAmount, category, paymentMethod } : e
        ));
        
        // Calculate new balances BEFORE state updates
        let newBalance = balance;
        let newOnlineBalance = onlineBalance;
        
        if (oldExpense.paymentMethod === "Cash") {
          newBalance = balance - amountDiff;
          setBalance(newBalance);
        } else {
          newOnlineBalance = onlineBalance - amountDiff;
          setOnlineBalance(newOnlineBalance);
        }
        
        // Sync balance with calculated values
        try {
          await updateBalance(tabId, newBalance, newOnlineBalance);
        } catch (err) {
          console.error("❌ Failed to sync balance after expense edit:", err);
        }
        
        setEditId(null);
      } else {
        // Create new expense
        const response = await createExpense({
          name: name.trim(),
          amount: expenseAmount,
          category,
          date: today,
          paymentMethod,
          tabId,
        });
        
        if (response.success) {
          const newExpense = {
            id: response.data._id,
            name: name.trim(),
            amount: expenseAmount,
            category,
            date: today,
            createdAt: response.data.createdAt,
            paymentMethod,
          };
          
          setExpenses(prev => [newExpense, ...prev]);
          
          // Deduct from appropriate balance and sync
          if (paymentMethod === "Cash") {
            const newBalance = balance - expenseAmount;
            setBalance(newBalance);
            // Sync balance immediately with calculated values
            try {
              await updateBalance(tabId, newBalance, onlineBalance);
            } catch (err) {
              console.error("❌ Failed to sync balance after expense creation:", err);
            }
          } else {
            const newOnlineBalance = onlineBalance - expenseAmount;
            setOnlineBalance(newOnlineBalance);
            // Sync balance immediately with calculated values
            try {
              await updateBalance(tabId, balance, newOnlineBalance);
            } catch (err) {
              console.error("❌ Failed to sync balance after expense creation:", err);
            }
          }
        }
      }
      
      setName("");
      setAmount("");
      setCategory("food");
      setPaymentMethod("Cash");
      setAnimateTotal(true);
      setTimeout(() => setAnimateTotal(false), 600);
      nameRef.current?.focus();
    } catch (err) {
      console.error("Error saving expense:", err);
      setError(err.message || "Failed to save expense");
    } finally {
      setSyncing(false);
    }
  };

  const handleEdit = (expense) => {
    setEditId(expense.id);
    setName(expense.name);
    setAmount(String(expense.amount));
    setCategory(expense.category);
    setPaymentMethod(expense.paymentMethod || "Cash");
    nameRef.current?.focus();
  };

  const handleDelete = async (id) => {
    try {
      setSyncing(true);
      const expense = expenses.find(e => e.id === id);
      
      // Validate expense exists
      if (!expense) {
        console.error("❌ Expense not found");
        setShowConfirm(null);
        return;
      }
      
      await deleteExpense(id);
      
      setExpenses(prev => prev.filter(e => e.id !== id));
      
      // Refund to appropriate balance with calculated values
      if (expense.paymentMethod === "Cash") {
        const newBalance = balance + expense.amount;
        setBalance(newBalance);
        try {
          await updateBalance(tabId, newBalance, onlineBalance);
        } catch (err) {
          console.error("❌ Failed to sync balance refund:", err);
        }
      } else {
        const newOnlineBalance = onlineBalance + expense.amount;
        setOnlineBalance(newOnlineBalance);
        try {
          await updateBalance(tabId, balance, newOnlineBalance);
        } catch (err) {
          console.error("❌ Failed to sync balance refund:", err);
        }
      }
      
      setShowConfirm(null);
    } catch (err) {
      console.error("❌ Error deleting expense:", err);
    } finally {
      setSyncing(false);
    }
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.setFillColor(88, 28, 135);
    doc.rect(0, 0, 210, 30, "F");
    doc.setTextColor(255, 255, 255); doc.setFontSize(18);
    doc.text(`Expense Report — ${tabName}`, 14, 18);
    doc.setFontSize(10);
    doc.text(`Date: ${new Date().toLocaleDateString("en-IN")}`, 150, 18);
    doc.setTextColor(0, 0, 0); doc.setFontSize(12);
    doc.text(`Total Spent:    ${formatCurrency(total)}`,          14, 42);
    doc.text(`Cash Balance:   ${formatCurrency(balance)}`,        14, 51);
    doc.text(`Online Balance: ${formatCurrency(onlineBalance)}`,  14, 60);
    doc.text(`Remaining:      ${formatCurrency(remaining)}`,      14, 69);
    autoTable(doc, {
      startY: 77,
      head: [["#", "Name", "Category", "Payment", "Amount"]],
      body: expenses.map((e, i) => [i + 1, e.name, e.category, e.paymentMethod || "Cash", formatCurrency(e.amount)]),
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
          expenses={expenses} balance={balance} onlineBalance={onlineBalance} total={total}
          remaining={remaining} tabName={tabName} dark={dark}
          onClose={() => setShowTextModal(false)}
        />
      )}

      {/* Action Buttons */}
      <div className="flex flex-row gap-2 sm:gap-3 mb-4 sm:mb-5">
        <button
          onClick={downloadPDF}
          className="flex-1 flex items-center justify-center gap-2 active:scale-95 transition-all rounded-xl px-4 sm:px-5 py-2.5 text-sm sm:text-base font-bold shadow-lg"
          style={{ background: "linear-gradient(135deg,#059669,#047857)", color: "#ffffff" }}
        >
          <FileDown size={16} strokeWidth={2.2} /> Download PDF
        </button>
        <button
          onClick={() => setShowTextModal(true)}
          className="flex-1 flex items-center justify-center gap-2 active:scale-95 transition-all rounded-xl px-4 sm:px-5 py-2.5 text-sm sm:text-base font-bold shadow-lg"
          style={{ background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.25)", color: "#a78bfa" }}
        >
          <FileText size={16} strokeWidth={2.2} /> Text Version
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4 sm:mb-5">
        {/* Cash Balance */}
        <div className="col-span-1 rounded-xl sm:rounded-2xl p-3 sm:p-4" style={{ background: card2, border: `1px solid ${border}` }}>
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-1">
              <Wallet size={10} color="#34d399" />
              <p className="text-[9px] sm:text-xs uppercase tracking-widest" style={{ color: "#34d399" }}>Cash Balance</p>
            </div>
            {!editBalance && (
              <button
                onClick={() => { setEditBalance(true); setBalanceInput(balance); }}
                className="p-1 hover:opacity-70 transition"
              >
                <Pencil size={9} color="#34d399" />
              </button>
            )}
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
            <p className="text-sm sm:text-lg md:text-xl font-black text-green-400">{formatCurrency(balance)}</p>
          )}
        </div>

        {/* Online Balance */}
        <div className="col-span-1 rounded-xl sm:rounded-2xl p-3 sm:p-4" style={{ background: card2, border: `1px solid ${border}` }}>
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-1">
              <ArrowLeftRight size={10} color="#3b82f6" />
              <p className="text-[9px] sm:text-xs uppercase tracking-widest" style={{ color: "#3b82f6" }}>Online Balance</p>
            </div>
            {!editOnlineBalance && (
              <button
                onClick={() => { setEditOnlineBalance(true); setOnlineBalanceInput(onlineBalance); }}
                className="p-1 hover:opacity-70 transition"
              >
                <Pencil size={9} color="#3b82f6" />
              </button>
            )}
          </div>
          {editOnlineBalance ? (
            <div className="flex gap-1 mt-1">
              <input
                type="number" value={onlineBalanceInput}
                onChange={e => setOnlineBalanceInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && saveOnlineBalance()}
                className="w-full rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                style={{ background: inputBg, color: textMain, border: `1px solid ${border}` }}
              />
              <button onClick={saveOnlineBalance} className="bg-blue-600 hover:bg-blue-500 px-1.5 sm:px-2 rounded-lg text-white">
                <Check size={12} />
              </button>
            </div>
          ) : (
            <p className="text-sm sm:text-lg md:text-xl font-black text-blue-400">{formatCurrency(onlineBalance)}</p>
          )}
        </div>

        {/* Left Balance */}
        <div
          className="col-span-1 rounded-xl sm:rounded-2xl p-3 sm:p-4"
          style={{
            background: remaining < 0 ? "rgba(239,68,68,0.1)" : card2,
            border: remaining < 0 ? "1px solid rgba(239,68,68,0.25)" : `1px solid ${border}`,
          }}
        >
          <div className="flex items-center gap-1 mb-1">
            <Zap size={10} color={remaining < 0 ? "#f87171" : "#60a5fa"} />
            <p className="text-[9px] sm:text-xs uppercase tracking-widest" style={{ color: remaining < 0 ? "#f87171" : "#60a5fa" }}>Left Balance</p>
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

          {/* Payment Method Selector */}
          <div>
            <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-2" style={{ color: textMuted }}>Payment Method</p>
            <div style={{
              display: "flex", gap: 4, padding: 4, borderRadius: 14,
              background: dark ? "rgba(0,0,0,0.5)" : "rgba(109,40,217,0.07)",
              border: dark ? "1px solid rgba(255,255,255,0.04)" : "1px solid rgba(109,40,217,0.12)",
            }}>
              <button
                onClick={() => setPaymentMethod("Cash")}
                style={{
                  flex: 1, padding: "10px 0", borderRadius: 10,
                  fontSize: 13, fontWeight: 600, cursor: "pointer",
                  transition: "all 0.25s cubic-bezier(.4,0,.2,1)",
                  border: paymentMethod === "Cash" ? "1px solid rgba(139,92,246,0.25)" : "1px solid transparent",
                  background: paymentMethod === "Cash"
                    ? dark
                      ? "linear-gradient(135deg, rgba(76,29,149,0.8) 0%, rgba(67,56,202,0.7) 100%)"
                      : "linear-gradient(135deg, rgba(109,40,217,0.15) 0%, rgba(99,102,241,0.12) 100%)"
                    : "transparent",
                  color: paymentMethod === "Cash" ? (dark ? "#e9d5ff" : "#6d28d9") : (dark ? "#4b5563" : "#9ca3af"),
                  boxShadow: paymentMethod === "Cash" ? "0 4px 16px rgba(88,28,135,0.15)" : "none",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                Cash
              </button>
              <button
                onClick={() => setPaymentMethod("Online")}
                style={{
                  flex: 1, padding: "10px 0", borderRadius: 10,
                  fontSize: 13, fontWeight: 600, cursor: "pointer",
                  transition: "all 0.25s cubic-bezier(.4,0,.2,1)",
                  border: paymentMethod === "Online" ? "1px solid rgba(139,92,246,0.25)" : "1px solid transparent",
                  background: paymentMethod === "Online"
                    ? dark
                      ? "linear-gradient(135deg, rgba(76,29,149,0.8) 0%, rgba(67,56,202,0.7) 100%)"
                      : "linear-gradient(135deg, rgba(109,40,217,0.15) 0%, rgba(99,102,241,0.12) 100%)"
                    : "transparent",
                  color: paymentMethod === "Online" ? (dark ? "#e9d5ff" : "#6d28d9") : (dark ? "#4b5563" : "#9ca3af"),
                  boxShadow: paymentMethod === "Online" ? "0 4px 16px rgba(88,28,135,0.15)" : "none",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                Online
              </button>
            </div>
          </div>

          <div className="flex gap-2 sm:gap-3">
            <button
              onClick={handleSubmit}
              disabled={syncing || loading}
              className="flex-1 bg-violet-600 hover:bg-violet-500 active:scale-95 transition-all rounded-xl py-2.5 sm:py-3 text-sm sm:text-base font-bold flex items-center justify-center gap-2 disabled:opacity-50"
              style={{ color: "#ffffff" }}
            >
              {editId ? <><Check size={15} /> Update Expense</> : <><Plus size={15} /> Add Expense</>}
            </button>
            {editId && (
              <button
                onClick={() => { setEditId(null); setName(""); setAmount(""); setCategory("food"); setPaymentMethod("Cash"); setError(""); }}
                className="px-4 sm:px-5 rounded-xl font-medium text-sm flex items-center gap-1.5 transition"
                style={{ background: dark ? "rgba(255,255,255,0.06)" : "rgba(109,40,217,0.06)", border: `1px solid ${border}`, color: textMuted }}
              >
                <X size={14} /> Cancel
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Expenses List */}
      {loading ? (
        <div className="text-center py-8" style={{ color: textMuted }}>
          Loading expenses...
        </div>
      ) : (
        <>
          {/* Month Header with Total */}
          {expenses.filter(e => e.date === today).length > 0 && (
            <div className="mb-4 sm:mb-5 flex justify-between items-center">
              <p className="text-lg sm:text-xl font-black" style={{ color: textMain }}>
                {new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
              </p>
              <div className="text-right">
                <div className="flex items-center justify-end gap-1 mb-1">
                  <TrendingDown size={12} color={textMuted} strokeWidth={2} />
                  <p className="text-[10px] sm:text-xs uppercase tracking-widest font-semibold" style={{ color: textMuted }}>Total Spent</p>
                </div>
                <p className="text-lg sm:text-xl font-black text-violet-400">
                  {formatCurrency(expenses.filter(e => e.date === today).reduce((s, e) => s + e.amount, 0))}
                </p>
              </div>
            </div>
          )}

          {/* Today's Expenses Only */}
          {expenses.filter(e => e.date === today).length === 0 ? (
        <div className="text-center py-12 px-4" style={{ color: textMuted }}>
          <FolderOpen size={32} className="mx-auto mb-2 opacity-50" />
          <p className="text-sm">No expenses today. Add one to get started!</p>
        </div>
      ) : (
        <div className="space-y-2 sm:space-y-3">
          {expenses.filter(e => e.date === today).map(expense => {
            const cat = getCategoryInfo(expense.category);
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
                      <Icon size={9} strokeWidth={2} /> {expense.category} · Today
                    </p>
                    <div className="flex items-center gap-1 sm:gap-2 flex-wrap mt-1">
                      <span className="text-[10px] sm:text-xs px-2 sm:px-2.5 py-0.5 rounded-full"
                        style={{ 
                          background: expense.paymentMethod === "Cash" ? "rgba(52,211,153,0.1)" : "rgba(59,130,246,0.1)",
                          color: expense.paymentMethod === "Cash" ? "#34d399" : "#3b82f6"
                        }}>
                        {expense.paymentMethod || "Cash"}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
                  <p className="font-black text-sm sm:text-lg" style={{ color: textMain }}>{formatCurrency(expense.amount)}</p>
                  <div className="flex gap-1 transition-opacity">
                    {showConfirm === expense.id ? (
                      <div className="flex gap-1">
                        <button onClick={() => handleDelete(expense.id)}
                          disabled={syncing}
                          className="px-1.5 sm:px-2 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white text-[10px] sm:text-xs font-bold flex items-center gap-1 disabled:opacity-50">
                          <Check size={10} /> Del
                        </button>
                        <button onClick={() => setShowConfirm(null)}
                          disabled={syncing}
                          className="px-1.5 sm:px-2 py-1 rounded-lg text-[10px] sm:text-xs flex items-center gap-1 disabled:opacity-50"
                          style={{ background: dark ? "rgba(255,255,255,0.08)" : "rgba(109,40,217,0.06)", color: textMuted }}>
                          <X size={10} /> No
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => handleEdit(expense)}
                          disabled={syncing}
                          className="p-1 sm:p-1.5 rounded-lg transition disabled:opacity-50"
                          style={{ color: textMuted, background: "transparent" }}
                          onMouseOver={e => { e.currentTarget.style.background = "rgba(59,130,246,0.1)"; e.currentTarget.style.color = "#3b82f6"; }}
                          onMouseOut={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = textMuted; }}
                        >
                          <Pencil size={13} strokeWidth={2} />
                        </button>
                        <button
                          onClick={() => setShowConfirm(expense.id)}
                          disabled={syncing}
                          className="p-1 sm:p-1.5 rounded-lg transition disabled:opacity-50"
                          style={{ color: textMuted, background: "transparent" }}
                          onMouseOver={e => { e.currentTarget.style.background = "rgba(239,68,68,0.1)"; e.currentTarget.style.color = "#f87171"; }}
                          onMouseOut={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = textMuted; }}
                        >
                          <Trash2 size={13} strokeWidth={2} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
        </>
      )}
    </div>
  );
}