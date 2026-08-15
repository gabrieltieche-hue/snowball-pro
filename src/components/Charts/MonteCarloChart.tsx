import { useMemo } from "react"
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { TrendingUp } from "lucide-react"
import { fmtCurrency, fmtCompact } from "../../engine"
import { chartTheme } from "../../utils/chartTheme"
import { useChartA11y } from "../../hooks/useChartA11y"
import { useIsCoarsePointer } from "../../hooks/useIsCoarsePointer"
import { SectionHeader } from "../shared/SectionHeader"
import type { MonteCarloResult } from "../../types"

interface MonteCarloChartProps {
  result: MonteCarloResult
  darkMode: boolean
  /** Affiche les bandes en euros d'aujourd'hui (déflatées) au lieu des euros
   * courants (paquet 1). */
  real?: boolean
}

export function MonteCarloChart({ result, darkMode, real = false }: MonteCarloChartProps) {
  const theme = chartTheme(darkMode)
  const chartRef = useChartA11y("Votre capital année après année — P10, P50 et P90")
  const coarse = useIsCoarsePointer()
  const data = useMemo(
    () =>
      result.years.map((y, i) => {
        // En euros réels, on lit les bandes déflatées de chaque scénario
        // (p10r/p50r/p90r) — la ligne d'objectif reste en euros d'aujourd'hui,
        // l'objectif étant exprimé dans cette échelle par l'utilisateur.
        const p10 = real ? (result.p10r[i] ?? 0) : (result.p10[i] ?? 0)
        const p50 = real ? (result.p50r[i] ?? 0) : (result.p50[i] ?? 0)
        const p90 = real ? (result.p90r[i] ?? 0) : (result.p90[i] ?? 0)
        return {
          year: y === 0 ? "Aujourd'hui" : `+${y}`,
          p10,
          p50,
          p90,
          bande: [p10, p90],
        }
      }),
    [result, real],
  )

  return (
    <div className="glass rounded-2xl p-3 sm:p-4">
      <SectionHeader
        as="h3"
        level="card"
        icon={TrendingUp}
        title="Votre capital, année après année"
        className="mb-2 px-1"
        trailing={
          <span className="text-[10px] text-text-dim">
            Objectif visé : <span className="mono">{fmtCompact(result.goalTarget)}</span>
          </span>
        }
      />
      <p className="text-[10px] text-text-dim mb-2 px-1">
        {result.runs.toLocaleString("fr-FR")} évolutions de bourse différentes testées · chaque ligne est un cas
        possible ·{" "}
        {real ? (
          <strong className="text-text not-italic">en euros d'aujourd'hui (nets d'impôts et d'inflation)</strong>
        ) : (
          <strong className="text-text not-italic">en euros courants (nets d'impôts)</strong>
        )}
      </p>
      <div ref={chartRef} className="h-72 sm:h-80">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart margin={{ top: 8, right: 8, bottom: 0, left: 0 }} data={data}>
            <defs>
              <linearGradient id="bandGradientMC" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.22} />
                <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0.03} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={theme.grid} vertical={false} />
            <XAxis
              dataKey="year"
              tick={{ fill: theme.tick, fontSize: 11 }}
              interval="preserveEnd"
              minTickGap={28}
              axisLine={false}
              tickLine={false}
              tickMargin={8}
            />
            <YAxis
              tick={{ fill: theme.tick, fontSize: 11 }}
              tickFormatter={(v: number) => fmtCompact(v)}
              axisLine={false}
              tickLine={false}
              tickMargin={8}
            />
            <Tooltip
              trigger={coarse ? "click" : "hover"}
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null
                return (
                  <div className="glass-strong rounded-xl p-3 shadow-premium min-w-[200px]">
                    <div className="text-[10px] text-text-dim uppercase tracking-wider border-b border-border/70 pb-1.5 mb-1.5">
                      {label === "Aujourd'hui" ? "Aujourd'hui" : `${label} ans`}
                    </div>
                    {payload
                      .filter(entry => entry.name !== "Fourchette (pire – meilleur cas)")
                      .map((entry, i) => (
                        <div key={i} className="flex items-center justify-between gap-3 py-0.5">
                          <span className="text-[11px] flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
                            {entry.name}
                          </span>
                          <span className="mono text-[11px] font-bold" style={{ color: entry.color }}>
                            {fmtCurrency(entry.value as number)}
                          </span>
                        </div>
                      ))}
                  </div>
                )
              }}
            />
            <Area
              type="monotone"
              dataKey="bande"
              name="Fourchette (pire – meilleur cas)"
              stroke="none"
              fill="url(#bandGradientMC)"
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="p90"
              name="Bonne période de bourse (P90)"
              stroke="var(--color-success)"
              strokeWidth={1.5}
              strokeDasharray="4 3"
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="p50"
              name="Scénario moyen (P50)"
              stroke="var(--color-primary)"
              strokeWidth={2.5}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="p10"
              name="Période difficile (P10)"
              stroke="var(--color-danger)"
              strokeWidth={1.5}
              strokeDasharray="4 3"
              dot={false}
            />
            {/* M13 — la ligne objectif est étiquetée (plus de trait bleu muet) et
                suit la charte : ambre, comme les repères de réglage. */}
            <ReferenceLine
              y={result.goalTarget}
              stroke="var(--color-warning)"
              strokeWidth={1}
              strokeDasharray="2 2"
              label={{ value: "Objectif", position: "right", fill: theme.tick, fontSize: 10 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2 text-[10px] leading-snug">
        <div className="flex items-start gap-2 px-1">
          <span className="w-2 h-2 rounded-full mt-1 shrink-0 bg-[var(--color-success)]" />
          <div>
            <div className="font-bold text-text">Bonne période de bourse (P90)</div>
            <div className="text-text-dim">La bourse vous sourit — seul 1 cas sur 10 fait encore mieux</div>
          </div>
        </div>
        <div className="flex items-start gap-2 px-1">
          <span className="w-2 h-2 rounded-full mt-1 shrink-0 bg-primary" />
          <div>
            <div className="font-bold text-text">Scénario moyen (P50)</div>
            <div className="text-text-dim">Le cas le plus courant : 1 fois sur 2 mieux, 1 fois sur 2 moins bien</div>
          </div>
        </div>
        <div className="flex items-start gap-2 px-1">
          <span className="w-2 h-2 rounded-full mt-1 shrink-0 bg-[var(--color-danger)]" />
          <div>
            <div className="font-bold text-text">Période difficile (P10)</div>
            <div className="text-text-dim">La bourse est décevante — seul 1 cas sur 10 fait encore moins bien</div>
          </div>
        </div>
      </div>
    </div>
  )
}
