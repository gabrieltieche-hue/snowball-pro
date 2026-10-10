import { motion } from "framer-motion"
import type { CrashReplay } from "../../engine"
import { useLang } from "../../i18n"

const W = 600
const H = 240
const PAD = { top: 16, right: 12, bottom: 20, left: 12 }
const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1]

/**
 * Courbe du replay des krachs (3.2) : 100 € investis au 1er janvier d'une
 * année, valeur fin d'année par fin d'année — le VRAI MSCI World EUR, rien
 * d'inventé (creux, baisse et retour viennent de `replayCrashFrom`).
 *
 * Tracé or + aire dégradée, baseline « 100 € » en pointillés, dessin animé
 * (pathLength) à chaque changement d'année. En test (framer-motion mocké :
 * props d'animation filtrées), le tracé est statique et complet — la logique
 * reste 100 % testable.
 */
export function CrashChart({ replay }: { replay: CrashReplay }) {
  const { tr } = useLang()
  const values = replay.values
  const min = Math.min(...values.map(v => v.value), 100)
  const max = Math.max(...values.map(v => v.value), 100)
  const span = Math.max(1, max - min)
  const x = (i: number) => PAD.left + (i / Math.max(1, values.length - 1)) * (W - PAD.left - PAD.right)
  const y = (v: number) => PAD.top + (1 - (v - min) / span) * (H - PAD.top - PAD.bottom)
  const baselineY = y(100)
  const pts = values.map((v, i) => `${x(i).toFixed(1)},${y(v.value).toFixed(1)}`)
  const polyline = pts.join(" ")
  const area = `${PAD.left},${baselineY.toFixed(1)} ${polyline} ${x(values.length - 1).toFixed(1)},${baselineY.toFixed(1)}`
  const lastX = x(values.length - 1)
  const lastY = y(values[values.length - 1]?.value ?? 100)
  const troughIdx = values.reduce((best, v, i) => (v.value < values[best].value ? i : best), 0)
  const troughX = x(troughIdx)
  const troughY = y(values[troughIdx].value)

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full h-auto"
      role="img"
      aria-label={tr("Courbe : la valeur de 100 € investis en {year}", { year: replay.startYear })}
    >
      <defs>
        <linearGradient id="krach-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.32" />
          <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0.03" />
        </linearGradient>
        <linearGradient id="krach-drawdown" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e08a8a" stopOpacity="0.02" />
          <stop offset="100%" stopColor="#e08a8a" stopOpacity="0.16" />
        </linearGradient>
        <linearGradient id="krach-line" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="var(--color-primary-light)" />
          <stop offset="100%" stopColor="var(--color-primary)" />
        </linearGradient>
      </defs>

      {/* Zone drawdown (sous 100 €) — rouge translucide */}
      <rect
        x={PAD.left}
        y={baselineY}
        width={W - PAD.left - PAD.right}
        height={H - PAD.bottom - baselineY}
        fill="url(#krach-drawdown)"
      />

      {/* Baseline « 100 € » (point de départ) */}
      <line
        x1={PAD.left}
        y1={baselineY}
        x2={W - PAD.right}
        y2={baselineY}
        strokeDasharray="4 5"
        className="text-text-dim/50"
        stroke="currentColor"
        strokeWidth={1}
        vectorEffect="non-scaling-stroke"
      />

      {/* Aire sous la courbe */}
      <motion.polygon
        points={area}
        fill="url(#krach-fill)"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.9, ease: EASE }}
      />

      {/* La courbe, dessinée (pathLength) à chaque changement d'année */}
      <motion.polyline
        points={polyline}
        fill="none"
        stroke="url(#krach-line)"
        strokeWidth={4}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        style={{ filter: "drop-shadow(0 0 10px rgba(212,175,55,0.35))" }}
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.6, ease: EASE }}
      />

      {/* Creux (trough) — pastille rouge */}
      <circle
        cx={troughX}
        cy={troughY}
        r={6}
        fill="var(--color-value-red)"
        stroke="var(--color-surface)"
        strokeWidth={2.5}
        vectorEffect="non-scaling-stroke"
      />

      {/* Point final (valeur d'aujourd'hui) */}
      <circle
        cx={lastX}
        cy={lastY}
        r={6}
        fill="var(--color-primary)"
        stroke="var(--color-surface)"
        strokeWidth={2.5}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}
