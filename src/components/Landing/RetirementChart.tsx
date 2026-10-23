import { motion } from "framer-motion"
import { useLang } from "../../i18n"

const W = 600
const H = 210
const PAD = { top: 16, right: 16, bottom: 22, left: 16 }
const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1]

/**
 * Courbe de la démo « retraite en pleine crise » (5.3) : le capital restant
 * année après année, calculé par le VRAI moteur de décaissement
 * (`runStressTest` — rendements réels contigus, retraits, garde-fous).
 *
 * Tracé or + aire dégradée, ligne pointillée « capital de départ », pastille
 * rouge au pire point et pastille or à la fin de la fenêtre rejouée. Le dessin
 * s'anime à chaque changement (année ou capital) ; en test (framer-motion
 * mocké) le tracé est statique, la logique reste testable.
 */
export function RetirementChart({
  path,
  startYear,
  endYear,
  initial,
}: {
  path: number[]
  startYear: number
  endYear: number
  initial: number
}) {
  const { tr } = useLang()
  const values = path.length > 1 ? path : [initial, initial]
  const min = Math.min(0, ...values)
  const max = Math.max(initial, ...values)
  const span = Math.max(1, max - min)
  const x = (i: number) => PAD.left + (i / Math.max(1, values.length - 1)) * (W - PAD.left - PAD.right)
  const y = (v: number) => PAD.top + (1 - (v - min) / span) * (H - PAD.top - PAD.bottom)
  const baselineY = y(initial)
  const polyline = values.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ")
  const area = `${PAD.left},${y(min).toFixed(1)} ${polyline} ${x(values.length - 1).toFixed(1)},${y(min).toFixed(1)}`
  const lastX = x(values.length - 1)
  const lastY = y(values[values.length - 1] ?? initial)
  const worstIdx = values.reduce((best, v, i) => (v < values[best] ? i : best), 0)

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full h-auto"
      role="img"
      aria-label={tr("Courbe : le capital restant année après année, retraite commencée en {year}", {
        year: startYear,
      })}
    >
      <defs>
        <linearGradient id="retraite-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.3" />
          <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0.03" />
        </linearGradient>
        <linearGradient id="retraite-line" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="var(--color-primary-light)" />
          <stop offset="100%" stopColor="var(--color-primary)" />
        </linearGradient>
      </defs>

      {/* Ligne de départ : le capital au premier jour de la retraite. */}
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

      <motion.polygon
        points={area}
        fill="url(#retraite-fill)"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, ease: EASE }}
      />

      <motion.polyline
        points={polyline}
        fill="none"
        stroke="url(#retraite-line)"
        strokeWidth={3.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        style={{ filter: "drop-shadow(0 0 10px rgba(212,175,55,0.3))" }}
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.4, ease: EASE }}
      />

      {/* Pire point de la retraite (capital le plus bas). */}
      <circle
        cx={x(worstIdx)}
        cy={y(values[worstIdx] ?? 0)}
        r={5.5}
        fill="var(--color-value-red)"
        stroke="var(--color-surface)"
        strokeWidth={2.5}
        vectorEffect="non-scaling-stroke"
      />

      {/* Fin de la fenêtre rejouée. */}
      <circle
        cx={lastX}
        cy={lastY}
        r={5.5}
        fill="var(--color-primary)"
        stroke="var(--color-surface)"
        strokeWidth={2.5}
        vectorEffect="non-scaling-stroke"
      />

      {/* Bornes de la fenêtre rejouée (années réelles de l'historique). */}
      <text x={PAD.left} y={H - 6} className="text-[11px] fill-current text-text-dim" textAnchor="start">
        {startYear}
      </text>
      <text x={W - PAD.right} y={H - 6} className="text-[11px] fill-current text-text-dim" textAnchor="end">
        {endYear}
      </text>
    </svg>
  )
}
