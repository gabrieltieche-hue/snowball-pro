import { Download, Moon, Printer, Sun } from "lucide-react"

interface ActionBarProps {
  onExportCSV: () => void
  onPrint: () => void
  darkMode: boolean
  onToggleDarkMode: () => void
}

export function ActionBar({ onExportCSV, onPrint, darkMode, onToggleDarkMode }: ActionBarProps) {
  return (
    <div className="flex gap-2.5 justify-end no-print">
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
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-[11px] font-bold bg-gradient-to-r from-[#C9A324] to-[#D4AF37] text-[#12100E] shadow-gold hover:from-[#D4AF37] hover:to-[#E5C158] transition-all"
      >
        <Printer size={12} /> Rapport PDF
      </button>
    </div>
  )
}
