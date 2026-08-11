import type { SimulationInputs, MonteCarloResult } from "../types"
import { runSimulation } from "./simulation"
import { roundCent, clamp } from "./taxes"
import { average, buildTerminalHistogram, percentile, wilsonScoreCI } from "./math"
import { sanitizeInputs } from "./validation"
import { mulberry32 } from "./rng"
import { getHistoricalPool, sampleBlocks, BLOCK_LENGTH } from "./historical"
import { applyRegime, effectiveSampleSize, sampleRegime } from "./reliability"

const CHUNK_SIZE = 150

/**
 * Rééchantillonnage par blocs NON CHEVAUCHANTS : l'historique est découpé en
 * blocs de BLOCK_LENGTH années consécutives, puis des blocs entiers sont tirés
 * avec remise. Chaque bloc reste une fenêtre réelle et contiguë du passé, ce
 * qui préserve la séquence des krachs et des bull markets SANS jamais reboucler
 * la fin vers le début de la série (contrairement au modulo (start + i) % len).
 * Avec `extendedHistory`, le MSCI World rejoue 100 ans (S&P 500 1926-1969 +
 * MSCI World 1970-2025) : plus de blocs, plus de krachs et de bull markets.
 */
export function sampleHistoricalReturns(inputs: SimulationInputs, duration: number, rng: () => number): number[] {
  const pool = getHistoricalPool(inputs.historicalIndex, inputs.extendedHistory)
  // Repli défensif (dataset vide, ne devrait pas arriver pour le MSCI World) :
  // on boucle sur la moyenne de la série. Le taux saisi par l'utilisateur a été
  // supprimé (Option A) — la moyenne réelle de l'indice est la seule référence.
  if (pool.returns.length === 0) return Array.from({ length: duration }, () => pool.avgReturn)
  return sampleBlocks(pool.returns, duration, rng, BLOCK_LENGTH)
}

function runSinglePath(inputs: SimulationInputs, sim: number): { nominal: number[]; real: number[] } {
  const rng = mulberry32(inputs.seed * 2654435761 + sim * 7919 + 17)
  const duration = Math.max(1, inputs.duration)
  // Monte Carlo rejoue TOUJOURS les rendements réels passés : plus de mode de
  // rendement ni de crise synthétique (les krachs réels sont déjà dans les
  // rendements rejoués, les appliquer les compterait deux fois).
  const pool = getHistoricalPool(inputs.historicalIndex, inputs.extendedHistory)
  let annualReturns = sampleHistoricalReturns(inputs, duration, rng)
  // Incertitude des paramètres (Pástor–Stambaugh) : la moyenne et la volatilité
  // du vivier sont des ESTIMATIONS. Chaque scénario tire son propre régime
  // autour de ces estimations — la structure des blocs (krachs enchaînés) est
  // conservée, le niveau moyen et l'ampleur des écarts changent.
  if (inputs.parameterUncertainty) {
    const regime = sampleRegime(
      pool.avgReturn,
      pool.volatility,
      effectiveSampleSize(pool.returns.length, BLOCK_LENGTH),
      rng,
    )
    annualReturns = applyRegime(annualReturns, regime, pool.avgReturn, pool.volatility)
  }
  const simRows = runSimulation(inputs, annualReturns)
  // Deux échelles par scénario (paquet 1) : le NOMINAL net d'impôts (taxNet)
  // et sa valeur en EUROS D'AUJOURD'HUI — le net déflaté par l'inflation
  // réellement appliquée à CE scénario (row.real = nominal / inflationIndex,
  // donc taxNet × real / nominal = net en euros courants d'aujourd'hui).
  const nominal = simRows.map(row => row.taxNet)
  const real = simRows.map(row => (row.nominal > 0 ? roundCent((row.taxNet * row.real) / row.nominal) : 0))
  return { nominal, real }
}

/**
 * Calcule les bandes de percentiles et les statistiques terminales à partir
 * de toutes les trajectoires. Factorisé pour être réutilisé par le mode
 * synchrone et le mode asynchrone (chunké).
 */
function finalize(
  paths: number[][],
  pathsReal: number[][],
  terminalValues: number[],
  terminalValuesReal: number[],
  duration: number,
  goalTarget: number,
  simCount: number,
): MonteCarloResult {
  const years = Array.from({ length: duration + 1 }, (_, i) => i)
  const band = (pct: number, source: number[][]) =>
    years.map((_, year) => {
      const values = source.map(p => p[year] ?? p[p.length - 1] ?? 0).sort((a, b) => a - b)
      return roundCent(percentile(values, pct))
    })
  const sortedTerminal = [...terminalValues].sort((a, b) => a - b)
  const sortedTerminalReal = [...terminalValuesReal].sort((a, b) => a - b)
  const successCount = sortedTerminal.filter(v => v >= goalTarget).length
  // L'objectif est comparé à la valeur TERMINALE RÉELLE (déflatée) : la proba
  // que le pouvoir d'achat atteigne l'objectif, pas seulement le chiffre du
  // compte. Toujours ≤ successRate (l'inflation n'aide jamais).
  const successCountReal = sortedTerminalReal.filter(v => v >= goalTarget).length

  return {
    years,
    p5: band(0.05, paths),
    p10: band(0.1, paths),
    p25: band(0.25, paths),
    p50: band(0.5, paths),
    p75: band(0.75, paths),
    p90: band(0.9, paths),
    p95: band(0.95, paths),
    p10r: band(0.1, pathsReal),
    p50r: band(0.5, pathsReal),
    p90r: band(0.9, pathsReal),
    successRate: roundCent((successCount / simCount) * 100),
    successRateReal: roundCent((successCountReal / simCount) * 100),
    // Moyenne + intervalle de confiance du taux de succès : le « 84 % » n'est
    // pas un point exact — avec N simulations, il vaut mieux ±0,4 pt.
    mean: roundCent(average(terminalValues)),
    successRateCI: wilsonScoreCI(successCount, simCount),
    terminalDistribution: buildTerminalHistogram(terminalValues),
    bestCase: roundCent(sortedTerminal[sortedTerminal.length - 1] ?? 0),
    worstCase: roundCent(sortedTerminal[0] ?? 0),
    goalTarget,
    runs: simCount,
  }
}

export function runMonteCarlo(
  rawInputs: SimulationInputs,
  runs = rawInputs.mcRuns,
  goalTarget = rawInputs.goalTarget,
): MonteCarloResult {
  const inputs = sanitizeInputs(rawInputs)
  const simCount = Math.round(clamp(runs, 100, 10_000))
  const duration = Math.max(1, inputs.duration)
  const paths: number[][] = []
  const pathsReal: number[][] = []
  const terminalValues: number[] = []
  const terminalValuesReal: number[] = []

  for (let sim = 0; sim < simCount; sim += 1) {
    const path = runSinglePath(inputs, sim)
    paths.push(path.nominal)
    pathsReal.push(path.real)
    terminalValues.push(path.nominal[path.nominal.length - 1] ?? 0)
    terminalValuesReal.push(path.real[path.real.length - 1] ?? 0)
  }

  return finalize(paths, pathsReal, terminalValues, terminalValuesReal, duration, goalTarget, simCount)
}

/**
 * Variante asynchrone non bloquante : les simulations sont découpées en
 * chunks, le thread principal respire entre chaque chunk (les résultats
 * intermédiaires sont rendus via onProgress). Permet 10 000 scénarios sans
 * geler l'interface. Prend un signal d'annulation (AbortController).
 */
export async function runMonteCarloAsync(
  rawInputs: SimulationInputs,
  runs = rawInputs.mcRuns,
  goalTarget = rawInputs.goalTarget,
  onProgress?: (done: number, total: number) => void,
  signal?: AbortSignal,
): Promise<MonteCarloResult> {
  const inputs = sanitizeInputs(rawInputs)
  const simCount = Math.round(clamp(runs, 100, 10_000))
  const duration = Math.max(1, inputs.duration)
  const paths: number[][] = []
  const pathsReal: number[][] = []
  const terminalValues: number[] = []
  const terminalValuesReal: number[] = []

  const breathe = () => new Promise<void>(resolve => setTimeout(resolve, 0))

  for (let sim = 0; sim < simCount; sim += 1) {
    if (signal?.aborted) throw new DOMException("Monte-Carlo annulé", "AbortError")
    const path = runSinglePath(inputs, sim)
    paths.push(path.nominal)
    pathsReal.push(path.real)
    terminalValues.push(path.nominal[path.nominal.length - 1] ?? 0)
    terminalValuesReal.push(path.real[path.real.length - 1] ?? 0)
    if (sim % CHUNK_SIZE === 0) {
      onProgress?.(sim + 1, simCount)
      // Laisse le temps à l'interface de peindre entre deux chunks
      await breathe()
    }
  }

  onProgress?.(simCount, simCount)
  return finalize(paths, pathsReal, terminalValues, terminalValuesReal, duration, goalTarget, simCount)
}
