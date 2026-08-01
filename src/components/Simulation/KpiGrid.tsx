import { fmtCurrency } from "../../engine"
import type { KPIs } from "../../types"

interface KpiGridProps {
  kpis: KPIs | null
}

const GOLD = "var(--color-value-gold)"
const RED = "var(--color-value-red)"
const NEUTRAL = "var(--color-text-muted)"

export function KpiGrid({ kpis }: KpiGridProps) {
  if (!kpis) return null

  const cards = [
    {
      key: "cagr" as const,
      label: "Croissance/an",
      suffix: "%",
      color: GOLD,
      sub: "le rendement moyen de votre capital chaque année",
    },
    {
      key: "sharpe" as const,
      label: "Gain par risque",
      suffix: "",
      color: GOLD,
      digits: 2,
      sub: "le gain obtenu pour chaque risque pris (Sharpe)",
    },
    {
      key: "maxDrawdownPct" as const,
      label: "Pire chute",
      suffix: "%",
      color: RED,
      sub: "la plus grosse baisse du capital en cours de route",
    },
    {
      key: "capitalMultiple" as const,
      label: "Multiplié par",
      suffix: "x",
      color: GOLD,
      sub: "capital final ÷ argent épargné",
    },
    {
      key: "doublingTime" as const,
      label: "Pour doubler",
      suffix: " ans",
      color: GOLD,
      sub: "années pour que votre capital double",
    },
    {
      key: "contributionPct" as const,
      label: "Part épargne",
      suffix: "%",
      color: NEUTRAL,
      sub: "issu de l'argent que vous avez mis de côté",
    },
    {
      key: "gainsPct" as const,
      label: "Part des gains",
      suffix: "%",
      color: GOLD,
      sub: "issu de la croissance de la bourse",
    },
    {
      key: "realReturn" as const,
      label: "Après inflation",
      suffix: "%",
      color: GOLD,
      sub: "votre gain réel, prix de l'inflation déduit",
    },
    {
      key: "feeImpactPct" as const,
      label: "Perdu en frais",
      suffix: "%",
      color: RED,
      sub: "part du capital parti dans les frais",
    },
    {
      key: "totalFees" as const,
      label: "Frais payés",
      suffix: "",
      color: RED,
      sub: "tous les frais cumulés sur la durée",
    },
  ] as const

  const isCurrencyKey = (k: string): boolean => k === "totalFees"

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {cards.map(kpi => {
        const val = kpis[kpi.key]
        const display =
          kpi.key === "doublingTime" && val === null
            ? "N/A"
            : isCurrencyKey(kpi.key)
              ? fmtCurrency(val as number)
              : `${(val as number).toFixed(kpi.key === "sharpe" ? 2 : 1)}${kpi.suffix}`
        return (
          <div
            key={kpi.key}
            className="glass rounded-2xl p-4 hover:bg-glass-hover transition-colors flex flex-col min-w-0"
          >
            <div className="text-[10px] font-semibold uppercase tracking-wider text-text-muted truncate">
              {kpi.label}
            </div>
            <div className="mono text-base font-bold mt-1.5 leading-tight truncate" style={{ color: kpi.color }}>
              {display}
            </div>
            <div className="text-[9px] text-text-muted mt-1 leading-snug">{kpi.sub}</div>
          </div>
        )
      })}
    </div>
  )
}
