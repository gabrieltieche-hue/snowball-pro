/**
 * Projection en direct du questionnaire (v8 « Le chiffre d'abord ») : le
 * chiffre du résultat se met à jour à CHAQUE réponse, avec sa petite courbe
 * (échelle 0 → max — honnête, les krachs restent visibles). La valeur finale
 * est dupliquée dans une région `status` non animée : déterministe pour les
 * tests et annoncée aux lecteurs d'écran.
 */
import { useId } from "react"
import { motion } from "framer-motion"
import { useCountUp, usePrefersReducedMotion } from "../../hooks/useCountUp"
import { useLang } from "../../i18n"
import { cn } from "../../utils/cn"
import type { SimulationInputs, YearRow } from "../../types"

interface LivePreviewProps {
  rows: YearRow[]
  inputs: SimulationInputs
  className?: string
}

interface SparklineProps {
  values: number[]
  width?: number
  height?: number
  strokeWidth?: number
  className?: string
  /** Trait qui se dessine au montage (sauté en motion réduite). */
  animate?: boolean
}

/** Petite courbe de patrimoine (nominal), partagée par l'aperçu et la révélation. */
export function Sparkline({
  values,
  width = 128,
  height = 44,
  strokeWidth = 1.8,
  className,
  animate = true,
}: SparklineProps) {
  const gradientId = useId().replace(/:/g, "")
  const reduced = usePrefersReducedMotion()
  const max = Math.max(...values, 1)
  const count = Math.max(values.length, 2)
  const points = values.map((value, index) => {
    const x = 1 + (index / (count - 1)) * (width - 2)
    const y = height - 2 - (Math.max(0, value) / max) * (height - 4)
    return `${x.toFixed(1)},${y.toFixed(1)}`
  })
  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"}${p}`).join(" ")
  const lastX = points.length > 0 ? points[points.length - 1].split(",")[0] : "0"
  const lastY = points.length > 0 ? points[points.length - 1].split(",")[1] : "0"
  const areaPath = `${linePath} L${lastX},${height} L${points.length > 0 ? points[0].split(",")[0] : "0"},${height} Z`
  const draw = animate && !reduced

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className={cn("h-auto", className)} aria-hidden focusable="false">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.3" />
          <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <motion.path
        d={areaPath}
        fill={`url(#${gradientId})`}
        initial={draw ? { opacity: 0 } : false}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      />
      <motion.path
        d={linePath}
        fill="none"
        stroke="var(--color-primary)"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={draw ? { pathLength: 0, opacity: 0.5 } : false}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.9, ease: "easeOut" }}
      />
      <circle cx={lastX} cy={lastY} r={Math.max(2, strokeWidth + 0.6)} fill="var(--color-primary)" />
    </svg>
  )
}

export function LivePreview({ rows, inputs, className }: LivePreviewProps) {
  const { tr, fmtCurrency } = useLang()
  const lastRow = rows[rows.length - 1]
  const showReal = inputs.showReal
  const total = showReal ? lastRow.real : lastRow.nominal
  const secondary = showReal ? lastRow.nominal : lastRow.real
  const shown = useCountUp(total)
  const endYear = lastRow.date.split(" ")[1]?.replace(".", "") ?? ""
  const accountLabel = tr("sur le compte en {year}", { year: endYear })

  return (
    <div
      className={cn(
        "rounded-2xl border border-primary/20 bg-primary/[0.05] px-3.5 py-3 flex items-center gap-3",
        className,
      )}
    >
      <div className="min-w-0 flex-1">
        <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-text-dim">{tr("Projection en direct")}</p>
        <p className="mono text-xl font-extrabold tracking-tight text-text leading-tight">{fmtCurrency(shown)}</p>
        <p className="text-[10px] text-text-muted mt-0.5 truncate">
          {showReal ? tr("en euros d'aujourd'hui (pouvoir d'achat)") : accountLabel} ·{" "}
          <span className="text-text-dim">
            {fmtCurrency(secondary)} {showReal ? accountLabel : tr("en euros d'aujourd'hui")}
          </span>
        </p>
      </div>
      <Sparkline values={rows.map(row => row.nominal)} className="w-[92px] sm:w-[128px] shrink-0" />
      {/* Valeur finale non animée : annonce lecteurs d'écran + déterminisme tests. */}
      <span role="status" className="sr-only">
        {fmtCurrency(total)} — {accountLabel}
      </span>
    </div>
  )
}
