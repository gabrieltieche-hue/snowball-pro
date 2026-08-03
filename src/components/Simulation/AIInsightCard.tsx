import { motion } from "framer-motion"
import { Sparkles } from "lucide-react"
import { deflationFactor, fmtCurrency, getHistoricalDataset } from "../../engine"
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
  // Même échelle que les cartes du haut : quand l'affichage est en euros
  // d'aujourd'hui, les montants cités sont déflatés (audit v5.2.2).
  // NOTE : la déflation est UNIFORME par ligne (real/nominal identique pour
  // toutes les colonnes) → comparer interestsNom/investedNom en nominal ou en
  // réel donne le même résultat ; on ne déflate que l'affichage du montant.
  const interests = inputs.showReal ? lastRow.interestsNom * deflationFactor(lastRow) : lastRow.interestsNom
  if (lastRow.interestsNom > lastRow.investedNom) {
    insights.push(
      `Votre argent a rapporté plus que ce que vous avez mis de côté : ${fmtCurrency(
        interests,
      )} proviennent de la croissance de la bourse.`,
    )
  }
  if (kpis.gainsPct > 50) {
    insights.push(
      `${kpis.gainsPct.toFixed(0)}% de votre capital provient de la croissance de la bourse, pas de votre épargne.`,
    )
  }
  const effectiveReturn = kpis.xirr > 0 ? kpis.xirr : kpis.cagr
  // Référence de comparaison : la moyenne du MSCI World appliquée par la
  // courbe lissée du Simulateur (v5.6.0).
  const datasetAvg = getHistoricalDataset(inputs.historicalIndex).avgReturn * 100
  if (effectiveReturn > datasetAvg) {
    insights.push(
      `Votre rendement réel de ${effectiveReturn.toFixed(1)}% (XIRR, versements inclus) dépasse la moyenne de référence de ${datasetAvg.toFixed(1)}%/an.`,
    )
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
      <p className="text-[10px] text-text-dim mt-3 italic">
        Projections hypothétiques. Les performances passées ne préjugent pas des résultats futurs.
      </p>
    </motion.div>
  )
}
