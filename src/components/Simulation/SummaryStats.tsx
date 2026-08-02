import { deflationFactor, ENVELOPE_CONFIGS } from "../../engine"
import { DualAmount } from "../shared/DualAmount"
import type { SimulationInputs, YearRow } from "../../types"

interface SummaryStatsProps {
  rows: YearRow[]
  inputs: SimulationInputs
}

const fmt = (n: number) => `${Math.round(n).toLocaleString("fr-FR")} €`

interface StatCard {
  label: string
  /** Montant en euros courants (ce qui sera sur le compte). */
  nominal: number
  /** Équivalent en euros d'aujourd'hui (pouvoir d'achat). */
  real: number
  color: string
  sub?: string
}

export function SummaryStats({ rows, inputs }: SummaryStatsProps) {
  const lastRow = rows[rows.length - 1]
  if (!lastRow) return null

  const { showReal, envelope } = inputs
  const endYear = lastRow.date.split(" ")[1]?.replace(".", "")

  // MÊME facteur de déflation pour toutes les cartes (helper partagé avec le
  // panneau fiscal et les graphiques — une seule source de vérité). Avant
  // l'audit v5.1.4, « Valeur brute » suivait showReal mais « Net fiscal »
  // restait en euros courants → net affiché PLUS ÉLEVÉ que le brut
  // (1 176 k€ vs 862 k€), absurde et incohérent avec le panneau fiscal.
  const factor = deflationFactor(lastRow)
  const netAfterTax = lastRow.taxNet
  const taxAmount = Math.max(0, lastRow.nominal - lastRow.taxNet)

  // Chaque carte expose le montant sur les DEUX échelles : l'échelle mise en
  // avant (grand chiffre) suit le toggle « Euros d'aujourd'hui », l'autre
  // reste toujours visible en dessous (DualAmount). L'utilisateur voit ainsi
  // à la fois « ce qui sera sur le compte » ET « ce que ça vaut aujourd'hui ».
  const cards: StatCard[] = [
    {
      // Libellé adapté à l'échelle mise en avant (audit v5.1.4 : jamais de
      // montant net d'inflation sous un libellé « brut »). Les DEUX échelles
      // restent affichées par DualAmount quel que soit le toggle.
      label: showReal ? "Valeur réelle" : "Valeur brute",
      nominal: lastRow.nominal,
      real: lastRow.real,
      color: "var(--color-text)",
      sub: "avant impôts",
    },
    {
      label: `Net fiscal (${ENVELOPE_CONFIGS.find(e => e.id === envelope)?.shortLabel ?? "BRUT"})`,
      nominal: netAfterTax,
      real: netAfterTax * factor,
      color: "var(--color-value-gold)",
      sub: envelope !== "none" ? "après impôts" : "Aucun impôt à payer",
    },
    {
      label: "Impôts",
      nominal: taxAmount,
      real: taxAmount * factor,
      color: "var(--color-value-red)",
      sub: "prélevés sur vos gains",
    },
    {
      label: "Total épargné",
      nominal: lastRow.investedNom,
      real: lastRow.investedReal,
      color: "var(--color-text-muted)",
      sub: `Gains de la bourse : +${fmt(Math.max(0, (showReal ? lastRow.real : lastRow.nominal) - (showReal ? lastRow.investedReal : lastRow.investedNom)))}`,
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map(card => (
        <div key={card.label} className="glass rounded-2xl p-4 hover:bg-glass-hover transition-colors min-w-0">
          <div className="text-[10px] text-text-dim uppercase tracking-wider mb-2 truncate" title={card.label}>
            {card.label}
          </div>
          <DualAmount
            nominal={card.nominal}
            real={card.real}
            showReal={showReal}
            color={card.color}
            endYear={endYear}
          />
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
