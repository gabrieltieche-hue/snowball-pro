import type { SimulationInputs, MonteCarloResult } from "../types"
import { runSimulation } from "./simulation"
import { roundCent, clamp } from "./taxes"
import { percentile } from "./math"
import { sanitizeInputs } from "./validation"

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
    const simRows = runSimulation({ ...inputs, returnMode: "random", seed: inputs.seed + sim * 7919 + 17 })
    const path = simRows.map(row => row.taxNet)
    paths.push(path)
    terminalValues.push(path[path.length - 1] ?? 0)
  }

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
