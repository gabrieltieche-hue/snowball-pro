import type { YearRow } from "../types"
import { deflationFactor } from "./math"
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
  netFiscal = false,
): ComparisonSeriesRow[] {
  const maxYears = Math.max(rowsA.length, rowsB.length)
  const series: ComparisonSeriesRow[] = []
  for (let i = 0; i < maxYears; i += 1) {
    const a = rowsA[i]
    const b = rowsB[i]
    const valueOf = (row: YearRow): number => {
      const nominal = netFiscal ? row.taxNet : row.nominal
      return showReal ? nominal * deflationFactor(row) : nominal
    }
    series.push({
      year: `An ${a?.year ?? b?.year ?? i}`,
      A: a ? valueOf(a) : null,
      B: b ? valueOf(b) : null,
    })
  }
  return series
}

export { compareScenarios }
