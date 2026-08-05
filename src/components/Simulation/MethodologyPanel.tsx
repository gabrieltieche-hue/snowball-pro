import { useState } from "react"
import { BookOpen, ChevronDown } from "lucide-react"
import { ENVELOPE_CONFIGS, fmtDecimal, getHistoricalDataset } from "../../engine"
import { cn } from "../../utils/cn"
import { SectionHeader } from "../shared/SectionHeader"
import type { SimulationInputs } from "../../types"

interface MethodologyPanelProps {
  inputs: SimulationInputs
}

export function MethodologyPanel({ inputs }: MethodologyPanelProps) {
  const [open, setOpen] = useState(false)
  const envelope = ENVELOPE_CONFIGS.find(e => e.id === inputs.envelope)
  // Courbe lissée (v5.6.0) : le Simulateur applique le rendement moyen de
  // référence du MSCI World chaque année — plus de zigzags, la même courbe
  // chaque année. Monte Carlo et la Rente rééchantillonnent toujours la série.
  const historical = getHistoricalDataset(inputs.historicalIndex)

  const rows: { label: string; value: string }[] = [
    {
      label: "Rendement brut",
      value: `${(historical.avgReturn * 100).toFixed(2).replace(".", ",")} %/an — moyenne ARITHMÉTIQUE des années ${historical.name} (1970-2025) : c'est le taux constant appliqué chaque année par la courbe lissée du Simulateur`,
    },
    {
      label: "Rendement composé",
      value: `${(historical.compoundedReturn * 100).toFixed(2).replace(".", ",")} %/an — moyenne GÉOMÉTRIQUE de la série, krachs réels (-37 % en 2008, -33 % en 2002…) inclus : ce que la bourse a réellement rapporté en cumulé`,
    },
    {
      label: "Rendement réel",
      value: `${(historical.netReturn * 100).toFixed(2).replace(".", ",")} %/an — rendement composé après déduction de l'inflation (2,1 %/an) : votre gain de pouvoir d'achat sur la période`,
    },
    {
      label: "Projection & Monte Carlo",
      value: "Le Simulateur applique la moyenne brute (courbe lissée, sans krachs) ; Monte Carlo & la Rente rééchantillonnent l'historique réel et rejouent ses krachs",
    },
    {
      label: "Inflation",
      value:
        inputs.inflationMode === "historical"
          ? "Série historique réelle"
          : inputs.inflationMode === "dynamic"
            ? `Dynamique autour de ${fmtDecimal(inputs.inflation * 100, 1)} %/an`
            : `${fmtDecimal(inputs.inflation * 100, 1)} %/an fixe`,
    },
    {
      label: "Enveloppe fiscale",
      value: `${envelope?.name ?? "CTO"} — taux et abattements en vigueur`,
    },
    {
      label: "Rendement interne (XIRR)",
      value: "Calculé sur les flux réels (capital initial + versements mensuels + valeur finale)",
    },
    {
      label: "Frais",
      value:
        [
          inputs.etfFees > 0 ? `${fmtDecimal(inputs.etfFees * 100, 2)} % ETF` : null,
          inputs.brokerageFees > 0 ? `${fmtDecimal(inputs.brokerageFees * 100, 2)} % par versement (courtage)` : null,
          inputs.insuranceFees > 0 ? `${fmtDecimal(inputs.insuranceFees * 100, 2)} % assurance` : null,
          inputs.managementFees > 0 ? `${fmtDecimal(inputs.managementFees * 100, 2)} % gestion` : null,
        ]
          .filter(Boolean)
          .join(" + ") || "Aucun frais",
    },
  ]

  return (
    <div className="glass rounded-2xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-controls="methodology-content"
        className="w-full flex items-center justify-between gap-3 px-5 py-4 hover:bg-glass-hover transition-colors"
      >
        <SectionHeader bare level="card" icon={BookOpen} title="Méthodologie & hypothèses" className="flex-1 min-w-0" />
        <ChevronDown size={14} className={cn("text-text-dim transition-transform shrink-0", open && "rotate-180")} />
      </button>
      {open && (
        <div id="methodology-content" className="px-5 pb-5 space-y-2.5 animate-fade-in">
          {rows.map(row => (
            <div key={row.label} className="flex items-start justify-between gap-4 py-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-text-dim whitespace-nowrap">
                {row.label}
              </span>
              <span className="text-[11px] text-text-muted text-right leading-snug">{row.value}</span>
            </div>
          ))}
          <p className="text-[10px] text-text-dim italic leading-relaxed pt-2 border-t border-border/50">
            Les impôts affichés sont une <strong>estimation</strong> fondée sur la législation fiscale en vigueur
            (prélèvement forfaitaire unique, abattements assurance-vie, cotisations sociales et règles simplifiées du
            PER) et modélisée comme une liquidation théorique à la fin de la projection. Les gains latents ne sont taxés
            qu'à la revente réelle — les montants « après impôts » sont donc une projection, pas une réalité comptable.
          </p>
        </div>
      )}
    </div>
  )
}
