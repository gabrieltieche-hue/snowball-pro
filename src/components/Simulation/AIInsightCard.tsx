import { motion } from "framer-motion"
import { Sparkles } from "lucide-react"
import { deflationFactor, fmtCurrency, getHistoricalDataset } from "../../engine"
import { SectionHeader } from "../shared/SectionHeader"
import type { SimulationInputs, YearRow, KPIs } from "../../types"
import type { UiMode } from "../../utils/uiMode"

interface AIInsightCardProps {
  rows: YearRow[]
  inputs: SimulationInputs
  kpis: KPIs | null
  /** Mode Débutant / Avancé (audit) : le terme « XIRR » est masqué en Débutant. */
  uiMode?: UiMode
}

export function AIInsightCard({ rows, inputs, kpis, uiMode = "debutant" }: AIInsightCardProps) {
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
  // Le XIRR est un taux NOMINAL NET DE FRAIS : le qualifier de « brut » ou de
  // « réel » le confondait avec le taux appliqué ou la carte « Après
  // inflation » (audit v5.6.2 + v6.6). Depuis que la courbe lissée applique le
  // SCÉNARIO choisi (v6.4), la référence honnête est le taux brut du scénario
  // courant (prudent 5,99 / central 8,22 / optimiste 10,07) — pas la moyenne
  // arithmétique 10,07 %, qui donnait « sous la référence » même en scénario
  // central (l'écart 8,22 → 7,95 vient des frais, pas d'une sous-performance).
  const effectiveReturn = kpis.xirr > 0 ? kpis.xirr : kpis.cagr
  const historical = getHistoricalDataset(inputs.historicalIndex)
  const scenarioRate =
    (inputs.returnScenario === "prudent"
      ? historical.netReturn
      : inputs.returnScenario === "optimiste"
        ? historical.avgReturn
        : historical.compoundedReturn) * 100
  const scenarioLabel = { prudent: "Prudent", central: "Central", optimiste: "Optimiste" }[inputs.returnScenario]
  const gap = Math.abs(effectiveReturn - scenarioRate)
  // Même précision que les cartes « Statistiques clés » (2 décimales, audit
  // v6.6) : avant, « 7,95 » s'affichait « 8,0 » — un taux différent du visible
  // pour le même concept.
  const fmt2 = (r: number): string => r.toFixed(2).replace(".", ",")
  // Le terme « XIRR » est réservé au mode Avancé (audit) ; en Débutant, on
  // dit « rendement annuel (versements inclus) » — même chiffre, sans jargon.
  const returnLabel =
    uiMode === "avance"
      ? "(XIRR après frais, avant inflation, versements inclus)"
      : "(après frais, avant inflation, versements inclus)"
  if (gap > 0.5) {
    insights.push(
      effectiveReturn > scenarioRate
        ? `Votre rendement annuel de ${fmt2(effectiveReturn)}% ${returnLabel} dépasse le taux brut appliqué de ${fmt2(
            scenarioRate,
          )}%/an (scénario ${scenarioLabel}).`
        : `Votre rendement annuel de ${fmt2(effectiveReturn)}% ${returnLabel} reste sous le taux brut appliqué de ${fmt2(
            scenarioRate,
          )}%/an (scénario ${scenarioLabel}).`,
    )
  } else if (effectiveReturn > 0) {
    insights.push(
      `Votre rendement annuel de ${fmt2(effectiveReturn)}% ${returnLabel} est proche du taux brut appliqué de ${fmt2(
        scenarioRate,
      )}%/an (scénario ${scenarioLabel}).`,
    )
  }
  if (insights.length === 0) {
    insights.push(
      "Épargnez plus ou prolongez la durée : avec le temps, la bourse fait travailler votre argent (intérêts composés).",
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-gold rounded-2xl p-5">
      <SectionHeader title="Analyse & conseils" icon={Sparkles} level="card" />
      {insights.map((text, i) => (
        <p key={i} className="text-xs text-text-muted leading-relaxed mb-1 flex items-start gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-[5px]" aria-hidden />
          <span>{text}</span>
        </p>
      ))}
      <p className="text-[10px] text-text-dim mt-3 italic">
        Projections hypothétiques. Les performances passées ne préjugent pas des résultats futurs.
      </p>
    </motion.div>
  )
}
