import { useState, useEffect } from "react";
import { userKey }             from "../auth/auth";
import { useTheme }            from "../auth/ThemeContext";
import { TrendingUp }          from "lucide-react";
import { loadTabMeta, loadTabData, deleteTabStorage, formatCurrency } from "../auth/utils";
import { createTab as createTabAPI, deleteTab as deleteTabAPI, renameTab as renameTabAPI, getTabs as getBackendTabs } from "../api/tabApi.js";
import Header              from "../components/Header";
import Navbar              from "../components/Navbar";
import TabPanel            from "../components/TabPanel";
import Footer              from "../components/Footer";
import AddBalanceModal     from "../components/AddBalanceModal";
import BalanceHistoryModal from "../components/BalanceHistoryModal";

export default function ExpenseTracker({ user, onLogout }) {
  const { dark } = useTheme();
  const { email } = user;

  const [tabs, setTabs]           = useState(() => loadTabMeta(email));
  const [activeTab, setActiveTab] = useState(() => {
    const savedTab = localStorage.getItem(userKey(email, "activeTab"));
    const tabs = loadTabMeta(email);
    return savedTab && tabs.some(t => t.id === savedTab) ? savedTab : tabs[0]?.id;
  });
  const [renamingId, setRenamingId]   = useState(null);
  const [renameValue, setRenameValue] = useState("");
  const [showBalances, setShowBalances] = useState(true);
  const [showAddBalance, setShowAddBalance] = useState(false);
  const [showHistory, setShowHistory]       = useState(false);

  const historyKey = userKey(email, "balance_history");
  const [balanceHistory, setBalanceHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem(historyKey)) || []; }
    catch { return []; }
  });

  const border    = dark ? "rgba(255,255,255,0.08)" : "rgba(109,40,217,0.12)";
  const textMain  = dark ? "#fff"    : "#1a1a2e";
  const textMuted = dark ? "#6b7280" : "#9ca3af";

  useEffect(() => {
    localStorage.setItem(userKey(email, "tabs_meta"), JSON.stringify(tabs));
  }, [email, tabs]);

  useEffect(() => {
    localStorage.setItem(userKey(email, "activeTab"), activeTab);
  }, [email, activeTab]);

  useEffect(() => {
    localStorage.setItem(historyKey, JSON.stringify(balanceHistory));
  }, [balanceHistory, historyKey]);

  useEffect(() => {
    const syncTabsToBackend = async () => {
      try {
        const response = await getBackendTabs();
        const backendTabIds = new Set((response.data || []).map(t => t.tabId));
        for (const tab of tabs) {
          if (!backendTabIds.has(tab.id)) {
            try { await createTabAPI(tab.name, tab.id); }
            catch (err) { if (err.message !== "Tab already exists") console.error(`⚠️`, err.message); }
          }
        }
      } catch (err) {
        for (const tab of tabs) {
          try { await createTabAPI(tab.name, tab.id); }
          catch (err) { if (err.message !== "Tab already exists") console.error(`⚠️`, err.message); }
        }
      }
    };
    if (tabs.length > 0) syncTabsToBackend();
  }, []);

  const allTotal = tabs.reduce((sum, tab) => {
    const data = loadTabData(email, tab.id);
    return sum + data.expenses.reduce((s, e) => s + e.amount, 0);
  }, 0);

  const addTab = () => {
    const newId = `tab_${Date.now()}`;
    const newTabName = `Tab ${tabs.length + 1}`;
    createTabAPI(newTabName, newId).catch(err => console.error(err));
    setTabs(prev => [...prev, { id: newId, name: newTabName }]);
    setActiveTab(newId);
  };

  const deleteTab = (tabId) => {
    if (tabs.length === 1) return;
    deleteTabAPI(tabId).catch(err => console.error(err));
    deleteTabStorage(email, tabId);
    const rest = tabs.filter(t => t.id !== tabId);
    setTabs(rest);
    if (activeTab === tabId) setActiveTab(rest[0].id);
  };

  const startRename = (tab) => { setRenamingId(tab.id); setRenameValue(tab.name); };
  const saveRename  = () => {
    if (!renameValue.trim()) return;
    renameTabAPI(renamingId, renameValue.trim()).catch(err => console.error(err));
    setTabs(prev => prev.map(t => t.id === renamingId ? { ...t, name: renameValue.trim() } : t));
    setRenamingId(null);
  };

  const handleSaveBalance = (entry) => {
    // entry has { cashAmount, onlineAmount, note, createdAt }
    setBalanceHistory(prev => [...prev, entry]);
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
        <Header
          onAddBalance={() => setShowAddBalance(true)}
          showBalances={showBalances}
          onToggleBalances={() => setShowBalances(p => !p)}
          onShowHistory={() => setShowHistory(true)}
        />

        {/* Combined total */}
        {tabs.length > 1 && (
          <div className="mb-4 rounded-xl px-4 py-2.5 flex justify-between items-center"
            style={{ background: dark ? "rgba(255,255,255,0.04)" : "rgba(109,40,217,0.06)", border: `1px solid ${border}` }}>
            <span className="text-xs sm:text-sm flex items-center gap-1.5" style={{ color: textMuted }}>
              <TrendingUp size={13} /> Combined Total ({tabs.length} tabs)
            </span>
            <span className="text-base sm:text-lg font-black text-violet-400">
              {showBalances ? formatCurrency(allTotal) : "₹••••"}
            </span>
          </div>
        )}

        <Navbar
          tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab}
          renamingId={renamingId} setRenamingId={setRenamingId}
          renameValue={renameValue} setRenameValue={setRenameValue}
          saveRename={saveRename} startRename={startRename}
          addTab={addTab} deleteTab={deleteTab}
        />

        <TabPanel
          key={activeTab}
          email={email}
          tabId={activeTab}
          tabName={activeTabName}
          dark={dark}
          showBalances={showBalances}
        />

        <Footer />
      </div>

      <AddBalanceModal
        isOpen={showAddBalance}
        onClose={() => setShowAddBalance(false)}
        onSaveBalance={handleSaveBalance}
      />

      <BalanceHistoryModal
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        history={balanceHistory}
      />
    </div>
  );
}