import type { SimulationInputs, MonteCarloResult } from "../types"
import { runSimulation } from "./simulation"
import { roundCent, clamp } from "./taxes"
import { percentile } from "./math"
import { sanitizeInputs } from "./validation"
import { mulberry32 } from "./rng"
import { getHistoricalDataset } from "./historical"

const CHUNK_SIZE = 150

/**
 * Longueur d'un bloc pour le rééchantillonnage : 5 années consécutives
 * conservent la séquence krach → reprise sans jamais créer de transition
 * artificielle entre la fin et le début de l'historique (2025 → 1970).
 */
const BLOCK_LENGTH = 5

/**
 * Rééchantillonnage par blocs NON CHEVAUCHANTS : l'historique est découpé en
 * blocs de BLOCK_LENGTH années consécutives, puis des blocs entiers sont tirés
 * avec remise. Chaque bloc reste une fenêtre réelle et contiguë du passé, ce
 * qui préserve la séquence des krachs et des bull markets SANS jamais reboucler
 * la fin vers le début de la série (contrairement au modulo (start + i) % len).
 */
export function sampleHistoricalReturns(inputs: SimulationInputs, duration: number, rng: () => number): number[] {
  const dataset = getHistoricalDataset(inputs.historicalIndex)
  const returns = dataset.years.map(y => y.return)
  const len = returns.length
  // Repli défensif (dataset vide, ne devrait pas arriver pour le MSCI World) :
  // on boucle sur la moyenne de la série. Le taux saisi par l'utilisateur a été
  // supprimé (Option A) — la moyenne réelle de l'indice est la seule référence.
  if (len === 0) return Array.from({ length: duration }, () => dataset.avgReturn)

  const blocks: number[][] = []
  for (let start = 0; start < len; start += BLOCK_LENGTH) {
    blocks.push(returns.slice(start, start + BLOCK_LENGTH))
  }

  const out: number[] = []
  while (out.length < duration) {
    const block = blocks[Math.floor(rng() * blocks.length)] ?? returns
    for (const r of block) {
      if (out.length >= duration) break
      out.push(r)
    }
  }
  return out
}

function runSinglePath(inputs: SimulationInputs, sim: number): number[] {
  const rng = mulberry32(inputs.seed * 2654435761 + sim * 7919 + 17)
  const duration = Math.max(1, inputs.duration)
  // Monte Carlo rejoue TOUJOURS les rendements réels passés, quel que soit le
  // mode de rendement sélectionné (taux défini inclus) : c'est ce qui donne
  // une distribution crédible (les krachs et les bull markets réels sont
  // rejoués). La crise synthétique est désactivée — les krachs réels sont
  // déjà dans les rendements rejoués, l'appliquer reviendrait à les compter
  // deux fois.
  // Monte Carlo rejoue TOUJOURS les rendements réels passés : plus de mode de
  // rendement ni de crise synthétique (les krachs réels sont déjà dans les
  // rendements rejoués, les appliquer les compterait deux fois).
  const annualReturns = sampleHistoricalReturns(inputs, duration, rng)
  const simRows = runSimulation(inputs, annualReturns)
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
