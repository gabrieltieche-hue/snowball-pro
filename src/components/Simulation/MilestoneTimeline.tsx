import { motion } from "framer-motion"
import { Trophy } from "lucide-react"
import type { Milestone, YearRow } from "../../types"

interface MilestoneTimelineProps {
  milestones: Milestone[]
  rows: YearRow[]
}

const springConfigSoft = { type: "spring" as const, stiffness: 200, damping: 20 }

export function MilestoneTimeline({ milestones, rows }: MilestoneTimelineProps) {
  const lastRow = rows[rows.length - 1]
  if (!lastRow) return null

  const reached = milestones.filter(m => m.reached && m.year >= 0)

  return (
    <div className="glass rounded-2xl p-5">
      <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-text-muted mb-4">Vos étapes clés</div>
      <div className="space-y-3">
        {reached.length === 0 && (
          <p className="text-xs text-text-dim">
            Épargnez plus ou allongez la durée pour atteindre vos premières étapes.
          </p>
        )}
        {reached.map((m, i) => (
          <motion.div
            key={m.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05, ...springConfigSoft }}
            className="flex items-center gap-3"
          >
            <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center">
              <Trophy size={11} className="text-primary" />
            </div>
            <div>
              <p className="text-xs font-semibold text-text">{m.label}</p>
              <p className="text-[10px] text-text-dim">
                {m.year <= 0 ? "Atteint dès aujourd'hui" : `Atteint en année ${m.year}`}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
