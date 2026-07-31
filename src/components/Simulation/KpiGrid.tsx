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
    { key: "cagr" as const, label: "CAGR", suffix: "%", color: GOLD, sub: "Croissance annualisée" },
    { key: "sharpe" as const, label: "Sharpe Ratio", suffix: "", color: GOLD, digits: 2, sub: "Performance ajustée au risque" },
    { key: "maxDrawdownPct" as const, label: "Drawdown Max", suffix: "%", color: RED, sub: "Pire chute du capital" },
    { key: "capitalMultiple" as const, label: "Multiple Capital", suffix: "x", color: GOLD, sub: "Capital final ÷ investi" },
    { key: "doublingTime" as const, label: "Doublement", suffix: " ans", color: GOLD, sub: "Années pour doubler" },
    { key: "contributionPct" as const, label: "Part Versements", suffix: "%", color: NEUTRAL, sub: "Issu de vos versements" },
    { key: "gainsPct" as const, label: "Part Gains", suffix: "%", color: GOLD, sub: "Issu des intérêts composés" },
    { key: "realReturn" as const, label: "Rendement Réel", suffix: "%", color: GOLD, sub: "Après inflation" },
    { key: "feeImpactPct" as const, label: "Impact Frais", suffix: "%", color: RED, sub: "Capital perdu en frais" },
    { key: "totalFees" as const, label: "Frais Totaux", suffix: "", color: RED, sub: "Frais cumulés sur la durée" },
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
          <div key={kpi.key} className="glass rounded-2xl p-4 hover:bg-glass-hover transition-colors flex flex-col min-w-0">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-text-muted truncate">{kpi.label}</div>
            <div className="mono text-base font-bold mt-1.5 leading-tight truncate" style={{ color: kpi.color }}>
              {display}
            </div>
            <div className="text-[9px] text-text-dim mt-1 leading-snug">{kpi.sub}</div>
          </div>
        )
      })}
    </div>
  )
}
