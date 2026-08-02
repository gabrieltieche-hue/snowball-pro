import { deflationFactor, ENVELOPE_CONFIGS } from "../../engine"
import type { SimulationInputs, YearRow } from "../../types"

interface SummaryStatsProps {
  rows: YearRow[]
  inputs: SimulationInputs
}

const fmt = (n: number) => `${Math.round(n).toLocaleString("fr-FR")} €`

interface StatCard {
  label: string
  value: string
  color: string
  sub?: string
}

export function SummaryStats({ rows, inputs }: SummaryStatsProps) {
  const lastRow = rows[rows.length - 1]
  if (!lastRow) return null

  const { showReal, envelope } = inputs

  const displayFinal = showReal ? lastRow.real : lastRow.nominal
  const displayInvested = showReal ? lastRow.investedReal : lastRow.investedNom
  const displayInterests = Math.max(0, displayFinal - displayInvested)
  const netAfterTax = lastRow.taxNet
  const taxAmount = Math.max(0, lastRow.nominal - lastRow.taxNet)
  // MÊME facteur de déflation pour toutes les cartes (helper partagé avec le
  // panneau fiscal et les graphiques — une seule source de vérité). Avant
  // l'audit v5.1.4, « Valeur brute » suivait showReal mais « Net fiscal »
  // restait en euros courants → net affiché PLUS ÉLEVÉ que le brut
  // (1 176 k€ vs 862 k€), absurde et incohérent avec le panneau fiscal.
  const factor = deflationFactor(lastRow)
  const displayNet = showReal ? netAfterTax * factor : netAfterTax
  const displayTax = showReal ? taxAmount * factor : taxAmount

  const scaleNote = showReal ? "en euros d'aujourd'hui" : "en euros courants"

  const cards: StatCard[] = [
    {
      // « brut » veut dire avant impôts ; quand l'affichage est en euros
      // d'aujourd'hui, la valeur est nette d'inflation → libellé adapté
      // (audit v5.1.4, plus de contradiction brut/nouveaux euros).
      label: showReal ? "Valeur réelle" : "Valeur brute",
      value: fmt(displayFinal),
      color: "var(--color-text)",
      sub: `avant impôts · ${scaleNote}`,
    },
    {
      label: `Net fiscal (${ENVELOPE_CONFIGS.find(e => e.id === envelope)?.shortLabel ?? "BRUT"})`,
      value: fmt(displayNet),
      color: "var(--color-value-gold)",
      sub:
        envelope !== "none"
          ? `après impôts · ${scaleNote}`
          : "Aucun impôt à payer",
    },
    {
      // Remplaçait « Pouvoir d'achat » (doublon du Net fiscal dès que
      // showReal est actif) : la part de l'État devient visible et vérifiable
      // (brut − impôts = net), le texte « Impôts estimés (règles en vigueur) »
      // hérité du millésime fiscal supprimé a disparu.
      label: "Impôts",
      value: fmt(displayTax),
      color: "var(--color-value-red)",
      sub: "prélevés sur vos gains",
    },
    {
      label: "Total épargné",
      value: fmt(displayInvested),
      color: "var(--color-text-muted)",
      sub: `Gains de la bourse : +${fmt(displayInterests)}`,
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map(card => (
        <div key={card.label} className="glass rounded-2xl p-4 hover:bg-glass-hover transition-colors min-w-0">
          <div className="text-[10px] text-text-dim uppercase tracking-wider mb-2 truncate" title={card.label}>
            {card.label}
          </div>
          <div className="mono text-sm sm:text-base font-bold truncate" title={card.value} style={{ color: card.color }}>
            {card.value}
          </div>
          {card.sub && (
            <div className="text-[10px] text-text-dim mt-1 truncate" title={card.sub}>
              {card.sub}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
