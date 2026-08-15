import { ArrowDownRight, ArrowUpRight, Equal } from "lucide-react"
import { useLang } from "../../i18n"
import type { ScenarioComparison } from "../../types"

interface ComparisonSummaryProps {
  comparison: ScenarioComparison
  showReal?: boolean
}

export function ComparisonSummary({ comparison, showReal = false }: ComparisonSummaryProps) {
  const { tr, fmtCurrency, fmtPercent } = useLang()
  const better = comparison.betterScenario

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className="glass rounded-2xl p-4">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-text-muted mb-1">
          {tr("Scénario A")}
        </div>
        <div className="mono text-lg font-extrabold text-text">{fmtCurrency(comparison.finalA)}</div>
        <div className="text-[10px] text-text-dim mt-0.5">
          {tr("net fiscal final · {scale}", { scale: showReal ? tr("€ d'aujourd'hui") : tr("€ courants") })}
        </div>
      </div>

      <div className="glass rounded-2xl p-4">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-text-muted mb-1">
          {tr("Scénario B")}
        </div>
        <div className="mono text-lg font-extrabold text-text">{fmtCurrency(comparison.finalB)}</div>
        <div className="text-[10px] text-text-dim mt-0.5">
          {tr("net fiscal final · {scale}", { scale: showReal ? tr("€ d'aujourd'hui") : tr("€ courants") })}
        </div>
      </div>

      <div className="glass rounded-2xl p-4">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-text-muted mb-1">
          {tr("Écart (B − A)")}
        </div>
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
            ? tr("Égal")
            : `${comparison.diffAbsolute > 0 ? "+" : ""}${fmtCurrency(comparison.diffAbsolute)}`}
        </div>
        <div className="text-[10px] text-text-dim mt-0.5">
          {better === "equal"
            ? tr("aucune différence")
            : tr("{pct} par rapport à A", { pct: fmtPercent(comparison.diffPercent) })}
        </div>
      </div>
    </div>
  )
}
