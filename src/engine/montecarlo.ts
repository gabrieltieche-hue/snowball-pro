import type { SimulationInputs, MonteCarloResult } from "../types"
import { runSimulation } from "./simulation"
import { roundCent, clamp } from "./taxes"
import { percentile } from "./math"
import { sanitizeInputs } from "./validation"
import { mulberry32 } from "./rng"
import { getHistoricalDataset } from "./historical"

const CHUNK_SIZE = 150

/**
 * Rééchantillonnage par blocs : choisit un point de départ aléatoire puis
 * rejoue des années consécutives (avec rebouclage) issues des rendements
 * réels de l'indice. Préserve la séquence des krachs et des bull markets
 * au lieu d'inventer une loi gaussienne artificielle.
 */
function sampleHistoricalReturns(inputs: SimulationInputs, duration: number, rng: () => number): number[] {
  const dataset = getHistoricalDataset(inputs.historicalIndex)
  const returns = dataset.years.map(y => y.return)
  const len = returns.length
  const start = Math.floor(rng() * len)
  return Array.from({ length: duration }, (_, i) => returns[(start + i) % len] ?? inputs.annualReturn)
}

function runSinglePath(inputs: SimulationInputs, sim: number): number[] {
  const rng = mulberry32(inputs.seed * 2654435761 + sim * 7919 + 17)
  const duration = Math.max(1, inputs.duration)
  if (inputs.returnMode === "historical") {
    const annualReturns = sampleHistoricalReturns(inputs, duration, rng)
    const simRows = runSimulation({ ...inputs, returnMode: "historical" }, annualReturns)
    return simRows.map(row => row.taxNet)
  }
  const simRows = runSimulation({
    ...inputs,
    returnMode: "random",
    seed: inputs.seed + sim * 7919 + 17,
  })
  return simRows.map(row => row.taxNet)
}

/**
 * Calcule les bandes de percentiles et les statistiques terminales à partir
 * de toutes les trajectoires. Factorisé pour être réutilisé par le mode
 * synchrone et le mode asynchrone (chunké).
 */
function finalize(
  paths: number[][],
  terminalValues: number[],
  duration: number,
  goalTarget: number,
  simCount: number,
): MonteCarloResult {
  const years = Array.from({ length: duration + 1 }, (_, i) => i)
  const band = (pct: number) =>
    years.map((_, year) => {
      const values = paths.map(p => p[year] ?? p[p.length - 1] ?? 0).sort((a, b) => a - b)
      return roundCent(percentile(values, pct))
    })
  const sortedTerminal = [...terminalValues].sort((a, b) => a - b)
  const successRate = sortedTerminal.filter(v => v >= goalTarget).length / simCount

  return {
    years,
    p5: band(0.05),
    p10: band(0.1),
    p25: band(0.25),
    p50: band(0.5),
    p75: band(0.75),
    p90: band(0.9),
    p95: band(0.95),
    successRate: roundCent(successRate * 100),
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
  const terminalValues: number[] = []

  for (let sim = 0; sim < simCount; sim += 1) {
    const path = runSinglePath(inputs, sim)
    paths.push(path)
    terminalValues.push(path[path.length - 1] ?? 0)
  }

  return finalize(paths, terminalValues, duration, goalTarget, simCount)
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
  const terminalValues: number[] = []

  const breathe = () => new Promise<void>(resolve => setTimeout(resolve, 0))

  for (let sim = 0; sim < simCount; sim += 1) {
    if (signal?.aborted) throw new DOMException("Monte-Carlo annulé", "AbortError")
    const path = runSinglePath(inputs, sim)
    paths.push(path)
    terminalValues.push(path[path.length - 1] ?? 0)
    if (sim % CHUNK_SIZE === 0) {
      onProgress?.(sim + 1, simCount)
      // Laisse le temps à l'interface de peindre entre deux chunks
      await breathe()
    }
  }

  onProgress?.(simCount, simCount)
  return finalize(paths, terminalValues, duration, goalTarget, simCount)
}
