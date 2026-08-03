import { useState } from "react"
import { motion } from "framer-motion"
import { cn } from "@/utils/cn"
import type { TerminalBin } from "../../types"

interface TerminalHistogramProps {
  bins: TerminalBin[]
  mean: number
  median: number
  format: (v: number) => string
  /** La 1re classe (0 €) représente les cas de ruine (décaissement). */
  highlightRuin?: boolean
  /** Libellé pédagogique sous l'axe (ex : « 0 € = capital épuisé »). */
  leftNote?: string
}

/**
 * Histogramme des issues terminales : rend VISIBLE la « fat tail » que trois
 * lignes de percentiles cachent (P90 à 4× la médiane). Chaque barre est une
 * classe de capital final ; la médiane et la moyenne sont repérées par des
 * lignes verticales — l'écart entre les deux EST la dissymétrie du modèle.
 */
export function TerminalHistogram({
  bins,
  mean,
  median,
  format,
  highlightRuin = false,
  leftNote,
}: TerminalHistogramProps) {
  const [hovered, setHovered] = useState<number | null>(null)
  if (bins.length === 0) return null

  const maxCount = Math.max(...bins.map(b => b.count))
  const total = bins.reduce((s, b) => s + b.count, 0)
  const xMax = bins[bins.length - 1]?.high ?? 1
  const posOf = (v: number) => Math.min(100, Math.max(0, (v / xMax) * 100))
  const modalBin = bins.reduce((a, b) => (b.count > (a?.count ?? 0) ? b : a), bins[0])
  const ariaSummary = `Histogramme des issues : ${total} cas répartis en ${bins.length} classes de capital final entre ${format(bins[0]?.low ?? 0)} et ${format(xMax)}. La classe la plus fréquente contient ${modalBin?.count ?? 0} cas autour de ${format(modalBin?.value ?? 0)}. La médiane est à ${format(median)}, la moyenne à ${format(mean)} (l'écart entre les deux reflète les cas très chanceux).`

  return (
    <div className="space-y-2">
      <div
        role="img"
        tabIndex={0}
        aria-label={ariaSummary}
        className="relative h-32 sm:h-36 flex items-end gap-[2px] px-1 outline-none rounded-lg focus-visible:ring-2 focus-visible:ring-primary/60"
      >
        {bins.map((bin, i) => {
          const h = bin.count === 0 ? 1.5 : Math.max(4, (bin.count / maxCount) * 100)
          const isRuin = highlightRuin && bin.low === 0
          const isHovered = hovered === i
          return (
            <div
              key={i}
              aria-hidden
              className="relative flex-1 group"
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            >
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${h}%` }}
                transition={{ duration: 0.35, delay: i * 0.006 }}
                className={cn(
                  "w-full rounded-t-sm transition-colors duration-150",
                  isRuin
                    ? isHovered
                      ? "bg-[#EF4444]"
                      : "bg-[#F87171]/80"
                    : isHovered
                      ? "bg-gradient-to-t from-primary/60 to-primary"
                      : "bg-gradient-to-t from-primary/20 to-primary/60",
                )}
              />
              {isHovered && (
                <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 z-10 glass-strong rounded-lg px-2 py-1 text-[10px] whitespace-nowrap shadow-premium pointer-events-none">
                  <span className="font-bold text-text">≈ {format(bin.value)}</span>
                  <span className="text-text-dim">
                    {" "}
                    · {bin.count} cas ({((bin.count / total) * 100).toFixed(1)} %)
                  </span>
                </div>
              )}
            </div>
          )
        })}

        {/* Repère médiane */}
        <div className="absolute inset-y-0 pointer-events-none" style={{ left: `${posOf(median)}%` }} aria-hidden>
          <div className="h-full w-px bg-[#4ADE80]/80" />
          <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 text-[9px] font-bold text-[#4ADE80] drop-shadow">
            méd.
          </div>
        </div>
        {/* Repère moyenne */}
        <div className="absolute inset-y-0 pointer-events-none" style={{ left: `${posOf(mean)}%` }} aria-hidden>
          <div className="h-full w-px bg-[#60A5FA]/80 border-l border-dashed border-[#60A5FA]/50" />
          <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 text-[9px] font-bold text-[#60A5FA] drop-shadow">
            moy.
          </div>
        </div>
      </div>

      {/* Axe + notes */}
      <div className="flex items-center justify-between px-1 text-[9px] text-text-dim">
        <span>{leftNote ?? format(0)}</span>
        <span>{format(xMax)}</span>
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-1 text-[9px] text-text-dim">
        <span className="inline-flex items-center gap-1">
          <span className="w-2 h-0.5 bg-[#4ADE80] inline-block" /> Médiane : {format(median)} — 1 cas sur 2 fait mieux
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="w-2 h-0.5 bg-[#60A5FA] inline-block" /> Moyenne : {format(mean)} — tirée par la queue droite
        </span>
        <span>· La dernière barre regroupe aussi les cas extrêmes (au-delà du 99ᵉ percentile).</span>
      </div>
    </div>
  )
}
