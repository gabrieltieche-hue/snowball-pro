import { motion } from "framer-motion"
import { Brain } from "lucide-react"

interface ComparisonBarProps {
  comparing: boolean
  onToggle: () => void
}

export function ComparisonBar({ comparing, onToggle }: ComparisonBarProps) {
  if (!comparing) return null

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      className="overflow-hidden no-print"
    >
      <div className="bg-[#D4AF37]/8 border-b border-[#D4AF37]/15 px-4 sm:px-6 py-3">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Brain size={14} className="text-[#D4AF37]" />
            <span className="text-xs font-semibold text-[#D4AF37]">Mode Comparaison actif</span>
            <span className="text-[10px] text-text-dim">Modifiez les paramètres pour le Scénario B</span>
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onToggle}
            className="text-[10px] text-text-dim hover:text-text underline"
          >
            Désactiver
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}
