import { motion } from "framer-motion"
import { useLang } from "../../i18n"

interface GoalProgressProps {
  current: number
  target: number
}

export function GoalProgress({ current, target }: GoalProgressProps) {
  const { tr, fmtCurrency, fmtDecimal } = useLang()
  const pct = target > 0 ? Math.min(100, (current / target) * 100) : 0

  return (
    <div className="card-subtle rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-text-muted">
          {tr("Avec votre épargne actuelle")}
        </span>
        <span className="mono text-xs font-bold text-text">{fmtDecimal(pct, 1)}%</span>
      </div>
      <div className="h-2.5 bg-white/5 rounded-full overflow-hidden">
        {/* M12 — la barre de progression suit la charte (or/ivoire) au lieu du
            dégradé néon indigo/vert/ambre : le statut (atteint ou non) est
            porté par le pourcentage et le badge de difficulté, pas par la
            couleur de la jauge. */}
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="h-full rounded-full"
          style={{
            background: "linear-gradient(90deg, var(--color-primary-dark), var(--color-primary-light))",
          }}
        />
      </div>
      <p className="text-[10px] text-text-dim mt-2">
        {tr("Objectif visé : {target} — capital projeté avec votre épargne : {current}", {
          target: fmtCurrency(target),
          current: fmtCurrency(current),
        })}
      </p>
    </div>
  )
}
