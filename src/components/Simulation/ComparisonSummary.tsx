import { ArrowDownRight, ArrowUpRight, Equal } from "lucide-react"
import { fmtCurrency, fmtPercent } from "../../engine"
import type { ScenarioComparison } from "../../types"

interface ComparisonSummaryProps {
  comparison: ScenarioComparison
  showReal?: boolean
}

export function ComparisonSummary({ comparison, showReal = false }: ComparisonSummaryProps) {
  const better = comparison.betterScenario

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className="glass rounded-2xl p-4">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-text-muted mb-1">Scénario A</div>
        <div className="mono text-lg font-extrabold text-text">{fmtCurrency(comparison.finalA)}</div>
        <div className="text-[10px] text-text-dim mt-0.5">
          net fiscal final · {showReal ? "€ d'aujourd'hui" : "€ courants"}
        </div>
      </div>

      <div className="glass rounded-2xl p-4">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-text-muted mb-1">Scénario B</div>
        <div className="mono text-lg font-extrabold text-text">{fmtCurrency(comparison.finalB)}</div>
        <div className="text-[10px] text-text-dim mt-0.5">
          net fiscal final · {showReal ? "€ d'aujourd'hui" : "€ courants"}
        </div>
      </div>

      <div className="glass rounded-2xl p-4">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-text-muted mb-1">Écart (B − A)</div>
        <div
          className={`mono text-lg font-extrabold flex items-center gap-1 ${
            better === "equal" ? "text-text" : better === "B" ? "text-primary" : "text-danger"
          }`}
        >
          {better === "equal" ? (
            <Equal size={16} />
          ) : better === "B" ? (
            <ArrowUpRight size={16} />
          ) : (
            <ArrowDownRight size={16} />
          )}
          {better === "equal"
            ? "Égal"
            : `${comparison.diffAbsolute > 0 ? "+" : ""}${fmtCurrency(comparison.diffAbsolute)}`}
        </div>
        <div className="text-[10px] text-text-dim mt-0.5">
          {better === "equal" ? "aucune différence" : `${fmtPercent(comparison.diffPercent)} par rapport à A`}
        </div>
      </div>
    </div>
  )
}
