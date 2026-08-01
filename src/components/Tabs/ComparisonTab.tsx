import { useMemo } from "react"
import { motion } from "framer-motion"
import { fmtCompact } from "../../engine"
import { ComparisonChart } from "../Charts/ComparisonChart"
import { ComparisonSummary } from "../Simulation/ComparisonSummary"
import type { ScenarioComparison, SimulationInputs, YearRow } from "../../types"

interface ComparisonTabProps {
  rowsA: YearRow[]
  rowsB: YearRow[]
  inputs: SimulationInputs
  darkMode: boolean
  comparison: ScenarioComparison
}

export function ComparisonTab({ rowsA, rowsB, inputs, darkMode, comparison }: ComparisonTabProps) {
  const maxYears = Math.max(rowsA.length, rowsB.length)
  const tableRows = useMemo(
    () =>
      Array.from({ length: maxYears }, (_, i) => {
        const a = rowsA[i]
        const b = rowsB[i]
        // Au-delà de la durée du scénario le plus court, on reporte la DERNIÈRE
        // valeur connue au lieu d'un faux « 0 » (chute à zéro trompeuse).
        const aRef = a ?? rowsA[rowsA.length - 1]
        const bRef = b ?? rowsB[rowsB.length - 1]
        const aVal = aRef?.nominal ?? 0
        const bVal = bRef?.nominal ?? 0
        return {
          year: a?.year ?? b?.year ?? i,
          A: aVal,
          B: bVal,
          diff: bVal - aVal,
        }
      }),
    [rowsA, rowsB, maxYears],
  )

  return (
    <div className="space-y-5 animate-fade-in">
      <ComparisonSummary comparison={comparison} />
      <ComparisonChart rowsA={rowsA} rowsB={rowsB} inputs={inputs} darkMode={darkMode} />

      <div className="glass rounded-3xl overflow-hidden">
        <div className="px-5 sm:px-6 py-4 border-b border-border/30">
          <span className="text-xs font-bold">📋 Tableau comparatif annuel</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b border-border">
                {["Année", "Scénario A", "Scénario B", "Écart (B − A)"].map(h => (
                  <th
                    key={h}
                    className="text-[9px] font-bold uppercase tracking-wider text-text-dim py-2.5 px-3 text-left whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableRows.map((row, i) => (
                <motion.tr
                  key={row.year}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.005 }}
                  className="border-b border-border/30 hover:bg-glass transition-colors"
                >
                  <td className="py-2 px-3 text-text-dim whitespace-nowrap">Année {row.year}</td>
                  <td className="py-2 px-3 mono text-text">{fmtCompact(row.A)}</td>
                  <td className="py-2 px-3 mono text-text">{fmtCompact(row.B)}</td>
                  <td
                    className={`py-2 px-3 mono font-semibold ${
                      row.diff > 0 ? "text-primary" : row.diff < 0 ? "text-danger" : "text-text-dim"
                    }`}
                  >
                    {row.diff > 0 ? "+" : ""}
                    {fmtCompact(row.diff)}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
