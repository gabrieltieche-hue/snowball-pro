import { motion } from "framer-motion"
import { fmtCurrency, fmtPercent } from "../../engine"

interface TooltipPayload {
  color: string
  name: string
  value: number
}

interface CustomTooltipProps {
  active?: boolean
  payload?: TooltipPayload[]
  label?: string
  isCurrency?: boolean
}

export function CustomTooltip({ active, payload, label, isCurrency = true }: CustomTooltipProps) {
  if (!active || !payload?.length) return null

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-strong rounded-xl p-4 shadow-premium min-w-[200px]"
    >
      <p className="text-[11px] text-text-dim mb-2 font-medium">{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center justify-between gap-4 py-0.5">
          <span className="text-xs flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
            {entry.name}
          </span>
          <span className="mono text-xs font-bold" style={{ color: entry.color }}>
            {isCurrency ? fmtCurrency(entry.value) : fmtPercent(entry.value)}
          </span>
        </div>
      ))}
    </motion.div>
  )
}
