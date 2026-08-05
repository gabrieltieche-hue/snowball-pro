import { motion } from "framer-motion"
import { GitCompareArrows, X } from "lucide-react"

interface ComparisonBarProps {
  onExit: () => void
}

export function ComparisonBar({ onExit }: ComparisonBarProps) {
  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="overflow-hidden no-print"
    >
      <div className="glass-gold rounded-2xl px-4 sm:px-5 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <span className="w-8 h-8 rounded-lg bg-primary/15 text-primary flex items-center justify-center shrink-0">
            <GitCompareArrows size={14} aria-hidden />
          </span>
          <span className="min-w-0">
            <span className="block text-xs font-semibold text-text">Mode Comparaison actif</span>
            <span className="block text-[10px] text-text-dim truncate">
              Le panneau édite le Scénario B — A est figé tel qu'au lancement
            </span>
          </span>
        </div>
        <button
          type="button"
          onClick={onExit}
          className="inline-flex items-center gap-1 text-[10px] font-semibold text-text-muted hover:text-danger transition-colors shrink-0 px-2 py-1 rounded-lg hover:bg-danger/10"
        >
          <X size={12} /> Quitter la comparaison
        </button>
      </div>
    </motion.div>
  )
}
