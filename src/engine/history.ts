import type { SimulationInputs } from "../types"

export type HistoryScenario = "A" | "B"

export interface HistoryEntry {
  patch: Partial<SimulationInputs>
  previous: Partial<SimulationInputs>
  scenario: HistoryScenario
}

export interface HistoryStack {
  past: HistoryEntry[]
  future: HistoryEntry[]
}

export const HISTORY_LIMIT = 20

export function createHistory(): HistoryStack {
  return { past: [], future: [] }
}

export function pushHistory(
  stack: HistoryStack,
  previousInputs: SimulationInputs,
  patch: Partial<SimulationInputs>,
  scenario: HistoryScenario,
): HistoryStack {
  const previous: Record<string, unknown> = {}
  for (const key of Object.keys(patch) as (keyof SimulationInputs)[]) {
    previous[key] = previousInputs[key]
  }
  return {
    past: [
      ...stack.past.slice(-(HISTORY_LIMIT - 1)),
      { patch: { ...patch }, previous: previous as Partial<SimulationInputs>, scenario },
    ],
    future: [],
  }
}

export function undoHistory(
  stack: HistoryStack,
): { stack: HistoryStack; patch: Partial<SimulationInputs>; scenario: HistoryScenario } | null {
  const entry = stack.past[stack.past.length - 1]
  if (!entry) return null
  return {
    stack: { past: stack.past.slice(0, -1), future: [entry, ...stack.future] },
    patch: entry.previous,
    scenario: entry.scenario,
  }
}

export function redoHistory(
  stack: HistoryStack,
): { stack: HistoryStack; patch: Partial<SimulationInputs>; scenario: HistoryScenario } | null {
  const entry = stack.future[0]
  if (!entry) return null
  return {
    stack: { past: [...stack.past, entry], future: stack.future.slice(1) },
    patch: entry.patch,
    scenario: entry.scenario,
  }
}
