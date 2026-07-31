import { motion } from "framer-motion"
import { PieChart } from "lucide-react"
import type { YearRow } from "../../types"

interface CapitalAllocationProps {
  rows: YearRow[]
}

export function CapitalAllocation({ rows }: CapitalAllocationProps) {
  const lastRow = rows[rows.length - 1]
  if (!lastRow) return null

  const items = [
    { label: "Capital Investi", value: lastRow.investedNom, color: "#A09888" },
    { label: "Généré par les intérêts", value: lastRow.interestsNom, color: "#D4AF37" },
    { label: "Perdu en frais/impôts", value: lastRow.tax + lastRow.feesLost, color: "#8B3A3A" },
  ]
  const total = lastRow.nominal + lastRow.tax + lastRow.feesLost

  return (
    <div className="glass rounded-3xl p-6">
      <h3 className="text-xs font-bold mb-4 flex items-center gap-2">
        <PieChart size={12} className="text-warning" />
        Répartition du Capital
      </h3>
      <div className="grid grid-cols-3 gap-4">
        {items.map(item => {
          const pct = total > 0 ? (item.value / total) * 100 : 0
          return (
            <div key={item.label} className="text-center">
              <div className="h-2 rounded-full bg-white/5 overflow-hidden mb-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  className="h-full rounded-full"
                  style={{ background: item.color }}
                />
              </div>
              <div className="text-[9px] text-text-dim">{item.label}</div>
              <div className="mono text-xs font-bold mt-0.5" style={{ color: item.color }}>
                {pct.toFixed(1)}%
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
