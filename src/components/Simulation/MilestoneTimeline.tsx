import { motion } from "framer-motion"
import { Trophy } from "lucide-react"
import { useLang } from "../../i18n"
import { SectionHeader } from "../shared/SectionHeader"
import type { Milestone, YearRow } from "../../types"

interface MilestoneTimelineProps {
  milestones: Milestone[]
  rows: YearRow[]
}

const springConfigSoft = { type: "spring" as const, stiffness: 200, damping: 20 }

export function MilestoneTimeline({ milestones, rows }: MilestoneTimelineProps) {
  const { tr } = useLang()
  const lastRow = rows[rows.length - 1]
  if (!lastRow) return null

  const reached = milestones.filter(m => m.reached && m.year >= 0)

  return (
    <div className="card-subtle rounded-2xl p-5">
      <SectionHeader title={tr("Vos étapes clés")} icon={Trophy} level="card" />
      <div className="space-y-3">
        {reached.length === 0 && (
          <p className="text-xs text-text-dim">
            {tr("Épargnez plus ou allongez la durée pour atteindre vos premières étapes.")}
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
              <p className="text-xs font-semibold text-text">{tr(m.label)}</p>
              <p className="text-[10px] text-text-dim">
                {m.year <= 0 ? tr("Atteint dès aujourd'hui") : tr("Atteint en année {year}", { year: m.year })}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
