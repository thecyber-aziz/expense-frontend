import { useState, useEffect } from "react";
import { userKey }             from "../auth/auth";
import { useTheme }            from "../auth/ThemeContext";
import { TrendingUp }          from "lucide-react";
import { loadTabMeta, loadTabData, deleteTabStorage, formatCurrency } from "../auth/utils";
import Header                  from "../components/Header";
import Navbar                  from "../components/Navbar";
import TabPanel                from "../components/TabPanel";
import Footer                  from "../components/Footer";
export default function ExpenseTracker({ user, onLogout }) {
  const { dark } = useTheme();
  const { email } = user;

  const [tabs, setTabs]               = useState(() => loadTabMeta(email));
  const [activeTab, setActiveTab]     = useState(() => loadTabMeta(email)[0].id);
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
        <Header />

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

        <Navbar
          tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab}
          renamingId={renamingId} setRenamingId={setRenamingId}
          renameValue={renameValue} setRenameValue={setRenameValue}
          saveRename={saveRename} startRename={startRename}
          addTab={addTab} deleteTab={deleteTab}
        />

        <TabPanel key={activeTab} email={email} tabId={activeTab} tabName={activeTabName} dark={dark} />

        <Footer />
      </div>
    </div>
  );
}