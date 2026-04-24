import { useState } from "react";
import { useTheme } from "../auth/ThemeContext";
import { FolderOpen, Pencil, Plus, X, Check, AlertCircle } from "lucide-react";

export default function Navbar({
  tabs, activeTab, setActiveTab,
  renamingId, setRenamingId,
  renameValue, setRenameValue,
  saveRename, startRename,
  addTab, deleteTab,
}) {
  const { dark } = useTheme();
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const border    = dark ? "rgba(255,255,255,0.08)" : "rgba(109,40,217,0.12)";
  const textMain  = dark ? "#fff"    : "#1a1a2e";
  const textMuted = dark ? "#6b7280" : "#9ca3af";

  return (
    <div className="flex items-center gap-1.5 flex-nowrap overflow-x-auto pb-2 mb-5 scrollbar-hide">
      {tabs.map(tab => (
        <div key={tab.id} className="flex-shrink-0">
          {renamingId === tab.id ? (
            <div
              className="flex items-center gap-1 rounded-xl px-2.5 py-1.5"
              style={{ background: dark ? "#1e1e2e" : "#f5f3ff", border: "1px solid #7c3aed" }}
            >
              <input
                autoFocus value={renameValue}
                onChange={e => setRenameValue(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter") saveRename();
                  if (e.key === "Escape") setRenamingId(null);
                }}
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
                  style={{
                    background: dark ? "rgba(255,255,255,0.05)" : "rgba(109,40,217,0.06)",
                    border: `1px solid ${border}`,
                    color: textMuted,
                  }}
                >
                  <Pencil size={11} strokeWidth={2} />
                </button>
              )}

              {tabs.length > 1 && (
                <button
                  onClick={e => { e.stopPropagation(); setDeleteConfirm(tab.id); }}
                  className="p-1 sm:p-1.5 rounded-lg transition"
                  style={{
                    background: dark ? "rgba(255,255,255,0.05)" : "rgba(109,40,217,0.06)",
                    border: `1px solid ${border}`,
                    color: textMuted,
                  }}
                  onMouseOver={e => {
                    e.currentTarget.style.background = "rgba(239,68,68,0.1)";
                    e.currentTarget.style.color = "#f87171";
                  }}
                  onMouseOut={e => {
                    e.currentTarget.style.background = dark ? "rgba(255,255,255,0.05)" : "rgba(109,40,217,0.06)";
                    e.currentTarget.style.color = textMuted;
                  }}
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
        style={{
          borderColor: dark ? "rgba(255,255,255,0.15)" : "rgba(109,40,217,0.2)",
          color: textMuted,
        }}
        onMouseOver={e => {
          e.currentTarget.style.borderColor = "#7c3aed";
          e.currentTarget.style.color = "#a78bfa";
        }}
        onMouseOut={e => {
          e.currentTarget.style.borderColor = dark ? "rgba(255,255,255,0.15)" : "rgba(109,40,217,0.2)";
          e.currentTarget.style.color = textMuted;
        }}
      >
        <Plus size={13} strokeWidth={2} /> New Tab
      </button>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="rounded-2xl p-6 sm:p-8 max-w-sm w-full shadow-2xl" style={{ background: dark ? "#141420" : "#ffffff", border: `1px solid ${border}` }}>
            <div className="flex items-start gap-3 mb-4">
              <div className="bg-red-500/20 p-3 rounded-lg">
                <AlertCircle size={24} color="#f87171" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-bold" style={{ color: textMain }}>Delete Tab?</h3>
                <p className="text-xs sm:text-sm mt-1" style={{ color: textMuted }}>This action cannot be undone. All expenses in this tab will be permanently deleted.</p>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t" style={{ borderColor: border }}>
              <button
                onClick={() => { deleteTab(deleteConfirm); setDeleteConfirm(null); }}
                className="flex-1 px-4 py-2.5 rounded-xl font-semibold text-sm bg-red-600 hover:bg-red-500 text-white transition-all flex items-center justify-center gap-2"
              >
                <X size={16} /> Delete
              </button>
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all"
                style={{ background: dark ? "rgba(255,255,255,0.06)" : "rgba(109,40,217,0.06)", color: textMuted, border: `1px solid ${border}` }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}