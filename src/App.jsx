import { useState, useRef, useEffect } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const CATEGORIES = [
  { label: "Money Transfer", emoji: "💸", color: "bg-red-500" },
  { label: "Food", emoji: "🍔", color: "bg-pink-500" },
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

export default function ExpenseTracker() {
  /* ✅ WALLET BALANCE (manual only) */
  const [balance, setBalance] = useState(() => {
    const saved = localStorage.getItem("balance");
    return saved ? Number(saved) : 0;
  });

  const [editBalance, setEditBalance] = useState(false);
  const [balanceInput, setBalanceInput] = useState("");

  // ✅ Load expenses
  const [expenses, setExpenses] = useState(() => {
    const saved = localStorage.getItem("expenses");
    return saved ? JSON.parse(saved) : [];
  });

  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food");
  const [filter, setFilter] = useState("All");
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState("");
  const [animateTotal, setAnimateTotal] = useState(false);
  const nameRef = useRef(null);

  const today = new Date().toISOString().split("T")[0];

  /* ✅ Save data */
  useEffect(() => {
    localStorage.setItem("expenses", JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem("balance", balance);
  }, [balance]);

  const total = expenses.reduce((sum, e) => sum + e.amount, 0);

  const filtered =
    filter === "All" ? expenses : expenses.filter((e) => e.category === filter);

  const handleSubmit = () => {
    if (!name.trim()) return setError("Please enter a name.");
    if (!amount || isNaN(amount) || Number(amount) <= 0)
      return setError("Enter a valid amount.");
    setError("");

    if (editId !== null) {
      setExpenses((prev) =>
        prev.map((e) =>
          e.id === editId
            ? {
                ...e,
                name: name.trim(),
                amount: parseFloat(amount),
                category,
              }
            : e
        )
      );
      setEditId(null);
    } else {
      setExpenses((prev) => [
        {
          id: Date.now(),
          name: name.trim(),
          amount: parseFloat(amount),
          category,
          date: today,
        },
        ...prev,
      ]);
    }

    setName("");
    setAmount("");
    setCategory("Food");
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

  const handleDelete = (id) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  };

  const getCategoryInfo = (label) =>
    CATEGORIES.find((c) => c.label === label) || CATEGORIES[5];

  /* ✅ SAVE BALANCE */
  const saveBalance = () => {
    const val = Number(balanceInput);
    if (!isNaN(val) && val >= 0) {
      setBalance(val);
      setEditBalance(false);
    }
  };

  /* ✅ PROFESSIONAL PDF */
  const downloadPDF = () => {
    const doc = new jsPDF();

    // Header
    doc.setFillColor(88, 28, 135);
    doc.rect(0, 0, 210, 30, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.text("Money Expense Report", 14, 18);

    doc.setFontSize(10);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 150, 18);

    // Summary
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.text(`Total Spent: ${formatCurrency(total)}`, 14, 40);
    doc.text(`Wallet Balance: ${formatCurrency(balance)}`, 14, 48);

    // Table
    autoTable(doc, {
      startY: 55,
      head: [["Name", "Category", "Date", "Amount"]],
      body: expenses.map((e) => [
        e.name,
        e.category,
        e.date,
        formatCurrency(e.amount),
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [88, 28, 135] },
      alternateRowStyles: { fillColor: [245, 245, 245] },
    });

    doc.save("expense-report.pdf");
  };

  return (
    <div className="min-h-screen bg-[#0f0f13] text-white font-sans">
      <div className="relative max-w-2xl mx-auto px-4 py-10">

        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-black tracking-tight text-white">
            💸 Expense <span className="text-violet-400">Tracker</span>
          </h1>
          <p className="text-gray-400 mt-1 text-sm">
            Track every rupee you spend
          </p>
        </div>

        {/* PDF Button */}
        <button
          onClick={downloadPDF}
          className="mb-6 bg-green-600 hover:bg-green-700 px-5 py-2 rounded-xl font-bold"
        >
          Download PDF
        </button>

        {/* ✅ Total Card + Balance right side */}
        <div
          className={`rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-700 p-6 mb-6 shadow-2xl flex justify-between items-center transition-all duration-300 ${
            animateTotal ? "scale-105" : "scale-100"
          }`}
        >
          <div>
            <p className="text-violet-200 text-sm uppercase tracking-widest">
              Total Spent
            </p>
            <p className="text-5xl font-black mt-1">
              {formatCurrency(total)}
            </p>
            <p className="text-violet-300 text-xs mt-2">
              {expenses.length} transaction
              {expenses.length !== 1 ? "s" : ""}
            </p>
          </div>

          {/* Wallet right */}
          <div className="text-right">
            <p className="text-green-200 text-xs">Balance</p>

            {editBalance ? (
              <div className="flex gap-2 mt-1">
                <input
                  type="number"
                  value={balanceInput}
                  onChange={(e) => setBalanceInput(e.target.value)}
                  className="w-24 p-1 rounded text-black"
                />
                <button
                  onClick={saveBalance}
                  className="bg-white text-black px-2 rounded"
                >
                  Save
                </button>
              </div>
            ) : (
              <>
                <p className="text-xl font-bold text-green-300">
                  {formatCurrency(balance)}
                </p>
                <button
                  onClick={() => {
                    setEditBalance(true);
                    setBalanceInput(balance);
                  }}
                  className="text-xs text-green-200 underline"
                >
                  Edit
                </button>
              </>
            )}
          </div>
        </div>

        {/* Add Form */}
        <div className="bg-[#1c1c24] border border-white/10 rounded-2xl p-5 mb-6 shadow-xl">
          {error && (
            <div className="bg-red-500/20 text-red-300 text-sm rounded-lg px-4 py-2 mb-4">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-3">
            <input
              ref={nameRef}
              type="text"
              placeholder="Expense name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-[#2a2a35] rounded-xl px-4 py-3 text-white"
            />

            <input
              type="number"
              placeholder="Amount (₹)"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="bg-[#2a2a35] rounded-xl px-4 py-3 text-white"
            />

            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="bg-[#2a2a35] rounded-xl px-4 py-3 text-white"
            >
              {CATEGORIES.map((c) => (
                <option key={c.label} value={c.label}>
                  {c.emoji} {c.label}
                </option>
              ))}
            </select>

            <button
              onClick={handleSubmit}
              className="bg-violet-600 rounded-xl py-3 font-bold"
            >
              {editId ? "Update Expense" : "Add Expense"}
            </button>
          </div>
        </div>

        {/* Expense List */}
        <div className="flex flex-col gap-3">
          {filtered.map((expense) => {
            const cat = getCategoryInfo(expense.category);
            return (
              <div
                key={expense.id}
                className="bg-[#1c1c24] border border-white/10 rounded-2xl px-5 py-4 flex justify-between"
              >
                <div className="flex gap-4 items-center">
                  <div
                    className={`w-10 h-10 rounded-xl ${cat.color} flex items-center justify-center`}
                  >
                    {cat.emoji}
                  </div>
                  <div>
                    <p className="font-semibold">{expense.name}</p>
                    <p className="text-xs text-gray-400">
                      {expense.category} · {expense.date}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 items-center">
                  <p className="font-bold">
                    {formatCurrency(expense.amount)}
                  </p>
                  <button onClick={() => handleEdit(expense)}>✏️</button>
                  <button onClick={() => handleDelete(expense.id)}>
                    🗑️
                  </button>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
