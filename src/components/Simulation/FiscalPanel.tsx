import { Info, Shield } from "lucide-react"
import { computeTaxBreakdown, deflationFactor, ENVELOPE_CONFIGS } from "../../engine"
import { useLang } from "../../i18n"
import { DualAmount } from "../shared/DualAmount"
import { SectionHeader } from "../shared/SectionHeader"
import type { SimulationInputs, YearRow } from "../../types"

interface FiscalPanelProps {
  rows: YearRow[]
  inputs: SimulationInputs
}

const GOLD = "var(--color-value-gold)"
const RED = "var(--color-value-red)"

export function FiscalPanel({ rows, inputs }: FiscalPanelProps) {
  const { tr, lang, fmtCurrency, fmtDecimal } = useLang()
  const lastRow = rows[rows.length - 1]
  if (!lastRow) return null

  const envelope = ENVELOPE_CONFIGS.find(e => e.id === inputs.envelope)

  const taxInfo = computeTaxBreakdown(
    lastRow.interestsNom,
    inputs.envelope,
    // Années de détention COHÉRENTES avec le moteur (correctif v5.2.4) : pour
    // le PEA, le taux dépend de la détention ACTUELLE affichée par le curseur
    // « Années de détention du PEA » (moins de 5 ans → PFU, au-delà →
    // prélèvements sociaux seuls — taux de l'année, taxRules.ts). Avant, on
    // ajoutait la durée de projection : la somme dépassait
    // presque toujours 5 ans et le taux réduit s'appliquait même pour un PEA
    // détenu moins de 5 ans. L'AV conserve la détention cumulée (abattement
    // annuel de 4 600 €/an).
    inputs.envelope === "pea"
      ? inputs.peaYearsHeld
      : inputs.envelope === "av"
        ? inputs.avYearsHeld + inputs.duration
        : inputs.duration,
    inputs.taxCouple,
    lastRow.investedNom,
    { tmi: inputs.tmi, ctoTaxMode: inputs.ctoTaxMode, taxYear: inputs.taxYear, lang },
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
  // montant réellement dû si on liquide aujourd'hui.
  const exitTax = Math.max(0, taxInfo.totalTax)
  const lines: { label: string; value: number; strong?: boolean; tone?: string }[] = [
    { label: tr("Gains avant impôts (brut)"), value: show(taxInfo.grossGains), tone: GOLD },
  ]
  if (taxInfo.contributionsTax > 0) {
    lines.push({ label: tr("Impôt sur versements PER déduits"), value: show(taxInfo.contributionsTax), tone: RED })
  }
  if (taxInfo.socialCharges > 0) {
    lines.push({ label: tr("Cotisations sociales"), value: show(taxInfo.socialCharges), tone: RED })
  }
  if (taxInfo.incomeTax > 0) {
    lines.push({ label: tr("Impôt sur le revenu"), value: show(taxInfo.incomeTax), tone: RED })
  }
  lines.push({ label: tr("Total impôt théorique"), value: show(exitTax), strong: true, tone: RED })
  lines.push({ label: tr("Gains après impôts"), value: show(taxInfo.netGains), strong: true, tone: GOLD })

  const totalBadge =
    inputs.envelope === "cto" && inputs.ctoTaxMode === "bareme"
      ? tr("Barème progressif (TMI)")
      : taxInfo.flatTax > 0
        ? tr("Impôt unique (PFU)")
        : taxInfo.socialCharges > 0 && taxInfo.incomeTax === 0
          ? tr("Cotisations sociales seules")
          : null

  return (
    <div className="glass rounded-2xl p-5 space-y-2">
      <SectionHeader
        title={tr("Votre impôt théorique (si vente totale)")}
        icon={Shield}
        level="card"
        as="h3"
        nowrap
        sub={envelope ? tr(envelope.name) : "CTO"}
        trailing={
          inputs.showReal && (
            <span className="text-[10px] mono font-bold text-text-dim bg-glass-hover px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0">
              {tr("€ d'aujourd'hui")}
            </span>
          )
        }
      />
      <div className="space-y-1.5">
        {lines.map(item => (
          <div key={item.label} className="flex items-center justify-between py-1">
            <span className="text-[11px] text-text-muted flex items-center gap-1.5">
              {item.label}
              {/* Tag discret du régime : simple pastille, plus la grosse case
                  rouge qui écrasait la ligne « Total impôt théorique ». */}
              {item.label === "Total impôt théorique" && totalBadge && (
                <span className="inline-flex items-center px-1.5 py-px rounded-full border border-danger/15 bg-danger/5 text-danger/80 text-[9px] font-semibold tracking-wide whitespace-nowrap">
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
          le panneau et les cartes racontent la même histoire (audit v5.1.4).
          Les DEUX échelles sont affichées (DualAmount) : la valeur du compte
          reste visible même quand le panneau est en euros d'aujourd'hui. */}
      <div className="flex items-center justify-between gap-3">
        <span className="text-[11px] font-semibold text-text-muted">{tr("Capital net (impôts déduits)")}</span>
        <DualAmount
          nominal={lastRow.taxNet}
          real={lastRow.taxNet * deflationFactor(lastRow)}
          showReal={inputs.showReal}
          color={GOLD}
          endYear={lastRow.date.split(" ")[1]?.replace(".", "")}
        />
      </div>
      <div className="flex justify-between items-center">
        <span className="text-[10px] text-text-dim">
          {inputs.envelope === "per"
            ? tr("Part de la base PER imposable prise par l'impôt")
            : tr("Part de vos gains prise par les impôts")}
        </span>
        <span className="mono text-xs font-bold" style={{ color: "var(--color-value-red)" }}>
          {fmtDecimal((exitTax / Math.max(1, taxInfo.grossGains + (taxInfo.taxableContributions ?? 0))) * 100, 1)}%
        </span>
      </div>
      {isLiquidationTheorique && (
        <p className="text-[10px] text-text-dim leading-snug mt-2 flex items-start gap-1">
          <Info size={10} className="shrink-0 mt-0.5 text-primary" />
          <span>
            <strong className="text-text-muted">{tr("Estimation")}</strong>
            {tr(
              " : ces impôts supposent que vous liquidez tous vos gains aujourd'hui. Les gains latents ne sont taxés qu'à la revente réelle.",
            )}
          </span>
        </p>
      )}
      {taxInfo.notes[0] && <p className="text-[10px] text-text-dim leading-snug mt-2">{taxInfo.notes[0]}</p>}
    </div>
  )
}
