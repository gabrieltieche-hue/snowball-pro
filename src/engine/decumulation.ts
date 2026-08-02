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

// Taille de chunk de la variante asynchrone : laisse le thread principal
// respirer entre deux tranches (même principe que runMonteCarloAsync).
const DECUM_CHUNK_SIZE = 150

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

/**
 * Retrait mensuel de base selon le modèle choisi (règle de Bengen sur le
 * capital INITIAL, indexé ensuite sur l'inflation — la « rente constante »).
 */
function computeBaseWithdrawal(inputs: SimulationInputs, startingCapital: number): number {
  if (inputs.withdrawalModel === "rule-4") return (startingCapital * 0.04) / 12
  if (inputs.withdrawalModel === "ultra-safe") return (startingCapital * 0.025) / 12
  if (inputs.withdrawalModel === "optimistic") return (startingCapital * 0.055) / 12
  // custom : montant fixe mensuel choisi par l'utilisateur (0 € est un choix valide)
  return Math.max(0, inputs.withdrawalFixed)
}

/** Accumulateurs partagés entre la variante synchrone et asynchrone. */
interface DecumAccumulator {
  paths: number[][]
  ruinYears: number[]
  withdrawalByYear: number[]
}

/**
 * Rejoue `simCount` simulations consécutives (à partir de `simStart`) et
 * accumule les résultats dans `acc`. C'est LE cœur unique du décaissement :
 * la version synchrone l'appelle en une fois, la version asynchrone par
 * chunks — les deux produisent des résultats bit-à-bit identiques.
 */
function runDecumulationRange(
  inputs: SimulationInputs,
  startingCapital: number,
  baseWithdrawal: number,
  years: number,
  simStart: number,
  simCount: number,
  acc: DecumAccumulator,
): void {
  for (let sim = simStart; sim < simStart + simCount; sim += 1) {
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
      // CRISE : le choc de rendement (le krach lui-même) doit aussi frapper le
      // décumul. Avant l'audit v5.2.2, sampledMonthlyReturnFn n'appliquait que
      // le multiplicateur de volatilité — la Rente voyait la bourse « trembler »
      // sans jamais s'effondrer, incohérent avec le Simulateur et Monte Carlo.
      // En mode historique, les krachs réels sont déjà dans les rendements
      // rejoués : on neutralise (règle identique à runSimulation).
      const shock = historicalReturns ? 0 : crisisAdjustment(inputs, month).returnShock
      const returnWithShock = (1 + marketReturn) * (1 + shock) - 1
      const capitalAfterReturn = roundCent(capital * (1 + returnWithShock))
      // On ne peut retirer que ce qui existe : si le capital ne couvre pas le
      // retrait prévu, seule la part disponible est réellement retirée (le
      // reste serait retiré d'un capital inexistant — retraits « fantômes »,
      // audit B6). actualWithdrawal vaut donc 0 après la faillite.
      const actualWithdrawal = roundCent(Math.min(monthlyWithdrawal, Math.max(0, capitalAfterReturn)))
      capital = roundCent(Math.max(0, capitalAfterReturn - monthlyWithdrawal))
      if (inputs.withdrawalInflation)
        monthlyWithdrawal = roundCent(monthlyWithdrawal * (1 + monthlyRate(inputs.inflation)))
      if (capital <= 0 && ruinYear === null) ruinYear = Math.ceil(month / 12)
      // Cumul mensuel des retraits (et non « dernier retrait × 12 ») pour que
      // l'indexation inflation soit prise en compte année après année.
      acc.withdrawalByYear[Math.ceil(month / 12)] = roundCent(
        acc.withdrawalByYear[Math.ceil(month / 12)] + actualWithdrawal,
      )
      if (month % 12 === 0) capitalPath.push(roundCent(capital))
    }
    if (ruinYear !== null) acc.ruinYears.push(ruinYear)
    acc.paths.push(capitalPath)
  }
}

/** Calcule les bandes de percentiles et les statistiques terminales. */
function finalizeDecumulation(
  years: number,
  paths: number[][],
  ruinYears: number[],
  withdrawalByYear: number[],
  simCount: number,
  baseWithdrawal: number,
): DecumulationResult {
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

export function runDecumulation(
  inputs: SimulationInputs,
  startingCapital: number,
  runs = Math.min(inputs.mcRuns, 10_000),
): DecumulationResult {
  const simCount = Math.round(clamp(runs, 100, 10_000))
  const years = Math.max(1, inputs.retirementYears)
  const baseWithdrawal = computeBaseWithdrawal(inputs, startingCapital)
  const acc: DecumAccumulator = {
    paths: [],
    ruinYears: [],
    withdrawalByYear: Array.from({ length: years + 1 }, () => 0),
  }
  runDecumulationRange(inputs, startingCapital, baseWithdrawal, years, 0, simCount, acc)
  return finalizeDecumulation(years, acc.paths, acc.ruinYears, acc.withdrawalByYear, simCount, baseWithdrawal)
}

/**
 * Variante asynchrone non bloquante : les simulations sont découpées en
 * chunks, le thread principal respire entre chaque chunk (résultats
 * intermédiaires via onProgress). Permet 10 000 scénarios sans geler
 * l'interface (contrairement à runDecumulation, audit B2). Prend un signal
 * d'annulation (AbortController) et produit des résultats identiques à la
 * version synchrone.
 */
export async function runDecumulationAsync(
  inputs: SimulationInputs,
  startingCapital: number,
  runs = Math.min(inputs.mcRuns, 10_000),
  onProgress?: (done: number, total: number) => void,
  signal?: AbortSignal,
): Promise<DecumulationResult> {
  const simCount = Math.round(clamp(runs, 100, 10_000))
  const years = Math.max(1, inputs.retirementYears)
  const baseWithdrawal = computeBaseWithdrawal(inputs, startingCapital)
  const acc: DecumAccumulator = {
    paths: [],
    ruinYears: [],
    withdrawalByYear: Array.from({ length: years + 1 }, () => 0),
  }
  const breathe = () => new Promise<void>(resolve => setTimeout(resolve, 0))

  for (let sim = 0; sim < simCount; sim += DECUM_CHUNK_SIZE) {
    if (signal?.aborted) throw new DOMException("Décaissement annulé", "AbortError")
    const chunk = Math.min(DECUM_CHUNK_SIZE, simCount - sim)
    runDecumulationRange(inputs, startingCapital, baseWithdrawal, years, sim, chunk, acc)
    onProgress?.(Math.min(sim + chunk, simCount), simCount)
    // Laisse le temps à l'interface de peindre entre deux chunks
    await breathe()
  }

  return finalizeDecumulation(years, acc.paths, acc.ruinYears, acc.withdrawalByYear, simCount, baseWithdrawal)
}
