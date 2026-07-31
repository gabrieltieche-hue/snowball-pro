import type { SimulationInputs, DecumulationResult } from "../types"
import { mulberry32, gaussian } from "./rng"
import { monthlyRate, percentile } from "./math"
import { roundCent, clamp } from "./taxes"
import { crisisAdjustment } from "./crisis"
import { getHistoricalDataset } from "./historical"

function annualReturnForYearFn(inputs: SimulationInputs, yearIndex: number): number {
  if (inputs.returnMode === "historical") {
    const dataset = getHistoricalDataset(inputs.historicalIndex)
    return dataset.years[yearIndex % dataset.years.length]?.return ?? inputs.annualReturn
  }
  return inputs.annualReturn
}

function sampledMonthlyReturnFn(
  inputs: SimulationInputs,
  annualExpectedReturn: number,
  monthIndex: number,
  rng: () => number,
): number {
  if (inputs.returnMode !== "random") return monthlyRate(annualExpectedReturn)
  const crisis = crisisAdjustment(inputs, monthIndex)
  const sigma = clamp(inputs.volatility * crisis.volMultiplier, 0.001, 1.4)
  const zBase = gaussian(rng)
  const z = rng() < 0.08 ? zBase * 2.35 : zBase
  const drift = Math.log1p(clamp(annualExpectedReturn, -0.8, 1.6)) - 0.5 * sigma * sigma
  return Math.exp(drift / 12 + (sigma / Math.sqrt(12)) * z) - 1
}

export function runDecumulation(
  inputs: SimulationInputs,
  startingCapital: number,
  runs = Math.min(inputs.mcRuns, 3000),
): DecumulationResult {
  const simCount = Math.round(clamp(runs, 100, 5_000))
  const years = Math.max(1, inputs.retirementYears)
  const paths: number[][] = []
  const ruinYears: number[] = []
  const withdrawalByYear = Array.from({ length: years + 1 }, () => 0)
  // Modèles en % : on applique le taux sur le capital INITIAL (règle de Bengen),
  // puis on indexe sur l'inflation. C'est la pratique standard de la "rente constante".
  const baseWithdrawal = (() => {
    if (inputs.withdrawalModel === "rule-4") return (startingCapital * 0.04) / 12
    if (inputs.withdrawalModel === "ultra-safe") return (startingCapital * 0.025) / 12
    if (inputs.withdrawalModel === "optimistic") return (startingCapital * 0.055) / 12
    // custom : montant fixe mensuel choisi par l'utilisateur (défaut raisonnable)
    return Math.max(100, inputs.withdrawalFixed || Math.round((startingCapital * 0.04) / 12))
  })()

  for (let sim = 0; sim < simCount; sim += 1) {
    const rng = mulberry32(inputs.seed + 100_003 + sim * 3571)
    const capitalPath: number[] = [roundCent(startingCapital)]
    let capital = startingCapital
    let monthlyWithdrawal = baseWithdrawal
    let ruinYear: number | null = null

    for (let month = 1; month <= years * 12; month += 1) {
      const yearIndex = Math.floor((month - 1) / 12)
      const annualReturn = annualReturnForYearFn({ ...inputs, returnMode: "random" }, yearIndex)
      const marketReturn = sampledMonthlyReturnFn({ ...inputs, returnMode: "random" }, annualReturn, month, rng)
      capital = roundCent(Math.max(0, capital * (1 + marketReturn) - monthlyWithdrawal))
      if (inputs.withdrawalInflation)
        monthlyWithdrawal = roundCent(monthlyWithdrawal * (1 + monthlyRate(inputs.inflation)))
      if (capital <= 0 && ruinYear === null) ruinYear = Math.ceil(month / 12)
      if (month % 12 === 0) {
        const y = month / 12
        capitalPath.push(roundCent(capital))
        withdrawalByYear[y] = roundCent(withdrawalByYear[y] + monthlyWithdrawal * 12)
      }
    }
    if (ruinYear !== null) ruinYears.push(ruinYear)
    paths.push(capitalPath)
  }

  const yearAxis = Array.from({ length: years + 1 }, (_, i) => i)
  const band = (pct: number) =>
    yearAxis.map((_, year) => {
      const values = paths.map(p => p[year] ?? 0).sort((a, b) => a - b)
      return roundCent(percentile(values, pct))
    })
  const ruinProbability = ruinYears.length / simCount
  const sortedRuin = [...ruinYears].sort((a, b) => a - b)

  return {
    years: yearAxis,
    p10: band(0.1),
    p50: band(0.5),
    p90: band(0.9),
    withdrawals: withdrawalByYear.map(v => roundCent(v / simCount)),
    ruinProbability: roundCent(ruinProbability * 100),
    survivalProbability: roundCent((1 - ruinProbability) * 100),
    ruinYearMedian: sortedRuin.length ? Math.round(percentile(sortedRuin, 0.5)) : null,
    initialWithdrawal: roundCent(baseWithdrawal),
    runs: simCount,
    capital: band(0.5),
    success: 1 - ruinProbability > 0.85,
    ruinAge: sortedRuin.length ? Math.round(percentile(sortedRuin, 0.5)) : null,
    withdrawal: withdrawalByYear.map(v => roundCent(v / simCount)),
  }
}
