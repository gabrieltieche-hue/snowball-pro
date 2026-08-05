import { motion } from "framer-motion"
import { Sparkles } from "lucide-react"
import { deflationFactor, fmtCurrency, getHistoricalDataset } from "../../engine"
import { SectionHeader } from "../shared/SectionHeader"
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
  // Le XIRR est un taux NOMINAL : le qualifier de « réel » le confondait avec
  // la carte « Après inflation » (audit v5.6.2). On compare au brut de
  // référence (10,07 %/an MSCI World) et on n'alerte que sur un écart qui a du
  // sens — avant, « 10,1 % dépasse 10,1 % » s'affichait avec les réglages par
  // défaut.
  const effectiveReturn = kpis.xirr > 0 ? kpis.xirr : kpis.cagr
  const datasetAvg = getHistoricalDataset(inputs.historicalIndex).avgReturn * 100
  const gap = Math.abs(effectiveReturn - datasetAvg)
  if (gap > 0.5) {
    insights.push(
      effectiveReturn > datasetAvg
        ? `Votre rendement annuel de ${effectiveReturn.toFixed(1).replace(".", ",")}% (XIRR brut avant inflation, versements inclus) dépasse la moyenne de référence de ${datasetAvg.toFixed(1).replace(".", ",")}%/an.`
        : `Votre rendement annuel de ${effectiveReturn.toFixed(1).replace(".", ",")}% (XIRR brut avant inflation, versements inclus) reste sous la moyenne de référence de ${datasetAvg.toFixed(1).replace(".", ",")}%/an.`,
    )
  } else if (effectiveReturn > 0) {
    insights.push(
      `Votre rendement annuel de ${effectiveReturn.toFixed(1).replace(".", ",")}% (XIRR brut avant inflation, versements inclus) est proche de la moyenne de référence du MSCI World (${datasetAvg.toFixed(1).replace(".", ",")}%/an).`,
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
      className="glass-gold rounded-2xl p-5"
    >
      <SectionHeader title="Analyse & conseils" icon={Sparkles} level="card" />
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
