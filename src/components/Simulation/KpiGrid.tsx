import { Gauge } from "lucide-react"
import { fmtCurrency } from "../../engine"
import type { KPIs } from "../../types"

interface KpiGridProps {
  kpis: KPIs | null
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
    sub: "XIRR : rendement annuel calculé sur vos flux réels (versements compris)",
  },
  {
    key: "sharpe",
    label: "Gain par risque",
    suffix: "",
    color: GOLD,
    digits: 2,
    sub: "le gain obtenu pour chaque risque pris (Sharpe)",
    visible: k => k.sharpe > 0,
  },
  {
    key: "capitalMultiple",
    label: "Multiplié par",
    suffix: "x",
    color: GOLD,
    sub: "capital final ÷ argent épargné",
    visible: k => k.capitalMultiple > 0,
  },
  {
    key: "doublingTime",
    label: "Pour doubler",
    suffix: " ans",
    color: GOLD,
    sub: "années pour que votre capital double",
    visible: k => k.doublingTime !== null,
  },
  {
    key: "realReturn",
    label: "Après inflation",
    suffix: "%",
    color: GOLD,
    sub: "votre gain réel, prix de l'inflation déduit",
  },
  {
    key: "maxDrawdownPct",
    label: "Pire chute",
    suffix: "%",
    color: RED,
    sub: "la plus grosse baisse du capital en cours de route",
    visible: k => k.maxDrawdownPct > 0.05,
  },
  {
    key: "totalFees",
    label: "Frais payés",
    suffix: "",
    color: RED,
    currency: true,
    sub: "tous les frais cumulés sur la durée",
    visible: k => k.totalFees > 0,
  },
  {
    key: "powerPurchaseRatio",
    label: "Pouvoir d'achat conservé",
    suffix: "%",
    color: GOLD,
    sub: "part de la valeur du capital restant après inflation",
    visible: k => k.powerPurchaseRatio > 0 && k.powerPurchaseRatio < 100,
  },
]

export function KpiGrid({ kpis }: KpiGridProps) {
  if (!kpis) return null

  const cards = CARDS.filter(card => !card.visible || card.visible(kpis))

  return (
    <div className="animate-fade-in min-w-0">
      {/* Titre de section agrandi (demande utilisateur) : c'est un titre de
          partie — plus gros et plus imposant, aligné sur les autres titres
          de section (barre dorée + icône teintée). */}
      <div className="flex items-center gap-2.5 mb-4">
        <span className="w-1 h-5 rounded-full bg-primary" aria-hidden />
        <Gauge size={18} className="text-primary" aria-hidden />
        <h3 className="text-base sm:text-lg font-extrabold uppercase tracking-[0.08em] text-text leading-none">
          Statistiques clés
        </h3>
      </div>
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
          return (
            <div
              key={kpi.key}
              className="glass rounded-2xl p-4 hover:bg-glass-hover transition-colors flex flex-col min-w-0 min-h-[132px]"
            >
              <div className="text-[10px] font-semibold uppercase tracking-wide text-text-muted leading-snug">
                {kpi.label}
              </div>
              <div className="mono text-lg font-bold mt-2 leading-tight" style={{ color: kpi.color }}>
                {display}
              </div>
              <div className="text-[10px] text-text-muted mt-auto pt-2 leading-snug">{kpi.sub}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
