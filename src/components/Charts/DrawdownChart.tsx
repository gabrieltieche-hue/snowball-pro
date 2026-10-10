import { useMemo } from "react"
import { TrendingDown } from "lucide-react"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { useLang } from "../../i18n"
import { chartTheme } from "../../utils/chartTheme"
import { useChartA11y } from "../../hooks/useChartA11y"
import { useIsCoarsePointer } from "../../hooks/useIsCoarsePointer"
import type { YearRow } from "../../types"
import { CustomTooltip } from "../shared/CustomTooltip"
import { SectionHeader } from "../shared/SectionHeader"

interface DrawdownChartProps {
  rows: YearRow[]
  darkMode: boolean
}

export function DrawdownChart({ rows, darkMode }: DrawdownChartProps) {
  const { tr, lang } = useLang()
  const theme = chartTheme(darkMode)
  const ddColor = darkMode ? "#e08a8a" : "#9c2f2f"
  const chartRef = useChartA11y(tr("Les baisses de votre capital en pourcentage"))
  const coarse = useIsCoarsePointer()
  const data = useMemo(() => {
    const yearLabel = lang === "en" ? "Year" : "Année"
    let peak = rows[0]?.nominal || 0
    return rows.map(r => {
      if (r.nominal > peak) peak = r.nominal
      return { year: `${yearLabel} ${r.year}`, drawdown: peak > 0 ? ((r.nominal - peak) / peak) * 100 : 0 }
    })
  }, [rows, lang])
  // Courbe lissée (v5.6.0) : avec un rendement constant chaque année, le
  // capital ne baisse jamais — la ligne plate à 0 % n'apporte rien, on
  // affiche un message à la place du graphe vide.
  const maxDrawdown = data.reduce((m, p) => Math.max(m, Math.abs(p.drawdown)), 0)

  return (
    <div className="glass rounded-3xl p-6 animate-scale-in">
      <SectionHeader
        as="h2"
        level="card"
        icon={TrendingDown}
        iconClassName="text-danger"
        title={tr("Les baisses de votre capital")}
        className="mb-1"
      />
      <p className="text-[10px] text-text-dim mb-4 leading-snug">
        {tr(
          "Les valeurs négatives = les moments où votre capital a baissé par rapport à son plus haut niveau (la « pire chute » est le point le plus bas de la courbe).",
        )}
      </p>
      {maxDrawdown < 0.01 ? (
        <div className="h-48 flex items-center justify-center rounded-xl bg-glass border border-border">
          <p className="text-[11px] text-text-dim italic leading-relaxed max-w-sm text-center px-4">
            {tr(
              "Avec la courbe lissée (rendement constant chaque année), votre capital ne baisse jamais d'une année sur l'autre : aucun creux à afficher. Les baisses restent visibles dans les onglets Monte Carlo et Rente.",
            )}
          </p>
        </div>
      ) : (
        <div ref={chartRef} className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorDD" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={ddColor} stopOpacity={0.45} />
                  <stop offset="55%" stopColor={ddColor} stopOpacity={0.16} />
                  <stop offset="95%" stopColor={ddColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 6" stroke={theme.grid} vertical={false} />
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
                tickFormatter={(v: number) => `${v.toFixed(0)}%`}
                domain={["auto", 0]}
                axisLine={false}
                tickLine={false}
                tickMargin={8}
              />
              <Tooltip trigger={coarse ? "click" : "hover"} content={<CustomTooltip isCurrency={false} />} />
              <Area
                type="monotone"
                dataKey="drawdown"
                name={tr("Baisse du capital")}
                stroke={ddColor}
                fill="url(#colorDD)"
                strokeWidth={2.75}
                isAnimationActive
                animationDuration={1200}
                animationEasing="ease-out"
                style={{ filter: `drop-shadow(0 2px 8px ${ddColor}55)` }}
                activeDot={{ r: 4, strokeWidth: 1.5, stroke: "rgba(255,255,255,0.8)" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
