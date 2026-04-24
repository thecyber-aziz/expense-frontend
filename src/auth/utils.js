import { userKey } from "./auth";

export function formatCurrency(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR", maximumFractionDigits: 2,
  }).format(amount);
}

// Legacy localStorage functions - kept for backward compatibility only
export function loadTabMeta(email) {
  try {
    const saved = localStorage.getItem(userKey(email, "tabs_meta"));
    return saved ? JSON.parse(saved) : [{ id: "tab_1", name: "Personal" }];
  } catch { return [{ id: "tab_1", name: "Personal" }]; }
}

export function loadTabData(email, tabId) {
  try {
    const expenses = localStorage.getItem(userKey(email, `expenses_${tabId}`));
    const balance  = localStorage.getItem(userKey(email, `balance_${tabId}`));
    return {
      expenses: expenses ? JSON.parse(expenses) : [],
      balance:  balance  ? Number(balance) : 0,
    };
  } catch { return { expenses: [], balance: 0 }; }
}

export function saveTabExpenses(email, tabId, expenses) {
  localStorage.setItem(userKey(email, `expenses_${tabId}`), JSON.stringify(expenses));
}

export function saveTabBalance(email, tabId, balance) {
  localStorage.setItem(userKey(email, `balance_${tabId}`), balance);
}

export function deleteTabStorage(email, tabId) {
  localStorage.removeItem(userKey(email, `expenses_${tabId}`));
  localStorage.removeItem(userKey(email, `balance_${tabId}`));
}