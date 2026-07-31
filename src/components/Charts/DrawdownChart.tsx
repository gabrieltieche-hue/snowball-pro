import { TrendingDown } from "lucide-react"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { useMemo } from "react"
import type { YearRow } from "../../types"
import { CustomTooltip } from "../shared/CustomTooltip"

interface DrawdownChartProps {
  rows: YearRow[]
}

export function DrawdownChart({ rows }: DrawdownChartProps) {
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
                <stop offset="5%" stopColor="#8B3A3A" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#8B3A3A" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="year" tick={{ fill: "#7A7265", fontSize: 10 }} interval="preserveEnd" minTickGap={28} />
            <YAxis
              tick={{ fill: "#7A7265", fontSize: 10 }}
              tickFormatter={(v: number) => `${v.toFixed(0)}%`}
              domain={["auto", 0]}
            />
            <Tooltip content={<CustomTooltip isCurrency={false} />} />
            <Area type="monotone" dataKey="drawdown" stroke="#8B3A3A" fill="url(#colorDD)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
