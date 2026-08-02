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
      <div className="flex items-center gap-2 mb-2.5">
        <Gauge size={14} className="text-text-dim" />
        <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-text-muted">Statistiques clés</span>
      </div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(155px,1fr))] gap-2.5">
        {cards.map(kpi => {
          const val = kpis[kpi.key]
          const display = kpi.currency
            ? fmtCurrency(val as number)
            : `${(val as number).toFixed(kpi.digits ?? 1)}${kpi.suffix}`
          return (
            <div
              key={kpi.key}
              className="glass rounded-2xl p-3 hover:bg-glass-hover transition-colors flex flex-col min-w-0"
            >
              <div className="text-[10px] font-semibold uppercase tracking-wide text-text-muted leading-snug min-h-[2.75em]">
                {kpi.label}
              </div>
              <div className="mono text-sm font-bold mt-1.5 leading-tight" style={{ color: kpi.color }}>
                {display}
              </div>
              <div className="text-[10px] text-text-muted mt-1 leading-snug">{kpi.sub}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
