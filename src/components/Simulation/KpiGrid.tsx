import { fmtCurrency } from "../../engine"
import type { KPIs } from "../../types"

interface KpiGridProps {
  kpis: KPIs | null
}

export function KpiGrid({ kpis }: KpiGridProps) {
  if (!kpis) return null

  const cards = [
    { key: "cagr" as const, label: "CAGR", suffix: "%", color: "#D4AF37" },
    { key: "sharpe" as const, label: "Sharpe Ratio", suffix: "", color: "#C9A324", digits: 2 },
    { key: "maxDrawdownPct" as const, label: "Drawdown Max", suffix: "%", color: "#8B3A3A" },
    { key: "capitalMultiple" as const, label: "Multiple Capital", suffix: "x", color: "#B8960F" },
    { key: "doublingTime" as const, label: "Doublement", suffix: " ans", color: "#E8D5A3" },
    { key: "contributionPct" as const, label: "Part Versements", suffix: "%", color: "#A09888" },
    { key: "gainsPct" as const, label: "Part Gains", suffix: "%", color: "#D4AF37" },
    { key: "realReturn" as const, label: "Rendement Réel", suffix: "%", color: "#B8960F" },
    { key: "feeImpactPct" as const, label: "Impact Frais", suffix: "%", color: "#8B3A3A" },
    { key: "totalFees" as const, label: "Frais Totaux", suffix: "", color: "#8B3A3A" },
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
          <div key={kpi.key} className="glass rounded-2xl p-4 hover:bg-glass-hover transition-colors">
            <div className="text-[9px] text-text-dim uppercase tracking-wider mb-2">{kpi.label}</div>
            <div className="mono text-sm font-bold" style={{ color: kpi.color }}>
              {display}
            </div>
          </div>
        )
      })}
    </div>
  )
}
