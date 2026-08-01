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
      <div className="glass-gold rounded-2xl px-4 sm:px-5 py-3 flex items-center justify-between gap-3 border-l-2 border-primary/60">
        <div className="flex items-center gap-3 min-w-0">
          <GitCompareArrows size={14} className="text-primary shrink-0" />
          <span className="text-xs font-semibold text-text">Mode Comparaison actif</span>
          <span className="text-[10px] text-text-dim truncate">
            Le panneau édite le Scénario B — A est figé tel qu'au lancement
          </span>
        </div>
        <button
          type="button"
          onClick={onExit}
          className="inline-flex items-center gap-1 text-[10px] font-semibold text-text-muted hover:text-danger transition-colors shrink-0"
        >
          <X size={12} /> Quitter la comparaison
        </button>
      </div>
    </motion.div>
  )
}
