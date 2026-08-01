import { ENVELOPE_CONFIGS } from "../../engine"
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

  const cards: StatCard[] = [
    {
      label: "Total épargné",
      value: fmt(displayInvested),
      color: "var(--color-text-muted)",
      sub: "tout l'argent que vous avez mis de côté",
    },
    {
      label: "Gains générés",
      value: `+${fmt(displayInterests)}`,
      color: "var(--color-value-gold)",
      sub: "la croissance de la bourse",
    },
    {
      label: `Après impôts (${ENVELOPE_CONFIGS.find(e => e.id === envelope)?.shortLabel ?? "BRUT"})`,
      value: fmt(netAfterTax),
      color: "var(--color-value-gold)",
      sub: envelope !== "none" ? `Impôts retirés : -${fmt(taxAmount)}` : "Aucun impôt à payer",
    },
    {
      label: "Capital final",
      value: fmt(displayFinal),
      color: "var(--color-text)",
      sub: showReal ? "en euros d'aujourd'hui (inflation déduite)" : "en euros bruts (inflation non déduite)",
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map(card => (
        <div key={card.label} className="glass rounded-2xl p-4 hover:bg-glass-hover transition-colors min-w-0">
          <div className="text-[9px] text-text-dim uppercase tracking-wider mb-2 truncate">{card.label}</div>
          <div className="mono text-sm sm:text-base font-bold truncate" style={{ color: card.color }}>
            {card.value}
          </div>
          {card.sub && <div className="text-[10px] text-text-dim mt-1 truncate">{card.sub}</div>}
        </div>
      ))}
    </div>
  )
}
