import { useMemo } from "react"
import { BarChart3 } from "lucide-react"
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { mergeComparisonSeries } from "../../engine"
import { useLang } from "../../i18n"
import { chartTheme } from "../../utils/chartTheme"
import { useChartA11y } from "../../hooks/useChartA11y"
import { useIsCoarsePointer } from "../../hooks/useIsCoarsePointer"
import { LegendChip } from "../shared/LegendChip"
import { SectionHeader } from "../shared/SectionHeader"
import type { SimulationInputs, YearRow } from "../../types"

interface ComparisonChartProps {
  rowsA: YearRow[]
  rowsB: YearRow[]
  inputs: SimulationInputs
  darkMode: boolean
}

export function ComparisonChart({ rowsA, rowsB, inputs, darkMode }: ComparisonChartProps) {
  const { tr, fmtCurrency, fmtCompact } = useLang()
  const theme = chartTheme(darkMode)
  const chartRef = useChartA11y(tr("Projection comparée des scénarios A et B"))
  const coarse = useIsCoarsePointer()
  const data = useMemo(
    () => mergeComparisonSeries(rowsA, rowsB, inputs.showReal, true),
    [rowsA, rowsB, inputs.showReal],
  )
  const colorA = theme.invested
  const colorB = theme.gains

  return (
    <div className="glass rounded-3xl p-5 sm:p-6 animate-scale-in">
      <SectionHeader
        as="h2"
        level="card"
        icon={BarChart3}
        title={tr("Projection comparée A vs B")}
        trailing={
          <div className="flex items-center gap-1.5 text-[10px] text-text-dim flex-wrap">
            <LegendChip color={colorA} label={tr("Scénario A")} />
            <LegendChip color={colorB} label={tr("Scénario B")} />
            {inputs.showReal && (
              <span className="text-[10px] mono font-bold text-warning bg-warning/10 px-1.5 py-0.5 rounded uppercase tracking-wider">
                {tr("Euros d'aujourd'hui")}
              </span>
            )}
          </div>
        }
      />

      <div ref={chartRef} className="h-72 sm:h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
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
                      {label}
                    </div>
                    {payload.map((entry, i) => (
                      <div key={i} className="flex items-center justify-between gap-3 py-0.5">
                        <span className="text-[11px] flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
                          {entry.name}
                        </span>
                        <span className="mono text-[11px] font-bold" style={{ color: entry.color }}>
                          {entry.value == null ? "—" : fmtCurrency(entry.value as number)}
                        </span>
                      </div>
                    ))}
                  </div>
                )
              }}
            />
            <Line type="monotone" dataKey="A" name={tr("Scénario A")} stroke={colorA} strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="B" name={tr("Scénario B")} stroke={colorB} strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
