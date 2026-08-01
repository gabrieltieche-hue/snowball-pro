import { Download, GitCompareArrows, Moon, Printer, Redo2, Sun, Undo2 } from "lucide-react"

interface ActionBarProps {
  onExportCSV: () => void
  onPrint: () => void
  darkMode: boolean
  onToggleDarkMode: () => void
  comparing: boolean
  onToggleCompare: () => void
  canUndo: boolean
  canRedo: boolean
  onUndo: () => void
  onRedo: () => void
}

export function ActionBar({
  onExportCSV,
  onPrint,
  darkMode,
  onToggleDarkMode,
  comparing,
  onToggleCompare,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
}: ActionBarProps) {
  return (
    <div className="flex gap-2.5 justify-end flex-wrap no-print">
      <button
        type="button"
        onClick={onUndo}
        disabled={!canUndo}
        title="Annuler (⌘Z)"
        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold glass hover:bg-glass-hover transition-colors disabled:opacity-35 disabled:cursor-not-allowed"
      >
        <Undo2 size={12} /> Annuler
      </button>
      <button
        type="button"
        onClick={onRedo}
        disabled={!canRedo}
        title="Rétablir (⌘⇧Z)"
        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold glass hover:bg-glass-hover transition-colors disabled:opacity-35 disabled:cursor-not-allowed"
      >
        <Redo2 size={12} /> Rétablir
      </button>
      <button
        type="button"
        onClick={onToggleCompare}
        title="Comparer deux scénarios"
        className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-[11px] font-bold transition-colors ${
          comparing
            ? "bg-primary text-white shadow-gold"
            : "glass hover:bg-glass-hover text-primary border border-primary/30"
        }`}
      >
        <GitCompareArrows size={12} /> {comparing ? "Quitter" : "Comparer"}
      </button>
      <button
        type="button"
        onClick={onToggleDarkMode}
        title={darkMode ? "Passer en mode clair" : "Passer en mode sombre"}
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-[11px] font-bold glass hover:bg-glass-hover transition-colors"
      >
        {darkMode ? <Sun size={12} /> : <Moon size={12} />} {darkMode ? "Clair" : "Sombre"}
      </button>
      <button
        type="button"
        onClick={onExportCSV}
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-[11px] font-bold glass hover:bg-glass-hover transition-colors"
      >
        <Download size={12} /> Export CSV
      </button>
      <button
        type="button"
        onClick={onPrint}
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-[11px] font-bold bg-gradient-to-r from-primary to-primary-light text-white shadow-gold hover:from-primary-light hover:to-primary transition-all"
      >
        <Printer size={12} /> Rapport PDF
      </button>
    </div>
  )
}
