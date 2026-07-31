import { useMemo } from "react"
import { Area, CartesianGrid, ComposedChart, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { fmtCurrency, fmtCompact } from "../../engine"
import { chartTheme } from "../../utils/chartTheme"
import type { MonteCarloResult } from "../../types"

interface MonteCarloChartProps {
  result: MonteCarloResult
  darkMode: boolean
}

export function MonteCarloChart({ result, darkMode }: MonteCarloChartProps) {
  const theme = chartTheme(darkMode)
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
      <div className="flex items-center justify-between mb-2 px-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
          Évolution du capital — {result.runs.toLocaleString("fr-FR")} simulations
        </span>
        <span className="text-[9px] text-text-dim">
          Objectif : <span className="mono">{fmtCompact(result.goalTarget)}</span>
        </span>
      </div>
      <div className="h-72 sm:h-80">
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
              tick={{ fill: theme.tick, fontSize: 10 }}
              interval="preserveEnd"
              minTickGap={28}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: theme.tick, fontSize: 10 }}
              tickFormatter={(v: number) => fmtCompact(v)}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null
                return (
                  <div className="glass-strong rounded-xl p-3 shadow-premium min-w-[200px]">
                    <div className="text-[10px] text-text-dim uppercase tracking-wider mb-2">
                      {label === "Aujourd'hui" ? "Aujourd'hui" : `${label} ans`}
                    </div>
                    {payload.map((entry, i) => (
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
            <Area type="monotone" dataKey="bande" name="Fourchette P10 – P90" stroke="none" fill="url(#bandGradientMC)" isAnimationActive={false} />
            <Line type="monotone" dataKey="p90" name="P90 — optimiste" stroke="#4ADE80" strokeWidth={1.5} strokeDasharray="4 3" dot={false} />
            <Line type="monotone" dataKey="p50" name="Médiane (P50)" stroke="var(--color-primary)" strokeWidth={2.5} dot={false} />
            <Line type="monotone" dataKey="p10" name="P10 — pessimiste" stroke="#F87171" strokeWidth={1.5} strokeDasharray="4 3" dot={false} />
            <ReferenceLine y={result.goalTarget} stroke="#60A5FA" strokeWidth={1} strokeDasharray="2 2" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2 text-[10px] leading-snug">
        <div className="flex items-start gap-2 px-1">
          <span className="w-2 h-2 rounded-full mt-1 shrink-0 bg-[#4ADE80]" />
          <div>
            <div className="font-bold text-text">P90 — optimiste</div>
            <div className="text-text-dim">Seuls 10 % des scénarios font mieux</div>
          </div>
        </div>
        <div className="flex items-start gap-2 px-1">
          <span className="w-2 h-2 rounded-full mt-1 shrink-0 bg-[#D4AF37]" />
          <div>
            <div className="font-bold text-text">Médiane (P50)</div>
            <div className="text-text-dim">50 % des scénarios au-dessus, 50 % en-dessous</div>
          </div>
        </div>
        <div className="flex items-start gap-2 px-1">
          <span className="w-2 h-2 rounded-full mt-1 shrink-0 bg-[#F87171]" />
          <div>
            <div className="font-bold text-text">P10 — pessimiste</div>
            <div className="text-text-dim">Seuls 10 % des scénarios font moins bien</div>
          </div>
        </div>
      </div>
    </div>
  )
}
