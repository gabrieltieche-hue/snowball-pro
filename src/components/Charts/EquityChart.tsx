import { useMemo } from "react"
import { Area, AreaChart, CartesianGrid, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { deflationFactor, fmtCurrency, fmtCompact } from "../../engine"
import { chartTheme } from "../../utils/chartTheme"
import { useChartA11y } from "../../hooks/useChartA11y"
import { useIsCoarsePointer } from "../../hooks/useIsCoarsePointer"
import type { EnvelopeType, SimulationInputs, YearRow } from "../../types"

interface EquityChartProps {
  rows: YearRow[]
  inputs: SimulationInputs
  darkMode: boolean
}

/**
 * Série du graphique d'équité. Fonction pure (testable) : TOUTES les courbes
 * partagent la même échelle — quand showReal est actif, les impôts sont
 * déflatés comme l'épargne et les gains. Avant l'audit v5.2.0, le tooltip
 * affichait 303 k€ d'impôts (euros courants) à côté d'une carte « Impôts » à
 * 176 k€ (euros d'aujourd'hui) : échelles mélangées sur un même graphe.
 */
export function buildEquitySeries(rows: YearRow[], showReal: boolean, envelope: EnvelopeType) {
  return rows.map(r => {
    const invested = showReal ? r.investedReal : r.investedNom
    const total = showReal ? r.real : r.nominal
    const gains = Math.max(0, total - invested)
    const taxesNom = envelope === "none" ? 0 : Math.max(0, r.nominal - r.taxNet)
    const taxes = showReal ? taxesNom * deflationFactor(r) : taxesNom
    return { year: `Année ${r.year}`, investi: invested, gains, impôts: taxes }
  })
}

export function EquityChart({ rows, inputs, darkMode }: EquityChartProps) {
  const showReal = inputs.showReal
  const theme = chartTheme(darkMode)
  const chartRef = useChartA11y("Projection de votre capital — montants par année")
  const coarse = useIsCoarsePointer()

  const data = useMemo(() => buildEquitySeries(rows, showReal, inputs.envelope), [rows, showReal, inputs.envelope])

  const gainsColor = showReal ? theme.gainsAlt : theme.gains
  const investedColor = theme.invested
  const taxColor = theme.tax

  return (
    <div className="glass rounded-3xl p-5 sm:p-6">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 className="text-sm font-bold flex items-center gap-2">
          📈 Projection de votre capital
          {showReal && (
            <span className="text-[10px] mono font-bold text-warning bg-warning/10 px-1.5 py-0.5 rounded uppercase tracking-wider">
              Euros d'aujourd'hui
            </span>
          )}
        </h2>
        <div className="flex items-center gap-3 text-[10px] text-text-dim">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full" style={{ background: gainsColor }} /> Gains (bourse)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full" style={{ background: investedColor }} /> Argent épargné
          </span>
          {inputs.envelope !== "none" && (
            <span className="flex items-center gap-1">
              <span className="w-2 h-0.5 rounded-full" style={{ background: taxColor }} /> Impôts payés
            </span>
          )}
        </div>
      </div>

      <div ref={chartRef} className="h-72 sm:h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="gradInvesti" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={investedColor} stopOpacity={0.3} />
                <stop offset="100%" stopColor={investedColor} stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="gradGains" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={gainsColor} stopOpacity={0.35} />
                <stop offset="100%" stopColor={gainsColor} stopOpacity={0.02} />
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
                    <div className="text-[10px] text-text-dim uppercase tracking-wider mb-2">{label}</div>
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
            <Area
              type="monotone"
              dataKey="investi"
              name="Argent épargné"
              stackId="1"
              stroke={investedColor}
              strokeWidth={2}
              fill="url(#gradInvesti)"
              isAnimationActive={false}
            />
            <Area
              type="monotone"
              dataKey="gains"
              name="Gains (bourse)"
              stackId="1"
              stroke={gainsColor}
              strokeWidth={2}
              fill="url(#gradGains)"
              isAnimationActive={false}
            />
            {inputs.envelope !== "none" && (
              <Line
                type="monotone"
                dataKey="impôts"
                name="Impôts payés"
                stroke={taxColor}
                strokeWidth={2}
                strokeDasharray="6 3"
                dot={false}
                isAnimationActive={false}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
