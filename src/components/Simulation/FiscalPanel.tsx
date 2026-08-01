import { Info, Shield } from "lucide-react"
import { ENVELOPE_CONFIGS, computeTaxBreakdown, fmtCurrency } from "../../engine"
import type { SimulationInputs, YearRow } from "../../types"

interface FiscalPanelProps {
  rows: YearRow[]
  inputs: SimulationInputs
}

const GOLD = "var(--color-value-gold)"
const RED = "var(--color-value-red)"

export function FiscalPanel({ rows, inputs }: FiscalPanelProps) {
  const lastRow = rows[rows.length - 1]
  if (!lastRow) return null

  const taxInfo = computeTaxBreakdown(
    lastRow.interestsNom,
    inputs.envelope,
    // Années de détention COHÉRENTES avec la simulation : les années déjà
    // détenues + la durée de projection (ex: PEA détenu 5 ans + 25 ans de
    // projection → 30 ans, pas 5 ans — sinon le panneau afficherait 30 % de
    // PFU alors que la table calcule 17,2 %).
    inputs.envelope === "pea"
      ? inputs.peaYearsHeld + inputs.duration
      : inputs.envelope === "av"
        ? inputs.avYearsHeld + inputs.duration
        : inputs.duration,
    inputs.taxCouple,
    lastRow.dividendTax,
    lastRow.investedNom,
    { tmi: inputs.tmi, ctoTaxMode: inputs.ctoTaxMode, dividendsGross: lastRow.dividendsGross },
  )

  const isLiquidationTheorique = inputs.envelope !== "none"

  const lines: { label: string; value: number; strong?: boolean; tone?: string }[] = [
    { label: "Gains avant impôts (brut)", value: taxInfo.grossGains, tone: GOLD },
  ]
  if (taxInfo.socialCharges > 0) {
    lines.push({ label: "Cotisations sociales", value: taxInfo.socialCharges, tone: RED })
  }
  if (taxInfo.incomeTax > 0) {
    lines.push({ label: "Impôt sur le revenu", value: taxInfo.incomeTax, tone: RED })
  }
  lines.push({ label: "Total des impôts", value: taxInfo.totalTax, strong: true, tone: RED })
  lines.push({ label: "Gains après impôts", value: taxInfo.netGains, strong: true, tone: GOLD })

  const totalBadge =
    inputs.envelope === "cto" && inputs.ctoTaxMode === "bareme"
      ? "Barème progressif (TMI)"
      : taxInfo.flatTax > 0
        ? "Impôt unique (PFU)"
        : taxInfo.socialCharges > 0 && taxInfo.incomeTax === 0
          ? "Cotisations sociales seules"
          : null

  return (
    <div className="glass rounded-2xl p-5 space-y-2">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <Shield size={14} className="text-text-dim" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-text-muted">
            Vos impôts — {ENVELOPE_CONFIGS.find(e => e.id === inputs.envelope)?.name || "CTO"}
          </span>
        </div>
        <span className="text-[9px] mono font-bold text-text-dim bg-glass-hover px-1.5 py-0.5 rounded uppercase tracking-wider">
          Règles en vigueur
        </span>
      </div>
      <div className="space-y-1.5">
        {lines.map(item => (
          <div key={item.label} className="flex items-center justify-between py-1">
            <span className="text-[11px] text-text-muted flex items-center gap-1.5">
              {item.label}
              {item.label === "Total des impôts" && totalBadge && (
                <span className="px-1.5 py-px rounded bg-danger/15 text-danger text-[8px] font-bold uppercase tracking-wider">
                  {totalBadge}
                </span>
              )}
            </span>
            <span
              className={`mono text-xs font-semibold ${item.strong ? "text-sm" : ""}`}
              style={{ color: item.tone ?? "var(--color-text)" }}
            >
              {fmtCurrency(item.value)}
            </span>
          </div>
        ))}
      </div>
      <div className="h-px bg-border my-2" />
      <div className="flex justify-between items-center">
        <span className="text-[10px] text-text-dim">Part de vos gains prise par les impôts</span>
        <span className="mono text-xs font-bold" style={{ color: "var(--color-value-red)" }}>
          {(taxInfo.effectiveRate * 100).toFixed(1)}%
        </span>
      </div>
      {isLiquidationTheorique && (
        <p className="text-[9px] text-text-dim leading-snug mt-2 flex items-start gap-1">
          <Info size={10} className="shrink-0 mt-0.5 text-primary" />
          <span>
            <strong className="text-text-muted">Estimation</strong> : ces impôts supposent que vous liquidez tous vos
            gains aujourd'hui (selon les règles fiscales en vigueur). Les gains latents ne sont taxés qu'à la revente
            réelle.
          </span>
        </p>
      )}
      {taxInfo.notes[0] && <p className="text-[9px] text-text-dim leading-snug mt-2">{taxInfo.notes[0]}</p>}
    </div>
  )
}
