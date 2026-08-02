import { useMemo, useState } from "react"
import type { CSSProperties } from "react"
import { PieChart } from "lucide-react"
import { deflationFactor, fmtCurrency } from "../../engine"
import { pie3dGeometry } from "../../utils/pie3d"
import type { YearRow } from "../../types"

interface CapitalAllocationProps {
  rows: YearRow[]
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

export function CapitalAllocation({ rows, darkMode, showReal = false }: CapitalAllocationProps) {
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
    const grossGains = lastRow.interestsNom * factor
    // MÊME base que les cartes et le graphique d'équité : impôts de LIQUIDATION
    // = nominal − taxNet (exit tax), pas totalTax (qui inclurait en plus les
    // dividendes déjà prélevés chaque mois → camembert ≠ carte dès que
    // dividendYield > 0, audit v5.2.2).
    const exitTax = Math.max(0, lastRow.nominal - lastRow.taxNet) * factor
    const taxes = Math.max(0, Math.min(grossGains, exitTax))
    return [
      { label: "Argent épargné", value: lastRow.investedNom * factor, color: palette.invested },
      { label: "Gains nets (après impôts)", value: Math.max(0, grossGains - taxes), color: palette.gains },
      { label: "Impôts (liquidation théorique)", value: taxes, color: palette.losses },
    ]
  }, [lastRow, palette, showReal])

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
      <h2 className="text-sm font-bold mb-4 flex items-center gap-2">
        <PieChart size={12} className="text-warning" />
        D'où vient votre argent ?
      </h2>

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
                  {pct.toFixed(1)}%
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
