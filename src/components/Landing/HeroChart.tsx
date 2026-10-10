import { useMemo } from "react"
import { motion } from "framer-motion"
import { parseStoredInputs, runSimulation } from "../../engine"
import { useLang } from "../../i18n"
import type { SimulationInputs, YearRow } from "../../types"

const W = 640
const H = 185
const PAD = { top: 12, right: 14, bottom: 22, left: 14 }

interface HeroChartProps {
  /** Séries déjà calculées par l'appelant (démo interactive du héro). */
  rows?: YearRow[]
  /** Réglages correspondants (durée, versement…). Défaut : moteur sur les défauts. */
  inputs?: SimulationInputs
  /** Sous-texte « Capital final / Croissance ». Le héro interactif le remplace
   * par son propre bloc de résultat (nombre magique + décomposition). */
  footer?: boolean
}

/**
 * Graphique du héro de la landing — PAS une maquette : il exécute le vrai
 * moteur (`runSimulation` sur les réglages par défaut) et dessine la courbe
 * d'équité en SVG pur (léger, déterministe, fidèle à l'app). Quand `rows` et
 * `inputs` sont fournis, il dessine les données de l'appelant (le héro
 * interactif change de scénario sans recalculer ici).
 */
export function HeroChart({ rows: providedRows, inputs: providedInputs, footer = true }: HeroChartProps = {}) {
  const { tr, fmtCurrency, locale } = useLang()
  const { rows, inputs, last } = useMemo(() => {
    if (providedRows && providedInputs) {
      return { rows: providedRows, inputs: providedInputs, last: providedRows[providedRows.length - 1] }
    }
    const inputs = parseStoredInputs(null)
    const rows = runSimulation(inputs)
    return { rows, inputs, last: rows[rows.length - 1] }
  }, [providedRows, providedInputs])

  if (!last) return null

  const min = Math.min(...rows.map(r => Math.min(r.nominal, r.real)))
  const max = Math.max(...rows.map(r => Math.max(r.nominal, r.real)))
  const span = Math.max(1, max - min)
  const innerW = W - PAD.left - PAD.right
  const innerH = H - PAD.top - PAD.bottom
  const x = (i: number) => PAD.left + (i / (rows.length - 1)) * innerW
  const y = (v: number) => PAD.top + innerH - ((v - min) / span) * innerH

  const linePath = (key: "nominal" | "real") =>
    rows.map((r, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(r[key]).toFixed(1)}`).join("")
  const areaPath = `${linePath("nominal")}L${x(rows.length - 1).toFixed(1)},${H - PAD.bottom}L${x(0).toFixed(1)},${H - PAD.bottom}Z`

  const years = [rows[0], rows[Math.floor(rows.length / 2)], rows[rows.length - 1]].map(r => ({
    label: (r.date.split(" ")[1] ?? "").replace(".", ""),
    x: x(rows.indexOf(r)),
  }))

  const endYear = (last.date.split(" ")[1] ?? "").replace(".", "")
  const growth = Math.max(0, last.nominal - last.investedNom)
  const growthPct = last.nominal > 0 ? (growth / last.nominal) * 100 : 0

  return (
    <div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={tr(
          "Projection du capital sur la durée par défaut : la courbe nominale monte de 0 à un capital final, la courbe en euros d'aujourd'hui suit en dessous.",
        )}
        className="w-full h-auto"
      >
        <defs>
          <linearGradient id="hero-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.34" />
            <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0.03" />
          </linearGradient>
          <linearGradient id="hero-line" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--color-primary-light)" />
            <stop offset="50%" stopColor="var(--color-primary)" />
            <stop offset="100%" stopColor="var(--color-primary)" />
          </linearGradient>
        </defs>

        {/* Lignes de grille horizontales */}
        {[0.25, 0.5, 0.75].map(t => (
          <line
            key={t}
            x1={PAD.left}
            x2={W - PAD.right}
            y1={PAD.top + innerH * t}
            y2={PAD.top + innerH * t}
            stroke="var(--color-border-light)"
            strokeWidth="1"
            strokeDasharray="3 5"
          />
        ))}

        {/* Aire sous la courbe nominale */}
        <motion.path
          d={areaPath}
          fill="url(#hero-area)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.9, delay: 0.7 }}
        />

        {/* Courbe en euros d'aujourd'hui (pouvoir d'achat) */}
        <motion.path
          d={linePath("real")}
          fill="none"
          stroke="var(--color-text-muted)"
          strokeOpacity="0.55"
          strokeWidth="2"
          strokeDasharray="1 0"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.3, ease: "easeOut", delay: 0.35 }}
        />

        {/* Courbe nominale (or) */}
        <motion.path
          d={linePath("nominal")}
          fill="none"
          stroke="url(#hero-line)"
          strokeWidth="3.5"
          strokeLinecap="round"
          style={{ filter: "drop-shadow(0 0 12px rgba(212,175,55,0.35))" }}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.3, ease: "easeOut" }}
        />

        {/* Point final + étiquette */}
        <motion.circle
          cx={x(rows.length - 1)}
          cy={y(last.nominal)}
          r="6"
          fill="var(--color-primary)"
          stroke="var(--color-surface)"
          strokeWidth="2.5"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.25, type: "spring", stiffness: 300, damping: 18 }}
        />

        {/* Années (début, milieu, fin) */}
        {years.map(({ label, x: px }) => (
          <text
            key={label}
            x={px}
            y={H - 6}
            textAnchor="middle"
            className="mono"
            fontSize="9"
            fill="var(--color-text-dim)"
          >
            {label}
          </text>
        ))}
      </svg>

      {/* Sous-texte : le scénario par défaut, en chiffres réels du moteur. */}
      {footer && (
        <div className="flex items-center justify-between gap-3 flex-wrap mt-3 pt-3 border-t border-border/60">
          <p className="text-[10.5px] text-text-muted flex items-center gap-1.5">
            <span className="w-2.5 h-[3px] rounded-full bg-primary shrink-0" aria-hidden />
            {tr("Capital final ({year}) :", { year: endYear })}{" "}
            <span className="mono font-bold text-text">{fmtCurrency(last.nominal)}</span>
          </p>
          <p className="text-[10.5px] text-text-muted flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-text-muted shrink-0" aria-hidden />
            {tr("Croissance :")} <span className="mono font-bold text-primary">{growthPct.toFixed(0)} %</span>
          </p>
          <p className="text-[10.5px] text-text-muted">
            {inputs.duration} {tr("ans")} · {inputs.monthlyPayment.toLocaleString(locale)} €/{tr("mois")}
          </p>
        </div>
      )}
    </div>
  )
}
