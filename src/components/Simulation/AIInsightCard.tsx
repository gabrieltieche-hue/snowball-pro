import { motion } from "framer-motion"
import { Sparkles } from "lucide-react"
import { fmtCurrency } from "../../engine"
import type { SimulationInputs, YearRow, KPIs } from "../../types"

interface AIInsightCardProps {
  rows: YearRow[]
  inputs: SimulationInputs
  kpis: KPIs | null
}

export function AIInsightCard({ rows, inputs, kpis }: AIInsightCardProps) {
  const lastRow = rows[rows.length - 1]
  if (!lastRow || !kpis) return null

  const insights: string[] = []
  if (lastRow.interestsNom > lastRow.investedNom) {
    insights.push(
      `Votre argent a rapporté plus que ce que vous avez mis de côté : ${fmtCurrency(
        lastRow.interestsNom,
      )} proviennent de la croissance de la bourse.`,
    )
  }
  if (kpis.gainsPct > 50) {
    insights.push(
      `${kpis.gainsPct.toFixed(0)}% de votre capital provient de la croissance de la bourse, pas de votre épargne.`,
    )
  }
  if (kpis.cagr > inputs.annualReturn * 100) {
    insights.push(
      `Votre croissance annuelle moyenne de ${kpis.cagr.toFixed(1)}% dépasse le rendement de ${(
        inputs.annualReturn * 100
      ).toFixed(0)}% que vous aviez prévu.`,
    )
  }
  if (inputs.crisisEnabled) {
    insights.push("Un krach boursier est simulé. Diversifiez vos placements pour réduire l'impact.")
  }
  if (insights.length === 0) {
    insights.push(
      "Épargnez plus ou prolongez la durée : avec le temps, la bourse fait travailler votre argent (intérêts composés).",
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-gold rounded-2xl p-5 border-l-2 border-primary/50"
    >
      <div className="flex items-center gap-2 mb-2">
        <Sparkles size={14} className="text-primary" />
        <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-text-muted">
          Analyse & conseils
        </span>
      </div>
      {insights.map((text, i) => (
        <p key={i} className="text-xs text-text-muted leading-relaxed mb-1">
          <span className="text-primary font-bold mr-1">✦</span>
          {text}
        </p>
      ))}
      <p className="text-[9px] text-text-dim mt-3 italic">
        Projections hypothétiques. Les performances passées ne préjugent pas des résultats futurs.
      </p>
    </motion.div>
  )
}
