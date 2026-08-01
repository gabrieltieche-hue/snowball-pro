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
  // Pouvoir d'achat = capital NET (impôts déduits) converti en euros d'aujourd'hui.
  // lastRow.real est le brut déflaté : on applique le même facteur au net fiscal.
  const deflationFactor = lastRow.nominal > 0 ? lastRow.real / lastRow.nominal : 1
  const realNet = netAfterTax * deflationFactor

  // Le « Net fiscal » reste exprimé en euros courants (c'est le montant réel
  // après impôts) ; le « Pouvoir d'achat » le convertit en euros d'aujourd'hui.
  // Les deux cartes sont donc toujours distinctes, quel que soit le mode
  // d'affichage — pas de doublon ni d'échelles mélangées.
  const cards: StatCard[] = [
    {
      label: "Valeur brute",
      value: fmt(displayFinal),
      color: "var(--color-text)",
      sub: showReal ? "euros d'aujourd'hui (inflation déduite)" : "euros bruts, avant impôts",
    },
    {
      label: `Net fiscal (${ENVELOPE_CONFIGS.find(e => e.id === envelope)?.shortLabel ?? "BRUT"})`,
      value: fmt(netAfterTax),
      color: "var(--color-value-gold)",
      sub:
        envelope !== "none"
          ? `${showReal ? "Euros courants — " : ""}Impôts estimés (règles en vigueur) : -${fmt(taxAmount)}`
          : "Aucun impôt à payer",
    },
    {
      label: "Pouvoir d'achat",
      value: fmt(realNet),
      color: "var(--color-warning)",
      sub: "capital net en euros d'aujourd'hui (impôts et inflation déduits)",
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
