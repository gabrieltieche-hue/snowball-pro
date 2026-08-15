import { useMemo } from "react"
import { TrendingUp } from "lucide-react"
import { Area, AreaChart, CartesianGrid, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { deflationFactor } from "../../engine"
import type { Lang } from "../../engine"
import { useLang } from "../../i18n"
import { chartTheme } from "../../utils/chartTheme"
import { useChartA11y } from "../../hooks/useChartA11y"
import { useIsCoarsePointer } from "../../hooks/useIsCoarsePointer"
import { LegendChip } from "../shared/LegendChip"
import { SectionHeader } from "../shared/SectionHeader"
import type { EnvelopeType, SimulationInputs, YearRow } from "../../types"

interface EquityChartProps {
  rows: YearRow[]
  inputs: SimulationInputs
  darkMode: boolean
}

/** Props minimales reçues par le content d'un LabelList Recharts (v3).
 *  x/y peuvent être des chaînes (positions en %) côté Recharts. */
interface EndLabelProps {
  x?: string | number
  y?: string | number
  index?: number
  value?: unknown
}

/**
 * Série du graphique d'équité. Fonction pure (testable) : TOUTES les courbes
 * partagent la même échelle — quand showReal est actif, les impôts sont
 * déflatés comme l'épargne et les gains. Avant l'audit v5.2.0, le tooltip
 * affichait 303 k€ d'impôts (euros courants) à côté d'une carte « Impôts » à
 * 176 k€ (euros d'aujourd'hui) : échelles mélangées sur un même graphe.
 */
export function buildEquitySeries(rows: YearRow[], showReal: boolean, envelope: EnvelopeType, lang: Lang = "fr") {
  const yearLabel = lang === "en" ? "Year" : "Année"
  return rows.map(r => {
    const invested = showReal ? r.investedReal : r.investedNom
    const total = showReal ? r.real : r.nominal
    const gains = Math.max(0, total - invested)
    const taxesNom = envelope === "none" ? 0 : Math.max(0, r.nominal - r.taxNet)
    const taxes = showReal ? taxesNom * deflationFactor(r) : taxesNom
    return { year: `${yearLabel} ${r.year}`, investi: invested, gains, impôts: taxes }
  })
}

export function EquityChart({ rows, inputs, darkMode }: EquityChartProps) {
  const { tr, lang, fmtCurrency, fmtCompact } = useLang()
  const showReal = inputs.showReal
  const theme = chartTheme(darkMode)
  const chartRef = useChartA11y(tr("Projection de votre capital — montants par année"))
  const coarse = useIsCoarsePointer()
  const lastRow = rows[rows.length - 1]

  const data = useMemo(
    () => buildEquitySeries(rows, showReal, inputs.envelope, lang),
    [rows, showReal, inputs.envelope, lang],
  )

  const gainsColor = showReal ? theme.gainsAlt : theme.gains
  const investedColor = theme.invested
  const taxColor = theme.tax

  // v6.10 — labels de fin de courbe : la valeur finale lisible sans hover,
  // avec un point or sur « Gains ». Couleurs texte alignées WCAG AA 4.5:1
  // sur la carte : l'or vif #996f09 ne passe pas en texte clair (4.1:1), on
  // utilise la variante profonde gainsAlt (#7a5807, 5.9:1).
  const fmtEnd = (v: number) => (lang === "en" ? `€${fmtCompact(v)}` : `${fmtCompact(v)} €`)
  const endLabel =
    (seriesColor: string, textColor: string, dot: boolean) =>
    ({ x, y, index, value }: EndLabelProps) => {
      if (!data.length || index !== data.length - 1) return null
      const v = typeof value === "number" ? value : 0
      const px = Number(x ?? 0)
      const py = Number(y ?? 0)
      return (
        <g>
          {dot && <circle cx={px} cy={py} r={3.5} fill={seriesColor} stroke="rgba(255,255,255,0.85)" strokeWidth={1} />}
          <text
            x={px + (dot ? 10 : 7)}
            y={py + (dot ? 4 : 3.5)}
            fill={textColor}
            fontSize={dot ? 11 : 10}
            fontWeight={dot ? 700 : 500}
            fontFamily="var(--font-mono)"
            style={{ fontVariantNumeric: "tabular-nums", letterSpacing: "-0.01em" }}
          >
            {fmtEnd(v)}
          </text>
        </g>
      )
    }

  return (
    <div className="glass rounded-3xl p-5 sm:p-6 animate-scale-in">
      <SectionHeader
        as="h2"
        level="card"
        icon={TrendingUp}
        title={tr("Projection de votre capital")}
        trailing={
          <div className="flex items-center gap-1.5 text-[10px] text-text-dim flex-wrap">
            {showReal && (
              <span className="text-[10px] mono font-bold text-warning bg-warning/10 px-1.5 py-0.5 rounded uppercase tracking-wider">
                {tr("Euros d'aujourd'hui")}
              </span>
            )}
            <LegendChip color={gainsColor} label={tr("Gains (bourse)")} />
            <LegendChip color={investedColor} label={tr("Argent épargné")} />
            {inputs.envelope !== "none" && (
              <LegendChip color={taxColor} label={tr("Impôts théoriques (liquidation)")} dashed />
            )}
          </div>
        }
      />

      {/* Quand les courbes sont en euros d'aujourd'hui, la valeur qui sera
          réellement sur le compte reste affichée : l'utilisateur ne perd jamais
          de vue le montant nominal (demande utilisateur). */}
      {showReal && lastRow && (
        <p className="text-[10px] text-text-dim italic leading-snug -mt-2 mb-4">
          {tr("Courbes en euros d'aujourd'hui — sur le compte, le capital final serait de")}{" "}
          <strong className="text-text not-italic">{fmtCurrency(lastRow.nominal)}</strong>
        </p>
      )}

      <div ref={chartRef} className="h-72 sm:h-80">
        <ResponsiveContainer width="100%" height="100%">
          {/* Marge droite élargie : les labels de fin de courbe vivent hors du
              tracé, sans rogner la dernière valeur. */}
          <AreaChart data={data} margin={{ top: 8, right: 64, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="gradInvesti" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={investedColor} stopOpacity={0.18} />
                <stop offset="100%" stopColor={investedColor} stopOpacity={0.01} />
              </linearGradient>
              <linearGradient id="gradGains" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={gainsColor} stopOpacity={0.28} />
                <stop offset="100%" stopColor={gainsColor} stopOpacity={0.01} />
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
                      {label}
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
            <Area
              type="monotone"
              dataKey="investi"
              name={tr("Argent épargné")}
              stackId="1"
              stroke={investedColor}
              strokeWidth={2}
              fill="url(#gradInvesti)"
              isAnimationActive={false}
              label={{ content: endLabel(investedColor, investedColor, false) }}
            />
            <Area
              type="monotone"
              dataKey="gains"
              name={tr("Gains (bourse)")}
              stackId="1"
              stroke={gainsColor}
              strokeWidth={2}
              fill="url(#gradGains)"
              isAnimationActive={false}
              label={{ content: endLabel(gainsColor, theme.gainsAlt, true) }}
            />
            {inputs.envelope !== "none" && (
              <Line
                type="monotone"
                dataKey="impôts"
                name={tr("Impôts théoriques (liquidation)")}
                stroke={taxColor}
                strokeWidth={2}
                strokeDasharray="6 3"
                dot={false}
                isAnimationActive={false}
                label={{ content: endLabel(taxColor, taxColor, false) }}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
