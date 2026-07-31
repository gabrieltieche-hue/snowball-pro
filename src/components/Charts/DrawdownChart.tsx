import { TrendingDown } from "lucide-react"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { useMemo } from "react"
import { chartTheme } from "../../utils/chartTheme"
import type { YearRow } from "../../types"
import { CustomTooltip } from "../shared/CustomTooltip"

interface DrawdownChartProps {
  rows: YearRow[]
  darkMode: boolean
}

export function DrawdownChart({ rows, darkMode }: DrawdownChartProps) {
  const theme = chartTheme(darkMode)
  const ddColor = darkMode ? "#e08a8a" : "#9c2f2f"
  const data = useMemo(() => {
    let peak = rows[0]?.nominal || 0
    return rows.map(r => {
      if (r.nominal > peak) peak = r.nominal
      return { year: `An ${r.year}`, drawdown: peak > 0 ? ((r.nominal - peak) / peak) * 100 : 0 }
    })
  }, [rows])

  return (
    <div className="glass rounded-3xl p-6">
      <h3 className="text-xs font-bold mb-4 flex items-center gap-2">
        <TrendingDown size={12} className="text-danger" />
        Drawdown Maximum
      </h3>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorDD" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={ddColor} stopOpacity={0.3} />
                <stop offset="95%" stopColor={ddColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={theme.grid} />
            <XAxis dataKey="year" tick={{ fill: theme.tick, fontSize: 10 }} interval="preserveEnd" minTickGap={28} />
            <YAxis
              tick={{ fill: theme.tick, fontSize: 10 }}
              tickFormatter={(v: number) => `${v.toFixed(0)}%`}
              domain={["auto", 0]}
            />
            <Tooltip content={<CustomTooltip isCurrency={false} />} />
            <Area type="monotone" dataKey="drawdown" stroke={ddColor} fill="url(#colorDD)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
