import { Download, Printer } from "lucide-react"

interface ActionBarProps {
  onExportCSV: () => void
  onPrint: () => void
}

export function ActionBar({ onExportCSV, onPrint }: ActionBarProps) {
  return (
    <div className="flex gap-2.5 justify-end no-print">
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
