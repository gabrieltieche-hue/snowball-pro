import type { SimulationInputs, DecumulationResult } from "../types"
import { mulberry32, gaussian } from "./rng"
import { monthlyRate, percentile } from "./math"
import { roundCent, clamp } from "./taxes"
import { crisisAdjustment } from "./crisis"
// Rééchantillonnage par blocs NON CHEVAUCHANTS partagé avec l'onglet Monte
// Carlo (une seule implémentation, pas de copie locale qui dérive) : des blocs
// de 5 années consécutives réelles sont tirés avec remise, sans jamais
// reboucler 2025 → 1970. Les krachs et les bull markets réels sont rejoués.
import { sampleHistoricalReturns } from "./montecarlo"

/**
 * Rendement mensuel stochastique autour du rendement annuel attendu. Le
 * décaissement est un Monte-Carlo : on échantillonne toujours de l'aléa
 * (même en mode « fixe », l'avenir de la bourse reste incertain). En mode
 * « historique », la séquence de rendements réels est rejouée à la place
 * (voir runDecumulation) — jamais les deux à la fois.
 */
function sampledMonthlyReturnFn(
  inputs: SimulationInputs,
  annualExpectedReturn: number,
  monthIndex: number,
  rng: () => number,
): number {
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
  runs = Math.min(inputs.mcRuns, 10_000),
): DecumulationResult {
  const simCount = Math.round(clamp(runs, 100, 10_000))
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
    // custom : montant fixe mensuel choisi par l'utilisateur (0 € est un choix valide)
    return Math.max(0, inputs.withdrawalFixed)
  })()

  for (let sim = 0; sim < simCount; sim += 1) {
    const rng = mulberry32(inputs.seed + 100_003 + sim * 3571)
    const historicalReturns = inputs.returnMode === "historical" ? sampleHistoricalReturns(inputs, years, rng) : null
    const capitalPath: number[] = [roundCent(startingCapital)]
    let capital = startingCapital
    let monthlyWithdrawal = baseWithdrawal
    let ruinYear: number | null = null

    for (let month = 1; month <= years * 12; month += 1) {
      const yearIndex = Math.floor((month - 1) / 12)
      const annualReturn = historicalReturns
        ? (historicalReturns[yearIndex] ?? inputs.annualReturn)
        : inputs.annualReturn
      // Historique : rendement réel de l'année, lissé au mois (comme runSimulation).
      // Autrement : échantillonnage stochastique mensuel.
      const marketReturn = historicalReturns
        ? monthlyRate(annualReturn)
        : sampledMonthlyReturnFn(inputs, annualReturn, month, rng)
      capital = roundCent(Math.max(0, capital * (1 + marketReturn) - monthlyWithdrawal))
      if (inputs.withdrawalInflation)
        monthlyWithdrawal = roundCent(monthlyWithdrawal * (1 + monthlyRate(inputs.inflation)))
      if (capital <= 0 && ruinYear === null) ruinYear = Math.ceil(month / 12)
      // Cumul mensuel des retraits (et non « dernier retrait × 12 ») pour que
      // l'indexation inflation soit prise en compte année après année.
      withdrawalByYear[Math.ceil(month / 12)] = roundCent(withdrawalByYear[Math.ceil(month / 12)] + monthlyWithdrawal)
      if (month % 12 === 0) capitalPath.push(roundCent(capital))
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
  const withdrawals = withdrawalByYear.map(v => roundCent(v / simCount))

  return {
    years: yearAxis,
    p10: band(0.1),
    p50: band(0.5),
    p90: band(0.9),
    withdrawals,
    ruinProbability: roundCent(ruinProbability * 100),
    survivalProbability: roundCent((1 - ruinProbability) * 100),
    ruinYearMedian: sortedRuin.length ? Math.round(percentile(sortedRuin, 0.5)) : null,
    initialWithdrawal: roundCent(baseWithdrawal),
    runs: simCount,
    capital: band(0.5),
    success: 1 - ruinProbability > 0.85,
    withdrawal: withdrawals,
  }
}
