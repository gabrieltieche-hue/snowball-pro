import { Shield } from "lucide-react"
import { ENVELOPE_CONFIGS, computeTaxBreakdown, fmtCurrency } from "../../engine"
import type { SimulationInputs, YearRow } from "../../types"

interface FiscalPanelProps {
  rows: YearRow[]
  inputs: SimulationInputs
}

export function FiscalPanel({ rows, inputs }: FiscalPanelProps) {
  const lastRow = rows[rows.length - 1]
  if (!lastRow) return null

  const taxInfo = computeTaxBreakdown(
    lastRow.interestsNom,
    inputs.envelope,
    inputs.envelope === "pea" ? inputs.peaYearsHeld : inputs.envelope === "av" ? inputs.avYearsHeld : inputs.duration,
    inputs.taxCouple,
  )

  return (
    <div className="glass rounded-2xl p-5 space-y-2">
      <div className="flex items-center gap-2 mb-2">
        <Shield size={14} className="text-text-dim" />
        <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-text-muted">
          Détail Fiscal — {ENVELOPE_CONFIGS.find(e => e.id === inputs.envelope)?.name || "CTO"}
        </span>
      </div>
      <div className="space-y-1.5">
        {[
          { label: "Gains bruts", value: taxInfo.grossGains, color: "#D4AF37" },
          { label: "Prélèvements Sociaux", value: taxInfo.socialCharges, color: "#8B3A3A" },
          { label: "Impôt sur le Revenu", value: taxInfo.incomeTax, color: "#B8960F" },
          { label: "PFU (Flat Tax)", value: taxInfo.flatTax, color: "#C9A324" },
          { label: "Total Impôts", value: taxInfo.totalTax, color: "#A84A4A" },
          { label: "Gains nets", value: taxInfo.netGains, color: "#C9A324" },
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
      <div className="flex justify-between items-center">
        <span className="text-[10px] text-text-dim">Taux effectif d'imposition</span>
        <span className="mono text-xs font-bold text-danger">{(taxInfo.effectiveRate * 100).toFixed(1)}%</span>
      </div>
    </div>
  )
}
