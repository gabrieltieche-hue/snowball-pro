import { Activity, Gauge, Layers, Receipt, Shield, Timer, TrendingDown, TrendingUp, Wallet } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { fmtCurrency } from "../../engine"
import { HelpTip } from "../shared/HelpTip"
import { SectionHeader } from "../shared/SectionHeader"
import type { KPIs } from "../../types"
import type { UiMode } from "../../utils/uiMode"

interface KpiGridProps {
  kpis: KPIs | null
  /** Mode Débutant / Avancé (audit) : le terme « XIRR » est masqué en Débutant. */
  uiMode?: UiMode
}

const GOLD = "var(--color-value-gold)"
const RED = "var(--color-value-red)"

interface KpiCard {
  key: keyof KPIs
  label: string
  suffix: string
  color: string
  digits?: number
  currency?: boolean
  sub: string
  /** Variante du sous-titre sans jargon, pour le mode Débutant (audit). */
  subDebutant?: string
  icon: LucideIcon
  visible?: (k: KPIs) => boolean
}

// Indicateurs affichés selon la simulation : on masque les stats qui n'ont
// pas de sens (pas de chute, pas de risque, capital qui ne double pas) et on
// évite les doublons avec le camembert 3D « D'où vient votre argent ? ».
// Avec la courbe lissée du Simulateur (v5.6.0), le sharpe vaut toujours 0 et
// la chute maximale est nulle → 6 cartes par défaut : une grille 2×3 remplie
// sans trou (avant : auto-fit 4 colonnes → 2 cases vides au 2e rang).
const CARDS: KpiCard[] = [
  {
    key: "xirr",
    label: "Rendement / an",
    suffix: "%",
    color: GOLD,
    sub: "XIRR brut (avant inflation) de VOTRE projection — la courbe lissée applique la moyenne des années",
    subDebutant:
      "rendement annuel moyen de votre projection, avant inflation — la courbe lissée applique la moyenne des années",
    icon: TrendingUp,
  },
  {
    key: "sharpe",
    label: "Gain par risque",
    suffix: "",
    color: GOLD,
    digits: 2,
    sub: "le gain obtenu pour chaque risque pris (Sharpe)",
    icon: Activity,
    visible: k => k.sharpe > 0,
  },
  {
    key: "capitalMultiple",
    label: "Multiplié par",
    suffix: "x",
    color: GOLD,
    sub: "capital final ÷ argent épargné",
    icon: Layers,
    visible: k => k.capitalMultiple > 0,
  },
  {
    key: "doublingTime",
    label: "Pour doubler",
    suffix: " ans",
    color: GOLD,
    sub: "années pour que votre capital double",
    icon: Timer,
    visible: k => k.doublingTime !== null,
  },
  {
    key: "realReturn",
    label: "Après inflation",
    suffix: "%",
    color: GOLD,
    sub: "rendement réel de VOTRE projection (courbe lissée, sans krachs) — la référence historique réelle est d'env. 5,99 %/an",
    icon: Shield,
  },
  {
    key: "maxDrawdownPct",
    label: "Pire chute",
    suffix: "%",
    color: RED,
    sub: "la plus grosse baisse du capital en cours de route",
    icon: TrendingDown,
    visible: k => k.maxDrawdownPct > 0.05,
  },
  {
    key: "totalFees",
    label: "Frais payés",
    suffix: "",
    color: RED,
    currency: true,
    sub: "tous les frais cumulés sur la durée",
    icon: Receipt,
    visible: k => k.totalFees > 0,
  },
  {
    key: "powerPurchaseRatio",
    label: "Pouvoir d'achat conservé",
    suffix: "%",
    color: GOLD,
    sub: "part de la valeur du capital restant après inflation",
    icon: Wallet,
    visible: k => k.powerPurchaseRatio > 0 && k.powerPurchaseRatio < 100,
  },
]

export function KpiGrid({ kpis, uiMode = "debutant" }: KpiGridProps) {
  if (!kpis) return null

  const cards = CARDS.filter(card => !card.visible || card.visible(kpis))

  return (
    <div className="animate-fade-in min-w-0">
      {/* v6 : rétrogradé au niveau « card » — le héro est désormais LE niveau
          « page » de l'onglet, « Statistiques clés » ne doit pas lui faire
          concurrence en pleine page (revue adverse). */}
      <SectionHeader title="Statistiques clés" icon={Gauge} level="card" as="h3" />
      {/* Grille 2×3 par défaut (6 cartes) : aucune case vide, contrairement à
          l'ancien auto-fit qui laissait un trou de 2 cartes sur les écrans
          larges. Les cartes sont plus hautes → le bloc remplit mieux la
          colonne à côté du panneau fiscal. */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {cards.map(kpi => {
          const val = kpis[kpi.key]
          const display = kpi.currency
            ? fmtCurrency(val as number)
            : `${(val as number).toFixed(kpi.digits ?? 1).replace(".", ",")}${kpi.suffix}`
          const Icon = kpi.icon
          return (
            <div
              key={kpi.key}
              className="card-subtle rounded-2xl p-4 card-interactive flex flex-col min-w-0 min-h-[132px]"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="text-[10px] font-semibold uppercase tracking-wide text-text-muted leading-snug min-w-0">
                  {kpi.label}
                  {/* XIRR : terme technique masqué en mode Débutant (audit) ;
                      le sous-titre devient la source principale. */}
                  {kpi.key === "xirr" && uiMode === "avance" && (
                    <HelpTip
                      text="XIRR : le rendement annuel réellement obtenu par VOTRE projection, versements étalés dans le temps inclus, avant inflation."
                      className="ml-1 align-[-1px]"
                    />
                  )}
                </div>
                <span
                  className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: `color-mix(in srgb, ${kpi.color} 12%, transparent)`, color: kpi.color }}
                >
                  <Icon size={12} aria-hidden />
                </span>
              </div>
              <div className="mono text-lg font-bold mt-2 leading-tight" style={{ color: kpi.color }}>
                {display}
              </div>
              <div className="text-[10px] text-text-muted mt-auto pt-2 leading-snug">
                {kpi.key === "xirr" && uiMode === "debutant" && "subDebutant" in kpi
                  ? (kpi as KpiCard & { subDebutant: string }).subDebutant
                  : kpi.sub}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
