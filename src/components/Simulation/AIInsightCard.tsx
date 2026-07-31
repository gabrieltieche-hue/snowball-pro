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
      `Votre portefeuille a généré plus que vos contributions. ${fmtCurrency(lastRow.interestsNom)} proviennent des intérêts composés.`,
    )
  }
  if (kpis.gainsPct > 50) {
    insights.push(`${kpis.gainsPct.toFixed(0)}% de votre capital provient des intérêts composés.`)
  }
  if (kpis.cagr > inputs.annualReturn * 100) {
    insights.push(`Votre CAGR réel de ${kpis.cagr.toFixed(1)}% dépasse le rendement cible.`)
  }
  if (inputs.crisisEnabled) {
    insights.push("Un krach boursier est intégré. Diversifiez vos actifs pour réduire l'impact.")
  }
  if (insights.length === 0) {
    insights.push("Augmentez votre taux d'épargne ou la durée pour maximiser l'effet des intérêts composés.")
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-gold rounded-2xl p-5 border-l-2 border-primary/50"
    >
      <div className="flex items-center gap-2 mb-2">
        <Sparkles size={14} className="text-primary" />
        <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-text-muted">AI Insights</span>
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
