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
}

export function MonteCarloChart({ result, darkMode }: MonteCarloChartProps) {
  const theme = chartTheme(darkMode)
  const chartRef = useChartA11y("Votre capital année après année — P10, P50 et P90")
  const coarse = useIsCoarsePointer()
  const data = useMemo(
    () =>
      result.years.map((y, i) => {
        const p10 = result.p10[i] ?? 0
        const p50 = result.p50[i] ?? 0
        const p90 = result.p90[i] ?? 0
        return {
          year: y === 0 ? "Aujourd'hui" : `+${y}`,
          p10,
          p50,
          p90,
          bande: [p10, p90],
        }
      }),
    [result],
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
        possible
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
            />
            <YAxis
              tick={{ fill: theme.tick, fontSize: 11 }}
              tickFormatter={(v: number) => fmtCompact(v)}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              trigger={coarse ? "click" : "hover"}
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null
                return (
                  <div className="glass-strong rounded-xl p-3 shadow-premium min-w-[200px]">
                    <div className="text-[10px] text-text-dim uppercase tracking-wider mb-2">
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
              stroke="#4ADE80"
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
              stroke="#F87171"
              strokeWidth={1.5}
              strokeDasharray="4 3"
              dot={false}
            />
            <ReferenceLine y={result.goalTarget} stroke="#60A5FA" strokeWidth={1} strokeDasharray="2 2" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2 text-[10px] leading-snug">
        <div className="flex items-start gap-2 px-1">
          <span className="w-2 h-2 rounded-full mt-1 shrink-0 bg-[#4ADE80]" />
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
          <span className="w-2 h-2 rounded-full mt-1 shrink-0 bg-[#F87171]" />
          <div>
            <div className="font-bold text-text">Période difficile (P10)</div>
            <div className="text-text-dim">La bourse est décevante — seul 1 cas sur 10 fait encore moins bien</div>
          </div>
        </div>
      </div>
    </div>
  )
}
