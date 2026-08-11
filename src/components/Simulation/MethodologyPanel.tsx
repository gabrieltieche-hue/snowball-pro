import { useState } from "react"
import { BookOpen, ChevronDown } from "lucide-react"
import {
  CURRENT_TAX_YEAR,
  ENVELOPE_CONFIGS,
  fmtDecimal,
  getHistoricalDataset,
  getTaxRules,
  pfuRate,
  fmtTaxPercent,
} from "../../engine"
import { cn } from "../../utils/cn"
import { SectionHeader } from "../shared/SectionHeader"
import type { SimulationInputs } from "../../types"
import type { UiMode } from "../../utils/uiMode"

interface MethodologyPanelProps {
  inputs: SimulationInputs
  /** Mode Débutant / Avancé (audit) : la formule de Fisher est masquée en Débutant. */
  uiMode?: UiMode
}

const SCENARIO_LABELS = { prudent: "Prudent", central: "Central", optimiste: "Optimiste" } as const

export function MethodologyPanel({ inputs, uiMode = "debutant" }: MethodologyPanelProps) {
  const [open, setOpen] = useState(false)
  const envelope = ENVELOPE_CONFIGS.find(e => e.id === inputs.envelope)
  // Courbe lissée (v5.6.0) : le Simulateur applique CHAQUE ANNÉE le taux du
  // scénario choisi (prudent / central / optimiste — défaut : central =
  // rendement composé ≈ 8,22 %/an), pas la moyenne arithmétique. Monte Carlo
  // et la Rente rééchantillonnent toujours la série réelle.
  const historical = getHistoricalDataset(inputs.historicalIndex)
  const appliedRate =
    inputs.returnScenario === "prudent"
      ? historical.netReturn
      : inputs.returnScenario === "optimiste"
        ? historical.avgReturn
        : historical.compoundedReturn
  const rules = getTaxRules(inputs.taxYear)
  const fmtPct = (r: number) => `${(r * 100).toFixed(2).replace(".", ",")} %`

  const rows: { label: string; value: string }[] = [
    {
      label: "Rendement appliqué",
      value: `${fmtPct(appliedRate)}/an — le taux du scénario « ${
        SCENARIO_LABELS[inputs.returnScenario]
      } » choisi en haut de l'onglet, appliqué chaque année par la courbe lissée du Simulateur (défaut : Central = rendement composé ≈ 8,22 %/an)`,
    },
    {
      label: "Rendement brut",
      value: `${fmtPct(historical.avgReturn)}/an — moyenne ARITHMÉTIQUE des années ${historical.name} (1970-2025) : le taux moyen d'une année, PAS ce que la bourse a réellement composé`,
    },
    {
      label: "Rendement composé",
      value: `${fmtPct(historical.compoundedReturn)}/an — moyenne GÉOMÉTRIQUE de la série, krachs réels (-37 % en 2008, -33 % en 2002…) inclus : ce que la bourse a réellement rapporté en cumulé`,
    },
    {
      label: "Rendement réel",
      value:
        uiMode === "avance"
          ? `${fmtPct(historical.netReturn)}/an — formule de Fisher : (1 + ${fmtPct(
              historical.compoundedReturn,
            )}) ÷ (1 + ${fmtPct(inputs.inflation)}) − 1. Pas une simple soustraction : l'inflation rogne aussi vos gains, pas seulement le capital`
          : `${fmtPct(historical.netReturn)}/an — le rendement composé une fois l'inflation déduite (le pouvoir d'achat de votre capital)`,
    },
    {
      label: "Projection & Monte Carlo",
      value:
        "Le Simulateur applique le scénario choisi chaque année (courbe lissée, sans krachs) ; Monte Carlo & la Rente rééchantillonnent l'historique réel par blocs de 5 ans et rejouent ses krachs",
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
      value: `${envelope?.name ?? "CTO"} — taux et abattements de l'année fiscale ${
        rules.year
      } (${fmtTaxPercent(pfuRate(rules))} PFU CTO / ${fmtTaxPercent(rules.avSocialRate)} AV)`,
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
    {
      label: "Devise & dividendes",
      value: `Euros (EUR) — indice capitalisant : les dividendes sont réinvestis dans l'indice (MSCI World), aucun dividende séparé`,
    },
    {
      label: "Mise à jour",
      value: `Taux de l'année fiscale ${CURRENT_TAX_YEAR} · historique MSCI World 1970-2025 · règle de rééchantillonnage : bootstrap par blocs non chevauchants de 5 ans`,
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
              {/* M15 — valeur alignée à GAUCHE : le texte justifié à droite
                  créait un bord gauche en dents de scie, pénible à lire sur
                  les longues explications. Label à gauche, valeur lisible. */}
              <span className="text-[11px] text-text-muted text-left leading-snug">{row.value}</span>
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
