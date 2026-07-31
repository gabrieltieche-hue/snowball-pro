import { motion } from "framer-motion"
interface StatCardProps {
  label: string
  value: React.ReactNode
  sub?: string
  color?: string
  icon?: React.ElementType
}

const springConfigSoft = { type: "spring" as const, stiffness: 200, damping: 20 }

export function StatCard({ label, value, sub, color, icon: Icon }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springConfigSoft}
      className="glass rounded-2xl p-4 sm:p-5 hover:bg-glass-hover transition-all duration-300"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-text-muted">{label}</span>
        {Icon && <Icon size={14} className="opacity-50" style={color ? { color } : undefined} />}
      </div>
      <div className="mono text-lg sm:text-xl font-bold tracking-tight" style={color ? { color } : undefined}>
        {value}
      </div>
      {sub && <div className="text-[11px] text-text-muted mt-1.5">{sub}</div>}
    </motion.div>
  )
}
