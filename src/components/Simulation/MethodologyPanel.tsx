import { useState } from "react"
import { BookOpen, ChevronDown } from "lucide-react"
import { CURRENT_TAX_YEAR, ENVELOPE_CONFIGS, getHistoricalDataset, getTaxRules, pfuRate } from "../../engine"
import { useLang } from "../../i18n"
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
  const { tr, fmtDecimal, fmtTaxPercent } = useLang()
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
  const fmtPct = (r: number) => `${fmtDecimal(r * 100, 2)} %`
  const scenarioName = tr(SCENARIO_LABELS[inputs.returnScenario])

  const rows: { label: string; value: string }[] = [
    {
      label: tr("Rendement appliqué"),
      value: tr(
        "{rate}/an — le taux du scénario « {scenario} » choisi en haut de l'onglet, appliqué chaque année par la courbe lissée du Simulateur (défaut : Central = rendement composé ≈ 8,22 %/an)",
        { rate: fmtPct(appliedRate), scenario: scenarioName },
      ),
    },
    {
      label: tr("Rendement brut"),
      value: tr(
        "{rate}/an — moyenne ARITHMÉTIQUE des années {name} (1970-2025) : le taux moyen d'une année, PAS ce que la bourse a réellement composé",
        { rate: fmtPct(historical.avgReturn), name: historical.name },
      ),
    },
    {
      label: tr("Rendement composé"),
      value: tr(
        "{rate}/an — moyenne GÉOMÉTRIQUE de la série, krachs réels (-37 % en 2008, -33 % en 2002…) inclus : ce que la bourse a réellement rapporté en cumulé",
        { rate: fmtPct(historical.compoundedReturn) },
      ),
    },
    {
      label: tr("Rendement réel"),
      value:
        uiMode === "avance"
          ? tr(
              "{rate}/an — formule de Fisher : (1 + {comp}) ÷ (1 + {infl}) − 1. Pas une simple soustraction : l'inflation rogne aussi vos gains, pas seulement le capital",
              {
                rate: fmtPct(historical.netReturn),
                comp: fmtPct(historical.compoundedReturn),
                infl: fmtPct(inputs.inflation),
              },
            )
          : tr("{rate}/an — le rendement composé une fois l'inflation déduite (le pouvoir d'achat de votre capital)", {
              rate: fmtPct(historical.netReturn),
            }),
    },
    {
      label: tr("Projection & Monte Carlo"),
      value: tr(
        "Le Simulateur applique le scénario choisi chaque année (courbe lissée, sans krachs) ; Monte Carlo & la Rente rééchantillonnent l'historique réel par blocs de 5 ans et rejouent ses krachs",
      ),
    },
    {
      label: tr("Inflation"),
      value:
        inputs.inflationMode === "historical"
          ? tr("Série historique réelle")
          : inputs.inflationMode === "dynamic"
            ? tr("Dynamique autour de {rate} %/an", { rate: fmtDecimal(inputs.inflation * 100, 1) })
            : tr("{rate} %/an fixe", { rate: fmtDecimal(inputs.inflation * 100, 1) }),
    },
    {
      label: tr("Enveloppe fiscale"),
      value: tr("{name} — taux et abattements de l'année fiscale {year} ({pfu} PFU CTO / {av} AV)", {
        name: envelope ? tr(envelope.name) : "CTO",
        year: rules.year,
        pfu: fmtTaxPercent(pfuRate(rules)),
        av: fmtTaxPercent(rules.avSocialRate),
      }),
    },
    {
      label: tr("Rendement interne (XIRR)"),
      value: tr("Calculé sur les flux réels (capital initial + versements mensuels + valeur finale)"),
    },
    {
      label: tr("Frais"),
      value:
        [
          inputs.etfFees > 0 ? tr("{rate} % ETF", { rate: fmtDecimal(inputs.etfFees * 100, 2) }) : null,
          inputs.brokerageFees > 0
            ? tr("{rate} % par versement (courtage)", { rate: fmtDecimal(inputs.brokerageFees * 100, 2) })
            : null,
          inputs.insuranceFees > 0
            ? tr("{rate} % assurance", { rate: fmtDecimal(inputs.insuranceFees * 100, 2) })
            : null,
          inputs.managementFees > 0
            ? tr("{rate} % gestion", { rate: fmtDecimal(inputs.managementFees * 100, 2) })
            : null,
        ]
          .filter(Boolean)
          .join(" + ") || tr("Aucun frais"),
    },
    {
      label: tr("Devise & dividendes"),
      value: tr(
        "Euros (EUR) — indice capitalisant : les dividendes sont réinvestis dans l'indice (MSCI World), aucun dividende séparé",
      ),
    },
    {
      label: tr("Mise à jour"),
      value: tr(
        "Taux de l'année fiscale {year} · historique MSCI World 1970-2025 · règle de rééchantillonnage : bootstrap par blocs non chevauchants de 5 ans",
        { year: CURRENT_TAX_YEAR },
      ),
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
        <SectionHeader
          bare
          level="card"
          icon={BookOpen}
          title={tr("Méthodologie & hypothèses")}
          className="flex-1 min-w-0"
        />
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
            {tr("Les impôts affichés sont une")} <strong>{tr("estimation")}</strong>{" "}
            {tr(
              "fondée sur la législation fiscale en vigueur (prélèvement forfaitaire unique, abattements assurance-vie, cotisations sociales et règles simplifiées du PER) et modélisée comme une liquidation théorique à la fin de la projection. Les gains latents ne sont taxés qu'à la revente réelle — les montants « après impôts » sont donc une projection, pas une réalité comptable.",
            )}
          </p>
        </div>
      )}
    </div>
  )
}
