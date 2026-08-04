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
  // Repères positionnés sur la même échelle √ que les classes du moteur
  // (buildTerminalHistogram) : sans cela, médiane/moyenne seraient mal
  // alignées avec les barres sur une distribution à queue droite.
  const posOf = (v: number) => Math.min(100, Math.max(0, Math.sqrt(v / xMax) * 100))
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
          const hasCount = bin.count > 0
          const h = hasCount ? Math.max(6, (bin.count / maxCount) * 100) : 2
          const isRuin = highlightRuin && bin.low === 0
          const isHovered = hovered === i
          return (
            /* CORRECTIF v5.6.1 : l'ancien wrapper « flex-1 » sans hauteur
               définie laissait la barre (height: X%) sans parent mesurable →
               0 px de haut, seules les lignes médiane/moyenne s'affichaient
               (« 2 barres »). Le wrapper s'étire maintenant sur toute la
               hauteur et aligne la barre en bas (items-end). */
            <div
              key={i}
              aria-hidden
              className="relative flex-1 h-full flex items-end group"
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            >
              {/* La barre est relative : le tooltip s'ancre au sommet DE LA
                  BARRE survolée (pas en haut du graphique — le wrapper étant
                  désormais pleine hauteur, un bottom-full sur le wrapper
                  égarerait le tooltip). */}
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${h}%` }}
                transition={{ duration: 0.35, delay: i * 0.006 }}
                className={cn(
                  "relative w-full rounded-t-[3px] transition-colors duration-150",
                  !hasCount && "bg-text-dim/10",
                  isRuin
                    ? isHovered
                      ? "bg-[#EF4444]"
                      : "bg-[#F87171]/80"
                    : isHovered
                      ? "bg-gradient-to-t from-primary/60 to-primary"
                      : "bg-gradient-to-t from-primary/25 to-primary/65",
                )}
              >
                {isHovered && (
                  <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 z-10 glass-strong rounded-lg px-2 py-1 text-[10px] whitespace-nowrap shadow-premium pointer-events-none">
                    <span className="font-bold text-text">≈ {format(bin.value)}</span>
                    <span className="text-text-dim">
                      {" "}
                      · {bin.count} cas ({((bin.count / total) * 100).toFixed(1).replace(".", ",")} %)
                    </span>
                  </div>
                )}
              </motion.div>
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
        <span>· La dernière barre regroupe aussi les cas au-delà de {format(xMax)} (queue droite).</span>
      </div>
    </div>
  )
}
