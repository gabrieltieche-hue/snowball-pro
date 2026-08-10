import { motion } from "framer-motion"
import { fmtCurrency } from "../../engine"

interface GoalProgressProps {
  current: number
  target: number
}

export function GoalProgress({ current, target }: GoalProgressProps) {
  const pct = target > 0 ? Math.min(100, (current / target) * 100) : 0

  return (
    <div className="card-subtle rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-text-muted">
          Avec votre épargne actuelle
        </span>
        <span className="mono text-xs font-bold text-text">{pct.toFixed(1).replace(".", ",")}%</span>
      </div>
      <div className="h-2.5 bg-white/5 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="h-full rounded-full"
          style={{
            background:
              pct >= 100
                ? "linear-gradient(90deg, #00f291, #6366f1)"
                : pct > 50
                  ? "linear-gradient(90deg, #6366f1, #f59e0b)"
                  : "linear-gradient(90deg, #6366f1, #818cf8)",
          }}
        />
      </div>
      <p className="text-[10px] text-text-dim mt-2">
        Objectif visé : {fmtCurrency(target)} — capital projeté avec votre épargne : {fmtCurrency(current)}
      </p>
    </div>
  )
}
