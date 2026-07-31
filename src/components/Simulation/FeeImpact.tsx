import { Percent } from "lucide-react"
import { runSimulation as reRunSim, fmtCurrency } from "../../engine"
import type { SimulationInputs, YearRow } from "../../types"

interface FeeImpactProps {
  rows: YearRow[]
  inputs: SimulationInputs
}

export function FeeImpact({ rows, inputs }: FeeImpactProps) {
  const lastRow = rows[rows.length - 1]
  if (!lastRow) return null

  const noFeeRows = reRunSim({ ...inputs, etfFees: 0, brokerageFees: 0, managementFees: 0 })
  const noFeeFinal = noFeeRows[noFeeRows.length - 1]?.nominal || 0
  const feeImpact = noFeeFinal - lastRow.nominal
  const impactPct = noFeeFinal > 0 ? (feeImpact / noFeeFinal) * 100 : 0

  return (
    <div className="glass rounded-2xl p-5 space-y-2">
      <div className="flex items-center gap-2 mb-2">
        <Percent size={14} className="text-text-dim" />
        <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-text-muted">Impact des Frais</span>
      </div>
      <div className="space-y-1.5">
        {[
          { label: "Frais cumulés", value: lastRow.feesLost, color: "#8B3A3A" },
          { label: "Capital perdu à cause des frais", value: feeImpact, color: "#A84A4A" },
        ].map(item => (
          <div key={item.label} className="flex items-center justify-between py-1">
            <span className="text-[11px] text-text-dim">{item.label}</span>
            <span className="mono text-xs font-semibold" style={{ color: item.color }}>
              {fmtCurrency(item.value)}
            </span>
          </div>
        ))}
      </div>
      <div className="h-px bg-border my-2" />
      <div className="text-[10px] text-text-dim">
        Soit <span className="font-bold text-danger">{impactPct.toFixed(1)}%</span> du capital potentiel sans frais
      </div>
    </div>
  )
}
