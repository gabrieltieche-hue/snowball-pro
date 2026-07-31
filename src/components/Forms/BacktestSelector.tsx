import { motion } from "framer-motion"
import { cn } from "../../utils/cn"

const HISTORICAL_INDICES = [
  { id: "sp500", label: "S&P 500", avg: "10.3%", vol: "15.5%" },
  { id: "msci-world", label: "MSCI World", avg: "9.5%", vol: "14.5%" },
  { id: "nasdaq", label: "Nasdaq", avg: "12.8%", vol: "22%" },
  { id: "cac40", label: "CAC 40", avg: "8.5%", vol: "18%" },
  { id: "bitcoin", label: "Bitcoin", avg: "55%", vol: "75%" },
  { id: "gold", label: "Gold", avg: "6.5%", vol: "12%" },
]

interface BacktestSelectorProps {
  value: string
  onChange: (v: string) => void
}

export function BacktestSelector({ value, onChange }: BacktestSelectorProps) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {HISTORICAL_INDICES.map(idx => (
        <motion.button
          key={idx.id}
          whileTap={{ scale: 0.95 }}
          onClick={() => onChange(idx.id)}
          className={cn(
            "rounded-xl p-3 border text-left transition-all",
            value === idx.id ? "border-primary/50 bg-primary/10" : "glass border-border hover:bg-glass-hover",
          )}
        >
          <div className="text-xs font-bold text-text">{idx.label}</div>
          <div className="text-[9px] text-text-dim mt-1">
            {idx.avg} · {idx.vol}
          </div>
        </motion.button>
      ))}
    </div>
  )
}
