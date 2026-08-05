import { useMemo, useState } from "react"
import type { CSSProperties } from "react"
import { PieChart } from "lucide-react"
import { computeTaxBreakdown, deflationFactor, fmtCurrency, fmtDecimal } from "../../engine"
import { pie3dGeometry } from "../../utils/pie3d"
import { SectionHeader } from "../shared/SectionHeader"
import type { SimulationInputs, YearRow } from "../../types"

interface CapitalAllocationProps {
  rows: YearRow[]
  inputs: SimulationInputs
  darkMode: boolean
  /** Affichage en euros d'aujourd'hui : la légende déflate comme les cartes. */
  showReal?: boolean
}

const PALETTE = {
  light: {
    invested: "#5f6b7a",
    gains: "#a67c00",
    losses: "#b23a3a",
  },
  dark: {
    invested: "#9aa3af",
    gains: "#e3b341",
    losses: "#c0504d",
  },
}

function shade(hex: string, factor: number): string {
  const n = parseInt(hex.slice(1), 16)
  const r = Math.round(((n >> 16) & 255) * factor)
  const g = Math.round(((n >> 8) & 255) * factor)
  const b = Math.round((n & 255) * factor)
  return `rgb(${r},${g},${b})`
}

const CX = 130
const CY = 82
const RX = 100
const RY = 54
const DEPTH = 24

export function CapitalAllocation({ rows, inputs, darkMode, showReal = false }: CapitalAllocationProps) {
  const lastRow = rows[rows.length - 1]
  const [active, setActive] = useState<number | null>(null)
  const palette = darkMode ? PALETTE.dark : PALETTE.light

  const items = useMemo(() => {
    if (!lastRow) return []
    // Le camembert totalise le capital. Les impôts sont une perte SUR les
    // gains : gains nets = gains bruts − impôts (les frais sont déjà déduits
    // du capital par la simulation). Total = épargné + gains nets + impôts =
    // capital. MÊME échelle que les cartes : quand l'affichage est en euros
    // d'aujourd'hui, la légende déflate aussi (avant l'audit v5.2.0, le pie
    // affichait 303 k€ d'impôts nominaux à côté d'une carte à 176 k€).
    const factor = showReal ? deflationFactor(lastRow) : 1
    const tax = computeTaxBreakdown(
      lastRow.grossGains,
      inputs.envelope,
      inputs.envelope === "pea"
        ? inputs.peaYearsHeld
        : inputs.envelope === "av"
          ? inputs.avYearsHeld + inputs.duration
          : inputs.duration,
      inputs.taxCouple,
      lastRow.investedNom,
      { tmi: inputs.tmi, ctoTaxMode: inputs.ctoTaxMode },
    )
    // Camembert du capital NET après liquidation théorique : chaque source
    // est diminuée de sa propre fiscalité. Cela reste additif même pour un PER,
    // où l'impôt porte aussi sur les versements, et évite de faire apparaître
    // des impôts comme une composante supplémentaire du capital.
    const total = Math.max(0, lastRow.taxNet) * factor
    const invested = Math.max(0, lastRow.investedNom - tax.contributionsTax) * factor
    const gains = Math.max(0, lastRow.grossGains - tax.socialCharges - tax.incomeTax) * factor
    const remainder = Math.max(0, total - invested - gains)
    return [
      { label: "Versements après fiscalité", value: invested, color: palette.invested },
      { label: "Gains après impôts", value: gains, color: palette.gains },
      { label: "Autres écarts arrondis", value: remainder, color: palette.losses },
    ]
  }, [lastRow, inputs, palette, showReal])

  const total = useMemo(() => items.reduce((acc, i) => acc + i.value, 0), [items])

  const parts = useMemo(
    () =>
      pie3dGeometry(
        items.map(i => i.value),
        CX,
        CY,
        RX,
        RY,
        DEPTH,
      ),
    [items],
  )

  if (!lastRow || items.length === 0) return null

  const hoverStyle = (idx: number): CSSProperties =>
    active === idx
      ? { filter: "brightness(1.18)", cursor: "pointer" }
      : active !== null
        ? { opacity: 0.35 }
        : { cursor: "default" }

  const bind = (idx: number) => ({
    onMouseEnter: () => setActive(idx),
    onMouseLeave: () => setActive(null),
  })

  return (
    <div className="glass rounded-3xl p-6 animate-scale-in">
      <SectionHeader
        title="D'où vient votre argent ?"
        icon={PieChart}
        level="card"
        sub="net après liquidation théorique"
      />

      <svg viewBox={`0 0 260 190`} className="w-full max-w-[270px] mx-auto block h-auto">
        {parts.map((part, idx) =>
          part.back ? (
            <path
              key={`back-${idx}`}
              d={part.back}
              fill={shade(items[idx].color, 0.6)}
              {...bind(idx)}
              style={hoverStyle(idx)}
              className="transition-all duration-200"
            />
          ) : null,
        )}
        {parts.map((part, idx) =>
          part.ribbon ? (
            <path
              key={`ribbon-${idx}`}
              d={part.ribbon}
              fill={shade(items[idx].color, 0.78)}
              {...bind(idx)}
              style={hoverStyle(idx)}
              className="transition-all duration-200"
            />
          ) : null,
        )}
        {parts.map((part, idx) => (
          <path
            key={`top-${idx}`}
            d={part.top}
            fill={items[idx].color}
            stroke="rgba(0,0,0,0.15)"
            strokeWidth={0.75}
            {...bind(idx)}
            style={hoverStyle(idx)}
            className="transition-all duration-200"
          />
        ))}
      </svg>

      {/* La légende ci-dessous affiche TOUJOURS les valeurs : sur mobile, où
          le hover n'existe pas, l'information reste lisible sans interaction. */}
      <div className="mt-5 space-y-2" role="list">
        {items.map((item, idx) => {
          const pct = total > 0 ? (item.value / total) * 100 : 0
          return (
            <div
              key={item.label}
              onMouseEnter={() => setActive(idx)}
              onMouseLeave={() => setActive(null)}
              className={`flex items-center justify-between gap-3 px-3 py-2 rounded-xl transition-all duration-200 ${
                active === idx ? "bg-glass-hover" : active !== null ? "opacity-40" : ""
              }`}
            >
              <span className="flex items-center gap-2 min-w-0">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: item.color }} />
                <span className="text-[10px] text-text-muted truncate">{item.label}</span>
              </span>
              <span className="flex items-center gap-2 shrink-0">
                <span className="mono text-[10px] text-text-dim">{fmtCurrency(item.value)}</span>
                <span className="mono text-[10px] font-bold" style={{ color: item.color }}>
                  {fmtDecimal(pct, 1)}%
                </span>
              </span>
            </div>
          )
        })}
      </div>

      <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
        <span className="text-[10px] text-text-dim">Capital total</span>
        <span className="mono text-xs font-bold" style={{ color: "var(--color-text)" }}>
          {fmtCurrency(total)}
        </span>
      </div>
    </div>
  )
}
