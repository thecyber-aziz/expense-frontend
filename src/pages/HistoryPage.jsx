import { useState, useEffect } from "react";
import { useTheme } from "../auth/ThemeContext";
import { loadTabData, formatCurrency, saveTabExpenses } from "../auth/utils";
import { userKey } from "../auth/auth";
import { CATEGORIES } from "../auth/constants";
import Header from "../components/Header";
import { ChevronLeft, Clock, Wallet, Pencil, Trash2, Check, X, FolderOpen, ChevronRight, ArrowLeftRight, Search, History, TrendingDown, User } from "lucide-react";
import { getExpenses, deleteExpense } from "../api/expenseApi.js";
import { updateBalance } from "../api/tabApi.js";

export default function HistoryPage({ user, onNavigate }) {
  const { dark } = useTheme();
  const [expenses, setExpenses] = useState([]);
  const [filter, setFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [showConfirm, setShowConfirm] = useState(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const textMain = dark ? "#fff" : "#1a1a2e";
  const textMuted = dark ? "#6b7280" : "#9ca3af";
  const card = dark ? "#141420" : "#ffffff";
  const border = dark ? "rgba(255,255,255,0.08)" : "rgba(109,40,217,0.12)";

  const email = user?.email;
  const tabs = JSON.parse(localStorage.getItem(userKey(email, "tabs_meta")) || '[{"id":"tab_1","name":"Personal"}]');
  const savedActiveTab = localStorage.getItem(userKey(email, "activeTab"));
  const activeTab = (savedActiveTab && tabs.some(t => t.id === savedActiveTab)) ? savedActiveTab : (tabs[0]?.id || "tab_1");
  const activeTabName = tabs.find(t => t.id === activeTab)?.name || "Personal";
  const getExpenseSortTime = (expense) => new Date(expense?.createdAt || expense?.date || 0).getTime();

  // Load expenses from backend for current tab
  useEffect(() => {
    const loadExpensesFromBackend = async () => {
      if (!activeTab) return;
      try {
        setLoading(true);
        const response = await getExpenses(activeTab);
        if (response.success && response.data) {
          // Transform backend data to local format with null/undefined safety
          const transformedExpenses = response.data.map(exp => ({
            id: exp._id || exp.id,
            name: exp.name || "Unnamed Expense",
            amount: exp.amount || 0,
            category: exp.category || "Other",
            date: exp.date ? new Date(exp.date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
            createdAt: exp.createdAt,
            paymentMethod: exp.paymentMethod || "Cash",
          }));
          // Sort expenses by date (newest first)
          const sortedExpenses = transformedExpenses.sort((a, b) => getExpenseSortTime(b) - getExpenseSortTime(a));
          setExpenses(sortedExpenses);
          // Save to localStorage as backup
          saveTabExpenses(email, activeTab, sortedExpenses);
        }
      } catch (err) {
        console.error("Failed to load expenses from backend:", err);
        // Fall back to localStorage
        const data = loadTabData(email, activeTab);
        // Sort expenses by date (newest first)
        const sortedExpenses = (data.expenses || []).sort((a, b) => getExpenseSortTime(b) - getExpenseSortTime(a));
        setExpenses(sortedExpenses);
      } finally {
        setLoading(false);
      }
    };

    loadExpensesFromBackend();
  }, [email, activeTab]);

  const getCategoryInfo = (label) => CATEGORIES.find(c => c.label === label) || CATEGORIES[6];

  const categoryTotals = CATEGORIES.map(cat => ({
    ...cat,
    total: expenses.filter(e => (e.category || "Other") === cat.label).reduce((s, e) => s + (e.amount || 0), 0),
  })).filter(c => c.total > 0);

  // ✅ FIXED - Added null/undefined safety checks
  const filtered = expenses
    .filter(e => filter === "All" || (e.category || "Other") === filter)
    .filter(e => {
      const searchLower = searchQuery.toLowerCase();
      const name = (e.name || "").toLowerCase();
      const category = (e.category || "").toLowerCase();
      const paymentMethod = ((e.paymentMethod || "Cash").toLowerCase());
      
      return (
        name.includes(searchLower) ||
        category.includes(searchLower) ||
        paymentMethod.includes(searchLower)
      );
    });

  // Group expenses by month
  const groupedByMonth = filtered.reduce((groups, expense) => {
    const dateObj = new Date(expense.date);
    const monthKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, "0")}`;
    const monthLabel = dateObj.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
    
    if (!groups[monthKey]) {
      groups[monthKey] = { label: monthLabel, expenses: [] };
    }
    groups[monthKey].expenses.push(expense);
    return groups;
  }, {});

  // Sort months in descending order (newest first)
  const sortedMonths = Object.entries(groupedByMonth).sort((a, b) => b[0].localeCompare(a[0]));

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
      
      // Delete from backend
      await deleteExpense(id);
      
      // Update local state
      setExpenses(prev => prev.filter(e => e.id !== id));
      
      // Update balance - refund to the correct account
      const tabs = JSON.parse(localStorage.getItem(userKey(email, "tabs_meta")) || '[{"id":"tab_1","name":"Personal"}]');
      const activeTabData = JSON.parse(localStorage.getItem(userKey(email, `balance_${activeTab}`)) || "0");
      const activeTabOnlineData = JSON.parse(localStorage.getItem(userKey(email, `onlineBalance_${activeTab}`)) || "0");
      
      if (expense.paymentMethod === "Cash") {
        const newBalance = activeTabData + expense.amount;
        localStorage.setItem(userKey(email, `balance_${activeTab}`), newBalance);
        try {
          await updateBalance(activeTab, newBalance, activeTabOnlineData);
        } catch (err) {
          console.error("❌ Failed to sync balance refund:", err);
        }
      } else {
        const newOnlineBalance = activeTabOnlineData + expense.amount;
        localStorage.setItem(userKey(email, `onlineBalance_${activeTab}`), newOnlineBalance);
        try {
          await updateBalance(activeTab, activeTabData, newOnlineBalance);
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

      <div className="relative w-full max-w-xl lg:max-w-2xl mx-auto px-3 sm:px-5 py-5 sm:py-8 h-screen flex flex-col">
        {/* Sticky Header Section */}
        <div className="sticky top-0 z-40 pb-4 sm:pb-5 -mx-3 sm:-mx-5 px-3 sm:px-5" style={{
          background: dark ? "#0a0a10" : "#f0ecff",
          backdropFilter: "blur(8px)",
          backgroundColor: dark ? "rgba(10, 10, 16, 0.95)" : "rgba(240, 236, 255, 0.95)",
        }}>
          {/* Header */}
          <div className="flex items-center gap-3 mb-5 sm:mb-6">
          
            <div>
              <h1 className="text-xl sm:text-2xl font-black flex items-center gap-2" style={{ color: textMain }}><History size={24} /> History</h1>
              <p className="text-xs sm:text-sm" style={{ color: textMuted }}>
                  <span className="inline-flex items-center gap-1" style={{ color: dark ? "#e5e7eb" : "#374151" }}>
                    <User size={12} /> {activeTabName}
                  </span> · {loading ? "Loading..." : `${expenses.length} transaction${expenses.length !== 1 ? "s" : ""}`}
              </p>
            </div>
          </div>

          {/* Grand Totals */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-4 sm:mb-5">
            {/* Grand Cash Total */}
            <div className="col-span-1 rounded-xl sm:rounded-2xl bg-gradient-to-br from-purple-400 to-violet-500 p-3 sm:p-4 shadow-xl transition-all duration-300">
              <div className="flex items-center gap-1 mb-1">
                <TrendingDown size={10} color="#e9d5ff" />
                <p className="text-purple-200 text-[9px] sm:text-xs uppercase tracking-widest">Spent Cash Total</p>
              </div>
              <p className="text-sm sm:text-lg md:text-xl font-black leading-tight" style={{ color: "#ffffff" }}>
                {formatCurrency(expenses.filter(e => (e.paymentMethod || "Cash") === "Cash").reduce((s, e) => s + (e.amount || 0), 0))}
              </p>
              <p className="text-purple-200 text-[9px] sm:text-xs mt-1">
                {expenses.filter(e => (e.paymentMethod || "Cash") === "Cash").length} item{expenses.filter(e => (e.paymentMethod || "Cash") === "Cash").length !== 1 ? "s" : ""}
              </p>
            </div>

            {/* Grand Online Total */}
            <div className="col-span-1 rounded-xl sm:rounded-2xl bg-gradient-to-br from-blue-400 to-cyan-500 p-3 sm:p-4 shadow-xl transition-all duration-300">
              <div className="flex items-center gap-1 mb-1">
                <TrendingDown size={10} color="#e0f2fe" />
                <p className="text-blue-200 text-[9px] sm:text-xs uppercase tracking-widest">Spent Online Total</p>
              </div>
              <p className="text-sm sm:text-lg md:text-xl font-black leading-tight" style={{ color: "#ffffff" }}>
                {formatCurrency(expenses.filter(e => e.paymentMethod === "Online").reduce((s, e) => s + (e.amount || 0), 0))}
              </p>
              <p className="text-blue-200 text-[9px] sm:text-xs mt-1">
                {expenses.filter(e => e.paymentMethod === "Online").length} item{expenses.filter(e => e.paymentMethod === "Online").length !== 1 ? "s" : ""}
              </p>
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

          {/* Search Input */}
          <div className="mb-4 sm:mb-5">
            <div className="relative">
              <Search size={16} 
                style={{
                  position: "absolute",
                  left: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: searchQuery ? "#8b5cf6" : textMuted,
                  pointerEvents: "none",
                  transition: "color 0.2s ease"
                }}
              />
              <input
                type="text"
                placeholder="Search by name, category, or payment method..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl px-4 sm:px-5 py-2.5 sm:py-3 pl-10 sm:pl-12 text-sm sm:text-base placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
                style={{
                  background: dark ? "rgba(0,0,0,0.35)" : "rgba(245,243,255,0.8)",
                  border: searchQuery ? "1px solid rgba(139,92,246,0.4)" : `1px solid ${border}`,
                  color: textMain,
                }}
              />
            </div>
          </div>

          {/* Category Filter */}
          <div className="flex gap-1.5 sm:gap-2 flex-nowrap sm:flex-wrap overflow-x-auto pb-2 sm:pb-0 mb-0">
            {["All", ...CATEGORIES.map(c => c.label)].map(f => {
              const catInfo = CATEGORIES.find(c => c.label === f);
              const Icon = catInfo?.icon;
              return (
                <button key={f} onClick={() => setFilter(f)}
                  className="px-2.5 sm:px-3 py-1.5 rounded-full text-[10px] sm:text-xs font-semibold transition-all border whitespace-nowrap flex-shrink-0 flex items-center gap-1 cursor-pointer"
                  style={{
                    background: filter === f ? "#7c3aed" : "transparent",
                    border: filter === f ? "1px solid #7c3aed" : `1px solid ${border}`,
                    color: filter === f ? "#fff" : textMuted,
                    boxShadow: "0 0 0 0 transparent",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transition = "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)";
                    if (filter !== f) {
                      e.currentTarget.style.background = dark ? "rgba(124,58,237,0.2)" : "rgba(124,58,237,0.15)";
                      e.currentTarget.style.borderColor = "#a78bfa";
                      e.currentTarget.style.color = "#a78bfa";
                      e.currentTarget.style.boxShadow = dark 
                        ? "0 4px 12px rgba(124,58,237,0.2)" 
                        : "0 4px 12px rgba(124,58,237,0.15)";
                    } else {
                      e.currentTarget.style.boxShadow = dark 
                        ? "0 6px 16px rgba(124,58,237,0.3)" 
                        : "0 6px 16px rgba(124,58,237,0.2)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transition = "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)";
                    if (filter !== f) {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.borderColor = border;
                      e.currentTarget.style.color = textMuted;
                      e.currentTarget.style.boxShadow = "0 0 0 0 transparent";
                    } else {
                      e.currentTarget.style.boxShadow = "0 0 0 0 transparent";
                    }
                  }}
                >
                  {f === "All"
                    ? <><FolderOpen size={11} strokeWidth={2} /> All</>
                    : <>{Icon && <Icon size={11} strokeWidth={2} />} {f}</>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-8" style={{ color: textMuted }}>
            <p className="text-sm">Loading expenses...</p>
          </div>
        )}

        {/* Scrollable Expenses List */}
        {!loading && (
          <div className="flex-1 overflow-y-auto scrollbar-hide pr-2">
            {/* Content inside scrollable container */}
            <div className="flex flex-col gap-4 sm:gap-5">
              {filtered.length === 0 && (
                <div className="text-center py-12 sm:py-16" style={{ color: textMuted }}>
                  <Wallet size={48} className="mx-auto mb-3 opacity-20" />
                  <p className="text-xs sm:text-sm">{expenses.length === 0 ? "No expenses yet." : "No expenses in this category."}</p>
                </div>
              )}
              {sortedMonths.map(([monthKey, monthData]) => (
            <div key={monthKey}>
              {/* Month Header */}
              <div className="mb-3 sm:mb-4 flex justify-between items-center">
                <p className="text-base sm:text-lg font-black" style={{ color: textMain }}>
                  {monthData.label}
                </p>
                <div className="text-right">
                  <div className="flex items-center justify-end gap-1 mb-1">
                    <TrendingDown size={12} color={textMuted} strokeWidth={2} />
                    <p className="text-[10px] sm:text-xs uppercase tracking-widest font-semibold" style={{ color: textMuted }}>Total Spent</p>
                  </div>
                  <p className="text-base sm:text-lg font-black text-violet-400">
                    {formatCurrency(monthData.expenses.reduce((s, e) => s + (e.amount || 0), 0))}
                  </p>
                </div>
              </div>

              {/* Expenses in this month */}
              <div className="flex flex-col gap-2">
                {monthData.expenses.sort((a, b) => getExpenseSortTime(b) - getExpenseSortTime(a)).map(expense => {
                  const cat = getCategoryInfo(expense.category || "Other");
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
                            <Icon size={9} strokeWidth={2} /> {expense.category} · {new Date(expense.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }).replace(/ /g, "-")}
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
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}