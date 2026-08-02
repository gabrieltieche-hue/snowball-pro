import { Info, Shield } from "lucide-react"
import { computeTaxBreakdown, deflationFactor, ENVELOPE_CONFIGS, fmtCurrency } from "../../engine"
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
    // Années de détention COHÉRENTES avec le moteur (correctif v5.2.4) : pour
    // le PEA, le taux dépend de la détention ACTUELLE affichée par le curseur
    // « Années de détention du PEA » (moins de 5 ans → PFU 30 %, au-delà →
    // 17,2 %). Avant, on ajoutait la durée de projection : la somme dépassait
    // presque toujours 5 ans et le taux réduit s'appliquait même pour un PEA
    // détenu moins de 5 ans. L'AV conserve la détention cumulée (abattement
    // annuel de 4 600 €/an).
    inputs.envelope === "pea"
      ? inputs.peaYearsHeld
      : inputs.envelope === "av"
        ? inputs.avYearsHeld + inputs.duration
        : inputs.duration,
    inputs.taxCouple,
    lastRow.dividendTax,
    lastRow.investedNom,
    { tmi: inputs.tmi, ctoTaxMode: inputs.ctoTaxMode, dividendsGross: lastRow.dividendsGross },
  )

  // Même échelle que les cartes du haut (SummaryStats) : quand l'affichage
  // est en euros d'aujourd'hui, le panneau fiscal déflate aussi ses montants
  // (helper partagé deflationFactor). Avant l'audit v5.1.4, la carte
  // « Net fiscal » (1 176 k€, euros courants) ne rimait pas avec « Gains après
  // impôts » du panneau (708 k€) ni avec la carte « Valeur brute » (862 k€,
  // euros d'aujourd'hui) — échelles mélangées.
  const show = (amount: number) => (inputs.showReal ? amount * deflationFactor(lastRow) : amount)

  const isLiquidationTheorique = inputs.envelope !== "none"

  // Impôts de liquidation = exit tax (social + impôt sur le revenu) : c'est le
  // montant réellement dû si on liquide aujourd'hui. Les dividendes, eux, ont
  // déjà été taxés chaque mois pendant la simulation (prélevés à la source et
  // réinvestis nets) : les ajouter au total les compterait DEUX FOIS — c'était
  // le bug d'échelle entre le panneau (totalTax) et la carte « Impôts »
  // (nominal − taxNet), audit v5.2.2.
  const exitTax = Math.max(0, taxInfo.totalTax - taxInfo.dividendTax)
  const lines: { label: string; value: number; strong?: boolean; tone?: string }[] = [
    { label: "Gains avant impôts (brut)", value: show(taxInfo.grossGains), tone: GOLD },
  ]
  if (taxInfo.socialCharges > 0) {
    lines.push({ label: "Cotisations sociales", value: show(taxInfo.socialCharges), tone: RED })
  }
  if (taxInfo.incomeTax > 0) {
    lines.push({ label: "Impôt sur le revenu", value: show(taxInfo.incomeTax), tone: RED })
  }
  if (taxInfo.dividendTax > 0) {
    lines.push({ label: "Impôts sur dividendes (déjà prélevés)", value: show(taxInfo.dividendTax), tone: RED })
  }
  lines.push({ label: "Total des impôts", value: show(exitTax), strong: true, tone: RED })
  lines.push({ label: "Gains après impôts", value: show(taxInfo.netGains), strong: true, tone: GOLD })

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
        {inputs.showReal && (
          <span className="text-[10px] mono font-bold text-text-dim bg-glass-hover px-1.5 py-0.5 rounded uppercase tracking-wider">
            € d'aujourd'hui
          </span>
        )}
      </div>
      <div className="space-y-1.5">
        {lines.map(item => (
          <div key={item.label} className="flex items-center justify-between py-1">
            <span className="text-[11px] text-text-muted flex items-center gap-1.5">
              {item.label}
              {item.label === "Total des impôts" && totalBadge && (
                <span className="px-1.5 py-px rounded bg-danger/15 text-danger text-[10px] font-bold uppercase tracking-wider">
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
      {/* Capital net = carte « Net fiscal » du haut, même valeur, même échelle :
          le panneau et les cartes racontent la même histoire (audit v5.1.4). */}
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-text-muted">Capital net (impôts déduits)</span>
        <span className="mono text-sm font-bold" style={{ color: GOLD }}>
          {fmtCurrency(show(lastRow.taxNet))}
        </span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-[10px] text-text-dim">Part de vos gains prise par les impôts</span>
        <span className="mono text-xs font-bold" style={{ color: "var(--color-value-red)" }}>
          {taxInfo.grossGains > 0 ? ((exitTax / taxInfo.grossGains) * 100).toFixed(1) : "0.0"}%
        </span>
      </div>
      {isLiquidationTheorique && (
        <p className="text-[10px] text-text-dim leading-snug mt-2 flex items-start gap-1">
          <Info size={10} className="shrink-0 mt-0.5 text-primary" />
          <span>
            <strong className="text-text-muted">Estimation</strong> : ces impôts supposent que vous liquidez tous vos
            gains aujourd'hui. Les gains latents ne sont taxés qu'à la revente réelle.
          </span>
        </p>
      )}
      {taxInfo.notes[0] && <p className="text-[10px] text-text-dim leading-snug mt-2">{taxInfo.notes[0]}</p>}
    </div>
  )
}
