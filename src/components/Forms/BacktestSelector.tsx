import { motion } from "framer-motion"
import { getHistoricalDataset } from "../../engine"
import { cn } from "../../utils/cn"
import type { HistoricalIndex } from "../../types"

const HISTORICAL_INDEX_ORDER: HistoricalIndex[] = ["sp500", "msci-world", "nasdaq", "cac40", "bitcoin", "gold"]

interface BacktestSelectorProps {
  value: string
  onChange: (v: string) => void
}

export function BacktestSelector({ value, onChange }: BacktestSelectorProps) {
  const indices = HISTORICAL_INDEX_ORDER.map(id => {
    const dataset = getHistoricalDataset(id)
    const firstYear = dataset.years[0]?.year
    const lastYear = dataset.years[dataset.years.length - 1]?.year
    return {
      id,
      label: dataset.name,
      avg: dataset.avgReturn * 100,
      vol: dataset.volatility * 100,
      period: firstYear && lastYear ? `${firstYear}–${lastYear}` : "",
    }
  })

  return (
    <div className="grid grid-cols-3 gap-2">
      {indices.map(idx => (
        <motion.button
          key={idx.id}
          whileTap={{ scale: 0.95 }}
          onClick={() => onChange(idx.id)}
          className={cn(
            "rounded-xl p-3 border text-left transition-all",
            value === idx.id
              ? "border-primary/60 bg-primary/15 shadow-gold"
              : "glass border-border hover:bg-glass-hover",
          )}
          aria-pressed={value === idx.id}
        >
          <div className="text-xs font-bold text-text">{idx.label}</div>
          <div className="text-[10px] text-text-muted mt-1">
            {idx.avg.toFixed(1)} %/an en moyenne · Risque {idx.vol.toFixed(1)} %
          </div>
          <div className="text-[9px] text-text-dim mt-0.5">{idx.period}</div>
        </motion.button>
      ))}
    </div>
  )
}
