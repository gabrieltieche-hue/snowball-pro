import type { SimulationInputs, DecumulationResult } from "../types"
import { mulberry32 } from "./rng"
import { monthlyRate, percentile } from "./math"
import { roundCent, clamp } from "./taxes"
// Rééchantillonnage par blocs NON CHEVAUCHANTS partagé avec l'onglet Monte
// Carlo (une seule implémentation, pas de copie locale qui dérive) : des blocs
// de 5 années consécutives réelles sont tirés avec remise, sans jamais
// reboucler 2025 → 1970. Les krachs et les bull markets réels sont rejoués.
import { sampleHistoricalReturns } from "./montecarlo"
import { MSCI_WORLD_AVG_RETURN } from "./historical"

// Taille de chunk de la variante asynchrone : laisse le thread principal
// respirer entre deux tranches (même principe que runMonteCarloAsync).
const DECUM_CHUNK_SIZE = 150

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
    // Le décaissement est un Monte-Carlo : les rendements réels passés sont
    // TOUJOURS rééchantillonnés (taux défini inclus, comme l'onglet Monte
    // Carlo) — les krachs et les bull markets réels sont rejoués. La crise
    // synthétique est neutralisée : les krachs réels sont déjà dans les
    // rendements rejoués (règle identique à runSimulation).
    const historicalReturns = sampleHistoricalReturns(inputs, years, rng)
    const capitalPath: number[] = [roundCent(startingCapital)]
    let capital = startingCapital
    let monthlyWithdrawal = baseWithdrawal
    let ruinYear: number | null = null

    for (let month = 1; month <= years * 12; month += 1) {
      const yearIndex = Math.floor((month - 1) / 12)
      // Rendement réel de l'année rejouée, lissé au mois (comme runSimulation).
      // Repli défensif : moyenne de la série MSCI World si le tableau est vide
      // (le taux saisi a été supprimé — Option A).
      const marketReturn = monthlyRate(historicalReturns[yearIndex] ?? MSCI_WORLD_AVG_RETURN)
      const capitalAfterReturn = roundCent(capital * (1 + marketReturn))
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
