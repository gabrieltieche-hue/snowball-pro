import { useState } from "react"
import { BookOpen, ChevronDown } from "lucide-react"
import { ENVELOPE_CONFIGS, getHistoricalDataset } from "../../engine"
import { cn } from "../../utils/cn"
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
      label: "Rendement",
      value: `Taux constant ${(historical.avgReturn * 100).toFixed(2).replace(".", ",")} %/an brut (moyenne ${historical.name}, ${(historical.netReturn * 100).toFixed(2).replace(".", ",")} %/an net d'inflation) — courbe lissée ; Monte Carlo & Rente rejouent l'historique réel`,
    },
    {
      label: "Inflation",
      value:
        inputs.inflationMode === "historical"
          ? "Série historique réelle"
          : inputs.inflationMode === "dynamic"
            ? `Dynamique autour de ${(inputs.inflation * 100).toFixed(1)} %/an`
            : `${(inputs.inflation * 100).toFixed(1)} %/an fixe`,
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
          inputs.etfFees > 0 ? `${(inputs.etfFees * 100).toFixed(2)} % ETF` : null,
          inputs.brokerageFees > 0 ? `${(inputs.brokerageFees * 100).toFixed(2)} % courtage` : null,
          inputs.insuranceFees > 0 ? `${(inputs.insuranceFees * 100).toFixed(2)} % assurance` : null,
          inputs.managementFees > 0 ? `${(inputs.managementFees * 100).toFixed(2)} % gestion` : null,
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
        className="w-full flex items-center justify-between gap-3 px-5 py-4 hover:bg-glass-hover transition-colors"
      >
        <span className="text-xs font-bold flex items-center gap-2">
          <BookOpen size={13} className="text-primary" /> Méthodologie & hypothèses
        </span>
        <ChevronDown size={14} className={cn("text-text-dim transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="px-5 pb-5 space-y-2.5 animate-fade-in">
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
            (prélèvement forfaitaire unique, abattements assurance-vie, cotisations sociales) et modélisée comme une
            liquidation théorique à la fin de la projection. Les gains latents ne sont taxés qu'à la revente réelle —
            les montants « après impôts » sont donc une projection, pas une réalité comptable.
          </p>
        </div>
      )}
    </div>
  )
}
