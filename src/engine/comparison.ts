import type { YearRow } from "../types"
import { compareScenarios } from "./kpis"

export interface ComparisonSeriesRow {
  year: string
  A: number | null
  B: number | null
}

export function mergeComparisonSeries(
  rowsA: YearRow[],
  rowsB: YearRow[],
  showReal: boolean,
): ComparisonSeriesRow[] {
  const maxYears = Math.max(rowsA.length, rowsB.length)
  const series: ComparisonSeriesRow[] = []
  for (let i = 0; i < maxYears; i += 1) {
    const a = rowsA[i]
    const b = rowsB[i]
    series.push({
      year: `An ${a?.year ?? b?.year ?? i}`,
      A: a ? (showReal ? a.real : a.nominal) : null,
      B: b ? (showReal ? b.real : b.nominal) : null,
    })
  }
  return series
}

export { compareScenarios }
